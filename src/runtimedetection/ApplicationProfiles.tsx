import { KubeObject } from '@kinvolk/headlamp-plugin/lib';
import {
  Link as HeadlampLink,
  SectionBox,
  Table as HeadlampTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useState } from 'react';
import { RoutingPath } from '..';
import { applicationProfileClass } from '../model';
import { ApplicationProfile } from '../softwarecomposition/ApplicationProfile';

export function ApplicationProfiles() {
  const [applicationProfiles, setApplicationProfiles] = useState<KubeObject[] | null>(null);

  applicationProfileClass.useApiList(setApplicationProfiles);

  if (!applicationProfiles) {
    return <></>;
  }

  return (
    <>
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
                  routeName={RoutingPath.RuntimeDetection}
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
