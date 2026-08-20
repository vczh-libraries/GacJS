import {
    RpcDisposable,
    RpcObjectReference,
    RpcProxyContext,
    RpcProxyEndpoint,
} from './types.js';

export abstract class RpcProxy implements RpcDisposable {
    protected readonly endpoint: RpcProxyEndpoint;
    public readonly reference: RpcObjectReference;
    private readonly propertyCache = new Map<string, Promise<unknown>>();
    private localStateFinalized = false;

    constructor(context: RpcProxyContext) {
        this.endpoint = context.endpoint;
        this.reference = context.reference;
    }

    get disposed(): boolean {
        return this.endpoint.isProxyDisposed(this);
    }

    dispose(): Promise<void> {
        this.finalizeLocalState();
        return this.endpoint.disposeProxy(this);
    }

    finalizeLocalState(): void {
        if (this.localStateFinalized) return;
        this.localStateFinalized = true;
        this.onFinalize();
    }

    protected onFinalize(): void {
        this.clearPropertyCache();
    }

    protected invoke<T>(methodId: number, arguments_: readonly unknown[]): Promise<T> {
        return this.endpoint.invokeProxy(this, methodId, arguments_) as Promise<T>;
    }

    protected raiseEvent(eventId: number, arguments_: readonly unknown[]): Promise<void> {
        return this.endpoint.raiseProxyEvent(this, eventId, arguments_);
    }

    protected getCachedProperty<T>(key: string, loader: () => Promise<T>): Promise<T> {
        const existing = this.propertyCache.get(key);
        if (existing !== undefined) {
            return existing as Promise<T>;
        }
        const loading = loader().catch(error => {
            this.propertyCache.delete(key);
            throw error;
        });
        this.propertyCache.set(key, loading);
        return loading;
    }

    protected invalidateProperty(key: string): void {
        this.propertyCache.delete(key);
    }

    clearPropertyCache(): void {
        this.propertyCache.clear();
    }
}
