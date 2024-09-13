/* 
  Show fix suggestion for a workload. 
*/
import { NameValueTable, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Editor, DiffEditor } from '@monaco-editor/react';
import { Link } from '@mui/material';
import { useEffect, useState } from 'react';
import YAML from 'yaml';
import { fetchWorkloadConfigurationScan, proxyRequest } from '../model';
import { WorkloadConfigurationScan } from '../softwarecomposition/WorkloadConfigurationScan';
import { getURLSegments } from '../utils/url';
import controlLibrary from './controlLibrary';

export default function KubescapeWorkloadConfigurationScanFixes() {
  const [controlID, name, namespace] = getURLSegments(-1, -2, -3);

  return <WorkloadConfigurationScanFixes name={name} namespace={namespace} controlID={controlID} />;
}

const apiResourceDefinitions = [
  {
    group: '',
    version: 'v1',
    pluralName: 'serviceaccounts',
    singularName: 'serviceaccount',
    isNamespaced: true,
  },
  {
    group: 'rbac.authorization.k8s.io',
    version: 'v1',
    pluralName: 'clusterroles',
    singularName: 'clusterrole',
    isNamespaced: false,
  },
  {
    group: 'rbac.authorization.k8s.io',
    version: 'v1',
    pluralName: 'clusterrolebindings',
    singularName: 'clusterrolebinding',
    isNamespaced: false,
  },
  {
    group: 'apps',
    version: 'v1',
    pluralName: 'deployments',
    singularName: 'deployment',
    isNamespaced: true,
  },
  {
    group: 'admissionregistration.k8s.io',
    version: 'v1',
    pluralName: 'mutatingwebhookconfigurations',
    singularName: 'mutatingwebhookconfiguration',
    isNamespaced: false,
  },
];

function WorkloadConfigurationScanFixes(props: {
  name: string;
  namespace: string;
  controlID: string;
}) {
  const { name, namespace, controlID } = props;
  const [workloadConfigurationScan, setWorkloadConfigurationScan]: [
    WorkloadConfigurationScan,
    any
  ] = useState(null);

  const control = controlLibrary.find(element => element.controlID === controlID);

  useEffect(() => {
    fetchWorkloadConfigurationScan(name, namespace).then((result: WorkloadConfigurationScan) => {
      setWorkloadConfigurationScan(result);
    });
  }, []);

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
              value: workloadConfigurationScan.metadata.labels['kubescape.io/workload-namespace'],
            },
            {
              name: 'Kind',
              value: workloadConfigurationScan.metadata.labels['kubescape.io/workload-kind'],
            },
            {
              name: 'Control',
              value: (
                <Link
                  target="_blank"
                  href={'https://hub.armosec.io/docs/' + control?.controlID.toLowerCase()}
                >
                  {control?.controlID} {control?.name}
                </Link>
              ),
            },
            {
              name: 'Explain',
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
            // {
            //   name: 'Scan',
            //   value: workloadConfigurationScan.metadata.name,
            // },
            {
              name: 'Related objects',
              value: workloadConfigurationScan.spec.relatedObjects
                ? workloadConfigurationScan.spec.relatedObjects
                    .map(object => `${object.name}: ${object.kind}`)
                    .join(', ')
                : '',
            },
          ]}
        />
      </SectionBox>

      {fixes(workloadConfigurationScan, controlID)}
    </>
  );
}

function fixes(
  workloadConfigurationScan: WorkloadConfigurationScan,
  controlID: string
): JSX.Element[] {
  const fixes: JSX.Element[] = [];
  const control = Object.values(workloadConfigurationScan.spec.controls).find(
    item => item.controlID === controlID
  );

  if (!control) {
    return fixes;
  }

  const labels = workloadConfigurationScan.metadata.labels;
  const primaryFix = (
    <Fix
      control={control}
      kind={labels['kubescape.io/workload-kind']}
      name={labels['kubescape.io/workload-name']}
      namespace={labels['kubescape.io/workload-namespace']}
    />
  );
  if (primaryFix) {
    fixes.push(primaryFix);
  }
  if (workloadConfigurationScan.spec.relatedObjects) {
    workloadConfigurationScan.spec.relatedObjects.forEach((obj, index) => {
      const fix = (
        <Fix
          control={control}
          kind={obj.kind}
          name={obj.name}
          namespace={obj.namespace}
          rulePathPrefix={`relatedObjects[${index}].`}
        />
      );
      if (fix) {
        fixes.push(fix);
      }
    });
  }

  return fixes;
}

function Fix(props: {
  control: WorkloadConfigurationScan.Control;
  kind: string;
  name: string;
  namespace: string;
  rulePathPrefix?: string; // to filter rules for relatedObjects
}) {
  const { control, kind, name, namespace, rulePathPrefix } = props;
  const [resource, setResource]: [any, any] = useState(null);

  useEffect(() => {
    const groupVersion = apiResourceDefinitions.find(gv => gv.singularName === kind.toLowerCase());
    if (!groupVersion) {
      console.log('Fix is not supported yet for:' + kind);
      return;
    }
    proxyRequest(
      name,
      groupVersion.isNamespaced ? namespace : '',
      groupVersion.group,
      groupVersion.version,
      groupVersion.pluralName
    ).then((result: any) => {
      setResource(result);
    });
  }, []);

  if (resource) {
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

      const fixedYAML = fixResource(strippedResource, control, rulePathPrefix ?? '');
      const lines = fixedYAML.match(/\n/g)?.length ?? 10;

      return (
        <>
          {/* <Editor theme="vs-dark" language="yaml" value={YAML.stringify(control)} height={500} /> */}

          <DiffEditor
            theme="vs-dark"
            language="yaml"
            original={original}
            modified={fixedYAML}
            height={lines * 20}
            options={{
              renderSideBySide: true,
            }}
          />
        </>
      );
    }
  }
}

// Amend the resource as per fixPath recommendations
export function fixResource(
  resource: any,
  control: WorkloadConfigurationScan.Control,
  prefix: string
): string {
  if (control.rules) {
    for (const rule of control.rules) {
      if (!rule.paths) {
        continue;
      }
      for (const rulePath of rule.paths) {
        let path = rulePath.fixPath.length > 0 ? rulePath.fixPath : rulePath.failedPath;
        if (path.startsWith(prefix)) {
          path = path.replace(prefix, '');
          evaluateRule(resource, path, rulePath.fixPathValue);
        }
      }
    }
  }

  return YAML.stringify(resource);
}

function evaluateRule(resource: any, path: string, fixPathValue: string) {
  const parts = path.split('.');

  let element: any = resource;
  for (const part of parts) {
    const arrayMatch = part.match(/(\w+)\[([0-9]+)\]/); // e.g. containers[0]
    if (arrayMatch) {
      const field = arrayMatch[1];
      const index = parseInt(arrayMatch[2]);

      if (field in element) {
        const list: [] = element[field];
        if (list.length > index) {
          if (part === parts[parts.length - 1]) {
            element[field][index] = fixPathValue;
            return; // done
          }
          element = element[field][index];
        } else {
          return; // the rule has a mismatch
        }
      } else {
        element[field] = [{}]; // new array with 1 object
        element = element[field][0];
      }
    } else {
      if (part === parts[parts.length - 1]) {
        element[part] = fixPathValue;
        return; // done
      }
      if (!(part in element)) {
        element[part] = {};
      }
      element = element[part];
    }
  }
}
