/* 
  Show workload configuration scans. This view is part of the main Vulnerabilities page.  
*/
import {
  Link,
  SectionBox,
  Table as HeadlampTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Stack, Tooltip } from '@mui/material';
import { makeNamespaceLink } from '../common/Namespace';
import { RoutingPath } from '../index';
import { VulnerabilityModel } from './view-types';

export default function WorkloadScanListView(props: {
  workloadScans: VulnerabilityModel.WorkloadScan[];
}) {
  const { workloadScans } = props;
  if (!workloadScans) {
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
              accessorFn: (workloadScan: VulnerabilityModel.WorkloadScan) =>
                workloadScan.imageScan?.imageName,
            },
            {
              header: 'CVE',
              accessorFn: (workloadScan: VulnerabilityModel.WorkloadScan) =>
                resultStack(workloadScan),
            },
            {
              header: 'Relevant',
              accessorFn: (workloadScan: VulnerabilityModel.WorkloadScan) => {
                if (!workloadScan.imageScan || !workloadScan.relevant) return 'Unknown';
                let count = 0;
                for (const v of workloadScan.imageScan.vulnerabilities) {
                  if (workloadScan.relevant.vulnerabilities.some(r => r.CVE === v.CVE)) {
                    count++;
                  }
                }
                return `${count} of ${workloadScan.imageScan.vulnerabilities.length}`;
              },
            },
            {
              header: 'SBOM',
              accessorFn: (workloadScan: VulnerabilityModel.WorkloadScan) => {
                if (workloadScan.imageScan?.manifestName) {
                  return (
                    <Link
                      routeName={RoutingPath.KubescapeSBOMDetails}
                      params={{
                        name:
                          workloadScan.relevant?.manifestName ??
                          workloadScan.imageScan?.manifestName,
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

function countScans(workloadScan: VulnerabilityModel.WorkloadScan, severity: string): number {
  let count: number = 0;

  if (workloadScan.imageScan) {
    for (const v of workloadScan.imageScan.vulnerabilities) {
      if (v.severity === severity) {
        count++;
      }
    }
  }
  return count;
}

function resultStack(workloadScan: VulnerabilityModel.WorkloadScan) {
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
