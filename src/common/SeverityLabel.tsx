/* 
  Build a label showing red for critial status. 
*/

import { StatusLabel } from './StatusLabel';

export default function makeSeverityLabel(severity: string) {
  return <StatusLabel status={severity === 'Critical' ? 'error' : ''}>{severity}</StatusLabel>;
}
