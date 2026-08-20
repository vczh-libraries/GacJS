import { RpcException } from './errors.js';

export type RpcEventHandler<TArguments extends readonly unknown[]> = (...arguments_: TArguments) => void | Promise<void>;

export class RpcEvent<TArguments extends readonly unknown[]> {
    private readonly handlers = new Set<RpcEventHandler<TArguments>>();
    private outgoing: RpcEventHandler<TArguments> | undefined;

    subscribe(handler: RpcEventHandler<TArguments>): () => void {
        this.handlers.add(handler);
        return () => {
            this.handlers.delete(handler);
        };
    }

    setOutgoing(handler: RpcEventHandler<TArguments> | undefined): void {
        this.outgoing = handler;
    }

    async emit(...arguments_: TArguments): Promise<void> {
        const exceptions = await this.dispatch(arguments_);
        if (this.outgoing !== undefined) {
            try {
                await this.outgoing(...arguments_);
            } catch (error) {
                exceptions.push(error);
            }
        }
        this.throwIfNeeded(exceptions);
    }

    async dispatchRemote(...arguments_: TArguments): Promise<void> {
        this.throwIfNeeded(await this.dispatch(arguments_));
    }

    clear(): void {
        this.outgoing = undefined;
        this.handlers.clear();
    }

    private async dispatch(arguments_: TArguments): Promise<unknown[]> {
        const exceptions: unknown[] = [];
        for (const handler of [...this.handlers]) {
            try {
                await handler(...arguments_);
            } catch (error) {
                exceptions.push(error);
            }
        }
        return exceptions;
    }

    private throwIfNeeded(exceptions: unknown[]): void {
        if (exceptions.length === 1) {
            throw RpcException.from(exceptions[0]);
        }
        if (exceptions.length > 1) {
            throw new RpcException(exceptions.map(error => RpcException.from(error).message).join('\n'));
        }
    }
}

export function expectRpcEvent(value: unknown, description: string): RpcEvent<readonly unknown[]> {
    if (!(value instanceof RpcEvent)) {
        throw new Error(`${description} must be an RpcEvent.`);
    }
    return value as RpcEvent<readonly unknown[]>;
}
