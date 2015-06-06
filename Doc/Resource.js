/*
API:
    interface IResourceDeserializer
    {
        string Name { get; }
        string PriorDeserializerName { get; }
        object Deserialize(object resource);
    }

    void RegisterStaticResource(fileNamePattern, deserializer);
    Future GetStaticResourceAsync(path);
*/
Packages.Define("Doc.Resource", ["Class", "Doc.Delay", "Doc.Wildcard"], function (__injection__) {
    eval(__injection__);

    var IResourceDeserializer = Class("<Doc.Resource>::IResourceDeserializer", {
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

    function RegisterStaticResource(fileNamePattern, deserializer) {

    }

    function GetStaticResourceAsync(path) {

    }

    return {
        IResourceDeserializer: IResourceDeserializer,
        RegisterStaticResource: RegisterStaticResource,
        GetStaticResourceAsync: GetStaticResourceAsync,
    }
})