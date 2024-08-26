import { Link, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { List, ListItem } from '@mui/material';
import { useEffect, useState } from 'react';
import { getAllConfigurationScanSummaries } from '../model';

export default function KubescapeConfigurationScanSummaryList() {
  return (
    <div>
      <ConfigurationScanSummaryListView />
    </div>
  );
}

function ConfigurationScanSummaryListView() {
  const [data, setData] = useState<Array<any> | null>(null);

  useEffect(() => {
    getAllConfigurationScanSummaries().then(response => {
      setData(response);
    });
  }, []);

  return (
    <>
      {data && (
        <SectionBox title="Configuration Scan Summaries">
          <Table
            data={data.items}
            columns={[
              {
                header: 'Namespace',
                accessorFn: item => item.metadata.name,
                gridTemplate: 'auto',
              },
              {
                header: 'critical',
                accessorFn: item => item.spec?.severities.critical,
                gridTemplate: 'min-content',
              },
              {
                header: 'high',
                accessorFn: item => item.spec?.severities.high,
                gridTemplate: 'min-content',
              },
              {
                header: 'medium',
                accessorFn: item => item.spec?.severities.medium,
                gridTemplate: 'min-content',
              },
              {
                header: 'low',
                accessorFn: item => item.spec?.severities.low,
                gridTemplate: 'min-content',
              },
              {
                header: 'unknown',
                accessorFn: item => item.spec?.severities.unknown,
                gridTemplate: 'min-content',
              },
              {
                header: 'refs',
                accessorFn: item => (
                  <List>{makeLinksToWorkloadConfigurationScans(item.spec.summaryRef)}</List>
                ),
              },
            ]}
          />
        </SectionBox>
      )}
    </>
  );
}

// the ref is to WorkloadConfigurationScanSummary, but we skip the summary and go to WorkloadConfigurationScan directly
function makeLinksToWorkloadConfigurationScans(summaryRef) {
  return summaryRef.map(ref => (
    <ListItem>
      <Link
        routeName={`/kubescape/workloadconfigurationscans/:namespace/:name`}
        params={{
          name: ref.name,
          namespace: ref.namespace,
        }}
      >
        {ref.name}
      </Link>
    </ListItem>
  ));
}
