/* 
  Show container image scans. This view is part of the main Vulnerabilities page.  
*/
import { Link as HeadlampLink } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { DateLabel, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Stack, Tooltip } from '@mui/material';
import { ImageScan, WorkloadScan, workloadScans } from './Vulnerabilities';

export default function ImageListView() {
  if (!workloadScans) {
    return <></>;
  }
  const imageScans = getImageScans(workloadScans);
  return (
    <>
      <h5>{imageScans.length} image scans</h5>
      <SectionBox>
        <Table
          data={imageScans}
          columns={[
            {
              header: 'Image',
              accessorFn: (imageScan: ImageScanDetails) => {
                return (
                  <HeadlampLink
                    routeName={`/kubescape/vulnerabilities/images/:name`}
                    params={{
                      name: imageScan.manifestName,
                    }}
                  >
                    {imageScan.imageName}
                  </HeadlampLink>
                );
              },
              gridTemplate: 'max-content',
            },
            {
              header: 'Workload',
              accessorFn: (imageScan: ImageScanDetails) =>
                imageScan.workloads.map(workload => workload.name).join(),
              gridTemplate: 'max-content',
            },
            {
              header: 'Last scan',
              accessorFn: (imageScan: ImageScanDetails) => (
                <DateLabel date={imageScan.creationTimestamp} />
              ),
              gridTemplate: 'max-content',
            },
            {
              header: 'Vulnerabilities',
              accessorFn: (imageScan: ImageScanDetails) => resultStack(imageScan),
            },
          ]}
        />
      </SectionBox>
    </>
  );
}

interface ImageScanDetails extends ImageScan {
  workloads: WorkloadScan[];
}

function getImageScans(workloadScans: WorkloadScan[]): ImageScanDetails[] {
  const imageScans: ImageScanDetails[] = [];
  if (workloadScans) {
    for (const workloadScan of workloadScans) {
      if (!workloadScan.imageScan) {
        continue;
      }

      let scan: ImageScanDetails = imageScans.find(
        element => element.manifestName === workloadScan.imageScan.manifestName
      );
      if (!scan) {
        scan = {
          ...workloadScan.imageScan,
          workloads: [],
        };

        imageScans.push(scan);
      }

      scan.workloads.push(workloadScan);
    }
  }

  return imageScans;
}

function resultStack(imageScan: ImageScan) {
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
        <Tooltip title="{severity}">
          {imageScan.vulnerabilities.filter(v => v.severity === severity).length}
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
