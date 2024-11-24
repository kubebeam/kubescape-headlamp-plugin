// https://github.com/kubescape/storage/tree/main/pkg/apis/softwarecomposition
// Only fields as used in this project are declared

import { Metadata } from './Metadata';

export interface ApplicationProfile {
  metadata: Metadata;
  spec: {
    architectures: string[];
    containers: ApplicationProfile.Container[];
    initContainers: ApplicationProfile.Container[];
    ephemeralContainers: ApplicationProfile.Container[];
  };
}

export namespace ApplicationProfile {
  export interface Container {
    name: string;
    capabilities: string[];
    execs: ExecCalls[];
    opens: OpenCalls[];
    syscalls: string[];
    //SeccompProfile SingleSeccompProfile
    endpoints: HTTPEndpoint[];
    ImageID: string;
    ImageTag: string;
    PolicyByRuleId: PolicyByRules;
  }

  export interface PolicyByRules {
    [key: string]: RulePolicy;
  }

  export interface ExecCalls {
    path: string;
    args: string[];
    envs: string[];
  }

  export interface OpenCalls {
    path: string;
    flags: string[];
  }

  export interface HTTPEndpoint {
    endpoint: string;
    methods: string[];
    internal: boolean;
    direction: 'inbound' | 'outbound';
    //headers   json.RawMessage
  }

  export interface RulePolicy {
    allowedProcesses: string[];
    allowedContainer: boolean;
  }
}
