/* 
  Show the configuration findings for workloads in a single namespace.  
*/
import { KubeObject } from '@kinvolk/headlamp-plugin/lib';
import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { MainInfoSection, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import React from 'react';
import { useLocation } from 'react-router';
import { configurationScanSummaries } from '../model';
import { ConfigurationScanSummary } from '../softwarecomposition/ConfigurationScanSummary';

export default function KubescapeConfigurationScanNamespaceSummary() {
  const location = useLocation();
  const segments = location.pathname.split('/');

  // The last segment is the namespace
  const namespace = segments[segments.length - 1];

  return <ConfigurationScanNamespaceSummaryView namespace={namespace} />;
}

function ConfigurationScanNamespaceSummaryView(props: { namespace: string }) {
  const { namespace } = props;
  const [cr, setCr]: [KubeObject, any] = React.useState(null);

  configurationScanSummaries.useApiGet(setCr, namespace);

  return (
    <>
      {cr && <MainInfoSection title="Namespace Configuration Scans" resource={cr} />}

      {cr && <ConfigurationScans configurationScans={cr.jsonData.spec.summaryRef} />}

      {/* <SectionBox title="Details">
        <pre>{YAML.stringify(cr?.jsonData)}</pre>
      </SectionBox> */}
    </>
  );
}

function ConfigurationScans(props: { configurationScans: ConfigurationScanSummary.SummaryRef[] }) {
  const { configurationScans } = props;

  return (
    <SectionBox title="Configuration scans">
      <Table
        data={configurationScans}
        columns={[
          {
            header: 'Namespace',
            accessorFn: (item: ConfigurationScanSummary.SummaryRef) => {
              return (
                <Link
                  routeName={`/kubescape/compliance/namespaces/:namespace/:name`}
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
