import { Icon } from '@iconify/react';
import { Table as HeadlampTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { TabContext, TabList } from '@mui/lab';
import { Tab, useTheme } from '@mui/material';
import { useState } from 'react';
import { TabPanel } from '../common/TabPanel';

interface EvalResult {
  index: number;
  name: string;
  expression: string;
  result: string | boolean;
  error: string;
  message: string;
}

interface EvaluationResults {
  variables: EvalResult[];
  matchConditions: EvalResult[];
  matchConstraints: boolean;
  validations: EvalResult[];
  auditAnnotations: EvalResult[];
}

export function EvaluationResultsTables(props: { evaluationResult: EvaluationResults }) {
  const { evaluationResult } = props;
  const [tabValue, setTabValue] = useState(3);

  if (!evaluationResult?.matchConstraints) {
    return <p>The resource does not match.</p>;
  }
  const valid = evaluationResult?.validations?.filter(v => v.result !== true).length === 0;
  const error = evaluationResult?.validations?.filter(v => v.error).length > 0;

  if (valid && !error) {
    return <p>The resource is valid.</p>;
  }
  return (
    <TabContext value={tabValue}>
      <TabList
        onChange={(event: React.SyntheticEvent, newValue: number) => {
          setTabValue(newValue);
        }}
      >
        <Tab
          label="Variables"
          disabled={!evaluationResult?.variables}
          value={1}
          iconPosition="end"
          icon={<StatusIcon evaluations={evaluationResult?.variables} />}
        />
        <Tab
          label="Match Conditions"
          disabled={!evaluationResult?.matchConditions}
          value={2}
          iconPosition="end"
          icon={<StatusIcon evaluations={evaluationResult?.matchConditions} />}
        />
        <Tab
          label="Validations"
          disabled={!evaluationResult?.validations}
          value={3}
          iconPosition="end"
          icon={<StatusIcon evaluations={evaluationResult?.validations} showValid />}
        />
        <Tab
          label="Audit Annotations"
          disabled={!evaluationResult?.auditAnnotations}
          value={4}
          iconPosition="end"
          icon={<StatusIcon evaluations={evaluationResult?.auditAnnotations} />}
        />
      </TabList>

      <TabPanel value={1}>
        <EvaluationResult data={evaluationResult?.variables} />
      </TabPanel>
      <TabPanel value={2}>
        <EvaluationResult data={evaluationResult?.matchConditions} />
      </TabPanel>
      <TabPanel value={3}>
        <EvaluationResult data={evaluationResult?.validations} />
      </TabPanel>
      <TabPanel value={4}>
        <EvaluationResult data={evaluationResult?.auditAnnotations} />
      </TabPanel>
    </TabContext>
  );
}

function EvaluationResult(props: { data: any[] }) {
  const { data } = props;

  return (
    <HeadlampTable
      enablePagination={false}
      enableColumnActions={false}
      data={data}
      columns={[
        {
          header: 'Name',
          accessorFn: (variable: any) => variable.name,
          gridTemplate: 'min-content',
        },
        {
          header: 'Expression',
          accessorFn: (variable: any) => variable.expression,
        },
        {
          header: 'Value',
          accessorFn: (variable: any) => JSON.stringify(variable.result),
        },
        {
          header: 'Error',
          accessorFn: (variable: any) => variable.error,
        },
        {
          header: 'Message',
          accessorFn: (variable: any) => (!variable.result ? variable.message : ''),
        },
      ]}
    />
  );
}

function StatusIcon(props: { evaluations: EvalResult[]; showValid?: boolean }) {
  const { evaluations, showValid } = props;
  const theme = useTheme();

  let icon = 'mdi:check';
  let color = theme.palette.info.main;

  if (evaluations?.some(e => e.error)) {
    icon = 'mdi:alert';
    color = theme.palette.error.main;
    return <Icon icon={icon} color={color} />;
  }
  if (showValid && evaluations?.some(e => !e.result)) {
    icon = 'mdi:thumb-down';
    color = theme.palette.error.main;
    return <Icon icon={icon} color={color} />;
  }
  return '';
}
