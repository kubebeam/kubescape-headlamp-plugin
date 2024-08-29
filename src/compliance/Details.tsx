import {
  MainInfoSection,
  SectionBox,
  StatusLabel,
  StatusLabelProps,
  Table,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Link } from '@mui/material';
import React from 'react';
import { useLocation } from 'react-router';
import YAML from 'yaml';
import { workloadConfigurationScanClass } from '../model';
import controlLibrary from './controlLibrary.js';

export default function KubescapeWorkloadConfigurationScanDetails() {
  const location = useLocation();
  const segments = location.pathname.split('/');

  // The second last segment is the namespace
  const namespace = segments[segments.length - 2];
  // The last segment is the name
  const name = segments[segments.length - 1];

  return <WorkloadConfigurationScanDetailView name={name} namespace={namespace} />;
}

function prepareExtraInfo(cr) {
  const extraInfo = [];

  const controls = cr.jsonData.spec.controls;

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
    value: failCount,
  });
  extraInfo.push({
    name: 'Passed',
    value: passedCount,
  });
  extraInfo.push({
    name: 'Skipped',
    value: skippedCount,
  });

  return extraInfo;
}

function WorkloadConfigurationScanDetailView(props) {
  const { name, namespace } = props;
  const [cr, setCr] = React.useState(null);

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

      <SectionBox title="Details">
        <pre>{YAML.stringify(cr?.jsonData)}</pre>
      </SectionBox>
    </>
  );
}

function Controls(props) {
  const { controls } = props;

  const entries = Object.keys(controls).map(key => controls[key]);

  return (
    <SectionBox title="Controls">
      <Table
        data={entries}
        columns={[
          {
            header: 'Status',
            accessorFn: item => makeStatusLabel(item),
            gridTemplate: 'min-content',
          },
          {
            header: 'Control',
            accessorFn: item => {
              return (
                <Link href={'https://hub.armosec.io/docs/' + item.controlID.toLowerCase()}>
                  {item.controlID}
                </Link>
              );
            },
            gridTemplate: 'min-content',
          },
          {
            header: 'Name',
            accessorFn: item => item.name,
          },
          {
            header: 'Severity',
            accessorFn: item => item.severity.severity,
            gridTemplate: 'min-content',
          },
          {
            header: 'Score',
            accessorFn: item => item.severity.scoreFactor,
            gridTemplate: 'min-content',
          },
          {
            header: 'Explain',
            accessorFn: item => explain(item),
          },
          {
            header: 'Remediation',
            accessorFn: item => remediation(item),
          },
        ]}
      />
    </SectionBox>
  );
}

function explain(item) {
  for (const data of controlLibrary) {
    if (data.controlID === item.controlID) {
      return data.description;
    }
  }
}

function remediation(item) {
  for (const data of controlLibrary) {
    if (data.controlID === item.controlID) {
      return data.remediation;
    }
  }
}

function makeStatusLabel(item) {
  let status: StatusLabelProps['status'] = '';
  const statusLabel: string = item.status.status;

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
