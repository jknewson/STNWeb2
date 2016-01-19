(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var ModalControllers = angular.module('ModalControllers');
    ModalControllers.controller('sensorModalCtrl', ['$scope', '$timeout', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'allDropdowns', 'allDepTypes', 'thisSensor', 'SensorSite', 'siteOPs', 'allMembers', 'INSTRUMENT', 'INSTRUMENT_STATUS', 
        function sensorModalCtrl($scope, $timeout, $cookies, $http, $uibModalInstance, $uibModal, allDropdowns, allDepTypes, thisSensor, SensorSite, siteOPs, allMembers, INSTRUMENT, INSTRUMENT_STATUS) {
           $(".page-loading").addClass("hidden"); //loading...
           //dropdowns [0]allSensorTypes, [1]allSensorBrands, [2]allHousingTypes, [3]allSensDeps, [4]allEvents
           //TODO :: Can they edit a deployed sensor without an event being chosen???       
           $scope.sensorTypeList = allDropdowns[0];
           $scope.sensorBrandList = allDropdowns[1];
           $scope.houseTypeList = allDropdowns[2];
           $scope.sensorDeployList = allDropdowns[3];
           $scope.eventList = allDropdowns[4];
           $scope.depTypeList = allDepTypes; //get fresh version so not messed up with the Temperature twice
           $scope.filteredDeploymentTypes = [];
           $scope.timeZoneList = ['UTC', 'PST', 'MST', 'CST', 'EST'];
           $scope.userRole = $cookies.get('usersRole');
           $scope.showEventDD = false; //toggle to show/hide event dd (admin only)
           $scope.adminChanged = {}; //will hold EVENT_ID if admin changes it. apply when PUTting
           $scope.IntervalType = {}; //holder for minute/second radio buttons
           $scope.whichButton = ""; //holder for save/deploy button at end .. 'deploy' if proposed->deployed, and for deploying new or save if editing existing
           //new datetimepicker https://github.com/zhaber/angular-js-bootstrap-datetimepicker
           $scope.dateOptions = {
               startingDay: 1,
               showWeeks: false
           };

           //get new Date().toUTCString() with standard time instead of military (optional - pass in a date to have be utc)
           //var utcDateTime = function (d) {
           //    var getMonth = function (mo) {
           //        switch (mo) {
           //            case 'Jan':
           //                return '01';
           //            case 'Feb':
           //                return '02';
           //            case 'Mar':
           //                return '03';
           //            case 'Apr':
           //                return '04';
           //            case 'May':
           //                return '05';
           //            case 'Jun':
           //                return '06';
           //            case 'Jul':
           //                return '07';
           //            case 'Aug':
           //                return '08';
           //            case 'Sep':
           //                return '09';
           //            case 'Oct':
           //                return '10';
           //            case 'Nov':
           //                return '11';
           //            case 'Dec':
           //                return '12';
           //        }
           //    };
           //    var Time_Stamp = d != undefined ? new Date(d).toUTCString() : new Date().toUTCString();// "Wed, 09 Dec 2015 17:18:26 GMT" == change to standard time for storage
           //    var mo = Time_Stamp.substr(8, 3);
           //    var actualMo = getMonth(mo);
           //    var day = Time_Stamp.substr(5, 2);
           //    var year = Time_Stamp.substr(12, 4);
           //    var hr = Time_Stamp.substr(17, 2);
           //    var standardHrs = hr > 12 ? '0' + (hr - 12).toString() : hr.toString();
           //    var min = Time_Stamp.substr(20, 2);
           //    var sec = Time_Stamp.substr(23, 2);
           //    var amPm = hr > 12 ? 'PM' : 'AM';
           //    var time_stampNEW = actualMo + '/' + day + '/' + year + ' ' + standardHrs + ':' + min + ':' + sec + ' ' + amPm; //12/09/2015 04:22:32PM
           //    return new Date(time_stampNEW);
           //};

           //get timezone and timestamp for their timezone for showing.. post/put will convert it to utc
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

           //button click to show event dropdown to change it on existing hwm (admin only)
           $scope.showChangeEventDD = function () {
               $scope.showEventDD = !$scope.showEventDD;
           };

           //change event = apply it to the $scope.EventName
           $scope.ChangeEvent = function () {
               $scope.EventName = $scope.eventList.filter(function (el) { return el.EVENT_ID == $scope.adminChanged.EVENT_ID; })[0].EVENT_NAME;
           };

           //get deployment types for sensor type chosen
           $scope.getDepTypes = function () {
               $scope.filteredDeploymentTypes = [];
               var matchingSensDeplist = $scope.sensorDeployList.filter(function (sd) { return sd.SENSOR_TYPE_ID == $scope.aSensor.SENSOR_TYPE_ID; });

               for (var y = 0; y < matchingSensDeplist.length; y++) {
                   for (var i = 0; i < $scope.depTypeList.length; i++) {
                       //for each one, if projObjectives has this id, add 'selected:true' else add 'selected:false'
                       if (matchingSensDeplist[y].DEPLOYMENT_TYPE_ID == $scope.depTypeList[i].DEPLOYMENT_TYPE_ID) {
                           $scope.filteredDeploymentTypes.push($scope.depTypeList[i]);
                           i = $scope.depTypeList.length; //ensures it doesn't set it as false after setting it as true
                       }
                   }
               }
           };

           // $scope.sessionEvent = $cookies.get('SessionEventName');
           $scope.LoggedInMember = allMembers.filter(function (m) { return m.MEMBER_ID == $cookies.get('mID'); })[0];

           $scope.aSensor = {};
           $scope.aSensStatus = {};

           $scope.thisSensorSite = SensorSite;

           //cancel
           $scope.cancel = function () {
               //$scope.adminChanged = {};
               //$scope.EventName = $scope.eventList.filter(function (e) { return e.EVENT_ID == $scope.aSensor.EVENT_ID; })[0].EVENT_NAME;
               $uibModalInstance.dismiss('cancel');
           };

           // is interval is number
           $scope.isNum = function (evt) {
               var theEvent = evt || window.event;
               var key = theEvent.keyCode || theEvent.which;
               if (key != 46 && key != 45 && key > 31 && (key < 48 || key > 57)) {
                   theEvent.returnValue = false;
                   if (theEvent.preventDefault) theEvent.preventDefault();
               }
           };

           //is it UTC or local time..make sure it stays UTC
           var dealWithTimeStampb4Send = function () {
               //check and see if they are not using UTC
               if ($scope.aSensStatus.TIME_ZONE != "UTC") {
                   //convert it
                   var utcDateTime = new Date($scope.aSensStatus.TIME_STAMP).toUTCString();
                   $scope.aSensStatus.TIME_STAMP = utcDateTime;
                   $scope.aSensStatus.TIME_ZONE = 'UTC';
               } else {
                   //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                   var i = $scope.aSensStatus.TIME_STAMP.toString().indexOf('GMT') + 3;
                   $scope.aSensStatus.TIME_STAMP = $scope.aSensStatus.TIME_STAMP.toString().substring(0, i);
               }
           };

           //save aSensor
           $scope.save = function () {
               if ($scope.SensorForm.$valid) {
                   var updatedSensor = {}; var updatedSenStat = {};
                   //admin changed the event for this sensor..
                   if ($scope.adminChanged.EVENT_ID !== undefined)
                       $scope.aSensor.EVENT_ID = $scope.adminChanged.EVENT_ID;
                   //see if they used Minutes or seconds for interval. need to store in seconds
                   if ($scope.IntervalType.type == "Minutes")
                       $scope.aSensor.INTERVAL = $scope.aSensor.INTERVAL * 60;
                   dealWithTimeStampb4Send(); //UTC or local?
                   //if they changed Deployment_Type, Housing_Type, Sensor_Brand, or Sensor_Type -- update those fields for passing the model back

                   //also need: SITE_ID, EVENT_ID, INST_COLLECTION_ID (only for retrieval)
                   $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                   $http.defaults.headers.common.Accept = 'application/json';
                   INSTRUMENT.update({ id: $scope.aSensor.INSTRUMENT_ID }, $scope.aSensor).$promise.then(function (response) {
                       updatedSensor = response;
                       updatedSensor.Deployment_Type = $scope.depTypeList.filter(function (d) { return d.DEPLOYMENT_TYPE_ID == $scope.aSensor.DEPLOYMENT_TYPE_ID; })[0].METHOD;
                       updatedSensor.Housing_Type = $scope.houseTypeList.filter(function (h) { return h.HOUSING_TYPE_ID == $scope.aSensor.HOUSING_TYPE_ID; })[0].TYPE_NAME;
                       updatedSensor.Sensor_Brand = $scope.sensorBrandList.filter(function (s) { return s.SENSOR_BRAND_ID == $scope.aSensor.SENSOR_BRAND_ID; })[0].BRAND_NAME;
                       updatedSensor.Sensor_Type = $scope.sensorTypeList.filter(function (t) { return t.SENSOR_TYPE_ID == $scope.aSensor.SENSOR_TYPE_ID; })[0].SENSOR;

                       INSTRUMENT_STATUS.update({ id: $scope.aSensStatus.INSTRUMENT_STATUS_ID }, $scope.aSensStatus).$promise.then(function (statResponse) {
                           updatedSenStat = statResponse;
                           var sensorObjectToSendBack = {
                               Instrument: updatedSensor,
                               InstrumentStats: [updatedSenStat]
                           };
                           $timeout(function () {
                               // anything you want can go here and will safely be run on the next digest.
                               toastr.success("Sensor updated");
                               var state = $scope.whichButton; //'edit'
                               var sendBack = [sensorObjectToSendBack, state];
                               $uibModalInstance.close(sendBack);
                           });
                       });
                   });
               }
           };//end save()

           //create (POST) a deployed sensor click
           $scope.deploy = function () {
               if (this.SensorForm.$valid) {
                   //see if they used Minutes or seconds for interval. need to store in seconds
                   if ($scope.IntervalType.type == "Minutes")
                       $scope.aSensor.INTERVAL = $scope.aSensor.INTERVAL * 60;
                   //set event_id
                   $scope.aSensor.EVENT_ID = $cookies.get('SessionEventID');
                   $scope.aSensor.SITE_ID = SensorSite.SITE_ID;
                   dealWithTimeStampb4Send(); //UTC or local?
                   $scope.aSensStatus.STATUS_TYPE_ID = 1; //deployed status
                   $scope.aSensStatus.COLLECTION_TEAM_ID = $cookies.get('mID'); //user that logged in is deployer
                   var createdSensor = {}; var depSenStat = {};
                   $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                   $http.defaults.headers.common.Accept = 'application/json';

                   //DEPLOY PROPOSED or CREATE NEW deployment
                   if ($scope.aSensor.INSTRUMENT_ID !== undefined) {
                       //put instrument, post status for deploying proposed sensor
                       INSTRUMENT.update({ id: $scope.aSensor.INSTRUMENT_ID }, $scope.aSensor).$promise.then(function (response) {
                           //create instrumentstatus too need: STATUS_TYPE_ID and INSTRUMENT_ID
                           createdSensor = response;
                           createdSensor.Deployment_Type = $scope.aSensor.Deployment_Type;
                           $scope.aSensStatus.INSTRUMENT_ID = response.INSTRUMENT_ID;
                           INSTRUMENT_STATUS.save($scope.aSensStatus).$promise.then(function (statResponse) {
                               //build the createdSensor to send back and add to the list page
                               depSenStat = statResponse;
                               var sensorObjectToSendBack = {
                                   Instrument: createdSensor,
                                   InstrumentStats: [depSenStat, $scope.previousStateStatus]
                               };
                               $timeout(function () {
                                   // anything you want can go here and will safely be run on the next digest.
                                   toastr.success("Sensor deployed");
                                   var state = $scope.whichButton == 'deployP' ? 'proposedDeployed' : 'newDeployed';
                                   var sendBack = [sensorObjectToSendBack, state];
                                   $uibModalInstance.close(sendBack);
                               });
                           });
                       });
                   } else {
                       //post instrument and status for deploying new sensor
                       INSTRUMENT.save($scope.aSensor).$promise.then(function (response) {
                           //create instrumentstatus too need: STATUS_TYPE_ID and INSTRUMENT_ID
                           createdSensor = response;
                           createdSensor.Deployment_Type = response.DEPLOYMENT_TYPE_ID !== null ? $scope.depTypeList.filter(function (d) { return d.DEPLOYMENT_TYPE_ID == response.DEPLOYMENT_TYPE_ID; })[0].METHOD : "";
                           $scope.aSensStatus.INSTRUMENT_ID = response.INSTRUMENT_ID;
                           INSTRUMENT_STATUS.save($scope.aSensStatus).$promise.then(function (statResponse) {
                               //build the createdSensor to send back and add to the list page
                               createdSenStat = statResponse;
                               var sensorObjectToSendBack = {
                                   Instrument: createdSensor,
                                   InstrumentStats: [createdSenStat]
                               };
                               toastr.success("Sensor deployed");
                               var state = $scope.whichButton == 'deployP' ? 'proposedDeployed' : 'newDeployed';
                               var sendBack = [sensorObjectToSendBack, state];
                               $uibModalInstance.close(sendBack);
                           });
                       });
                   }

               }
           };//end deploy()

           //delete aSensor and sensor statuses
           $scope.deleteS = function () {
               //TODO:: Delete the files for this sensor too or reassign to the Site?? Services or client handling?
               var DeleteModalInstance = $uibModal.open({
                   templateUrl: 'removemodal.html',
                   controller: 'ConfirmModalCtrl',
                   size: 'sm',
                   resolve: {
                       nameToRemove: function () {
                           return $scope.aSensor;
                       },
                       what: function () {
                           return "Sensor";
                       }
                   }
               });

               DeleteModalInstance.result.then(function (sensorToRemove) {
                   $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                   //this will delete the instrument and all it's statuses
                   INSTRUMENT.delete({ id: sensorToRemove.INSTRUMENT_ID }).$promise.then(function () {
                       //remove the statuses too
                       toastr.success("Sensor Removed");
                       var sendBack = ["de", 'deleted'];
                       $uibModalInstance.close(sendBack);
                   }, function error(errorResponse) {
                       toastr.error("Error: " + errorResponse.statusText);
                   });
               }, function () {
                   //logic for cancel
               });//end modal
           };

           if (thisSensor != "empty") {
               //actions: 'depProp', 'editDep', 'retrieve', 'editRet'
               //#region existing deployed Sensor .. break apart the 'thisSensor' into 'aSensor' and 'aSensStatus'
               $scope.aSensor = angular.copy(thisSensor.Instrument);
               $scope.aSensStatus = angular.copy(thisSensor.InstrumentStats[0]);           
               $scope.getDepTypes();//populate $scope.filteredDeploymentTypes for dropdown options
               $scope.IntervalType.type = 'Seconds'; //default

               //are we deploying a proposed sensor or editing a deployed sensor??
               if (thisSensor.InstrumentStats[0].Status == "Proposed") {
                   //deploying proposed
                   $scope.previousStateStatus = angular.copy(thisSensor.InstrumentStats[0]); //hold the previous one in case they are changing states (proposed to deployed)
                   $scope.whichButton = 'deployP';
                   $scope.aSensor.INTERVAL = $scope.aSensor.INTERVAL === 0 ? '' : $scope.aSensor.INTERVAL; //clear out the '0' value here               
                   $scope.aSensStatus.Status = "Deployed";
                   var timeParts = getTimeZoneStamp();
                   $scope.aSensStatus.TIME_STAMP = timeParts[0];
                   $scope.aSensStatus.TIME_ZONE = timeParts[1]; //will be converted to utc on post/put
                   $scope.aSensStatus.MEMBER_ID = $cookies.get('mID'); // member logged in is deploying it (replaces COLLECT_TEAM_ID)
                   $scope.EventName = $cookies.get('SessionEventName');
                   $scope.Deployer = $scope.LoggedInMember;
               } else {
                   //editing deployed
                   $scope.whichButton = 'edit';
                   //get this deployed sensor's event name
                   $scope.EventName = $scope.eventList.filter(function (e) { return e.EVENT_ID == $scope.aSensor.EVENT_ID; })[0].EVENT_NAME;
                   //date formatting            
                   $scope.aSensStatus.TIME_STAMP = new Date($scope.aSensStatus.TIME_STAMP); //this keeps it as utc in display
                   //get collection member's name (memberID is replacing collect_Team_id)
                   $scope.Deployer = $scope.aSensStatus.MEMBER_ID !== null || $scope.aSensStatus.MEMBER_ID !== undefined ? allMembers.filter(function (m) { return m.MEMBER_ID == $scope.aSensStatus.MEMBER_ID; })[0] : {};
               }
               //#endregion existing Sensor
           } else {
               //#region Deploying new Sensor
               $scope.whichButton = 'deploy';
               $scope.IntervalType.type = 'Seconds'; //default
               var DeptimeParts = getTimeZoneStamp();
               $scope.aSensStatus.TIME_STAMP = DeptimeParts[0];
               $scope.aSensStatus.TIME_ZONE = DeptimeParts[1]; //will be converted to utc on post/put          
               $scope.aSensStatus.MEMBER_ID = $cookies.get('mID'); // member logged in is deploying it (replaces COLLECT_TEAM_ID)
               $scope.EventName = $cookies.get('SessionEventName');
               $scope.Deployer = $scope.LoggedInMember;           
               //#endregion new Sensor
           }
        }]); //end SENSOR


    ModalControllers.controller('sensorRetrievalModalCtrl', ['$scope', '$timeout', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'thisSensor', 'SensorSite', 'siteOPs', 'allEventList', 'allMembers', 'allStatusTypes', 'allInstCollCond', 'INSTRUMENT', 'INSTRUMENT_STATUS', 
        function sensorRetrievalModalCtrl($scope, $timeout, $cookies, $http, $uibModalInstance, $uibModal, thisSensor, SensorSite, siteOPs, allEventList, allMembers, allStatusTypes, allInstCollCond, INSTRUMENT, INSTRUMENT_STATUS) {
            $(".page-loading").addClass("hidden"); //loading...
            $scope.aSensor = thisSensor.Instrument;
            $scope.EventName = allEventList.filter(function (r) {return r.EVENT_ID == $scope.aSensor.EVENT_ID;})[0].EVENT_NAME;
            $scope.depSensStatus = thisSensor.InstrumentStats[0];
            $scope.Deployer = allMembers.filter(function (m) { return m.MEMBER_ID == $scope.depSensStatus.MEMBER_ID; })[0];
            $scope.whichButton = 'Retrieve';
            $scope.statusTypeList = allStatusTypes.filter(function (s) { return s.STATUS == "Retrieved" || s.STATUS == "Lost";});
            $scope.collectCondList = allInstCollCond;
            $scope.timeZoneList = ['UTC', 'PST', 'MST', 'CST', 'EST'];
            $scope.userRole = $cookies.get('usersRole');
            $scope.aRetrieval = {TIME_STAMP: new Date(), TIME_ZONE: 'CST', INSTRUMENT_ID: $scope.aSensor.INSTRUMENT_ID, MEMBER_ID: $cookies.get('mID')};
            $scope.Retriever = allMembers.filter(function (am) { return am.MEMBER_ID == $cookies.get('mID'); })[0];
        //cancel
            $scope.cancel = function () {           
                $uibModalInstance.dismiss('cancel');
            };

            $scope.retrieveS = function (valid) {
                if (valid) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    var updatedSensor = {}; var createRetSens = {};
                    INSTRUMENT.update({ id: $scope.aSensor.INSTRUMENT_ID }, $scope.aSensor).$promise.then(function (response) {
                        //create instrumentstatus too need: STATUS_TYPE_ID and INSTRUMENT_ID
                        updatedSensor = response;
                        updatedSensor.Deployment_Type = $scope.aSensor.Deployment_Type;
                        INSTRUMENT_STATUS.save($scope.aRetrieval).$promise.then(function (statResponse) {
                            //build the createdSensor to send back and add to the list page
                            createRetSens = statResponse; 
                            var sensorObjectToSendBack = {
                                Instrument: updatedSensor,
                                InstrumentStats: [createRetSens, $scope.depSensStatus]
                            };
                            $timeout(function () {
                                // anything you want can go here and will safely be run on the next digest.
                                toastr.success("Sensor retrieved");
                                var state = 'retrieved';
                                var sendBack = [sensorObjectToSendBack, state];
                                $uibModalInstance.close(sendBack);
                            });
                        });
                    });
                }//end if valid
            };//end retrieveS

        }]);//end sensorRetrievalModalCtrl

    ModalControllers.controller('fullSensorModalCtrl', ['$scope', '$timeout', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'allDepDropdowns', 'allStatusTypes', 'allInstCollCond', 'allEvents', 'allDepTypes', 'thisSensor', 'SensorSite', 'siteOPs', 'allMembers', 'INSTRUMENT', 'INSTRUMENT_STATUS', 
        function fullSensorModalCtrl($scope, $timeout, $cookies, $http, $uibModalInstance, $uibModal, allDepDropdowns, allStatusTypes, allInstCollCond, allEvents, allDepTypes, thisSensor, SensorSite, siteOPs, allMembers, INSTRUMENT, INSTRUMENT_STATUS) {
            $(".page-loading").addClass("hidden"); //loading...
            /*allSensorTypes, allSensorBrands, allHousingTypes, allSensDeps*/
            $scope.sensorTypeList = allDepDropdowns[0];
            $scope.sensorBrandList = allDepDropdowns[1];
            $scope.houseTypeList = allDepDropdowns[2];
            $scope.sensorDeployList = allDepDropdowns[3];
            //no need for event..not changing it.
            $scope.depTypeList = allDepTypes; //get fresh version so not messed up with the Temperature twice
            $scope.filteredDeploymentTypes = [];
            $scope.timeZoneList = ['UTC', 'PST', 'MST', 'CST', 'EST'];
            $scope.userRole = $cookies.get('usersRole');
            $scope.IntervalType = {}; //holder for minute/second radio buttons
            $scope.thisSensorSite = SensorSite;


            $scope.sensor = thisSensor.Instrument;
            $scope.retrievedInstStatus = thisSensor.InstrumentStats[0];

            //if this status is lost, only populate retrieved, if retrieved, only populate lost
            if ($scope.retrievedInstStatus.STATUS_TYPE_ID === 2) $scope.statusTypeList = allStatusTypes.filter(function (s) { return s.STATUS == 'Lost'; });
            if ($scope.retrievedInstStatus.STATUS_TYPE_ID === 3) $scope.statusTypeList = allStatusTypes.filter(function (s) { return s.STATUS == 'Retrieved'; });

            $scope.dateOptions = {
                startingDay: 1,
                showWeeks: false
            };

            // is interval is number
            $scope.isNum = function (evt) {
                var theEvent = evt || window.event;
                var key = theEvent.keyCode || theEvent.which;
                if (key != 46 && key != 45 && key > 31 && (key < 48 || key > 57)) {
                    theEvent.returnValue = false;
                    if (theEvent.preventDefault) theEvent.preventDefault();
                }
            };
            //get timezone and timestamp for their timezone for showing.. post/put will convert it to utc
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

            //get deployment types for sensor type chosen
            $scope.getDepTypes = function () {
                $scope.filteredDeploymentTypes = [];
                var matchingSensDeplist = $scope.sensorDeployList.filter(function (sd) { return sd.SENSOR_TYPE_ID == $scope.sensor.SENSOR_TYPE_ID; });

                for (var y = 0; y < matchingSensDeplist.length; y++) {
                    for (var i = 0; i < $scope.depTypeList.length; i++) {
                        //for each one, if projObjectives has this id, add 'selected:true' else add 'selected:false'
                        if (matchingSensDeplist[y].DEPLOYMENT_TYPE_ID == $scope.depTypeList[i].DEPLOYMENT_TYPE_ID) {
                            $scope.filteredDeploymentTypes.push($scope.depTypeList[i]);
                            i = $scope.depTypeList.length; //ensures it doesn't set it as false after setting it as true
                        }
                    }
                }
            };

            //cancel
            $scope.cancel = function () {
                //$scope.adminChanged = {};
                //$scope.EventName = $scope.eventList.filter(function (e) { return e.EVENT_ID == $scope.aSensor.EVENT_ID; })[0].EVENT_NAME;
                $uibModalInstance.dismiss('cancel');
            };

            //is it UTC or local time..make sure it stays UTC
            var dealWithTimeStampb4Send = function () {
                //check and see if they are not using UTC
                if ($scope.aSensStatus.TIME_ZONE != "UTC") {
                    //convert it
                    var utcDateTime = new Date($scope.aSensStatus.TIME_STAMP).toUTCString();
                    $scope.aSensStatus.TIME_STAMP = utcDateTime;
                    $scope.aSensStatus.TIME_ZONE = 'UTC';
                } else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.aSensStatus.TIME_STAMP.toString().indexOf('GMT') + 3;
                    $scope.aSensStatus.TIME_STAMP = $scope.aSensStatus.TIME_STAMP.toString().substring(0, i);
                }
            };

            //save sensor
            $scope.save = function (valid, sensorToUpdate) {
                if (valid) {
                    var updatedSensor = {}; var updatedSenStat = {};
                    //see if they used Minutes or seconds for interval. need to store in seconds
                    if ($scope.IntervalType.type == "Minutes")
                        $scope.sensor.INTERVAL = $scope.sensor.INTERVAL * 60;
                    dealWithTimeStampb4Send(); //UTC or local?
                    //if they changed Deployment_Type, Housing_Type, Sensor_Brand, or Sensor_Type -- update those fields for passing the model back

                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    INSTRUMENT.update({ id: $scope.sensor.INSTRUMENT_ID }, $scope.sensor).$promise.then(function (response) {
                        updatedSensor = response;
                        updatedSensor.Deployment_Type = $scope.depTypeList.filter(function (d) { return d.DEPLOYMENT_TYPE_ID == $scope.sensor.DEPLOYMENT_TYPE_ID; })[0].METHOD;
                        updatedSensor.Housing_Type = $scope.houseTypeList.filter(function (h) { return h.HOUSING_TYPE_ID == $scope.sensor.HOUSING_TYPE_ID; })[0].TYPE_NAME;
                        updatedSensor.Sensor_Brand = $scope.sensorBrandList.filter(function (s) { return s.SENSOR_BRAND_ID == $scope.sensor.SENSOR_BRAND_ID; })[0].BRAND_NAME;
                        updatedSensor.Sensor_Type = $scope.sensorTypeList.filter(function (t) { return t.SENSOR_TYPE_ID == $scope.sensor.SENSOR_TYPE_ID; })[0].SENSOR;

                        INSTRUMENT_STATUS.update({ id: $scope.aSensStatus.INSTRUMENT_STATUS_ID }, $scope.aSensStatus).$promise.then(function (statResponse) {
                            updatedSenStat = statResponse;
                            var sensorObjectToSendBack = {
                                Instrument: updatedSensor,
                                InstrumentStats: [updatedSenStat]
                            };
                            $timeout(function () {
                                // anything you want can go here and will safely be run on the next digest.
                                toastr.success("Sensor updated");
                                var state = $scope.whichButton; //'edit'
                                var sendBack = [sensorObjectToSendBack, state];
                                $uibModalInstance.close(sendBack);
                            });
                        });
                    });
                }
            };//end save()

        }]);//end fullSensorModalCtrl
})();