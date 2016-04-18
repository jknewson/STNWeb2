declare module WiM.Services {
    interface IHTTPServiceBase {
        Execute(request: Helpers.RequestInfo): ng.IPromise<any>;
    }
    class HTTPServiceBase implements IHTTPServiceBase {
        private baseURL;
        $http: ng.IHttpService;
        constructor(http: ng.IHttpService, baseURL: string);
        Execute<T>(request: Helpers.RequestInfo): ng.IPromise<T>;
    }
}
