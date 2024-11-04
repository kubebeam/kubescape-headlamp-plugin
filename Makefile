vap_test_files:=\
	deployment.yaml \
	deployment-for-list-items.yaml \
	pod-capabilities.yaml \
	service-account.yaml \
	deployment-with-common-label-1.yaml  \
	pod-for-list-items.yaml  \
	service.yaml \
	deployment-with-common-label-2.yaml  \
	pod.yaml

wasm-download: 
	# Download WASM exec.js 
	curl https://raw.githubusercontent.com/golang/go/refs/heads/master/lib/wasm/wasm_exec.js -o src/wasm/wasm_exec.js;

kubescape-download: 
	# Download policy files from Kubescape to dist 
	curl -L https://github.com/kubescape/cel-admission-library/releases/latest/download/basic-control-configuration.yaml -o dist/basic-control-configuration.yaml; 
	curl -L https://github.com/kubescape/cel-admission-library/releases/latest/download/kubescape-validating-admission-policies.yaml -o dist/validating-admission-policies.yaml; 

	# Download test files from KubeScape to dist 
	rm -f dist/vap-test-files*;
	for word in ${vap_test_files}; do \
		printf '\n---\n' >> dist/vap-test-files.yaml; \
		curl https://raw.githubusercontent.com/kubescape/cel-admission-library/refs/heads/main/test-resources/$$word >> dist/vap-test-files.yaml; \
		echo $$word >> dist/vap-test-files-index.yaml; \
	done; 

download: wasm-download kubescape-download 

build: 
	GOOS=js GOARCH=wasm go -C go build -ldflags="-s -w" -o ../dist/main.wasm cmd/main.go 

local: build
	cp dist/main.wasm ~/.config/Headlamp/plugins/kubescape-plugin/
	cp dist/*.yaml ~/.config/Headlamp/plugins/kubescape-plugin/