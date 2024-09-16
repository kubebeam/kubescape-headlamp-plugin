/* 
  Registration of menu and routes in headlamp. 
*/
import {
  registerDetailsViewSectionsProcessor,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';

const kubescape = 'kubescape';
const vulnerabilities: string = 'vulnerabilities';
const compliance: string = 'compliance';

export namespace RoutingPath {
  export const ComplianceView = '/kubescape/compliance';
  export const KubescapeConfigurationScanNamespaceSummary = '/kubescape/compliance/:namespace';
  export const KubescapeWorkloadConfigurationScanDetails =
    '/kubescape/compliance/namespaces/:namespace/:name';
  export const KubescapeControlResults = '/kubescape/compliance/controls/:control';
  export const KubescapeWorkloadConfigurationScanFixes =
    '/kubescape/compliance/namespaces/:namespace/:name/:control';
  export const VulnerabilitiesNamespaceSummary = '/kubescape/vulnerabilities/:namespace';
  export const KubescapeVulnerabilityDetails =
    '/kubescape/vulnerabilities/namespaces/:namespace/:name';
  export const KubescapeCVEResults = '/kubescape/vulnerabilities/cves/:cve';
  export const ImageVulnerabilityDetails = '/kubescape/vulnerabilities/images/:name';
  export const KubescapeVulnerabilities = '/kubescape/vulnerabilities';
}

// Kubescape main sidebar
registerSidebarEntry({
  parent: null,
  name: kubescape,
  label: 'Kubescape',
  icon: 'mdi:shield-search',
  url: RoutingPath.ComplianceView,
});

registerSidebarEntry({
  parent: kubescape,
  name: compliance,
  label: 'Compliance',
  url: RoutingPath.ComplianceView,
});

registerSidebarEntry({
  parent: kubescape,
  name: vulnerabilities,
  label: 'Vulnerabilities',
  url: RoutingPath.KubescapeVulnerabilities,
});

import ComplianceView from './compliance/Compliance';

registerRoute({
  path: RoutingPath.ComplianceView,
  parent: kubescape,
  sidebar: compliance,
  component: () => <ComplianceView />,
  exact: true,
  name: 'Compliance',
});

import KubescapeConfigurationScanNamespaceSummary from './compliance/NamespaceSummary';

registerRoute({
  path: RoutingPath.KubescapeConfigurationScanNamespaceSummary,
  parent: kubescape,
  sidebar: compliance,
  component: () => <KubescapeConfigurationScanNamespaceSummary />,
  exact: true,
  name: 'Namespace Configuration Scan',
});

import KubescapeWorkloadConfigurationScanDetails from './compliance/WorkloadScanDetails';

registerRoute({
  path: RoutingPath.KubescapeWorkloadConfigurationScanDetails,
  parent: kubescape,
  sidebar: compliance,
  component: () => <KubescapeWorkloadConfigurationScanDetails />,
  exact: true,
  name: 'Configuration Scan',
});

import KubescapeControlResults from './compliance/ControlResults';

registerRoute({
  path: RoutingPath.KubescapeControlResults,
  parent: kubescape,
  sidebar: compliance,
  component: () => <KubescapeControlResults />,
  exact: true,
  name: 'Control Configuration Scan',
});

import KubescapeWorkloadConfigurationScanFixes from './compliance/WorkloadScanFixes';

registerRoute({
  path: RoutingPath.KubescapeWorkloadConfigurationScanFixes,
  parent: kubescape,
  sidebar: compliance,
  component: () => <KubescapeWorkloadConfigurationScanFixes />,
  exact: true,
  name: 'Workload Configuration Fixes',
});

import KubescapeVulnerabilities from './vulnerabilities/Vulnerabilities';

registerRoute({
  path: RoutingPath.KubescapeVulnerabilities,
  parent: kubescape,
  sidebar: vulnerabilities,
  component: () => <KubescapeVulnerabilities />,
  exact: true,
  name: 'Vulnerabilities',
});

import VulnerabilitiesNamespaceSummary from './vulnerabilities/NamespaceSummary';

registerRoute({
  path: RoutingPath.VulnerabilitiesNamespaceSummary,
  parent: kubescape,
  sidebar: vulnerabilities,
  component: () => <VulnerabilitiesNamespaceSummary />,
  exact: true,
  name: 'Namespace Vulnerabilities',
});

import KubescapeVulnerabilityDetails from './vulnerabilities/WorkloadScanDetails';

registerRoute({
  path: RoutingPath.KubescapeVulnerabilityDetails,
  parent: kubescape,
  sidebar: vulnerabilities,
  component: () => <KubescapeVulnerabilityDetails />,
  exact: true,
  name: 'Vulnerability',
});

import KubescapeCVEResults from './vulnerabilities/CVEResults';

registerRoute({
  path: RoutingPath.KubescapeCVEResults,
  parent: kubescape,
  sidebar: vulnerabilities,
  component: () => <KubescapeCVEResults />,
  exact: true,
  name: 'CVE Vulnerabilities',
});

import ImageVulnerabilityDetails from './vulnerabilities/ImageDetails';

registerRoute({
  path: RoutingPath.ImageVulnerabilityDetails,
  parent: kubescape,
  sidebar: vulnerabilities,
  component: () => <ImageVulnerabilityDetails />,
  exact: true,
  name: 'Image Vulnerabilities',
});

// Detail panel for workloads
import addKubescapeWorkloadSection from './sections/WorkloadSection';

registerDetailsViewSectionsProcessor(addKubescapeWorkloadSection);

// Detail panel for namespaces
import addKubescapeNamespaceSection from './sections/NamespaceSection';

registerDetailsViewSectionsProcessor(addKubescapeNamespaceSection);
