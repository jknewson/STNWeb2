(function () {
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('sensorCtrl', ['$scope', '$rootScope', '$q', '$cookies', '$location', '$state', '$http', '$uibModal', '$filter', '$timeout', 'thisSite', 'Instrument_Service', 'thisSiteSensors',
        'allSensorBrands', 'allAgencies', 'allVertDatums', 'allDeployTypes', 'allSensorTypes', 'allHousingTypes', 'allEvents', 'allFileTypes', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'SITE', 'MEMBER', 'DEPLOYMENT_TYPE', 'STATUS_TYPE',
        'INST_COLL_CONDITION', 'DATA_FILE',
        function ($scope, $rootScope, $q, $cookies, $location, $state, $http, $uibModal, $filter, $timeout, thisSite, Instrument_Service, thisSiteSensors, allSensorBrands, allAgencies, allVertDatums, allDeployTypes,
            allSensorTypes, allHousingTypes, allEvents, allFileTypes, INSTRUMENT, INSTRUMENT_STATUS, SITE, MEMBER, DEPLOYMENT_TYPE, STATUS_TYPE, INST_COLL_CONDITION, DATA_FILE) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                //global vars
                $scope.sensorCount = { total: thisSiteSensors.length }; 
                $scope.deployTypeList = angular.copy(allDeployTypes);
                var tempDepTypeID = 0;
                //fix deployment types so that "Temperature" becomes 2 : Temperature (Met sensor)-SensorType:2 and Temperature (pressure transducer)-SensorType:1 -- just for proposed
                for (var d = 0; d < $scope.deployTypeList.length; d++) {
                    if ($scope.deployTypeList[d].method === "Temperature") {
                        tempDepTypeID = $scope.deployTypeList[d].deployment_type_id;
                        $scope.deployTypeList[d].method = "Temperature (Met sensor)";
                    }
                }
                $scope.deployTypeList.push({ deployment_type_id: tempDepTypeID, method: "Temperature (Pressure Transducer)" });

                $scope.sensDepTypes = allSensorTypes;// allSensDeps;
                $scope.showProposed = false; //they want to add a proposed sensor, open options
                //need to make sure the instrument_statuses are in the correct order ([0]Retrieved, [1]Deployed, [2]Proposed                
                for (var s = 0; s < thisSiteSensors.length; s++) {
                    var correctOrderSS = [];
                    var sensorStatuses = thisSiteSensors[s].instrument_status;                    
                    if (sensorStatuses.length > 1) {
                        //only care about order if there's more than 1
                        var proposedStat = sensorStatuses.filter(function (ps) { return ps.status == "Proposed"; })[0];
                        var deployedStat = sensorStatuses.filter(function (ps) { return ps.status == "Deployed"; })[0];
                        var retLostStat = sensorStatuses.filter(function (ps) { return ps.status == "Retrieved" || ps.status == "Lost"; })[0];
                        //now add them back in correctly
                        if (retLostStat) correctOrderSS.push(retLostStat);
                        if (deployedStat) correctOrderSS.push(deployedStat);
                        if (proposedStat) correctOrderSS.push(proposedStat);                        
                    } else {
                        correctOrderSS.push(sensorStatuses[0]);
                    }
                    //now put it back in the object
                    thisSiteSensors[s].instrument_status = [];
                    thisSiteSensors[s].instrument_status = correctOrderSS;
                }
                
                $scope.SiteSensors = thisSiteSensors;
                Instrument_Service.setAllSiteSensors($scope.SiteSensors);
                //to pass to the sensor modals for sensor files
                var SensFileTypes = allFileTypes.filter(function (sft) {
                    //Photo (1), Data (2), Historic (3), Field Sheets (4), Level Notes (5), Other (7), Link (8), Sketch (10)
                    return sft.filetype === 'Photo' || sft.filetype === 'Data' || sft.filetype === 'Historic Citation' || sft.filetype === 'Field Sheets' || sft.filetype === 'Level Notes' ||
                       sft.filetype === 'Other' || sft.filetype === 'Link' || sft.filetype === 'Sketch' || sft.filetype === 'Hydrograph';
                });
                //show/hide proposed sensors to add
                $scope.showHideProposed = function () {
                    $scope.showProposed = !$scope.showProposed;
                };
           
                //add these checked Proposed sensors to this site
                $scope.AddProposed = function () {                    
                    var Time_STAMP = new Date();
                    for (var dt = 0; dt < $scope.deployTypeList.length; dt++) {
                        if ($scope.deployTypeList[dt].selected === true) {
                            var proposedToAdd = {}; var propStatToAdd = {};
                            if ($scope.deployTypeList[dt].method.substring(0, 4) == "Temp") {
                                //temperature proposed sensor
                                proposedToAdd = {
                                    event_id: 0,
                                    location_description: "Proposed sensor at this site. Change description when deploying sensor.",
                                    deployment_type_id: $scope.deployTypeList[dt].deployment_type_id,
                                    site_id: thisSite.site_id,
                                    sensor_type_id: $scope.deployTypeList[dt].method == "Temperature (Pressure Transducer)" ? 1 : 2,
                                };
                            } else {
                                //go through the new fullInstrument and see if any of the sensor's deploymenttypes are this deployment type to set the sensor_type_id
                                var sID = 0;
                                angular.forEach($scope.sensDepTypes, function (sdt) {
                                    for (var x = 0; x < sdt.deploymenttypes.length; x++) {
                                        if (sdt.deploymenttypes[x].deployment_type_id == $scope.deployTypeList[dt].deployment_type_id)
                                            sID = sdt.sensor_type_id;
                                    }
                                });
                                //any other type
                                proposedToAdd = {
                                    event_id: 0,
                                    location_description: "Proposed sensor at this site. Change description when deploying sensor.",
                                    deployment_type_id: $scope.deployTypeList[dt].deployment_type_id,
                                    site_id: thisSite.site_id,
                                    sensor_type_id: sID,
                                };
                            }
                            //now post it (Instrument first, then Instrument Status
                            $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                            $http.defaults.headers.common.Accept = 'application/json';
                            var instrumentID = 0;
                            INSTRUMENT.save(proposedToAdd).$promise.then(function (response) {
                                instrumentID = response.instrument_id;
                                var createdPropSensor = {
                                    deployment_type_id: response.deployment_type_id,
                                    site_id: response.site_id,
                                    event_id: response.event_id,
                                    location_description: response.location_description,
                                    sensor_type_id: response.sensor_type_id,
                                    instrument_id: response.instrument_id,
                                    deploymentType: $scope.deployTypeList.filter(function (dtl) { return dtl.deployment_type_id == response.deployment_type_id; })[0].method,
                                    sensorType: $scope.sensDepTypes.filter(function (s) { return s.sensor_type_id == response.sensor_type_id;})[0].sensor
                                };
                                propStatToAdd = { instrument_id: response.instrument_id, status_type_id: 4, member_id: $cookies.get('mID'), time_stamp: Time_STAMP, time_zone: 'UTC', };

                                INSTRUMENT_STATUS.save(propStatToAdd).$promise.then(function (statResponse) {
                                    propStatToAdd.status = 'Proposed'; propStatToAdd.instrument_status_id = statResponse.instrument_status_id;
                                    createdPropSensor.instrument_status = [propStatToAdd];

                                    $scope.SiteSensors.push(createdPropSensor);
                                    $scope.sensorCount = { total: $scope.SiteSensors.length };
                                    //clean up ...all unchecked and then hide
                                    for (var dep = 0; dep < $scope.deployTypeList.length; dep++) {
                                        $scope.deployTypeList[dep].selected = false;
                                    }
                                    $timeout(function () {
                                        // anything you want can go here and will safely be run on the next digest.
                                        $scope.showProposed = false;
                                        toastr.success("Proposed sensor created");
                                    });

                                }, function (errorResponse) {
                                    // if status fails, need to delete the sensor too
                                    INSTRUMENT.delete({ id: instrumentID });
                                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating sensor: " + errorResponse.headers(["usgswim-messages"]));
                                    else toastr.error("Error creating sensor: " + errorResponse.statusText);
                                });//end INSTRUMENT_STATUS.save
                            }, function (errorResponse) {
                                if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating sensor: " + errorResponse.headers(["usgswim-messages"]));
                                else toastr.error("Error creating sensor: " + errorResponse.statusText);
                            }); //end INSTRUMENT.save
                        }//end if selected == true
                    }//end foreach deployTypeList
                };//end AddProposed()

                //want to retrieve this deployed sensor
                $scope.showRetrieveModal = function (sensorClicked) {
                    //need statusTypes, CollectConditions               
                    var indexClicked = $scope.SiteSensors.indexOf(sensorClicked); var allindex = thisSiteSensors.indexOf(sensorClicked);
                    $rootScope.stateIsLoading.showLoading = true;// loading..//$(".page-loading").removeClass("hidden"); //loading...

                    var modalInstance = $uibModal.open({
                        templateUrl: 'SensorRetrievalModal.html',
                        controller: 'sensorRetrievalModalCtrl',
                        size: 'lg',
                        backdrop: 'static',
                        windowClass: 'rep-dialog',
                        resolve: {                           
                            thisSensor: function () {
                                return sensorClicked !== 0 ? sensorClicked : "empty";
                            },
                            SensorSite: function () {
                                return SITE.query({ id: thisSite.site_id }).$promise;
                            },
                            allEventList: function () {
                                return allEvents;
                            },
                            siteOPs: function () {
                                return SITE.getSiteOPs({ id: thisSite.site_id }).$promise;
                            },
                            allMembers: function () {
                                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                                $http.defaults.headers.common.Accept = 'application/json';
                                return MEMBER.getAll().$promise;
                            },
                            allStatusTypes: function () {
                                return STATUS_TYPE.getAll().$promise;
                            },
                            allInstCollCond: function () {
                                return INST_COLL_CONDITION.getAll().$promise;
                            },
                            allVDatumList: function () {
                                return allVertDatums;
                            }
                        }
                    });
                    modalInstance.result.then(function (retrievedSensor) {
                        if (retrievedSensor[1] == 'retrieved') {
                            $scope.SiteSensors[indexClicked] = retrievedSensor[0]; thisSiteSensors[allindex] = retrievedSensor[0];
                        }
                        if (retrievedSensor[1] == 'deletedR') {
                            var indexClicked1 = $scope.SiteSensors.indexOf(sensorClicked);
                            $scope.SiteSensors.splice(indexClicked1, 1);
                            $scope.sensorCount.total = $scope.SiteSensors.length;
                        }
                        $rootScope.stateIsLoading.showLoading = false; // loading..
                    });
                };//end showRetrieveModal

                $scope.showProposedSensor = function (proposedSensorClicked) {
                    var propIndex = $scope.SiteSensors.indexOf(proposedSensorClicked);
                    var propModalInstance = $uibModal.open({
                        templateUrl: 'ProposedSensor.html',
                        controller: ['$scope', '$uibModalInstance', 'proposedSensor', function ($scope, $uibModalInstance, proposedSensor) {
                            $scope.thisProposedSensor = proposedSensor;
                            $scope.cancel = function () {
                                $uibModalInstance.dismiss();
                            };
                            $scope.deleteProposed = function () {
                                var DeleteModalInstance = $uibModal.open({
                                    templateUrl: 'removemodal.html',
                                    controller: 'ConfirmModalCtrl',
                                    size: 'sm',
                                    resolve: {
                                        nameToRemove: function () {
                                            return 'Proposed Sensor';
                                        },
                                        what: function () {
                                            return "Proposed Sensor";
                                        }
                                    }
                                });
                                DeleteModalInstance.result.then(function () {
                                    $uibModalInstance.close('delete');
                                });
                            };
                        }],
                        size: 'sm',
                        backdrop: 'static',
                        keyboard: false,
                        windowClass: 'rep-dialog',
                        resolve: {
                            proposedSensor: function () {
                                return proposedSensorClicked;
                            }
                        }
                    });
                    propModalInstance.result.then(function (d) {
                        if (d == 'delete') {
                            $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                            INSTRUMENT.delete({ id: proposedSensorClicked.instrument_id }).$promise.then(function () {
                                thisSiteSensors.splice(propIndex, 1);
                                $scope.SiteSensors = thisSiteSensors;
                                $scope.sensorCount.total = $scope.SiteSensors.length;
                                Instrument_Service.setAllSiteSensors($scope.SiteSensors);
                                toastr.success("Proposed sensor deleted");
                            }, function (errorResponse) {
                                if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error deleting proposed sensor: " + errorResponse.headers(["usgswim-messages"]));
                                else toastr.error("Error deleting proposed sensor: " + errorResponse.statusText);
                            });
                        }
                    });
                };
                //want to deploy a proposed sensor, edit a deployed sensor or create a new deployed sensor
                $scope.showSensorModal = function (sensorClicked) {
                    var passAllLists = [allSensorTypes, allSensorBrands, allHousingTypes, allEvents, SensFileTypes, allVertDatums];
                    var indexClicked = $scope.SiteSensors.indexOf(sensorClicked);
                    $rootScope.stateIsLoading.showLoading = true;// loading..// $(".page-loading").removeClass("hidden"); //loading...
                    
                    //if this is a create, show the sensormodal.html, if looking at deployed sensor, go to the depsensormodal.html
                    var modalInstance = $uibModal.open({
                        templateUrl: sensorClicked === 0 || sensorClicked.instrument_status[0].status_type_id === 4 ? 'Sensormodal.html' : 'DepSensormodal.html',
                        controller: 'sensorModalCtrl',
                        size: 'lg',
                        backdrop: 'static',
                        keyboard: false,
                        windowClass: 'rep-dialog',
                        resolve: {
                            allDropdowns: function () {
                                return passAllLists;
                            },
                            allDepTypes: function () {
                                return DEPLOYMENT_TYPE.getAll().$promise;
                            },
                            thisSensor: function () {
                                return sensorClicked !== 0 ? sensorClicked : "empty";
                            },
                            SensorSite: function () {
                                return SITE.query({ id: thisSite.site_id }).$promise;
                            },
                            siteOPs: function () {
                                return SITE.getSiteOPs({ id: thisSite.site_id }).$promise;
                            },
                            agencyList: function () {
                                return allAgencies;
                            },
                            allMembers: function () {
                                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                                $http.defaults.headers.common.Accept = 'application/json';
                                return MEMBER.getAll().$promise;
                            }
                        }
                    });
                    modalInstance.result.then(function (createdSensor) {
                        var i = $scope.SiteSensors.indexOf(sensorClicked); var si = thisSiteSensors.indexOf(sensorClicked);
                        //'deployP' -> createdSensor[1] will be: 'proposedDeployed' deploy new -> createdSensor[1] will be: 'newDeployed';
                        if (createdSensor[1] == 'proposedDeployed') {
                            $scope.SiteSensors[i] = createdSensor[0];
                            thisSiteSensors[si] = createdSensor[0];
                            Instrument_Service.setAllSiteSensors($scope.SiteSensors);
                        }
                        if (createdSensor[1] == 'newDeployed') {
                            $scope.SiteSensors.push(createdSensor[0]); 
                            $scope.sensorCount.total = $scope.SiteSensors.length;
                            Instrument_Service.setAllSiteSensors($scope.SiteSensors);
                        }
                        if (createdSensor[1] === undefined) {
                            //this is from edit -- refresh page?
                            //update the list
                            $scope.SiteSensors[indexClicked] = createdSensor[0];
                            $rootScope.stateIsLoading.showLoading = false;// loading..
                        }
                        if (createdSensor[1] == 'deleted') {
                            $scope.SiteSensors.splice(i, 1);
                            $scope.sensorCount.total = $scope.SiteSensors.length;
                            Instrument_Service.setAllSiteSensors($scope.SiteSensors);
                        }
                        $rootScope.stateIsLoading.showLoading = false;// loading..
                    });
                };

                //want to see the retrieved sensor (can edit deployed part and retrieved part on here)
                $scope.showFullSensorModal = function (sensorClicked) {
                    //send all deployed stuff and retrieved stuff to modal
                    var deployedStuff = [allSensorTypes, allSensorBrands, allHousingTypes, SensFileTypes, allVertDatums];
                    var retrievedStuff = [];
                    var indexClicked = $scope.SiteSensors.indexOf(sensorClicked);
                    $rootScope.stateIsLoading.showLoading = true;// loading..// $(".page-loading").removeClass("hidden"); //loading...

                    var modalInstance = $uibModal.open({
                        templateUrl: 'fullSensormodal.html',
                        controller: 'fullSensorModalCtrl',
                        size: 'lg',
                        backdrop: 'static',
                        keyboard: false,
                        windowClass: 'rep-dialog',
                        resolve: {
                            allDepDropdowns: function () {
                                return deployedStuff;
                            },
                            allStatusTypes: function () {
                                return STATUS_TYPE.getAll().$promise;
                            },
                            allInstCollCond: function () {
                                return INST_COLL_CONDITION.getAll().$promise;
                            },
                            allEvents: function () {
                                return allEvents;
                            },
                            allDepTypes: function () {
                                return DEPLOYMENT_TYPE.getAll().$promise;
                            },
                            thisSensor: function () {
                                return sensorClicked !== 0 ? sensorClicked : "empty";
                            },
                            SensorSite: function () {
                                return SITE.query({ id: thisSite.site_id }).$promise;
                            },
                            siteOPs: function () {
                                return SITE.getSiteOPs({ id: thisSite.site_id }).$promise;
                            },
                            agencyList: function () {
                                return allAgencies;
                            },
                            allMembers: function () {
                                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                                $http.defaults.headers.common.Accept = 'application/json';
                                return MEMBER.getAll().$promise;
                            },
                            allEventDataFiles: function () {
                                return DATA_FILE.getEventDataView({ eventId: sensorClicked.event_id }).$promise;
                            }
                        }
                    });
                    modalInstance.result.then(function (createdSensor) {
                        if (createdSensor[1] == 'deleted') {
                            $scope.SiteSensors.splice(indexClicked, 1);
                            $scope.sensorCount.total = $scope.SiteSensors.length;
                            Instrument_Service.setAllSiteSensors($scope.SiteSensors);
                        } else {
                            //update the list
                            $scope.SiteSensors[indexClicked] = createdSensor[0];
                        }
                        $rootScope.stateIsLoading.showLoading = false;// loading..
                        
                    });

                };

                // watch for the session event to change and update
                $scope.$watch(function () { return $cookies.get('SessionEventName'); }, function (newValue) {
                    $scope.sessionEventName = newValue !== undefined ? newValue : "All Events";
                    $scope.sessionEventExists = $scope.sessionEventName != "All Events" ? true : false;
                    if (newValue !== undefined) {
                        $scope.SiteSensors = thisSiteSensors.filter(function (h) { return (h.event_id == $cookies.get('SessionEventID')) || h.instrument_status[0].status_type_id == 4; });
                        $scope.sensorCount = { total: $scope.SiteSensors.length };
                    } else {
                        $scope.SiteSensors = thisSiteSensors;
                        $scope.sensorCount = { total: $scope.SiteSensors.length };
                    }
                });
            } //end else not auth
        }]);
})();