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
import { getAllowedNamespaces } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { createRouteURL } from '@kinvolk/headlamp-plugin/lib/Router';
import { Box, Button, FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { RotatingLines } from 'react-loader-spinner';
import { VulnerabilityManifestSummary } from 'src/softwarecomposition/VulnerabilityManifestSummary';
import makeSeverityLabel from '../common/SeverityLabel';
import { RoutingPath } from '../index';
import { fetchVulnerabilityManifestSummaries } from '../model';
import { fetchVulnerabilityManifests, WorkloadScan } from './fetch-vulnerabilities';
import ImageListView from './ImageList';
import WorkloadScanListView from './ResourceList';

interface CVEScan {
  CVE: string;
  description: string;
  severity: string;
  baseScore: number;
  workloads: Set<string>;
  images: Set<string>;
  artifacts: Set<string>;
  fixed: boolean;
  relevant: boolean | undefined;
}

// workloadScans are cached in global scope because it is an expensive query for the API server
export let globalWorkloadScans: WorkloadScan[] | null = null;
let currentClusterURL = '';
let summaries: VulnerabilityManifestSummary[] = [];
let indexSummary = 0;
const summaryFetchItems = 20;
let allowedNamespaces: string[] = [];

export default function KubescapeVulnerabilities() {
  const [workloadScans, setWorkloadScans] = useState<WorkloadScan[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const arraysEqual = (a: string[], b: string[]) =>
    a.length === b.length && a.every((element, index) => element === b[index]);

  useEffect(() => {
    if (
      globalWorkloadScans === null ||
      currentClusterURL !== createRouteURL(RoutingPath.KubescapeVulnerabilities) || // check if user switched to another cluster
      !arraysEqual(getAllowedNamespaces(), allowedNamespaces) // check if user changed namespace selection
    ) {
      const fetchData = async () => {
        summaries = await fetchVulnerabilityManifestSummaries();
        currentClusterURL = createRouteURL(RoutingPath.KubescapeVulnerabilities);
        allowedNamespaces = getAllowedNamespaces();

        indexSummary = summaryFetchItems > summaries.length ? summaries.length : summaryFetchItems;

        fetchVulnerabilityManifests(summaries.slice(0, indexSummary)).then(response => {
          globalWorkloadScans = response;

          setWorkloadScans(globalWorkloadScans);
          setLoading(false);
        });
      };

      fetchData().catch(console.error);
    } else {
      setWorkloadScans(globalWorkloadScans);
    }
  }, []);

  return (
    <>
      <h1>Vulnerabilities</h1>
      <Stack direction="row" spacing={2}>
        <Typography variant="body1" component="div" sx={{ flexGrow: 1 }}>
          Reading {indexSummary} of {summaries.length} scans
        </Typography>
        <MoreButton setLoading={setLoading} setWorkloadScans={setWorkloadScans} title="Read more" />
        <MoreButton
          setLoading={setLoading}
          setWorkloadScans={setWorkloadScans}
          title="All"
          readToEnd
        />
      </Stack>
      <HeadlampTabs
        tabs={[
          {
            label: 'CVEs',
            component: <CVEListView loading={loading} workloadScans={workloadScans} />,
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

function CVEListView(props: { loading: boolean; workloadScans: WorkloadScan[] | null }) {
  const { loading, workloadScans } = props;
  const [isRelevantCVESwitchChecked, setIsRelevantCVESwitchChecked] = useState(false);
  const [isFixedCVESwitchChecked, setIsFixedCVESwitchChecked] = useState(false);

  if (loading || !workloadScans)
    return (
      <Box sx={{ padding: 2 }}>
        <RotatingLines />
      </Box>
    );

  const cveList = getCVEList(workloadScans);

  let cveListFiltered = cveList;
  if (isRelevantCVESwitchChecked)
    cveListFiltered = cveListFiltered.filter(cve => cve.relevant === undefined || cve.relevant);
  if (isFixedCVESwitchChecked) cveListFiltered = cveListFiltered.filter(cve => cve.fixed);

  return (
    <>
      <h5>
        {workloadScans.length} workload scans, {cveListFiltered.length} CVE issues
      </h5>
      <FormControlLabel
        checked={isRelevantCVESwitchChecked}
        control={<Switch color="primary" />}
        label={'Relevant'}
        onChange={(event: any, checked: boolean) => {
          setIsRelevantCVESwitchChecked(checked);
        }}
      />
      <FormControlLabel
        checked={isFixedCVESwitchChecked}
        control={<Switch color="primary" />}
        label={'Fixed'}
        onChange={(event: any, checked: boolean) => {
          setIsFixedCVESwitchChecked(checked);
        }}
      />
      <SectionBox>
        <HeadlampTable
          data={cveListFiltered}
          columns={[
            {
              header: 'Severity',
              accessorFn: (item: CVEScan) => item.severity,
              Cell: ({ cell }: any) => makeSeverityLabel(cell.row.original.severity),
              gridTemplate: '0.2fr',
            },
            {
              header: 'CVE ID',
              accessorFn: (item: CVEScan) => item.CVE,
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
              id: 'Score',
              header: 'CVSS',
              accessorFn: (item: CVEScan) => item.baseScore,
              gridTemplate: 'min-content',
            },
            {
              header: 'Component',
              accessorFn: (item: CVEScan) => (
                <div style={{ whiteSpace: 'pre-line' }}>
                  {Array.from(item.artifacts).join('\n')}
                </div>
              ),
              gridTemplate: 'auto',
            },
            {
              header: 'Relevant',
              accessorFn: (item: CVEScan) =>
                item.relevant === undefined ? 'Unknown' : item.relevant ? 'Yes' : 'No',
              gridTemplate: '1fr',
            },
            {
              header: 'Fixed',
              accessorFn: (item: CVEScan) => (item.fixed ? 'Yes' : ''),
              gridTemplate: '1fr',
            },
            {
              header: 'Images',
              accessorFn: (item: CVEScan) => item.images.size,
              gridTemplate: 'min-content',
            },
            {
              header: 'Workloads',
              accessorFn: (item: CVEScan) => item.workloads.size,
              gridTemplate: 'min-content',
            },
            {
              header: 'Description',
              accessorKey: 'description',
              Cell: ({ cell }: any) => <ShowHideLabel>{cell.getValue()}</ShowHideLabel>,
              gridTemplate: 'auto',
            },
          ]}
          initialState={{
            sorting: [
              {
                id: 'Score',
                desc: true,
              },
            ],
          }}
        />
      </SectionBox>
    </>
  );
}

// create a list of CVE-ID with affected workloads and images
function getCVEList(workloadScans: WorkloadScan[]): CVEScan[] {
  const vulnerabilityList: CVEScan[] = [];

  for (const workloadScan of workloadScans) {
    if (workloadScan.imageScan?.matches) {
      for (const match of workloadScan.imageScan.matches) {
        const cve = vulnerabilityList.find(element => element.CVE === match.vulnerability.id);

        const isRelevant = workloadScan.relevant?.matches?.some(
          match => match.vulnerability.id === cve?.CVE
        );

        if (cve) {
          cve.workloads.add(workloadScan.name + '/' + workloadScan.container);
          cve.images.add(workloadScan.imageScan.imageName);
          cve.artifacts.add(match.artifact.name + ' ' + match.artifact.version);

          cve.fixed = cve.fixed || !!match.vulnerability.fix?.versions;
          cve.relevant = cve.relevant || isRelevant;
        } else {
          const newCve: CVEScan = {
            CVE: match.vulnerability.id,
            description: match.vulnerability.description,
            severity: match.vulnerability.severity,
            baseScore: match.vulnerability.cvss ? match.vulnerability.cvss[0].metrics.baseScore : 0,
            workloads: new Set<string>(),
            images: new Set<string>(),
            artifacts: new Set<string>(),
            fixed: !!match.vulnerability.fix?.versions,
            relevant: isRelevant,
          };

          // if vulnerability has no description, try get it from related
          if (!newCve.description && match.relatedVulnerabilities) {
            newCve.description = match.relatedVulnerabilities
              .filter(rv => rv.id === newCve.CVE)
              .map(rv => rv.description)
              .join();
          }

          newCve.workloads.add(workloadScan.name + '/' + workloadScan.container);
          newCve.images.add(workloadScan.imageScan.imageName);
          newCve.artifacts.add(match.artifact.name + ' ' + match.artifact.version);

          vulnerabilityList.push(newCve);
        }
      }
    }
  }

  return vulnerabilityList;
}

function MoreButton(props: {
  setLoading: any;
  setWorkloadScans: any;
  title: string;
  readToEnd?: boolean;
}) {
  const { setLoading, setWorkloadScans, title, readToEnd } = props;

  return (
    <Button
      disabled={indexSummary === summaries.length}
      onClick={() => {
        const currentIndex = indexSummary;
        if (readToEnd) {
          indexSummary = summaries.length;
        } else {
          indexSummary =
            currentIndex + summaryFetchItems > summaries.length
              ? summaries.length
              : currentIndex + summaryFetchItems;
        }

        setLoading(true);
        setTimeout(() =>
          fetchVulnerabilityManifests(summaries.slice(currentIndex, indexSummary)).then(
            response => {
              if (!globalWorkloadScans) globalWorkloadScans = response;
              else globalWorkloadScans = globalWorkloadScans?.concat(response);

              setWorkloadScans(globalWorkloadScans);
              setLoading(false);
            }
          )
        );
      }}
      variant="contained"
    >
      {title}
    </Button>
  );
}
