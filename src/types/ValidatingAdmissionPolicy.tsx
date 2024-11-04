import { Metadata } from './Metadata';

// GROUP:      admissionregistration.k8s.io
// KIND:       ValidatingAdmissionPolicy
// VERSION:    v1
// DESCRIPTION:
//     ValidatingAdmissionPolicy describes the definition of an admission
//     validation policy that accepts or rejects an object without changing it.

// See type definition in https://github.com/kubernetes/kubernetes/blob/master/pkg/apis/admissionregistration/types.go

export interface ValidatingAdmissionPolicy {
  metadata: Metadata;
  spec: {
    paramKind?: ValidatingAdmissionPolicy.ParamKind;
    matchConstraints: ValidatingAdmissionPolicy.MatchResources[];
    validations?: ValidatingAdmissionPolicy.Validation[];
    failurePolicy?: 'Fail' | 'Ignore';
    auditAnnotations?: ValidatingAdmissionPolicy.AuditAnnotation[];
    matchConditions?: ValidatingAdmissionPolicy.MatchCondition[];
    variables?: ValidatingAdmissionPolicy.Variable[];
  };

  status: {
    typeChecking: ValidatingAdmissionPolicy.TypeChecking;
  };
}

export namespace ValidatingAdmissionPolicy {
  export interface AuditAnnotation {
    key: string;
    valueExpression: string;
  }

  export interface MatchCondition {
    expression: string;
    name: string;
  }

  export interface Validation {
    expression: string;
    message?: string;
    messageExpression?: string;
    reason?: string;
  }

  export interface ParamKind {
    apiVersion: string;
    kind: string;
  }

  export interface Variable {
    expression: string;
    name: string;
  }

  export interface TypeChecking {
    expressionWarnings: ExpressionWarning[];
  }

  export interface ExpressionWarning {
    fieldRef: string;
    warning: string;
  }

  export interface MatchResources {
    // TODO
  }
}

// FIELDS:
//   spec	<ValidatingAdmissionPolicySpec>
//     matchConstraints	<MatchResources>
//       excludeResourceRules	<[]NamedRuleWithOperations>
//         apiGroups	<[]string>
//         apiVersions	<[]string>
//         operations	<[]string>
//         resourceNames	<[]string>
//         resources	<[]string>
//         scope	<string>
//       matchPolicy	<string>
//       enum: Equivalent, Exact
//       namespaceSelector	<LabelSelector>
//         matchExpressions	<[]LabelSelectorRequirement>
//           key	<string> -required-
//           operator	<string> -required-
//           values	<[]string>
//         matchLabels	<map[string]string>
//       objectSelector	<LabelSelector>
//         matchExpressions	<[]LabelSelectorRequirement>
//           key	<string> -required-
//           operator	<string> -required-
//           values	<[]string>
//         matchLabels	<map[string]string>
//       resourceRules	<[]NamedRuleWithOperations>
//         apiGroups	<[]string>
//         apiVersions	<[]string>
//         operations	<[]string>
//         resourceNames	<[]string>
//         resources	<[]string>
//         scope	<string>
