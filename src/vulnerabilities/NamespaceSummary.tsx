import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { MainInfoSection, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
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
      {vulnerabilitySummary && (
        <MainInfoSection
          title="Namespace Vulnerabilities Summary"
          resource={vulnerabilitySummary}
        />
      )}

      {vulnerabilitySummary && (
        <VulnerabilityScans
          vulnerabilityScans={vulnerabilitySummary.jsonData.spec.vulnerabilitiesRef}
        />
      )}
    </>
  );
}

function VulnerabilityScans(props) {
  const { vulnerabilityScans } = props;

  return (
    <SectionBox title="Vulnerability scans">
      <Table
        data={vulnerabilityScans}
        columns={[
          {
            header: 'Name',
            accessorFn: item => {
              return (
                <Link
                  routeName={`/kubescape/vulnerabilities/:namespace/:name`}
                  params={{
                    name: item.name,
                    namespace: item.namespace,
                  }}
                >
                  {item.name}
                </Link>
              );
            },
          },
        ]}
      />
    </SectionBox>
  );
}
