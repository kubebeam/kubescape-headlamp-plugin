/* 
  Show vulnerability scan results for a container image. 
*/
import {
  NameValueTable,
  SectionBox,
  Table as HeadlampTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { createRouteURL } from '@kinvolk/headlamp-plugin/lib/Router';
import { Link } from '@mui/material';
import { useState } from 'react';
import expandableDescription from '../common/AccordionText';
import makeSeverityLabel from '../common/SeverityLabel';
import { getLastURLSegment } from '../common/url';
import { RoutingPath } from '../index';
import { vulnerabilityManifestClass } from '../model';
import { VulnerabilityManifest } from '../softwarecomposition/VulnerabilityManifest';

export default function ImageVulnerabilityDetails() {
  const name = getLastURLSegment();
  const [manifestVulnerability, setVulnerabilityManifest] = useState<KubeObject>(null);

  vulnerabilityManifestClass.useApiGet(setVulnerabilityManifest, name, 'kubescape');

  return (
    manifestVulnerability && (
      <>
        <SectionBox
          title="Image Vulnerabilities"
          backLink={createRouteURL(RoutingPath.KubescapeVulnerabilities)}
        >
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

function Matches(props: { manifestVulnerability: VulnerabilityManifest }) {
  const { manifestVulnerability } = props;
  const results = manifestVulnerability.spec.payload.matches;

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
            header: 'Severity',
            accessorKey: 'vulnerability.severity',
            Cell: ({ cell }: any) => makeSeverityLabel(cell.getValue()),
            gridTemplate: 'auto',
          },
          {
            header: 'CVE',
            accessorKey: 'vulnerability.id',
            Cell: ({ cell }: any) => {
              return (
                <Link target="_blank" href={cell.row.original.vulnerability.dataSource}>
                  {cell.getValue()}
                </Link>
              );
            },
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
            accessorFn: (item: VulnerabilityManifest.Match) => {
              let relatedDescription: string = '';
              if (item.relatedVulnerabilities) {
                for (const related of item.relatedVulnerabilities) {
                  if (related.id === item.vulnerability.id) {
                    relatedDescription = related.description;
                  }
                }
              }
              return expandableDescription(
                item.vulnerability.description ?? relatedDescription,
                '3'
              );
            },
          },
        ]}
      />
    </SectionBox>
  );
}
