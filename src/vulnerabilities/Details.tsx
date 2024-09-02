import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import {
  NameValueTable,
  SectionBox,
  StatusLabel,
  StatusLabelProps,
  Table,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Link } from '@mui/material';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router';
import { getCVESummary } from './CVESummary';

export default function KubescapeVulnerabilityDetails() {
  const location = useLocation();
  const segments = location.pathname.split('/');

  // The second last segment is the namespace
  const namespace = segments[segments.length - 2];
  // The last segment is the name
  const name = segments[segments.length - 1];

  return <VulnerabilityManifestDetailView name={name} namespace={namespace} />;
}

// Fetch vulnerabilitymanifestsummary and then vulnerabilitymanifest (if available)
export async function fetchVulnerabilityManifest(name, namespace) {
  function getVulnerabilityManifestSummary(): Promise<any> {
    return ApiProxy.request(
      `/apis/spdx.softwarecomposition.kubescape.io/v1beta1/namespaces/${namespace}/vulnerabilitymanifestsummaries/${name}`
    );
  }

  function getVulnerabilityManifest(name): Promise<any> {
    if (name === '') {
      return Promise.resolve();
    }
    return ApiProxy.request(
      `/apis/spdx.softwarecomposition.kubescape.io/v1beta1/namespaces/kubescape/vulnerabilitymanifests/${name}`
    );
  }

  const summary = await getVulnerabilityManifestSummary();
  let allManifest: any = null;
  await getVulnerabilityManifest(summary.spec.vulnerabilitiesRef.all.name)
    .then(result => {
      allManifest = result;
    })
    .catch(error => console.log(error.message));
  let relevantManifest: any = null;
  await getVulnerabilityManifest(summary.spec.vulnerabilitiesRef.relevant.name)
    .then(result => {
      relevantManifest = result;
    })
    .catch(error => console.log(error.message));

  return [summary, allManifest, relevantManifest];
}

function VulnerabilityManifestDetailView(props) {
  const { name, namespace } = props;
  const [summary, setSummary] = React.useState(null);
  const [manifestAll, setManifestAll] = React.useState(null);
  const [manifestRelevant, setManifestRelevant] = React.useState(null);

  useEffect(() => {
    fetchVulnerabilityManifest(name, namespace).then(response => {
      setSummary(response[0]);
      setManifestAll(response[1]);
      setManifestRelevant(response[2]);
    });
  }, []);

  return (
    summary && (
      <>
        <SectionBox title="Vulnerabilities">
          <NameValueTable
            rows={[
              {
                name: 'Workload',
                value: summary.metadata.labels['kubescape.io/workload-name'],
              },
              {
                name: 'Namespace',
                value: summary.metadata.labels['kubescape.io/workload-namespace'],
              },
              {
                name: 'Container',
                value: summary.metadata.labels['kubescape.io/workload-container-name'],
              },
              {
                name: 'Kind',
                value: summary.metadata.labels['kubescape.io/workload-kind'],
              },
              {
                name: 'Image',
                value: summary.metadata.annotations['kubescape.io/image-tag'],
              },
              {
                name: 'Last scan',
                value: summary.metadata.creationTimestamp,
              },
              {
                name: 'Type',
                value: manifestAll?.spec.payload.source.type,
              },
              {
                name: 'CVE',
                value: getCVESummary(summary),
              },
              {
                name: 'Summary',
                value: summary?.metadata.name,
              },
              {
                name: 'All',
                value: (
                  <Link
                    routeName={`/kubescape/vulnerabilitymanifests/kubescape/:name`}
                    params={{
                      name: summary.spec.vulnerabilitiesRef.all.name,
                    }}
                  >
                    {summary.spec.vulnerabilitiesRef.all.name}
                  </Link>
                ),
              },
              {
                name: 'Relevant Findings',
                value: (
                  <Link
                    routeName={`/kubescape/vulnerabilitymanifests/kubescape/:name`}
                    params={{
                      name: summary.spec.vulnerabilitiesRef.relevant.name,
                    }}
                  >
                    {summary.spec.vulnerabilitiesRef.relevant.name}
                  </Link>
                ),
              },
            ]}
          />

          {manifestAll && manifestRelevant && (
            <Matches manifest={manifestAll} relevant={manifestRelevant} />
          )}
          {manifestAll && manifestRelevant == null && (
            <Matches manifest={manifestAll} relevant={null} />
          )}
        </SectionBox>

        {/* <SectionBox title="Summary">
          <pre>{manifestAll ? YAML.stringify(manifestAll) : 'Not found'}</pre>
        </SectionBox>

        <SectionBox title="Manifest Relevant">
          <pre>{manifestRelevant ? YAML.stringify(manifestRelevant) : 'Not found'}</pre>
        </SectionBox> */}
      </>
    )
  );
}

function Matches(props) {
  const { manifest, relevant } = props;
  const results = manifest?.spec.payload.matches;

  return (
    <SectionBox title="Findings">
      <Table
        data={results}
        columns={[
          {
            header: 'CVE',
            accessorFn: item => {
              return <Link href={item.vulnerability.dataSource}>{item.vulnerability.id}</Link>;
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
            accessorFn: item => makeSeverityLabel(item),
            gridTemplate: 'auto',
          },
          {
            header: 'Relevant',
            accessorFn: item => relevant && isRelevant(relevant, item.vulnerability.id),
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

function isRelevant(relevantManifest, id): string {
  const matches: any | undefined = relevantManifest?.spec.payload.matches;

  if (matches) {
    for (const match of matches) {
      if (match.vulnerability.id === id) {
        return 'Yes';
      }
    }
  }
  return '';
}
