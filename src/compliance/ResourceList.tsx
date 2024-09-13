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
                  {workloadScan.metadata.labels['kubescape.io/workload-namespace']}
                </Link>
              ),
              gridTemplate: 'auto',
            },
            {
              header: 'Failed',
              accessorFn: (workloadScan: WorkloadConfigurationScanSummary) => {
                const count = Object.values(workloadScan.spec.controls).filter(
                  scan => scan.status.status === 'failed'
                ).length;

                return `${count}/${Object.keys(workloadScan.spec.controls).length} controls`;
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

function controlsList(workloadScan: WorkloadConfigurationScanSummary, severity: string) {
  const controls = [];
  for (const scan of Object.values(workloadScan.spec.controls)) {
    if (scan.status.status === 'failed' && scan.severity.severity === severity) {
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
            {controls.map(control => `${control.controlID}: ${control.name}`)}
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
              scan => scan.status.status === 'failed' && scan.severity.severity === severity
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
