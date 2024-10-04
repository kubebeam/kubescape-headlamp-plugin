/* 
  Overview  page for configuration controls and resources. 
*/
import {
  Link as HeadlampLink,
  SectionBox,
  StatusLabel,
  StatusLabelProps,
  Table,
  Tabs as HeadlampTabs,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { createRouteURL } from '@kinvolk/headlamp-plugin/lib/Router';
import { Box, FormControlLabel, Link, Switch, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';
import { RotatingLines } from 'react-loader-spinner';
import { RoutingPath } from '../index';
import { deepListQuery } from '../model';
import { WorkloadConfigurationScanSummary } from '../softwarecomposition/WorkloadConfigurationScanSummary';
import { Control, controlLibrary } from './controlLibrary';
import NamespaceView from './NamespaceView';
import KubescapeWorkloadConfigurationScanList from './ResourceList';

// workloadScans are cached in global scope because it is an expensive query for the API server
export let workloadScanData: WorkloadConfigurationScanSummary[] | null = null;
let currentClusterURL = '';

export default function ComplianceView() {
  const [, setState] = useState({});

  useEffect(() => {
    if (
      workloadScanData === null ||
      currentClusterURL !== createRouteURL(RoutingPath.ComplianceView) // check if user switched to another cluster
    ) {
      deepListQuery('workloadconfigurationscansummaries').then(response => {
        workloadScanData = response;
        currentClusterURL = createRouteURL(RoutingPath.ComplianceView);
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
          {
            label: 'Namespaces',
            component: <NamespaceView />,
          },
        ]}
        ariaLabel="Navigation Tabs"
      />
    </>
  );
}

function ConfigurationScanningListView() {
  if (!workloadScanData)
    return (
      <Box sx={{ padding: 2 }}>
        <RotatingLines />
      </Box>
    );

  const controlsWithFindings = getControlsWithFindings(workloadScanData);
  const [isFailedControlSwitchChecked, setIsFailedControlSwitchChecked] = useState(true);
  const controls = isFailedControlSwitchChecked ? controlsWithFindings : controlLibrary;

  return (
    <>
      <h5>
        {countFailedScans(workloadScanData)} configuration issues, {controlsWithFindings.length}{' '}
        failed controls
      </h5>
      <FormControlLabel
        checked={isFailedControlSwitchChecked}
        control={<Switch color="primary" />}
        label={'Failed controls'}
        onChange={(event: any, checked: boolean) => {
          setIsFailedControlSwitchChecked(checked);
        }}
      />
      <SectionBox>
        <Table
          data={controls}
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
              accessorKey: 'controlID',
              Cell: ({ cell }: any) => (
                <Link
                  target="_blank"
                  href={'https://hub.armosec.io/docs/' + cell.getValue().toLowerCase()}
                >
                  {cell.getValue()}
                </Link>
              ),
              gridTemplate: 'min-content',
            },
            {
              header: 'Control Name',
              accessorKey: 'name',
              Cell: ({ cell }: any) => (
                <Tooltip
                  title={cell.row.original.description}
                  slotProps={{ tooltip: { sx: { fontSize: '0.9em' } } }}
                >
                  {cell.getValue()}
                </Tooltip>
              ),
              gridTemplate: 'auto',
            },
            {
              header: 'Category',
              accessorFn: (control: Control) =>
                control.category?.subCategory?.name ?? control.category?.name,
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
      for (const scan of Object.values(workload.spec.controls) as any) {
        if (control.controlID === scan.controlID && scan.status.status === 'failed') {
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
  const failCount = countScans(workloadScanData, control, 'failed');
  const passedCount = countScans(workloadScanData, control, 'passed');

  if (failCount > 0) {
    return (
      <HeadlampLink
        routeName={RoutingPath.KubescapeControlResults}
        params={{
          control: control.controlID,
        }}
      >
        {failCount} Failed, {passedCount} Accepted
      </HeadlampLink>
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
    for (const scan of Object.values(workload.spec.controls) as any) {
      if (scan.controlID === control.controlID && scan.status.status === status) {
        count++;
      }
    }
  }
  return count;
}

function countFailedScans(workloadScanData: WorkloadConfigurationScanSummary[]): number {
  let count: number = 0;

  for (const workload of workloadScanData) {
    for (const scan of Object.values(workload.spec.controls) as any) {
      if (scan.status.status === 'failed') {
        count++;
      }
    }
  }
  return count;
}
