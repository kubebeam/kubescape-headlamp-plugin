//go:build js && wasm

package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"

	"admission-policy-wasm/vap"
)

func main() {
	// Create a channel to keep the Go program alive
	done := make(chan struct{}, 0)

	// Expose the Go functions to JavaScript
	js.Global().Set("AdmissionEval", js.FuncOf(admissionEval))

	// Block the program from exiting
	<-done
}

func errorToJSON(err error) string {
	results := vap.EvaluationResults{
		Error: err.Error(),
	}
	data, _ := json.Marshal(results)
	return string(data)
}

func argVal(args []js.Value, n int) []byte {
	return []byte(args[n].String())
}

func admissionEval(this js.Value, args []js.Value) any {
	if len(args) < 6 {
		return errorToJSON(fmt.Errorf("Invalid number of arguments in admissionEval()"))
	}
	evaluator, err := vap.NewAdmissionPolicyEvaluator(argVal(args, 0), argVal(args, 1), argVal(args, 2), argVal(args, 3), argVal(args, 4), argVal(args, 5))
	if err != nil {
		fmt.Printf("unable to parse inputs %s\n", err)
		return errorToJSON(err)
	}
	evaluator.CheckMatchConstraints()

	if evaluator.Results.MatchConstraints {
		evaluator.Evaluate()
	}

	data, err := json.Marshal(evaluator.Results)
	if err != nil {
		return errorToJSON(err)
	}
	return string(data)
}
