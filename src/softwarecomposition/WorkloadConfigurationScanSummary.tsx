// https://github.com/kubescape/storage/tree/main/pkg/apis/softwarecomposition
// Only fields as used in this project are declared

import { Metadata } from './Metadata';

export namespace WorkloadConfigurationScanSummary {
  export interface Severities {
    critical: number;
    high: number;
    low: number;
    medium: number;
    unknown: number;
  }
}

export interface WorkloadConfigurationScanSummary {
  metadata: Metadata;
  spec: {
    controls: {}[];
    severities: WorkloadConfigurationScanSummary.Severities;
  };
}
