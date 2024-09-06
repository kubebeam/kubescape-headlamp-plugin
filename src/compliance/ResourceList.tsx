/* 
  List configuration scans for all workloads.  
*/
import { Link, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Stack, Tooltip } from '@mui/material';
import { workloadScanData } from './Compliance';
import controlLibrary from './controlLibrary.js';

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
              accessorFn: item => {
                return (
                  <Link
                    routeName={`/kubescape/compliance/namespaces/:namespace/:name`}
                    params={{
                      name: item.metadata.name,
                      namespace: item.metadata.namespace,
                    }}
                  >
                    {item.metadata.labels['kubescape.io/workload-name']}
                  </Link>
                );
              },
              gridTemplate: 'auto',
            },
            {
              header: 'Kind',
              accessorFn: item => item.metadata.labels['kubescape.io/workload-kind'],
              gridTemplate: 'auto',
            },
            {
              header: 'Namespace',
              accessorFn: item => (
                <Link
                  routeName="namespace"
                  params={{
                    name: item.metadata.namespace,
                  }}
                >
                  {item.metadata.namespace}
                </Link>
              ),
              gridTemplate: 'auto',
            },
            {
              header: 'Failed',
              accessorFn: item => {
                let count = 0;

                for (const [, scan] of Object.entries(item.spec.controls) as any) {
                  if (scan.status.status === 'failed') {
                    count++;
                  }
                }
                return `${count}/${Object.entries(item.spec.controls).length} controls`;
              },
              gridTemplate: 'auto',
            },
            {
              header: 'Controls',
              accessorFn: item => resultStack(item),
              gridTemplate: 'auto',
            },
          ]}
        />
      </SectionBox>
    </>
  );
}

function countScans(workloadScan, severity: string): number {
  let count: number = 0;

  for (const [, scan] of Object.entries(workloadScan.spec.controls) as any) {
    if (scan.status.status === 'failed' && scan.severity.severity === severity) {
      count++;
    }
  }
  return count;
}

function controlsList(workloadScan, severity: string) {
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

  function controlItem(controlID) {
    return (
      <div>
        {controlID}: {getControlName(controlID)}
        <br />
      </div>
    );
  }

  function getControlName(controlID) {
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

function resultStack(workloadScan) {
  function box(color, severity) {
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

function getWorkloadsWithFindings(workloadScanData) {
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
