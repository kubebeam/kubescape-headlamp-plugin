/* 
  Kubescape definitions for resources with basic methods for querying. 
*/
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';

const apiGroupVersion = [{ group: 'spdx.softwarecomposition.kubescape.io', version: 'v1beta1' }];
const spdxGroupVersionString = apiGroupVersion[0].group + '/'+ apiGroupVersion[0].version

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

import { getAllowedNamespaces } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

// List methods for spdx.softwarecomposition.kubescape.io not retrieve detailed info in the spec. We need to fetch each workloadconfigurationscan individually.
export async function deepListQuery(type) {
  const namespaces = getAllowedNamespaces();
  let items: any = [];

  if (namespaces.length > 1) {
    // If we have namespaces set, make an API call for each namespace
    const listOfLists = await Promise.all(
      namespaces.map(namespace =>
        ApiProxy.request(
          `/apis/${spdxGroupVersionString}/namespaces/${namespace}/${type}`
        )
      )
    );

    for (const list of listOfLists) {
      items = items.concat(list.items);
    }
  } else {
    const overviewList = await ApiProxy.request(
      `/apis/${spdxGroupVersionString}/${type}`
    );

    items = overviewList.items;
  }

  const detailList = await Promise.all(
    items.map(scan =>
      ApiProxy.request(
        `/apis/${spdxGroupVersionString}/namespaces/${scan.metadata.namespace}/${type}/${scan.metadata.name}`
      )
    )
  );

  return detailList;
}
