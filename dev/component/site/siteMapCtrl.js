(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('siteMapCtrl', ['$scope', '$rootScope', '$cookies', '$location', '$state', 'SITE', 'leafletData', 'aSite',
        function ($scope, $rootScope, $cookies, $location, $state, SITE, leafletData, aSite) {
            if (aSite !== undefined) {
                $scope.mapStuff = "here's the map accordion content";
                $scope.thisSite = aSite;
                $scope.paths = {};
                $scope.markers = [];

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
                    icon: icons.selected
                });

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

                angular.extend($scope, {
                    mapCenter: {
                        lat: $scope.thisSite.latitude_dd,
                        lng: $scope.thisSite.longitude_dd,
                        zoom: 16,
                        minZoom: 16
                    },
                    markers: [],
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
                                visible: true
                            }
                        }
                    }
                });//end angular $scope.extend statement
            } else {
                //this is a create site action, there is no site here yet.
            }
        }]);//end controller
})();