/* 
  Overview  page for configuration controls and resources. 
*/
import {
  Link as HeadlampLink,
  Tabs as HeadlampTabs,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  SectionBox,
  StatusLabel,
  StatusLabelProps,
  Table,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Link, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';
import { deepListQuery } from '../model';
import { WorkloadConfigurationScanSummary } from '../softwarecomposition/WorkloadConfigurationScanSummary';
import { Control, controlLibrary } from './controlLibrary';
import KubescapeWorkloadConfigurationScanList from './ResourceList';

// workloadScans are cached in global scope because it is an expensive query for the API server
export let workloadScanData: WorkloadConfigurationScanSummary[] | null = null;

export default function ComplianceView() {
  const [, setState] = useState({});

  useEffect(() => {
    if (workloadScanData === null) {
      deepListQuery('workloadconfigurationscansummaries').then(response => {
        workloadScanData = response;

        setState({}); // Force component to re-render
      });
    }
  }, []);

  sortControlLibrary();

  return (
    <>
      <h1>Compliance</h1>
      <HeadlampTabs
        tabs={[
          {
            label: 'Controls',
            component: <ConfigurationScanningListView />,
          },
          {
            label: 'Resources',
            component: <KubescapeWorkloadConfigurationScanList />,
          },
        ]}
        ariaLabel="Navigation Tabs"
      />
    </>
  );
}

function ConfigurationScanningListView() {
  if (!workloadScanData) {
    return <></>;
  }

  const controlsWithFindings = getControlsWithFindings(workloadScanData);

  return (
    <>
      <h5>
        {countFailedScans(workloadScanData)} configuration issues, {controlsWithFindings.length}{' '}
        failed controls
      </h5>
      <SectionBox>
        <Table
          data={controlsWithFindings}
          columns={[
            {
              header: 'Severity',
              accessorFn: (control: Control) =>
                makeCVSSLabel(
                  control.baseScore,
                  workloadScanData ? countScans(workloadScanData, control, 'failed') : 0
                ),
              gridTemplate: 'min-content',
            },
            {
              header: 'ID',
              accessorFn: (control: Control) => {
                return (
                  <Link
                    target="_blank"
                    href={'https://hub.armosec.io/docs/' + control.controlID.toLowerCase()}
                  >
                    {control.controlID}
                  </Link>
                );
              },
              gridTemplate: 'min-content',
            },
            {
              header: 'Control Name',
              accessorFn: (control: Control) => {
                return (
                  <Tooltip
                    title={control.description}
                    slotProps={{ tooltip: { sx: { fontSize: '0.9em' } } }}
                  >
                    {control.name}
                  </Tooltip>
                );
              },
              gridTemplate: 'auto',
            },
            {
              header: 'Remediation',
              accessorFn: (control: Control) => control.remediation.replaceAll('`', "'"),
            },
            {
              header: 'Resources',
              accessorFn: (control: Control) =>
                workloadScanData ? makeResultsLabel(workloadScanData, control) : '',
              gridTemplate: 'auto',
            },
          ]}
        />
      </SectionBox>
    </>
  );
}

function getControlsWithFindings(workloadScanData: WorkloadConfigurationScanSummary[]): Control[] {
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

function makeCVSSLabel(baseScore: number, failCount: number) {
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

function makeResultsLabel(workloadScanData: WorkloadConfigurationScanSummary[], control: Control) {
  let status: StatusLabelProps['status'] = '';

  const failCount = countScans(workloadScanData, control, 'failed');
  const passedCount = countScans(workloadScanData, control, 'passed');
  if (failCount > 0) {
    status = 'error';
  } else {
    status = 'success';
  }

  if (failCount > 0) {
    return (
      <StatusLabel status={status} sx={{ width: '100%' }}>
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
              control: control.controlID,
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

function countScans(
  workloadScanData: WorkloadConfigurationScanSummary[],
  control: Control,
  status: string
): number {
  let count: number = 0;

  for (const workload of workloadScanData) {
    for (const [controlID, scan] of Object.entries(workload.spec.controls) as any) {
      if (controlID === control.controlID && scan.status.status === status) {
        count++;
      }
    }
  }
  return count;
}

function countFailedScans(workloadScanData: WorkloadConfigurationScanSummary[]): number {
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
