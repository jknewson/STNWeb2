(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('MapController', ['$scope', '$http', '$rootScope', '$cookies', '$location', 'SITE', "leafletMarkerEvents",
        'allHorDatums', 'allHorCollMethods', 'allStates', 'allCounties', 'allDeployPriorities', 'allHousingTypes', 'allNetworkNames', 'allNetworkTypes', 'allDeployTypes', 'allSensDeps',
        function ($scope, $http, $rootScope, $cookies, $location, SITE, leafletMarkerEvents, allHorDatums, allHorCollMethods, allStates, allCounties, allDeployPriorities, allHousingTypes, allNetworkNames, allNetworkTypes, allDeployTypes, allSensDeps) {
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

                var onSiteComplete = function(response) {
                    var sitesArray = response.data.Sites;
                    $scope.sites = response.data;
                    $scope.markers = [];
                    for (var i = 0; i < sitesArray.length; i++) {
                        var a = sitesArray[i];
                        $scope.markers.push({
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

                $scope.$on("leafletDirectiveMap.click", function(event, args){
                    var leafEvent = args.leafletEvent;

                    $scope.markers.push({
                        lat: leafEvent.latlng.lat,
                        lng: leafEvent.latlng.lng,
                        SITE_ID: 'newSite',
                        icon: icons.stn,
                        message: "New draggable STN site",
                        draggable: true,  ///consider whether dragability is worth it
                        focus: true
                    });

                    //use new clicked site lat/lng and create new site from that
                });


                ///below applies to dragability - may remove
                $scope.$on("leafletDirectiveMarker.dragend", function(event, args){
                    var leafEvent = args.leafletEvent;
                    var newLocation = args.model;

                    ///take new lat/lng and create new site from that

                });

                ///below applies to dragability - may remove
                $scope.eventDetected = "No events yet...";
                var markerEvents = leafletMarkerEvents.getAvailableEvents();
                for (var k in markerEvents){
                    var eventName = 'leafletDirectiveMarker.' + markerEvents[k];
                    $scope.$on(eventName, function(event, args){
                        $scope.eventDetected = event.name;
                    });
                }


                //open modal to edit or create a site. unclear if this is needed to be duplicated here, or can be reused from elsewhere
                $scope.openSiteCreate = function () {
                    var dropdownParts =[allHorDatums, allHorCollMethods, allStates, allCounties, allHousingTypes, allDeployPriorities,
                        allNetworkNames, allNetworkTypes, allDeployTypes, allSensDeps];
                    //modal
                    var modalInstance = $uibModal.open({
                        templateUrl: 'SITEmodal.html',
                        controller: 'siteModalCtrl',
                        size: 'lg',
                        backdrop: 'static',
                        windowClass: 'rep-dialog',
                        resolve: {
                            allDropDownParts: function () {
                                return dropdownParts;
                            },
                            thisSiteStuff: function () {
                                if ($scope.aSite.SITE_ID !== undefined) {
                                    var origSiteHouses = $scope.originalSiteHousings !== undefined ? $scope.originalSiteHousings : []; //needed for multi select to set prop selected
                                    var sHouseTypeModel = $scope.thisSiteHouseTypeModel.length > 0 ? $scope.thisSiteHouseTypeModel : [];
                                    var sNetNames = thisSiteNetworkNames !== undefined ? thisSiteNetworkNames : [];
                                    var sNetTypes = thisSiteNetworkTypes !== undefined ? thisSiteNetworkTypes : [];
                                    var lo = $scope.landowner !== undefined ? $scope.landowner : {
                                    };
                                    var siteRelatedStuff = [$scope.aSite, origSiteHouses, sHouseTypeModel, sNetNames, sNetTypes, lo];
                                    return siteRelatedStuff;
                                }
                            }
                        }
                    });
                    modalInstance.result.then(function (r) {
                        $scope.aSite = r[0];
                        $scope.siteNetworkNames = r[1];
                        $scope.siteNetworkTypes = r[2];
                    });
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
                    }
                });//end angular.extend statement
                ///////////////////////////////////////////////////////////////////////////////////////
            } //end -if credentials pass- statement
        }]);//end controller function
})();