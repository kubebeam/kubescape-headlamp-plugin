# Kubescape Headlamp Plugin

The Kubescape Headlamp plugin provides an open source plugin for Headlamp. It builds upon the work of [Kubescape](https://kubescape.io/) and [Headlamp](https://github.com/headlamp-k8s/headlamp).

Headlamp is a dashboard for Kubernetes, and is extensible with plugins. Kubescape is a security platform protecting against configuration issues and image vulnerabilities.

The Kubescape Headlamp plugin provides views in Headlamp for configuration and vulnerabilities scanning, based on information delivered by the Kubescape operator.

## Demo

![compliance](./demo/compliance.png)

![vulnerabilities](./demo/vulnerabilities.png)

## Prerequisites

- [Kubescape operator](https://kubescape.io/docs/operator/) should be installed in the k8s cluster and enabled for configuration and image scanning.
  We recommend Kubescape operator helm chart v1.22.0 or later with `capabilities.continuousScan: enable`.

  If the operator is working, custom resources are generated. You can test this with e.g. `kubectl get workloadconfigurationscans -A`.

- [Headlamp](https://github.com/headlamp-k8s/headlamp) should be installed in the k8s cluster or workstation. For a quick test the desktop version is recommended.

The plugin has been tested with Headlamp v0.25.0 (browser and desktop) and kubescape operator helm chart v1.22.0.

## Use cases

The use cases support navigating to the information from different user perspectives.

For inspecting namespaces or deployments, navigate in the k8s pages of Headlamp::

- View a namespace, see a summary of configuration issues and vulnerabilities
- View a resource (e.g. Deployment), see a summary of configuration issues

For an overview of compliance in a cluster:

- View controls
- View resources
- View namespaces

For an overview of vulnerabilty scanning in a cluster:

- View CVEs
- View workloads
- View images

The queries to the Kubescape database use [allowed namespaces](https://headlamp.dev/docs/latest/faq/#i-cannot-access-any-section-in-my-cluster-it-keeps-saying-access-denied) cluster setting, supporting multi tenant clusters.

Pages allow for navigation to detailed and related information.

## Installation

The installation files can be found on the release page in github. (https://github.com/Kubebeam/kubescape-headlamp-plugin/releases/). Here you can download the tarball.

For desktop versions of Headlamp, find the plugin folder, create a new folder kubescape-plugin, extract the `main.js` and `package.json` from the tarball.

For in-cluster Headlamp deployments, the installation files need to be added to the plugin folder of the headlamp deployment. A simple solution is to download the plugin files with an initContainer. See [example helm values](./examples/headlamp-helm-values.yaml).
The guidance from headlamp for in-cluster deployment is to create a container image with the plugin artifacts: https://headlamp.dev/blog/2022/10/20/best-practices-for-deploying-headlamp-with-plugins/.

## Docs

[Notes](./docs/kubescape-model.md) about the Kubescape datamodel and how we leverage it for the plugin.

## Dependencies

- The plugin depends on documentation of configuration scanning in [Kubescape User Hub](https://hub.armosec.io/docs/controls).
- The plugin depends on JSON documentation in the [kubescape regolibrary](https://github.com/kubescape/regolibrary/releases/download/v2/controls/). The [control libary](./src/ConfigurationScanning/controlLibrary.js) is copied for use in the plugin code.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the Apache-2.0 License. See the LICENSE file for details.

## Contact

For any questions or feedback, please open an issue on the GitHub repository.
