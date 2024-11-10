export function getKubescapePluginUrl() {
  if (isElectron()) {
    const port = 4466;
    return `http://localhost:${port}/plugins/headlamp_kubescape`; // plugin folder is same as artifacthub id
  }
  return '/plugins/kubescape-plugin';
}

/**
 * Determines whether app is running in electron environment.
 * Note: The isElectron code (Licence: MIT) is taken from
 *   https://github.com/cheton/is-electron/blob/master/index.js
 */
function isElectron(): boolean {
  // Renderer process
  if (
    typeof window !== 'undefined' &&
    typeof window.process === 'object' &&
    (window.process as any).type === 'renderer'
  ) {
    return true;
  }

  // Main process
  if (
    typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    !!(process.versions as any).electron
  ) {
    return true;
  }

  // Detect the user agent when the `nodeIntegration` option is set to true
  if (
    typeof navigator === 'object' &&
    typeof navigator.userAgent === 'string' &&
    navigator.userAgent.indexOf('Electron') >= 0
  ) {
    return true;
  }

  return false;
}
