#!/usr/bin/env bash

set -euo pipefail

GACLIB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GACJS_ROOT="$(dirname "$GACLIB_ROOT")"
WORKSPACE_ROOT="$(dirname "$GACJS_ROOT")"
WORKFLOW_ROOT="$WORKSPACE_ROOT/Workflow"
WORKFLOW_TEST_ROOT="$WORKFLOW_ROOT/Test"
WORKFLOW_DRIVER_ROOT="$WORKFLOW_TEST_ROOT/Linux/RpcStdioTest_Driver"
WORKFLOW_BUILD_SCRIPT="$WORKFLOW_ROOT/.github/Ubuntu/build.sh"
DRIVER="$WORKFLOW_DRIVER_ROOT/Bin/RpcStdioTest_Driver"
SKIP_LIST="$WORKFLOW_TEST_ROOT/StartRpcStdio_DtorSkipList.txt"
CLI_ENTRY="$GACLIB_ROOT/rpc-test/rpc-test-cli/lib/src/cli.js"

for required_path in "$WORKFLOW_DRIVER_ROOT" "$WORKFLOW_BUILD_SCRIPT" "$SKIP_LIST"; do
    if [[ ! -e "$required_path" ]]; then
        echo "Required Workflow path does not exist: $required_path" >&2
        exit 1
    fi
done

if ! NODE="$(command -v node)"; then
    echo "Required command not found: node" >&2
    exit 1
fi
if ! YARN="$(command -v yarn)"; then
    echo "Required command not found: yarn" >&2
    exit 1
fi

echo "Building Workflow Debug x64 RPC driver..."
(
    cd "$WORKFLOW_DRIVER_ROOT"
    "$WORKFLOW_BUILD_SCRIPT"
)

echo "Building GacJS..."
(
    cd "$GACLIB_ROOT"
    "$YARN" build
)

for required_file in "$DRIVER" "$CLI_ENTRY"; do
    if [[ ! -f "$required_file" ]]; then
        echo "Required executable or entry point was not built: $required_file" >&2
        exit 1
    fi
done

printf -v NODE_COMMAND '%q' "$NODE"
printf -v CLI_COMMAND '%q' "$CLI_ENTRY"
SERVICE_COMMAND="$NODE_COMMAND $CLI_COMMAND"

echo "Starting: $DRIVER $SERVICE_COMMAND $SKIP_LIST"
cd "$WORKFLOW_TEST_ROOT"
exec "$DRIVER" "$SERVICE_COMMAND" "$SKIP_LIST"
