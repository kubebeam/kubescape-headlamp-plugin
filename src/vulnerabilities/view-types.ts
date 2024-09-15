/* 
  Types from softwarecomposition are converted into the types below for easier processing in the views. 

  WorkloadScan > ImageScan > Vulnerability 
*/
export namespace VulnerabilityModel {
  // WorkloadScan > ImageScan[]
  export interface WorkloadScan {
    manifestName: string;
    name: string;
    kind: string;
    container: string;
    namespace: string;
    imageScan: ImageScan | undefined;
    relevant: ImageScan | undefined;
  }

  // ImageScan > Vulnerability[]
  export interface ImageScan {
    manifestName: string;
    imageName: string;
    creationTimestamp: string;
    vulnerabilities: Vulnerability[];
  }

  // Vulnerability
  export interface Vulnerability {
    CVE: string;
    dataSource: string;
    severity: string;
    description: string;
    baseScore: number;
    artifact: {
      name: string;
      version: string;
    };
    fix: {
      state: string;
      versions: string[];
    };
  }

  // Vulnerability > WorkloadScan[] + ImageScan[]
  export interface VulnerabilityWithReferences {
    CVE: string;
    description: string;
    severity: string;
    baseScore: number;
    workloads: Set<string>;
    images: Set<string>;
    artifacts: Set<string>;
    fixed: boolean;
    relevant: boolean;
  }
}
