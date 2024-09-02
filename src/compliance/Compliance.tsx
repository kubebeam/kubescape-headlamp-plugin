import {
  SectionBox,
  StatusLabel,
  StatusLabelProps,
  Table,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Link as HeadlampLink } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Link } from '@mui/material';
import { useEffect, useState } from 'react';
import { fetchWorkloadConfigurationScan } from '../model';
import controlLibrary from './controlLibrary.js';
import KubescapeWorkloadConfigurationScanList from './ResourceList';

// TODO better https://dev.to/yezyilomo/global-state-management-in-react-with-global-variables-and-hooks-state-management-doesn-t-have-to-be-so-hard-2n2c
export let workloadScanData: any[] = null;

export default function ComplianceView() {
  const [, setState] = useState();

  useEffect(() => {
    if (workloadScanData == null) {
      fetchWorkloadConfigurationScan().then(response => {
        workloadScanData = response;

        setState({}); // Force component to re-render
      });
    }
  }, []);

  sortControlLibrary();

  return (
    <>
      <div>
        <h1>Compliance</h1>
        <BasicTabs />
      </div>
    </>
  );
}

function ConfigurationScanningListView(props) {
  return (
    <>
      {workloadScanData && (
        <>
          <h5>
            {countFailedScans(workloadScanData)} configuration issues,{' '}
            {countFailedCVE(workloadScanData)} Failed CVE
          </h5>
          <SectionBox>
            <Table
              data={getControlsWithFindings(workloadScanData)}
              columns={[
                {
                  header: 'Severity',
                  accessorFn: item =>
                    makeSeverityLabel(item.baseScore, countScans(workloadScanData, item, 'failed')),
                  gridTemplate: 'min-content',
                },
                {
                  header: 'ID',
                  accessorFn: item => {
                    return (
                      <Link href={'https://hub.armosec.io/docs/' + item.controlID.toLowerCase()}>
                        {item.controlID}
                      </Link>
                    );
                  },
                  gridTemplate: 'min-content',
                },
                {
                  header: 'Control Name',
                  accessorFn: item => item.name,
                  gridTemplate: 'min-content',
                },
                {
                  header: 'Remediation',
                  accessorFn: item => item.remediation.replaceAll('`', "'"),
                },
                {
                  header: 'Resources',
                  accessorFn: item => makeResultsLabel(workloadScanData, item),
                  gridTemplate: 'auto',
                },
                {
                  header: 'Skipped',
                  accessorFn: item => countScans(workloadScanData, item, 'skipped'),
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

function getControlsWithFindings(workloadScanData) {
  return controlLibrary.filter(control => {
    for (const workload of workloadScanData) {
      for (const [controlID, scan] of Object.entries(workload.spec.controls) as any) {
        if (control.controlID === controlID && scan.status.status === 'failed') {
          return true;
        }
      }
    }
  });
}

function makeSeverityLabel(baseScore: number, failCount: number) {
  let status: StatusLabelProps['status'] = '';
  let severity: string;

  // https://nvd.nist.gov/vuln-metrics/cvss
  if (baseScore < 0.1) {
    severity = 'None';
  } else if (baseScore < 4.0) {
    severity = 'Low';
  } else if (baseScore < 7.0) {
    severity = 'Medium';
  } else if (baseScore < 9.0) {
    severity = 'High';
  } else {
    severity = 'Critical';
  }

  if (failCount > 0) {
    status = 'error';
  } else {
    status = 'success';
  }

  if (baseScore >= 7.0 && failCount > 0) {
    return (
      <StatusLabel status={status}>
        {severity}
        {baseScore >= 7.0 && (
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
  } else {
    return severity;
  }
}

function makeResultsLabel(workloadScanData: any[], item) {
  let status: StatusLabelProps['status'] = '';

  const failCount = countScans(workloadScanData, item, 'failed');
  const passedCount = countScans(workloadScanData, item, 'passed');
  if (failCount > 0) {
    status = 'error';
  } else {
    status = 'success';
  }

  if (failCount > 0) {
    return (
      <StatusLabel status={status}>
        <Box
          aria-label="hidden"
          display="inline"
          paddingTop={1}
          paddingLeft={0.5}
          style={{ verticalAlign: 'text-top' }}
        >
          <HeadlampLink
            routeName={`/kubescape/compliance/controls/:control`}
            params={{
              control: item.controlID,
            }}
          >
            {failCount} Failed, {passedCount} Accepted
          </HeadlampLink>
        </Box>
      </StatusLabel>
    );
  } else {
    return failCount;
  }
}

function sortControlLibrary() {
  controlLibrary.sort((a, b) => {
    if (a.controlID < b.controlID) {
      return -1;
    }
    if (a.controlID > b.controlID) {
      return 1;
    }
    return 0;
  });
}

function countScans(workloadScanData, item, status): number {
  let count: number = 0;

  for (const workload of workloadScanData) {
    for (const [controlID, scan] of Object.entries(workload.spec.controls) as any) {
      if (controlID === item.controlID && scan.status.status === status) {
        count++;
      }
    }
  }
  return count;
}

function countFailedScans(workloadScanData): number {
  let count: number = 0;

  for (const workload of workloadScanData) {
    for (const [, scan] of Object.entries(workload.spec.controls) as any) {
      if (scan.status.status === 'failed') {
        count++;
      }
    }
  }
  return count;
}

function countFailedCVE(workloadScanData): number {
  const uniques: string[] = [];
  for (const workload of workloadScanData) {
    for (const [controlID, scan] of Object.entries(workload.spec.controls) as any) {
      if (scan.status.status === 'failed') {
        if (!uniques.includes(controlID)) {
          uniques.push(controlID);
        }
      }
    }
  }
  return uniques.length;
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
          <Tab label="Controls" {...a11yProps(0)} />
          <Tab label="Resources" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <ConfigurationScanningListView />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <KubescapeWorkloadConfigurationScanList />
      </CustomTabPanel>
    </Box>
  );
}
