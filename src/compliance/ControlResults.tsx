/* 
  Information about a control and failed workloads. 
*/
import {
  Link as HeadlampLink,
  NameValueTable,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Link } from '@mui/material';
import { useLocation } from 'react-router';
import { WorkloadConfigurationScanSummary } from '../softwarecomposition/WorkloadConfigurationScanSummary';
import { workloadScanData } from './Compliance';
import controlLibrary from './controlLibrary';

export default function KubescapeControlResults() {
  const location = useLocation();
  const segments = location.pathname.split('/');

  // The last segment is the controlID
  const name = segments[segments.length - 1];

  return <ControlResultsListView controlID={name} />;
}

function ControlResultsListView(props: { controlID: string }) {
  const { controlID } = props;
  const control = controlLibrary.find(element => element.controlID === controlID);

  if (!control) {
    return <p>The control {controlID} was not found.</p>;
  }
  return (
    <>
      <h1>
        {controlID}: {control.name}
      </h1>
      <SectionBox title="Kubescape">
        <NameValueTable
          rows={[
            {
              name: 'Description',
              value: control.description,
            },
            {
              name: 'Category',
              value: control.category?.name,
            },
            {
              name: 'Score',
              value: control.baseScore.toString(),
            },
            {
              name: 'Remediation',
              value: control.remediation,
            },
            {
              name: 'More information',
              value: (
                <Link
                  target="_blank"
                  href={'https://hub.armosec.io/docs/' + controlID.toLowerCase()}
                >
                  https://hub.armosec.io/docs/{controlID.toLowerCase()}
                </Link>
              ),
            },
          ]}
        />
      </SectionBox>

      <SectionBox title="Failed resources">
        <Table
          data={getFailedWorkloads(workloadScanData, controlID)}
          columns={[
            {
              header: 'Name',
              accessorFn: (workloadScan: WorkloadConfigurationScanSummary) => {
                return (
                  <HeadlampLink
                    routeName={`/kubescape/compliance/namespaces/:namespace/:name`}
                    params={{
                      name: workloadScan.metadata.name,
                      namespace: workloadScan.metadata.namespace,
                    }}
                  >
                    {workloadScan.metadata.labels['kubescape.io/workload-name']}
                  </HeadlampLink>
                );
              },
            },
            {
              header: 'Namespace',
              accessorFn: (workloadScan: WorkloadConfigurationScanSummary) => (
                <HeadlampLink
                  routeName="namespace"
                  params={{
                    name: workloadScan.metadata.namespace,
                  }}
                >
                  {workloadScan.metadata.namespace}
                </HeadlampLink>
              ),
            },
            {
              header: 'Kind',
              accessorFn: (workloadScan: WorkloadConfigurationScanSummary) =>
                workloadScan.metadata.labels['kubescape.io/workload-kind'],
            },
          ]}
        />
      </SectionBox>
    </>
  );
}

function getFailedWorkloads(
  workloadScanData: WorkloadConfigurationScanSummary[] | null,
  controlID: string
) {
  const workloads = [];
  if (workloadScanData) {
    for (const workload of workloadScanData) {
      for (const [, scan] of Object.entries(workload.spec.controls) as any) {
        if (scan.controlID === controlID && scan.status.status === 'failed') {
          workloads.push(workload);
          break;
        }
      }
    }
  }
  return workloads;
}
