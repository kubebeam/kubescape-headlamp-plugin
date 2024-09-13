/* 
  Show the vulnerability issues for workloads in a single namespace.  
*/
import {
  Link as HeadlampLink,
  NameValueTable,
  SectionBox,
  Table as HeadlampTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import React from 'react';
import { Path } from '../index';
import { vulnerabilitySummaryClass } from '../model';
import { VulnerabilitySummary } from '../softwarecomposition/VulnerabilitySummary';
import { getLastURLSegment } from '../utils/url';

export default function VulnerabilitiesNamespaceSummary() {
  const namespace = getLastURLSegment();
  const [vulnerabilitySummaryKubeobject, setVulnerabilitySummary]: [KubeObject, any] =
    React.useState(null);

  vulnerabilitySummaryClass.useApiGet(setVulnerabilitySummary, namespace);

  if (!vulnerabilitySummaryKubeobject) {
    return <div></div>;
  }

  const vulnerabilitySummary: VulnerabilitySummary = vulnerabilitySummaryKubeobject.jsonData;
  return (
    <>
      <SectionBox title="Namespace Vulnerabilities">
        <NameValueTable
          rows={[
            {
              name: 'Namespace',
              value: vulnerabilitySummary.metadata.name,
            },
          ]}
        />
      </SectionBox>
      <VulnerabilityScans vulnerabilityScans={vulnerabilitySummary.spec.vulnerabilitiesRef} />
    </>
  );
}

function VulnerabilityScans(props: {
  vulnerabilityScans: VulnerabilitySummary.VulnerabilityReference[];
}) {
  const { vulnerabilityScans } = props;

  return (
    <SectionBox title="Image scans">
      <HeadlampTable
        data={vulnerabilityScans}
        columns={[
          {
            header: 'Workload',
            accessorFn: (item: VulnerabilitySummary.VulnerabilityReference) => {
              return (
                <HeadlampLink
                  routeName={Path.KubescapeVulnerabilityDetails}
                  params={{
                    name: item.name,
                    namespace: item.namespace,
                  }}
                >
                  {item.name.split('-')?.slice(1).join('-')}
                </HeadlampLink>
              );
            },
          },
          {
            header: 'Kind',
            accessorFn: (item: VulnerabilitySummary.VulnerabilityReference) => {
              const kind = item.name.split('-')?.[0];
              return kind[0].toUpperCase() + kind.slice(1);
            },
          },
        ]}
      />
    </SectionBox>
  );
}
