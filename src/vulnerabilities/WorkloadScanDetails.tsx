/* 
  Show vulnerability scan results for a workload. 
*/
import { ApiProxy, KubeObject } from '@kinvolk/headlamp-plugin/lib';
import { NameValueTable, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Link } from '@mui/material';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router';
import expandableDescription from '../common/AccordionText';
import makeSeverityLabel from '../common/SeverityLabel';
import { VulnerabilityManifest } from '../softwarecomposition/VulnerabilityManifest';
import { VulnerabilityManifestSummary } from '../softwarecomposition/VulnerabilityManifestSummary';
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
export async function fetchVulnerabilityManifest(name: string, namespace: string) {
  function getVulnerabilityManifestSummary(): Promise<any> {
    return ApiProxy.request(
      `/apis/spdx.softwarecomposition.kubescape.io/v1beta1/namespaces/${namespace}/vulnerabilitymanifestsummaries/${name}`
    );
  }

  function getVulnerabilityManifest(name: string): Promise<any> {
    if (name === '') {
      return Promise.resolve();
    }
    return ApiProxy.request(
      `/apis/spdx.softwarecomposition.kubescape.io/v1beta1/namespaces/kubescape/vulnerabilitymanifests/${name}`
    );
  }

  const summary = await getVulnerabilityManifestSummary();
  let allManifest: VulnerabilityManifest | null = null;
  await getVulnerabilityManifest(summary.spec.vulnerabilitiesRef.all.name)
    .then(result => {
      allManifest = result;
    })
    .catch(error => console.log(error.message));
  let relevantManifest: VulnerabilityManifest | null = null;
  await getVulnerabilityManifest(summary.spec.vulnerabilitiesRef.relevant.name)
    .then(result => {
      relevantManifest = result;
    })
    .catch(error => console.log(error.message));

  return [summary, allManifest, relevantManifest]; // TODO reduce
}

function VulnerabilityManifestDetailView(props: { name: string; namespace: string }) {
  const { name, namespace } = props;
  const [summary, setSummary]: [VulnerabilityManifestSummary | null, any] =
    React.useState<VulnerabilityManifestSummary | null>(null);
  const [manifestAll, setManifestAll]: [VulnerabilityManifest | null, any] =
    React.useState<VulnerabilityManifest | null>(null);
  const [manifestRelevant, setManifestRelevant]: [VulnerabilityManifest | null, any] =
    React.useState<VulnerabilityManifest | null>(null);

  useEffect(() => {
    fetchVulnerabilityManifest(name, namespace).then((response: string[]) => {
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
            ]}
          />

          {manifestAll && <Matches manifest={manifestAll} relevant={manifestRelevant} />}
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

function Matches(props: { manifest: KubeObject; relevant: KubeObject }) {
  const { manifest, relevant } = props;
  const results: VulnerabilityManifest.Match[] = manifest?.spec.payload.matches;

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
            accessorFn: (item: VulnerabilityManifest.Match) => {
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
            accessorFn: (item: VulnerabilityManifest.Match) => item.artifact.name,
            gridTemplate: 'auto',
          },
          {
            header: 'Version',
            accessorFn: (item: VulnerabilityManifest.Match) => item.artifact.version,
            gridTemplate: 'auto',
          },
          {
            header: 'Severity',
            accessorFn: (item: VulnerabilityManifest.Match) =>
              makeSeverityLabel(item.vulnerability.severity),
            gridTemplate: 'auto',
          },
          {
            header: 'Relevant',
            accessorFn: (item: VulnerabilityManifest.Match) =>
              relevant && isRelevant(relevant, item.vulnerability.id),
            gridTemplate: 'auto',
          },
          {
            header: 'Fix',
            accessorFn: (item: VulnerabilityManifest.Match) => item.vulnerability.fix.state,
            gridTemplate: 'auto',
          },
          {
            header: 'Fix in version',
            accessorFn: (item: VulnerabilityManifest.Match) =>
              item.vulnerability.fix?.versions && Array.isArray(item.vulnerability.fix?.versions)
                ? item.vulnerability.fix.versions.join(', ')
                : '',
            gridTemplate: 'auto',
          },
          {
            header: 'Description',
            accessorFn: (item: VulnerabilityManifest.Match) =>
              expandableDescription(item.vulnerability.description),
          },
        ]}
      />
    </SectionBox>
  );
}

function isRelevant(relevantManifest: KubeObject, id: string): string {
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
