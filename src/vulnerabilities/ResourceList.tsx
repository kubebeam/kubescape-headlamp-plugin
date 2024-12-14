/* 
  Show workload configuration scans. This view is part of the main Vulnerabilities page.  
*/
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  Link,
  SectionBox,
  Table as HeadlampTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Stack, Tooltip } from '@mui/material';
import { makeNamespaceLink } from '../common/Namespace';
import { RoutingPath } from '../index';
import { WorkloadScan } from './fetch-vulnerabilities';

export default function WorkloadScanListView(props: { workloadScans: WorkloadScan[] | null }) {
  // Get the Kubescape pods to detect the installed namespace
  const [kubescapePods] = K8s.ResourceClasses.Pod.useList({
    labelSelector: 'app.kubernetes.io/component=kubescape,app.kubernetes.io/instance=kubescape',
  });

  const { workloadScans } = props;
  if (!workloadScans || !kubescapePods) {
    return <></>;
  }
  return (
    <>
      <h5>{workloadScans.length} resources</h5>
      <SectionBox>
        <HeadlampTable
          data={workloadScans}
          columns={[
            {
              header: 'Name',
              accessorKey: 'name',
              Cell: ({ cell }: any) => {
                return (
                  <Link
                    routeName={RoutingPath.KubescapeVulnerabilityDetails}
                    params={{
                      name: cell.row.original.manifestName,
                      namespace: cell.row.original.namespace,
                    }}
                  >
                    {cell.getValue()}
                  </Link>
                );
              },
              gridTemplate: 'max-content',
            },
            {
              header: 'Container',
              accessorKey: 'container',
              gridTemplate: 'min-content',
            },
            {
              header: 'Kind',
              accessorKey: 'kind',
              gridTemplate: 'min-content',
            },
            {
              header: 'Namespace',
              accessorKey: 'namespace',
              Cell: ({ cell }: any) => makeNamespaceLink(cell.getValue()),
              gridTemplate: 'min-content',
            },
            {
              header: 'Image',
              accessorFn: (workloadScan: WorkloadScan) => workloadScan.imageScan?.imageName,
            },
            {
              header: 'CVE',
              accessorFn: (workloadScan: WorkloadScan) => resultStack(workloadScan),
            },
            {
              header: 'Relevant',
              accessorFn: (workloadScan: WorkloadScan) => {
                if (!workloadScan.imageScan) return 'Unknown';

                if (workloadScan.relevant) {
                  let count = 0;
                  for (const match of workloadScan.imageScan.matches) {
                    if (
                      workloadScan.relevant.matches.some(
                        r => r.vulnerability.id === match.vulnerability.id
                      )
                    ) {
                      count++;
                    }
                  }
                  return `${count} of ${workloadScan.imageScan.matches.length}`;
                }
                return `? of ${workloadScan.imageScan.matches.length}`;
              },
              gridTemplate: 'min-content',
            },
            {
              header: 'SBOM',
              accessorFn: (workloadScan: WorkloadScan) => {
                if (workloadScan.imageScan?.manifestName) {
                  return (
                    <Link
                      routeName={RoutingPath.KubescapeSBOMDetails}
                      params={{
                        name:
                          workloadScan.relevant?.manifestName ??
                          workloadScan.imageScan?.manifestName,
                        namespace: kubescapePods[0].jsonData.metadata.namespace, //  namespace in vulnerabilitiesRef is wrong in refering to workload namespace
                      }}
                      search={workloadScan.relevant ? '?filtered' : ''}
                    >
                      SBOM
                    </Link>
                  );
                }
              },
              gridTemplate: 'min-content',
            },
          ]}
        />
      </SectionBox>
    </>
  );
}

function countScans(workloadScan: WorkloadScan, severity: string): number {
  let count: number = 0;

  if (workloadScan.imageScan) {
    for (const match of workloadScan.imageScan.matches) {
      if (match.vulnerability.severity === severity) {
        count++;
      }
    }
  }
  return count;
}

function resultStack(workloadScan: WorkloadScan) {
  if (!workloadScan.imageScan) {
    return <div />;
  }
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
          width: 25,
        }}
      >
        <Tooltip title={severity}>
          <Box>{countScans(workloadScan, severity)}</Box>
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
