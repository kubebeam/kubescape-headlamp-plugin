import { FormControl, MenuItem, SelectChangeEvent, Stack, TextField } from '@mui/material';
import * as yaml from 'js-yaml';
import { useContext, useEffect, useState } from 'react';
import { CurrentEvalContext } from './ValidatingAdmissionPolicy';

export function ChooseTestResource() {
  const { setResource } = useContext(CurrentEvalContext);
  const [testFiles, setTestFiles]: [string[], any] = useState([]);
  const [testFileNames, setTestFileNames]: [string[], any] = useState([]);

  useEffect(() => {
    const testFilesURL = '/plugins/kubescape-plugin/vap-test-files.yaml';
    fetch(testFilesURL)
      .then(response => response.text())
      .then(data => setTestFiles(yaml.loadAll(data)));
    const testFilesIndexURL = '/plugins/kubescape-plugin/vap-test-files-index.yaml';
    fetch(testFilesIndexURL)
      .then(response => response.text())
      .then(data => setTestFileNames(data.split(/\r?\n/)));
  }, []);

  const handleChange = (event: SelectChangeEvent) => {
    setSelectedValue(event.target.value);

    const indx = testFileNames.findIndex(testFile => testFile === event.target.value);
    setResource(testFiles[indx]);
  };

  const [selectedValue, setSelectedValue] = useState('');

  return (
    <Stack direction="row" spacing={0}>
      <FormControl variant="outlined" sx={{ width: 600 }}>
        <TextField
          select
          value={selectedValue}
          onChange={handleChange}
          label="Choose Test Resource"
        >
          {testFileNames.map((fileName, indx) => (
            <MenuItem key={indx} value={fileName}>
              {fileName}
            </MenuItem>
          ))}
        </TextField>
      </FormControl>
    </Stack>
  );
}