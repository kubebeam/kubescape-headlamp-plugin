/* 
  Kubescape definitions for resources with basic methods for querying. 
*/
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';

const spdxGroup = 'spdx.softwarecomposition.kubescape.io';
const spdxVersion = 'v1beta1';
const spdxGroupVersions = [{ group: spdxGroup, version: spdxVersion }];

export const vulnerabilityManifestClass = makeCustomResourceClass({
  apiInfo: spdxGroupVersions,
  isNamespaced: true,
  singularName: 'vulnerabilitymanifest',
  pluralName: 'vulnerabilitymanifests',
});

export const vulnerabilityManifestSummaryClass = makeCustomResourceClass({
  apiInfo: spdxGroupVersions,
  isNamespaced: true,
  singularName: 'vulnerabilitymanifestsummary',
  pluralName: 'vulnerabilitymanifestsummaries',
});

export const vulnerabilitySummaryClass = makeCustomResourceClass({
  apiInfo: spdxGroupVersions,
  isNamespaced: false,
  singularName: 'vulnerabilitysummary',
  pluralName: 'vulnerabilitysummaries',
});

export const workloadConfigurationScanClass = makeCustomResourceClass({
  apiInfo: spdxGroupVersions,
  isNamespaced: true,
  singularName: 'workloadconfigurationscan',
  pluralName: 'workloadconfigurationscans',
});

export const workloadConfigurationScanSummaryClass = makeCustomResourceClass({
  apiInfo: spdxGroupVersions,
  isNamespaced: true,
  singularName: 'workloadconfigurationscansummary',
  pluralName: 'workloadconfigurationscansummaries',
});

export const configurationScanSummaries = makeCustomResourceClass({
  apiInfo: spdxGroupVersions,
  isNamespaced: false,
  singularName: 'configurationscansummary',
  pluralName: 'configurationscansummaries',
});

// TODO
// import { getAllowedNamespaces } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
function getAllowedNamespaces() {
  return [];
}

// List methods for spdx.softwarecomposition.kubescape.io not retrieve detailed info in the spec. We need to fetch each workloadconfigurationscan individually.
export async function deepListQuery(type) {
  const namespaces = getAllowedNamespaces();
  let items: any = [];

  if (namespaces.length > 1) {
    // If we have namespaces set, make an API call for each namespace
    const listOfLists = await Promise.all(
      namespaces.map(namespace =>
        ApiProxy.request(`/apis/${spdxGroup}/${spdxVersion}/namespaces/${namespace}/${type}`)
      )
    );

    for (const list of listOfLists) {
      items = items.concat(list.items);
    }
  } else {
    const overviewList = await ApiProxy.request(`/apis/${spdxGroup}/${spdxVersion}/${type}`);

    items = overviewList.items;
  }

  const detailList = await Promise.all(
    items.map(scan =>
      ApiProxy.request(
        `/apis/${spdxGroup}/${spdxVersion}/namespaces/${scan.metadata.namespace}/${type}/${scan.metadata.name}`
      )
    )
  );

  return detailList;
}
