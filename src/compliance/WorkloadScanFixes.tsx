/* 
  Show fix suggestion for a workload. 
*/
import { NameValueTable, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { DiffEditor } from '@monaco-editor/react';
import { Link } from '@mui/material';
import React from 'react';
import { useLocation } from 'react-router';
import YAML from 'yaml';
import { workloadConfigurationScanClass } from '../model';
import { WorkloadConfigurationScan } from '../softwarecomposition/WorkloadConfigurationScan';
import controlLibrary from './controlLibrary';

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

const apiGroupVersions = [
  {
    apiInfo: [{ group: 'apps', version: 'v1' }],
    pluralName: 'deployments',
    singularName: 'deployment',
    isNamespaced: true,
  },
];

function WorkloadConfigurationScanFixes(props: {
  name: string;
  namespace: string;
  controlID: string;
  kind: string;
}) {
  const { name, namespace, kind, controlID } = props;
  const [workloadConfigurationScan, setWorkloadConfigurationScan]: [KubeObject, any] =
    React.useState(null);
  const [resource, setResource]: [KubeObject, any] = React.useState(null);
  const control = controlLibrary.find(element => element.controlID === controlID);

  const groupVersion = apiGroupVersions.find(gv => gv.singularName === kind);
  if (!groupVersion) {
    console.log('Fix is not supported for:' + kind);
    return;
  }
  workloadConfigurationScanClass.useApiGet(
    setWorkloadConfigurationScan,
    `${kind}-${name}`,
    namespace
  );
  const resourceClass = makeCustomResourceClass({
    apiInfo: groupVersion.apiInfo,
    isNamespaced: groupVersion.isNamespaced,
    singularName: kind,
    pluralName: groupVersion.pluralName,
  });
  resourceClass.useApiGet(setResource, name, namespace);

  if (!workloadConfigurationScan) {
    return <></>;
  }
  return (
    <>
      <h1>Fix: {control?.name}</h1>

      <SectionBox title="">
        <NameValueTable
          rows={[
            {
              name: 'Name',
              value: workloadConfigurationScan.metadata.labels['kubescape.io/workload-name'],
            },
            {
              name: 'Namespace',
              value: workloadConfigurationScan.metadata.namespace,
            },
            {
              name: 'Kind',
              value: workloadConfigurationScan.metadata.labels['kubescape.io/workload-kind'],
            },
            {
              name: 'Description',
              value: control?.description,
            },
            {
              name: 'Category',
              value: control?.category?.name,
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

      {resource && (
        <Fix
          control={getControl(workloadConfigurationScan.jsonData, controlID)}
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

  // strip status
  const strippedResource: any = Object.fromEntries(
    Object.entries(resource).filter(([key]) => key !== 'status')
  );
  // strip managedFields
  strippedResource.metadata = Object.fromEntries(
    Object.entries(strippedResource.metadata).filter(([key]) => key !== 'managedFields')
  );

  if (control?.rules) {
    const original = YAML.stringify(strippedResource);

    const fixedYAML = fixResource(strippedResource, control);

    return (
      <DiffEditor
        theme="vs-dark"
        language="yaml"
        original={original}
        modified={fixedYAML}
        height={1000}
        options={{
          renderSideBySide: true,
        }}
      />
    );
  }
}

// Amend the resource as per fixPath recommendations
export function fixResource(resource: any, control: WorkloadConfigurationScan.Control): string {
  // evaluate the fix rules
  for (const rule of control.rules) {
    if (!rule.paths) {
      continue;
    }
    for (const path of rule.paths) {
      evaluateRule(resource, path);
    }
  }

  return YAML.stringify(resource);
}

function evaluateRule(resource: any, path: WorkloadConfigurationScan.RulePath) {
  const parts = path.fixPath ? path.fixPath.split('.') : path.failedPath.split('.');

  let element: any = resource;
  for (const part of parts) {
    const matchArrayField = part.match(/(\w+)\[([0-9]+)\]/); // e.g. containers[0]
    if (matchArrayField) {
      const field = matchArrayField[1];

      if (field in element) {
        const index = parseInt(matchArrayField[2]);
        element = element[field][index];
      } else {
        element[field] = [{}]; // new array with 1 object
        element = element[field][0];
      }
    } else {
      if (part === parts[parts.length - 1]) {
        element[part] = path.fixPathValue;
        return;
      }
      if (!(part in element)) {
        element[part] = {};
      }
      element = element[part];
    }
  }
}
