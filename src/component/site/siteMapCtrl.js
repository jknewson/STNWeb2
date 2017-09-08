(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('siteMapCtrl', ['$scope', '$rootScope', '$cookies', '$location', '$state', 'SITE', 'siteHWMs', 'deploymentTypes',
        'baroSensors', 'metSensors', 'rdgSensors', 'stormSensors', 'waveSensors', 'presTempSensors', 'thermSensors', 'webcamSensors', 'raingageSensors', 'leafletData', 'aSite',
        function ($scope, $rootScope, $cookies, $location, $state, SITE, siteHWMs, deploymentTypes,
            baroSensors, metSensors, rdgSensors, stormSensors, waveSensors, presTempSensors, thermSensors, webcamSensors, raingageSensors, leafletData, aSite) {
            if (aSite !== undefined) {
                $scope.mapStuff = "here's the map accordion content";
                $scope.thisSite = aSite;
                $scope.allSiteHWMs = siteHWMs;
                $scope.allSiteBaroSensors = baroSensors.filter(function (bs) { return bs.site_id == aSite.site_id; });
                $scope.allSiteMetSensors = metSensors.filter(function (bs) { return bs.site_id == aSite.site_id; });
                $scope.allSiteRDGSensors = rdgSensors.filter(function (bs) { return bs.site_id == aSite.site_id; });
                $scope.allSiteStormSensors = stormSensors.filter(function (bs) { return bs.site_id == aSite.site_id; });
                $scope.allSiteWaveSensors = waveSensors.filter(function (bs) { return bs.site_id == aSite.site_id; });
                $scope.allSitePresTempSensors = presTempSensors.filter(function (bs) { return bs.site_id == aSite.site_id; });
                $scope.allSiteThermSensors = thermSensors.filter(function (bs) { return bs.site_id == aSite.site_id; });
                $scope.allSiteWebSensors = webcamSensors.filter(function (bs) { return bs.site_id == aSite.site_id; });
                $scope.allSiteRainSensors = raingageSensors.filter(function (bs) { return bs.site_id == aSite.site_id; });
                $scope.allDeploymentTypes = deploymentTypes;

                $scope.paths = {};
                $scope.markers = [];
                                
                ///need to watch for session event id, do new call to server when that changes
                $scope.$watch(function () { return $cookies.get('SessionEventID'); }, function (newValue) {
                    $scope.markers = [];
                    getProximitySites(); //get all those nearby
                    //push this site in
                    $scope.markers.push({
                        layer: 'stnSites',
                        message: '<div><b>This Site Name:</b> ' + $scope.thisSite.site_no + '</div>',
                        lat: $scope.thisSite.latitude_dd,
                        lng: $scope.thisSite.longitude_dd,
                        icon: icons.selected,
                        title: 'Site',
                        eventID: 0
                    });
                    //now filter hwms and sensors by event
                    if (newValue !== undefined) {
                        //empty markers and start again from siteHWMs to make sure each time we are filtering based on all                       
                        for (var h = 0; h < $scope.allSiteHWMs.length; h++) {
                            var eachHWM = $scope.allSiteHWMs[h];
                            if (eachHWM.event_id == newValue) {
                                //push hwms in that have this event_id
                                $scope.markers.push({
                                    layer: 'stnSites',
                                    message: '<div><b>HWM:</b> ' + eachHWM.hwm_label + '</div>',
                                    lat: eachHWM.latitude_dd,
                                    lng: eachHWM.longitude_dd,
                                    icon: icons.hwmIcon,
                                    title: 'HWM',
                                    eventID: eachHWM.event_id
                                });
                            }//end if event_id == newVal
                        }
                        //filter all sensor types
                        addSensors(newValue);                       
                    } else {
                        for (var noEventH = 0; noEventH < $scope.allSiteHWMs.length; noEventH++) {
                            var eachnoEHWM = $scope.allSiteHWMs[noEventH];
                            $scope.markers.push({
                                layer: 'stnSites',
                                message: '<div><b>HWM:</b> ' + eachnoEHWM.hwm_label + '</div>',
                                lat: eachnoEHWM.latitude_dd,
                                lng: eachnoEHWM.longitude_dd,
                                icon: icons.hwmIcon,
                                title: 'HWM',
                                eventID: eachnoEHWM.event_id
                            });
                        }
                        //filter all sensor types
                        addSensors(0);
                    }                    
                });

                //called from $watch on event change to update all the sensor types viewed from sitemap
                var addSensors = function (eventID) {
                    if (eventID > 0) {
                        //baro
                        for (var bs = 0; bs < $scope.allSiteBaroSensors.length; bs++) {
                            var bSensor = $scope.allSiteBaroSensors[bs];
                            if (bSensor.event_id == eventID) {
                                //push sensor in that have this event_id
                                $scope.markers.push({
                                    layer: 'stnSites',
                                    message: '<div><b>Barometric Pressure Sensor Status:</b> ' + bSensor.status + '</div>',
                                    lat: bSensor.latitude_dd,
                                    lng: bSensor.longitude_dd,
                                    icon: icons.baroIcon,
                                    title: 'Baro Sensor',
                                    eventID: bSensor.event_id
                                });
                            }//end if event_id == newVal
                        }
                        //met
                        for (var ms = 0; ms < $scope.allSiteMetSensors.length; ms++) {
                            var mSensor = $scope.allSiteMetSensors[ms];
                            if (mSensor.event_id == eventID) {
                                //push sensor in that have this event_id
                                $scope.markers.push({
                                    layer: 'stnSites',
                                    message: '<div><b>' + $scope.allDeploymentTypes.filter(function (d) { return d.deployment_type_id == mSensor.deployment_type_id; })[0].method + ' Sensor Status:</b> ' + mSensor.status + '</div>',
                                    lat: mSensor.latitude_dd,
                                    lng: mSensor.longitude_dd,
                                    icon: icons.metIcon,
                                    title: 'Met Sensor',
                                    eventID: mSensor.event_id
                                });
                            }
                        }
                        //rdg
                        for (var rs = 0; rs < $scope.allSiteRDGSensors.length; rs++) {
                            var rSensor = $scope.allSiteRDGSensors[rs];
                            if (rSensor.event_id == eventID) {
                                //push sensor in that have this event_id
                                $scope.markers.push({
                                    layer: 'stnSites',
                                    message: '<div><b>Rapid Deployment Sensor Status:</b> ' + rSensor.status + '</div>',
                                    lat: rSensor.latitude_dd,
                                    lng: rSensor.longitude_dd,
                                    icon: icons.rdgIcon,
                                    title: 'RDG Sensor',
                                    eventID: rSensor.event_id
                                });
                            }
                        }
                        //storm
                        for (var ss = 0; ss < $scope.allSiteStormSensors.length; ss++) {
                            var sSensor = $scope.allSiteStormSensors[ss];
                            if (sSensor.event_id == eventID) {
                                //push sensor in that have this event_id
                                $scope.markers.push({
                                    layer: 'stnSites',
                                    message: '<div><b>' + $scope.allDeploymentTypes.filter(function (d) { return d.deployment_type_id == sSensor.deployment_type_id; })[0].method + ' Sensor Status:</b> ' + sSensor.status + '</div>',
                                    lat: sSensor.latitude_dd,
                                    lng: sSensor.longitude_dd,
                                    icon: icons.stormIcon,
                                    title: 'Stormtide Sensor',
                                    eventID: sSensor.event_id
                                });
                            }
                        }
                        //wave
                        for (var ws = 0; ws < $scope.allSiteWaveSensors.length; ws++) {
                            var wSensor = $scope.allSiteWaveSensors[ws];
                            if (wSensor.event_id == eventID) {
                                //push sensor in that have this event_id
                                $scope.markers.push({
                                    layer: 'stnSites',
                                    message: '<div><b>Wave Height Sensor Status:</b> ' + wSensor.status + '</div>',
                                    lat: wSensor.latitude_dd,
                                    lng: wSensor.longitude_dd,
                                    icon: icons.waveIcon,
                                    title: 'Waveheight Sensor',
                                    eventID: wSensor.event_id
                                });
                            }
                        }
                        //pressureTemp
                        for (var ps = 0; ps < $scope.allSitePresTempSensors.length; ps++) {
                            var pSensor = $scope.allSitePresTempSensors[ps];
                            if (pSensor.event_id == eventID) {
                                //push sensor in that have this event_id
                                $scope.markers.push({
                                    layer: 'stnSites',
                                    message: '<div><b>' + $scope.allDeploymentTypes.filter(function (d) { return d.deployment_type_id == pSensor.deployment_type_id; })[0].method + ' Sensor Status:</b> ' + pSensor.status + '</div>',
                                    lat: pSensor.latitude_dd,
                                    lng: pSensor.longitude_dd,
                                    icon: icons.pressureIcon,
                                    title: 'PressureTemp Sensor',
                                    eventID: pSensor.event_id
                                });
                            }
                        }
                        //thermometer
                        for (var ts = 0; ts < $scope.allSiteThermSensors.length; ts++) {
                            var tSensor = $scope.allSiteThermSensors[ts];
                            if (tSensor.event_id == eventID) {
                                //push sensor in that have this event_id
                                $scope.markers.push({
                                    layer: 'stnSites',
                                    message: '<div><b>Temperature Sensor Status:</b> ' + tSensor.status + '</div>',
                                    lat: tSensor.latitude_dd,
                                    lng: tSensor.longitude_dd,
                                    icon: icons.thermIcon,
                                    title: 'Thermometer Sensor',
                                    eventID: tSensor.event_id
                                });
                            }
                        }
                        //webcam
                        for (var webs = 0; webs < $scope.allSiteWebSensors.length; webs++) {
                            var webSensor = $scope.allSiteWebSensors[webs];
                            if (webSensor.event_id == eventID) {
                                //push sensor in that have this event_id
                                $scope.markers.push({
                                    layer: 'stnSites',
                                    message: '<div><b>Webcam Sensor Status:</b> ' + webSensor.status + '</div>',
                                    lat: webSensor.latitude_dd,
                                    lng: webSensor.longitude_dd,
                                    icon: icons.webcamIcon,
                                    title: 'Webcam Sensor',
                                    eventID: webSensor.event_id
                                });
                            }
                        }
                        //raingage
                        for (var rains = 0; rains < $scope.allSiteRainSensors.length; rains++) {
                            var rainSensor = $scope.allSiteRainSensors[rains];
                            if (rainSensor.event_id == eventID) {
                                //push sensor in that have this event_id
                                $scope.markers.push({
                                    layer: 'stnSites',
                                    message: '<div><b>Rain gage Sensor Status:</b> ' + rainSensor.status + '</div>',
                                    lat: rainSensor.latitude_dd,
                                    lng: rainSensor.longitude_dd,
                                    icon: icons.raingageIcon,
                                    title: 'Raingage Sensor',
                                    eventID: rainSensor.event_id
                                });
                            }
                        }
                    } else {
                        //baro
                        for (var noEbs = 0; noEbs < $scope.allSiteBaroSensors.length; noEbs++) {
                            var noEbSensor = $scope.allSiteBaroSensors[noEbs];
                            //push sensor in that have this event_id
                            $scope.markers.push({
                                layer: 'stnSites',
                                message: '<div><b>Barometric Pressure Sensor Status:</b> ' + noEbSensor.status + '</div>',
                                lat: noEbSensor.latitude_dd,
                                lng: noEbSensor.longitude_dd,
                                icon: icons.baroIcon,
                                title: 'Baro Sensor',
                                eventID: noEbSensor.event_id
                            });                            
                        }
                        //met
                        for (var noEms = 0; noEms < $scope.allSiteMetSensors.length; noEms++) {
                            var noEmSensor = $scope.allSiteMetSensors[noEms];
                            //push sensor in that have this event_id
                            $scope.markers.push({
                                layer: 'stnSites',
                                message: '<div><b>' + $scope.allDeploymentTypes.filter(function (d) { return d.deployment_type_id == noEmSensor.deployment_type_id; })[0].method + ' Sensor Status:</b> ' + noEmSensor.status + '</div>',
                                lat: noEmSensor.latitude_dd,
                                lng: noEmSensor.longitude_dd,
                                icon: icons.metIcon,
                                title: 'Met Sensor',
                                eventID: noEmSensor.event_id
                            });                            
                        }
                        //rdg
                        for (var noErs = 0; noErs < $scope.allSiteRDGSensors.length; noErs++) {
                            var noErSensor = $scope.allSiteRDGSensors[noErs];
                            //push sensor in that have this event_id
                            $scope.markers.push({
                                layer: 'stnSites',
                                message: '<div><b>Rapid Deployment Sensor Status:</b> ' + noErSensor.status + '</div>',
                                lat: noErSensor.latitude_dd,
                                lng: noErSensor.longitude_dd,
                                icon: icons.rdgIcon,
                                title: 'RDG Sensor',
                                eventID: noErSensor.event_id
                            });                            
                        }
                        //storm
                        for (var noEss = 0; noEss < $scope.allSiteStormSensors.length; noEss++) {
                            var noEsSensor = $scope.allSiteStormSensors[noEss];
                            //push sensor in that have this event_id
                            $scope.markers.push({
                                layer: 'stnSites',
                                message: '<div><b>' + $scope.allDeploymentTypes.filter(function (d) { return d.deployment_type_id == noEsSensor.deployment_type_id; })[0].method + ' Sensor Status:</b> ' + noEsSensor.status + '</div>',
                                lat: noEsSensor.latitude_dd,
                                lng: noEsSensor.longitude_dd,
                                icon: icons.stormIcon,
                                title: 'Stormtide Sensor',
                                eventID: noEsSensor.event_id
                            });
                            
                        }
                        //wave
                        for (var noEws = 0; noEws < $scope.allSiteWaveSensors.length; noEws++) {
                            var noEwSensor = $scope.allSiteWaveSensors[noEws];
                            //push sensor in that have this event_id
                            $scope.markers.push({
                                layer: 'stnSites',
                                message: '<div><b>Wave Height Sensor Status:</b> ' + noEwSensor.status + '</div>',
                                lat: noEwSensor.latitude_dd,
                                lng: noEwSensor.longitude_dd,
                                icon: icons.waveIcon,
                                title: 'Waveheight Sensor',
                                eventID: noEwSensor.event_id
                            });                            
                        }
                        //pressureTemp
                        for (var noEps = 0; noEps < $scope.allSitePresTempSensors.length; noEps++) {
                            var noEpSensor = $scope.allSitePresTempSensors[noEps];
                            //push sensor in that have this event_id
                            $scope.markers.push({
                                layer: 'stnSites',
                                message: '<div><b>' + $scope.allDeploymentTypes.filter(function (d) { return d.deployment_type_id == noEpSensor.deployment_type_id; })[0].method + ' Sensor Status:</b> ' + noEpSensor.status + '</div>',
                                lat: noEpSensor.latitude_dd,
                                lng: noEpSensor.longitude_dd,
                                icon: icons.pressureIcon,
                                title: 'PressureTemp Sensor',
                                eventID: noEpSensor.event_id
                            });                            
                        }
                        //thermometer
                        for (var noEts = 0; noEts < $scope.allSiteThermSensors.length; noEts++) {
                            var noEtSensor = $scope.allSiteThermSensors[noEts];
                            //push sensor in that have this event_id
                            $scope.markers.push({
                                layer: 'stnSites',
                                message: '<div><b>Temperature Sensor Status:</b> ' + noEtSensor.status + '</div>',
                                lat: noEtSensor.latitude_dd,
                                lng: noEtSensor.longitude_dd,
                                icon: icons.thermIcon,
                                title: 'Thermometer Sensor',
                                eventID: noEtSensor.event_id
                            });                            
                        }
                        //webcam
                        for (var noEwebs = 0; noEwebs < $scope.allSiteWebSensors.length; noEwebs++) {
                            var noEwebSensor = $scope.allSiteWebSensors[noEwebs];
                            //push sensor in that have this event_id
                            $scope.markers.push({
                                layer: 'stnSites',
                                message: '<div><b>Webcam Sensor Status:</b> ' + noEwebSensor.status + '</div>',
                                lat: noEwebSensor.latitude_dd,
                                lng: noEwebSensor.longitude_dd,
                                icon: icons.webcamIcon,
                                title: 'Webcam Sensor',
                                eventID: noEwebSensor.event_id
                            });                            
                        }
                        //raingage
                        for (var noErains = 0; noErains < $scope.allSiteRainSensors.length; noErains++) {
                            var noErainSensor = $scope.allSiteRainSensors[noErains];
                            //push sensor in that have this event_id
                            $scope.markers.push({
                                layer: 'stnSites',
                                message: '<div><b>>Webcam Sensor Status:</b> ' + noErainSensor.status + '</div>',
                                lat: noErainSensor.latitude_dd,
                                lng: noErainSensor.longitude_dd,
                                icon: icons.raingageIcon,
                                title: 'Raingage Sensor',
                                eventID: noErainSensor.event_id
                            });                            
                        }
                    }
                    
                };//end addSensors when event changes

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
                    },
                    baroIcon: {
                        type: 'div',
                        iconSize: [16, 20],
                        className: 'stnBaroSensorIcon'
                    },
                    metIcon: {
                        type: 'div',
                        iconSize: [20, 20],
                        className: 'stnMetSensorIcon'
                    },
                    rdgIcon: {
                        type: 'div',
                        iconSize: [22, 20],
                        className: 'stnRDGSensorIcon'
                    },
                    stormIcon: {
                        type: 'div',
                        iconSize: [20, 20],
                        className: 'stnStormSensorIcon'
                    },
                    waveIcon: {
                        type: 'div',
                        iconSize: [20, 20],
                        className: 'stnWaveSensorIcon'
                    },
                    pressureIcon: {
                        type: 'div',
                        iconSize: [20, 20],
                        className: 'stnPressureSensorIcon'
                    },
                    thermIcon: {
                        type: 'div',
                        iconSize: [16, 22],
                        className: 'stnThermSensorIcon'
                    },
                    webcamIcon: {
                        type: 'div',
                        iconSize: [20, 20],
                        className: 'stnWebcamSensorIcon'
                    },
                    raingageIcon: {
                        type: 'div',
                        iconSize: [20, 20],
                        className: 'stnRaingageSensorIcon'
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
                    $scope.paths.circleMarker = $scope.pathsObj.circleMarker;
                };
                addShape();

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
                                type: 'markercluster',
                                name: 'STN Sites',
                                visible: true
                            }
                        }
                    }
                });//end angular $scope.extend statement

                var getProximitySites = function () {
                    SITE.getProximitySites({ Latitude: $scope.thisSite.latitude_dd, Longitude: $scope.thisSite.longitude_dd, Buffer: 0.05 },
                        function success(response) {
                            $scope.closeSites = response;
                            if ($scope.closeSites.length > 0) {
                                for (var i = 0; i < $scope.closeSites.length; i++) {
                                    var a = $scope.closeSites[i];
                                    if (a.site_id !== $scope.thisSite.site_id) {
                                        $scope.markers.push({
                                            layer: 'stnSites',
                                            message: '<div><b>Nearby Site Name:</b> ' + a.site_no + '</div>',
                                            lat: a.latitude_dd,
                                            lng: a.longitude_dd,
                                            icon: icons.stn
                                        });
                                    }
                                }
                            }
                        }, function error(errorResponse) {
                            toastr.error("Error: " + errorResponse.statusText);
                        });
                };

               // getProximitySites();
            }//end if aSite !== undefined
        }]);//end controller

})();