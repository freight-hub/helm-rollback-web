package webserver

import (
	"context"
	"fmt"
	"net/http"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

// DeployedBy says which pipeline deploys a Helm release, read from the
// release's EnvironmentComponent record in the cluster.
type DeployedBy string

const (
	// Pipeline v2: the Flux operator deploys it. A helm rollback is undone by
	// Flux on its next reconcile, so rollbacks must go through Cluster Nanny.
	DeployedByFlux DeployedBy = "flux"
	// The old CircleCI helm3-deploy orb deploys it.
	DeployedByCircleCI DeployedBy = "circleci"
	// A component record exists with some other deployer.
	DeployedByOther DeployedBy = "other"
	// No component record: the release is not deployed through Cluster Nanny.
	DeployedByNone DeployedBy = "none"
)

const (
	labelDeployer         = "env.forto.com/deployer"
	labelReleaseName      = "env.forto.com/release-name"
	labelReleaseNamespace = "env.forto.com/release-namespace"
)

const lookupTimeout = 5 * time.Second

var environmentComponentGVR = schema.GroupVersionResource{
	Group:    "forto.com",
	Version:  "v1alpha1",
	Resource: "environmentcomponents",
}

type DeployerInfo struct {
	DeployedBy DeployedBy `json:"deployedBy"`
	// The EnvironmentComponent name, empty when DeployedBy is "none".
	Component string `json:"component,omitempty"`
}

// lookupDeployer finds the EnvironmentComponent for a Helm release. Temp deploys
// are components too, with their own release name, so they are found the same way.
func lookupDeployer(ctx context.Context, client dynamic.Interface, namespace, releaseName string) (DeployerInfo, error) {
	// Well inside the server's 15s WriteTimeout, so a slow lookup ends in the
	// refusal path instead of starting helm after the client has given up.
	ctx, cancel := context.WithTimeout(ctx, lookupTimeout)
	defer cancel()

	selector, err := labels.ValidatedSelectorFromSet(labels.Set{
		labelReleaseNamespace: namespace,
		labelReleaseName:      releaseName,
	})
	if err != nil {
		return DeployerInfo{}, fmt.Errorf("invalid release %s/%s: %w", namespace, releaseName, err)
	}

	list, err := client.Resource(environmentComponentGVR).List(ctx, metav1.ListOptions{LabelSelector: selector.String()})
	if err != nil {
		return DeployerInfo{}, fmt.Errorf("listing components for %s/%s: %w", namespace, releaseName, err)
	}

	switch len(list.Items) {
	case 0:
		return DeployerInfo{DeployedBy: DeployedByNone}, nil
	case 1:
		item := list.Items[0]
		return DeployerInfo{DeployedBy: deployedByLabel(item.GetLabels()[labelDeployer]), Component: item.GetName()}, nil
	default:
		return DeployerInfo{}, fmt.Errorf("%d components found for %s/%s, expected at most one", len(list.Items), namespace, releaseName)
	}
}

func deployedByLabel(value string) DeployedBy {
	switch value {
	case "corehelm-operator":
		return DeployedByFlux
	case "circleci-helm-orb":
		return DeployedByCircleCI
	default:
		return DeployedByOther
	}
}

// rollbackRefusal decides whether a helm rollback may run. When it may not,
// it returns the HTTP status and the message shown to the user.
func rollbackRefusal(info DeployerInfo, lookupErr error, environment, releaseName string) (refuse bool, status int, message string) {
	if lookupErr != nil {
		return true, http.StatusServiceUnavailable, fmt.Sprintf(
			"Could not check how %s is deployed, so the rollback was not run. Try again, or roll back in Cluster Nanny: %s",
			releaseName, clusterNannyURL(environment))
	}
	if info.DeployedBy == DeployedByFlux {
		return true, http.StatusConflict, fmt.Sprintf(
			"%s is deployed by Pipeline v2 (Flux). A rollback here would be undone by Flux within the hour. Roll it back in Cluster Nanny: %s",
			releaseName, clusterNannyRollbackURL(environment, info.Component))
	}
	return false, 0, ""
}

const clusterNannyBase = "https://cluster-nanny.forto.tools"

func clusterNannyURL(environment string) string {
	if environment == "" {
		return clusterNannyBase
	}
	return fmt.Sprintf("%s/environments/by-id/%s", clusterNannyBase, environment)
}

func clusterNannyRollbackURL(environment, component string) string {
	if environment == "" || component == "" {
		return clusterNannyURL(environment)
	}
	return fmt.Sprintf("%s/environments/by-id/%s/components/by-name/%s/rollback", clusterNannyBase, environment, component)
}
