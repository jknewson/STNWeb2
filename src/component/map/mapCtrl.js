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
                }

                $scope.markers = new Array();

                var onSiteComplete = function(response) {
                    var sitesArray = response.data.Sites;
                    //$scope.sites = response.data;

                    for (var i = 0; i < sitesArray.length; i++) {
                        var a = sitesArray[i];
                        $scope.markers.push({
                            lat: a.latitude,
                            lng: a.longitude,
                            icon: icons.stn
                        });



                        //var marker = L.marker(new L.LatLng(a['latitude'], a['longitude']), { title: title });
                        //var marker = L.circleMarker(new L.LatLng(a['latitude'], a['longitude']), {
                        //    color: '#3366FF',
                        //    radius: 3,
                        //    fillOpacity: 0.95
                        //});
                        //marker.bindPopup("Site ID: " + a.SITE_NO);
                        ////markers.addLayer(marker);
                        //map.addLayer(marker);
                    }



                };

                var onError = function(reason){
                    $scope.error = "Could not fetch sites"

                };

                $http.get('https://stn.wim.usgs.gov/STNServices/Sites.json')
                    .then(onSiteComplete, onError);


                //var getSTNSites = function(){
                //    return $http.get('https://stn.wim.usgs.gov/STNServices/Sites.json')
                //        .then(function(response){
                //            $scope.sites = response.data
                //        })
                //};

                //var onSites = function(data) {
                //    $scope.sites = data;
                //};



                //copies scope object/////////////////////////////
                angular.extend($scope, {
                    centerUS: {
                        lat: 41.278,
                        lng: -92.336,
                        zoom: 4
                    },
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
                        }
                        //markers: {
                        //    stnSites: {}
                        //}

                    }
                });//end angular.extend statement
                ///////////////////////////////////////////////////////////////////////////////////////
            } //end -if credentials pass- statement
            //getSTNSites().then(onSites,onError);

        }]);//end controller function
})();