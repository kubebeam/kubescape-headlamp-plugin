import {
  Link as HeadlampLink,
  Tabs as HeadlampTabs,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useEffect, useState } from 'react';
import makeSeverityLabel from '../common/SeverityLabel';
import { deepListQuery } from '../model';
import ImageListView from './ImageList';
import WorkloadScanListView from './ResourceList';

export interface WorkloadScan {
  manifestName: string;
  name: string;
  kind: string;
  container: string;
  namespace: string;
  imageScan: ImageScan;
  relevant: ImageScan;
}

export interface ImageScan {
  manifestName: string;
  imageName: string;
  creationTimestamp: string;
  vulnerabilities: Vulnerability[];
}
export interface Vulnerability {
  CVE: string;
  dataSource: string;
  severity: string;
  description: string;
  baseScore: number;
  artifact: {
    name: string;
    version: string;
  };
  fix: {
    state: string;
    versions: string[];
  };
}

interface VulnerabilityDetails {
  CVE: string;
  severity: string;
  baseScore: number;
  workloads: Set<string>;
  images: Set<string>;
  artifacts: Set<string>;
  fixed: boolean;
}

// workloadScans are cached in gloabl scope because it is an expensive query for the API server
export let workloadScans: WorkloadScan[] = null;

export default function KubescapeVulnerabilities() {
  const [, setState] = useState();

  useEffect(() => {
    if (workloadScans === null) {
      fetchVulnerabilityManifests().then(response => {
        workloadScans = response;

        setState({}); // Force component to re-render
      });
    }
  }, []);

  return (
    <>
      <h1>Vulnerabilities</h1>
      <HeadlampTabs
        tabs={[
          {
            label: 'CVEs',
            component: <CVEListView />,
          },
          {
            label: 'Resources',
            component: <WorkloadScanListView />,
          },
          {
            label: 'Images',
            component: <ImageListView />,
          },
        ]}
        ariaLabel="Navigation Tabs"
      />
    </>
  );
}

// Query vulnerabilitymanifestsummaries and vulnerabilitymanifests
// Convert the retrieved data to "WorkloadScan -> ImageScan > []Vulnerability"
export async function fetchVulnerabilityManifests(): Promise<any> {
  const vulnerabilityManifestSummaries = await deepListQuery('vulnerabilitymanifestsummaries');
  const vulnerabilityManifests = await deepListQuery('vulnerabilitymanifests');

  const workloadScans: WorkloadScan[] = [];
  const imageScans: ImageScan[] = [];

  for (const v of vulnerabilityManifests) {
    if (v?.spec?.payload?.matches) {
      const imageScan: ImageScan = {
        manifestName: v.metadata.name,
        imageName: v.metadata.annotations['kubescape.io/image-tag'],
        creationTimestamp: v.metadata.creationTimestamp,
        vulnerabilities: [],
      };

      // convert the Matches into Vulnerability, keep only the info we need
      if (v.spec.payload.matches) {
        for (const match of v.spec.payload.matches) {
          const v: Vulnerability = {
            CVE: match.vulnerability.id,
            dataSource: match.vulnerability.dataSource,
            description: match.vulnerability.description,
            severity: match.vulnerability.severity,
            baseScore: match.vulnerability.cvss ? match.vulnerability.cvss[0].metrics.baseScore : 0,
            fix: {
              state: match.vulnerability.fix.state,
              versions: match.vulnerability.fix.versions,
            },
            artifact: {
              name: match.artifact.name,
              version: match.artifact.version,
            },
          };

          imageScan.vulnerabilities.push(v);
        }
      }
      imageScans.push(imageScan);
    }
  }

  for (const summary of vulnerabilityManifestSummaries) {
    // vulnerabilitiesRef.all field refers to the manifest
    const imageScanAll: ImageScan = imageScans.find(
      element => element.manifestName === summary.spec.vulnerabilitiesRef?.all?.name
    );

    const imageScanRelevant: ImageScan = imageScans.find(
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

    workloadScans.push(w);
  }

  return workloadScans;
}

// flatten workloadScans into a list of VulnerabilityDetails with primary key CVE-ID
function getCVEList(workloadScans: WorkloadScan[]): VulnerabilityDetails[] {
  const vulnerabilityList: VulnerabilityDetails[] = [];

  for (const workloadScan of workloadScans) {
    if (workloadScan.imageScan) {
      for (const vulnerability of workloadScan.imageScan.vulnerabilities) {
        const v = vulnerabilityList.find(element => element.CVE === vulnerability.CVE);

        if (v) {
          v.workloads.add(workloadScan.name + '/' + workloadScan.container);
          v.images.add(workloadScan.imageScan.imageName);
          v.artifacts.add(vulnerability.artifact.name + ' ' + vulnerability.artifact.version);

          v.fixed = v.fixed || !!vulnerability.fix?.versions;
        } else {
          const newV: VulnerabilityDetails = {
            CVE: vulnerability.CVE,
            severity: vulnerability.severity,
            baseScore: vulnerability.baseScore,
            workloads: new Set<string>(),
            images: new Set<string>(),
            artifacts: new Set<string>(),
            fixed: !!vulnerability.fix?.versions,
          };

          newV.workloads.add(workloadScan.name + '/' + workloadScan.container);
          newV.images.add(workloadScan.imageScan.imageName);
          newV.artifacts.add(vulnerability.artifact.name + ' ' + vulnerability.artifact.version);

          vulnerabilityList.push(newV);
        }
      }
    }
  }

  // default sort on CVSS (baseScore)
  vulnerabilityList.sort((a, b) => {
    if (a.baseScore > b.baseScore) {
      return -1;
    }
    if (a.baseScore < b.baseScore) {
      return 1;
    }
    return 0;
  });

  return vulnerabilityList;
}

function CVEListView() {
  if (!workloadScans) {
    return <></>;
  }

  const cveList = getCVEList(workloadScans);
  return (
    <>
      <h5>
        {workloadScans.length} workload scans, {cveList.length} CVE issues
      </h5>
      <SectionBox>
        <Table
          data={cveList}
          columns={[
            {
              header: 'CVE ID',
              accessorFn: item => {
                return (
                  <HeadlampLink
                    routeName={`/kubescape/vulnerabilities/cves/:cve`}
                    params={{
                      cve: item.CVE,
                    }}
                  >
                    {item.CVE}
                  </HeadlampLink>
                );
              },
              gridTemplate: 'auto',
            },
            {
              header: 'Severity',
              accessorFn: (item: VulnerabilityDetails) => makeSeverityLabel(item.severity),
              gridTemplate: '0.2fr',
            },
            {
              header: 'CVSS',
              accessorFn: (item: VulnerabilityDetails) => item.baseScore,
              gridTemplate: 'min-content',
            },
            {
              header: 'Component',
              accessorFn: (item: VulnerabilityDetails) => Array.from(item.artifacts).join(' '),
              gridTemplate: '2fr',
            },
            {
              header: 'Fixed',
              accessorFn: (item: VulnerabilityDetails) => (item.fixed ? 'Yes' : ''),
              gridTemplate: '1fr',
            },
            {
              header: 'Images',
              accessorFn: (item: VulnerabilityDetails) => item.images.size,
              gridTemplate: 'min-content',
            },
            {
              header: 'Workloads',
              accessorFn: (item: VulnerabilityDetails) => item.workloads.size,
              gridTemplate: 'min-content',
            },
          ]}
        />
      </SectionBox>
    </>
  );
}
