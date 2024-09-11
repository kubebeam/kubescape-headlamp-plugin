import YAML from 'js-yaml';
import { WorkloadConfigurationScan } from '../softwarecomposition/WorkloadConfigurationScan';

// simple object to be inserted in the json tree to track where the text should become colored
class ReplacementMarker {}

// Amend the resource with fixes as per fixPath recommendation
export function fixResource(resource: any, control: WorkloadConfigurationScan.Control): string {
  // first strip status and managedFields
  const fixedResource: any = Object.fromEntries(
    Object.entries(resource).filter(([key]) => key !== 'status')
  );
  fixedResource.metadata = Object.fromEntries(
    Object.entries(fixedResource.metadata).filter(([key]) => key !== 'managedFields')
  );

  // evaluate the fix rules
  let markerCount = 0;
  for (const rule of control.rules) {
    if (!rule.paths) {
      continue;
    }
    for (const path of rule.paths) {
      markerCount = evaluateRule(fixedResource, path, markerCount);
    }
  }

  // make yaml with @@@ annotations for the changed attributes
  let coloredYAML = YAML.dump(fixedResource, { replacer: replaceMarker });

  // now we have the yaml, replace the element markers with <span>
  for (let i = 1; i <= markerCount; i++) {
    const regexStart = new RegExp(`([ \n]+marker-start-${i}: '@@@')`);
    const regexEnd = new RegExp(`([ \n]+marker-end-${i}: '@@@')`);
    coloredYAML = coloredYAML.replace(regexStart, "<span style='color: green;'>");
    coloredYAML = coloredYAML.replace(regexEnd, '</span>');
  }

  // replace the value markers with <span>
  coloredYAML = coloredYAML.replace(/(.*)-@@@/g, "<span style='color: green;'>$1</span>");

  // console.log(coloredYAML);
  return coloredYAML;
}

// TODO better and more testing
function evaluateRule(
  resource: any,
  path: WorkloadConfigurationScan.RulePath,
  markerCount: number
) {
  const parts = path.fixPath ? path.fixPath.split('.') : path.failedPath.split('.');

  let element: any = resource;
  let marked = false;
  for (const part of parts) {
    const matchArrayField = part.match(/(\w+)\[([0-9]+)\]/); // e.g. containers[0]
    if (matchArrayField) {
      const field = matchArrayField[1];

      if (field in element) {
        const index = parseInt(matchArrayField[2]);
        element = element[field][index];
      } else {
        element[field] = [{}]; // new array with 1 object
        element = element[field][0];
      }
    } else {
      if (part in element) {
        if (part === parts[parts.length - 1]) {
          element[part] = path.fixPathValue + '-@@@';
        }
      } else {
        markerCount++;
        let value: any;
        if (part === parts[parts.length - 1]) {
          value = path.fixPathValue;
        } else {
          value = {};
        }
        putValueWithMarkers(element, part, value, marked, markerCount);
        marked = true;
      }
      element = element[part];
    }
  }
  return markerCount;
}

function replaceMarker(key: any, value: any) {
  if (value instanceof ReplacementMarker) {
    return '@@@';
  }
  return value;
}

// add the element with a marker before and after
function putValueWithMarkers(
  element: any,
  fieldName: string,
  value: any,
  marked: boolean,
  markerCount: number
) {
  if (!marked) {
    element['marker-start-' + markerCount] = new ReplacementMarker();
  }
  element[fieldName] = value;
  if (!marked) {
    element['marker-end-' + markerCount] = new ReplacementMarker();
  }
}
