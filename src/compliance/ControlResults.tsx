/* 
  Information about a control and failed workloads. 
*/
import {
  Link as HeadlampLink,
  NameValueTable,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { createRouteURL } from '@kinvolk/headlamp-plugin/lib/Router';
import { Link } from '@mui/material';
import { makeNamespaceLink } from '../common/Namespace';
import { getLastURLSegment } from '../common/url';
import { RoutingPath } from '../index';
import { WorkloadConfigurationScanSummary } from '../softwarecomposition/WorkloadConfigurationScanSummary';
import { globalWorkloadScanData } from './Compliance';
import controlLibrary from './controlLibrary';

export default function KubescapeControlResults() {
  const controlID = getLastURLSegment();
  const control = controlLibrary.find(element => element.controlID === controlID);

  if (!control) {
    return <p>The control {controlID} was not found.</p>;
  }
  return (
    <>
      <SectionBox
        title={`${controlID}: ${control.name}`}
        backLink={createRouteURL(RoutingPath.ComplianceView)}
      >
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
          data={getFailedWorkloads(globalWorkloadScanData, controlID)}
          columns={[
            {
              header: 'Name',
              Cell: ({ cell }: any) => (
                <HeadlampLink
                  routeName={RoutingPath.KubescapeWorkloadConfigurationScanDetails}
                  params={{
                    name: cell.row.original.metadata.name,
                    namespace: cell.row.original.metadata.namespace,
                  }}
                >
                  {cell.getValue()}
                </HeadlampLink>
              ),
              accessorFn: (workloadScan: WorkloadConfigurationScanSummary) =>
                workloadScan.metadata.labels['kubescape.io/workload-name'],
            },
            {
              header: 'Kind',
              accessorFn: (workloadScan: WorkloadConfigurationScanSummary) =>
                workloadScan.metadata.labels['kubescape.io/workload-kind'],
            },
            {
              header: 'Namespace',
              accessorKey: 'metadata.namespace',
              Cell: ({ cell }: any) => makeNamespaceLink(cell.getValue()),
            },
            {
              header: 'Scan',
              accessorFn: (workloadScan: WorkloadConfigurationScanSummary) =>
                workloadScan.metadata.name,
            },
            {
              header: '',
              accessorFn: (workloadScan: WorkloadConfigurationScanSummary) => {
                //if (control.rules.some(rule => rule.paths)) {
                return (
                  <HeadlampLink
                    routeName={RoutingPath.KubescapeWorkloadConfigurationScanFixes}
                    params={{
                      name: workloadScan.metadata.name,
                      namespace: workloadScan.metadata.namespace,
                      control: control.controlID,
                    }}
                  >
                    Fix
                  </HeadlampLink>
                );
                //  }
              },
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
      for (const scan of Object.values(workload.spec.controls) as any) {
        if (scan.controlID === controlID && scan.status.status === 'failed') {
          workloads.push(workload);
          break;
        }
      }
    }
  }
  return workloads;
}
