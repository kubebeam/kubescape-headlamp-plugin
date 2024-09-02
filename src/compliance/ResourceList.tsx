import { Link, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Stack, Tooltip } from '@mui/material';
import { workloadScanData } from './Compliance';

export default function KubescapeWorkloadConfigurationScanList() {
  return (
    <div>
      <WorkloadConfigurationScanListView />
    </div>
  );
}

function WorkloadConfigurationScanListView() {
  return (
    <SectionBox>
      <Table
        data={getWorkloadsWithFindings(workloadScanData)}
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
          },
          {
            header: 'Kind',
            accessorFn: item => item.metadata.labels['kubescape.io/workload-kind'],
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
          },
          {
            header: 'Controls',
            accessorFn: item => resultStack(item),
          },
        ]}
      />
    </SectionBox>
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
        <Tooltip title={severity}>{countScans(workloadScan, severity)}</Tooltip>
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
