## Kubescape datamodel

Kubescape provides several reporting objects that can be retrieved via the K8s API server.

```mermaid

 classDiagram

    class VulnerabilityManifestSummary {
        metadata
        spec.vulnerabilitiesRef.all.name: VulnerabilityManifest
        spec.vulnerabilitiesRef.relevant.name: VulnerabilityManifest
    }

    class VulnerabilityManifest {
        metadata
        spec.matches
    }

    class VulnerabilitySummary {
        metadata
        spec.vulnerabilitiesRef: []VulnerabilityManifestSummary
    }

    class SBOMSyft {
        metadata
        syft: SBOMSyft.Syft
    }

    VulnerabilityManifestSummary --> VulnerabilityManifest
    VulnerabilitySummary --> VulnerabilityManifestSummary
    VulnerabilityManifest --> SBOMSyft

    K8sNamespace --> VulnerabilitySummary
    K8sWorkload --> VulnerabilityManifest
    K8sWorkload --> VulnerabilityManifestSummary

    class ConfigurationScanSummary {
        metadata
    }

    class WorkloadConfigurationScan {
        metadata
        spec.controls: []Rego Control + rules
        spec.severities: []int
    }

    class WorkloadConfigurationScanSummary {
        metadata
        spec.controls: []Rego Control
        spec.severities: []int
    }

    K8sNamespace --> ConfigurationScanSummary
    K8sWorkload --> WorkloadConfigurationScan
    K8sWorkload --> WorkloadConfigurationScanSummary
    ConfigurationScanSummary --> WorkloadConfigurationScanSummary
    WorkloadConfigurationScanSummary --> WorkloadConfigurationScan

```

### Notes

- Kubescape uses API aggregation: https://github.com/kubescape/storage. There are no CRDs. The API contract can be found in the softwarecomposition [folder](https://github.com/kubescape/storage/tree/main/pkg/apis/softwarecomposition/v1beta1).

- The list queries do not provide details but only metadata. This makes it challenging for the GUI. As a workaround the plugin makes multiple calls to individual resources.

- ConfigurationScanSummary and VulnerabilitySummary are returned by Kubescape without UID in the metadata. This makes it harder to retrieve these objects with the HeadLamp api proxy, because the retrieved list is put in a map by UID. As a workaround we use ApiProxy.request() instead of useApiList().

- Overview page for ConfigurationScan (Compliance) makes a lot of K8s calls, the list queries cannot be used. This might become an issue for big clusters.
