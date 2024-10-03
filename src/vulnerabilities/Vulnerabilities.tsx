/* 
  Overview page for vulnerability issues, workloads and images. 
*/
import {
  Link as HeadlampLink,
  SectionBox,
  ShowHideLabel,
  Table as HeadlampTable,
  Tabs as HeadlampTabs,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { createRouteURL } from '@kinvolk/headlamp-plugin/lib/Router';
import { useEffect, useState } from 'react';
import { RotatingLines } from 'react-loader-spinner';
import makeSeverityLabel from '../common/SeverityLabel';
import { RoutingPath } from '../index';
import { deepListQuery, openVulnerabilityExchangeContainerClass } from '../model';
import { OpenVulnerabilityExchangeContainer } from '../softwarecomposition/OpenVulnerabilityExchangeContainer';
import { VulnerabilityManifest } from '../softwarecomposition/VulnerabilityManifest';
import ImageListView from './ImageList';
import WorkloadScanListView from './ResourceList';
import { VulnerabilityModel } from './view-types';

// workloadScans are cached in global scope because it is an expensive query for the API server
export let globalWorkloadScans: VulnerabilityModel.WorkloadScan[] | null = null;
export let globalOpenVulnerabilityExchangeContainers: OpenVulnerabilityExchangeContainer[] | null =
  null;
export let currentClusterURL = '';

export default function KubescapeVulnerabilities() {
  const [workloadScans, setWorkloadScans] = useState<VulnerabilityModel.WorkloadScan[]>(null);

  useEffect(() => {
    if (
      globalWorkloadScans === null ||
      currentClusterURL !== createRouteURL(RoutingPath.KubescapeVulnerabilities) // check if user switched to another cluster
    ) {
      fetchVulnerabilityManifests().then(response => {
        globalWorkloadScans = response;
        currentClusterURL = createRouteURL(RoutingPath.KubescapeVulnerabilities);
        setWorkloadScans(response);
      });
    } else {
      setWorkloadScans(globalWorkloadScans);
    }
  }, []);

  return (
    <>
      <h1>Vulnerabilities</h1>
      <HeadlampTabs
        tabs={[
          {
            label: 'CVEs',
            component: <CVEListView workloadScans={workloadScans} />,
          },
          {
            label: 'Resources',
            component: <WorkloadScanListView workloadScans={workloadScans} />,
          },
          {
            label: 'Images',
            component: <ImageListView workloadScans={workloadScans} />,
          },
        ]}
        ariaLabel="Navigation Tabs"
      />
    </>
  );
}

// Query vulnerabilitymanifestsummaries and vulnerabilitymanifests
// Convert the retrieved data to "[]WorkloadScan -> ImageScan > []Vulnerability"
export async function fetchVulnerabilityManifests(): Promise<any> {
  const vulnerabilityManifestSummaries = await deepListQuery('vulnerabilitymanifestsummaries');
  const vulnerabilityManifests: VulnerabilityManifest[] = await deepListQuery(
    'vulnerabilitymanifests'
  );

  const workloadScans: VulnerabilityModel.WorkloadScan[] = [];
  const imageScans: VulnerabilityModel.ImageScan[] = [];

  globalOpenVulnerabilityExchangeContainers = await deepListQuery(
    openVulnerabilityExchangeContainerClass.pluralName
  );

  for (const v of vulnerabilityManifests) {
    if (v.spec.payload?.matches) {
      const imageScan: VulnerabilityModel.ImageScan = {
        manifestName: v.metadata.name,
        imageName: v.metadata.annotations['kubescape.io/image-tag'],
        creationTimestamp: v.metadata.creationTimestamp,
        vulnerabilities: [],
      };

      // convert the Matches into Vulnerability, keep only the info we need
      for (const match of v.spec.payload.matches) {
        const v: VulnerabilityModel.Vulnerability = {
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

        // if we have no description, try get it from related
        if (!v.description && match.relatedVulnerabilities) {
          v.description = match.relatedVulnerabilities
            .filter(rv => rv.id === v.CVE)
            .map(rv => rv.description)
            .join();
        }
        imageScan.vulnerabilities.push(v);
      }

      imageScans.push(imageScan);
    }
  }

  for (const summary of vulnerabilityManifestSummaries) {
    // vulnerabilitiesRef.all field refers to the manifest
    const imageScanAll: VulnerabilityModel.ImageScan | undefined = imageScans.find(
      element => element.manifestName === summary.spec.vulnerabilitiesRef?.all?.name
    );

    const imageScanRelevant: VulnerabilityModel.ImageScan | undefined = imageScans.find(
      element => element.manifestName === summary.spec.vulnerabilitiesRef?.relevant?.name
    );

    const w: VulnerabilityModel.WorkloadScan = {
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
function getCVEList(
  workloadScans: VulnerabilityModel.WorkloadScan[]
): VulnerabilityModel.VulnerabilityWithReferences[] {
  const vulnerabilityList: VulnerabilityModel.VulnerabilityWithReferences[] = [];

  for (const workloadScan of workloadScans) {
    if (workloadScan.imageScan) {
      for (const vulnerability of workloadScan.imageScan.vulnerabilities) {
        const v = vulnerabilityList.find(element => element.CVE === vulnerability.CVE);

        const isRelevant = workloadScan.relevant?.vulnerabilities.some(
          v => v.CVE === vulnerability.CVE
        );

        if (v) {
          v.workloads.add(workloadScan.name + '/' + workloadScan.container);
          v.images.add(workloadScan.imageScan.imageName);
          v.artifacts.add(vulnerability.artifact.name + ' ' + vulnerability.artifact.version);

          v.fixed = v.fixed || !!vulnerability.fix?.versions;
          v.relevant = v.relevant || isRelevant === true;
        } else {
          const newV: VulnerabilityModel.VulnerabilityWithReferences = {
            CVE: vulnerability.CVE,
            description: vulnerability.description,
            severity: vulnerability.severity,
            baseScore: vulnerability.baseScore,
            workloads: new Set<string>(),
            images: new Set<string>(),
            artifacts: new Set<string>(),
            fixed: !!vulnerability.fix?.versions,
            relevant: isRelevant === true,
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

function CVEListView(props: { workloadScans: VulnerabilityModel.WorkloadScan[] }) {
  const { workloadScans } = props;
  if (!workloadScans) {
    return <RotatingLines />;
  }

  const cveList = getCVEList(workloadScans);

  return (
    <>
      <h5>
        {workloadScans.length} workload scans, {cveList.length} CVE issues
      </h5>
      <SectionBox>
        <HeadlampTable
          data={cveList}
          columns={[
            {
              header: 'Severity',
              accessorFn: (item: VulnerabilityModel.VulnerabilityWithReferences) => item.severity,
              Cell: ({ cell }: any) => makeSeverityLabel(cell.row.original.severity),
              gridTemplate: '0.2fr',
            },
            {
              header: 'CVE ID',
              accessorFn: (item: VulnerabilityModel.VulnerabilityWithReferences) => item.CVE,
              Cell: ({ cell }: any) => (
                <HeadlampLink
                  routeName={RoutingPath.KubescapeCVEResults}
                  params={{
                    cve: cell.getValue(),
                  }}
                >
                  {cell.getValue()}
                </HeadlampLink>
              ),
              gridTemplate: 'auto',
            },
            {
              header: 'CVSS',
              accessorFn: (item: VulnerabilityModel.VulnerabilityWithReferences) => item.baseScore,
              gridTemplate: 'min-content',
            },
            {
              header: 'Component',
              accessorFn: (item: VulnerabilityModel.VulnerabilityWithReferences) => (
                <div style={{ whiteSpace: 'pre-line' }}>
                  {Array.from(item.artifacts).join('\n')}
                </div>
              ),
              gridTemplate: 'auto',
            },
            {
              header: 'Relevant',
              accessorFn: (item: VulnerabilityModel.VulnerabilityWithReferences) =>
                item.relevant ? 'Yes' : '',
              gridTemplate: '1fr',
            },
            {
              header: 'Fixed',
              accessorFn: (item: VulnerabilityModel.VulnerabilityWithReferences) =>
                item.fixed ? 'Yes' : '',
              gridTemplate: '1fr',
            },
            {
              header: 'Images',
              accessorFn: (item: VulnerabilityModel.VulnerabilityWithReferences) =>
                item.images.size,
              gridTemplate: 'min-content',
            },
            {
              header: 'Workloads',
              accessorFn: (item: VulnerabilityModel.VulnerabilityWithReferences) =>
                item.workloads.size,
              gridTemplate: 'min-content',
            },
            {
              header: 'Description',
              accessorKey: 'description',
              Cell: ({ cell }: any) => <ShowHideLabel>{cell.getValue()}</ShowHideLabel>,
              gridTemplate: 'auto',
            },
          ]}
        />
      </SectionBox>
    </>
  );
}
