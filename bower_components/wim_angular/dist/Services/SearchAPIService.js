var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var WiM;
(function (WiM) {
    var Services;
    (function (Services) {
        'use strict';
        Services.onSelectedAreaOfInterestChanged = "onSelectedAreaOfInterestChanged";
        var SearchAPIEventArgs = (function (_super) {
            __extends(SearchAPIEventArgs, _super);
            function SearchAPIEventArgs(aoi) {
                _super.call(this);
                this.selectedAreaOfInterest = aoi;
            }
            return SearchAPIEventArgs;
        })(WiM.Event.EventArgs);
        Services.SearchAPIEventArgs = SearchAPIEventArgs;
        var SearchLocation = (function () {
            function SearchLocation(nm, ct, st, lat, long) {
                this.Name = nm;
                this.Category = ct;
                this.State = st;
                this.Latitude = lat;
                this.Longitude = long;
                this.crs = "4326";
            }
            return SearchLocation;
        })();
        var SearchConfig = (function () {
            function SearchConfig() {
            }
            return SearchConfig;
        })();
        var SearchAPIService = (function (_super) {
            __extends(SearchAPIService, _super);
            function SearchAPIService($http, $q, eventManager) {
                _super.call(this, $http, configuration.baseurls['SearchAPI']);
                this.$q = $q;
                this.eventManager = eventManager;
                this.eventManager.AddEvent(Services.onSelectedAreaOfInterestChanged);
                this.init();
                this.loadSearchAPI();
            }
            SearchAPIService.prototype.loadSearchAPI = function () {
                var _this = this;
                var myScript = document.createElement('script');
                myScript.src = 'http://txpub.usgs.gov/DSS/search_api/1.1/api/search_api.min.js';
                myScript.onload = function () {
                    _this.setSearchAPI();
                };
                document.body.appendChild(myScript);
            };
            SearchAPIService.prototype.setSearchAPI = function () {
                var _this = this;
                search_api.on("load", function () {
                    search_api.setOpts({
                        "textboxPosition": "user-defined",
                        "theme": "user-defined",
                        "DbSearchIncludeUsgsSiteSW": true,
                        "DbSearchIncludeUsgsSiteGW": true,
                        "DbSearchIncludeUsgsSiteSP": true,
                        "DbSearchIncludeUsgsSiteAT": true,
                        "DbSearchIncludeUsgsSiteOT": true
                    });
                    search_api.on("before-search", function () {
                    });
                    search_api.on("location-found", function (lastLocationFound) {
                        _this.eventManager.RaiseEvent(Services.onSelectedAreaOfInterestChanged, _this, new SearchAPIEventArgs(new SearchLocation(lastLocationFound.name, lastLocationFound.category, lastLocationFound.state, lastLocationFound.y, lastLocationFound.x)));
                    });
                    search_api.on("no-result", function () {
                        alert("No location matching the entered text could be found.");
                    });
                    search_api.on("timeout", function () {
                        alert("The search operation timed out.");
                    });
                });
            };
            SearchAPIService.prototype.getLocations = function (searchTerm) {
                var _this = this;
                this.config.term = searchTerm;
                var request = new WiM.Services.Helpers.RequestInfo("/search");
                request.params = {
                    term: this.config.term,
                    state: this.config.state,
                    includeGNIS: this.config.includeGNIS,
                    useCommonGnisClasses: this.config.useCommonGnisClasses,
                    includeUsgsSiteSW: this.config.includeUsgsSiteSW,
                    includeUsgsSiteGW: this.config.includeUsgsSiteGW,
                    includeUsgsSiteSP: this.config.includeUsgsSiteSP,
                    includeUsgsSiteAT: this.config.includeUsgsSiteAT,
                    includeUsgsSiteOT: this.config.includeUsgsSiteOT,
                    includeZIPcodes: this.config.includeZIPcodes,
                    includeAREAcodes: this.config.includeAREAcodes,
                    includeState: this.config.includeState,
                    topN: this.config.topN,
                    debug: this.config.debug
                };
                return this.Execute(request).then(function (response) {
                    return response.data.map(function (item) {
                        return new SearchLocation(item.nm, item.ct, item.st, item.y, item.x);
                    });
                }, function (error) {
                    return _this.$q.reject(error.data);
                });
            };
            SearchAPIService.prototype.init = function () {
                this.config = new SearchConfig();
                this.config.includeGNIS = true;
                this.config.useCommonGnisClasses = true;
                this.config.includeUsgsSiteSW = true;
                this.config.includeUsgsSiteGW = true;
                this.config.includeUsgsSiteSP = true;
                this.config.includeUsgsSiteAT = true;
                this.config.includeUsgsSiteOT = true;
                this.config.includeZIPcodes = true;
                this.config.includeAREAcodes = true;
                this.config.includeState = true;
                this.config.topN = 100;
                this.config.debug = false;
                this.config.term = '';
                this.config.state = '';
            };
            return SearchAPIService;
        })(Services.HTTPServiceBase);
        factory.$inject = ['$http', '$q', 'WiM.Event.EventManager'];
        function factory($http, $q, eventManager) {
            return new SearchAPIService($http, $q, eventManager);
        }
        angular.module('WiM.Services')
            .factory('WiM.Services.SearchAPIService', factory);
    })(Services = WiM.Services || (WiM.Services = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=SearchAPIService.js.map