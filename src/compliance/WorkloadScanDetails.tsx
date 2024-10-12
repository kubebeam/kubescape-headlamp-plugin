/* 
  Show configuration scan results for a workload. 
*/
import {
  Link as HeadlampLink,
  NameValueTable,
  SectionBox,
  StatusLabel,
  StatusLabelProps,
  Table as HeadlampTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { createRouteURL } from '@kinvolk/headlamp-plugin/lib/Router';
import { Box, Link } from '@mui/material';
import { useEffect, useState } from 'react';
import { getURLSegments } from '../common/url';
import { RoutingPath } from '../index';
import { fetchWorkloadConfigurationScan } from '../model';
import { WorkloadConfigurationScan } from '../softwarecomposition/WorkloadConfigurationScan';
import { controlLibrary } from './controlLibrary';

export default function KubescapeWorkloadConfigurationScanDetails() {
  const [name, namespace] = getURLSegments(-1, -2);
  const [configurationScan, setConfigurationScan] = useState<WorkloadConfigurationScan | null>(
    null
  );

  useEffect(() => {
    fetchWorkloadConfigurationScan(name, namespace).then((result: WorkloadConfigurationScan) => {
      setConfigurationScan(result);
    });
  }, []);
  if (!configurationScan) {
    return <></>;
  }

  return (
    <>
      <SectionBox
        title="Workload Configuration Scan"
        backLink={createRouteURL(RoutingPath.ComplianceView)}
      >
        <NameValueTable
          rows={[
            {
              name: 'Name',
              value: configurationScan.metadata.labels['kubescape.io/workload-name'],
            },
            {
              name: 'Namespace',
              value: configurationScan.metadata.labels['kubescape.io/workload-namespace'],
            },
            {
              name: 'Kind',
              value: configurationScan.metadata.labels['kubescape.io/workload-kind'],
            },
            {
              name: 'Last scan',
              value: configurationScan.metadata.creationTimestamp,
            },
            {
              name: 'Results',
              value: getResults(configurationScan),
            },
          ]}
        />
      </SectionBox>

      <Controls workloadConfigurationScan={configurationScan} />
    </>
  );
}

function Controls(props: { workloadConfigurationScan: WorkloadConfigurationScan }) {
  const { workloadConfigurationScan } = props;
  const controls = workloadConfigurationScan.spec.controls;
  const entries = Object.keys(controls).map(key => controls[key]);

  return (
    <SectionBox title="Controls">
      <HeadlampTable
        data={entries}
        columns={[
          {
            header: 'Status',
            accessorFn: (control: WorkloadConfigurationScan.Control) => makeStatusLabel(control),
            gridTemplate: 'min-content',
          },
          {
            header: 'Control',
            accessorKey: 'controlID',
            Cell: ({ cell }: any) => {
              return (
                <Link
                  target="_blank"
                  href={'https://hub.armosec.io/docs/' + cell.getValue().toLowerCase()}
                >
                  {cell.getValue()}
                </Link>
              );
            },
            gridTemplate: 'min-content',
          },
          {
            header: 'Name',
            accessorKey: 'name',
          },
          {
            header: 'Category',
            accessorFn: (control: WorkloadConfigurationScan.Control) => {
              const controlInfo = controlLibrary.find(
                controlInfo => controlInfo.controlID === control.controlID
              );
              return controlInfo?.category?.subCategory?.name ?? controlInfo?.category?.name;
            },
            gridTemplate: 'auto',
          },
          {
            header: 'Severity',
            accessorKey: 'severity.severity',
            gridTemplate: 'min-content',
          },
          // {
          //   header: 'Score',
          //   accessorKey: 'severity.scoreFactor',
          //   gridTemplate: 'min-content',
          // },
          {
            header: 'Explain',
            accessorFn: (control: WorkloadConfigurationScan.Control) =>
              controlLibrary.find(controlInfo => controlInfo.controlID === control.controlID)
                ?.description,
          },
          {
            header: 'Remediation',
            accessorFn: (control: WorkloadConfigurationScan.Control) =>
              controlLibrary.find(controlInfo => controlInfo.controlID === control.controlID)
                ?.remediation,
          },
          {
            header: '',
            accessorFn: (control: WorkloadConfigurationScan.Control) => {
              if (control.rules.some(rule => rule.paths)) {
                return (
                  <HeadlampLink
                    routeName={RoutingPath.KubescapeWorkloadConfigurationScanFixes}
                    params={{
                      name: workloadConfigurationScan.metadata.name,
                      namespace: workloadConfigurationScan.metadata.namespace,
                      control: control.controlID,
                    }}
                  >
                    Fix
                  </HeadlampLink>
                );
              }
            },
            gridTemplate: 'min-content',
          },
        ]}
      />
    </SectionBox>
  );
}

function getResults(scan: WorkloadConfigurationScan): string {
  let failCount: number = 0;
  let passedCount: number = 0;
  let skippedCount: number = 0;
  for (const data of Object.values(scan.spec.controls)) {
    switch (data.status.status) {
      case 'failed': {
        failCount++;
        break;
      }
      case 'passed': {
        passedCount++;
        break;
      }
      case 'skipped': {
        skippedCount++;
        break;
      }
    }
  }

  return `Failed ${failCount}, Passed ${passedCount}, Skipped ${skippedCount}`;
}

function makeStatusLabel(control: WorkloadConfigurationScan.Control) {
  let status: StatusLabelProps['status'] = '';
  const statusLabel: string = control.status.status;

  if (statusLabel === 'failed') {
    status = 'error';
  } else {
    status = 'success';
  }

  return (
    <StatusLabel status={status}>
      {statusLabel}
      {statusLabel === 'failed' && (
        <Box
          aria-label="hidden"
          display="inline"
          paddingTop={1}
          paddingLeft={0.5}
          style={{ verticalAlign: 'text-top' }}
        ></Box>
      )}
    </StatusLabel>
  );
}
