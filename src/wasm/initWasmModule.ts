import './wasm_exec.js';
import './wasmTypes.d.ts';
import { getKubescapePluginUrl } from '../common/PluginHelper';

export async function loadWasm(): Promise<void> {
  const goWasm = new window.Go();
  const result = await WebAssembly.instantiateStreaming(
    fetch(getKubescapePluginUrl() + '/main.wasm'),
    goWasm.importObject
  );
  goWasm.run(result.instance);
}
