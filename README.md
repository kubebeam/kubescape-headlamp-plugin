# Kubescape Headlamp Plugin

This project provides an open source Kubescape plugin for Headlamp. It builds upon the work of [Kubescape](https://kubescape.io/) and [Headlamp](https://github.com/headlamp-k8s/headlamp).

The purpose of the plugin is to assist in the overall use cases for Kubescape, as documented [here](https://kubescape.io/).
The plugin will build extra menuitems in Headlamp for configuration and image scanning.

The plugin is yet in alpha status and should not be used in production.

## Demo

![compliance](./demo/compliance.png)

![vulnerabilities](./demo/vulnerabilities.png)

## Prerequisites

- [Kubescape operator](https://kubescape.io/docs/operator/) should be installed in the k8s cluster and enabled for configuration and image scanning.
- [Headlamp](https://github.com/headlamp-k8s/headlamp) should be installed in the k8s cluster or workstation

The plugin code has been tested with Headlamp v0.25.0 (browser and desktop) and kubescape v0.2.6.

## Installation

TODO

Development version of the plugin is published as a GitHub artifact. You can find it on the workflow page: https://github.com/Kubebeam/kubescape-headlamp-plugin/actions

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
