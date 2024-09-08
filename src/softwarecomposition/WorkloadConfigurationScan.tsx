// https://github.com/kubescape/storage/tree/main/pkg/apis/softwarecomposition
// Only fields as used in this project are declared

import { Metadata } from './Metadata';

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
  }

  export interface Controls {
    [key: string]: Control;
  }
}

export interface WorkloadConfigurationScan {
  metadata: Metadata;
  spec: {
    controls: WorkloadConfigurationScan.Controls;
  };
}
