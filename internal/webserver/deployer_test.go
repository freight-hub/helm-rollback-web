package webserver

import (
	"context"
	"errors"
	"net/http"
	"testing"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	dynamicfake "k8s.io/client-go/dynamic/fake"
)

func component(name, namespace, releaseName, orbMode, deployer string) *unstructured.Unstructured {
	obj := &unstructured.Unstructured{}
	obj.SetAPIVersion("forto.com/v1alpha1")
	obj.SetKind("EnvironmentComponent")
	obj.SetName(name)
	obj.SetLabels(map[string]string{
		labelReleaseNamespace: namespace,
		labelReleaseName:      releaseName,
		labelOrbMode:          orbMode,
		labelDeployer:         deployer,
	})
	return obj
}

func fakeClient(objs ...runtime.Object) *dynamicfake.FakeDynamicClient {
	return dynamicfake.NewSimpleDynamicClientWithCustomListKinds(
		runtime.NewScheme(),
		map[schema.GroupVersionResource]string{environmentComponentGVR: "EnvironmentComponentList"},
		objs...,
	)
}

func TestLookupDeployer(t *testing.T) {
	cluster := fakeClient(
		component("macro-view", "macro-view", "macro-view", "main-deploy", "corehelm-operator"),
		component("booking", "booking-v1", "booking-core", "main-deploy", "circleci-helm-orb"),
		component("decision-billing", "decisions", "decision-billing", "main-deploy", "ode-operator"),
		// A temp deploy that shares the release labels must not be picked up.
		component("macro-view-pull-12", "macro-view", "macro-view", "temp-deploy", "circleci-helm-orb"),
	)

	tests := []struct {
		name, namespace, release string
		want                     DeployerInfo
	}{
		{"flux", "macro-view", "macro-view", DeployerInfo{DeployedBy: DeployedByFlux, Component: "macro-view"}},
		{"circleci, component named after the chart", "booking-v1", "booking-core", DeployerInfo{DeployedBy: DeployedByCircleCI, Component: "booking"}},
		{"other deployer", "decisions", "decision-billing", DeployerInfo{DeployedBy: DeployedByOther, Component: "decision-billing"}},
		{"no component record", "datadog", "datadog", DeployerInfo{DeployedBy: DeployedByNone}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := lookupDeployer(context.Background(), cluster, tt.namespace, tt.release)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tt.want {
				t.Fatalf("got %+v, want %+v", got, tt.want)
			}
		})
	}
}

func TestLookupDeployerErrors(t *testing.T) {
	t.Run("two main-deploy components for one release", func(t *testing.T) {
		cluster := fakeClient(
			component("a", "ns", "svc", "main-deploy", "corehelm-operator"),
			component("b", "ns", "svc", "main-deploy", "circleci-helm-orb"),
		)
		if _, err := lookupDeployer(context.Background(), cluster, "ns", "svc"); err == nil {
			t.Fatal("expected an error")
		}
	})
	t.Run("name that is not a valid label value", func(t *testing.T) {
		if _, err := lookupDeployer(context.Background(), fakeClient(), "ns", "svc,env.forto.com/deployer!=x"); err == nil {
			t.Fatal("expected an error")
		}
	})
}

func TestRollbackRefusal(t *testing.T) {
	tests := []struct {
		name       string
		info       DeployerInfo
		err        error
		wantRefuse bool
		wantStatus int
		wantMsg    string
	}{
		{
			name:       "flux release is refused with a link to its Cluster Nanny rollback page",
			info:       DeployerInfo{DeployedBy: DeployedByFlux, Component: "macro-view"},
			wantRefuse: true,
			wantStatus: http.StatusConflict,
			wantMsg:    "macro-view is deployed by Pipeline v2 (Flux). A rollback here would be undone by Flux within the hour. Roll it back in Cluster Nanny: https://cluster-nanny.forto.tools/environments/by-id/sandbox/components/by-name/macro-view/rollback",
		},
		{
			name:       "lookup failure is refused",
			err:        errors.New("api down"),
			wantRefuse: true,
			wantStatus: http.StatusServiceUnavailable,
			wantMsg:    "Could not check how macro-view is deployed, so the rollback was not run. Try again, or roll back in Cluster Nanny: https://cluster-nanny.forto.tools/environments/by-id/sandbox",
		},
		{name: "circleci release is allowed", info: DeployerInfo{DeployedBy: DeployedByCircleCI, Component: "macro-view"}},
		{name: "release without a component is allowed", info: DeployerInfo{DeployedBy: DeployedByNone}},
		{name: "other deployer is allowed", info: DeployerInfo{DeployedBy: DeployedByOther, Component: "macro-view"}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			refuse, status, msg := rollbackRefusal(tt.info, tt.err, "sandbox", "macro-view")
			if refuse != tt.wantRefuse || status != tt.wantStatus || msg != tt.wantMsg {
				t.Fatalf("got (%v, %d, %q), want (%v, %d, %q)", refuse, status, msg, tt.wantRefuse, tt.wantStatus, tt.wantMsg)
			}
		})
	}
}
