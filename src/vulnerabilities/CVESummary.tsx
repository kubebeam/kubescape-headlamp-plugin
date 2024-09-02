import { Stack, Tooltip, Box } from '@mui/material';

export function getCVESummary(configurationScanSummary) {
  const severities = configurationScanSummary?.spec.severities;

  const criticalCount = severities.critical.all;
  const mediumCount = severities.medium.all;
  const highCount = severities.high.all;
  const lowCount = severities.low.all;
  const unknownCount = severities.unknown.all;

  function box(color, severity, countScan) {
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
      {box('purple', 'Critical', criticalCount)}
      {box('red', 'High', highCount)}
      {box('orange', 'Medium', mediumCount)}
      {box('yellow', 'Low', lowCount)}
      {box('white', 'Unknown', unknownCount)}
    </Stack>
  );
}
