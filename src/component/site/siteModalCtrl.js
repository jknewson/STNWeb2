(function () {
    'use strict';

    var ModalControllers = angular.module('ModalControllers');

    ModalControllers.controller('siteModalCtrl', ['$scope', '$rootScope', '$cookies', '$q', '$location', '$state', '$http', '$timeout', '$uibModal', '$uibModalInstance', '$filter', 'allDropDownParts', 'latlong', 'thisSiteStuff', 
        'SITE', 'SITE_HOUSING', 'MEMBER', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'LANDOWNER_CONTACT', 
        function ($scope, $rootScope, $cookies, $q, $location, $state, $http, $timeout, $uibModal, $uibModalInstance, $filter, allDropDownParts, latlong, thisSiteStuff, SITE, SITE_HOUSING, 
            MEMBER, INSTRUMENT, INSTRUMENT_STATUS, LANDOWNER_CONTACT) {
            //dropdowns
            $scope.HorizontalDatumList = allDropDownParts[0];
            $scope.HorCollMethodList = allDropDownParts[1];
            $scope.StateList = allDropDownParts[2];
            $scope.AllCountyList = allDropDownParts[3];
            $scope.stateCountyList = [];
            $scope.allHousingTypeList = allDropDownParts[4];
            $scope.DepPriorityList = allDropDownParts[5];
            $scope.NetNameList = allDropDownParts[6];
            $scope.NetTypeList = allDropDownParts[7];
            $scope.ProposedSens = allDropDownParts[8];
            $scope.SensorDeployment = allDropDownParts[9];
            $scope.userRole = $cookies.get('usersRole');
            
            //globals 
            $scope.houseDirty = false; $scope.netNameDirty = false; $scope.netTypeDirty = false;
            $scope.siteHouseTypesTable = [];
            $scope.aSite = {};
            if (latlong !== undefined) {
                $scope.aSite.LATITUDE_DD = latlong[0];
                $scope.aSite.LONGITUDE_DD = latlong[1];
            }
            $scope.aSite.decDegORdms = 'dd';
            $scope.DMS = {}; //holder of deg min sec values
            $scope.originalSiteHousings = [];
            $scope.checked = ""; $scope.checkedName = "Not Defined"; //comparers for disabling network names if 'Not Defined' checked
            $scope.landowner = {};
            $scope.addLandowner = false; //hide landowner fields
            $scope.disableSensorParts = false; //toggle to disable/enable sensor housing installed and add proposed sensor
            $scope.showSiteHouseTable = false;
            $scope.siteHouseTypesTable = []; //holder for when adding housing type to page from multiselect
            $scope.siteHousesModel = {};
            $scope.siteHousesToRemove = []; //holder for editing site to add removing house types to for PUT
            $scope.siteNetworkNames = []; //holds the NetworkName (list of strings) to pass back;
            $scope.siteNetworkTypes = []; //holds the NetworkType (list of strings) to pass back;
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
                    if (w == 'latlong') $("#LATITUDE_DD").focus();
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
                    if (w == 'latlong') $("#LONGITUDE_DD").focus();
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
                    if ($scope.aSite.LATITUDE_DD < 0 || $scope.aSite.LATITUDE_DD > 73) {
                        openLatModal('latlong');
                    }
                    if ($scope.aSite.LONGITUDE_DD < -175 || $scope.aSite.LONGITUDE_DD > -60) {
                        openLongModal('latlong');
                    }
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
                if ($scope.aSite.decDegORdms == "dd") {
                    //they clicked Dec Deg..
                    if ($scope.DMS.LADeg !== undefined) {
                        //convert what's here for each lat and long
                        $scope.aSite.LATITUDE_DD = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                        $scope.aSite.LONGITUDE_DD = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                        var test;
                    }
                } else {
                    //they clicked dms (convert lat/long to dms)
                    if ($scope.aSite.LATITUDE_DD !== undefined) {
                        var latDMS = (deg_to_dms($scope.aSite.LATITUDE_DD)).toString();
                        var ladDMSarray = latDMS.split(':');
                        $scope.DMS.LADeg = ladDMSarray[0];
                        $scope.DMS.LAMin = ladDMSarray[1];
                        $scope.DMS.LASec = ladDMSarray[2];

                        var longDMS = deg_to_dms($scope.aSite.LONGITUDE_DD);
                        var longDMSarray = longDMS.split(':');
                        $scope.DMS.LODeg = longDMSarray[0] * -1;
                        $scope.DMS.LOMin = longDMSarray[1];
                        $scope.DMS.LOSec = longDMSarray[2];
                    }
                }
            };

            //networkType check event --trigger dirty
            $scope.netTypeChg = function () {
                $scope.netTypeDirty = true;
            };

            //networkName check event.. if "Not Defined" chosen, disable the other 2 checkboxes
            $scope.whichOne = function (n) {
                $scope.netNameDirty = true;
                if (n.NAME == "Not Defined" && n.selected === true) {
                    //they checked "not defined"
                    for (var nn = 0; nn < $scope.NetNameList.length; nn++) {
                        //unselect all but not defined
                        if ($scope.NetNameList[nn].NAME != "Not Defined")
                            $scope.NetNameList[nn].selected = false;
                    }
                    //make these match so rest get disabled
                    $scope.checked = "Not Defined";
                }
                //they they unchecked not define, unmatch vars so the other become enabled
                if (n.NAME == "Not Defined" && n.selected === false)
                    $scope.checked = "";
            };

            //toggle dim on div for sensor not appropriate click
            $scope.dimAction = function () {
                if ($scope.aSite.SENSOR_NOT_APPROPRIATE == 1) {
                    $scope.disableSensorParts = true;
                    //clear radio and checkboxes if disabling
                    for (var x = 0; x < $scope.ProposedSens.length; x++) {
                        $scope.ProposedSens[x].selected = false;
                    }
                    $scope.aSite.IS_PERMANENT_HOUSING_INSTALLED = "No";
                } else {
                    $scope.disableSensorParts = false;
                }
            };

            //site PUT
            $scope.save = function (valid) {
                if (valid) {
                    $rootScope.stateIsLoading.showLoading = true; // loading..
                    //update the site
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //did they add or edit the landowner
                    //TODO :: check if the landowner fields are $dirty first..
                
                    if ($scope.addLandowner === true) {
                        //there's a landowner.. edit or add?
                        if ($scope.aSite.LANDOWNERCONTACT_ID !== null && $scope.aSite.LANDOWNERCONTACT_ID !== undefined) {
                            //did they change anything to warrent a put
                            LANDOWNER_CONTACT.update({ id: $scope.aSite.LANDOWNERCONTACT_ID }, $scope.landowner).$promise.then(function () {
                                putSiteAndParts();
                            });
                        } else if ($scope.landowner.FNAME !== undefined || $scope.landowner.LNAME !== undefined || $scope.landowner.TITLE !== undefined ||
                                $scope.landowner.ADDRESS !== undefined || $scope.landowner.CITY !== undefined || $scope.landowner.PRIMARYPHONE !== undefined) {
                            //they added something.. POST (rather than just clicking button and not)
                            LANDOWNER_CONTACT.save($scope.landowner, function success(response) {
                                $scope.aSite.LANDOWNERCONTACT_ID = response.LANDOWNERCONTACTID;
                                putSiteAndParts();
                            }, function error(errorResponse) { toastr.error("Error adding Landowner: " + errorResponse.statusText); });
                        } else putSiteAndParts();
                    } else putSiteAndParts();
                }
            };//end save
            var putSiteAndParts = function () {
                SITE.update({ id: $scope.aSite.SITE_ID }, $scope.aSite, function success(response) {      
                    //update site housings
                    var defer = $q.defer();
                    var RemovePromises = [];
                    var AddPromises = [];
                    //Remove siteHousings (these are just SITE_HOUSING_ID 's
                    angular.forEach($scope.siteHousesToRemove, function (shID) {
                        var delSHProm = SITE_HOUSING.delete({ id: shID }).$promise;
                        RemovePromises.push(delSHProm);
                    });

                    //Remove NetNames
                    if ($scope.netNameDirty === true) {
                        angular.forEach($scope.NetNameList, function (nnL) {
                            if (nnL.selected === false) {
                                //delete it
                                $http.defaults.headers.common['X-HTTP-Method-Override'] = 'DELETE';
                                var NNtoDelete = { NETWORK_NAME_ID: nnL.NETWORK_NAME_ID, NAME: nnL.NAME };
                                var delNNProm = SITE.deleteSiteNetworkName({ id: $scope.aSite.SITE_ID }, NNtoDelete).$promise;
                                RemovePromises.push(delNNProm);
                                delete $http.defaults.headers.common['X-HTTP-Method-Override'];
                            }
                        });
                    }//end netName dirty

                    //Remove NetTypes
                    if ($scope.netTypeDirty === true) {
                        angular.forEach($scope.NetTypeList, function (ntL) {
                            if (ntL.selected === false) {
                                //delete it if they are removing it
                                $http.defaults.headers.common['X-HTTP-Method-Override'] = 'DELETE';
                                var NTtoDelete = { NETWORK_TYPE_ID: ntL.NETWORK_TYPE_ID, NETWORK_TYPE_NAME: ntL.NETWORK_TYPE_NAME };
                                var delNTProm = SITE.deleteSiteNetworkType({ id: $scope.aSite.SITE_ID }, NTtoDelete).$promise;
                                RemovePromises.push(delNTProm);
                                delete $http.defaults.headers.common['X-HTTP-Method-Override'];
                            }                        
                        });
                    }//end netType dirty

                    //Add siteHousings
                    if ($scope.houseDirty === true) {
                        angular.forEach($scope.siteHouseTypesTable, function (ht) {
                            var addHtProm;
                            if (ht.SITE_HOUSING_ID !== undefined) {
                                //PUT it
                                addHtProm = SITE_HOUSING.update({ id: ht.SITE_HOUSING_ID }, ht).$promise;
                            } else {
                                //POST it
                                addHtProm = SITE.postSiteHousing({ id: $scope.aSite.SITE_ID }, ht).$promise;
                            }
                            AddPromises.push(addHtProm);
                        });
                    }//end they touched it

                    //Add NetNames
                    angular.forEach($scope.NetNameList, function (AnnL) {
                        if (AnnL.selected === true) {
                            $scope.siteNetworkNames.push(AnnL.NAME);
                            //post it (if it's there already, it won't do anything)
                            var NNtoAdd = { NETWORK_NAME_ID: AnnL.NETWORK_NAME_ID, NAME: AnnL.NAME };
                            var addNNProm = SITE.postSiteNetworkName({ id: $scope.aSite.SITE_ID }, NNtoAdd).$promise;
                            AddPromises.push(addNNProm);
                        }
                    });
                    //Add NetTypes
                    angular.forEach($scope.NetTypeList, function (AnTL) {
                        if (AnTL.selected === true) {
                            $scope.siteNetworkTypes.push(AnTL.NETWORK_TYPE_NAME);
                          //  post it (if it's there already, it won't do anything)
                            var NTtoAdd = { NETWORK_TYPE_ID: AnTL.NETWORK_TYPE_ID, NETWORK_TYPE_NAME: AnTL.NETWORK_TYPE_NAME };
                            var addNTProm = SITE.postSiteNetworkType({ id: $scope.aSite.SITE_ID }, NTtoAdd).$promise;
                            AddPromises.push(addNTProm);
                        }
                    });

                    //ok now run the removes, then the adds and then pass the stuff back out of here.
                    $q.all(RemovePromises).then(function () {
                        $q.all(AddPromises).then(function () {
                            var sendBack = [$scope.aSite, $scope.siteNetworkNames, $scope.siteNetworkTypes];
                            $uibModalInstance.close(sendBack);
                            $rootScope.stateIsLoading.showLoading = false; // loading..
                            toastr.success("Site updated");
                            $location.path('/Site/' + $scope.aSite.SITE_ID + '/SiteDashboard').replace();//.notify(false);
                            $scope.apply;
                        }).catch(function error(msg) {
                            console.error(msg);
                        });
                    }).catch(function error(msg) {
                        console.error(msg);
                    }); //all added
                }, function error(errorResponse) {
                    $rootScope.stateIsLoading.showLoading = false; // loading..
                    toastr.error("Error updating Site: " + errorResponse.statusText);
                });//end SITE.save(...
            }; // end PUTsite()

            //create this site clicked
            $scope.create = function (valid) {
                if (valid === true) {
                    $rootScope.stateIsLoading.showLoading = true; // loading..
                    //POST landowner, if they added one
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    delete $scope.aSite.Creator; delete $scope.aSite.decDegORdms;
                    if ($scope.addLandowner === true) {
                        if ($scope.landowner.FNAME !== undefined || $scope.landowner.LNAME !== undefined || $scope.landowner.TITLE !== undefined ||
                                       $scope.landowner.ADDRESS !== undefined || $scope.landowner.CITY !== undefined || $scope.landowner.PRIMARYPHONE !== undefined) {
                            LANDOWNER_CONTACT.save($scope.landowner, function success(response) {
                                $scope.aSite.LANDOWNERCONTACT_ID = response.LANDOWNERCONTACTID;
                                //now post the site
                                postSiteAndParts();
                            }, function error(errorResponse) {
                                $rootScope.stateIsLoading.showLoading = false; // loading.. 
                                toastr.error("Error posting landowner: " + errorResponse.statusText);
                            });
                        } else {
                            postSiteAndParts();
                        }
                    } else {
                        postSiteAndParts();
                    }
                }
            };
            var postSiteAndParts = function () {
                //make sure longitude is < 0, otherwise * (-1),
                var createdSiteID = 0;            
                //POST site
                SITE.save($scope.aSite, function success(response) {
                    createdSiteID = response.SITE_ID;
                    var defer = $q.defer();
                    var postPromises = [];
                    //site_housingTypes (if any)
                    angular.forEach($scope.siteHouseTypesTable, function (htype) {
                        htype.SITE_ID = createdSiteID;
                        delete htype.TYPE_NAME;
                        var hTPromise = SITE.postSiteHousing({ id: createdSiteID }, htype).$promise;
                        postPromises.push(hTPromise);
                    });
                    //site_NetworkNames
                    angular.forEach($scope.NetNameList, function (nName) {
                        if (nName.selected === true) {
                            var siteNetName = { NETWORK_NAME_ID: nName.NETWORK_NAME_ID, NAME: nName.NAME };
                            var nNPromise = SITE.postSiteNetworkName({ id: createdSiteID }, siteNetName).$promise;
                            postPromises.push(nNPromise);
                        }
                    });
                    //site_NetworkTypes
                    angular.forEach($scope.NetTypeList, function (nType) {
                        if (nType.selected === true) {
                            var siteNetType = { NETWORK_TYPE_ID: nType.NETWORK_TYPE_ID, NETWORK_TYPE_NAME: nType.NETWORK_TYPE_NAME };
                            var nTPromise = SITE.postSiteNetworkType({ id: createdSiteID }, siteNetType).$promise;
                            postPromises.push(nTPromise);
                        }
                    });
                    if ($scope.disableSensorParts === false) {
                        for (var ps = 0; ps < $scope.ProposedSens.length; ps++) {
                            if ($scope.ProposedSens[ps].selected === true) {
                                //POST it
                                var sensorTypeID = $scope.SensorDeployment.filter(function (sd) { return sd.DEPLOYMENT_TYPE_ID == $scope.ProposedSens[ps].DEPLOYMENT_TYPE_ID; })[0].SENSOR_TYPE_ID;
                                var inst = { DEPLOYMENT_TYPE_ID: $scope.ProposedSens[ps].DEPLOYMENT_TYPE_ID, SITE_ID: createdSiteID, SENSOR_TYPE_ID: sensorTypeID };
                                var instrPromise = INSTRUMENT.save(inst).$promise.then(function (insResponse) {
                                    var instStat = { INSTRUMENT_ID: insResponse.INSTRUMENT_ID, STATUS_TYPE_ID: 4, MEMBER_ID: $scope.aSite.MEMBER_ID, TIME_STAMP: new Date(), TIME_ZONE: 'UTC' };
                                    INSTRUMENT_STATUS.save(instStat).$promise;
                                }).$promise;
                                postPromises.push(instrPromise);
                            }
                        }
                    }

                    $q.all(postPromises).then(function (response) {
                        $uibModalInstance.dismiss('cancel');
                        $rootScope.stateIsLoading.showLoading = false; // loading..
                        $timeout(function () {
                            // anything you want can go here and will safely be run on the next digest.                   
                            $state.go('site.dashboard', { id: createdSiteID });                       
                        });
                       
                    });
                }, function error(errorResponse) {
                    toastr.error("Error creating Site: " + errorResponse.statusText);
                });
            };
        
            if (thisSiteStuff !== undefined) {
                //#region existing site 
                //$scope.aSite[0], $scope.originalSiteHousings[1], $scope.siteHouseTypesTable[2], thisSiteNetworkNames[3], siteNetworkTypes[4], $scope.landowner[5]
                $scope.aSite = angular.copy(thisSiteStuff[0]);
                //for some reason there are tons of sites with HCOLLECT_METHOD_ID set to 0 when it's required..make it null so validation picks up on required field
                if ($scope.aSite.HCOLLECT_METHOD_ID >= 0) $scope.aSite.HCOLLECT_METHOD_ID = null;
                //if this site is not appropriate for sensor, dim next 2 fields
                if ($scope.aSite.SENSOR_NOT_APPROPRIATE > 0) {
                    $scope.disableSensorParts = true;
                    //clear radio and checkboxes if disabling
                    for (var x = 0; x < $scope.ProposedSens.length; x++) {
                        $scope.ProposedSens[x].selected = false;
                    }
                    $scope.aSite.IS_PERMANENT_HOUSING_INSTALLED = "No";
                }

                //update countiesList with this state's counties
                var thisState = $scope.StateList.filter(function (s) { return s.STATE_ABBREV == $scope.aSite.STATE; })[0];
                $scope.stateCountyList = $scope.AllCountyList.filter(function (c) { return c.STATE_ID == thisState.STATE_ID; });

                //apply any site housings for EDIT
                if (thisSiteStuff[1].length > 0) {
                    $scope.originalSiteHousings = thisSiteStuff[1]; //for multiselect .selected = true/false
                    $scope.showSiteHouseTable = true;
                    $scope.siteHouseTypesTable = thisSiteStuff[2]; //for table to show all info on house type
                    $scope.landowner = thisSiteStuff[5];
                    $scope.addLandowner = $scope.landowner.FNAME !== undefined || $scope.landowner.LNAME !== undefined || $scope.landowner.ADDRESS !== undefined || $scope.landowner.PRIMARYPHONE !== undefined ? true : false;

                    //go through allHousingTypeList and add selected Property.
                    for (var i = 0; i < $scope.allHousingTypeList.length; i++) {
                        //for each one, if thisSiteHousings has this id, add 'selected:true' else add 'selected:false'
                        for (var y = 0; y < $scope.originalSiteHousings.length; y++) {
                            if ($scope.originalSiteHousings[y].HOUSING_TYPE_ID == $scope.allHousingTypeList[i].HOUSING_TYPE_ID) {
                                $scope.allHousingTypeList[i].selected = true;
                                y = $scope.originalSiteHousings.length; //ensures it doesn't set it as false after setting it as true
                            }
                            else {
                                $scope.allHousingTypeList[i].selected = false;
                            }
                        }
                        if ($scope.originalSiteHousings.length === 0)
                            $scope.allHousingTypeList[i].selected = false;
                    }

                }//end if thisSiteHousings != undefined

                //apply any site network names or types
                if (thisSiteStuff[3].length > 0) {
                    //for each $scope.NetNameList .. add .selected property = true/false if thissitenetworknames ==
                    for (var a = 0; a < $scope.NetNameList.length; a++) {
                        for (var e = 0; e < thisSiteStuff[3].length; e++) {
                            if (thisSiteStuff[3][e].NETWORK_NAME_ID == $scope.NetNameList[a].NETWORK_NAME_ID) {
                                $scope.NetNameList[a].selected = true;
                                e = thisSiteStuff[3].length;
                            } else {
                                $scope.NetNameList[a].selected = false;
                            }
                            if (thisSiteStuff[3].length === 0)
                                $scope.NetNameList[a].selected = false;
                        }
                    }
                    if ($scope.NetNameList[0].selected === true) {
                        //make these match so rest get disabled
                        $scope.checked = "Not Defined";
                    }
                }//end if thisSiteNetworkNames != undefined

                if (thisSiteStuff[4].length > 0) {
                    //for each $scope.NetTypeList .. add .selected property = true/false if thissitenetworktypes ==
                    for (var ni = 0; ni < $scope.NetTypeList.length; ni++) {
                        for (var ny = 0; ny < thisSiteStuff[4].length; ny++) {
                            if (thisSiteStuff[4][ny].NETWORK_TYPE_ID == $scope.NetTypeList[ni].NETWORK_TYPE_ID) {
                                $scope.NetTypeList[ni].selected = true;
                                ny = thisSiteStuff[4].length;
                            } else {
                                $scope.NetTypeList[ni].selected = false;
                            }
                            if (thisSiteStuff[4].length === 0)
                                $scope.NetTypeList[ni].selected = false;
                        }
                    }
                }//end if thisSiteNetworkNames != undefined            
                //#endregion existing site 
            }
            else {
                //#region this is a NEW SITE CREATE (site == undefined)
                //get logged in member to make them creator
                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                $http.defaults.headers.common.Accept = 'application/json';
                MEMBER.query({ id: $cookies.get('mID') }, function success(response) {
                    $scope.aSite.Creator = response.FNAME + " " + response.LNAME;
                    $scope.aSite.MEMBER_ID = response.MEMBER_ID;
                    $scope.aSite.IS_PERMANENT_HOUSING_INSTALLED = "No";
                    $scope.aSite.ACCESS_GRANTED = "Not Needed";
                    //TODO: get member's id in there too
                }, function error(errorResponse) {
                    toastr.error("Error getting Member info: " + errorResponse.statusText);
                });
                //#endregion this is a NEW SITE CREATE (site == undefined)
            }//end new site

            //  lat/long =is number
            $scope.isNum = function (evt) {
                var theEvent = evt || window.event;
                var key = theEvent.keyCode || theEvent.which;
                if (key != 46 && key != 45 && key > 31 && (key < 48 || key > 57)) {
                    theEvent.returnValue = false;
                    if (theEvent.preventDefault) theEvent.preventDefault();
                }
            };

            //multiselect one checked..
            $scope.HouseTypeClick = function (ht) {
                $scope.houseDirty = true; //they clicked it..used when post/put
                //add/remove house type and inputs to table row -- foreach on post or put will handle the rest
           
                //new site being created
                if (ht.selected === true) {
                    var houseT = { TYPE_NAME: ht.TYPE_NAME, HOUSING_TYPE_ID: ht.HOUSING_TYPE_ID, LENGTH: ht.LENGTH, MATERIAL: ht.MATERIAL, NOTES: ht.NOTES, AMOUNT: 1 };
                    $scope.siteHouseTypesTable.push(houseT);
                    $scope.showSiteHouseTable = true;
                }
                if (ht.selected === false) {
                    if ($scope.aSite.SITE_ID !== undefined) {
                        var sH_ID = $scope.siteHouseTypesTable.filter(function (h) { return h.TYPE_NAME == ht.TYPE_NAME; })[0].SITE_HOUSING_ID;
                        $scope.siteHousesToRemove.push(sH_ID); //edit page, add SITE_HOUSING_ID to remove list for PUT
                    }
                    var i = $scope.siteHouseTypesTable.indexOf($scope.siteHouseTypesTable.filter(function (h) { return h.TYPE_NAME == ht.TYPE_NAME; })[0]);
                    $scope.siteHouseTypesTable.splice(i, 1);
                    if ($scope.siteHouseTypesTable.length === 0) {
                        $scope.showSiteHouseTable = false;
                    }
                }
            
            };

            //get address parts and existing sites 
            $scope.getAddress = function () {
                var geocoder = new google.maps.Geocoder(); //reverse address lookup
                var latlng = new google.maps.LatLng($scope.aSite.LATITUDE_DD, $scope.aSite.LONGITUDE_DD);
                geocoder.geocode({ 'latLng': latlng }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        //parse the results out into components ('street_number', 'route', 'locality', 'administrative_area_level_2', 'administrative_area_level_1', 'postal_code'
                        var address_components = results[0].address_components;
                        var components = {};
                        $.each(address_components, function (k, v1) {
                            $.each(v1.types, function (k2, v2) {
                                components[v2] = v1.long_name;
                            });
                        });

                        $scope.aSite.ADDRESS = components.street_number !== undefined ? components.street_number + " " + components.route : components.route;
                        $scope.aSite.CITY = components.locality;

                        var thisState = $scope.StateList.filter(function (s) { return s.STATE_NAME == components.administrative_area_level_1; })[0];
                        if (thisState !== undefined) {
                            $scope.aSite.STATE = thisState.STATE_ABBREV;
                            $scope.stateCountyList = $scope.AllCountyList.filter(function (c) { return c.STATE_ID == thisState.STATE_ID; });
                            $scope.aSite.COUNTY = components.administrative_area_level_2;
                            $scope.aSite.ZIP = components.postal_code;
                            //see if there are any sites within a 0.0005 buffer of here for them to use instead
                            SITE.query({ Latitude: $scope.aSite.LATITUDE_DD, Longitude: $scope.aSite.LONGITUDE_DD, Buffer: 0.0005 }, function success(response) {
                                var closeSites = response.Sites;

                                //modal for showing # of sites near                  
                                var modalInstance = $uibModal.open({
                                    template: '<div class="modal-header"><h3 class="modal-title">Sites nearby</h3></div>' +
                                               '<div class="modal-body"><p>There are: {{num}} sites nearby.</p>' +
                                               '<p ng-if="num > 0"><span>To use one of these sites instead, click on the site name.</span>' +
                                               '<ul><li ng-repeat="s in siteListNear" style="list-style:none"><a ui-sref="site.dashboard({id: s.SITE_ID})" ng-click="$close()">{{s.SITE_NO}}</a></li></ul></p></div>' +
                                               '<div class="modal-footer"><button class="btn btn-primary" ng-click="ok()">OK</button></div>',
                                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                        $scope.ok = function () {
                                            $uibModalInstance.close();
                                        };
                                        $scope.num = closeSites.length;
                                        $scope.siteListNear = closeSites;
                                    }],
                                    size: 'sm'
                                });
                                modalInstance.result.then(function () {
                                    $rootScope.stateIsLoading.showLoading = false; // loading..
                                });
                                // alert("Number of nearby Sites: " + closeSites.length);
                            }, function error(errorResponse) {
                                toastr.error("Error: " + errorResponse.statusText);
                            }).$promise;
                        } else {
                            toastr.error("The Latitude/Longitude did not return a location within the U.S.");
                        }
                    } else {
                        toastr.error("There was an error getting address. Please try again.");
                    }
                });
            };

            // want to add a landowner contact
            $scope.showLandOwnerPart = function () {
                $scope.addLandowner = true;
            };

            //when state changes, update county list
            $scope.updateCountyList = function (s) {
                var thisState = $scope.StateList.filter(function (st) { return st.STATE_ABBREV == s; })[0];
                $scope.stateCountyList = allCounties.filter(function (c) { return c.STATE_ID == thisState.STATE_ID; });
            };

            //cancel modal
            $scope.cancel = function () {
                $rootScope.stateIsLoading.showLoading = false; // loading..
                $uibModalInstance.dismiss('cancel');
            };

            //delete this Site
            $scope.deleteSite = function () {
                var thisSite = $scope.aSite;
                var dSiteModal = $uibModal.open({
                    template: '<div class="modal-header"><h3 class="modal-title">Delete Site</h3></div>' +
                        '<div class="modal-body"><p>Are you sure you want to delete site {{siteNo}}? Doing so will remove all OPs, HWMs, Sensors and Files associated with it.</p></div>' +
                        '<div class="modal-footer"><button class="btn btn-danger" ng-click="deleteIt()">Delete</button><button class="btn btn-primary" ng-click="ok()">Cancel</button></div>',
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.siteNo = thisSite.SITE_NO;
                        $scope.ok = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                        $scope.deleteIt = function () {
                            //delete the site and all things 
                            $uibModalInstance.close(thisSite);
                        };
                    }],
                    size: 'sm'
                });
                dSiteModal.result.then(function (s) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    SITE.delete({ id: s.SITE_ID }).$promise.then(function () {
                        toastr.success("Site Removed");
                        var sendBack = "Deleted";
                        $uibModalInstance.close(sendBack);
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    });
                }, function () {
                    //logic for cancel
                });//end modal
            };

        }]);
})();