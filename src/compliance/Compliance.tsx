import {
  SectionBox,
  StatusLabel,
  StatusLabelProps,
  Table,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Link } from '@mui/material';
import { useEffect, useState } from 'react';
import { fetchWorkloadConfigurationScan } from '../model';
import controlLibrary from './controlLibrary.js';
import KubescapeWorkloadConfigurationScanList from './ResourceList';

export default function ComplianceView() {
  return (
    <>
      <title>BBBBB</title>
      <div>
        <h1>Compliance</h1>
        <BasicTabs />
      </div>
    </>
  );
}

function ConfigurationScanningListView() {
  const [workloadScanData, setWorkloadScanData] = useState<Array<any> | null>(null);

  useEffect(() => {
    fetchWorkloadConfigurationScan().then(response => {
      setWorkloadScanData(response);
    });
  }, []);

  sortControlLibrary();

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
              data={controlLibrary}
              columns={[
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
                  header: 'Description',
                  accessorFn: item => item.description.replaceAll('`', "'"),
                },
                {
                  header: 'Failed',
                  accessorFn: item => makeFailedLabel(countScans(workloadScanData, item, 'failed')),
                  gridTemplate: 'min-content',
                },
                {
                  header: 'Severity',
                  accessorFn: item =>
                    makeSeverityLabel(item.baseScore, countScans(workloadScanData, item, 'failed')),
                  gridTemplate: 'min-content',
                },
                {
                  header: 'Passed',
                  accessorFn: item => countScans(workloadScanData, item, 'passed'),
                  gridTemplate: 'min-content',
                },
                {
                  header: 'Skipped',
                  accessorFn: item => countScans(workloadScanData, item, 'skipped'),
                  gridTemplate: 'min-content',
                },
                {
                  header: 'Remediation',
                  accessorFn: item => item.remediation.replaceAll('`', "'"),
                },
              ]}
            />
          </SectionBox>
        </>
      )}
    </>
  );
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

function makeFailedLabel(failCount: number) {
  let status: StatusLabelProps['status'] = '';

  if (failCount > 0) {
    status = 'error';
  } else {
    status = 'success';
  }

  if (failCount > 0) {
    return (
      <StatusLabel status={status}>
        {failCount}
        <Box
          aria-label="hidden"
          display="inline"
          paddingTop={1}
          paddingLeft={0.5}
          style={{ verticalAlign: 'text-top' }}
        ></Box>
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

function countScans(workloadScanData, item, status) {
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

function countFailedScans(workloadScanData) {
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

function countFailedCVE(workloadScanData) {
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
