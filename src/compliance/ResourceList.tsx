/* 
  List configuration scans for all workloads.  
*/
import { Link, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Stack, Tooltip } from '@mui/material';
import { WorkloadConfigurationScanSummary } from '../softwarecomposition/WorkloadConfigurationScanSummary';
import { workloadScanData } from './Compliance';
import controlLibrary from './controlLibrary';

export default function KubescapeWorkloadConfigurationScanList() {
  return (
    <div>
      <WorkloadConfigurationScanListView />
    </div>
  );
}

function WorkloadConfigurationScanListView() {
  if (!workloadScanData) {
    return <></>;
  }

  const workloadsWithFindings = getWorkloadsWithFindings(workloadScanData);
  return (
    <>
      <h5>
        {workloadScanData.length} resources scanned, {workloadsWithFindings.length} failed
      </h5>
      <SectionBox>
        <Table
          data={workloadsWithFindings}
          columns={[
            {
              header: 'Name',
              accessorFn: (workloadScan: WorkloadConfigurationScanSummary) => {
                return (
                  <Link
                    routeName={`/kubescape/compliance/namespaces/:namespace/:name`}
                    params={{
                      name: workloadScan.metadata.name,
                      namespace: workloadScan.metadata.namespace,
                    }}
                  >
                    {workloadScan.metadata.labels['kubescape.io/workload-name']}
                  </Link>
                );
              },
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
              accessorFn: (workloadScan: WorkloadConfigurationScanSummary) => (
                <Link
                  routeName="namespace"
                  params={{
                    name: workloadScan.metadata.namespace,
                  }}
                >
                  {workloadScan.metadata.namespace}
                </Link>
              ),
              gridTemplate: 'auto',
            },
            {
              header: 'Failed',
              accessorFn: (workloadScan: WorkloadConfigurationScanSummary) => {
                let count = 0;

                for (const [, scan] of Object.entries(workloadScan.spec.controls) as any) {
                  if (scan.status.status === 'failed') {
                    count++;
                  }
                }
                return `${count}/${Object.entries(workloadScan.spec.controls).length} controls`;
              },
              gridTemplate: 'auto',
            },
            {
              header: 'Controls',
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

function countScans(workloadScan: WorkloadConfigurationScanSummary, severity: string): number {
  let count: number = 0;

  for (const [, scan] of Object.entries(workloadScan.spec.controls) as any) {
    if (scan.status.status === 'failed' && scan.severity.severity === severity) {
      count++;
    }
  }
  return count;
}

function controlsList(workloadScan: WorkloadConfigurationScanSummary, severity: string) {
  const controlIDs = [];
  for (const [controlID, scan] of Object.entries(workloadScan.spec.controls) as any) {
    if (controlIDs.indexOf(controlID) >= 0) {
      continue;
    }
    if (scan.status.status === 'failed' && scan.severity.severity === severity) {
      controlIDs.push(controlID);
    }
  }

  if (controlIDs.length === 0) {
    return;
  }

  function controlItem(controlID: string) {
    return (
      <div>
        {controlID}: {getControlName(controlID)}
        <br />
      </div>
    );
  }

  function getControlName(controlID: string) {
    for (const control of controlLibrary) {
      if (control.controlID === controlID) {
        return control.name;
      }
    }
    return '';
  }

  return (
    <>
      <div style={{ fontSize: 'smaller' }}>{severity}</div>
      <br />
      <div style={{ whiteSpace: 'normal', textAlign: 'left', fontSize: 'small' }}>
        <Stack spacing={1}>{controlIDs.map(controlID => controlItem(controlID))}</Stack>
      </div>
    </>
  );
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
          {countScans(workloadScan, severity)}
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
    for (const [, scan] of Object.entries(workload.spec.controls) as any) {
      if (scan.status.status === 'failed') {
        workloads.push(workload);
        break;
      }
    }
  }
  return workloads;
}
