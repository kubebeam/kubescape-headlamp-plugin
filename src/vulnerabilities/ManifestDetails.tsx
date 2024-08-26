import {
  NameValueTable,
  SectionBox,
  StatusLabel,
  StatusLabelProps,
  Table,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Link } from '@mui/material';
import React from 'react';
import { useLocation } from 'react-router';

import { vulnerabilityManifestClass } from '../model';

export default function KubescapeVulnerabilityManifestDetails() {
  const location = useLocation();
  const segments = location.pathname.split('/');

  // The second last segment is the namespace
  const namespace = segments[segments.length - 2];
  // The last segment is the name
  const name = segments[segments.length - 1];

  return <VulnerabilityManifestDetailView name={name} namespace={namespace} />;
}

function getCVESummary(cr) {
  const matches = cr?.jsonData.spec.payload.matches;

  let criticalCount: number = 0;
  let mediumCount: number = 0;
  let highCount: number = 0;
  let lowCount: number = 0;
  let negligibleCount: number = 0;
  let unknownCount: number = 0;

  for (const data of matches) {
    switch (data.vulnerability.severity) {
      case 'Critical': {
        criticalCount++;
        break;
      }
      case 'High': {
        highCount++;
        break;
      }
      case 'Medium': {
        mediumCount++;
        break;
      }
      case 'Low': {
        lowCount++;
        break;
      }
      case 'Negligible': {
        negligibleCount++;
        break;
      }
      case 'Unknown': {
        unknownCount++;
        break;
      }
    }
  }

  return `Critical :${criticalCount} High: ${highCount} Medium: ${mediumCount}`;
}

function VulnerabilityManifestDetailView(props) {
  const { name, namespace } = props;
  const [cr, setCr] = React.useState(null);

  vulnerabilityManifestClass.useApiGet(setCr, name, namespace);

  return (
    <>
      {cr && (
        <SectionBox title="Vulnerabilities">
          <NameValueTable
            rows={[
              {
                name: 'Workload',
                value: cr.jsonData.metadata.labels['kubescape.io/workload-name'],
              },
              {
                name: 'Namespace',
                value: cr.jsonData.metadata.labels['kubescape.io/workload-namespace'],
              },
              {
                name: 'Container',
                value: cr.jsonData.metadata.labels['kubescape.io/workload-container-name'],
              },
              {
                name: 'Kind',
                value: cr.jsonData.metadata.labels['kubescape.io/workload-kind'],
              },
              {
                name: 'Image',
                value: cr.jsonData.metadata.annotations['kubescape.io/image-tag'],
              },
              {
                name: 'Last scan',
                value: cr.jsonData.metadata.creationTimestamp,
              },
              {
                name: 'Type',
                value: cr.jsonData.spec.payload.source.type,
              },
              {
                name: 'CVE',
                value: getCVESummary(cr),
              },
            ]}
          />
        </SectionBox>
      )}

      {cr && <Matches cr={cr} />}

      {/* 
      <SectionBox title="YAML">
        <pre>{YAML.stringify(cr)}</pre>
      </SectionBox> */}
    </>
  );
}

function Matches(props) {
  const { cr } = props;
  const results = cr?.jsonData.spec.payload.matches;

  return (
    <SectionBox title="Findings">
      <Table
        data={results}
        columns={[
          {
            header: 'Severity',
            accessorFn: item => makeSeverityLabel(item),
            gridTemplate: 'auto',
          },
          {
            header: 'Artifact',
            accessorFn: item => item.artifact.name,
            gridTemplate: 'auto',
          },
          {
            header: 'Version',
            accessorFn: item => item.artifact.version,
            gridTemplate: 'auto',
          },
          {
            header: 'Language',
            accessorFn: item => item.artifact.language,
            gridTemplate: 'auto',
          },
          {
            header: 'CVE',
            accessorFn: item => {
              return <Link href={item.vulnerability.dataSource}>{item.vulnerability.id}</Link>;
            },
            gridTemplate: 'auto',
          },
          {
            header: 'Fix',
            accessorFn: item => item.vulnerability.fix.state,
            gridTemplate: 'auto',
          },
          {
            header: 'Description',
            accessorFn: item => item.vulnerability.description,
          },
        ]}
      />
    </SectionBox>
  );
}

function makeSeverityLabel(item) {
  const severity = item.vulnerability.severity;
  let status: StatusLabelProps['status'] = '';

  if (severity === 'Critical') {
    status = 'error';
  } else {
    status = 'success';
  }

  return (
    <StatusLabel status={status}>
      {severity}
      {severity === 'Critical' && (
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
