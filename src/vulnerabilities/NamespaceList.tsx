import { Link, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { List, ListItem } from '@mui/material';
import { useEffect, useState } from 'react';
import { getAllVulnerabilitySummaries } from '../model';

export default function KubescapeVulnerabilitySummaryList() {
  return (
    <div>
      <VulnerabilitySummaryListView />
    </div>
  );
}

function VulnerabilitySummaryListView() {
  const [data, setData] = useState<Array<any> | null>(null);

  useEffect(() => {
    getAllVulnerabilitySummaries().then(response => {
      setData(response);
    });
  }, []);

  return (
    <>
      {data && (
        <SectionBox title="Namespace Vulnerabilities">
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
                accessorFn: item => item.spec?.severities.critical.all,
                gridTemplate: 'min-content',
              },
              {
                header: 'high',
                accessorFn: item => item.spec?.severities.high.all,
                gridTemplate: 'min-content',
              },
              {
                header: 'medium',
                accessorFn: item => item.spec?.severities.medium.all,
                gridTemplate: 'min-content',
              },
              {
                header: 'low',
                accessorFn: item => item.spec?.severities.low.all,
                gridTemplate: 'min-content',
              },
              {
                header: 'negligible',
                accessorFn: item => item.spec?.severities.negligible.all,
                gridTemplate: 'min-content',
              },
              {
                header: 'unknown',
                accessorFn: item => item.spec?.severities.unknown.all,
                gridTemplate: 'min-content',
              },
              {
                header: 'refs',
                accessorFn: item => (
                  <List>{makeLinksToVulnerabilitySummaries(item.spec.vulnerabilitiesRef)}</List>
                ),
              },
            ]}
          />
        </SectionBox>
      )}
    </>
  );
}

function makeLinksToVulnerabilitySummaries(vulnerabilitiesRef) {
  return vulnerabilitiesRef.map(ref => (
    <ListItem>
      <Link
        routeName={`/kubescape/vulnerabilitymanifestsummaries/:namespace/:name`}
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
