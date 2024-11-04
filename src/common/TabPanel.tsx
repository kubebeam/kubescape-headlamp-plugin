import { useTabContext } from '@mui/lab';
import { Box } from '@mui/material';

export const TabPanel = ({ children, value }: any) => {
  const { value: contextValue } = useTabContext() || {};
  return (
    <Box sx={{ display: value === contextValue ? 'block' : 'none' }} key={value}>
      {children}
    </Box>
  );
};
