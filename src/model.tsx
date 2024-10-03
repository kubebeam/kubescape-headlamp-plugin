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

export const configurationScanSummariesClass = makeCustomResourceClass({
  apiInfo: spdxGroupVersions,
  isNamespaced: false,
  singularName: 'configurationscansummary',
  pluralName: 'configurationscansummaries',
});

export const generatedNetworkPolicyClass = makeCustomResourceClass({
  apiInfo: spdxGroupVersions,
  isNamespaced: true,
  singularName: 'generatednetworkpolicy',
  pluralName: 'generatednetworkpolicies',
});

export const networkNeighborhoodsClass = makeCustomResourceClass({
  apiInfo: spdxGroupVersions,
  isNamespaced: true,
  singularName: 'networkneighborhood',
  pluralName: 'networkneighborhoods',
});

export const sbomSyftClass = makeCustomResourceClass({
  apiInfo: spdxGroupVersions,
  isNamespaced: true,
  singularName: 'sbomsyft',
  pluralName: 'sbomsyfts',
});

export const sbomSyftFilteredClass = makeCustomResourceClass({
  apiInfo: spdxGroupVersions,
  isNamespaced: true,
  singularName: 'sbomsyftfiltered',
  pluralName: 'sbomsyftfiltereds',
});

// List methods for spdx.softwarecomposition.kubescape.io do not retrieve info in the spec.
// As a workaround, deepListQuery() will fetch each item individually.
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
    const listOfLists: any[] = await Promise.all(
      namespaces.map(namespace =>
        ApiProxy.request(`/apis/${spdxGroup}/${spdxVersion}/namespaces/${namespace}/${type}`)
      )
    );

    items = listOfLists.flatMap(list => list.items);
  } else {
    const overviewList = await ApiProxy.request(`/apis/${spdxGroup}/${spdxVersion}/${type}`);

    items = overviewList.items;
  }

  const detailList = await Promise.all(
    items.map((scan: KubeObject) => {
      const namespaceCondition = scan.metadata.namespace
        ? `/namespaces/${scan.metadata.namespace}`
        : '';
      return ApiProxy.request(
        `/apis/${spdxGroup}/${spdxVersion}${namespaceCondition}/${type}/${scan.metadata.name}`
      );
    })
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

export function listQuery(group: string, version: string, pluralName: string): Promise<any> {
  return ApiProxy.request(`/apis/${group}/${version}/${pluralName}`);
}
