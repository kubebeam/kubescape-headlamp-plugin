import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

export interface StatusLabelProps {
  status: 'success' | 'warning' | 'error' | '';
  [otherProps: string]: any;
}

export function StatusLabel(props: StatusLabelProps) {
  const { status, ...other } = props;
  const theme = useTheme();

  const statuses = ['success', 'warning', 'error'];

  // Assign to a status color if it exists.
  const bgColor = statuses.includes(status)
    ? theme.palette[status].light
    : theme.palette.normalEventBg;
  const color =
    /* statuses.includes(status) ? theme.palette[status].main : */ theme.palette.text.primary;

  return (
    <Typography
      sx={{
        color: theme.palette.primary.contrastText,
        fontSize: theme.typography.pxToRem(14),
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
        paddingTop: theme.spacing(0.5),
        paddingBottom: theme.spacing(0.5),
        display: 'inline-flex',
        alignItems: 'normal',
        gap: theme.spacing(0.5),
        borderRadius: theme.spacing(0.5),
      }}
      style={{
        backgroundColor: bgColor,
        color,
      }}
      component="span"
      {...other}
    />
  );
}
