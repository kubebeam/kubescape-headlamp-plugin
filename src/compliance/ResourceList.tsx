import { Link, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { workloadConfigurationScanClass } from '../model';

export default function KubescapeWorkloadConfigurationScanList() {
  return (
    <div>
      <WorkloadConfigurationScanListView />
    </div>
  );
}

function WorkloadConfigurationScanListView() {
  const [resource] = workloadConfigurationScanClass.useList();

  return (
    <SectionBox>
      <Table
        data={resource}
        columns={[
          {
            header: 'Name',
            accessorFn: item => {
              return (
                <Link
                  routeName={`/kubescape/workloadconfigurationscans/:namespace/:name`}
                  params={{
                    name: item.metadata.name,
                    namespace: item.metadata.namespace,
                  }}
                >
                  {item.metadata.name}
                </Link>
              );
            },
          },
          {
            header: 'Namespace',
            accessorFn: item => (
              <Link
                routeName="namespace"
                params={{
                  name: item.metadata.namespace,
                }}
              >
                {item.metadata.namespace}
              </Link>
            ),
          },
        ]}
      />
    </SectionBox>
  );
}
