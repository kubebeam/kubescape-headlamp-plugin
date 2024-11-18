import { KubeObject } from '@kinvolk/headlamp-plugin/lib';
import Editor from '@monaco-editor/react';
import { Box } from '@mui/material';
import * as yaml from 'js-yaml';
import { useState } from 'react';
import { getURLSegments } from '../common/url';
import { applicationProfileClass } from '../model';
export function ApplicationProfileDetails() {
  const [name, namespace] = getURLSegments(-1, -2);
  const [applicationProfile, setApplicationProfile] = useState<KubeObject | null>(null);

  applicationProfileClass.useApiGet(setApplicationProfile, name, namespace);

  if (!applicationProfile) {
    return <></>;
  }

  return (
    <Box paddingTop={2} height="100%">
      <Editor
        language={'yaml'}
        theme={localStorage.headlampThemePreference === 'dark' ? 'vs-dark' : ''}
        value={yaml.dump(applicationProfile.jsonData)}
        height={window.innerHeight * 0.8}
      />
    </Box>
  );
}
