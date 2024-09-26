/* 
  Show diagram with generated network policies. 
*/
import '@xyflow/react/dist/style.css';
import './style.css';
import { ColorMode, Edge, MarkerType, Node, ReactFlow } from '@xyflow/react';
import { useState } from 'react';
import { generatedNetworkPolicy } from '../model';
import { GeneratedNetworkPolicy } from '../softwarecomposition/GeneratedNetworkPolicy';
import { getURLSegments } from '../utils/url';
import { nodeTypes } from './nodes';

export default function KubescapeNetworkPolicyDiagram() {
  const [policyName, policyNamespace] = getURLSegments(-1, -2);
  const [networkPolicyObject, setNetworkPolicy]: [any, any] =
    useState<GeneratedNetworkPolicy>(null);

  generatedNetworkPolicy.useApiGet(setNetworkPolicy, policyName, policyNamespace);

  if (!networkPolicyObject) {
    return <></>;
  }

  const networkPolicy: GeneratedNetworkPolicy = networkPolicyObject.jsonData;
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  let nodeId = 1;
  let edgeId = 1;

  const workloadNode: Node = {
    id: (nodeId++).toString(),
    data: {
      policy: networkPolicy,
    },
    position: {
      x: 400,
      y: 100,
    },
    type: 'mainNode',
  };
  nodes.push(workloadNode);

  let ingressCount = 0;
  if (networkPolicy.spec.spec.ingress) {
    for (const ingress of networkPolicy.spec.spec.ingress) {
      if (!ingress.from) {
        continue;
      }
      for (const from of ingress.from) {
        const node: Node = {
          id: (nodeId++).toString(),
          data: {
            peer: from,
            policy: networkPolicy,
            ports: ingress.ports,
            type: 'source',
          },
          position: {
            x: 0,
            y: ingressCount++ * 100,
          },
          type: 'sourceNode',
        };
        nodes.push(node);

        const edge: Edge = {
          id: (edgeId++).toString(),
          source: node.id,
          target: workloadNode.id,
          type: 'step',
          markerEnd: { type: MarkerType.Arrow },
        };
        edges.push(edge);
      }
    }
  }
  let egressCount = 0;
  if (networkPolicy.spec.spec.egress) {
    for (const egress of networkPolicy.spec.spec.egress) {
      if (!egress.to) {
        continue;
      }
      for (const to of egress.to) {
        const node: Node = {
          id: (nodeId++).toString(),
          data: {
            peer: to,
            policy: networkPolicy,
            ports: egress.ports,
            type: 'target',
          },
          position: {
            x: 800,
            y: egressCount++ * 100,
          },
          type: 'targetNode',
        };
        nodes.push(node);

        const edge: Edge = {
          id: (edgeId++).toString(),
          source: workloadNode.id,
          target: node.id,
          type: 'step',
          markerEnd: { type: MarkerType.Arrow },
        };
        edges.push(edge);
      }
    }
  }

  const darkMode: ColorMode = 'dark';

  return (
    <>
      <div style={{ height: 1200, width: 1600 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          colorMode={darkMode}
          fitView
        ></ReactFlow>
      </div>
    </>
  );
}
