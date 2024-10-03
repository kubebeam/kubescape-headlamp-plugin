/* 
  List generated network policies. 
*/
import './style.css';
import {
  Link as HeadlampLink,
  SectionBox,
  Table as HeadlampTable,
  Tabs as HeadlampTabs,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useEffect, useState } from 'react';
import { RoutingPath } from '../index';
import { deepListQuery, generatedNetworkPolicyClass } from '../model';
import { listQuery } from '../model';
import { GeneratedNetworkPolicy } from '../softwarecomposition/GeneratedNetworkPolicy';
import { KnownServer } from '../softwarecomposition/KnownServer';

export default function KubescapeNetworkPolicies() {
  return (
    <>
      <h1>Generated Network Policies</h1>
      <HeadlampTabs
        tabs={[
          {
            label: 'Policies',
            component: <NetworkPolicyList />,
          },
          {
            label: 'Known Servers',
            component: <KnownServerList />,
          },
        ]}
        ariaLabel="Navigation Tabs"
      />
    </>
  );
}

function NetworkPolicyList() {
  const [networkPolicies, setNetworkPolicies]: [any, any] = useState<GeneratedNetworkPolicy>(null);

  useEffect(() => {
    listQuery(
      generatedNetworkPolicyClass.apiEndpoint.apiInfo[0].group,
      generatedNetworkPolicyClass.apiEndpoint.apiInfo[0].version,
      'generatednetworkpolicies'
    ).then((result: any) => {
      setNetworkPolicies(result.items);
    });
  }, []);

  if (!networkPolicies) {
    return <></>;
  }

  return (
    <>
      <SectionBox>
        <HeadlampTable
          data={networkPolicies}
          columns={[
            {
              header: 'Name',
              accessorFn: (networkPolicy: GeneratedNetworkPolicy) => {
                return (
                  <HeadlampLink
                    routeName={RoutingPath.KubescapeNetworkPolicyDiagram}
                    params={{
                      name: networkPolicy.metadata.name,
                      namespace: networkPolicy.metadata.namespace,
                    }}
                  >
                    {networkPolicy.metadata.labels['kubescape.io/workload-name']}
                  </HeadlampLink>
                );
              },
              gridTemplate: 'auto',
            },
            {
              header: 'Kind',
              accessorFn: (networkPolicy: GeneratedNetworkPolicy) =>
                networkPolicy.metadata.labels['kubescape.io/workload-kind'],
              gridTemplate: 'auto',
            },
            {
              header: 'Namespace',
              accessorFn: (networkPolicy: GeneratedNetworkPolicy) =>
                networkPolicy.metadata.labels['kubescape.io/workload-namespace'],
              gridTemplate: 'auto',
            },
            {
              header: 'Ingresses',
              accessorFn: (networkPolicy: GeneratedNetworkPolicy) =>
                networkPolicy.spec.spec.ingress?.length,
              gridTemplate: 'min-content',
            },
            {
              header: 'Egresses',
              accessorFn: (networkPolicy: GeneratedNetworkPolicy) =>
                networkPolicy.spec.spec.egress?.length,
              gridTemplate: 'min-content',
            },
          ]}
        />
      </SectionBox>
    </>
  );
}

function KnownServerList() {
  const [knownServers, setKnownServers]: [KnownServer[], any] = useState<KnownServer[]>(null);

  useEffect(() => {
    deepListQuery('knownservers').then((result: any) => {
      setKnownServers(result);
    });
  }, []);

  if (!knownServers) {
    return <></>;
  }

  class KnownServerEntry {
    knownServer: KnownServer;
    entry: KnownServer.Entry;

    constructor(knownServer: KnownServer, entry: KnownServer.Entry) {
      this.knownServer = knownServer;
      this.entry = entry;
    }
  }
  const serverEntries = knownServers.flatMap(ks =>
    ks.spec.map(entry => new KnownServerEntry(ks, entry))
  );

  return (
    <>
      <SectionBox>
        <HeadlampTable
          data={serverEntries}
          columns={[
            {
              header: 'Item',
              accessorFn: (item: KnownServerEntry) => item.knownServer.metadata.name,
              gridTemplate: 'auto',
            },
            {
              header: 'Name',
              accessorFn: (item: KnownServerEntry) => item.entry.name,
              gridTemplate: 'auto',
            },
            {
              header: 'Server',
              accessorFn: (item: KnownServerEntry) => item.entry.server,
              gridTemplate: 'auto',
            },
            {
              header: 'IPBlock',
              accessorFn: (item: KnownServerEntry) => item.entry.ipBlock,
              gridTemplate: 'auto',
            },
          ]}
        />
      </SectionBox>
    </>
  );
}
