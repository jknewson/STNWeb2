(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var ModalControllers = angular.module('ModalControllers');
    ModalControllers.controller('sensormodalCtrl', ['$scope', '$timeout', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'allDropdowns', 'allDepTypes', 'thisSensor', 'SensorSite', 'siteOPs', 'allMembers', 'INSTRUMENT', 'INSTRUMENT_STATUS', sensormodalCtrl]);
   function sensormodalCtrl($scope, $timeout, $cookies, $http, $uibModalInstance, $uibModal, allDropdowns, allDepTypes, thisSensor, SensorSite, siteOPs, allMembers, INSTRUMENT, INSTRUMENT_STATUS) {
       $(".page-loading").addClass("hidden"); //loading...
       //dropdowns [0]allSensorTypes, [1]allSensorBrands, [2]allHousingTypes, [3]allSensDeps, [4]allEvents
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

       //get timezone and timestamp for their timezone for showing.. post/put will convert it to utc
       var getTimeZoneStamp = function () {
           var sendThis = [];
           var d = new Date();
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
           
           return sendThis = [d, zone];

       }
       //button click to show event dropdown to change it on existing hwm (admin only)
       $scope.showChangeEventDD = function () {
           $scope.showEventDD = !$scope.showEventDD;
       }

       //change event = apply it to the $scope.EventName
       $scope.ChangeEvent = function () {
           $scope.EventName = $scope.eventList.filter(function (el) { return el.EVENT_ID == $scope.adminChanged.EVENT_ID; })[0].EVENT_NAME;
       }

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

       //save aSensor
       $scope.save = function () {
           if ($scope.SensorForm.$valid) {
               var updatedSensor = {};
               if ($scope.adminChanged.EVENT_ID != undefined) {
                   //admin changed the event for this sensor..
                   $scope.aSensor.EVENT_ID = $scope.adminChanged.EVENT_ID;
               }
               //also need: SITE_ID, EVENT_ID, INST_COLLECTION_ID (on retrieval)
               $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookies.get('STNCreds');
               $http.defaults.headers.common['Accept'] = 'application/json';
               //INSTRUMENT.update({ id: $scope.aSensor.INSTRUMENT_ID }, $scope.aSensor).$promise.then(function (response) {
               //    update instrument_status too .. need: STATUS_TYPE_ID and INSTRUMENT_ID
               //    toastr.success("Sensor updated");
               //    updatedSensor = response;
               //    var sendBack = [updatedSensor, 'updated'];
               //    $uibModalInstance.close(sendBack);
               //});
           };
       }//end save()

       //create (POST) a deployed sensor click
       $scope.deploy = function () {
           if (this.SensorForm.$valid) {
               //see if they used Minutes or seconds for interval. need to store in seconds
               if ($scope.IntervalType.type == "Minutes")
                   $scope.aSensor.INTERVAL = $scope.aSensor.INTERVAL * 60;
               //set event_id
               $scope.aSensor.EVENT_ID = $cookies.get('SessionEventID');
               $scope.aSensor.SITE_ID = SensorSite.SITE_ID;

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

               $scope.aSensStatus.STATUS_TYPE_ID = 1; //deployed status
               $scope.aSensStatus.COLLECTION_TEAM_ID = $cookies.get('mID'); //user that logged in is deployer
               var createdSensor = {}; var depSenStat = {};
               $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookies.get('STNCreds');
               $http.defaults.headers.common['Accept'] = 'application/json';

               //DEPLOY PROPOSED or CREATE NEW deployment
               if ($scope.aSensor.INSTRUMENT_ID != undefined) {
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
                               InstrumentStats: [depSenStat, $scope.proposedStateStatus]
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
                       createdSensor.Deployment_Type = response.DEPLOYMENT_TYPE_ID != null ? $scope.depTypeList.filter(function (d) { return d.DEPLOYMENT_TYPE_ID == response.DEPLOYMENT_TYPE_ID; })[0].METHOD : "";
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
       }//end deploy()

       //delete aSensor and sensor statuses
       $scope.deleteSensor = function () {
           //TODO:: Delete the files for this sensor too or reassign to the Site?? Services or client handling?
           var DeleteModalInstance = $uibModal.open({
               templateUrl: 'removemodal.html',
               controller: 'ConfirmModalCtrl',
               size: 'sm',
               resolve: {
                   nameToRemove: function () {
                       return $scope.aSensor
                   },
                   what: function () {
                       return "Sensor";
                   }
               }
           });

           DeleteModalInstance.result.then(function (sensorToRemove) {
               $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookies.get('STNCreds');
               INSTRUMENT.delete({ id: sensorToRemove.INSTRUMENT_ID }, sensorToRemove).$promise.then(function () {
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
       }

       if (thisSensor != "empty") {
           //#region existing deployed Sensor .. break apart the 'thisSensor' into 'aSensor' and 'aSensStatus'
           $scope.aSensor = angular.copy(thisSensor.Instrument);
           $scope.aSensStatus = angular.copy(thisSensor.InstrumentStats[0]);
           $scope.proposedStateStatus = angular.copy(thisSensor.InstrumentStats[0]);
           //are we deploying a proposed sensor or editing a deployed sensor??
           if ($scope.aSensStatus.Status == "Proposed") {
               //deploying proposed
               $scope.whichButton = 'deployP';
               $scope.aSensor.INTERVAL = $scope.aSensor.INTERVAL == 0 ? '' : $scope.aSensor.INTERVAL; //clear out the '0' value here
               $scope.IntervalType.type = 'Seconds'; //default
               //set filteredDeploymentTypes to correct ones based on SENSOR_TYPE_ID
               $scope.getDepTypes();
               $scope.aSensStatus.Status = "Deployed";
               var timeParts = getTimeZoneStamp();
               $scope.aSensStatus.TIME_STAMP = timeParts[0];
               $scope.aSensStatus.TIME_ZONE = timeParts[1]; //will be converted to utc on post/put
               $scope.EventName = $cookies.get('SessionEventName');
               $scope.CollectionMember = $scope.LoggedInMember;
           } else {
               //editing deployed
               //get this deployed sensor's event name
               $scope.whichButton = 'edit';
               $scope.EventName = $scope.eventList.filter(function (e) { return e.EVENT_ID == $scope.aSensor.EVENT_ID; })[0].EVENT_NAME;
               //date formatting

               //get collection member's name
               //$scope.CollectionMember = allMembers.filter(function (m) { return m.MEMBER_ID == ???; })[0];                
           }
           //#endregion existing Sensor
       } else {
           //#region Deploying new Sensor
           $scope.whichButton = 'deploy';
           $scope.IntervalType.type = 'Seconds'; //default
           var timeParts = getTimeZoneStamp();
           $scope.aSensStatus.TIME_STAMP = timeParts[0];
           $scope.aSensStatus.TIME_ZONE = timeParts[1]; //will be converted to utc on post/put          
           $scope.EventName = $cookies.get('SessionEventName');
           $scope.CollectionMember = $scope.LoggedInMember;

           //#endregion new Sensor
       }
   } //end SENSOR
})();