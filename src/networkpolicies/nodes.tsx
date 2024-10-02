/* 
  Create nodes for the networkpolicy diagram. 
*/
import { Tooltip } from '@mui/material';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import * as yaml from 'js-yaml';
import {
  GeneratedNetworkPolicy,
  NetworkPolicy,
} from '../softwarecomposition/GeneratedNetworkPolicy';
import { K8sNamespace, LogosKubernetes, TablerWorld } from './icons';

const sourceHandle = <Handle type="source" position={Position.Right} id="source" />;
const targetHandle = <Handle type="target" position={Position.Left} id="target" />;

export type ConnectedNode = Node<{
  peer: NetworkPolicy.Peer;
  policy: GeneratedNetworkPolicy;
  ports: NetworkPolicy.Port[];
}>;

const MainNode = (props: NodeProps<ConnectedNode>) => {
  const { data } = props;

  const hasIngress =
    data.policy.spec.spec.ingress && Object.entries(data.policy.spec.spec.ingress).length > 0;
  const hasEgress =
    data.policy.spec.spec.egress && Object.entries(data.policy.spec.spec.egress).length > 0;

  return (
    <div className="network-node">
      <div className="title">
        <LogosKubernetes /> {data.policy.metadata.labels['kubescape.io/workload-namespace']}
      </div>
      <div className="text">
        {data.policy.metadata.labels['kubescape.io/workload-kind']}{' '}
        {data.policy.metadata.labels['kubescape.io/workload-name']}
      </div>
      {hasIngress ? targetHandle : ''}
      {hasEgress ? sourceHandle : ''}
    </div>
  );
};

const ConnectedNode = (props: NodeProps<ConnectedNode>) => {
  const { type, data } = props;

  const peerYaml = yaml.dump(data.peer);

  return (
    <Tooltip title={<pre>{peerYaml}</pre>} slotProps={{ tooltip: { sx: { fontSize: '0.9em' } } }}>
      <div className="network-node">
        <div className="title">
          {peerIcon(data.peer)} {peerOrigin(data.peer)}
        </div>
        <div className="text">{namespaceSelector(data.peer)}</div>
        <div className="text">{podSelector(data.peer)}</div>
        <div className="text">{ipSelector(data.policy, data.peer)}</div>
        <div className="text">{portsToString(data.ports)}</div>
        {type === 'sourceNode' ? sourceHandle : targetHandle}
      </div>
    </Tooltip>
  );
};

export const nodeTypes = {
  sourceNode: ConnectedNode,
  targetNode: ConnectedNode,
  mainNode: MainNode,
};

function portsToString(ports: NetworkPolicy.Port[]): string {
  let text = '';
  if (ports) {
    for (const port of ports) {
      text += `${port.protocol}:${port.port}`;
    }
  }
  return text;
}

function podSelector(peer: NetworkPolicy.Peer): string {
  let text = '';
  if (peer.podSelector?.matchLabels) {
    const labels = peer.podSelector.matchLabels;
    text += 'pod: ' + labelsToString(labels);
  }
  if (peer.podSelector?.matchExpressions) {
    const expressions = peer.podSelector.matchExpressions;
    text += ' with expressions ' + expressionsToString(expressions);
  }

  return text;
}

function namespaceSelector(peer: NetworkPolicy.Peer): string {
  let text = '';
  if (peer.namespaceSelector?.matchLabels) {
    const labels = peer.namespaceSelector.matchLabels;
    if (!isSingleNamespaceSelector(labels)) {
      text += 'namespace: ' + labelsToString(labels);
    }
  }
  if (peer.namespaceSelector?.matchExpressions) {
    const expressions = peer.namespaceSelector.matchExpressions;
    text += ' with expressions ' + expressionsToString(expressions);
  }
  return text;
}

function ipSelector(policy: GeneratedNetworkPolicy, peer: NetworkPolicy.Peer): string {
  let text = '';
  if (peer.ipBlock) {
    const ref = policy.policyRef?.find(ref => ref.ipBlock === peer.ipBlock?.cidr);
    if (ref) {
      text += ref.dns;
    }
    text += peer.ipBlock.cidr;
  }
  return text;
}

function isSingleNamespaceSelector(labels: NetworkPolicy.LabelSelector): boolean {
  return (
    Object.keys(labels).length === 1 && Object.keys(labels)[0] === 'kubernetes.io/metadata.name'
  );
}

function labelsToString(labels: { [key: string]: string }): string {
  return Object.entries(labels)
    .map(([k, v]) => `${k}=${v.length > 0 ? v : '""'}`)
    .join(', ');
}

function expressionsToString(expressions: NetworkPolicy.LabelSelectorRequirement[]): string {
  return expressions.map(e => `${e.key}${e.operator}${e.values}`).join(', ');
}

function peerOrigin(peer: NetworkPolicy.Peer): string {
  if (peer.namespaceSelector?.matchLabels) {
    const labels = peer.namespaceSelector.matchLabels;
    if (
      Object.keys(labels).length === 1 &&
      Object.keys(labels)[0] === 'kubernetes.io/metadata.name'
    ) {
      return Object.values(labels)[0];
    }
  }
  if (peer.ipBlock?.cidr && !peer.ipBlock.cidr.startsWith('10.')) {
    return 'Internet';
  }

  return 'k8s cluster';
}

function peerIcon(peer: NetworkPolicy.Peer): JSX.Element {
  if (peer.namespaceSelector) {
    return <K8sNamespace />;
  }
  if (peerOrigin(peer) === 'Internet') {
    return <TablerWorld />;
  }
  return <LogosKubernetes />;
}
