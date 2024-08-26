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

export const workloadConfigurationScanClass = makeCustomResourceClass({
  apiInfo: apiGroupVersion,
  isNamespaced: true,
  singularName: 'workloadconfigurationscan',
  pluralName: 'workloadconfigurationscans',
});

// configurationscansummaries are not retrieved with a UID, so we cannot use useApiList()
export function getAllConfigurationScanSummaries(): Promise<any> {
  return ApiProxy.request(
    `/apis/spdx.softwarecomposition.kubescape.io/v1beta1/configurationscansummaries`
  );
}

// vulnerabilitysummaries are not retrieved with a UID, so we cannot use useApiList()
export function getAllVulnerabilitySummaries(): Promise<any> {
  return ApiProxy.request(
    `/apis/spdx.softwarecomposition.kubescape.io/v1beta1/vulnerabilitysummaries`
  );
}

// List of workloadconfigurationscans does not retrieve detailed info in the spec. We need to fetch each workloadconfigurationscan individually.
export async function fetchWorkloadConfigurationScan() {
  function getAllWorkloadConfigurationScans(): Promise<any> {
    return ApiProxy.request(
      `/apis/spdx.softwarecomposition.kubescape.io/v1beta1/workloadconfigurationscans`
    );
  }

  function getWorkloadConfigurationScan(name, namespace): Promise<any> {
    return ApiProxy.request(
      `/apis/spdx.softwarecomposition.kubescape.io/v1beta1/namespaces/${namespace}/workloadconfigurationscans/${name}`
    );
  }

  const scanList = await getAllWorkloadConfigurationScans();
  const workloadScanData = await Promise.all(
    scanList.items.map(scan =>
      getWorkloadConfigurationScan(scan.metadata.name, scan.metadata.namespace)
    )
  );

  return workloadScanData;
}
