/* 
  Provide information on a CVE and the workloads vulnerable for this CVE. 
*/
import {
  Link as HeadlampLink,
  NameValueTable,
  SectionBox,
  Table as HeadlampTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Link } from '@mui/material';
import { getURLSegments } from '../utils/url';
import { VulnerabilityModel } from './view-types';
import { workloadScans } from './Vulnerabilities';

export default function KubescapeCVEResults() {
  const [name] = getURLSegments(-1);

  return <CVEResultsListView cve={name} />;
}

function CVEResultsListView(props: { cve: string }) {
  const { cve } = props;

  if (!workloadScans) {
    return <div></div>;
  }
  const workloadScansFiltered = workloadScans.filter(workloadScan =>
    workloadScan.imageScan?.vulnerabilities.some(v => v.CVE === cve)
  );
  if (!workloadScansFiltered) {
    return <div></div>;
  }
  const firstCVE = workloadScansFiltered[0].imageScan?.vulnerabilities.find(v => v.CVE === cve);

  if (!firstCVE) {
    return <div></div>;
  }
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
          {
            name: 'Description',
            value: firstCVE.description,
          },
        ]}
      />

      <Workloads cve={cve} workloads={workloadScansFiltered} />
    </>
  );
}

function Workloads(props: { cve: string; workloads: VulnerabilityModel.WorkloadScan[] }) {
  const { cve, workloads } = props;

  return (
    <SectionBox title="Workloads">
      <HeadlampTable
        data={workloads}
        columns={[
          {
            header: 'Workload',
            accessorFn: (workload: VulnerabilityModel.WorkloadScan) => (
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
            accessorFn: (workload: VulnerabilityModel.WorkloadScan) => workload.kind,
            gridTemplate: 'auto',
          },
          {
            header: 'Namespace',
            accessorFn: (workload: VulnerabilityModel.WorkloadScan) => workload.namespace,
            gridTemplate: 'auto',
          },
          {
            header: 'Container',
            accessorFn: (workload: VulnerabilityModel.WorkloadScan) => workload.container,
            gridTemplate: 'auto',
          },
          {
            header: 'Component',
            accessorFn: (workload: VulnerabilityModel.WorkloadScan) =>
              `${Array.from(
                new Set(
                  workload.imageScan?.vulnerabilities
                    .filter(v => v.CVE === cve)
                    .map(v => v.artifact.name + ' ' + v.artifact.version)
                )
              )}`,
            gridTemplate: 'auto',
          },
          {
            header: 'Fix',
            accessorFn: (workload: VulnerabilityModel.WorkloadScan) =>
              `${Array.from(
                new Set(
                  workload.imageScan?.vulnerabilities
                    .filter(v => v.CVE === cve && v.fix.versions)
                    .map(v => v.fix.versions.join())
                )
              )}`,
            gridTemplate: 'auto',
          },
          {
            header: 'Image',
            accessorFn: (workload: VulnerabilityModel.WorkloadScan) =>
              workload.imageScan?.imageName,
            gridTemplate: 'auto',
          },
        ]}
      />
    </SectionBox>
  );
}
