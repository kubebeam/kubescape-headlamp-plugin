import { Icon } from '@iconify/react';
import Editor from '@monaco-editor/react';
import { IconButton, Link, Popover, Toolbar, Typography } from '@mui/material';
import { useState } from 'react';

export function ProfilePopup(props: { content: string }) {
  const { content } = props;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'profile-popper' : undefined;

  return (
    <>
      <Link to="#" onClick={handleClick}>
        profile details..
      </Link>
      <Popover id={id} style={{ zIndex: 10000 }} open={open} anchorEl={anchorEl}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Application Profile
          </Typography>
          <IconButton aria-describedby={id} onClick={handleClick}>
            <Icon icon="mdi:close-box-outline" />
          </IconButton>
        </Toolbar>

        <Editor
          language={'yaml'}
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
      </Popover>
    </>
  );
}
