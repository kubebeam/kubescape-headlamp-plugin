/* 
  Query vulnerabilty data and rework data into VulnerabilityModel for easier processing in the views. 
*/

import {
  fetchObject,
  vulnerabilityManifestClass,
  vulnerabilityManifestSummaryClass,
} from '../model';
import { VulnerabilityManifest } from '../softwarecomposition/VulnerabilityManifest';
import { VulnerabilityManifestSummary } from '../softwarecomposition/VulnerabilityManifestSummary';

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
  namespace: string;
  imageName: string;
  creationTimestamp: string;
  matches: VulnerabilityManifest.Match[];
}

async function fetchImageScan(name: string): Promise<ImageScan | undefined> {
  try {
    const v = await fetchObject(name, 'kubescape', vulnerabilityManifestClass);

    const imageScan: ImageScan = {
      manifestName: v.metadata.name,
      namespace: v.metadata.namespace,
      imageName: v.metadata.annotations['kubescape.io/image-tag'],
      creationTimestamp: v.metadata.creationTimestamp,
      matches: v.spec.payload.matches ?? [],
    };
    return imageScan;
  } catch (e) {
    console.log('Missing manifest ' + name);
    return Promise.resolve(undefined);
  }
}

// Query vulnerabilitymanifestsummaries and vulnerabilitymanifests
// Convert the retrieved data to WorkloadScan and ImageScan
export async function fetchVulnerabilityManifests(
  summaries: VulnerabilityManifestSummary[]
): Promise<any> {
  return await Promise.all(
    summaries.map(async (summary: VulnerabilityManifestSummary) => {
      const detailedSummary = await fetchObject(
        summary.metadata.name,
        summary.metadata.namespace,
        vulnerabilityManifestSummaryClass
      );
      const w: WorkloadScan = {
        manifestName: detailedSummary.metadata.name,
        name: detailedSummary.metadata.labels['kubescape.io/workload-name'],
        namespace: detailedSummary.metadata.labels['kubescape.io/workload-namespace'],
        container: detailedSummary.metadata.labels['kubescape.io/workload-container-name'],
        kind: detailedSummary.metadata.labels['kubescape.io/workload-kind'],
        imageScan: undefined,
        relevant: undefined,
      };
      if (detailedSummary.spec.vulnerabilitiesRef?.all?.name) {
        w.imageScan = await fetchImageScan(detailedSummary.spec.vulnerabilitiesRef.all.name);
      }
      if (detailedSummary.spec.vulnerabilitiesRef?.relevant?.name) {
        w.relevant = await fetchImageScan(detailedSummary.spec.vulnerabilitiesRef.relevant.name);
      }

      return w;
    })
  );
}
