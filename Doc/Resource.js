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
    Future<Dictionary<string, object>>  GetResourceAsync(path);
*/
Packages.Define("Doc.Resource", ["Class", "Doc.Delay", "Doc.Wildcard"], function (__injection__) {
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

    function RegisterResource(fileNamePattern, deserializerName) {
        if (!deserializers.hasOwnProperty(deserializerName)) {
            throw new Error("Resource deserializer \"" + deserializerName + "\" does not exist.");
        }
        resourcePatterns.push({ pattern: fileNamePattern, name: deserializerName });
    }

    function GetResourceAsync(path) {

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