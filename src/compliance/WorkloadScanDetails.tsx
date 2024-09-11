/* 
  Show configuration scan results for a workload. 
*/
import {
  Link as HeadlampLink,
  MainInfoSection,
  SectionBox,
  StatusLabel,
  StatusLabelProps,
  Table as HeadlampTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { Box, Link } from '@mui/material';
import React from 'react';
import { useLocation } from 'react-router';
import { workloadConfigurationScanClass } from '../model';
import { WorkloadConfigurationScan } from '../softwarecomposition/WorkloadConfigurationScan';
import { controlLibrary } from './controlLibrary';

export default function KubescapeWorkloadConfigurationScanDetails() {
  const location = useLocation();
  const segments = location.pathname.split('/');

  // The second last segment is the namespace
  const namespace = segments[segments.length - 2];
  // The last segment is the name
  const name = segments[segments.length - 1];

  return <WorkloadConfigurationScanDetailView name={name} namespace={namespace} />;
}

function prepareExtraInfo(cr: KubeObject): { name: string; value: string }[] {
  const extraInfo: { name: string; value: string }[] = [];

  const controls: WorkloadConfigurationScan.Controls = cr.jsonData.spec.controls;

  const entries = Object.keys(controls).map(key => controls[key]);
  let failCount: number = 0;
  let passedCount: number = 0;
  let skippedCount: number = 0;
  for (const data of entries) {
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

  extraInfo.push({
    name: 'Failed',
    value: failCount.toString(),
  });
  extraInfo.push({
    name: 'Passed',
    value: passedCount.toString(),
  });
  extraInfo.push({
    name: 'Skipped',
    value: skippedCount.toString(),
  });

  return extraInfo;
}

function WorkloadConfigurationScanDetailView(props: { name: string; namespace: string }) {
  const { name, namespace } = props;
  const [cr, setCr]: [KubeObject, any] = React.useState(null);

  workloadConfigurationScanClass.useApiGet(setCr, name, namespace);

  return (
    <>
      {cr && (
        <MainInfoSection
          title="Workload Configuration Scan"
          resource={cr}
          extraInfo={prepareExtraInfo(cr)}
        />
      )}

      {cr && (
        <Controls controls={cr.jsonData.spec.controls} workloadConfigurationScan={cr.jsonData} />
      )}

      {/* <SectionBox title="Details">
        <pre>{YAML.stringify(cr?.jsonData)}</pre>
      </SectionBox> */}
    </>
  );
}

function Controls(props: {
  controls: WorkloadConfigurationScan.Controls;
  workloadConfigurationScan: WorkloadConfigurationScan;
}) {
  const { controls, workloadConfigurationScan } = props;

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
            accessorFn: (control: WorkloadConfigurationScan.Control) => {
              return (
                <Link
                  target="_blank"
                  href={'https://hub.armosec.io/docs/' + control.controlID.toLowerCase()}
                >
                  {control.controlID}
                </Link>
              );
            },
            gridTemplate: 'min-content',
          },
          {
            header: 'Name',
            accessorFn: (control: WorkloadConfigurationScan.Control) => control.name,
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
            accessorFn: (control: WorkloadConfigurationScan.Control) => control.severity.severity,
            gridTemplate: 'min-content',
          },
          {
            header: 'Score',
            accessorFn: (control: WorkloadConfigurationScan.Control) =>
              control.severity.scoreFactor,
            gridTemplate: 'min-content',
          },
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
                    routeName={`/kubescape/compliance/namespaces/:namespace/:kind/:name/:control`}
                    params={{
                      name: workloadConfigurationScan.metadata.labels['kubescape.io/workload-name'],
                      namespace: workloadConfigurationScan.metadata.namespace,
                      kind: workloadConfigurationScan.metadata.labels[
                        'kubescape.io/workload-kind'
                      ].toLowerCase(),
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
