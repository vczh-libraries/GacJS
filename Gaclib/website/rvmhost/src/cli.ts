import { runRvmHostCli, runtimeArguments } from './cliMain.js';

const arguments_ = runtimeArguments();

function finish(code: number): void {
    if (arguments_.length === 1 && arguments_[0] === '/Cli') {
        process.exit(code);
    }
    // Let canceled HTTP requests and diagnostic writes finish before Node exits.
    process.exitCode = code;
}

runRvmHostCli(arguments_).then(
    finish,
    error => {
        process.stderr.write(`gacjs-rvmhost: ${error instanceof Error ? error.message : String(error)}\n`);
        finish(1);
    },
);
