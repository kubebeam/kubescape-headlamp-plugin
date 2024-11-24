import { Icon } from '@iconify/react';
import { ApiProxy, K8s, KubeObject } from '@kinvolk/headlamp-plugin/lib';
import {
  NameValueTable,
  SectionBox,
  ShowHideLabel,
  Table as HeadlampTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { createRouteURL } from '@kinvolk/headlamp-plugin/lib/Router';
import { localeDate } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import * as yaml from 'js-yaml';
import { useSnackbar } from 'notistack';
import { useEffect, useRef, useState } from 'react';
import { getURLSegments } from '../common/url';
import { applicationProfileClass } from '../model';
import { ApplicationProfile } from '../softwarecomposition/ApplicationProfile';
import { AlertMessagePopup } from './AlertMessagePopup';
import { NodeAgentLogLine } from './NodeAgentLogLine';
import { ProfilePopup } from './ProfilePopup';

export function RuntimeDetection() {
  const [name, namespace] = getURLSegments(-1, -2);
  const [profileObject, setApplicationProfile] = useState<KubeObject | null>(null);

  applicationProfileClass.useApiGet(setApplicationProfile, name, namespace);

  if (!profileObject) {
    return <></>;
  }

  const profile: ApplicationProfile = profileObject.jsonData;

  return (
    <>
      <SectionBox title="Runtime Detection">
        <Typography variant="body1" component="div" sx={{ flexGrow: 1 }}>
          You can perform a runtime detection test on this page. Start a terminal in a pod from the
          list below and view the alerts that will appear on this page.
          <br></br>
          Kubescape operator should be configured with "capabilities.runtimeDetection: enable" and
          "alertCRD.installDefault: true". For testing a short learning period is recommended:
          "nodeAgent.config.maxLearningPeriod: 10m".
        </Typography>
      </SectionBox>

      <SectionBox title="Application Profile">
        <ProfilePopup content={yaml.dump(profile)}></ProfilePopup>
        <NameValueTable
          rows={[
            {
              name: 'Workload',
              value: profile.metadata.labels['kubescape.io/workload-name'],
            },
            {
              name: 'Kind',
              value: profile.metadata.labels['kubescape.io/workload-kind'],
            },
            {
              name: 'Namespace',
              value: profile.metadata.namespace,
            },
          ]}
        />
      </SectionBox>

      <PodList profile={profile} />

      <NodeAgentLogging workload={profile.metadata.labels['kubescape.io/workload-name']} />
    </>
  );
}

function PodList(props: { profile: ApplicationProfile }) {
  const { profile } = props;
  const workloadKind = profile.metadata.labels['kubescape.io/workload-kind'];
  const namespace = profile.metadata.namespace;
  const [selectedPod, setSelectedPod] = useState(null);
  const [deployment, setDeployment] = useState<KubeObject>(null);
  const [pods, setPods] = useState<any[]>([]);

  // first we need to get the matchLabels from the deployment
  K8s.ResourceClasses[workloadKind].useApiGet(
    setDeployment,
    profile.metadata.labels['kubescape.io/workload-name'],
    namespace
  );

  // Use the matchLabels to get the pods
  useEffect(() => {
    if (deployment) {
      const labelSelector = Object.entries(deployment.jsonData.spec.selector.matchLabels)
        .map(entry => `${encodeURIComponent(entry[0])}=${encodeURIComponent(entry[1] as string)}`)
        .join(',');

      ApiProxy.request(`/api/v1/namespaces/${namespace}/pods?labelSelector=${labelSelector}`).then(
        (result: any) => {
          setPods(result.items);
        }
      );
    }
  }, [deployment]);

  return (
    <SectionBox title="Pods">
      <Stack direction="column">
        {pods.map(pod => (
          <Box key={pod.metadata.name}>
            <Tooltip
              title={`Open terminal in pod ${pod.metadata.name}`}
              slotProps={{ tooltip: { sx: { fontSize: '0.9em' } } }}
            >
              <IconButton
                aria-describedby={pod.metadata.name}
                tooltipProps={{ text: 'Add bold text' }}
                onClick={() => setSelectedPod(pod)}
              >
                <Icon icon="mdi:console" />
              </IconButton>
            </Tooltip>
            {pod.metadata.name}
          </Box>
        ))}
      </Stack>
      <PodExec pod={selectedPod} />
      <iframe title="Pod Exec" key="iframe" id="exec-pod" hidden width={600} height="400"></iframe>
    </SectionBox>
  );
}

function PodExec(props: { pod: any }) {
  const { pod } = props;
  const { enqueueSnackbar } = useSnackbar();

  const podFrame = window.document.getElementById('exec-pod') as HTMLIFrameElement;

  if (!pod) {
    return <></>;
  }

  podFrame.src = createRouteURL('pod', {
    namespace: pod.metadata.namespace,
    name: pod.metadata.name,
  });
  podFrame.hidden = false;

  // click the button 'Terminal / Exec' in the IFrame with the Pod page
  const openPodTerminal = () => {
    const buttons = podFrame?.contentWindow?.document?.getElementsByTagName('button') ?? [];
    const execButton = Array.from(buttons).find(button => button.ariaLabel === 'Terminal / Exec');

    if (!execButton) {
      setTimeout(openPodTerminal, 1000);
      return;
    }

    setTimeout(() => {
      enqueueSnackbar(`open terminal in pod ${pod.metadata.name}`);
      execButton.click();
    }, 1000);
  };

  openPodTerminal();
}

function NodeAgentLogging(props: { workload: string }) {
  const { workload } = props;
  const [alerts, setAlerts] = useState<NodeAgentLogLine[]>([]);
  const [nodeAgents] = K8s.ResourceClasses.Pod.useList({
    labelSelector: 'app.kubernetes.io/component=node-agent,app.kubernetes.io/instance=kubescape',
  });
  const nodeAlerts = useRef<Map<string, NodeAgentLogLine[]>>(new Map());

  if (!nodeAgents) {
    return <></>;
  }

  function setNodeAgentAlerts(nodeName: string, lines: NodeAgentLogLine[]) {
    nodeAlerts.current.set(nodeName, lines);
    const all = Array.from(nodeAlerts.current.values()).flatMap(lines => lines);
    setAlerts(all);
  }

  return (
    <>
      <SectionBox title="Alerts">
        {nodeAgents.map((nodeAgent: KubeObject) => (
          <NodeLog
            nodeAgent={nodeAgent}
            setNodeAgentAlerts={setNodeAgentAlerts}
            workload={workload}
          />
        ))}
        <HeadlampTable
          data={alerts}
          columns={[
            {
              id: 'time',
              header: 'Time',
              accessorKey: 'time',
              gridTemplate: '1fr',
              Cell: ({ cell }: any) => {
                const startOfToday = new Date().setUTCHours(0, 0, 0, 0);
                if (new Date(cell.getValue()) < new Date(startOfToday)) {
                  return localeDate(cell.getValue());
                } else {
                  return new Date(cell.getValue()).toLocaleTimeString();
                }
              },
            },
            {
              header: 'Message',
              accessorKey: 'message',
              gridTemplate: '2fr',
            },
            {
              header: 'Pod',
              accessorKey: 'RuntimeK8sDetails.podName',
              gridTemplate: '1fr',
            },
            {
              header: 'Workload',
              accessorKey: 'RuntimeK8sDetails.workloadName',
              gridTemplate: '1fr',
            },
            {
              header: 'Namespace',
              accessorKey: 'RuntimeK8sDetails.workloadNamespace',
              gridTemplate: '1fr',
            },
            {
              header: 'Node',
              accessorKey: 'nodeName',
              gridTemplate: '1fr',
            },
            {
              header: 'Fix',
              accessorKey: 'BaseRuntimeMetadata.fixSuggestions',
              Cell: ({ cell }: any) => <ShowHideLabel>{cell.getValue()}</ShowHideLabel>,
              gridTemplate: '4fr',
            },
            {
              header: '',
              accessorFn: () => '...',
              Cell: ({ row }: any) => (
                <AlertMessagePopup
                  content={JSON.stringify(row.original, null, 2)}
                ></AlertMessagePopup>
              ),
              gridTemplate: '0.1fr',
            },
          ]}
          initialState={{
            sorting: [
              {
                id: 'time',
                desc: true,
              },
            ],
          }}
        />
      </SectionBox>
    </>
  );
}

function NodeLog(props: { nodeAgent: KubeObject; setNodeAgentAlerts: any; workload: string }) {
  const { nodeAgent, setNodeAgentAlerts, workload } = props;

  useEffect(() => {
    let callback: any = null;
    const nodeName = nodeAgent.jsonData.metadata.name;

    function setlogChunks(lines: string[]) {
      const nodeAgentAlerts = parseLogChunks(nodeName, workload, lines).filter(
        line => line.BaseRuntimeMetadata
      );

      setNodeAgentAlerts(nodeName, nodeAgentAlerts);
    }

    callback = nodeAgent.getLogs('node-agent', setlogChunks, {
      tailLines: 200,
    });

    return function cleanup() {
      if (callback) {
        console.log('Cleanup callback for ' + nodeAgent.jsonData.spec.nodeName);
        callback();
      }
    };
  }, [nodeAgent]);

  return <></>;
}

// chunks are just blocks from the log stream.
// in each call to this method we get all the log chunks, this is how nodeAgent.getLogs() works
function parseLogChunks(nodeName: string, workload: string, logChunks: string[]) {
  const nodeAgentLogLines: NodeAgentLogLine[] = [];

  // join the chunks and split on newline
  const lines = logChunks.join('').split('\n');

  lines.map(line => {
    // throw away lines which are non-json
    if (!line.startsWith('{') || !line.endsWith('}')) {
      return;
    }

    try {
      const jsonLine: NodeAgentLogLine = JSON.parse(line);
      jsonLine.nodeName = nodeName;
      if (jsonLine.RuntimeK8sDetails.workloadName === workload) {
        nodeAgentLogLines.push(jsonLine);
      }
    } catch (e) {
      // ignore, the last chunk might not be complete
    }
  });

  return nodeAgentLogLines;
}
