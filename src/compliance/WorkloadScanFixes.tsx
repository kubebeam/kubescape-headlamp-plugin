/* 
  Show fix suggestion for a workload. 
*/
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import React from 'react';
import { useLocation } from 'react-router';
import { workloadConfigurationScanClass } from '../model';
import { WorkloadConfigurationScan } from '../softwarecomposition/WorkloadConfigurationScan';
import { fixResource } from './resource-fix';
import controlLibrary from './controlLibrary';
import {
  Link as HeadlampLink,
  NameValueTable,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Link } from '@mui/material';
import { WorkloadConfigurationScanSummary } from '../softwarecomposition/WorkloadConfigurationScanSummary';
import { workloadScanData } from './Compliance';

export default function KubescapeWorkloadConfigurationScanFixes() {
  const location = useLocation();
  const segments = location.pathname.split('/');

  // /kubescape/compliance/namespaces/:namespace/:kind/:name/:control
  const namespace = segments[segments.length - 4];
  const kind = segments[segments.length - 3];
  const name = segments[segments.length - 2];
  const controlID = segments[segments.length - 1];

  return (
    <WorkloadConfigurationScanFixes
      kind={kind}
      name={name}
      namespace={namespace}
      controlID={controlID}
    />
  );
}

function WorkloadConfigurationScanFixes(props: {
  name: string;
  namespace: string;
  controlID: string;
  kind: string;
}) {
  const { name, namespace, kind, controlID } = props;
  const [workloadConfiguration, setWorkloadConfiguration]: [KubeObject, any] = React.useState(null);
  const [resource, setResource]: [KubeObject, any] = React.useState(null);
  const control = controlLibrary.find(element => element.controlID === controlID);

  const deploymentVersion = [{ group: 'apps', version: 'v1' }];

  const deploymentClass = makeCustomResourceClass({
    apiInfo: deploymentVersion,
    isNamespaced: true,
    singularName: kind,
    pluralName: 'deployments',
  });

  workloadConfigurationScanClass.useApiGet(setWorkloadConfiguration, `${kind}-${name}`, namespace);
  deploymentClass.useApiGet(setResource, name, namespace);

  return (
    <>
      <h1>Fix: {control?.name}</h1>

      <SectionBox title="Kubescape">
        <NameValueTable
          rows={[
            {
              name: 'Description',
              value: control?.description,
            },
            {
              name: 'Category',
              value: control?.category?.name,
            },
            {
              name: 'Score',
              value: control?.baseScore.toString(),
            },
            {
              name: 'Remediation',
              value: control?.remediation,
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

      {resource && workloadConfiguration && (
        <Fix
          control={getControl(workloadConfiguration.jsonData, controlID)}
          resource={resource.jsonData}
        />
      )}
    </>
  );
}

function getControl(
  workloadConfigurationScan: WorkloadConfigurationScan,
  controlID: string
): WorkloadConfigurationScan.Control | undefined {
  return Object.values(workloadConfigurationScan.spec.controls).find(
    control => control.controlID === controlID
  );
}

function Fix(props: { control: WorkloadConfigurationScan.Control | undefined; resource: any }) {
  const { control, resource } = props;

  if (control?.rules) {
    const fixedYAML = fixResource(resource, control);

    return <pre dangerouslySetInnerHTML={{ __html: fixedYAML }} />;
  }
}
