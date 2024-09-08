// https://github.com/kubescape/storage/tree/main/pkg/apis/softwarecomposition
// Only fields as used in this project are declared

import { Metadata } from './Metadata';

export namespace ConfigurationScanSummary {
  export interface Severities {
    critical: number;
    high: number;
    low: number;
    medium: number;
    unknown: number;
  }

  export interface SummaryRef {
    kind: string;
    name: string;
    namespace: string;
  }
}

export interface ConfigurationScanSummary {
  metadata: Metadata;
  spec: {
    severities: ConfigurationScanSummary.Severities;
    summaryRef: ConfigurationScanSummary.SummaryRef[];
  };
}
