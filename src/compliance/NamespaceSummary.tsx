import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { MainInfoSection, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import React from 'react';
import { useLocation } from 'react-router';
import { configurationScanSummaries } from '../model';

export default function KubescapeConfigurationScanNamespaceSummary() {
  const location = useLocation();
  const segments = location.pathname.split('/');

  // The last segment is the namespace
  const namespace = segments[segments.length - 1];

  return <ConfigurationScanNamespaceSummaryView namespace={namespace} />;
}

function ConfigurationScanNamespaceSummaryView(props) {
  const { namespace } = props;
  const [cr, setCr] = React.useState(null);

  configurationScanSummaries.useApiGet(setCr, namespace);

  return (
    <>
      {cr && <MainInfoSection title="Namespace Configuration Scan Summary" resource={cr} />}

      {cr && <ConfigurationScans configurationScans={cr.jsonData.spec.summaryRef} />}

      {/* <SectionBox title="Details">
        <pre>{YAML.stringify(cr?.jsonData)}</pre>
      </SectionBox> */}
    </>
  );
}

function ConfigurationScans(props) {
  const { configurationScans } = props;

  return (
    <SectionBox title="Configuration scans">
      <Table
        data={configurationScans}
        columns={[
          {
            header: 'Name',
            accessorFn: item => {
              return (
                <Link
                  routeName={`/kubescape/compliance/:namespace/:name`}
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
