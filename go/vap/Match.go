package vap

import (
	"log"
	"strings"
)

func (evaluator *AdmissionPolicyEvaluator) CheckMatchConstraints() {

	if value, ok := evaluator.object["apiVersion"]; !ok || value == nil {
		return
	}
	if value, ok := evaluator.object["kind"]; !ok || value == nil {
		return
	}

	kind := evaluator.object["kind"].(string)
	apiVersion := evaluator.object["apiVersion"].(string)

	group := ""
	version := ""

	if strings.Index(apiVersion, "/") > 0 {
		group = strings.Split(apiVersion, "/")[0]
		version = strings.Split(apiVersion, "/")[1]
	} else {
		version = apiVersion
	}

	for _, resourceRule := range evaluator.policy.Spec.MatchConstraints.ResourceRules {
		if match(resourceRule, group, version, kind) {
			evaluator.Results.MatchConstraints = true
			return
		}
	}
}

func makePlural(kind string) string {

	if strings.HasSuffix(kind, "y") {
		r := []rune(kind)
		return string(r[:len(r)-1]) + "ies"
	}
	return kind + "s"
}

func match(resourceRule NamedRuleWithOperations, group string, version string, kind string) bool {
	groupOK := false
	versionOK := false
	resourceOK := false

	for _, apiGroup := range resourceRule.APIGroups {
		if apiGroup == group {
			groupOK = true
			break
		}
	}
	if !groupOK {
		log.Printf("Group %q NOT Matched", group)
		return false
	}

	for _, apiVersion := range resourceRule.APIVersions {
		if apiVersion == version {
			versionOK = true
			break
		}
	}
	if !versionOK {
		log.Printf("Version %q NOT Matched", version)
		return false
	}

	pluralKind := makePlural(kind)
	for _, resource := range resourceRule.Resources {
		if strings.EqualFold(resource, pluralKind) {
			resourceOK = true
			break
		}
	}
	if !resourceOK {
		log.Printf("Resource kind %q NOT Matched", pluralKind)
		return false
	}

	return groupOK && versionOK && resourceOK
}
