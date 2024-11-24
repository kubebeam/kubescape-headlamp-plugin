export interface NodeAgentLogLine {
  BaseRuntimeMetadata: BaseRuntimeMetadata;
  RuleID: string;
  RuntimeK8sDetails: RuntimeK8SDetails;
  level: string;
  message: string;
  msg: string;
  time: Date;
}

export interface BaseRuntimeMetadata {
  alertName: string;
  arguments: Arguments;
  infectedPID: number;
  fixSuggestions: string;
  severity: number;
  size: string;
  timestamp: Date;
}

export interface Arguments {
  retval: number;
}

export interface RuntimeK8SDetails {
  clusterName: string;
  containerName: string;
  hostNetwork: boolean;
  image: string;
  namespace: string;
  containerID: string;
  podName: string;
  podNamespace: string;
  workloadName: string;
  workloadNamespace: string;
  workloadKind: string;
}
