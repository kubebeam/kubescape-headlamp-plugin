// https://github.com/kubescape/storage/tree/main/pkg/apis/softwarecomposition
// Only fields as used in this project are declared

import { Metadata } from './Metadata';

export interface KnownServer {
  metadata: Metadata;
  spec: KnownServer.Entry[];
}

export namespace KnownServer {
  export interface Entry {
    name: string;
    server: string;
    ipBlock: string;
  }
}
