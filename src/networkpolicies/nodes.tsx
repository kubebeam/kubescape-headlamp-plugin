/* 
  Show the configuration findings for workloads in a single namespace.  
*/
import '@xyflow/react/dist/style.css';
import '@xyflow/react/dist/style.css';
import './style.css';
import { Tooltip } from '@mui/material';
import { Handle, Position } from '@xyflow/react';
import * as yaml from 'js-yaml';
import type { SVGProps } from 'react';
import {
  GeneratedNetworkPolicy,
  NetworkPolicy,
} from '../softwarecomposition/GeneratedNetworkPolicy';
import K8sNamespace from './ns';

const sourceHandle = <Handle type="source" position={Position.Right} id="source" />;
const targetHandle = <Handle type="target" position={Position.Left} id="target" />;

const MainNode = ({ data }: any) => {
  const hasIngress =
    data.policy.spec.spec.ingress && Object.entries(data.policy.spec.spec.ingress).length > 0;
  const hasEgress =
    data.policy.spec.spec.egress && Object.entries(data.policy.spec.spec.egress).length > 0;

  return (
    <div className="network-node">
      <div className="title">
        <LogosKubernetes /> {data.policy.metadata.labels['kubescape.io/workload-namespace']}
      </div>
      <div className="text">{data.policy.metadata.labels['kubescape.io/workload-name']}</div>
      {hasIngress ? targetHandle : ''}
      {hasEgress ? sourceHandle : ''}
    </div>
  );
};

const ConnectedNode = ({ data }: any) => {
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
        {data.type === 'source' ? sourceHandle : targetHandle}
      </div>
    </Tooltip>
  );
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

export function LogosKubernetes(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1.03em"
      height="1.1em"
      viewBox="0 0 256 249"
      {...props}
    >
      <path
        fill="#326de6"
        d="M82.085 244.934c-5.946 0-11.561-2.642-15.36-7.432L8.92 165.657c-3.799-4.79-5.285-10.9-3.799-16.847l20.645-89.682c1.321-5.946 5.285-10.736 10.736-13.378l83.571-39.97c2.643-1.32 5.616-1.981 8.589-1.981s5.945.66 8.588 1.982l83.572 39.804c5.45 2.642 9.414 7.432 10.735 13.378l20.645 89.682c1.322 5.946 0 12.057-3.798 16.847l-57.807 71.845c-3.799 4.624-9.414 7.432-15.36 7.432z"
      ></path>
      <path
        fill="#fff"
        d="M128.495 7.928c2.313 0 4.625.495 6.772 1.486l83.572 39.804c4.294 2.147 7.597 6.111 8.588 10.736l20.645 89.682c1.156 4.79 0 9.745-3.138 13.543l-57.806 71.846c-2.973 3.798-7.598 5.945-12.387 5.945H82.085c-4.79 0-9.414-2.147-12.387-5.945l-57.806-71.846c-2.973-3.798-4.13-8.753-3.138-13.543l20.645-89.682c1.156-4.79 4.294-8.754 8.588-10.736L121.56 9.25c2.147-.826 4.624-1.321 6.936-1.321m0-7.763c-3.468 0-6.936.826-10.24 2.312l-83.571 39.97c-6.607 3.138-11.231 8.918-12.883 16.02L1.156 148.15c-1.651 7.102 0 14.369 4.625 20.15l57.806 71.845c4.46 5.615 11.231 8.753 18.333 8.753h92.655c7.102 0 13.874-3.138 18.333-8.753l57.807-71.846c4.624-5.615 6.276-13.047 4.624-20.15l-20.645-89.682c-1.651-7.102-6.276-12.882-12.882-16.02L138.57 2.476C135.432.991 131.964.165 128.495.165"
      ></path>
      <path
        fill="#fff"
        d="M212.232 142.534q-.248 0 0 0h-.165c-.165 0-.33 0-.33-.165c-.33 0-.66-.165-.991-.165c-1.156-.165-2.147-.33-3.138-.33c-.496 0-.991 0-1.652-.166h-.165c-3.468-.33-6.276-.66-8.919-1.486c-1.156-.496-1.486-1.156-1.817-1.817c0-.165-.165-.165-.165-.33l-2.147-.66a65.3 65.3 0 0 0-1.156-23.289a68 68 0 0 0-9.249-21.636l1.652-1.486v-.33c0-.826.165-1.652.825-2.478c1.982-1.817 4.46-3.303 7.433-5.12c.495-.33.99-.495 1.486-.826c.991-.495 1.817-.99 2.808-1.651c.165-.165.495-.33.826-.66c.165-.166.33-.166.33-.331c2.312-1.982 2.808-5.285 1.156-7.433c-.826-1.156-2.312-1.816-3.799-1.816c-1.32 0-2.477.495-3.633 1.321l-.33.33c-.33.165-.496.496-.826.661c-.826.826-1.487 1.486-2.147 2.312c-.33.33-.66.826-1.156 1.156c-2.313 2.478-4.46 4.46-6.607 5.946q-.742.495-1.486.496c-.33 0-.661 0-.991-.166h-.33l-1.983 1.322c-2.147-2.312-4.459-4.294-6.771-6.276a65.96 65.96 0 0 0-34.519-13.709l-.165-2.147l-.33-.33c-.496-.496-1.156-.991-1.322-2.147c-.165-2.643.166-5.616.496-8.919v-.165c0-.496.165-1.156.33-1.652c.165-.99.33-1.982.496-3.138v-1.486c0-2.973-2.313-5.45-5.12-5.45c-1.322 0-2.643.66-3.634 1.651c-.99.991-1.486 2.312-1.486 3.799v1.321c0 1.156.165 2.147.495 3.138c.165.496.165.991.33 1.652v.165c.33 3.303.826 6.276.496 8.919c-.165 1.156-.826 1.651-1.321 2.147l-.33.33l-.166 2.147c-2.973.33-5.946.66-8.919 1.321c-12.717 2.808-23.948 9.25-32.701 18.498l-1.652-1.156h-.33c-.33 0-.661.165-.991.165q-.743 0-1.487-.495c-2.147-1.486-4.294-3.634-6.606-6.111c-.33-.33-.66-.826-1.156-1.156c-.661-.826-1.322-1.487-2.148-2.312c-.165-.166-.495-.33-.825-.661c-.165-.165-.33-.165-.33-.33a5.77 5.77 0 0 0-3.634-1.322c-1.487 0-2.973.661-3.799 1.817c-1.652 2.147-1.156 5.45 1.156 7.432c.165 0 .165.166.33.166c.33.165.496.495.826.66c.991.66 1.817 1.156 2.808 1.652c.496.165.991.495 1.487.826c2.972 1.816 5.45 3.303 7.432 5.12c.826.825.826 1.651.826 2.477v.33l1.651 1.487c-.33.495-.66.826-.826 1.321c-8.258 13.048-11.396 28.408-9.249 43.603l-2.147.66c0 .166-.165.166-.165.33c-.33.661-.826 1.322-1.817 1.817c-2.477.826-5.45 1.157-8.918 1.487h-.166c-.495 0-1.156 0-1.651.165c-.991 0-1.982.165-3.138.33c-.33 0-.66.166-.991.166c-.165 0-.33 0-.496.165c-2.973.66-4.79 3.468-4.294 6.11c.496 2.313 2.643 3.8 5.285 3.8c.496 0 .826 0 1.322-.166c.165 0 .33 0 .33-.165c.33 0 .66-.165.99-.165c1.157-.33 1.983-.66 2.974-1.156c.495-.165.99-.496 1.486-.66h.165c3.138-1.157 5.946-2.148 8.589-2.478h.33c.991 0 1.652.495 2.147.826c.165 0 .165.165.33.165l2.313-.33c3.964 12.221 11.561 23.122 21.636 31.05c2.312 1.816 4.624 3.303 7.102 4.79l-.991 2.146c0 .166.165.166.165.33c.33.661.66 1.487.33 2.643c-.99 2.478-2.477 4.955-4.294 7.763v.165c-.33.496-.66.826-.99 1.321c-.661.826-1.157 1.652-1.818 2.643c-.165.165-.33.495-.495.826c0 .165-.165.33-.165.33c-1.321 2.808-.33 5.946 2.147 7.102q.99.496 1.982.496c1.982 0 3.964-1.322 4.955-3.139c0-.165.165-.33.165-.33c.165-.33.33-.66.495-.826c.496-1.156.661-1.982.991-2.973l.496-1.486c1.156-3.303 1.982-5.946 3.468-8.258c.66-.991 1.487-1.156 2.147-1.487c.165 0 .165 0 .33-.165l1.157-2.147c7.267 2.808 15.195 4.294 23.122 4.294c4.79 0 9.745-.495 14.37-1.651a73 73 0 0 0 8.588-2.478l.99 1.817c.166 0 .166 0 .331.165c.826.165 1.486.496 2.147 1.487c1.321 2.312 2.312 5.12 3.468 8.258v.165l.496 1.486c.33.991.495 1.982.99 2.973c.166.33.331.496.496.826c0 .165.166.33.166.33c.99 1.982 2.972 3.139 4.954 3.139q.992 0 1.982-.496c1.156-.66 2.147-1.652 2.478-2.973c.33-1.321.33-2.808-.33-4.129c0-.165-.166-.165-.166-.33c-.165-.33-.33-.66-.495-.826c-.496-.991-1.156-1.817-1.817-2.643c-.33-.495-.66-.825-.99-1.32v-.166c-1.818-2.808-3.47-5.285-4.295-7.763c-.33-1.156 0-1.816.165-2.642c0-.165.165-.165.165-.33l-.826-1.982c8.754-5.12 16.186-12.388 21.802-21.306c2.973-4.625 5.285-9.745 6.936-14.865l1.982.33c.166 0 .166-.165.33-.165c.661-.33 1.157-.825 2.148-.825h.33c2.643.33 5.45 1.32 8.589 2.477h.165c.495.165.99.495 1.486.66c.991.496 1.817.826 2.973 1.157c.33 0 .66.165.991.165c.165 0 .33 0 .495.165c.496.165.826.165 1.322.165c2.477 0 4.624-1.651 5.285-3.798c0-1.982-1.817-4.625-4.79-5.45m-76.47-8.093l-7.267 3.469l-7.267-3.469l-1.816-7.762l4.954-6.276h8.093l4.955 6.276zm43.108-17.176a52.1 52.1 0 0 1 1.156 16.68l-25.27-7.266c-2.312-.66-3.633-2.973-3.138-5.285c.165-.661.496-1.322.991-1.817l19.985-18.003c2.807 4.625 4.954 9.91 6.276 15.69m-14.204-25.6l-21.636 15.36c-1.817 1.156-4.295.825-5.781-.991c-.495-.496-.66-1.157-.826-1.817l-1.486-26.922a50.13 50.13 0 0 1 29.729 14.37M116.769 78.12c1.817-.33 3.468-.66 5.285-.99l-1.486 26.425c-.165 2.312-1.982 4.294-4.46 4.294c-.66 0-1.486-.165-1.982-.495L92.16 91.665c6.772-6.772 15.195-11.397 24.609-13.544m-32.537 23.453l19.654 17.507c1.817 1.487 1.982 4.294.496 6.111c-.496.66-1.156 1.156-1.982 1.322l-25.6 7.432c-.991-11.231 1.486-22.627 7.432-32.372m-4.46 44.759l26.262-4.46c2.147-.165 4.129 1.322 4.624 3.469c.165.99.165 1.817-.165 2.643l-10.075 24.278c-9.249-5.946-16.681-15.03-20.645-25.93m60.285 32.867c-3.799.826-7.598 1.321-11.562 1.321c-5.78 0-11.396-.99-16.68-2.642l13.047-23.618c1.321-1.487 3.468-2.147 5.285-1.156a7 7 0 0 1 1.982 1.816l12.717 22.958c-1.486.495-3.138.826-4.79 1.321m32.206-22.957c-4.129 6.606-9.58 11.891-15.855 16.02l-10.405-24.94c-.496-1.981.33-4.128 2.312-5.12c.66-.33 1.486-.495 2.312-.495l26.426 4.46c-.991 3.633-2.643 6.937-4.79 10.075"
      ></path>
    </svg>
  );
}

export function TablerWorld(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      >
        <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0m.6-3h16.8M3.6 15h16.8"></path>
        <path d="M11.5 3a17 17 0 0 0 0 18m1-18a17 17 0 0 1 0 18"></path>
      </g>
    </svg>
  );
}

export const nodeTypes = {
  sourceNode: ConnectedNode,
  targetNode: ConnectedNode,
  mainNode: MainNode,
};
