#!/bin/bash
set -euo pipefail

GACJS_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
GACUI_ROOT="${GACJS_ROOT}/../GacUI"
DIST_ROOT="${GACJS_ROOT}/Gaclib/website/entry/lib/dist"
WASM_APPS=(FCT RPT RVMT)
WASM_FILES=(app.mjs app.wasm app.worker.js)

# Validate every input before changing any deployed app.
for WASM_APP in "${WASM_APPS[@]}"; do
    WASM_PAGE="$(printf '%s' "${WASM_APP}" | tr '[:upper:]' '[:lower:]')"
    if [ ! -f "${DIST_ROOT}/wasm-${WASM_PAGE}/index.html" ]; then
        echo "Warning: missing ${DIST_ROOT}/wasm-${WASM_PAGE}/index.html; build GacJS first." >&2
        exit 1
    fi
    for WASM_FILE in "${WASM_FILES[@]}"; do
        if [ ! -f "${GACUI_ROOT}/Test/Linux/Wasm${WASM_APP}/Bin/${WASM_FILE}" ] || [ ! -s "${GACUI_ROOT}/Test/Linux/Wasm${WASM_APP}/Bin/${WASM_FILE}" ]; then
            echo "Warning: missing ${GACUI_ROOT}/Test/Linux/Wasm${WASM_APP}/Bin/${WASM_FILE}; build GacUI with -bw -o first." >&2
            exit 1
        fi
    done
done

for WASM_APP in "${WASM_APPS[@]}"; do
    WASM_PAGE="$(printf '%s' "${WASM_APP}" | tr '[:upper:]' '[:lower:]')"
    for WASM_FILE in "${WASM_FILES[@]}"; do
        cp -- "${GACUI_ROOT}/Test/Linux/Wasm${WASM_APP}/Bin/${WASM_FILE}" "${DIST_ROOT}/wasm-${WASM_PAGE}/"
    done
    echo "Copied Wasm${WASM_APP} to ${DIST_ROOT}/wasm-${WASM_PAGE}/"
done
