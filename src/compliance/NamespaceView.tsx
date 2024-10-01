/* 
  Information about a namespace and failed workloads. 
*/
import {
  Link as HeadlampLink,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { RoutingPath } from '../index';
import { WorkloadConfigurationScanSummary } from '../softwarecomposition/WorkloadConfigurationScanSummary';
import { workloadScanData } from './Compliance';
class NamespaceResult {
  namespace: string;
  criticalCount: number = 0;
  highCount: number = 0;
  mediumCount: number = 0;
  lowCount: number = 0;
  total: number = 0;
  unknownCount: number = 0;
  passed: number = 0;
  failed: number = 0;

  constructor(namespace: string) {
    this.namespace = namespace;
  }
}

export default function NamespaceView() {
  if (!workloadScanData) {
    return <></>;
  }
  return (
    <SectionBox>
      <Table
        data={getNamespaceResults(workloadScanData)}
        columns={[
          {
            header: 'Namespace',
            accessorKey: 'namespace',
            Cell: ({ cell }: any) => (
              <HeadlampLink
                routeName={RoutingPath.KubescapeConfigurationScanNamespaceSummary}
                params={{
                  namespace: cell.getValue(),
                }}
              >
                {cell.getValue()}
              </HeadlampLink>
            ),
          },
          {
            header: 'Passed',
            accessorFn: (namespaceResult: NamespaceResult) => {
              return <progress value={namespaceResult.passed / namespaceResult.total} />;
            },
          },
          {
            header: 'Critical',
            accessorKey: 'criticalCount',
            gridTemplate: 'min-content',
          },
          {
            header: 'High',
            accessorKey: 'highCount',
            gridTemplate: 'min-content',
          },
          {
            header: 'Medium',
            accessorKey: 'mediumCount',
            gridTemplate: 'min-content',
          },
          {
            header: 'Low',
            accessorKey: 'lowCount',
            gridTemplate: 'min-content',
          },
          {
            header: 'Unknown',
            accessorKey: 'unknownCount',
            gridTemplate: 'min-content',
          },
          {
            header: 'Total',
            accessorKey: 'total',
            gridTemplate: 'min-content',
          },
        ]}
      />
    </SectionBox>
  );
}

function getNamespaceResults(
  workloadScanData: WorkloadConfigurationScanSummary[]
): NamespaceResult[] {
  const namespaces: NamespaceResult[] = [];

  for (const scan of workloadScanData) {
    let namespaceResult = namespaces.find(ns => ns.namespace === scan.metadata.namespace);
    if (!namespaceResult) {
      namespaceResult = new NamespaceResult(scan.metadata.namespace);
      namespaces.push(namespaceResult);
    }

    for (const controlResult of Object.values(scan.spec.controls)) {
      namespaceResult.total++;

      if (controlResult.status.status === WorkloadConfigurationScanSummary.Status.Failed) {
        namespaceResult.failed++;
        switch (controlResult.severity?.severity?.toLowerCase()) {
          case 'critical': {
            namespaceResult.criticalCount++;
            break;
          }
          case 'high': {
            namespaceResult.highCount++;
            break;
          }
          case 'medium': {
            namespaceResult.mediumCount++;
            break;
          }
          case 'low': {
            namespaceResult.lowCount++;
            break;
          }
          case 'unknown': {
            namespaceResult.unknownCount++;
            break;
          }
        }
      } else if (controlResult.status.status === WorkloadConfigurationScanSummary.Status.Passed) {
        namespaceResult.passed++;
      }
    }
  }
  return namespaces;
}
