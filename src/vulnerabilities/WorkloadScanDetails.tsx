/* 
  Show vulnerability scan results for a workload. 
*/
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import {
  NameValueTable,
  SectionBox,
  ShowHideLabel,
  Table as HeadlampTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { createRouteURL } from '@kinvolk/headlamp-plugin/lib/Router';
import { Link, Tooltip } from '@mui/material';
import React, { useEffect } from 'react';
import makeSeverityLabel from '../common/SeverityLabel';
import { getURLSegments } from '../common/url';
import { RoutingPath } from '../index';
import { OpenVulnerabilityExchangeContainer } from '../softwarecomposition/OpenVulnerabilityExchangeContainer';
import { VulnerabilityManifest } from '../softwarecomposition/VulnerabilityManifest';
import { VulnerabilityManifestSummary } from '../softwarecomposition/VulnerabilityManifestSummary';
import { getCVESummary } from './CVESummary';
import { globalOpenVulnerabilityExchangeContainers } from './Vulnerabilities';

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
            accessorKey: 'vulnerability.id',
            Cell: ({ cell }: any) => (
              <Link target="_blank" href={cell.row.original.vulnerability.dataSource}>
                {cell.getValue()}
              </Link>
            ),
            gridTemplate: 'auto',
          },
          {
            header: 'Artifact',
            accessorKey: 'artifact.name',
            gridTemplate: 'auto',
          },
          {
            header: 'Version',
            accessorKey: 'artifact.version',
            gridTemplate: 'auto',
          },
          {
            header: 'Severity',
            accessorKey: 'vulnerability.severity',
            Cell: ({ cell }: any) => makeSeverityLabel(cell.getValue()),
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
            header: 'Affected',
            accessorFn: (item: VulnerabilityManifest.Match) => {
              const statement = getStatement(manifest, item);
              if (statement) {
                return (
                  <Tooltip
                    title={statement.impact_statement}
                    slotProps={{ tooltip: { sx: { fontSize: '0.9em' } } }}
                  >
                    {statement.status === OpenVulnerabilityExchangeContainer.AffectedStatus.Affected
                      ? 'Yes'
                      : 'No'}
                  </Tooltip>
                );
              }
              return '';
            },
          },
          {
            header: 'Fix',
            accessorKey: 'vulnerability.fix.state',
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
            accessorKey: 'vulnerability.description',
            Cell: ({ cell }: any) => <ShowHideLabel>{cell.getValue()}</ShowHideLabel>,
          },
        ]}
      />
    </SectionBox>
  );
}

function getStatement(
  vm: VulnerabilityManifest,
  match: VulnerabilityManifest.Match
): OpenVulnerabilityExchangeContainer.Statement | null {
  if (globalOpenVulnerabilityExchangeContainers) {
    for (const vex of globalOpenVulnerabilityExchangeContainers) {
      if (
        vex.metadata.annotations['kubescape.io/image-tag'] ===
        vm.metadata.annotations['kubescape.io/image-tag']
      ) {
        for (const statement of vex.spec.statements) {
          if (statement.vulnerability['@id'] === match.vulnerability.id) {
            return statement;
          }
        }
      }
    }
  }
  return null;
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
