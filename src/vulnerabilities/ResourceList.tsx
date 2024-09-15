/* 
  Show workload configuration scans. This view is part of the main Vulnerabilities page.  
*/
import {
  Link,
  SectionBox,
  Table as HeadlampTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Stack, Tooltip } from '@mui/material';
import { Path } from '../index';
import { VulnerabilityModel } from './view-types';
import { workloadScans } from './Vulnerabilities';

export default function WorkloadScanListView() {
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
              accessorFn: (workloadScan: VulnerabilityModel.WorkloadScan) => {
                return (
                  <Link
                    routeName={Path.KubescapeVulnerabilityDetails}
                    params={{
                      name: workloadScan.manifestName,
                      namespace: workloadScan.namespace,
                    }}
                  >
                    {workloadScan.name}
                  </Link>
                );
              },
              gridTemplate: 'max-content',
            },
            {
              header: 'Container',
              accessorFn: (workloadScan: VulnerabilityModel.WorkloadScan) => workloadScan.container,
              gridTemplate: 'min-content',
            },
            {
              header: 'Kind',
              accessorFn: (workloadScan: VulnerabilityModel.WorkloadScan) => workloadScan.kind,
              gridTemplate: 'min-content',
            },
            {
              header: 'Namespace',
              accessorFn: (workloadScan: VulnerabilityModel.WorkloadScan) => (
                <Link
                  routeName="namespace"
                  params={{
                    name: workloadScan.namespace,
                  }}
                >
                  {workloadScan.namespace}
                </Link>
              ),
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
                if (!workloadScan.imageScan || !workloadScan.relevant) return;
                let count = 0;
                for (const v of workloadScan.imageScan.vulnerabilities) {
                  if (workloadScan.relevant.vulnerabilities.some(r => r.CVE === v.CVE)) {
                    count++;
                  }
                }
                return `${count} of ${workloadScan.imageScan.vulnerabilities.length}`;
              },
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
