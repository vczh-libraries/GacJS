import { createReadStream } from 'node:fs';
import type { Stats } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const host = '127.0.0.1';
const port = 8896;
const websiteUrl = `http://localhost:${port}`;
const websiteRoot = fileURLToPath(new URL('./dist/', import.meta.url));

const contentTypes: Readonly<Record<string, string>> = {
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml; charset=utf-8',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

function getErrorCode(error: unknown): string | undefined {
    if (error instanceof Error && 'code' in error) {
        const code = (error as NodeJS.ErrnoException).code;
        return typeof code === 'string' ? code : undefined;
    }
    return undefined;
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function sendText(response: ServerResponse<IncomingMessage>, method: string, status: number, message: string): void {
    response.writeHead(status, {
        'Content-Length': Buffer.byteLength(message),
        'Content-Type': 'text/plain; charset=utf-8',
    });
    response.end(method === 'HEAD' ? undefined : message);
}

function isPathInsideWebsite(candidate: string): boolean {
    const relativePath = relative(websiteRoot, candidate);
    return relativePath === '' ||
        (!isAbsolute(relativePath) && relativePath !== '..' && !relativePath.startsWith(`..${sep}`));
}

async function serveFile(request: IncomingMessage, response: ServerResponse<IncomingMessage>): Promise<void> {
    const method = request.method ?? 'GET';
    if (method !== 'GET' && method !== 'HEAD') {
        response.setHeader('Allow', 'GET, HEAD');
        sendText(response, method, 405, 'Method Not Allowed\n');
        return;
    }

    let pathname: string;
    try {
        pathname = decodeURIComponent(new URL(request.url ?? '/', websiteUrl).pathname);
    }
    catch {
        sendText(response, method, 400, 'Bad Request\n');
        return;
    }

    const requestedPath = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
    let filePath = resolve(websiteRoot, requestedPath.replace(/^\/+/, ''));
    if (!isPathInsideWebsite(filePath)) {
        sendText(response, method, 403, 'Forbidden\n');
        return;
    }

    let fileStat: Stats;
    try {
        fileStat = await stat(filePath);
        if (fileStat.isDirectory()) {
            filePath = resolve(filePath, 'index.html');
            if (!isPathInsideWebsite(filePath)) {
                sendText(response, method, 403, 'Forbidden\n');
                return;
            }
            fileStat = await stat(filePath);
        }
    }
    catch (error) {
        if (getErrorCode(error) === 'ENOENT') {
            sendText(response, method, 404, 'Not Found\n');
            return;
        }
        throw error;
    }

    if (!fileStat.isFile()) {
        sendText(response, method, 404, 'Not Found\n');
        return;
    }

    response.writeHead(200, {
        'Content-Length': fileStat.size,
        'Content-Type': contentTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
    });
    if (method === 'HEAD') {
        response.end();
        return;
    }

    const stream = createReadStream(filePath);
    stream.on('error', error => {
        console.error(`Could not read ${filePath}: ${getErrorMessage(error)}`);
        response.destroy(error);
    });
    stream.pipe(response);
}

function describeListenError(error: unknown): string {
    const code = getErrorCode(error);
    if (code === 'EADDRINUSE') {
        if (process.platform === 'win32') {
            return `Port ${port} is already in use. The GacJS website may already be hosted by IIS at ${websiteUrl}.`;
        }
        return `Cannot start the GacJS website because port ${port} is already in use on ${host}.`;
    }
    const codeText = code === undefined ? '' : ` (${code})`;
    return `Cannot start the GacJS website on ${websiteUrl}${codeText}: ${getErrorMessage(error)}`;
}

async function startListening(server: ReturnType<typeof createServer>): Promise<void> {
    await new Promise<void>((resolvePromise, rejectPromise) => {
        const onError = (error: Error): void => {
            server.off('listening', onListening);
            rejectPromise(error);
        };
        const onListening = (): void => {
            server.off('error', onError);
            resolvePromise();
        };
        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(port, host);
    });
}

async function waitForStop(server: ReturnType<typeof createServer>): Promise<void> {
    await new Promise<void>(resolvePromise => {
        const input = createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        let stopping = false;

        const cleanUp = (): void => {
            process.off('SIGINT', stop);
            process.off('SIGTERM', stop);
        };
        const stop = (): void => {
            if (stopping) {
                return;
            }
            stopping = true;
            input.close();
            server.close(error => {
                cleanUp();
                if (error === undefined) {
                    console.log('GacJS website stopped.');
                }
                else {
                    console.error(`Could not stop the GacJS website cleanly: ${getErrorMessage(error)}`);
                    process.exitCode = 1;
                }
                resolvePromise();
            });
        };

        input.once('line', stop);
        input.once('close', stop);
        process.once('SIGINT', stop);
        process.once('SIGTERM', stop);
    });
}

async function main(): Promise<void> {
    try {
        const rootStat = await stat(websiteRoot);
        if (!rootStat.isDirectory()) {
            throw new Error(`${websiteRoot} is not a directory`);
        }
    }
    catch (error) {
        console.error(`Cannot serve the GacJS website from ${websiteRoot}: ${getErrorMessage(error)}. Run yarn build first.`);
        process.exitCode = 1;
        return;
    }

    const server = createServer((request, response) => {
        void serveFile(request, response).catch(error => {
            console.error(`Website request failed: ${getErrorMessage(error)}`);
            if (!response.headersSent) {
                sendText(response, request.method ?? 'GET', 500, 'Internal Server Error\n');
            }
            else {
                response.destroy(error instanceof Error ? error : undefined);
            }
        });
    });

    try {
        await startListening(server);
    }
    catch (error) {
        console.error(describeListenError(error));
        process.exitCode = 1;
        return;
    }

    console.log(`GacJS website is available at ${websiteUrl}.`);
    console.log('Press ENTER to stop.');
    await waitForStop(server);
}

await main();
