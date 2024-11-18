import { K8s, KubeObject } from '@kinvolk/headlamp-plugin/lib';
import {
  Link as HeadlampLink,
  SectionBox,
  Table as HeadlampTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Paper } from '@mui/material';
import { useEffect, useState } from 'react';
import { RoutingPath } from '..';
import { applicationProfileClass } from '../model';
import { ApplicationProfile } from '../softwarecomposition/ApplicationProfile';

export function RuntimeDetection() {
  const [applicationProfiles, setApplicationProfiles] = useState<KubeObject[] | null>(null);

  applicationProfileClass.useApiList(setApplicationProfiles);

  if (!applicationProfiles) {
    return <></>;
  }

  return (
    <>
      <Detection></Detection>
      <SectionBox title="Application Profiles">
        <HeadlampTable
          data={applicationProfiles}
          columns={[
            {
              header: 'Name',
              accessorFn: (profile: ApplicationProfile) =>
                profile.metadata.labels['kubescape.io/workload-name'],
              Cell: ({ cell, row }: any) => (
                <HeadlampLink
                  routeName={RoutingPath.ApplicationProfileDetails}
                  params={{
                    name: row.original.metadata.name,
                    namespace: row.original.metadata.namespace,
                  }}
                >
                  {cell.getValue()}
                </HeadlampLink>
              ),
            },
            {
              header: 'Kind',
              accessorFn: (profile: ApplicationProfile) =>
                profile.metadata.labels['kubescape.io/workload-kind'],
            },
            {
              header: 'Namespace',
              accessorFn: (profile: ApplicationProfile) => profile.metadata.namespace,
            },
            {
              header: 'Monitoring',
              accessorFn: (profile: ApplicationProfile) =>
                profile.metadata.annotations['kubescape.io/status'],
            },
          ]}
        />
      </SectionBox>
    </>
  );
}

function Detection() {
  const [nodeAgents] = K8s.ResourceClasses.Pod.useList({
    labelSelector: 'app.kubernetes.io/component=node-agent,app.kubernetes.io/instance=kubescape',
  });

  const [logLines, setLogLines] = useState<string[]>([]);

  useEffect(() => {
    let callback: any = null;

    if (nodeAgents) {
      nodeAgents.map(
        (nodeAgent: KubeObject) =>
          (callback = nodeAgent.getLogs('node-agent', setLogLines, {
            tailLines: 10,
          }))
      );
    }

    return function cleanup() {
      if (callback) {
        callback();
      }
    };
  }, [nodeAgents]);

  return <Paper>{logLines.join('\n')}</Paper>;
}
