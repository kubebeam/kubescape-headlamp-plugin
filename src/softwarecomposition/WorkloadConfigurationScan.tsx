// https://github.com/kubescape/storage/tree/main/pkg/apis/softwarecomposition
// Only fields as used in this project are declared

import { Metadata } from './Metadata';

export interface WorkloadConfigurationScan {
  metadata: Metadata;
  spec: {
    controls: WorkloadConfigurationScan.Controls;
  };
}

export namespace WorkloadConfigurationScan {
  export interface Control {
    controlID: string;

    name: string;
    severity: {
      scoreFactor: number;
      severity: string;
    };
    status: {
      status: string;
    };
    rules: Rule[];
  }

  export interface Controls {
    [key: string]: Control;
  }

  export interface RulePath {
    fixPath: string;
    failedPath: string;
    fixPathValue: string;
  }

  export interface Rule {
    name: string;
    paths: RulePath[];
  }
}
