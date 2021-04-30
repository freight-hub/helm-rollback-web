package webserver

import (
	"context"
	"os"
	"strings"

	"github.com/coreos/go-oidc/v3/oidc"
	cloudidentity "google.golang.org/api/cloudidentity/v1"
)

func confirmUserAuthorized(ctx context.Context, user *oidc.UserInfo) (ok bool, err error) {

	// I'm not sure there's any case this won't be desired... as long as it's in claims_supported
	if !user.EmailVerified {
		return false, nil
	}

	// Google Group membership (in at least one listed group)
	// The proper API for this (CheckTransitiveMembership) is paywalled behind G Suite Enterprise
	// so we do a less exhaustive check here.
	groupPasslist := os.Getenv("HELM_ROLLBACK_WEB_GOOGLE_GROUP_PASSLIST")
	if groupPasslist != "" {
		cloudidentityService, err := cloudidentity.NewService(ctx)
		if err != nil {
			return false, err
		}

		groupList := strings.Split(groupPasslist, ",")
		for _, groupName := range groupList {
			groupInfo, err := cloudidentityService.Groups.Lookup().GroupKeyId(groupName).Context(ctx).Do()
			if err != nil {
				return false, err
			}

			membership, err := cloudidentityService.Groups.Memberships.List(groupInfo.Name).Context(ctx).Do()
			if err != nil {
				return false, err
			}

			// TODO: does not follow pagination; will become problematic at 200 members
			for _, member := range membership.Memberships {
				if member.PreferredMemberKey.Id == user.Email {
					return true, nil
				}
			}
		}
		return false, nil
	}

	return true, nil
}
