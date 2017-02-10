(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('siteMapCtrl', ['$scope', '$rootScope', '$cookies', '$location', '$state', 'SITE', 'siteHWMs', 'leafletData', 'aSite',
        function ($scope, $rootScope, $cookies, $location, $state, SITE, siteHWMs, leafletData, aSite) {
            if (aSite !== undefined) {
                $scope.mapStuff = "here's the map accordion content";
                $scope.thisSite = aSite;
                $scope.allSiteHWMs = siteHWMs;
                $scope.paths = {};
                $scope.markers = [];
               // $scope.siteDashMap;
                if (aSite != undefined){
                    //need the hwms and sensors for this site and then further filtered by event (if one) and updated when event changes
                        
                }
                //leafletData.getMap("siteDashMap").then(function (map) {
                //    $scope.siteDashMap = map;
                //});

                var icons = {
                    stn: {
                        type: 'div',
                        iconSize: [10, 10],
                        className: 'stnSiteIcon'
                    },
                    selected: {
                        type: 'div',
                        iconSize: [12, 12],
                        className: 'selectedIcon'
                    },
                    hwmIcon: {
                        type: 'div',
                        iconSize: [16, 20],
                        className: 'stnHWMIcon'
                    }
                };
                $scope.pathsObj = {
                    circleMarker: {
                        type: "circleMarker",
                        radius: 20,
                        weight: 3,
                        color: '#000099',
                        latlngs: {}
                    }
                };
                var addShape = function () {
                    $scope.paths = {};
                    $scope.pathsObj.circleMarker.latlngs = { lat: $scope.thisSite.latitude_dd, lng: $scope.thisSite.longitude_dd };
                    $scope.paths['circleMarker'] = $scope.pathsObj['circleMarker'];
                };
                addShape();

                $scope.markers.push({
                    lat: $scope.thisSite.latitude_dd,
                    lng: $scope.thisSite.longitude_dd,
                    icon: icons.selected,
                    title: 'Site'
                });
                for (var h = 0; h < $scope.allSiteHWMs.length; h++) {
                    var eachHWM = $scope.allSiteHWMs[h];
                    $scope.markers.push({
                        layer: 'siteHWMs',
                        lat: eachHWM.latitude_dd,
                        lng: eachHWM.longitude_dd,
                        icon: icons.hwmIcon,
                        title: 'HWM-' + eachHWM.label
                    });
                }               

                angular.extend($scope, {
                    mapCenter: {
                        lat: $scope.thisSite.latitude_dd,
                        lng: $scope.thisSite.longitude_dd,
                        zoom: 16,
                        minZoom: 16
                    },
                    markers: $scope.markers,
                    markersLatLngArray: [],                    
                    layers: {
                        baselayers: {
                            topo: {
                                name: "World Topographic",
                                type: "agsBase",
                                layer: "Topographic",
                                visible: false
                            }
                        },
                        overlays: {
                            stnSites: {
                                type: 'group',
                                name: 'STN Sites',
                                visible: false
                            },
                            siteHWMs: {
                                type: 'group',
                                name: 'HWMs',
                                visible: true
                            }
                        }
                    }
                });//end angular $scope.extend statement

                SITE.getProximitySites({ Latitude: $scope.thisSite.latitude_dd, Longitude: $scope.thisSite.longitude_dd, Buffer: 0.05 },
                    function success(response) {
                        $scope.closeSites = response;
                        if ($scope.closeSites.length > 0) {
                            for (var i = 0; i < $scope.closeSites.length; i++) {
                                var a = $scope.closeSites[i];
                                $scope.markers.push({
                                    lat: a.latitude_dd,
                                    lng: a.longitude_dd,
                                    icon: icons.stn
                                });
                            }
                        }

                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                });
            }
        }]);//end controller
})();