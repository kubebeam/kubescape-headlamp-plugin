/* 
  List configuration scans for all workloads.  
*/
import { Link, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, FormControlLabel, Stack, Switch, Tooltip } from '@mui/material';
import { useState } from 'react';
import { RoutingPath } from '../index';
import { WorkloadConfigurationScanSummary } from '../softwarecomposition/WorkloadConfigurationScanSummary';
import controlLibrary from './controlLibrary';

export default function KubescapeWorkloadConfigurationScanList(props: {
  workloadScanData: WorkloadConfigurationScanSummary[];
}) {
  const [isFailedControlSwitchChecked, setIsFailedControlSwitchChecked] = useState(true);
  const { workloadScanData } = props;
  if (!workloadScanData) {
    return <></>;
  }

  const workloadsWithFindings = getWorkloadsWithFindings(workloadScanData);
  return (
    <>
      <h5>
        {workloadScanData.length} resources scanned, {workloadsWithFindings.length} failed
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
          data={isFailedControlSwitchChecked ? workloadsWithFindings : workloadScanData}
          columns={[
            {
              header: 'Name',
              accessorFn: (workloadScan: WorkloadConfigurationScanSummary) =>
                workloadScan.metadata.labels['kubescape.io/workload-name'],
              Cell: ({ cell, row }: any) => (
                <Link
                  routeName={RoutingPath.KubescapeWorkloadConfigurationScanDetails}
                  params={{
                    name: row.original.metadata.name,
                    namespace: row.original.metadata.namespace,
                  }}
                >
                  {cell.getValue()}
                </Link>
              ),
              gridTemplate: 'auto',
            },
            {
              header: 'Kind',
              accessorFn: (workloadScan: WorkloadConfigurationScanSummary) =>
                workloadScan.metadata.labels['kubescape.io/workload-kind'],
              gridTemplate: 'auto',
            },
            {
              header: 'Namespace',
              accessorFn: (workloadScan: WorkloadConfigurationScanSummary) =>
                workloadScan.metadata.labels['kubescape.io/workload-namespace'],
              Cell: ({ cell }: any) => {
                if (cell.getValue())
                  return (
                    <Link
                      routeName="namespace"
                      params={{
                        name: cell.getValue(),
                      }}
                    >
                      {cell.getValue()}
                    </Link>
                  );
              },
              gridTemplate: 'auto',
            },
            {
              header: 'Passed',
              accessorFn: (workloadScan: WorkloadConfigurationScanSummary) => {
                const passedCount = Object.values(workloadScan.spec.controls).filter(
                  scan => scan.status.status === WorkloadConfigurationScanSummary.Status.Passed
                ).length;
                return (
                  <progress value={passedCount / Object.keys(workloadScan.spec.controls).length} />
                );
              },
              gridTemplate: 'auto',
            },
            {
              header: 'Failed Controls',
              accessorFn: (workloadScan: WorkloadConfigurationScanSummary) =>
                resultStack(workloadScan),
              gridTemplate: 'auto',
            },
          ]}
        />
      </SectionBox>
    </>
  );
}

function controlsList(workloadScan: WorkloadConfigurationScanSummary, severity: string) {
  const controls = [];
  for (const scan of Object.values(workloadScan.spec.controls)) {
    if (
      scan.status.status === WorkloadConfigurationScanSummary.Status.Failed &&
      scan.severity.severity === severity
    ) {
      const control = controlLibrary.find(control => control.controlID === scan.controlID);
      if (control) {
        controls.push(control);
      }
    }
  }

  if (controls.length > 0) {
    return (
      <>
        <div style={{ fontSize: 'smaller' }}>{severity}</div>
        <br />
        <div style={{ whiteSpace: 'normal', textAlign: 'left', fontSize: 'small' }}>
          <Stack spacing={1}>
            {controls.map(control => (
              <div>{`${control.controlID}: ${control.name}`} </div>
            ))}
          </Stack>
        </div>
      </>
    );
  }
}

function resultStack(workloadScan: WorkloadConfigurationScanSummary) {
  function box(color: string, severity: string) {
    return (
      <Box
        sx={{
          borderLeft: 2,
          borderTop: 1,
          borderRight: 1,
          borderBottom: 1,
          borderColor: `gray gray gray ${color}`,
          textAlign: 'center',
          width: 20,
        }}
      >
        <Tooltip title={controlsList(workloadScan, severity)}>
          {
            Object.values(workloadScan.spec.controls).filter(
              scan =>
                scan.status.status === WorkloadConfigurationScanSummary.Status.Failed &&
                scan.severity.severity === severity
            ).length
          }
        </Tooltip>
      </Box>
    );
  }

  return (
    <Stack direction="row" spacing={1}>
      {box('purple', 'Critical')}
      {box('red', 'High')}
      {box('orange', 'Medium')}
      {box('yellow', 'Low')}
    </Stack>
  );
}

function getWorkloadsWithFindings(
  workloadScanData: WorkloadConfigurationScanSummary[]
): WorkloadConfigurationScanSummary[] {
  const workloads = [];
  for (const workload of workloadScanData) {
    for (const scan of Object.values(workload.spec.controls) as any) {
      if (scan.status.status === 'failed') {
        workloads.push(workload);
        break;
      }
    }
  }
  return workloads;
}
