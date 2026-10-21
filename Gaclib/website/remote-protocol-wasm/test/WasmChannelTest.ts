import { expect, test } from 'vitest';
import { WasmApplication } from '../src/index.js';
import { WasmCommand, WasmNotification } from '../src/messages.js';
import { createRemoteProtocolClient, parseNetworkPackage } from '@gaclib-website/remote-protocol-http';
import { IOPointInfo, IOPointEndReason, IRemoteProtocolRequests, ProtocolInvoking } from '@gaclib/remote-protocol';

class FakeWorker {
    readonly sent: WasmCommand[] = [];
    terminated = 0;
    onmessage: ((event: { data: WasmNotification }) => void) | undefined;
    onerror: ((event: { message: string }) => void) | undefined;
    postMessage(command: WasmCommand): void { this.sent.push(command); }
    terminate(): void { this.terminated++; }
    notify(kind: WasmNotification['kind'], connectionId = 0, data = ''): void {
        this.onmessage?.({ data: { kind, connectionId, data } });
    }
}

function setup(channels = [['GacUIRemoteProtocol']]): { worker: FakeWorker; application: WasmApplication } {
    const worker = new FakeWorker();
    const application = new WasmApplication({
        moduleUrl: 'http://localhost/demo/app.mjs',
        workerUrl: 'http://localhost/wasm-worker.js',
        channels,
        createWorker: () => worker as unknown as Worker,
    });
    return { worker, application };
}

test('host and renderer have independent channels, IDs and ordered Unicode messages', async () => {
    const { worker, application } = setup([['ViewModelChannel', 'ViewModelReadyChannel'], ['GacUIRemoteProtocol']]);
    const [host, renderer] = application.channels;
    const hosting = host.connect();
    const rendering = renderer.connect();
    expect(worker.sent).toEqual([{ kind: 'start', moduleUrl: 'http://localhost/demo/app.mjs', connectionCount: 2 }]);
    worker.notify('ready');
    await application.ready;
    expect(worker.sent.slice(1)).toEqual([
        { kind: 'data', connectionId: 1, data: ';;ViewModelChannel!ViewModelReadyChannel' },
        { kind: 'data', connectionId: 2, data: ';;GacUIRemoteProtocol' },
    ]);
    worker.notify('data', 1, '4;;');
    worker.notify('data', 2, '5;;');
    await Promise.all([hosting, rendering]);
    expect(host.clientId).toBe(4);
    expect(renderer.clientId).toBe(5);
    const received: string[] = [];
    worker.notify('data', 2, '1;GacUIRemoteProtocol;first;你好😀\0');
    worker.notify('data', 2, '1;GacUIRemoteProtocol;second');
    renderer.onMessage(message => { received.push(message.messageBody); });
    expect(received).toEqual(['first;你好😀\0', 'second']);
    await host.broadcast('ViewModelReadyChannel', '["Ready"]');
    await renderer.sendToClient(1, 'GacUIRemoteProtocol', 'response;你好😀\0');
    expect(worker.sent.slice(-2)).toEqual([
        { kind: 'data', connectionId: 1, data: ';ViewModelReadyChannel;["Ready"]' },
        { kind: 'data', connectionId: 2, data: '1;GacUIRemoteProtocol;response;你好😀\0' },
    ]);
    renderer.stop();
    expect(await renderer.completion).toEqual({ type: 'stopped' });
    expect(host.state).toBe('assigned');
    application.stop();
    expect(await host.completion).toEqual({ type: 'stopped' });
    expect(worker.sent.every(command => command.kind === 'start' || command.kind === 'data')).toBe(true);
});

test('Core fatal errors win over close and release a blocked channel reader', async () => {
    const { worker, application } = setup();
    worker.notify('ready');
    const [client] = application.channels;
    const connected = client.connect();
    await application.ready;
    worker.notify('data', 1, '2;;');
    await connected;
    const reading = client.start();
    const rejected = expect(reading).rejects.toThrow('This is a fatel error!');
    worker.notify('data', 1, ';!Error;This is a fatel error!');
    worker.notify('closed', 1);
    await rejected;
    expect(client.state).toBe('failed');
    await expect(client.sendToClient(1, 'GacUIRemoteProtocol', 'late')).rejects.toThrow('not assigned');
    worker.notify('exit', 0, '1');
    expect(await application.completion).toBe(1);
    expect(worker.terminated).toBe(1);
});

test('point boundaries, sparse identities and full-width decimal fields survive the Wasm channel', async () => {
    const { worker, application } = setup();
    const [channel] = application.channels;
    const connecting = channel.connect();
    worker.notify('ready');
    await application.ready;
    worker.notify('data', 1, '2;;');
    await connecting;
    const client = createRemoteProtocolClient({} as IRemoteProtocolRequests, channel);
    const info: IOPointInfo = {
        sequenceId: '18446744073709551615', timestamp: '9007199254740993', platformFrameId: '18446744073709551614',
        pointId: 0, activePointCount: 1, position: { x: { value: 40 }, y: { value: 50 } },
        primary: true, ctrl: false, shift: true, alt: false, osSuper: false,
        contactBounds: null, pressure: 0, orientation: null,
    };
    const first = worker.sent.length;
    client.events.OnIOPointStarted({ eventIndex: 0, info });
    client.events.OnIOPointDown({ eventIndex: 1, info });
    client.events.OnIOPointDown({ eventIndex: 2, info: { ...info, pointId: 1, activePointCount: 2 } });
    client.events.OnIOPointUp({ eventIndex: 3, info });
    client.events.OnIOPointDown({ eventIndex: 4, info: { ...info, pointId: 2, activePointCount: 2 } });
    client.events.OnIOPointUp({ eventIndex: 5, info: { ...info, pointId: 1 } });
    client.events.OnIOPointUpdate({ eventIndex: 6, info: { ...info, pointId: 2 } });
    client.events.OnIOPointEnded({ sequenceId: info.sequenceId, timestamp: info.timestamp,
        eventIndex: 7, accepted: true, reason: IOPointEndReason.Canceled_CaptureLost });
    const packets = worker.sent.slice(first);
    const messages = packets.flatMap(command => {
        expect(command.kind).toBe('data');
        if (command.kind !== 'data') throw new Error('Expected a channel packet.');
        expect(command.connectionId).toBe(1);
        const packet = parseNetworkPackage(command.data);
        expect(packet.channelName).toBe('GacUIRemoteProtocol');
        return JSON.parse(packet.messageBody) as ProtocolInvoking[];
    });
    expect(messages.map(message => message.name)).toEqual([
        'IOPointStarted', 'IOPointDown', 'IOPointDown', 'IOPointUp', 'IOPointDown', 'IOPointUp', 'IOPointUpdate', 'IOPointEnded',
    ]);
    for (const [index, message] of messages.entries()) {
        const args = message.arguments as { eventIndex: number; info?: IOPointInfo; sequenceId?: string; timestamp?: string; reason?: IOPointEndReason };
        expect(args.eventIndex).toBe(index);
        expect((args.info ?? args).sequenceId).toBe(info.sequenceId);
        expect((args.info ?? args).timestamp).toBe(info.timestamp);
        if (args.info !== undefined) expect(args.info.platformFrameId).toBe(info.platformFrameId);
    }
    expect(messages.at(-1)?.arguments).toEqual({ sequenceId: info.sequenceId, timestamp: info.timestamp,
        eventIndex: 7, accepted: true, reason: IOPointEndReason.Canceled_CaptureLost });
    client.stop();
    application.stop();
});

test('rejected admission settles connect and does not terminate another connection', async () => {
    const { worker, application } = setup([['ViewModelChannel', 'ViewModelReadyChannel'], ['GacUIRemoteProtocol']]);
    worker.notify('ready');
    const [rejected, renderer] = application.channels;
    const connecting = expect(rejected.connect()).rejects.toThrow('closed before assignment');
    await application.ready;
    worker.notify('closed', 1);
    await connecting;
    expect(renderer.state).toBe('connecting');
    application.stop();
});

test('malformed and duplicate assignments are terminal for their channel', async () => {
    for (const packet of ['bad', '0;;', '2,3;;', '2;;unexpected']) {
        const { worker, application } = setup([['A']]);
        worker.notify('ready');
        const [client] = application.channels;
        const connecting = expect(client.connect()).rejects.toThrow();
        await application.ready;
        worker.notify('data', 1, packet);
        await connecting;
        expect(client.state).toBe('failed');
        application.stop();
    }
    const { worker, application } = setup([['A']]);
    worker.notify('ready');
    const [client] = application.channels;
    const connecting = client.connect();
    await application.ready;
    worker.notify('data', 1, '2;;');
    await connecting;
    worker.notify('data', 1, '3;;');
    expect(client.state).toBe('failed');
    application.stop();
});

test('worker failure and stop settle startup instead of leaving callers pending', async () => {
    const { worker, application } = setup();
    const ready = expect(application.ready).rejects.toThrow('cannot load');
    const rendererReady = expect(application.rendererReady).rejects.toThrow('cannot load');
    const completion = expect(application.completion).rejects.toThrow('cannot load');
    worker.onerror?.({ message: 'cannot load' });
    await Promise.all([ready, rendererReady, completion]);
    application.stop();
    expect(worker.terminated).toBe(1);
});
