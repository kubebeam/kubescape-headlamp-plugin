import './wasm_exec.js';
import './wasmTypes.d.ts';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import Editor from '@monaco-editor/react';
import { TabContext, TabList } from '@mui/lab';
import { Alert, Grid, Stack, Tab, Toolbar, Typography } from '@mui/material';
import * as yaml from 'js-yaml';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { TabPanel } from '../common/TabPanel';
import { ValidatingAdmissionPolicy } from '../types/ValidatingAdmissionPolicy';
import { ChoosePolicyButton } from './ChoosePolicyButton';
import { ChooseTestResource } from './ChooseTestResource';
import { EvaluationResultsTables } from './EvaluationResultsTables';

export const CurrentEvalContext = createContext(null);

export function ValidatingAdmissionPolicyEditor() {
  const [validatingAdmissionPolicy, setValidatingAdmissionPolicy]: [
    ValidatingAdmissionPolicy,
    any
  ] = useState(null);
  const [paramsObject, setParamsObject] = useState(null);
  const [namespaceObject, setNamespaceObject] = useState(null);
  const [resource, setResource] = useState(null);
  const [resourceForNamespace, setResourceForNamespace] = useState(null);

  // Get params, if defined in validatingAdmissionPolicy
  useEffect(() => {
    if (validatingAdmissionPolicy?.spec.paramKind?.apiVersion) {
      const kubescapeValidatingAdmissionPoliciesURL =
        '/plugins/kubescape-plugin/basic-control-configuration.yaml';
      fetch(kubescapeValidatingAdmissionPoliciesURL)
        .then(response => response.text())
        .then(data => setParamsObject(yaml.load(data)));
    } else {
      setParamsObject(null);
    }
  }, [validatingAdmissionPolicy]);

  // Get namespace, if defined in resource
  useEffect(() => {
    if (resourceForNamespace?.metadata?.namespace) {
      ApiProxy.request(`/api/v1/namespaces/${resourceForNamespace.metadata.namespace}`).then(
        (result: any) => {
          setNamespaceObject(result);
        }
      );
    } else {
      setNamespaceObject(null);
    }
  }, [resourceForNamespace]);

  return (
    <CurrentEvalContext.Provider
      value={{
        resource,
        setResource,
        paramsObject,
        namespaceObject,
        validatingAdmissionPolicy,
        setValidatingAdmissionPolicy,
        setResourceForNamespace,
      }}
    >
      <Toolbar>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Typography variant="h5" component="div">
            Policy Playground
          </Typography>
          <Typography component="div">
            Choose a sample Validating Admission Policy and a test resource. You can also edit the
            policy or the test resource and observe calculated results in the tables below.
          </Typography>
        </Stack>
      </Toolbar>

      <AdmissionEvaluator />
    </CurrentEvalContext.Provider>
  );
}

function AdmissionEvaluator() {
  const {
    resource,
    paramsObject,
    namespaceObject,
    validatingAdmissionPolicy,
    setResourceForNamespace,
  } = useContext(CurrentEvalContext);
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Editors
  const policyEditorRef = useRef(null);
  const resourceEditorRef = useRef(null);
  const paramsEditorRef = useRef(null);
  const namespaceEditorRef = useRef(null);

  // Tab switching
  const [policyTabValue, setPolicyTabValue] = useState(1);
  const [resourceTabValue, setResourceTabValue] = useState(1);

  const submitEvaluation = async () => {
    // call golang WASM module
    const response = await window.AdmissionEval(
      policyEditorRef.current?.getValue(),
      resourceEditorRef.current?.getValue(),
      '',
      '',
      paramsEditorRef.current?.getValue(),
      namespaceEditorRef.current?.getValue()
    );

    // handle results
    const results = JSON.parse(response);
    setEvaluationResult(results);
  };

  return (
    <>
      <Grid container spacing={8}>
        <Grid container item xs={6} direction="column">
          <Toolbar>
            <ChoosePolicyButton />
          </Toolbar>
          <TabContext value={policyTabValue}>
            <TabList
              onChange={(event: React.SyntheticEvent, newValue: number) => {
                setPolicyTabValue(newValue);
              }}
            >
              <Tab label="Policy" value={1} />
              <Tab label="Params" value={2} />
            </TabList>

            <TabPanel value={1}>
              <YAMLEditor
                editorRef={policyEditorRef}
                //handleChange={setValidatingAdmissionPolicy}
                submitFn={submitEvaluation}
                value={yaml.dump(stripK8sObject(validatingAdmissionPolicy))}
              />
            </TabPanel>
            <TabPanel value={2}>
              <YAMLEditor
                editorRef={paramsEditorRef}
                submitFn={submitEvaluation}
                value={yaml.dump(stripK8sObject(paramsObject))}
              />
            </TabPanel>
          </TabContext>
        </Grid>

        <Grid container item xs={6} direction="column">
          <Toolbar>
            <ChooseTestResource />
          </Toolbar>
          <TabContext value={resourceTabValue}>
            <TabList
              onChange={(event: React.SyntheticEvent, newValue: number) => {
                setResourceTabValue(newValue);
              }}
            >
              <Tab label="Resource" value={1} />
              <Tab label="Namespace" value={2} />
            </TabList>

            <TabPanel value={1}>
              <YAMLEditor
                editorRef={resourceEditorRef}
                handleChange={setResourceForNamespace}
                submitFn={submitEvaluation}
                value={yaml.dump(stripK8sObject(resource))}
              />
            </TabPanel>
            <TabPanel value={2}>
              <YAMLEditor
                editorRef={namespaceEditorRef}
                submitFn={submitEvaluation}
                value={yaml.dump(stripK8sObject(namespaceObject))}
              />
            </TabPanel>
          </TabContext>
        </Grid>
      </Grid>

      <EvaluationResultsTables evaluationResult={evaluationResult} />
    </>
  );
}

function YAMLEditor(props: { editorRef: any; submitFn: any; value: string; handleChange?: any }) {
  const { editorRef, submitFn, value, handleChange } = props;
  const lastCodeCheckHandler = useRef(0);

  const [errors, setErrors] = useState('');

  // request validation of policy and resources
  const onChange = () => {
    // Clear any ongoing attempts to check the code.
    window.clearTimeout(lastCodeCheckHandler.current);

    // Check the YAML after the user has stopped typing for a second.
    lastCodeCheckHandler.current = window.setTimeout(() => {
      try {
        yaml.load(editorRef.current.getValue());
      } catch (e) {
        setErrors((e as Error).message);
        return;
      }

      setErrors('');
      if (handleChange) handleChange(yaml.load(editorRef.current.getValue()));
    }, 1000); // ms

    // submit is immediate
    submitFn();
  };

  return (
    <>
      <Editor
        language="yaml"
        onMount={(editor: any) => {
          editorRef.current = editor;
          editor.onDidChangeModelContent(onChange);
        }}
        theme={localStorage.headlampThemePreference === 'dark' ? 'vs-dark' : ''}
        value={value}
        height={600}
      />
      {errors && (
        <Alert variant="outlined" severity="error">
          {errors}
        </Alert>
      )}
    </>
  );
}

function stripK8sObject(k8sObject: any): any {
  if (!k8sObject) {
    return undefined;
  }
  // strip status
  const strippedResource: any = Object.fromEntries(
    Object.entries(k8sObject).filter(([key]) => key !== 'status')
  );

  if (strippedResource.metadata) {
    // strip managedFields
    strippedResource.metadata = Object.fromEntries(
      Object.entries(strippedResource.metadata).filter(([key]) => key !== 'managedFields')
    );

    // strip last-applied from annotations
    if (strippedResource.metadata.annotations)
      strippedResource.metadata.annotations = Object.fromEntries(
        Object.entries(strippedResource.metadata.annotations).filter(
          ([key]) => key !== 'kubectl.kubernetes.io/last-applied-configuration'
        )
      );
  }
  return strippedResource;
}
