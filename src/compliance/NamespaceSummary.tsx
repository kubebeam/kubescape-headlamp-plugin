/* 
  Show the configuration findings for workloads in a single namespace.  
*/
import { KubeObject } from '@kinvolk/headlamp-plugin/lib';
import {
  Link as HeadlampLink,
  MainInfoSection,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { Path } from '../index';
import { configurationScanSummaries } from '../model';
import { ConfigurationScanSummary } from '../softwarecomposition/ConfigurationScanSummary';
import { getLastURLSegment } from '../utils/url';

export default function KubescapeConfigurationScanNamespaceSummary() {
  const namespace = getLastURLSegment();
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
                <HeadlampLink
                  routeName={Path.KubescapeWorkloadConfigurationScanDetails}
                  params={{
                    name: item.name,
                    namespace: item.namespace,
                  }}
                >
                  {item.name}
                </HeadlampLink>
              );
            },
          },
        ]}
      />
    </SectionBox>
  );
}
