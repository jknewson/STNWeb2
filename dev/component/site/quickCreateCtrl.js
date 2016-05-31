(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('quickCreateCtrl', ['$scope', '$rootScope', '$cookies', '$location', '$state', '$http', '$uibModal', '$filter', '$sce', 'whichQuick', 'allHorDatums',
        'allHorCollMethods', 'allStates', 'allCounties', 'allOPTypes', 'allVertDatums', 'allVertColMethods', 'allOPQualities', 'allHWMTypes', 'allHWMQualities', 'allMarkers',
        'allEvents', 'allSensorTypes', 'allSensorBrands', 'allDeployTypes', 'allHousingTypes', 'SITE', 'OBJECTIVE_POINT', 'HWM', 'MEMBER', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'OP_MEASURE', 'OP_CONTROL_IDENTIFIER', 'GEOCODE',
        function ($scope, $rootScope, $cookies, $location, $state, $http, $uibModal, $filter, $sce, whichQuick, allHorDatums, allHorCollMethods, allStates, allCounties, allOPTypes,
            allVertDatums, allVertColMethods, allOPQualities, allHWMTypes, allHWMQualities, allMarkers, allEvents, allSensorTypes, allSensorBrands, allDeployTypes, allHousingTypes, 
            SITE, OBJECTIVE_POINT, HWM, MEMBER, INSTRUMENT, INSTRUMENT_STATUS, OP_MEASURE, OP_CONTROL_IDENTIFIER, GEOCODE) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                //global vars
                $scope.CreateWhat = whichQuick;
                $scope.htmlDescriptionTip = $sce.trustAsHtml('Required by NWIS. Can be listed as <em>\'unknown\'</em> or <em>\'Atlantic Ocean\'</em>');
                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                $http.defaults.headers.common.Accept = 'application/json';
                MEMBER.query({ id: $cookies.get('mID') }).$promise.then(function (response) {
                    $scope.loggedInMember = response;
                });
                $rootScope.thisPage = "Quick" + whichQuick;
                $scope.quickForm = {}; //forms within the accordion .Site, .OP, .HWM
                //called a few times to format just the date (no time)
                var makeAdate = function (d) {
                    var aDate = new Date();
                    if (d !== "" && d !== undefined) {
                        //provided date
                        aDate = new Date(d);
                    }

                    var year = aDate.getFullYear();
                    var month = aDate.getMonth();
                    var day = ('0' + aDate.getDate()).slice(-2);
                    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    var dateWOtime = new Date(monthNames[month] + " " + day + ", " + year);
                    return dateWOtime;
                };//end makeAdate()
                $scope.decDegORdms = {};
                $scope.EventName = $cookies.get('SessionEventName');
                $scope.aSite = { member_id: $cookies.get('mID') };
                $scope.aOP = {date_established: makeAdate("")};
                
                $scope.status = { siteOpen: true, opOpen: false, hwmOpen: false }; //accordion for parts
                $scope.removeOPCarray = []; //holder if they remove any OP controls
                $scope.addedIdentifiers = []; //holder for added Identifiers
                $scope.showControlIDinput = false; //initially hide the area containing added control Identifiers
                //dropdowns
                $scope.horDatumList = allHorDatums; $scope.horCollMethodList = allHorCollMethods;
                $scope.stateList = allStates; $scope.allCountyList = allCounties; $scope.stateCountyList = [];
                $scope.opTypeList = allOPTypes; $scope.vertDatumList = allVertDatums;
                $scope.vertCollMethodList = allVertColMethods; $scope.opQualList = allOPQualities;
                //hwm dropdowns
                if (whichQuick == 'HWM') {
                    $scope.aHWM = { hwm_environment: 'Riverine', event_id: $cookies.get('SessionEventID'), bank: 'N/A', flag_date: makeAdate(""), stillwater: 0, flag_member_id: $cookies.get('mID') };
                    $scope.hwmTypeList = allHWMTypes; $scope.hwmQualList = allHWMQualities; $scope.markerList = allMarkers;
                }
                //sensor dropdowns
                if (whichQuick == 'Sensor') {
                    var getTimeZoneStamp = function (dsent) {
                        var sendThis = [];
                        var d;

                        if (dsent !== undefined) d = new Date(dsent);
                        else d = new Date();

                        var offset = (d.toString()).substring(35);
                        var zone = "";
                        switch (offset.substr(0, 3)) {
                            case "Cen":
                                zone = 'CST';
                                break;
                            case "Eas":
                                zone = 'EST';
                                break;
                            case "Mou":
                                zone = 'MST';
                                break;
                            case "Pac":
                                zone = 'PST';
                                break;
                        }
                        sendThis = [d, zone];
                        return sendThis;
                    };
                    $scope.depTypeList = allDeployTypes; //get fresh version so not messed up with the Temperature twice
                    $scope.houseTypeList = allHousingTypes;
                    $scope.timeZoneList = ['UTC', 'PST', 'MST', 'CST', 'EST'];
                    $scope.aSensor = { event_id: $cookies.get('SessionEventID'),  };
                    $scope.aSensStatus = { status_type_id: 1, member_id: $cookies.get('mID') };
                    $scope.eventList = allEvents; $scope.sensorTypeList = allSensorTypes; $scope.sensorBrandList = allSensorBrands;
                    $scope.IntervalType = { type: 'Seconds' }; //default
                    //displaying date / time it user's timezone
                    var DeptimeParts = getTimeZoneStamp();
                    $scope.aSensStatus.time_stamp = DeptimeParts[0];
                    $scope.aSensStatus.time_zone = DeptimeParts[1]; //will be converted to utc on post/put
                    //$scope.Deployer = $scope.loggedInMember;

                    //get deployment types for sensor type chosen
                    $scope.getDepTypes = function () {
                        $scope.filteredDeploymentTypes = [];
                        var matchingSensDeplist = allSensorTypes.filter(function (sd) { return sd.sensor_type_id == $scope.aSensor.sensor_type_id; })[0];
                        //this is 1 sensorType with inner list of  .deploymenttypes
                        $scope.filteredDeploymentTypes = matchingSensDeplist.deploymenttypes;
                        if ($scope.filteredDeploymentTypes.length == 1)
                            $scope.aSensor.deployment_type_id = $scope.filteredDeploymentTypes[0].deployment_type_id;

                    };

                }
                //default radios
                $scope.FTorMETER = 'ft';
                $scope.FTorCM = 'ft';

                //want to add OP identifier
                $scope.addNewIdentifier = function () {
                    $scope.addedIdentifiers.push({ identifier: "", identifier_type: "" });
                    $scope.showControlIDinput = true;
                };//end addNewIdentifier for OP

                //is it UTC or local time..make sure it stays UTC
                var dealWithTimeStampb4Send = function () {
                    //check and see if they are not using UTC
                    if ($scope.aSensStatus.time_zone != "UTC") {
                        //convert it
                        var utcDateTime = new Date($scope.aSensStatus.time_stamp).toUTCString();
                        $scope.aSensStatus.time_stamp = utcDateTime;
                        $scope.aSensStatus.time_zone = 'UTC';
                    } else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        var i = $scope.aSensStatus.time_stamp.toString().indexOf('GMT') + 3;
                        $scope.aSensStatus.time_stamp = $scope.aSensStatus.time_stamp.toString().substring(0, i);
                    }
                };

                //#region Datepicker
                $scope.datepickrs = {};
                $scope.open = function ($event, which) {
                    $event.preventDefault();
                    $event.stopPropagation();

                    $scope.datepickrs[which] = true;
                };
                //#endregion

                //#region lat/long stuff
            
                $scope.decDegORdms.val = 'dd';
                $scope.DMS = {}; //holder of deg min sec values

                //convert deg min sec to dec degrees
                var azimuth = function (deg, min, sec) {
                    var azi = 0;
                    if (deg < 0) {
                        azi = -1.0 * deg + 1.0 * min / 60.0 + 1.0 * sec / 3600.0;
                        return (-1.0 * azi).toFixed(5);
                    }
                    else {
                        azi = 1.0 * deg + 1.0 * min / 60.0 + 1.0 * sec / 3600.0;
                        return (azi).toFixed(5);
                    }
                };

                //convert dec degrees to dms
                var deg_to_dms = function (deg) {
                    if (deg < 0) {
                        deg = deg.toString();

                        //longitude, remove the - sign
                        deg = deg.substring(1);
                    }
                    var d = Math.floor(deg);
                    var minfloat = (deg - d) * 60;
                    var m = Math.floor(minfloat);
                    var s = ((minfloat - m) * 60).toFixed(3);

                    return ("" + d + ":" + m + ":" + s);
                };

                //they changed radio button for dms dec deg
                $scope.latLongChange = function () {
                    if ($scope.decDegORdms.val == "dd") {
                        //they clicked Dec Deg..
                        if ($scope.DMS.LADeg !== undefined) {
                            //convert what's here for each lat and long
                            $scope.aSite.latitude_dd = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                            $scope.aSite.longitude_dd = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                            var test;
                        }
                    } else {
                        //they clicked dms (convert lat/long to dms)
                        if ($scope.aSite.latitude_dd !== undefined) {
                            var latDMS = (deg_to_dms($scope.aSite.latitude_dd)).toString();
                            var ladDMSarray = latDMS.split(':');
                            $scope.DMS.LADeg = ladDMSarray[0];
                            $scope.DMS.LAMin = ladDMSarray[1];
                            $scope.DMS.LASec = ladDMSarray[2];
                            
                            var longDMS = deg_to_dms($scope.aSite.longitude_dd);
                            var longDMSarray = longDMS.split(':');
                            $scope.DMS.LODeg = longDMSarray[0] * -1;
                            $scope.DMS.LOMin = longDMSarray[1];
                            $scope.DMS.LOSec = longDMSarray[2];
                        }
                    }
                };

                //lat modal 
                var openLatModal = function (w) {
                    var latModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>The Latitude must be between 0 and 73.0</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                    latModal.result.then(function (fieldFocus) {
                        if (w == 'latlong') $("#SITE_latitude_dd").focus();
                        else $("#LaDeg").focus();
                    });
                };

                //long modal
                var openLongModal = function (w) {
                    var longModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>The Longitude must be between -175.0 and -60.0</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                    longModal.result.then(function (fieldFocus) {
                        if (w == 'latlong') $("#SITE_longitude_dd").focus();
                        else $("#LoDeg").focus();
                    });
                };

                //make sure lat/long are right number range
                $scope.checkValue = function (d) {
                    if (d == 'dms') {
                        //check the degree value
                        if ($scope.DMS.LADeg < 0 || $scope.DMS.LADeg > 73) {
                            openLatModal('dms');
                        }
                        if ($scope.DMS.LODeg < -175 || $scope.DMS.LODeg > -60) {
                            openLongModal('dms');
                        }
                    } else {
                        //check the latitude/longitude
                        if ($scope.aSite.latitude_dd < 0 || $scope.aSite.latitude_dd > 73) {
                            openLatModal('latlong');
                        }
                        if ($scope.aSite.longitude_dd < -175 || $scope.aSite.longitude_dd > -60) {
                            openLongModal('latlong');
                        }
                    }
                };

                //  lat/long =is number
                $scope.isNum = function (evt) {
                    var theEvent = evt || window.event;
                    var key = theEvent.keyCode || theEvent.which;
                    if (key != 46 && key != 45 && key > 31 && (key < 48 || key > 57)) {
                        theEvent.returnValue = false;
                        if (theEvent.preventDefault) theEvent.preventDefault();
                    }
                };

                //get address parts and existing sites 
                $scope.getAddress = function () {
                    //clear them all first
                    delete $scope.aSite.address; delete $scope.aSite.city; delete $scope.aSite.state;
                    $scope.stateCountyList = []; delete $scope.aSite.zip;
                    if ($scope.DMS.LADeg !== undefined) $scope.aSite.latitude_dd = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                    if ($scope.DMS.LODeg !== undefined) $scope.aSite.longitude_dd = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                    if ($scope.aSite.latitude_dd !== undefined && $scope.aSite.longitude_dd !== undefined) {
                        $rootScope.stateIsLoading.showLoading = true; //loading...
                        var latlng = $scope.aSite.longitude_dd + ",+" + $scope.aSite.latitude_dd;
                        delete $http.defaults.headers.common.Authorization;
                        GEOCODE.getAddressParts({location: latlng}, function (results){
                            if (results.address !== undefined){
                                var components = results.address;
                                var thisState = undefined;
                                $scope.aSite.address = components.Address;
                                $scope.aSite.city = components.City;
                                $scope.aSite.zip = components.Postal;
                                if (components.CountryCode == "USA") {
                                    thisState = $scope.stateList.filter(function (s) { return s.state_name == components.Region; })[0];
                                } else {
                                    if (components.CountryCode == "PRI") {
                                        thisState = $scope.stateList.filter(function (s) { return s.state_name == "Puerto Rico"; })[0];
                                    }
                                }
                                if (thisState !== undefined) {
                                    $scope.aSite.state = thisState.state_abbrev;
                                    $scope.stateCountyList = $scope.allCountyList.filter(function (c) { return c.state_id == thisState.state_id; });
                                    $rootScope.stateIsLoading.showLoading = false;// loading..
                                   // $scope.$apply();
                                } else {
                                    $rootScope.stateIsLoading.showLoading = false;// loading..
                                    toastr.error("The Latitude/Longitude did not return a recognized state. Please choose one from the dropdown.");
                                }
                            } else {
                                $rootScope.stateIsLoading.showLoading = false;// loading..
                                toastr.error(results.error.details[0]);
                            }

                        });
                    } else {
                        //they did not type a lat/long first...
                        var emptyLatLongModal = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>Please provide a Latitude and Longitude before clicking Verify Location</p></div>' +
                                '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                $scope.ok = function () {
                                    $uibModalInstance.close();
                                };
                            }],
                            size: 'sm'
                        });
                    }
                };//end getAddress()

                //#endregion lat/long stuff
            
                // watch for the session event to change and update
                $scope.$watch(function () { return $cookies.get('SessionEventName'); }, function (newValue) {
                    $scope.sessionEventName = newValue !== undefined ? newValue : "All Events";
                    $scope.sessionEventExists = $scope.sessionEventName != "All Events" ? true : false;
                });

                //when SITE.state changes, update county list
                $scope.updateCountyList = function (s) {
                    var thisState = $scope.stateList.filter(function (st) { return st.state_abbrev == s; })[0];
                    $scope.stateCountyList = $scope.allCountyList.filter(function (c) { return c.state_id == thisState.state_id; });
                };//end updateCountyList() for Site

                //make uncertainty cleared and disabled when 'unquantified' is checked
                $scope.UnquantChecked = function () {
                    if ($scope.aOP.unquantified == 1)
                        $scope.aOP.uncertainty = null;
                };//end unquantChecked() for op

                //just need an OBJECTIVE_POINT object to post/put
                var trimOP = function (op) {
                    var OBJ_PT = {
                        objective_point_id: op.objective_point_id !== undefined ? op.objective_point_id : 0,
                        name: op.name,
                        description: op.description,
                        elev_ft: op.elev_ft !== undefined ? op.elev_ft : null,
                        date_established: op.date_established,
                        op_is_destroyed: op.op_is_destroyed !== undefined ? op.op_is_destroyed : 0,
                        op_notes: op.op_notes !== undefined ? op.op_notes : null,
                        site_id: op.site_id,
                        vdatum_id: op.vdatum_id !== undefined ? op.vdatum_id : 0,
                        latitude_dd: op.latitude_dd,
                        longitude_dd: op.longitude_dd,
                        hdatum_id: op.hdatum_id !== undefined ? op.hdatum_id : 0,
                        hcollect_method_id: op.hcollect_method_id !== undefined ? op.hcollect_method_id : 0,
                        vcollect_method_id: op.vcollect_method_id !== undefined ? op.vcollect_method_id : 0,
                        op_type_id: op.op_type_id,
                        date_recovered: op.date_recovered !== undefined ? op.date_recovered : null,
                        uncertainty: op.uncertainty !== undefined ? op.uncertainty : null,
                        unquantified: op.unquantified !== undefined ? op.unquantified : null,
                        op_quality_id: op.op_quality_id !== undefined ? op.op_quality_id : null,
                    };
                    return OBJ_PT;
                };

                //X was clicked next to existing Control Identifier to have it removed, store in remove array for Save()
                $scope.RemoveID = function (opControl) {
                    //only add to remove list if it's an existing one to DELETE
                    var i = $scope.addedIdentifiers.indexOf(opControl);
                    if (opControl.op_control_identifier_id !== undefined) {
                        $scope.removeOPCarray.push(opControl);
                        $scope.addedIdentifiers.splice(i, 1);
                    } else {
                        $scope.addedIdentifiers.splice(i, 1);
                    }
                };

                //fix default radios and lat/long
                var formatDefaults = function (theOP) {
                    //$scope.OP.FTorMETER needs to be 'ft'. if 'meter' ==convert value to ft 
                    if (theOP.FTorMETER == "meter") {
                        $scope.aOP.FTorMETER = 'ft';
                        $scope.aOP.elev_ft = $scope.aOP.elev_ft * 3.2808;
                    }
                    //$scope.OP.FTorCM needs to be 'ft'. if 'cm' ==convert value to ft 
                    if (theOP.FTorCM == "cm") {
                        $scope.aOP.FTorCM = 'ft';
                        $scope.aOP.uncertainty = $scope.aOP.uncertainty / 30.48;
                    }
                };
                $scope.tapedown = { Open: false };
                //sensor section, clicked Show/Hide Tape down information
                var showNeedOPfirstModal = function () {                    
                    var needOPModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">No Datum Location</h3></div>' +
                            '<div class="modal-body"><p>In order to add tape down information, please populate the Datum Location section above first.</p>' +
                            '<p>The following fields are required for the tape down section: <b>Name</b>, <b>Elevation</b> and <b>Vertical Datum</b>.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                    needOPModal.result.then(function () {
                        $scope.tapedown.Open = false;
                    });
                };
                $scope.tapeDownTable = []; //holder for the op if they choose it from the dropdown for tape down
                $scope.removeOP = function () {                    
                    //they unchecked the op to remove
                    var removeOPMeas = $uibModal.open({
                        backdrop: 'static',
                        keyboard: false,
                        template: '<div class="modal-header"><h3 class="modal-title">Remove OP Measure</h3></div>' +
                            '<div class="modal-body"><p>Are you sure you don\'t want to add this OP Measurement to this quick sensor?</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">Yes</button><button class="btn btn-primary" ng-click="cancel()">Cancel</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close('remove');
                            };
                            $scope.cancel = function () {
                                $uibModalInstance.close('cancel');
                            };
                        }],
                        size: 'sm'
                    });
                    removeOPMeas.result.then(function (yesOrNo) {
                        if (yesOrNo == 'remove') {
                            $scope.tapedown.Open = false;
                            //remove it
                            $scope.tapeDownTable.splice(0, 1);
                            $scope.OPsForTapeDown = [];
                            $scope.OPMeasure = {}; $scope.addTapedown = false;
                            $scope.aSensStatus.sensor_elevation = ''; $scope.aSensStatus.ws_elevation = ''; $scope.aSensStatus.gs_elevation = ''; $scope.aSensStatus.vdatum_id = '';
                        }
                    });
                };
                $scope.addTapedown = false; //toggle tapedown section                
                $scope.OPsForTapeDown = []; //will hold OP they add in op accordion.. get this when they click the button and show modal if they haven't populated it yet.
                $scope.showTapedownPart = function () {                    
                    if ($scope.tapeDownTable.length < 1) {
                        //they are opening to add tape down information
                        if ($scope.aOP.name !== undefined && $scope.aOP.elev_ft !== undefined && $scope.aOP.vdatum_id !== undefined) {
                            $scope.OPMeasure = {};
                            $scope.OPMeasure.op_name = $scope.aOP.name;
                            $scope.OPMeasure.elevation = $scope.aOP.elev_ft;
                            $scope.OPMeasure.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == $scope.aOP.vdatum_id; })[0].datum_abbreviation;
                            $scope.tapeDownTable.push($scope.OPMeasure);

                            $scope.OPsForTapeDown.push($scope.aOP);
                            $scope.addTapedown = true; $scope.tapedown.Open = true;
                            $scope.aSensStatus.vdatum_id = $scope.aOP.vdatum_id;
                        } else {
                            showNeedOPfirstModal(); 
                        }
                    } else {
                        $scope.addTapedown = true; $scope.tapedown.Open = true;
                    }
                    
                };
                $scope.siteErrors = false; $scope.opErrors = false; $scope.hwmErrors = false; 
                $scope.create = function () {
                    $rootScope.stateIsLoading.showLoading = true;// loading..
                    var theForm = $scope.quickForm.quick; $scope.siteErrors = false; $scope.opErrors = false; $scope.hwmErrors = false;
                    if (theForm.$valid) {
                        //site POST
                        $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                        $http.defaults.headers.common.Accept = 'application/json';
                        if ($scope.aSite.latitude_dd === undefined) $scope.aSite.latitude_dd = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                        if ($scope.aSite.longitude_dd === undefined) $scope.aSite.longitude_dd = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                        var createdSiteID = 0;                        
                        //POST site
                        SITE.save($scope.aSite, function success(response) {
                            createdSiteID = response.site_id;
                            $scope.aOP.site_id = createdSiteID; $scope.aOP.latitude_dd = response.latitude_dd; $scope.aOP.longitude_dd = response.longitude_dd;
                            $scope.aOP.hdatum_id = response.hdatum_id; $scope.aOP.hcollect_method_id = response.hcollect_method_id;
                            if ($scope.CreateWhat == 'HWM') {
                                $scope.aHWM.site_id = createdSiteID; $scope.aHWM.waterbody = response.waterbody; $scope.aHWM.latitude_dd = response.latitude_dd;
                                $scope.aHWM.longitude_dd = response.longitude_dd; $scope.aHWM.hcollect_method_id = response.hcollect_method_id;
                                $scope.aHWM.hdatum_id = response.hdatum_id; $scope.aHWM.flag_member_id = response.member_id; $scope.aHWM.event_id = $cookies.get('SessionEventID');
                            }
                            //OP stuff POST
                            var createdOP = {};
                            //post
                            formatDefaults($scope.aOP); //$scope.OP.FTorMETER, FTorCM, decDegORdms                               
                            var OPtoPOST = trimOP($scope.aOP); //make it an OBJECTIVE_POINT for saving

                            OBJECTIVE_POINT.save(OPtoPOST, function success(response) {
                                createdOP = response;
                                if ($scope.addedIdentifiers.length > 0) {
                                    //post each one THIS WILL CHANGE SOON TO HAVE objective_point_id already added and not sent along with it
                                    for (var opc = 0; opc < $scope.addedIdentifiers.length; opc++) {
                                        var thisOPControlID = $scope.addedIdentifiers[opc];
                                        thisOPControlID.objective_point_id = response.objective_point_id;
                                        OP_CONTROL_IDENTIFIER.save(thisOPControlID).$promise;
                                    }
                                }
                                //HWM stuff POST if HWM
                                if ($scope.CreateWhat == 'HWM') {
                                    var createdHWM = {};
                                    //if they entered a survey date or elevation, then set survey member as the flag member (flagging and surveying at same time
                                    if ($scope.aHWM.survey_date !== undefined)
                                        $scope.aHWM.survey_member_id = $scope.aHWM.flag_member_id;

                                    if ($scope.aHWM.elev_ft !== undefined) {
                                        //make sure they added the survey date if they added an elevation
                                        if ($scope.aHWM.survey_date === undefined)
                                            $scope.aHWM.survey_date = makeAdate("");

                                        $scope.aHWM.survey_member_id = $scope.aHWM.flag_member_id;
                                    }
                                    HWM.save($scope.aHWM).$promise.then(function (response) {
                                        toastr.success("Quick HWM created");
                                        $rootScope.stateIsLoading.showLoading = false;// loading..
                                        $location.path('/Site/' + createdSiteID + '/SiteDashboard').replace();//.notify(false);
                                        $scope.apply;
                                    });//end HWM.save()
                                }//end HWM creating
                                if ($scope.CreateWhat == 'Sensor') {
                                    var createdSensor = {}; var depSenStat = {};
                                    if ($scope.IntervalType.type == "Minutes")
                                        $scope.aSensor.interval = $scope.aSensor.interval * 60;

                                    $scope.aSensor.site_id = createdSiteID;
                                    dealWithTimeStampb4Send(); //UTC or local?
                                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                                    $http.defaults.headers.common.Accept = 'application/json';
                                    INSTRUMENT.save($scope.aSensor).$promise.then(function (response) {
                                        //create instrumentstatus too 
                                        createdSensor = response;
                                        $scope.aSensStatus.instrument_id = response.instrument_id;
                                        INSTRUMENT_STATUS.save($scope.aSensStatus).$promise.then(function (statResponse) {
                                            //added tape downs?
                                            if ($scope.tapeDownTable.length > 0) {
                                                var thisTape = $scope.tapeDownTable[0];
                                                thisTape.instrument_status_id = statResponse.instrument_status_id;
                                                thisTape.objective_point_id = createdOP.objective_point_id;
                                                ///POST IT///
                                                OP_MEASURE.save(thisTape).$promise;                                                
                                            }
                                            toastr.success("Quick Sensor created");
                                            $rootScope.stateIsLoading.showLoading = false;// loading..
                                            $location.path('/Site/' + createdSiteID + '/SiteDashboard').replace();//.notify(false);
                                            $scope.apply;
                                        });//end Instrument Status save
                                    });//end instrumentSave
                                }//end if sensor
                            });//end OP.save()
                        });//end SITE.save()

                    } else {
                        $rootScope.stateIsLoading.showLoading = false;// loading..
                        $scope.status.siteOpen = true;
                        $scope.status.opOpen = true;
                        $scope.status.hwmOpen = true;

                        angular.element("[name='" + theForm.$name + "']").find('.ng-invalid:visible:first').focus();

                        if (theForm.site_description.$invalid || theForm.latitude_dd.$invalid || theForm.longitude_dd.$invalid || theForm.hdatum_id.$invalid || theForm.hcollect_method_id.$invalid || theForm.waterbody.$invalid || theForm.state.$invalidv || theForm.county.$invalid) {
                            $scope.siteErrors = true;
                        }
                        if (theForm.op_type_id.$invalid || theForm.name.$invalid || theForm.description.$invalid || theForm.de.$invalid) {
                            $scope.opErrors = true;
                        }
                        if (theForm.hwm_type_id.$invalid || theForm.hwm_environment.$invalid || theForm.hwm_quality_id.$invalid || theForm.fd.$invalid) {
                            $scope.hwmErrors = true;
                        }
                        toastr.error("Quick HWM not created.");
                    }
                };
            }//end else (logged in)
        }]);
  
})();