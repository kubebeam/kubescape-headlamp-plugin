/* 
  Kubescape definitions for resources with basic methods for querying. 
*/
import { ApiProxy, KubeObject } from '@kinvolk/headlamp-plugin/lib';
import { getAllowedNamespaces } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
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

export const openVulnerabilityExchangeContainerClass = makeCustomResourceClass({
  apiInfo: spdxGroupVersions,
  isNamespaced: true, // kubescape
  singularName: 'openvulnerabilityexchangecontainer',
  pluralName: 'openvulnerabilityexchangecontainers',
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

// List methods for spdx.softwarecomposition.kubescape.io not retrieve detailed info in the spec. We need to fetch each item individually.
export async function deepListQuery(type: string): Promise<any[]> {
  let namespaces: string[] = [];

  // method getAllowedNamespaces may not be released yet
  if (getAllowedNamespaces !== undefined) {
    namespaces = getAllowedNamespaces();
  }

  let items: any = [];

  // If we have namespaces set, make an API call for each namespace
  if (namespaces.length > 0) {
    // always include kubescape because some objects are saved in this namespace
    if (!namespaces.some(n => n === 'kubescape')) {
      namespaces.push('kubescape');
    }
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
    items.map((scan: KubeObject) =>
      ApiProxy.request(
        `/apis/${spdxGroup}/${spdxVersion}/namespaces/${scan.metadata.namespace}/${type}/${scan.metadata.name}`
      )
    )
  );

  return detailList;
}

export async function fetchVulnerabilityScanSummaries(namespace: string, manifestNames: string[]) {
  return Promise.all(
    manifestNames.map(name =>
      proxyRequest(name, namespace, spdxGroup, spdxVersion, 'vulnerabilitymanifestsummaries')
    )
  );
}

export function fetchWorkloadConfigurationScan(name: string, namespace: string): Promise<any> {
  return proxyRequest(name, namespace, spdxGroup, spdxVersion, 'workloadconfigurationscans');
}

export function proxyRequest(
  name: string,
  namespace: string,
  group: string,
  version: string,
  pluralName: string
): Promise<any> {
  const api = group ? '/apis/' : '/api';
  return ApiProxy.request(
    `${api}${group}/${version}/${namespace ? 'namespaces/' : ''}${namespace}/${pluralName}/${name}`
  );
}
