import { Link, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import controlLibrary from './controlLibrary.js';
import { useLocation } from 'react-router';
import { workloadScanData } from './Compliance';

export default function KubescapeControlResults() {
  const location = useLocation();
  const segments = location.pathname.split('/');

  // The last segment is the controlID
  const name = segments[segments.length - 1];

  return <ControlResultsListView controlID={name} />;
}

function ControlResultsListView(props) {
  const { controlID } = props;
  const control = controlLibrary.find(element => element.controlID === controlID);

  return (
    <>
      <h1>
        {controlID}: {control?.name}
      </h1>
      <p>{control?.description}</p>
      <SectionBox title="Failed resources">
        <Table
          data={getFailedWorkloads(workloadScanData, controlID)}
          columns={[
            {
              header: 'Name',
              accessorFn: item => {
                return (
                  <Link
                    routeName={`/kubescape/compliance/namespaces/:namespace/:name`}
                    params={{
                      name: item.metadata.name,
                      namespace: item.metadata.namespace,
                    }}
                  >
                    {item.metadata.labels['kubescape.io/workload-name']}
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
            {
              header: 'Kind',
              accessorFn: item => item.metadata.labels['kubescape.io/workload-kind'],
            },
          ]}
        />
      </SectionBox>
    </>
  );
}

function getFailedWorkloads(workloadScanData, controlID: string) {
  const workloads = [];

  for (const workload of workloadScanData) {
    for (const [_, scan] of Object.entries(workload.spec.controls) as any) {
      if (scan.controlID === controlID && scan.status.status === 'failed') {
        workloads.push(workload);
        break;
      }
    }
  }
  return workloads;
}
