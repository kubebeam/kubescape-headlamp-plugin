/* 
  Query vulnerabilty data and rework data into VulnerabilityModel for easier processing in the views. 
*/

import { deepListQuery } from '../model';
import { VulnerabilityManifest } from '../softwarecomposition/VulnerabilityManifest';

// WorkloadScan is derived from VulnerabilityManifestSummary
export interface WorkloadScan {
  manifestName: string;
  name: string;
  kind: string;
  container: string;
  namespace: string;
  imageScan: ImageScan | undefined;
  relevant: ImageScan | undefined;
}

// ImageScan is derived from VulnerabilityManifest
export interface ImageScan {
  manifestName: string;
  imageName: string;
  creationTimestamp: string;
  matches: VulnerabilityManifest.Match[];
}

// Query vulnerabilitymanifestsummaries and vulnerabilitymanifests
// Convert the retrieved data to WorkloadScan and ImageScan
export async function fetchVulnerabilityManifests(): Promise<any> {
  const vulnerabilityManifestSummaries = await deepListQuery('vulnerabilitymanifestsummaries');
  const vulnerabilityManifests: VulnerabilityManifest[] = await deepListQuery(
    'vulnerabilitymanifests'
  );

  const imageScans = vulnerabilityManifests.map(v => {
    const imageScan: ImageScan = {
      manifestName: v.metadata.name,
      imageName: v.metadata.annotations['kubescape.io/image-tag'],
      creationTimestamp: v.metadata.creationTimestamp,
      matches: v.spec.payload.matches ?? [],
    };

    return imageScan;
  });

  return vulnerabilityManifestSummaries.map(summary => {
    // vulnerabilitiesRef.all field refers to the manifest
    const imageScanAll: ImageScan | undefined = imageScans.find(
      element => element.manifestName === summary.spec.vulnerabilitiesRef?.all?.name
    );

    const imageScanRelevant: ImageScan | undefined = imageScans.find(
      element => element.manifestName === summary.spec.vulnerabilitiesRef?.relevant?.name
    );

    const w: WorkloadScan = {
      manifestName: summary.metadata.name,
      name: summary.metadata.labels['kubescape.io/workload-name'],
      namespace: summary.metadata.labels['kubescape.io/workload-namespace'],
      container: summary.metadata.labels['kubescape.io/workload-container-name'],
      kind: summary.metadata.labels['kubescape.io/workload-kind'],
      imageScan: imageScanAll,
      relevant: imageScanRelevant,
    };

    return w;
  });
}
