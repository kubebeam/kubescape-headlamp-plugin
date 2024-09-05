import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  NameValueTable,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import React from 'react';
import { useLocation } from 'react-router';
import { vulnerabilitySummaryClass } from '../model';

export default function VulnerabilitiesNamespaceSummary() {
  const location = useLocation();
  const segments = location.pathname.split('/');

  // The last segment is the namespace
  const namespace = segments[segments.length - 1];

  return <NamespaceSummaryView namespace={namespace} />;
}

function NamespaceSummaryView(props) {
  const { namespace } = props;
  const [vulnerabilitySummary, setVulnerabilitySummary] = React.useState(null);

  vulnerabilitySummaryClass.useApiGet(setVulnerabilitySummary, namespace);

  return (
    <>
      {vulnerabilitySummary && <Maininfo vulnerabilitySummary={vulnerabilitySummary} />}

      {vulnerabilitySummary && (
        <VulnerabilityScans
          vulnerabilityScans={vulnerabilitySummary.jsonData.spec.vulnerabilitiesRef}
        />
      )}
    </>
  );
}

function Maininfo(props) {
  const { vulnerabilitySummary } = props;
  return (
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
  );
}

function VulnerabilityScans(props) {
  const { vulnerabilityScans } = props;

  return (
    <SectionBox title="Image scans">
      <Table
        data={vulnerabilityScans}
        columns={[
          {
            header: 'Workload',
            accessorFn: item => {
              return (
                <Link
                  routeName={`/kubescape/vulnerabilities/namespaces/:namespace/:name`}
                  params={{
                    name: item.name,
                    namespace: item.namespace,
                  }}
                >
                  {item.name.split('-')?.slice(1).join('-')}
                </Link>
              );
            },
          },
          {
            header: 'Kind',
            accessorFn: item => {
              const kind = item.name.split('-')?.[0];
              return kind[0].toUpperCase() + kind.slice(1);
            },
          },
        ]}
      />
    </SectionBox>
  );
}
