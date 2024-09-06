/* 
  Provide a panel on the Headlamp resource pages (for deployments, statefulsets, etc). 
*/
import { DefaultDetailsViewSection } from '@kinvolk/headlamp-plugin/lib';
import { Link, NameValueTable, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useState } from 'react';
import { getControlsSummary } from '../compliance/ControlsSummary';
import { workloadConfigurationScanSummaryClass } from '../model';

export default function addKubescapeWorkloadSection(resource, sections) {
  // Ignore if there is no resource.
  if (!resource) {
    return sections;
  }

  if (resource.kind === 'Namespace') {
    // Return early if we're on the Namespace page
    return sections;
  }

  // if (resource.kind !== 'Deployment') {
  //   // Return early if we're not on a Deployment page
  //   return sections;
  // }

  // Check if we already have added our custom section (this function may be called multiple times).
  const customSectionId = 'kubescape-resources';
  if (sections.findIndex(section => section.id === customSectionId) !== -1) {
    return sections;
  }

  const detailsHeaderIdx = sections.findIndex(
    section => section.id === DefaultDetailsViewSection.MAIN_HEADER
  ); // There is no header, so we do nothing.
  if (detailsHeaderIdx === -1) {
    return sections;
  }

  // We place our custom section after the header.
  sections.splice(detailsHeaderIdx + 4, 0, {
    id: customSectionId,
    section: (
      <>
        <KubescapeInfo resource={resource} />
      </>
    ),
  });

  return sections;
}

function KubescapeInfo(props) {
  const { resource } = props;
  const resourceName = resource.jsonData.metadata.name;
  const namespace = resource.jsonData.metadata.namespace;
  const kind = resource.kind;

  const scanName = `${kind.toLowerCase()}-${resourceName.toLowerCase()}`;
  const [configurationScan, setConfigurationScan] = useState<Array<any> | null>(null);

  function onError(apiError) {
    // ignore
    console.log(apiError);
  }

  workloadConfigurationScanSummaryClass.useApiGet(
    setConfigurationScan,
    scanName,
    namespace,
    onError
  );

  return (
    configurationScan && (
      <>
        <SectionBox title="Kubescape">
          <NameValueTable
            rows={[
              {
                name: (
                  <>
                    <Link
                      routeName={`/kubescape/compliance/namespaces/:namespace/:name`}
                      params={{
                        name: scanName,
                        namespace: namespace,
                      }}
                    >
                      Configuration scan
                    </Link>
                  </>
                ),
                value: getControlsSummary(configurationScan.jsonData),
              },
            ]}
          />
        </SectionBox>
      </>
    )
  );
}
