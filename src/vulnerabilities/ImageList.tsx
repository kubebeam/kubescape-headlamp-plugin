/* 
  Show container image scans. This view is part of the main Vulnerabilities page.  
*/
import {
  DateLabel,
  Link as HeadlampLink,
  SectionBox,
  Table as HeadlampTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Stack, Tooltip } from '@mui/material';
import { Path } from '../index';
import { VulnerabilityModel } from './view-types';
import { workloadScans } from './Vulnerabilities';
import { VulnerabilityManifest } from 'src/softwarecomposition/VulnerabilityManifest';

export default function ImageListView() {
  if (!workloadScans) {
    return <></>;
  }
  const imageScans = getImageScans(workloadScans);
  return (
    <>
      <h5>{imageScans.length} image scans</h5>
      <SectionBox>
        <HeadlampTable
          data={imageScans}
          columns={[
            {
              header: 'Image',
              accessorFn: (imageScan: VulnerabilityModel.ImageScanWithReferences) => {
                return (
                  <HeadlampLink
                    routeName={Path.ImageVulnerabilityDetails}
                    params={{
                      name: imageScan.manifestName,
                    }}
                  >
                    {imageScan.imageName.split('@sha')[0]}
                  </HeadlampLink>
                );
              },
              gridTemplate: 'max-content',
            },
            {
              header: 'Workload',
              accessorFn: (imageScan: VulnerabilityModel.ImageScanWithReferences) => (
                <div style={{ whiteSpace: 'pre-line' }}>
                  {Array.from(
                    new Set(Array.from(imageScan.workloads).map(workload => workload.name))
                  ).join('\n')}
                </div>
              ),
              gridTemplate: 'max-content',
            },
            {
              header: 'Last scan',
              accessorFn: (imageScan: VulnerabilityModel.ImageScanWithReferences) => (
                <DateLabel date={imageScan.creationTimestamp} />
              ),
              gridTemplate: 'max-content',
            },
            {
              header: 'Vulnerabilities',
              accessorFn: (imageScan: VulnerabilityModel.ImageScanWithReferences) =>
                resultStack(imageScan),
            },
          ]}
        />
      </SectionBox>
    </>
  );
}

function resultStack(imageScan: VulnerabilityModel.ImageScanWithReferences) {
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
        <Tooltip title={cveList(imageScan, severity)}>
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

function cveList(imageScan: VulnerabilityModel.ImageScanWithReferences, severity: string) {
  const cves = [];
  for (const scan of imageScan.vulnerabilities) {
    if (scan.severity === severity) {
      cves.push(scan.CVE);
    }
  }

  if (cves.length > 0) {
    return (
      <>
        <div style={{ fontSize: 'smaller' }}>{severity}</div>
        <br />
        <div style={{ whiteSpace: 'normal', textAlign: 'left', fontSize: 'small' }}>
          <Stack spacing={1}>
            {cves.map(cve => (
              <div>{cve} </div>
            ))}
          </Stack>
        </div>
      </>
    );
  }
}

function getImageScans(
  workloadScans: VulnerabilityModel.WorkloadScan[]
): VulnerabilityModel.ImageScanWithReferences[] {
  const imageScans: VulnerabilityModel.ImageScanWithReferences[] = [];
  if (workloadScans) {
    for (const workloadScan of workloadScans) {
      if (!workloadScan.imageScan) {
        continue;
      }

      let scan: VulnerabilityModel.ImageScanWithReferences | undefined = imageScans.find(
        element => element.manifestName === workloadScan.imageScan?.manifestName
      );
      if (!scan) {
        scan = {
          ...workloadScan.imageScan,
          workloads: new Set(),
        };

        imageScans.push(scan);
      }

      scan.workloads.add(workloadScan);
    }
  }

  return imageScans;
}
