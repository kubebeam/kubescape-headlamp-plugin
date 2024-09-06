/* 
  Kubescape definitions for resources with basic methods for querying. 
*/
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

// List methods for spdx.softwarecomposition.kubescape.io not retrieve detailed info in the spec. We need to fetch each workloadconfigurationscan individually.
export async function deepListQuery(type) {
  const overviewList = await ApiProxy.request(
    `/apis/spdx.softwarecomposition.kubescape.io/v1beta1/${type}`
  );

  const detailList = await Promise.all(
    overviewList.items.map(scan =>
      ApiProxy.request(
        `/apis/spdx.softwarecomposition.kubescape.io/v1beta1/namespaces/${scan.metadata.namespace}/${type}/${scan.metadata.name}`
      )
    )
  );
  return detailList;
}

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
