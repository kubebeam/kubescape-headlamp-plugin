import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';

const apiGroupVersion = [{ group: 'spdx.softwarecomposition.kubescape.io', version: 'v1beta1' }];

export const vulnerabilityManifestClass = makeCustomResourceClass({
  apiInfo: apiGroupVersion,
  isNamespaced: true,
  singularName: 'vulnerabilitymanifest',
  pluralName: 'vulnerabilitymanifests',
});

export const vulnerabilityManifestSummaryClass = makeCustomResourceClass({
  apiInfo: apiGroupVersion,
  isNamespaced: true,
  singularName: 'vulnerabilitymanifestsummary',
  pluralName: 'vulnerabilitymanifestsummaries',
});

export const vulnerabilitySummaryClass = makeCustomResourceClass({
  apiInfo: apiGroupVersion,
  isNamespaced: false,
  singularName: 'vulnerabilitysummary',
  pluralName: 'vulnerabilitysummaries',
});

export const workloadConfigurationScanClass = makeCustomResourceClass({
  apiInfo: apiGroupVersion,
  isNamespaced: true,
  singularName: 'workloadconfigurationscan',
  pluralName: 'workloadconfigurationscans',
});

export const workloadConfigurationScanSummaryClass = makeCustomResourceClass({
  apiInfo: apiGroupVersion,
  isNamespaced: true,
  singularName: 'workloadconfigurationscansummary',
  pluralName: 'workloadconfigurationscansummaries',
});

export const configurationScanSummaries = makeCustomResourceClass({
  apiInfo: apiGroupVersion,
  isNamespaced: false,
  singularName: 'configurationscansummary',
  pluralName: 'configurationscansummaries',
});

// configurationscansummaries will not be retrieved with a UID, so we cannot use useApiList()
export function getAllConfigurationScanSummaries(): Promise<any> {
  return ApiProxy.request(
    `/apis/spdx.softwarecomposition.kubescape.io/v1beta1/configurationscansummaries`
  );
}

// vulnerabilitysummaries will not be retrieved with a UID, so we cannot use useApiList()
export function getAllVulnerabilitySummaries(): Promise<any> {
  return ApiProxy.request(
    `/apis/spdx.softwarecomposition.kubescape.io/v1beta1/vulnerabilitysummaries`
  );
}

// List of workloadconfigurationscans does not retrieve detailed info in the spec. We need to fetch each workloadconfigurationscan individually.
export async function fetchWorkloadConfigurationScan(): Promise<any> {
  const scanList = await ApiProxy.request(
    `/apis/spdx.softwarecomposition.kubescape.io/v1beta1/workloadconfigurationscansummaries`
  );
  const workloadScanData = await Promise.all(
    scanList.items.map(scan =>
      ApiProxy.request(
        `/apis/spdx.softwarecomposition.kubescape.io/v1beta1/namespaces/${scan.metadata.namespace}/workloadconfigurationscansummaries/${scan.metadata.name}`
      )
    )
  );

  return workloadScanData;
}
