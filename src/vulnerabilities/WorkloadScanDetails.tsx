/* 
  Show vulnerability scan results for a workload. 
*/
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import {
  NameValueTable,
  SectionBox,
  Table as HeadlampTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { createRouteURL } from '@kinvolk/headlamp-plugin/lib/Router';
import { Link } from '@mui/material';
import React, { useEffect } from 'react';
import expandableDescription from '../common/AccordionText';
import makeSeverityLabel from '../common/SeverityLabel';
import { RoutingPath } from '../index';
import { VulnerabilityManifest } from '../softwarecomposition/VulnerabilityManifest';
import { VulnerabilityManifestSummary } from '../softwarecomposition/VulnerabilityManifestSummary';
import { getURLSegments } from '../utils/url';
import { getCVESummary } from './CVESummary';

export default function KubescapeVulnerabilityDetails() {
  const [name, namespace] = getURLSegments(-1, -2);

  const [summary, setSummary] = React.useState<VulnerabilityManifestSummary | null>(null);
  const [manifestAll, setManifestAll] = React.useState<VulnerabilityManifest | null>(null);
  const [manifestRelevant, setManifestRelevant] = React.useState<VulnerabilityManifest | null>(
    null
  );

  useEffect(() => {
    fetchVulnerabilityManifest(name, namespace).then((response: any[]) => {
      setSummary(response[0]);
      setManifestAll(response[1]);
      setManifestRelevant(response[2]);
    });
  }, []);

  return (
    summary && (
      <>
        <SectionBox
          title="Vulnerabilities"
          backLink={createRouteURL(RoutingPath.KubescapeVulnerabilities)}
        >
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
                value: getCVESummary(summary, true, true),
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

function Matches(props: {
  manifest: VulnerabilityManifest;
  relevant: VulnerabilityManifest | null;
}) {
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
      <HeadlampTable
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
            accessorFn: (item: VulnerabilityManifest.Match) => {
              if (
                relevant?.spec.payload.matches &&
                relevant?.spec.payload.matches.some(
                  match => match.vulnerability.id === item.vulnerability.id
                )
              ) {
                return 'Yes';
              }
            },
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
