(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');
   //#region INSTRUMENT
    STNControllers.controller('sensorCtrl', ['$scope', '$cookies', '$location', '$state', '$http', '$uibModal', '$filter', '$timeout', 'thisSite', 'thisSiteSensors', 'allSensorBrands', 'allStatusTypes', 'allDeployTypes', 'allSensorTypes', 'allSensDeps', 'allHousingTypes', 'allEvents', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'SITE', 'MEMBER', 'DEPLOYMENT_TYPE', sensorCtrl]);
    function sensorCtrl($scope, $cookies, $location, $state, $http, $uibModal, $filter, $timeout, thisSite, thisSiteSensors, allSensorBrands, allStatusTypes, allDeployTypes, allSensorTypes, allSensDeps, allHousingTypes, allEvents, INSTRUMENT, INSTRUMENT_STATUS, SITE, MEMBER, DEPLOYMENT_TYPE) {
        if ($cookies.get('STNCreds') == undefined || $cookies.get('STNCreds') == "") {
            $scope.auth = false;
            $location.path('/login');
        } else {
            //global vars
            $scope.sensorCount = { total: thisSiteSensors.length };           
            $scope.statusTypeList = allStatusTypes;
            $scope.deployTypeList = allDeployTypes;
            var tempDepTypeID = 0;
            //fix deployment types so that "Temperature" becomes 2 : Temperature (Met sensor)-SensorType:2 and Temperature (pressure transducer)-SensorType:1
            for (var d = 0; d < $scope.deployTypeList.length; d++) {
                if ($scope.deployTypeList[d].METHOD === "Temperature") {
                    tempDepTypeID = $scope.deployTypeList[d].DEPLOYMENT_TYPE_ID;
                    $scope.deployTypeList[d].METHOD = "Temperature (Met sensor)";
                }
            }
            $scope.deployTypeList.push({DEPLOYMENT_TYPE_ID: tempDepTypeID, METHOD: "Temperature (Pressure Transducer)" });

            //get new Date().toUTCString() with standard time instead of military (optional - pass in a date to have be utc)
            var utcDateTime = function (d) {
                var getMonth = function (mo) {
                    switch (mo) {
                        case 'Jan':
                            return '01';
                        case 'Feb':
                            return '02';
                        case 'Mar':
                            return '03';
                        case 'Apr':
                            return '04';
                        case 'May':
                            return '05';
                        case 'Jun':
                            return '06';
                        case 'Jul':
                            return '07';
                        case 'Aug':
                            return '08';
                        case 'Sep':
                            return '09';
                        case 'Oct':
                            return '10';
                        case 'Nov':
                            return '11';
                        case 'Dec':
                            return '12';
                    }
                };
                var Time_Stamp = d != undefined ? new Date(d).toUTCString() : new Date().toUTCString();// "Wed, 09 Dec 2015 17:18:26 GMT" == change to standard time for storage
                var mo = Time_Stamp.substr(8, 3);
                var actualMo = getMonth(mo);
                var day = Time_Stamp.substr(5, 2);
                var year = Time_Stamp.substr(12, 4);
                var hr = Time_Stamp.substr(17, 2);
                var standardHrs = hr > 12 ? '0' + (hr - 12).toString() : hr.toString();
                var min = Time_Stamp.substr(20, 2);
                var sec = Time_Stamp.substr(23, 2);
                var amPm = hr > 12 ? 'PM' : 'AM';
                var time_stampNEW = actualMo + '/' + day + '/' + year + ' ' + standardHrs + ':' + min + ':' + sec + ' ' + amPm; //12/09/2015 04:22:32PM
                return new Date(time_stampNEW);
            };

            $scope.sensDepTypes = allSensDeps;
            $scope.showProposed = false; //they want to add a proposed sensor, open options
            $scope.SiteSensors = thisSiteSensors;
            $scope.showHideProposed = function () {
                $scope.showProposed = !$scope.showProposed;
            }
           
            //add these checked Proposed sensors to this site
            $scope.AddProposed = function () {
                var proposedToAdd = {}; var propStatToAdd = {};
                var Time_STAMP = utcDateTime();
                for (var dt = 0; dt < $scope.deployTypeList.length; dt++) {
                    if ($scope.deployTypeList[dt].selected == true) {
                        if ($scope.deployTypeList[dt].METHOD.substring(0, 4) == "Temp") {
                            proposedToAdd = {
                                DEPLOYMENT_TYPE_ID: $scope.deployTypeList[dt].DEPLOYMENT_TYPE_ID,
                                SITE_ID: thisSite.SITE_ID,
                                SENSOR_TYPE_ID: $scope.deployTypeList[dt].METHOD == "Temperature (Pressure Transducer)" ? 1 : 2,
                                EVENT_ID: $cookies.get('SessionEventID') != undefined ? $cookies.get('SessionEventID') : null,
                                Deployment_Type: $scope.deployTypeList[dt].METHOD
                            }
                        } else {
                            proposedToAdd = {
                                DEPLOYMENT_TYPE_ID: $scope.deployTypeList[dt].DEPLOYMENT_TYPE_ID,
                                SITE_ID: thisSite.SITE_ID,
                                SENSOR_TYPE_ID: $scope.sensDepTypes.filter(function (sdt) { return sdt.DEPLOYMENT_TYPE_ID == $scope.deployTypeList[dt].DEPLOYMENT_TYPE_ID })[0].SENSOR_TYPE_ID,
                                EVENT_ID: $cookies.get('SessionEventID') != undefined ? $cookies.get('SessionEventID') : null,
                                Deployment_Type: $scope.deployTypeList[dt].METHOD
                            }
                        }
                        //now post it
                        $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookies.get('STNCreds');
                        $http.defaults.headers.common['Accept'] = 'application/json';
                        INSTRUMENT.save(proposedToAdd).$promise.then(function (response) {
                            proposedToAdd.INSTRUMENT_ID = response.INSTRUMENT_ID;
                            var propStatToAdd = { INSTRUMENT_ID: response.INSTRUMENT_ID, STATUS_TYPE_ID: 4, COLLECTION_TEAM_ID: $cookies.get('mID'), TIME_STAMP: Time_STAMP, TIME_ZONE: 'UTC' };
                            
                            INSTRUMENT_STATUS.save(propStatToAdd).$promise.then(function (statResponse) {
                                var instToPushToList = {
                                    Instrument: proposedToAdd,
                                    InstrumentStats: [statResponse]
                                };
                                //clean up ...all unchecked and then hide
                                for (var dep = 0; dep < $scope.deployTypeList.length; dep++) {
                                    $scope.deployTypeList[dep].selected = false;
                                }
                                

                                $timeout(function () {
                                    // anything you want can go here and will safely be run on the next digest.
                                    $scope.showProposed = false;
                                    $scope.SiteSensors.push(instToPushToList);
                                    $scope.sensorCount = { total: $scope.SiteSensors.length };
                                });

                            });//end INSTRUMENT_STATUS.save
                        }); //end INSTRUMENT.save
                    }//end if selected == true
                }//end foreach deployTypeList
            }//end AddProposed()

            //want to deploy/view a sensor, 
            /*which modal? 
             1: deploy proposed (sensor, 'depProp'), deploy new('0', 'deploy'), see deployed to view/edit(sensor, 'viewDep'). 
             2: retrieve deployed(sensor, 'retrieve'). 
             3: view/edit retrieved with deployed on top(sensor, 'viewRet')
             */
            $scope.showSensorModal = function (sensorClicked, modalNeeded) {
                var passAllLists = [allSensorTypes, allSensorBrands, allHousingTypes, allSensDeps, allEvents];
                var indexClicked = $scope.SiteSensors.indexOf(sensorClicked);
                $(".page-loading").removeClass("hidden"); //loading...
                //modal (dependent on 2nd param passed in here)
                
                var modalInstance = $uibModal.open({
                    templateUrl: 'Sensormodal.html',
                    controller: 'sensormodalCtrl',
                    size: 'lg',
                    backdrop: 'static',
                    windowClass: 'rep-dialog',
                    resolve: {
                        allDropdowns: function () {
                            return passAllLists;
                        },
                        allDepTypes: function () {
                            return DEPLOYMENT_TYPE.getAll().$promise;
                        },
                        thisSensor: function () {
                            return sensorClicked != 0 ? sensorClicked : "empty";
                        },
                        SensorSite: function () {
                            return thisSite;
                        },
                        siteOPs: function () {
                            return SITE.getSiteOPs({ id: thisSite.SITE_ID }).$promise;
                        },
                        allMembers: function () {
                            $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookies.get('STNCreds');
                            $http.defaults.headers.common['Accept'] = 'application/json';
                            return MEMBER.getAll().$promise;
                        }
                    }
                });
                modalInstance.result.then(function (createdSensor) {
                    //is there a new op or just closed modal
                    if (createdSensor[1] == 'created') {
                        $scope.SiteSensors.push(createdSensor[0]); thisSiteSensors.push(createdSensor[0]);
                        $scope.sensorCount.total = $scope.SiteSensors.length;
                    }
                    if (createdSensor[1] == 'updated') {
                        //this is from edit -- refresh page?
                        var indexClicked = $scope.SiteSensors.indexOf(sensorClicked);
                        $scope.SiteSensors[indexClicked] = createdSensor[0];
                    }
                    if (createdSensor[1] == 'deleted') {
                        var indexClicked1 = $scope.SiteSensors.indexOf(sensorClicked);
                        $scope.SiteSensors.splice(indexClicked1, 1);
                        $scope.sensorCount.total = $scope.SiteSensors.length;
                    }
                });
            };

            // watch for the session event to change and update
            $scope.$watch(function () { return $cookies.get('SessionEventName'); }, function (newValue) {
                $scope.sessionEventName = newValue != undefined ? newValue : "All Events";
                $scope.sessionEventExists = $scope.sessionEventName != "All Events" ? true : false;
                if (newValue != undefined) {
                    $scope.SiteSensors = thisSiteSensors.filter(function (h) { return h.Instrument.EVENT_ID == $cookies.get('SessionEventID'); });
                    $scope.sensorCount = { total: $scope.SiteSensors.length };
                } else {
                    $scope.SiteSensors = thisSiteSensors;
                    $scope.sensorCount = { total: $scope.SiteSensors.length };
                }
            });
        } //end else not auth
    }


})();