import { Link, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { vulnerabilityManifestSummaryClass } from '../model';
import { getCVESummary } from './SummaryDetails';

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
    <SectionBox title="Vulnerabilities">
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
          // We canot show the CVE here because in a list call the severity is set to 0.
          // {
          //   header: 'CVE',
          //   accessorFn1: item => getCVESummary(item),
          // },
        ]}
      />
    </SectionBox>
  );
}
