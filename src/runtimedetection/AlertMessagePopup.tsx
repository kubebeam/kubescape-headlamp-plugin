import { Icon } from '@iconify/react';
import Editor from '@monaco-editor/react';
import { Popper } from '@mui/base/Popper';
import { AppBar, Box, IconButton, Toolbar, Typography } from '@mui/material';
import { useState } from 'react';

export function AlertMessagePopup(props: { content: string }) {
  const { content } = props;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'alert-popper' : undefined;

  return (
    <>
      <IconButton aria-describedby={id} onClick={handleClick}>
        <Icon icon="mdi:message-alert" />
      </IconButton>
      <Popper id={id} style={{ zIndex: 10000 }} open={open} anchorEl={anchorEl}>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Alert details
              </Typography>
              <IconButton aria-describedby={id} onClick={handleClick}>
                <Icon icon="mdi:close-box-outline" />
              </IconButton>
            </Toolbar>
          </AppBar>
        </Box>
        <Editor
          language={'json'}
          theme={localStorage.headlampThemePreference === 'dark' ? 'vs-dark' : ''}
          value={content}
          height={600}
          width={800}
          options={{
            readOnly: true,
            lineNumbers: 'off',
            automaticLayout: true,
            minimap: { enabled: false },
          }}
        />
      </Popper>
    </>
  );
}
