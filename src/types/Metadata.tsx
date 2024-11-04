export interface StringDict {
  [key: string]: string;
}

export interface Metadata {
  creationTimestamp: string;
  name: string;
  namespace: string;
  annotations: StringDict;
  labels: StringDict;
}
