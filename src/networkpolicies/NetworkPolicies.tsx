/* 
  List generated network policies. 
*/
import './style.css';
import {
  Link as HeadlampLink,
  SectionBox,
  Table as HeadlampTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useEffect, useState } from 'react';
import { RoutingPath } from '../index';
import { generatedNetworkPolicy } from '../model';
import { listQuery } from '../model';
import { GeneratedNetworkPolicy } from '../softwarecomposition/GeneratedNetworkPolicy';

export default function KubescapeNetworkPolicies() {
  const [networkPolicies, setNetworkPolicies]: [any, any] = useState<GeneratedNetworkPolicy>(null);

  useEffect(() => {
    listQuery(
      generatedNetworkPolicy.apiEndpoint.apiInfo[0].group,
      generatedNetworkPolicy.apiEndpoint.apiInfo[0].version,
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
                    {networkPolicy.metadata.name}
                  </HeadlampLink>
                );
              },
              gridTemplate: 'max-content',
            },
          ]}
        />
      </SectionBox>
    </>
  );
}
