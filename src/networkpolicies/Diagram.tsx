/* 
  Show diagram with generated network policies. 
*/
import '@xyflow/react/dist/style.css';
import './style.css';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { Edge, MarkerType, Node, ReactFlow } from '@xyflow/react';
import { useState } from 'react';
import { generatedNetworkPolicy } from '../model';
import { GeneratedNetworkPolicy } from '../softwarecomposition/GeneratedNetworkPolicy';
import { getURLSegments } from '../utils/url';
import { nodeTypes } from './nodes';

export default function KubescapeNetworkPolicyDiagram() {
  const [policyName, policyNamespace] = getURLSegments(-1, -2);
  const [networkPolicyObject, setNetworkPolicy]: [KubeObject, any] = useState<KubeObject>(null);

  generatedNetworkPolicy.useApiGet(setNetworkPolicy, policyName, policyNamespace);

  if (!networkPolicyObject) {
    return <></>;
  }

  const networkPolicy: GeneratedNetworkPolicy = networkPolicyObject.jsonData;
  const { nodes, edges } = createNodes(networkPolicy);

  return (
    <>
      <div style={{ height: 1200, width: 1600 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          colorMode={localStorage.headlampThemePreference}
          fitView
          fitViewOptions={{ maxZoom: 1 }}
        ></ReactFlow>
      </div>
    </>
  );
}

function createNodes(networkPolicy: GeneratedNetworkPolicy): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const verticalDistance = 100;
  const horizDistance = 400;

  const numIngressEdges = networkPolicy.spec.spec.ingress
    ? networkPolicy.spec.spec.ingress.flatMap(i => i.from).length
    : 0;
  const numEgressEdges = networkPolicy.spec.spec.egress
    ? networkPolicy.spec.spec.egress.flatMap(e => e.to).length
    : 0;

  const workloadNode: Node = {
    id: 'main',
    data: {
      policy: networkPolicy,
    },
    position: {
      x: 1 * horizDistance,
      y: (Math.max(numEgressEdges, numIngressEdges) * verticalDistance) / 2,
    },
    type: 'mainNode',
  };
  nodes.push(workloadNode);

  let ingressCount = numEgressEdges > numIngressEdges ? (numEgressEdges - numIngressEdges) / 2 : 0;
  if (networkPolicy.spec.spec.ingress) {
    for (const ingress of networkPolicy.spec.spec.ingress) {
      if (!ingress.from) {
        continue;
      }
      for (const from of ingress.from) {
        const node: Node = {
          id: nodes.length.toString(),
          data: {
            peer: from,
            policy: networkPolicy,
            ports: ingress.ports,
            type: 'source',
          },
          position: {
            x: 0,
            y: numIngressEdges === 1 ? workloadNode.position.y : ingressCount++ * verticalDistance,
          },
          type: 'sourceNode',
        };
        nodes.push(node);

        const edge: Edge = {
          id: edges.length.toString(),
          source: node.id,
          target: workloadNode.id,
          type: 'step',
          markerEnd: { type: MarkerType.Arrow },
        };
        edges.push(edge);
      }
    }
  }

  let egressCount = numIngressEdges > numEgressEdges ? (numIngressEdges - numEgressEdges) / 2 : 0;
  if (networkPolicy.spec.spec.egress) {
    for (const egress of networkPolicy.spec.spec.egress) {
      if (!egress.to) {
        continue;
      }
      for (const to of egress.to) {
        const node: Node = {
          id: nodes.length.toString(),
          data: {
            peer: to,
            policy: networkPolicy,
            ports: egress.ports,
            type: 'target',
          },
          position: {
            x: 2 * horizDistance,
            y: numEgressEdges === 1 ? workloadNode.position.y : egressCount++ * verticalDistance,
          },
          type: 'targetNode',
        };
        nodes.push(node);

        const edge: Edge = {
          id: edges.length.toString(),
          source: workloadNode.id,
          target: node.id,
          type: 'step',
          markerEnd: { type: MarkerType.Arrow },
        };
        edges.push(edge);
      }
    }
  }
  return { nodes, edges };
}
