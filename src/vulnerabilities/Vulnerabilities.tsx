import { Link, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { vulnerabilityManifestClass } from '../model';

export default function KubescapeVulnerability() {
  return (
    <div>
      <VulnerabilityManifestListView />
    </div>
  );
}

function VulnerabilityManifestListView() {
  const [resource] = vulnerabilityManifestClass.useList();

  return (
    <SectionBox title="Vulnerabilities (Manifests)">
      <Table
        data={resource}
        columns={[
          {
            header: 'Name',
            accessorFn: item => {
              return (
                <Link
                  routeName={`/kubescape/vulnerabilitymanifests/:namespace/:name`}
                  params={{
                    name: item.metadata.name,
                    namespace: item.metadata.namespace,
                  }}
                >
                  {item.metadata.labels['kubescape.io/workload-name'] ?? 'unknown'}
                </Link>
              );
            },
            gridTemplate: 'max-content',
          },
          {
            header: 'Namespace',
            accessorFn: item => (
              <Link
                routeName="namespace"
                params={{
                  name:
                    item.metadata.labels['kubescape.io/workload-namespace'] ??
                    item.metadata.namespace,
                }}
              >
                {item.metadata.labels['kubescape.io/workload-namespace']}
              </Link>
            ),
            gridTemplate: 'min-content',
          },
          {
            header: 'Container',
            accessorFn: item => item.metadata.annotations['kubescape.io/workload-container-name'],
            gridTemplate: 'min-content',
          },
          {
            header: 'Kind',
            accessorFn: item => {
              return (
                <Link
                  routeName={
                    item.metadata.labels['kubescape.io/workload-kind']
                      ? item.metadata.labels['kubescape.io/workload-kind'].toLowerCase() + 's'
                      : ''
                  }
                >
                  {item.metadata.labels['kubescape.io/workload-kind']}
                </Link>
              );
            },
            gridTemplate: 'min-content',
          },

          {
            header: 'Image',
            accessorFn: item => item.metadata.annotations['kubescape.io/image-tag'],
          },
        ]}
      />
    </SectionBox>
  );
}
