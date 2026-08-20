import { runRvmHostCli, runtimeArguments } from './cliMain.js';

runRvmHostCli(runtimeArguments()).then(
    code => process.exit(code),
    error => {
        process.stderr.write(`gacjs-rvmhost: ${error instanceof Error ? error.message : String(error)}\n`);
        process.exit(1);
    },
);
