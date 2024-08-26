import { Link, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { vulnerabilityManifestSummaryClass } from '../model';

export default function KubescapeVulnerabilityManifestSummaryList() {
  return (
    <div>
      <VulnerabilityManifestListView />
    </div>
  );
}

function VulnerabilityManifestListView() {
  const [resource] = vulnerabilityManifestSummaryClass.useList();

  return (
    <SectionBox title="Image Scanning">
      <Table
        data={resource}
        columns={[
          {
            header: 'Name',
            accessorFn: item => {
              return (
                <Link
                  routeName={`/kubescape/vulnerabilitymanifestsummaries/:namespace/:name`}
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
