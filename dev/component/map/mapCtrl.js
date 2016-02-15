(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('MapController', ['$scope', '$http', '$rootScope', '$cookies', '$location', 'SITE',
        function ($scope, $http, $rootScope, $cookies, $location, SITE) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                $rootScope.thisPage = "Map";
                $rootScope.activeMenu = "map"; 
                //$scope.map = "Welcome to the new STN Map Page!!";

                var icons = {
                    stn: {
                        type: 'div',
                        iconSize: [10, 10],
                        className: 'stnSiteIcon'
                    }
                };

                //$scope.markers = new Array();

                var onSiteComplete = function(response) {
                    console.log("onSiteComplete");
                    var sitesArray = response.data.Sites;
                    $scope.sites = response.data;

                    $scope.markers = new Array();

                    for (var i = 0; i < sitesArray.length; i++) {
                        var a = sitesArray[i];
                        $scope.markers.push({
                            lat: a.latitude,
                            lng: a.longitude,
                            icon: icons.stn
                        });
                    }

                    console.log("after push loop");
                };

                //var evName = $cookies.get('SessionEventName') !== null && $cookies.get('SessionEventName') !== undefined ? $cookies.get('SessionEventName') : "All Events"
                ///need to watch for session event id, do new call to server when that changes
                $scope.$watch(function () { return $cookies.get('SessionEventID'); }, function (newValue) {
                    //$scope.sessionEventName = newValue !== undefined ? newValue : "All Events";
                    //$scope.sessionEventExists = $scope.sessionEventName != "All Events" ? true : false;
                    if (newValue !== undefined) {
                        $scope.sessionEvent = $cookies.get('SessionEventName') !== null && $cookies.get('SessionEventName') !== undefined ? $cookies.get('SessionEventName') : "All Events";
                        var evID = newValue;
                        $scope.sitesPromise = $http.get('https://stn.wim.usgs.gov/STNServices/Events/' + evID + '/Sites.json')
                                                .then(onSiteComplete, onError);
                    } else {

                    }
                });

                var onError = function(reason){
                    $scope.error = "Could not fetch sites"
                };

                //get all STN sites
                //$http.get('https://stn.wim.usgs.gov/STNServices/Sites/points.json')
                //    .then(onSiteComplete, onError);
                //get STN sites for session event chosen by user
                //$http.get('https://stn.wim.usgs.gov/STNServices/Sites.json?Event=' + evID)
                //    .then(onSiteComplete, onError);
                ///retrieves event session ID
                //var evID = $cookies.get('SessionEventID') !== null && $cookies.get('SessionEventID') !== undefined ? $cookies.get('SessionEventID') : 0;
                //get STN sites for session event
                //$http.get('https://stn.wim.usgs.gov/STNServices/Events/' + evID + '/Sites.json')
                //    .then(onSiteComplete, onError);
                //copies scope object/////////////////////////////
                angular.extend($scope, {
                    centerUS: {
                        lat: 41.278,
                        lng: -92.336,
                        zoom: 4
                    },
                    markers: {},
                    layers: {
                        baselayers: {
                            gray: {
                                name: "Gray",
                                type: "agsBase",
                                layer: "Gray",
                                visible: false
                            },
                            streets: {
                                name: "Streets",
                                type: "agsBase",
                                layer: "Streets",
                                visible: false
                            },
                            topo: {
                                name: "World Topographic",
                                type: "agsBase",
                                layer: "Topographic",
                                visible: false
                            },
                            national: {
                                name: "National Geographic",
                                type: "agsBase",
                                layer: "NationalGeographic",
                                visible: false
                            },
                            oceans: {
                                name: "Oceans",
                                type: "agsBase",
                                layer: "Oceans",
                                visible: false
                            },
                            darkgray: {
                                name: "DarkGray",
                                type: "agsBase",
                                layer: "DarkGray",
                                visible: false
                            },
                            imagery: {
                                name: "Imagery",
                                type: "agsBase",
                                layer: "Imagery",
                                visible: false
                            },
                            shadedrelief: {
                                name: "ShadedRelief",
                                type: "agsBase",
                                layer: "ShadedRelief",
                                visible: false
                            },
                            terrain: {
                                name: "Terrain",
                                type: "agsBase",
                                layer: "Terrain",
                                visible: false
                            }
                        },
                        markers : {},
                        overlays : {
                            nwis : {
                                name: "USGS real-time streamgages",
                                type: "agsDynamic",
                                url : "https://stnmapservices.wim.usgs.gov:6443/arcgis/rest/services/STN/STN_nwis_rt/MapServer",
                                visible: false,
                                layerOptions : {
                                    layers: [0],
                                    opacity: 1
                                }
                            },
                            ahps : {
                                name: "AHPS Gages",
                                type: "agsDynamic",
                                url : "http://gis.srh.noaa.gov/arcgis/rest/services/ahps_gauges/MapServer",
                                visible: false,
                                layerOptions : {
                                    layers: [0],
                                    opacity: 1
                                }
                            },
                            radar : {
                                name: "Weather Radar",
                                type: "agsDynamic",
                                url : "http://gis.srh.noaa.gov/arcgis/rest/services/RIDGERadar/MapServer",
                                visible: false,
                                layerOptions : {
                                    layers: [0],
                                    opacity: 1
                                }
                            },
                            watchWarn : {
                                name: "NWS Watches & Warnings",
                                type: "agsDynamic",
                                url : "http://gis.srh.noaa.gov/ArcGIS/rest/services/watchWarn/MapServer",
                                visible: false,
                                layerOptions : {
                                    layers: [1],
                                    opacity: 1
                                }
                            },
                            floodThresholds : {
                                name: "NWS WFO Coastal Flood Thresholds",
                                type: "agsDynamic",
                                url : "https://www.csc.noaa.gov/arcgis/rest/services/dc_slr/Flood_Frequency/MapServer",
                                visible: false,
                                layerOptions : {
                                    layers: [1],
                                    opacity: 1
                                }
                            },
                            lmwa : {
                                name: "Limit Moderate Wave Action",
                                type: "agsDynamic",
                                url : "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer",
                                visible: false,
                                layerOptions : {
                                    layers: [19],
                                    opacity: 1
                                }
                            },
                            floodBounds : {
                                name: "Flood Hazard Boundaries",
                                type: "agsDynamic",
                                url : "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer",
                                visible: false,
                                layerOptions : {
                                    layers: [27],
                                    opacity: 1
                                }
                            },
                            floodZones : {
                                name: "Flood Hazard Zones",
                                type: "agsDynamic",
                                url : "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer",
                                visible: false,
                                layerOptions : {
                                    layers: [28],
                                    opacity: 1
                                }
                            }
                        }

                        //markers: {
                        //    stnSites: {}
                        //}

                    }
                });//end angular.extend statement
                ///////////////////////////////////////////////////////////////////////////////////////
            } //end -if credentials pass- statement
        }]);//end controller function
})();