import { Box, Stack, Tooltip } from '@mui/material';

export function getControlsSummary(scanSummary) {
  const severities = scanSummary?.spec.severities;

  const criticalCount = severities.critical;
  const mediumCount = severities.medium;
  const highCount = severities.high;
  const lowCount = severities.low;
  const unknownCount: number = severities.unknown;

  function controlsBox(color: string, severity: string, countScan: number) {
    return (
      <Box
        sx={{
          borderLeft: 2,
          borderTop: 1,
          borderRight: 1,
          borderBottom: 1,
          borderColor: `gray gray gray ${color}`,
          textAlign: 'center',
          width: 100,
        }}
      >
        <Tooltip title={severity}>
          {countScan} {severity}
        </Tooltip>
      </Box>
    );
  }

  return (
    <Stack direction="row" spacing={1}>
      {controlsBox('purple', 'Critical', criticalCount)}
      {controlsBox('red', 'High', highCount)}
      {controlsBox('orange', 'Medium', mediumCount)}
      {controlsBox('yellow', 'Low', lowCount)}
      {controlsBox('white', 'Unknown', unknownCount)}
    </Stack>
  );
}
