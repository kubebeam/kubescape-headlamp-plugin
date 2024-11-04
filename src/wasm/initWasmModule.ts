export async function loadWasm(): Promise<void> {
  const goWasm = new window.Go();
  const result = await WebAssembly.instantiateStreaming(
    fetch('/plugins/kubescape-plugin/main.wasm'),
    goWasm.importObject
  );
  goWasm.run(result.instance);
}
