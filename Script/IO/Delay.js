/*
API:
    class DelayException
    {
        object Exception { get; }
    }

    type CombinedValue = DelayException | object | Future;

    class Promise
    {
        void SetResult(object value);
        void SetException(object value);
    }

    class Future
    {
        object Result { get; }
        Future SucceededThen(delegate CombinedValue (object));
        Future FailedThen(delegate CombinedValue (object));
        Future Then(delegate CombinedValue (object | DelayException));
        Future ContinueWith(delegate CombinedValue (object));
    }

    void                                    PassResultToPromise((object | DelayException | Future), Promise);
    {promise:Promise, future:Future}        CreateDelay();
    Future                                  CreateEvaluatedFuture(object value);
    Future<object[]>                        WaitAll(Future[]);
    Future<{index:number, result:object}>   WaitAny(Future[]);
    Future                                  RepeatFuture(delegate Future (), delegate bool continueRepeating(object | DelayException));
*/
Packages.Define("IO.Delay", ["Class"], function (__injection__) {
    eval(__injection__);

    /********************************************************************************
    Delay
    ********************************************************************************/

    var Delay = Class(PQN("Delay"), {
        result: Protected(null),
        callbacks: Protected(null),

        __Constructor: Public(function () {
            this.callbacks = [];
        }),

        GetResult: Public(function () {
            if (this.callbacks === null) {
                return this.result;
            }
            else {
                throw new Error("Result of a delay has not been assigned yet.");
            }
        }),
        SetResult: Public(function (value) {
            if (this.callbacks === null) {
                throw new Error("Result of a delay can only be assigned once.");
            }
            else {
                this.result = value;
                var callbacks = this.callbacks;
                this.callbacks = null;
                for (var i = 0; i < callbacks.length; i++) {
                    callbacks[i](this.result);
                }
            }
        }),
        Result: Public.Property({}),

        HasResult: Public(function () {
            return this.callbacks === null;
        }),

        DelayExecute: Public(function (callback) {
            if (this.callbacks === null) {
                callback(this.result);
            }
            else {
                this.callbacks.push(callback);
            }
        })
    });

    /********************************************************************************
    DelayException
    ********************************************************************************/

    var DelayException = Class(PQN("DelayException"), {
        exception: Protected(null),

        GetException: Public(function () {
            return this.exception;
        }),
        Exception: Public.Property({ readonly: true }),

        __Constructor: Public(function (exception) {
            this.exception = exception;
        })
    });

    /********************************************************************************
    Promise
    ********************************************************************************/

    var Promise = Class(PQN("Promise"), {
        delay: Protected(null),

        __Constructor: Public.StrongTyped(__Void, [Delay], function (delay) {
            this.delay = delay;
        }),

        SetResult: Public(function (value) {
            this.delay.Result = value;
        }),

        SetException: Public(function (value) {
            this.delay.Result = new DelayException(value);
        }),
    });

    /********************************************************************************
    Future
    ********************************************************************************/

    function PassResultToPromise(result, promise) {
        if (Future.TestType(result)) {
            result.Then(function (value) {
                PassResultToPromise(value, promise);
            });
        }
        else if (DelayException.TestType(result)) {
            promise.SetException(result.Exception);
        }
        else {
            promise.SetResult(result);
        }
    }

    var Future = Class(PQN("Future"), function () {
        return {
            delay: Protected(null),

            __Constructor: Public.StrongTyped(__Void, [Delay], function (delay) {
                this.delay = delay;
            }),

            GetResult: Public(function () {
                return this.delay.Result;
            }),
            Result: Public.Property({ readonly: true }),

            HasResult: Public(function () {
                return this.delay.HasResult();
            }),

            SucceededThen: Public.StrongTyped(Future, [__Function], function (generator) {
                var delay = new Delay();
                var promise = new Promise(delay);
                var future = new Future(delay);
                this.delay.DelayExecute(function (value) {
                    if (!DelayException.TestType(value)) {
                        try {
                            PassResultToPromise(generator(value), promise);
                        }
                        catch (ex) {
                            promise.SetException(ex);
                        }
                    }
                });
                return future;
            }),

            FailedThen: Public.StrongTyped(Future, [__Function], function (generator) {
                var delay = new Delay();
                var promise = new Promise(delay);
                var future = new Future(delay);
                this.delay.DelayExecute(function (value) {
                    if (DelayException.TestType(value)) {
                        try {
                            PassResultToPromise(generator(value.Exception), promise);
                        }
                        catch (ex) {
                            promise.SetException(ex);
                        }
                    }
                });
                return future;
            }),

            Then: Public.StrongTyped(Future, [__Function], function (generator) {
                var delay = new Delay();
                var promise = new Promise(delay);
                var future = new Future(delay);
                this.delay.DelayExecute(function (value) {
                    try {
                        PassResultToPromise(generator(value), promise);
                    }
                    catch (ex) {
                        promise.SetException(ex);
                    }
                });
                return future;
            }),

            ContinueWith: Public.StrongTyped(Future, [__Function], function (generator) {
                var delay = new Delay();
                var promise = new Promise(delay);
                var future = new Future(delay);
                this.delay.DelayExecute(function (value) {
                    try {
                        if (DelayException.TestType(value)) {
                            throw value.Exception;
                        }
                        PassResultToPromise(generator(value), promise);
                    }
                    catch (ex) {
                        promise.SetException(ex);
                    }
                });
                return future;
            }),
        }
    });

    /********************************************************************************
    CreateDelay / CreateEvaluatedFuture
    ********************************************************************************/

    function CreateDelay() {
        var delay = new Delay();
        var promise = new Promise(delay);
        var future = new Future(delay);
        return {
            promise: promise,
            future: future,
        }
    }

    function CreateEvaluatedFuture(value) {
        var delay = CreateDelay();
        PassResultToPromise(value, delay.promise);
        return delay.future;
    }

    /********************************************************************************
    WaitAll
    ********************************************************************************/

    function WaitAll(futures) {
        var count = futures.length;
        var finished = 0;
        var delay = CreateDelay();

        function OnReady() {
            var result = futures.map(function (future) {
                return future.Result;
            });
            delay.promise.SetResult(result);
        }

        for (var i = 0; i < count; i++) {
            var future = futures[i];
            if (future.HasResult()) {
                finished++;
            }
            else {
                future.Then(function (value) {
                    finished++;
                    if (finished === count) {
                        OnReady();
                    }
                });
            }
        }

        if (finished === count) {
            OnReady();
        }
        return delay.future;
    }

    /********************************************************************************
    WaitAny
    ********************************************************************************/

    function WaitAny(futures) {
        var count = futures.length;
        var delay = CreateDelay();

        function OnReady(index) {
            var result = { index: index, result: futures[index].Result };
            delay.promise.SetResult(result);
        }

        not_ready: {
            for (var i = 0; i < count; i++) {
                if (futures[i].HasResult()) {
                    OnReady(i);
                    break not_ready;
                }
                else (function () {
                    var index = i;
                    futures[i].Then(function (value) {
                        if (!delay.future.HasResult()) {
                            OnReady(index);
                        }
                    })
                })();
            }
        }

        return delay.future;
    }

    /********************************************************************************
    RepeatFuture
    ********************************************************************************/

    function RepeatFutureBody(results, delay, generator, continueRepeating) {
        var future = generator();
        future.Then(function (value) {
            results.push(value);
            try {
                if (continueRepeating(value)) {
                    RepeatFutureBody(results, delay, generator, continueRepeating);
                }
                else {
                    delay.promise.SetResult(results);
                }
            }
            catch (ex) {
                delay.promise.SetException(ex);
            }
        })
    }

    function RepeatFuture(generator, continueRepeating) {
        var results = [];
        var delay = CreateDelay();
        RepeatFutureBody(results, delay, generator, continueRepeating);
        return delay.future;
    }

    /********************************************************************************
    Package
    ********************************************************************************/

    return {
        DelayException: DelayException,
        PassResultToPromise: PassResultToPromise,
        Promise: Promise,
        Future: Future,
        CreateDelay: CreateDelay,
        CreateEvaluatedFuture: CreateEvaluatedFuture,
        WaitAll: WaitAll,
        WaitAny: WaitAny,
        RepeatFuture: RepeatFuture,
    }
})