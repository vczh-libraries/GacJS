#!/usr/bin/env node
import { runRpcTestService, runtimeArguments } from './service.js';

void runRpcTestService(runtimeArguments()).then(
    exitCode => { process.exitCode = exitCode; },
    error => {
        const message = error instanceof Error ? error.stack ?? error.message : String(error);
        process.stderr.write(`${message}\n`);
        process.exitCode = 1;
    },
);
