import { MainInfoSection, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import React from 'react';
import { useLocation } from 'react-router';
import YAML from 'yaml';
import { vulnerabilityManifestSummaryClass } from '../model';

export default function KubescapeVulnerabilityManifestSummaryDetails() {
  const location = useLocation();
  const segments = location.pathname.split('/');

  // The second last segment is the namespace
  const namespace = segments[segments.length - 2];
  // The last segment is the name
  const name = segments[segments.length - 1];

  return <VulnerabilityManifestDetailView name={name} namespace={namespace} />;
}

function prepareExtraInfo(cr) {
  const extraInfo = [];

  extraInfo.push({
    name: 'critical',
    value: cr?.jsonData.spec.severities?.critical.all,
  });
  extraInfo.push({
    name: 'high',
    value: cr?.jsonData.spec.severities?.high.all,
  });

  // {
  //   header: 'medium',
  //   accessorFn: item => item.jsonData.spec.severities?.medium.all,
  //   gridTemplate: 'min-content',
  // },
  // {
  //   header: 'low',
  //   accessorFn: item => item.jsonData.spec.severities?.low.all,
  //   gridTemplate: 'min-content',
  // },
  // {
  //   header: 'negligible',
  //   accessorFn: item => item.jsonData.spec.severities?.negligible.all,
  //   gridTemplate: 'min-content',
  // },
  // {
  //   header: 'unknown',
  //   accessorFn: item => item.jsonData.spec.severities?.unknown.all,
  //   gridTemplate: 'min-content',
  // },
  // {

  return extraInfo;
}

function VulnerabilityManifestDetailView(props) {
  const { name, namespace } = props;
  const [cr, setCr] = React.useState(null);

  vulnerabilityManifestSummaryClass.useApiGet(setCr, name, namespace);

  return (
    cr && (
      <>
        <MainInfoSection
          title="Vulnerability Manifest Summary"
          resource={cr}
          extraInfo={prepareExtraInfo(cr)}
          actions={[]}
        />

        <SectionBox title="Details">
          <pre>{YAML.stringify(cr)}</pre>
        </SectionBox>
      </>
    )
  );
}
