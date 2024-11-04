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
    validations?: ValidatingAdmissionPolicy.Validation[];
    failurePolicy?: 'Fail' | 'Ignore';
    auditAnnotations?: ValidatingAdmissionPolicy.AuditAnnotation[];
    matchConditions?: ValidatingAdmissionPolicy.MatchCondition[];
    variables?: ValidatingAdmissionPolicy.Variable[];
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
}
