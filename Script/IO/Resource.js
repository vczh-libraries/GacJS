/*
API:
    interface IResourceDeserializer
    {
        string Name { get; }
        string PriorDeserializerName { get; }
        object Deserialize(object resource);
    }
    
    void                                RegisterDeserializer(IResourceDeserializer deserializer);
    void                                RegisterResource(string fileNamePattern, string deserializerName);
    Future<Dictionary<string, object>>  GetResourceAsync(string path, bool async, int maxRetryCount);
*/
Packages.Define("IO.Resource", ["Class", "IO.Delay", "IO.Wildcard"], function (__injection__) {
    eval(__injection__);

    /********************************************************************************
    IResourceDeserializer
    ********************************************************************************/

    var IResourceDeserializer = Class(PQN("IResourceDeserializer"), {
        GetName: Public.Abstract(),
        Name: Public.Property({ readonly: true }),

        GetPriorDeserializerName: Public.Virtual(function () {
            return null;
        }),
        PriorDeserializerName: Public.Property({ readonly: true }),

        Deserialize: Public.Virtual(function (resource) {
            return resource;
        }),
    });

    /********************************************************************************
    Text
    ********************************************************************************/

    var TextResourceDeserializer = Class(PQN("TextResourceDeserializer"), IResourceDeserializer, {
        GetName: Public.Override(function () {
            return "Text";
        }),

        Deserialize: Public.Override(function (resource) {
            return resource;
        }),
    });

    /********************************************************************************
    XML
    ********************************************************************************/

    var domParser = new DOMParser();

    var XmlResourceDeserializer = Class(PQN("XmlResourceDeserializer"), IResourceDeserializer, {
        GetName: Public.Override(function () {
            return "Xml";
        }),

        GetPriorDeserializerName: Public.Override(function () {
            return "Text";
        }),

        Deserialize: Public.Override(function (resource) {
            return domParser.parseFromString(resource, "text/xml");
        }),
    });

    /********************************************************************************
    Json
    ********************************************************************************/

    var JsonResourceDeserializer = Class(PQN("JsonResourceDeserializer"), IResourceDeserializer, {
        GetName: Public.Override(function () {
            return "Json";
        }),

        GetPriorDeserializerName: Public.Override(function () {
            return "Text";
        }),

        Deserialize: Public.Override(function (resource) {
            return JSON.parse(resource);
        }),
    });

    /********************************************************************************
    API
    ********************************************************************************/

    deserializers = {};
    resourcePatterns = [];
    staticResources = {};

    /********************************************************************************
    RegisterDeserializer
    ********************************************************************************/

    function RegisterDeserializer(deserializer) {
        IResourceDeserializer.RequireType(deserializer);
        if (deserializers.hasOwnProperty(deserializer.Name)) {
            throw new Error("Resource deserializer \"" + deserializer.Name + "\" already exists.");
        }

        var prior = deserializer.PriorDeserializerName;
        if (prior !== null && !deserializers.hasOwnProperty(prior)) {
            throw new Error("Resource deserializer \"" + prior + "\" does not exist.");
        }

        deserializers[deserializer.Name] = deserializer;
    }

    /********************************************************************************
    RegisterResource
    ********************************************************************************/

    function RegisterResource(fileNamePattern, deserializerName) {
        if (!deserializers.hasOwnProperty(deserializerName)) {
            throw new Error("Resource deserializer \"" + deserializerName + "\" does not exist.");
        }
        resourcePatterns.push({ pattern: fileNamePattern, name: deserializerName });
    }

    /********************************************************************************
    GetResourceAsync
    ********************************************************************************/

    function DeserializeResourceByName(deserializerName, text, result) {
        var resource = result[deserializerName];
        if (resource === undefined) {
            try {
                var deserializer = deserializers[deserializerName];
                if (deserializer.PriorDeserializerName === null) {
                    resource = deserializer.Deserialize(text);
                }
                else {
                    var priorResource = DeserializeResourceByName(deserializer.PriorDeserializerName, text, result);
                    if (priorResource === null) {
                        throw Error("Unable to deserialize the resource as \"" + deserializerName + "\" because the deserialization of \"" + deserializer.PriorDeserializerName + "\" failed.");
                    }
                    resource = deserializer.Deserialize(priorResource);
                }
            }
            catch (ex) {
                resource = ex;
            }
            result[deserializerName] = resource;
        }
        return resource instanceof Error ? null : resource;
    }

    function DeserializeResource(path, text, result) {
        var index = path.lastIndexOf("/");
        if (index !== -1) {
            path = path.substring(index + 1, path.length);
        }

        for (var i = 0; i < resourcePatterns.length; i++) {
            var pattern = resourcePatterns[i];
            var match = pattern.pattern.exec(path);
            if (match !== null && match[0] === path) {
                DeserializeResourceByName(pattern.name, text, result);
            }
        }
    }

    function GetResourceRetryOnceAsync(path, async) {
        if (async === undefined) {
            async = true;
        }

        var delay = CreateDelay();
        var resource = staticResources[path];
        if (resource === undefined) {
            var xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        var result = {};
                        DeserializeResource(path, xhr.responseText, result);
                        staticResources[path] = result;
                        delay.promise.SetResult(result);
                    }
                    else {
                        delay.promise.SetException();
                    }
                }
            }

            xhr.open("GET", path, async);
            xhr.send(null);
        }
        else {
            delay.promise.SetResult(resource);
        }

        return delay.future;
    }

    function GetResourceAsync(path, async, maxRetryCount) {
        if (maxRetryCount === undefined) {
            maxRetryCount = 3;
        }

        var counter = 0;

        function generator() {
            return GetResourceRetryOnceAsync(path, async);
        }

        function continueRepeating(value) {
            return DelayException.TestType(value) || ++counter === maxRetryCount;
        }

        return RepeatFuture(generator, continueRepeating).ContinueWith(function (value) {
            return value[value.length - 1];
        });
    }

    /********************************************************************************
    Package
    ********************************************************************************/

    RegisterDeserializer(new TextResourceDeserializer());
    RegisterDeserializer(new XmlResourceDeserializer());
    RegisterDeserializer(new JsonResourceDeserializer());
    RegisterResource(WildcardToRegExp("*.txt"), "Text");
    RegisterResource(WildcardToRegExp("*.xml"), "Xml");
    RegisterResource(WildcardToRegExp("*.json"), "Json");

    return {
        IResourceDeserializer: IResourceDeserializer,
        RegisterDeserializer: RegisterDeserializer,
        RegisterResource: RegisterResource,
        GetResourceAsync: GetResourceAsync,
    }
})