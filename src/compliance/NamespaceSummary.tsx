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
import { useState } from 'react';
import { getLastURLSegment } from '../common/url';
import { RoutingPath } from '../index';
import { configurationScanSummariesClass } from '../model';
import { ConfigurationScanSummary } from '../softwarecomposition/ConfigurationScanSummary';

export default function KubescapeConfigurationScanNamespaceSummary() {
  const namespace = getLastURLSegment();
  const [configurationScanSummary, setConfigurationScanSummary] = useState<KubeObject>(null);

  configurationScanSummariesClass.useApiGet(setConfigurationScanSummary, namespace);

  return (
    <>
      {configurationScanSummary && (
        <MainInfoSection
          title="Namespace Configuration Scans"
          resource={configurationScanSummary}
        />
      )}

      {configurationScanSummary && (
        <ConfigurationScans
          configurationScans={configurationScanSummary.jsonData.spec.summaryRef}
        />
      )}

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
            accessorKey: 'name',
            Cell: ({ cell }: any) => (
              <HeadlampLink
                routeName={RoutingPath.KubescapeWorkloadConfigurationScanDetails}
                params={{
                  name: cell.row.original.name,
                  namespace: cell.row.original.namespace,
                }}
              >
                {cell.getValue()}
              </HeadlampLink>
            ),
          },
        ]}
      />
    </SectionBox>
  );
}
