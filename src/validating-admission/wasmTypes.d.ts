declare global {
  export interface Window {
    Go: any;
    AdmissionEval: (
      policy: string,
      object: string,
      oldObject: string,
      request: string,
      params: string,
      namespace: string
    ) => string;
  }
}
export {};
