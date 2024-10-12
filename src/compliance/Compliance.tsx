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
export let globalWorkloadScanData: WorkloadConfigurationScanSummary[] | null = null;
let currentClusterURL = '';

export default function ComplianceView() {
  const [workloadScanData, setWorkloadScanData] =
    useState<WorkloadConfigurationScanSummary[]>(null);

  useEffect(() => {
    if (
      globalWorkloadScanData === null ||
      currentClusterURL !== createRouteURL(RoutingPath.ComplianceView) // check if user switched to another cluster
    ) {
      deepListQuery('workloadconfigurationscansummaries').then(response => {
        globalWorkloadScanData = response;
        currentClusterURL = createRouteURL(RoutingPath.ComplianceView);
        setWorkloadScanData(response);
      });
    } else {
      setWorkloadScanData(globalWorkloadScanData);
    }
  }, []);

  return (
    <>
      <h1>Compliance</h1>
      <HeadlampTabs
        tabs={[
          {
            label: 'Controls',
            component: <ConfigurationScanningListView workloadScanData={workloadScanData} />,
          },
          {
            label: 'Resources',
            component: (
              <KubescapeWorkloadConfigurationScanList workloadScanData={workloadScanData} />
            ),
          },
          {
            label: 'Namespaces',
            component: <NamespaceView workloadScanData={workloadScanData} />,
          },
        ]}
        ariaLabel="Navigation Tabs"
      />
    </>
  );
}

function ConfigurationScanningListView(props: {
  workloadScanData: WorkloadConfigurationScanSummary[];
}) {
  const { workloadScanData } = props;
  if (!workloadScanData)
    return (
      <Box sx={{ padding: 2 }}>
        <RotatingLines />
      </Box>
    );

  const controlsWithFindings = controlLibrary.filter(control =>
    workloadScanData?.some(w =>
      Object.values(w.spec.controls).some(
        scan => control.controlID === scan.controlID && scan.status.status === 'failed'
      )
    )
  );

  const [isFailedControlSwitchChecked, setIsFailedControlSwitchChecked] = useState(true);
  const controls = isFailedControlSwitchChecked ? controlsWithFindings : controlLibrary;

  // const scores = controls.map(control => {
  //   const evaluated = workloadScanData
  //     .flatMap(w => Object.values(w.spec.controls))
  //     .filter(scan => scan.controlID === control.controlID).length;
  //   const passed = workloadScanData
  //     .flatMap(w => Object.values(w.spec.controls))
  //     .filter(scan => scan.controlID === control.controlID)
  //     .filter(scan => scan.status.status === 'passed').length;
  //   return passed / evaluated;
  // });
  // const sumScore =
  //   ((scores.reduce((sum, item) => sum + item, 0) / controls.length) * 100).toFixed(0) + '%';

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
              id: 'ID',
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
            // {
            //   header: 'Score',
            //   accessorFn: (control: Control) => {
            //     const evaluated = workloadScanData
            //       .flatMap(w => Object.values(w.spec.controls))
            //       .filter(scan => scan.controlID === control.controlID).length;
            //     const passed = countScans(workloadScanData, control, 'passed');
            //     return ((passed * 100) / evaluated).toFixed(0) + '%';
            //   },
            // },
          ]}
          initialState={{
            sorting: [
              {
                id: 'ID',
                desc: false,
              },
            ],
          }}
        />
      </SectionBox>
    </>
  );
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

function countScans(
  workloadScanData: WorkloadConfigurationScanSummary[],
  control: Control,
  status: string
): number {
  return workloadScanData
    .flatMap(w => Object.values(w.spec.controls))
    .filter(scan => scan.controlID === control.controlID)
    .filter(scan => scan.status.status === status).length;
}

function countFailedScans(workloadScanData: WorkloadConfigurationScanSummary[]): number {
  return workloadScanData
    .flatMap(w => Object.values(w.spec.controls))
    .filter(scan => scan.status.status === 'failed').length;
}
