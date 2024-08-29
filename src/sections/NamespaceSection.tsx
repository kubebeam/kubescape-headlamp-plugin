import { DefaultDetailsViewSection } from '@kinvolk/headlamp-plugin/lib';
import { Link, NameValueTable, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useState } from 'react';
import { configurationScanSummaries, vulnerabilitySummaryClass } from '../model';
import { getCVESummary } from '../vulnerabilities/Details';

export default function addKubescapeNamespaceSection(resource, sections) {
  // Ignore if there is no resource.
  if (!resource) {
    return sections;
  }

  if (resource.kind !== 'Namespace') {
    // Return early if we're not on the Namespace page
    return sections;
  }

  // Check if we already have added our custom section (this function may be called multiple times).
  const customSectionId = 'kubescape-configuration-scan-summaries';
  if (sections.findIndex(section => section.id === customSectionId) !== -1) {
    return sections;
  }

  const detailsHeaderIdx = sections.findIndex(
    section => section.id === DefaultDetailsViewSection.EVENTS
  );
  // There is no EVENTS section, so we do nothing.
  if (detailsHeaderIdx === -1) {
    return sections;
  }

  // We place our custom section before the EVENTS.
  sections.splice(detailsHeaderIdx, 0, {
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

  const [configurationScanSummary, setConfigurationScanSummary] = useState(null);
  const [vulnerabilitySummary, setVulnerabilitySummary] = useState(null);

  configurationScanSummaries.useApiGet(setConfigurationScanSummary, resourceName);
  vulnerabilitySummaryClass.useApiGet(setVulnerabilitySummary, resourceName);

  return (
    configurationScanSummary &&
    vulnerabilitySummary && (
      <>
        <SectionBox title="Kubescape">
          <NameValueTable
            rows={[
              {
                name: (
                  <Link
                    routeName={`/kubescape/compliance/:namespace`}
                    params={{
                      namespace: resourceName,
                    }}
                  >
                    Configuration scan
                  </Link>
                ),
                value: getControlsSummary(configurationScanSummary),
              },
              {
                name: (
                  <Link
                    routeName={`/kubescape/vulnerabilities/:namespace`}
                    params={{
                      namespace: resourceName,
                    }}
                  >
                    Vulnerabilities
                  </Link>
                ),
                value: getCVESummary(vulnerabilitySummary.jsonData),
              },
            ]}
          />
        </SectionBox>
      </>
    )
  );
}

function getControlsSummary(scanSummary) {
  const severities = scanSummary?.jsonData.spec.severities;

  const criticalCount = severities.critical;
  const mediumCount = severities.medium;
  const highCount = severities.high;
  const lowCount = severities.low;
  const unknownCount = severities.unknown;

  return `Critical :${criticalCount}, High: ${highCount}, Medium: ${mediumCount}, Low: ${lowCount}, Unknown: ${unknownCount}`;
}
