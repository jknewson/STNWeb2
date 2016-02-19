(function () {
    'use strict';
    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('MapController', ['$scope', '$http', '$rootScope', '$cookies', '$location', 'SITE', "leafletMarkerEvents", '$state',
        function ($scope, $http, $rootScope, $cookies, $location, SITE, leafletMarkerEvents, $state) {
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
                    },
                    new: {
                        type: 'div',
                        iconSize: [10, 10],
                        className: 'newSiteIcon',
                        iconAnchor:  [5, 5]
                    }
                };
                //creates the markers on the map after getting JSON from STN web services call
                var onSiteComplete = function(response) {
                    var sitesArray = response.data.Sites;
                    $scope.sites = response.data;
                    $scope.markers = [];
                    for (var i = 0; i < sitesArray.length; i++) {
                        var a = sitesArray[i];
                        $scope.markers.push({
                            layer:'stnSites',
                            lat: a.latitude,
                            lng: a.longitude,
                            SITE_ID: a.SITE_ID,
                            icon: icons.stn
                        });
                    }
                };
                ///need to watch for session event id, do new call to server when that changes
                $scope.$watch(function () { return $cookies.get('SessionEventID'); }, function (newValue) {
                    if (newValue !== undefined) {
                        $scope.sessionEvent = $cookies.get('SessionEventName') !== null && $cookies.get('SessionEventName') !== undefined ? $cookies.get('SessionEventName') : "All Events";
                        var evID = newValue;
                        $scope.sitesPromise = $http.get('https://stn.wim.usgs.gov/STNServices/Events/' + evID + '/Sites.json')
                                                .then(onSiteComplete, onError);
                    } else {

                    }
                });
                var onError = function(reason){
                    $scope.error = "Could not fetch sites";
                };

                ///get site from click
                $scope.$on("leafletDirectiveMap.click", function(event, args){
                    if ($scope.createSiteModeActive == true) {
                        //first, remove previously click-created site
                        removeUserCreatedSite();
                        var leafEvent = args.leafletEvent;
                        $scope.userCreatedSite = {
                            latitude: leafEvent.latlng.lat,
                            longitude: leafEvent.latlng.lng
                        };
                        //returns the created site object, but not that useful
                        //var createdSite = $scope.markers.filter(function (obj) {
                        //        return obj.SITE_ID === 'newSite';
                        //})[0];

                        $scope.markers.push({
                            layer: 'newSite',
                            lat: $scope.userCreatedSite.latitude,
                            lng: $scope.userCreatedSite.longitude,
                            SITE_ID: 'newSite',
                            icon: icons.new,
                            message: "New draggable STN site",
                            draggable: true,
                            focus: false
                        });
                    }
                    //use new clicked site lat/lng and create new site from that
                });

                var removeUserCreatedSite = function () {
                    //returns created site index so it can be removed to make way for its replacement
                    var createdSiteIndex = $scope.markers.map(function(obj) {
                        return obj.SITE_ID;
                    }).indexOf('newSite');
                    //splice created site from the markers array if it exists
                    if (createdSiteIndex > -1) {
                        $scope.markers.splice(createdSiteIndex, 1);
                        $scope.userCreatedSite = {};
                    }
                };

                ///update newSite lat/lng after dragend
                $scope.$on("leafletDirectiveMarker.dragend", function(event, args){
                    var dragendLocation = args.model;
                    $scope.userCreatedSite = {
                        latitude: dragendLocation.lat,
                        longitude: dragendLocation.lng
                    };
                });
                ///listens (watches) for change of the createSiteModeActive attribute - cued by click of the Create Site button
                $scope.$watch('createSiteModeActive', function(){
                    $scope.createSiteButtonText = $scope.createSiteModeActive ? 'Cancel Create New Site' : 'Create New Site on Map';
                    $scope.mapStyle = $scope.createSiteModeActive ? {"cursor":"crosshair"} : {"cursor":"grab"};
                    if (!$scope.createSiteModeActive) {removeUserCreatedSite();}
                });

                $scope.createSiteFromMap = function () {
                    $state.go('site.dashboard', { id: 0, latitude: $scope.userCreatedSite.latitude, longitude: $scope.userCreatedSite.longitude });
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
                    events: {
                        markers: {
                            enable: leafletMarkerEvents.getAvailableEvents() //remove this if dragability abandoned
                        }
                    },
                    centerUS: {
                        lat: 41.278,
                        lng: -92.336,
                        zoom: 4
                    },
                    markers: [],
                    createSiteModeActive: false,
                    userCreatedSite: {},
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
                        overlays : {
                            stnSites: {
                                type: 'group',
                                name:'STN Sites',
                                visible: true
                            },
                            newSite : {
                                type: 'group',
                                name: 'newSite',
                                visible:true,
                                layerParams: {
                                    showOnSelector: false
                                }
                            },
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
                    }
                });//end angular.extend statement
                ///////////////////////////////////////////////////////////////////////////////////////
            } //end -if credentials pass- statement
        }]);//end controller function
})();