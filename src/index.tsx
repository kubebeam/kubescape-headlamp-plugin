import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';

const kubescape = 'kubescape';
const vulnerabilities: string = 'vulnerabilities';
const compliance: string = 'compliance';
const configurationScanSummaries: string = 'configurationscansummaries';
const workloadConfigurationscans: string = 'workloadConfigurationscans';

// Kubescape main sidebar
registerSidebarEntry({
  parent: null,
  name: kubescape,
  label: 'Kubescape',
  icon: 'mdi:shield-search',
  url: '/kubescape/compliance',
});

// Configuration scanning
registerSidebarEntry({
  parent: kubescape,
  name: compliance,
  label: 'Compliance',
  url: '/kubescape/compliance',
});

import KubescapeConfigurationScanSummaryList from './compliance/Namespaces';

registerRoute({
  path: '/kubescape/configurationscansummaries',
  parent: kubescape,
  sidebar: compliance,
  component: () => <KubescapeConfigurationScanSummaryList />,
  exact: true,
  name: configurationScanSummaries,
});

import KubescapeWorkloadConfigurationScanDetails from './compliance/ScanDetails';

registerRoute({
  path: '/kubescape/workloadconfigurationscans/:namespace/:name',
  parent: kubescape,
  sidebar: compliance,
  component: () => <KubescapeWorkloadConfigurationScanDetails />,
  exact: true,
  name: 'workloadConfigurationscan',
});

import ComplianceView from './compliance/Compliance';

registerRoute({
  path: '/kubescape/compliance',
  parent: kubescape,
  sidebar: compliance,
  component: () => <ComplianceView />,
  exact: true,
  name: compliance,
});

// Image scanning
registerSidebarEntry({
  parent: kubescape,
  name: 'vulnerabilitysummaries',
  label: 'Vulnerabilities',
  url: '/kubescape/vulnerabilitymanifestsummaries',
});

registerSidebarEntry({
  parent: kubescape,
  name: vulnerabilities,
  label: 'Vulnerability Manifests',
  url: '/kubescape/vulnerabilities',
});

// registerSidebarEntry({
//   parent: kubescape,
//   name: vulnerabilitiesNamespaceSummaries,
//   label: 'Namespace Vulnerabilities',
//   url: '/kubescape/vulnerabilitysummaries',
// });

import KubescapeVulnerability from './vulnerabilities/Vulnerabilities';

registerRoute({
  path: '/kubescape/vulnerabilities',
  parent: kubescape,
  sidebar: vulnerabilities,
  component: () => <KubescapeVulnerability />,
  exact: true,
  name: vulnerabilities,
});

import KubescapeVulnerabilityManifestSummaryList from './vulnerabilities/SummaryList';

registerRoute({
  path: '/kubescape/vulnerabilitymanifestsummaries',
  parent: kubescape,
  sidebar: vulnerabilities,
  component: () => <KubescapeVulnerabilityManifestSummaryList />,
  exact: true,
  name: 'vulnerabilitymanifestsummaries',
});

import KubescapeVulnerabilitySummaryList from './vulnerabilities/NamespaceList';

registerRoute({
  path: '/kubescape/vulnerabilitysummaries',
  parent: kubescape,
  sidebar: vulnerabilities,
  component: () => <KubescapeVulnerabilitySummaryList />,
  exact: true,
  name: 'vulnerabilitysummaries',
});

import KubescapeVulnerabilityManifestDetails from './vulnerabilities/ManifestDetails';

registerRoute({
  path: '/kubescape/vulnerabilitymanifests/:namespace/:name',
  parent: kubescape,
  sidebar: vulnerabilities,
  component: () => <KubescapeVulnerabilityManifestDetails />,
  exact: true,
  name: 'vulnerabilitymanifest',
});

import KubescapeVulnerabilityManifestSummaryDetails from './vulnerabilities/SummaryDetails';

registerRoute({
  path: '/kubescape/vulnerabilitymanifestsummaries/:namespace/:name',
  parent: kubescape,
  sidebar: vulnerabilities,
  component: () => <KubescapeVulnerabilityManifestSummaryDetails />,
  exact: true,
  name: 'vulnerabilitymanifestsummary',
});
