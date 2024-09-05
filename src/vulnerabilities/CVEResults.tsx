import { Link as HeadlampLink } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { NameValueTable, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Link } from '@mui/material';
import { useLocation } from 'react-router';
import { WorkloadScan, workloadScans } from './Vulnerabilities';

export default function KubescapeCVEResults() {
  const location = useLocation();
  const segments = location.pathname.split('/');

  // The last segment is the CVE
  const name = segments[segments.length - 1];

  return <CVEResultsListView cve={name} />;
}

function CVEResultsListView(props) {
  const { cve } = props;

  if (!workloadScans) {
    return;
  }

  const workloadScansFiltered = workloadScans.filter(workloadScan =>
    workloadScan.imageScan?.vulnerabilities?.some(v => v.CVE === cve)
  );
  if (!workloadScansFiltered) {
    return;
  }
  const firstCVE = workloadScansFiltered[0].imageScan.vulnerabilities.find(v => v.CVE === cve);

  return (
    <>
      <h1>{cve}</h1>
      {/* <SectionBox title="Details">
        <pre>{YAML.stringify(firstCVE)}</pre>
      </SectionBox> */}
      <NameValueTable
        rows={[
          {
            name: 'CVE ID',
            value: <Link href={firstCVE.dataSource}>{cve}</Link>,
          },
          {
            name: 'Severity',
            value: firstCVE.severity,
          },
        ]}
      />

      <p>{firstCVE.description}</p>

      <Workloads cve={cve} workloads={workloadScansFiltered} />
    </>
  );
}

function Workloads(props) {
  const { cve, workloads } = props;

  return (
    <SectionBox title="Workloads">
      <Table
        data={workloads}
        columns={[
          {
            header: 'Workload',
            accessorFn: (workload: WorkloadScan) => (
              <HeadlampLink
                routeName={`/kubescape/vulnerabilities/namespaces/:namespace/:name`}
                params={{
                  name: workload.manifestName,
                  namespace: workload.namespace,
                }}
              >
                {workload.name}
              </HeadlampLink>
            ),
            gridTemplate: 'auto',
          },
          {
            header: 'Kind',
            accessorFn: (workload: WorkloadScan) => workload.kind,
            gridTemplate: 'auto',
          },
          {
            header: 'Namespace',
            accessorFn: (workload: WorkloadScan) => workload.namespace,
            gridTemplate: 'auto',
          },
          {
            header: 'Container',
            accessorFn: (workload: WorkloadScan) => workload.container,
            gridTemplate: 'auto',
          },
          {
            header: 'Component',
            accessorFn: (workload: WorkloadScan) =>
              `${Array.from(
                new Set(
                  workload.imageScan.vulnerabilities
                    .filter(v => v.CVE === cve)
                    .map(v => v.artifact.name + ' ' + v.artifact.version)
                )
              )}`,
            gridTemplate: 'auto',
          },
          {
            header: 'Fix',
            accessorFn: (workload: WorkloadScan) =>
              `${Array.from(
                new Set(
                  workload.imageScan.vulnerabilities
                    .filter(v => v.CVE === cve && v.fix.versions)
                    .map(v => v.fix.versions.join())
                )
              )}`,
            gridTemplate: 'auto',
          },
          {
            header: 'Image',
            accessorFn: (workload: WorkloadScan) => workload.imageScan.imageName,
            gridTemplate: 'auto',
          },
        ]}
      />
    </SectionBox>
  );
}
