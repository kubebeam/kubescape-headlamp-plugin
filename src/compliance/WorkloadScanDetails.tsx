/* 
  Show configuration scan results for a workload. 
*/
import {
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

      {cr && <Controls controls={cr.jsonData.spec.controls} />}

      {/* <SectionBox title="Details">
        <pre>{YAML.stringify(cr?.jsonData)}</pre>
      </SectionBox> */}
    </>
  );
}

function Controls(props: { controls: WorkloadConfigurationScan.Controls }) {
  const { controls } = props;

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
            accessorFn: (control: WorkloadConfigurationScan.Control) => explain(control),
          },
          {
            header: 'Remediation',
            accessorFn: (control: WorkloadConfigurationScan.Control) => remediation(control),
          },
        ]}
      />
    </SectionBox>
  );
}

function explain(control: WorkloadConfigurationScan.Control) {
  for (const data of controlLibrary) {
    if (data.controlID === control.controlID) {
      return data.description;
    }
  }
}

function remediation(control: WorkloadConfigurationScan.Control) {
  for (const data of controlLibrary) {
    if (data.controlID === control.controlID) {
      return data.remediation;
    }
  }
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
