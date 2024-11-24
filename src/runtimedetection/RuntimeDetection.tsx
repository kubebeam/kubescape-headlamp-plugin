import { Icon } from '@iconify/react';
import { K8s, KubeObject } from '@kinvolk/headlamp-plugin/lib';
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
import { useEffect, useState } from 'react';
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
          You can perform a test with runtime detection on this page. Start a terminal in a pod in
          the list below and view the alerts that will appear on this page.
        </Typography>
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
            {
              name: <ProfilePopup content={yaml.dump(profile)}></ProfilePopup>,
            },
          ]}
        />
      </SectionBox>

      <PodList profile={profile} />

      <NodeAgentLogging />
    </>
  );
}

function PodList(props: { profile: ApplicationProfile }) {
  const { profile } = props;
  const workloadKind = profile.metadata.labels['kubescape.io/workload-kind'];
  const namespace = profile.metadata.namespace;
  const [selectedPod, setSelectedPod] = useState(null);

  const [deployment] = K8s.ResourceClasses[workloadKind].useGet(
    profile.metadata.labels['kubescape.io/workload-name'],
    namespace
  );

  const [pods]: [KubeObject[]] = K8s.ResourceClasses.Pod.useList({
    namespace: namespace,
    labelSelector: 'app=' + deployment?.jsonData?.spec?.selector?.matchLabels?.app,
  });

  return (
    <SectionBox title="Pods">
      <Stack direction="column">
        {pods?.map(pod => (
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
            {pod.jsonData.metadata.name}
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

function NodeAgentLogging() {
  const [nodeAgents] = K8s.ResourceClasses.Pod.useList({
    labelSelector: 'app.kubernetes.io/component=node-agent,app.kubernetes.io/instance=kubescape',
  });

  if (!nodeAgents) {
    return <></>;
  }

  return nodeAgents.map((nodeAgent: KubeObject) => <NodeLog nodeAgent={nodeAgent} />);
}

function NodeLog(props: { nodeAgent: KubeObject }) {
  const { nodeAgent } = props;

  const [nodeAgentAlerts, setNodeAgentAlerts] = useState<NodeAgentLogLine[]>([]);

  useEffect(() => {
    let callback: any = null;

    function setlogChunks(lines: string[]) {
      const nodeAgentAlerts = parseLogChunks(lines).filter(line => line.BaseRuntimeMetadata);

      setNodeAgentAlerts(nodeAgentAlerts);
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

  if (!nodeAgentAlerts || nodeAgentAlerts.length === 0) {
    return <p>No alerts on node {nodeAgent.jsonData.spec.nodeName}.</p>;
  }

  return (
    <>
      <SectionBox title={`Alerts ${nodeAgent.jsonData.spec.nodeName}`}>
        <HeadlampTable
          data={nodeAgentAlerts}
          columns={[
            {
              id: 'time',
              header: 'Time',
              accessorKey: 'time',
              gridTemplate: '2fr',
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
              header: 'Pod',
              accessorKey: 'RuntimeK8sDetails.podName',
              gridTemplate: '2fr',
            },
            {
              header: 'Workload',
              accessorKey: 'RuntimeK8sDetails.workloadName',
              gridTemplate: '2fr',
            },
            {
              header: 'Namespace',
              accessorKey: 'RuntimeK8sDetails.workloadNamespace',
              gridTemplate: '2fr',
            },
            {
              header: 'Message',
              accessorKey: 'message',
              gridTemplate: '2fr',
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

// chunks are just blocks from the log stream
// in each call to this method we get all the log chunks
function parseLogChunks(logChunks: string[]) {
  const nodeAgentLogLines: NodeAgentLogLine[] = [];
  const logFile = logChunks.join('');
  const lines = logFile.split('\n');

  lines.map(line => {
    // throw away lines which are non-json
    if (!line.startsWith('{') || !line.endsWith('}')) {
      return;
    }

    try {
      const jsonLine: NodeAgentLogLine = JSON.parse(line);
      nodeAgentLogLines.push(jsonLine);
    } catch (e) {
      //console.log(e);
    }
  });

  return nodeAgentLogLines;
}
