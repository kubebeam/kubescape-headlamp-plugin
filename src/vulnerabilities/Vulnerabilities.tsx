import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { Link as HeadlampLink } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  SectionBox,
  StatusLabel,
  StatusLabelProps,
  Table,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import WorkloadScanListView from './ResourceList';

export interface WorkloadScan {
  manifestName: string;
  name: string;
  kind: string;
  container: string;
  namespace: string;
  imageScan: ImageScan;
}

export interface ImageScan {
  manifestName: string;
  imageName: string;
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

interface VulnerabilityDetails extends Vulnerability {
  workloads: Set<string>;
  images: Set<string>;
}

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
      <BasicTabs />
    </>
  );
}

export async function fetchVulnerabilityManifests(): Promise<any> {
  async function detailQuery(type) {
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

  const vulnerabilityManifestSummaries = await detailQuery('vulnerabilitymanifestsummaries');
  const vulnerabilityManifests = await detailQuery('vulnerabilitymanifests');

  const workloadScans: WorkloadScan[] = [];
  const imageScans: ImageScan[] = [];

  for (const summary of vulnerabilityManifestSummaries) {
    let imageScan: ImageScan = imageScans.find(
      element => element.manifestName === summary.spec.vulnerabilitiesRef.all?.name
    );
    if (!imageScan) {
      if (summary.spec.vulnerabilitiesRef.all?.name) {
        const v = vulnerabilityManifests.find(
          element => element.metadata.name === summary.spec.vulnerabilitiesRef.all?.name
        );
        if (v?.spec.payload.matches) {
          imageScan = {
            manifestName: v.metadata.name,
            imageName: v.metadata.annotations['kubescape.io/image-tag'],
            vulnerabilities: [],
          };
          const matches: any | undefined = v.spec.payload.matches;
          if (matches) {
            for (const match of v.spec.payload.matches) {
              const v: Vulnerability = {
                CVE: match.vulnerability.id,
                dataSource: match.vulnerability.dataSource,
                description: match.vulnerability.description,
                severity: match.vulnerability.severity,
                baseScore: match.vulnerability.cvss
                  ? match.vulnerability.cvss[0].metrics.baseScore
                  : 0,
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
        }
      }
    }

    const w: WorkloadScan = {
      manifestName: summary.metadata.name,
      name: summary.metadata.labels['kubescape.io/workload-name'],
      namespace: summary.metadata.labels['kubescape.io/workload-namespace'],
      container: summary.metadata.labels['kubescape.io/workload-container-name'],
      kind: summary.metadata.labels['kubescape.io/workload-kind'],
      imageScan: imageScan,
    };

    workloadScans.push(w);
  }

  return workloadScans;
}

function getCVEList(workloadScans: WorkloadScan[]): VulnerabilityDetails[] {
  const vulnerabilityList: VulnerabilityDetails[] = [];

  for (const workloadScan of workloadScans) {
    if (workloadScan.imageScan) {
      for (const vulnerability of workloadScan.imageScan.vulnerabilities) {
        const v = vulnerabilityList.find(
          element =>
            element.CVE === vulnerability.CVE &&
            element.artifact.name === vulnerability.artifact.name &&
            element.artifact.version === vulnerability.artifact.version
        );

        if (v) {
          v.workloads.add(workloadScan.name + '/' + workloadScan.container);
          v.images.add(workloadScan.imageScan.imageName);
        } else {
          const newV: VulnerabilityDetails = {
            ...vulnerability,
            workloads: new Set<string>(),
            images: new Set<string>(),
          };

          newV.workloads.add(workloadScan.name + '/' + workloadScan.container);
          newV.images.add(workloadScan.imageScan.imageName);
          vulnerabilityList.push(newV);
        }
      }
    }
  }

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
  return (
    <>
      {workloadScans && (
        <>
          <h5>{workloadScans.length} workload scans</h5>
          <SectionBox>
            <Table
              data={getCVEList(workloadScans)}
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
                  accessorFn: (item: VulnerabilityDetails) => makeSeverityLabel(item),
                  gridTemplate: 'min-content',
                },
                {
                  header: 'CVSS',
                  accessorFn: (item: VulnerabilityDetails) => item.baseScore,
                  gridTemplate: 'min-content',
                },
                {
                  header: 'Component',
                  accessorFn: (item: VulnerabilityDetails) =>
                    `${item.artifact.name} ${item.artifact.version}`,
                  gridTemplate: 'auto',
                },
                {
                  header: 'Fix version',
                  accessorFn: (item: VulnerabilityDetails) =>
                    item.fix.state && item.fix.versions ? item.fix.versions.join() : '',
                  gridTemplate: 'min-content',
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
      )}
    </>
  );
}

function makeSeverityLabel(item: Vulnerability) {
  const severity = item.severity;
  let status: StatusLabelProps['status'] = '';

  if (severity === 'Critical') {
    status = 'error';
  } else {
    status = 'success';
  }

  return (
    <StatusLabel status={status}>
      {severity}
      {severity === 'Critical' && (
        <Box
          aria-label="hidden"
          display="inline"
          paddingTop={1}
          paddingLeft={0.5}
          style={{ verticalAlign: 'text-top' }}
        ></Box>
      )}
    </StatusLabel>
  );
}

// copied from https://mui.com/material-ui/react-tabs/#introduction
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import * as React from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

function BasicTabs() {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="CVEs" {...a11yProps(0)} />
          <Tab label="Resources" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <CVEListView />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <WorkloadScanListView />
      </CustomTabPanel>
    </Box>
  );
}
