/* 
  Build a horizontack stack with seperate cells for critical, high, medium, low, negligible and unknown. 
*/
import { Box, Stack, Tooltip } from '@mui/material';
import { VulnerabilityManifestSummary } from '../softwarecomposition/VulnerabilityManifestSummary';

export function getCVESummary(
  configurationScanSummary: VulnerabilityManifestSummary,
  showUnknown: boolean,
  showNegligible: boolean
) {
  const severities = configurationScanSummary?.spec.severities;

  const criticalCount = severities.critical.all;
  const mediumCount = severities.medium.all;
  const highCount = severities.high.all;
  const lowCount = severities.low.all;
  const negligibleCount = severities.negligible.all;
  const unknownCount = severities.unknown.all;

  function box(color: string, severity: string, countScan: number) {
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
      {showNegligible ? box('darkgray', 'Negligible', negligibleCount) : ''}
      {showUnknown ? box('lightgray', 'Unknown', unknownCount) : ''}
    </Stack>
  );
}
