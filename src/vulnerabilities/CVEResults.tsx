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
import { getURLSegments } from '../common/url';
import { RoutingPath } from '../index';
import { WorkloadScan } from './fetch-vulnerabilities';
import { vulnerabilityContext } from './Vulnerabilities';

export default function KubescapeCVEResults() {
  const [cve] = getURLSegments(-1);

  if (!vulnerabilityContext.workloadScans) {
    return <div></div>;
  }
  const workloadScansFiltered = vulnerabilityContext.workloadScans.filter(workloadScan =>
    workloadScan.imageScan?.matches.some(match => match.vulnerability.id === cve)
  );
  if (!workloadScansFiltered) {
    return <div></div>;
  }
  const firstCVE = workloadScansFiltered[0].imageScan?.matches?.find(
    match => match.vulnerability.id === cve
  );

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
            value: <Link href={firstCVE.vulnerability.dataSource}>{cve}</Link>,
          },
          {
            name: 'Severity',
            value: firstCVE.vulnerability.severity,
          },
          {
            name: 'Description',
            value: firstCVE.vulnerability.description,
          },
        ]}
      />

      <Workloads cve={cve} workloads={workloadScansFiltered} />
    </>
  );
}

function Workloads(props: { cve: string; workloads: WorkloadScan[] }) {
  const { cve, workloads } = props;

  return (
    <SectionBox title="Workloads">
      <HeadlampTable
        data={workloads}
        columns={[
          {
            header: 'Workload',
            accessorFn: (workload: WorkloadScan) => (
              <HeadlampLink
                routeName={RoutingPath.KubescapeVulnerabilityDetails}
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
            accessorKey: 'kind',
            gridTemplate: 'auto',
          },
          {
            header: 'Namespace',
            accessorKey: 'namespace',
            gridTemplate: 'auto',
          },
          {
            header: 'Container',
            accessorKey: 'container',
            gridTemplate: 'auto',
          },
          {
            header: 'Component',
            accessorFn: (workload: WorkloadScan) =>
              `${Array.from(
                new Set(
                  workload.imageScan?.matches
                    .filter(v => v.vulnerability.id === cve)
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
                  workload.imageScan?.matches
                    .filter(v => v.vulnerability.id === cve && v.vulnerability.fix.versions)
                    .map(v => v.vulnerability.fix.versions.join())
                )
              )}`,
            gridTemplate: 'auto',
          },
          {
            header: 'Image',
            accessorFn: (workload: WorkloadScan) => workload.imageScan?.imageName,
            gridTemplate: 'auto',
          },
        ]}
      />
    </SectionBox>
  );
}
