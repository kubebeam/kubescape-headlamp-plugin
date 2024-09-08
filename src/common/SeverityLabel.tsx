/* 
  Build a label showing red for critial status. 
*/
import { StatusLabel, StatusLabelProps } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box } from '@mui/material';

export default function makeSeverityLabel(severity: string) {
  let status: StatusLabelProps['status'] = '';

  if (severity === 'Critical') {
    status = 'error';
  } else {
    status = 'warning';
  }

  return (
    <StatusLabel status={status} sx={{ width: '100%' }}>
      {severity}
      {severity === 'Critical' && (
        <Box
          aria-label="hidden"
          display="inline"
          paddingTop={1}
          paddingLeft={0.5}
          style={{ verticalAlign: 'text-top' }}
        ></Box>
      )}
    </StatusLabel>
  );
}
