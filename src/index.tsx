import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';

const kubescape = 'kubescape';
const vulnerabilities: string = 'vulnerabilities';
const compliance: string = 'compliance';

// Kubescape main sidebar
registerSidebarEntry({
  parent: null,
  name: kubescape,
  label: 'Kubescape',
  icon: 'mdi:shield-search',
  url: '/kubescape/compliance',
});

registerSidebarEntry({
  parent: kubescape,
  name: compliance,
  label: 'Compliance',
  url: '/kubescape/compliance',
});

registerSidebarEntry({
  parent: kubescape,
  name: vulnerabilities,
  label: 'Vulnerabilities',
  url: '/kubescape/vulnerabilities',
});

import KubescapeConfigurationScanSummaryList from './compliance/Namespaces';

registerRoute({
  path: '/kubescape/configurationscansummaries',
  parent: kubescape,
  sidebar: compliance,
  component: () => <KubescapeConfigurationScanSummaryList />,
  exact: true,
  name: 'configurationscansummaries',
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

import KubescapeVulnerabilities from './vulnerabilities/Vulnerabilities';

registerRoute({
  path: '/kubescape/vulnerabilities',
  parent: kubescape,
  sidebar: vulnerabilities,
  component: () => <KubescapeVulnerabilities />,
  exact: true,
  name: vulnerabilities,
});

import KubescapeVulnerabilityDetails from './vulnerabilities/VulnerabilityDetails';

registerRoute({
  path: '/kubescape/vulnerabilities/:namespace/:name',
  parent: kubescape,
  sidebar: vulnerabilities,
  component: () => <KubescapeVulnerabilityDetails />,
  exact: true,
  name: 'vulnerabilitymanifestsummary',
});

// Namespace view is not enabled in sidebar yet
// registerSidebarEntry({
//   parent: kubescape,
//   name: vulnerabilitiesNamespaceSummaries,
//   label: 'Namespace Vulnerabilities',
//   url: '/kubescape/vulnerabilitysummaries',
// });

import KubescapeVulnerabilitySummaryList from './vulnerabilities/NamespaceList';

registerRoute({
  path: '/kubescape/vulnerabilitysummaries',
  parent: kubescape,
  sidebar: vulnerabilities,
  component: () => <KubescapeVulnerabilitySummaryList />,
  exact: true,
  name: 'vulnerabilitynamespacesummaries',
});
