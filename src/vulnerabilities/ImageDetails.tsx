/* 
  Show vulnerability scan results for a container image. 
*/
import { NameValueTable, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Link } from '@mui/material';
import React from 'react';
import { useLocation } from 'react-router';
import makeSeverityLabel from '../common/SeverityLabel';
import { vulnerabilityManifestClass } from '../model';

export default function ImageVulnerabilityDetails() {
  const location = useLocation();
  const segments = location.pathname.split('/');

  // The last segment is the manifest name
  const name = segments[segments.length - 1];

  return <ImageVulnerabilityDetailsView name={name} />;
}

function ImageVulnerabilityDetailsView(props) {
  const { name } = props;
  const [manifestVulnerability, setVulnerabilityManifest] = React.useState(null);

  vulnerabilityManifestClass.useApiGet(setVulnerabilityManifest, name, 'kubescape');

  return (
    manifestVulnerability && (
      <>
        <SectionBox title="Image Vulnerabilities">
          <NameValueTable
            rows={[
              {
                name: 'Image',
                value: manifestVulnerability.metadata.annotations['kubescape.io/image-tag'],
              },
              {
                name: 'Last scan',
                value: manifestVulnerability.metadata.creationTimestamp,
              },
            ]}
          />
        </SectionBox>

        <Matches manifestVulnerability={manifestVulnerability.jsonData} />
        {/* <SectionBox title="Summary">
          <pre>{manifestVulnerability ? YAML.stringify(manifestVulnerability) : 'Not found'}</pre>
        </SectionBox> */}
      </>
    )
  );
}

function Matches(props) {
  const { manifestVulnerability } = props;
  const results = manifestVulnerability?.spec.payload.matches;

  if (results) {
    results.sort((a, b) => {
      if (a.vulnerability.severity < b.vulnerability.severity) {
        return -1;
      }
      if (a.vulnerability.severity > b.vulnerability.severity) {
        return 1;
      }
      return 0;
    });
  }

  return (
    <SectionBox title="Findings">
      <Table
        data={results}
        columns={[
          {
            header: 'CVE',
            accessorFn: item => {
              return (
                <Link target="_blank" href={item.vulnerability.dataSource}>
                  {item.vulnerability.id}
                </Link>
              );
            },
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
            header: 'Severity',
            accessorFn: item => makeSeverityLabel(item.vulnerability.severity),
            gridTemplate: 'auto',
          },
          {
            header: 'Fix',
            accessorFn: item => item.vulnerability.fix.state,
            gridTemplate: 'auto',
          },
          {
            header: 'Fix in version',
            accessorFn: item =>
              item.vulnerability.fix?.versions && Array.isArray(item.vulnerability.fix?.versions)
                ? item.vulnerability.fix.versions.join(', ')
                : '',
            gridTemplate: 'auto',
          },
          {
            header: 'Description',
            accessorFn: item =>
              item.vulnerability.description
                ? item.vulnerability.description.substr(0, 100) + '...'
                : '',
          },
        ]}
      />
    </SectionBox>
  );
}
