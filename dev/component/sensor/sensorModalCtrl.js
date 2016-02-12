(function () {
    'use strict';

    var ModalControllers = angular.module('ModalControllers');

    //deploy new or proposed sensor, edit deployed modal
    ModalControllers.controller('sensorModalCtrl', ['$scope', '$timeout', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'allDropdowns', 'agencyList', 'Site_Files', 'allDepTypes', 'thisSensor', 'SensorSite', 'siteOPs', 'allMembers', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'DATA_FILE', 'FILE', 'SOURCE',
        function ($scope, $timeout, $cookies, $http, $uibModalInstance, $uibModal, allDropdowns, agencyList, Site_Files, allDepTypes, thisSensor, SensorSite, siteOPs, allMembers, INSTRUMENT, INSTRUMENT_STATUS, DATA_FILE, FILE, SOURCE) {
           $(".page-loading").addClass("hidden"); //loading...
           //dropdowns [0]allSensorTypes, [1]allSensorBrands, [2]allHousingTypes, [3]allSensDeps, [4]allEvents
           //TODO :: Can they edit a deployed sensor without an event being chosen???       
           $scope.sensorTypeList = allDropdowns[0];
           $scope.sensorBrandList = allDropdowns[1];
           $scope.houseTypeList = allDropdowns[2];
           $scope.sensorDeployList = allDropdowns[3];
           $scope.eventList = allDropdowns[4];
           $scope.fileTypeList = allDropdowns[5]; //used if creating/editing depSens file
           $scope.allSFiles = Site_Files.getAllSiteFiles();
           $scope.DepSensorFiles = thisSensor !== "empty" ? $scope.allSFiles.filter(function (sf) { return sf.INSTRUMENT_ID == thisSensor.Instrument.INSTRUMENT_ID; }) : [];// holder for hwm files added
           $scope.depSensImageFiles = $scope.DepSensorFiles.filter(function (hf) { return hf.FILETYPE_ID === 1; }); //image files for carousel
           $scope.showFileForm = false; //hidden form to add file to hwm

           $scope.OPsForTapeDown = siteOPs;
           $scope.OPMeasure = {}; //holder if they add tapedown values
           $scope.tapeDownTable = []; //holder of tapedown OP_MEASUREMENTS
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
           $scope.datepickrs = {};
           $scope.open = function ($event, which) {
               $event.preventDefault();
               $event.stopPropagation();

               $scope.datepickrs[which] = true;
           };
            //#region FILE STUFF
            //show a modal with the larger image as a preview on the photo file for this op
           $scope.showImageModal = function (image) {
               var imageModal = $uibModal.open({
                   template: '<div class="modal-header"><h3 class="modal-title">Image File Preview</h3></div>' +
                       '<div class="modal-body"><img ng-src="https://stntest.wim.usgs.gov/STNServices2/Files/{{imageId}}/Item" /></div>' +
                       '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                   controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                       $scope.ok = function () {
                           $uibModalInstance.close();
                       };
                       $scope.imageId = image;
                   }],
                   size: 'md'
               });
           };

            //want to add or edit file
           $scope.showFile = function (file) {
               $scope.fileTypes = $scope.fileTypeList;
               $scope.agencies = agencyList;
               $scope.existFileIndex = -1;
               $scope.existIMGFileIndex = -1;
               $scope.allSFileIndex = -1; //indexes for splice/change
               $scope.aFile = {}; //holder for file
               $scope.aSource = {}; //holder for file source
               $scope.datafile = {}; //holder for file datafile
               if (file !== 0) {
                   //edit op file
                   $scope.existFileIndex = $scope.DepSensorFiles.indexOf(file);
                   $scope.allSFileIndex = $scope.allSFiles.indexOf(file);
                   $scope.existIMGFileIndex = $scope.depSensImageFiles.length > 0 ? $scope.depSensImageFiles.indexOf(file) : -1;
                   $scope.aFile = angular.copy(file);
                   $scope.aFile.FILE_DATE = new Date($scope.aFile.FILE_DATE); //date for validity of form on PUT
                   if (file.SOURCE_ID !== null) {
                       SOURCE.query({ id: file.SOURCE_ID }).$promise.then(function (s) {
                           $scope.aSource = s;
                           $scope.aSource.FULLNAME = $scope.aSource.SOURCE_NAME;
                           $scope.aSource.SOURCE_DATE = new Date($scope.aSource.SOURCE_DATE); //date for validity of form on put
                       });
                   }//end if source
                   if (file.DATA_FILE_ID !== null) {
                       DATA_FILE.query({ id: file.DATA_FILE_ID }).$promise.then(function (df) {
                           $scope.datafile = df;
                           $scope.processor = allMembers.filter(function (m) { return m.MEMBER_ID == $scope.datafile.PROCESSOR_ID; })[0];                          
                           $scope.datafile.COLLECT_DATE = new Date($scope.datafile.COLLECT_DATE);
                           $scope.datafile.GOOD_START = new Date($scope.datafile.GOOD_START);
                           $scope.datafile.GOOD_END = new Date($scope.datafile.GOOD_END);//date for validity of form on put
                       });
                   }
               }//end existing file
               else {
                   //creating a file
                   $scope.aFile.FILE_DATE = new Date();
                   $scope.aSource = allMembers.filter(function (m) { return m.MEMBER_ID == $cookies.get('mID'); })[0];
                   $scope.aSource.FULLNAME = $scope.aSource.FNAME + " " + $scope.aSource.LNAME;
                   $scope.aSource.SOURCE_DATE = new Date();
                   $scope.processor = allMembers.filter(function (m) { return m.MEMBER_ID == $cookies.get('mID'); })[0];
                   var dt = getTimeZoneStamp();                     
                   $scope.datafile.COLLECT_DATE = dt[0];
                   $scope.datafile.TIME_ZONE = dt[1]; //will be converted to utc on post/put 
                   $scope.datafile.GOOD_START = new Date();
                   $scope.datafile.GOOD_END = new Date();
               } //end new file
               $scope.showFileForm = true;
           };
            //create this new file
           $scope.createFile = function (valid) {
               if (valid) {
                   /*aFile.FILETYPE_ID, (pdo)aFile.FILE_URL, (pdo)aFile.FILE_DATE, (pdo)aFile.DESCRIPTION, (p)aFile.PHOTO_DIRECTION, (p)aFile.LATITUDE_DD, (p)aFile.LONGITUDE_DD,
                    * OP WILL NOT HAVE DATAFILE:: (d)datafile.PROCESSOR_ID, (d)datafile.COLLECT_DATE, (d)datafile.GOOD_START, (d)datafile.GOOD_END, (d)datafile.TIME_ZONE, (d)datafile.ELEVATION_STATUS
                    * (po)aSource.FULLNAME, (po)aSource.AGENCY_ID, (po)aSource.SOURCE_DATE,  */
                   $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                   $http.defaults.headers.common.Accept = 'application/json';
                   //post source or datafile first to get SOURCE_ID or DATA_FILE_ID
                   if ($scope.aFile.FILETYPE_ID == 2){
                       //determine timezone
                       if ($scope.datafile.TIME_ZONE != "UTC") {
                           //convert it
                           var utcStartDateTime = new Date($scope.datafile.GOOD_START).toUTCString();
                           var utcEndDateTime = new Date($scope.datafile.GOOD_END).toUTCString();
                           $scope.datafile.GOOD_START = utcStartDateTime;
                           $scope.datafile.GOOD_END = utcEndDateTime;
                           $scope.datafile.TIME_ZONE = 'UTC';
                       } else {
                           //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                           var si = $scope.datafile.GOOD_START.toString().indexOf('GMT') + 3;
                           var ei = $scope.datafile.GOOD_END.toString().indexOf('GMT') + 3;
                           $scope.datafile.GOOD_START = $scope.datafile.GOOD_START.toString().substring(0, si);
                           $scope.datafile.GOOD_END = $scope.datafile.GOOD_END.toString().substring(0, ei);
                       }
                       $scope.datafile.INSTRUMENT_ID = thisSensor.Instrument.INSTRUMENT_ID;
                       $scope.datafile.PROCESSOR_ID = $cookies.get('mID');
                       DATA_FILE.save($scope.datafile).$promise.then(function (dfResonse) {
                            //then POST fileParts (Services populate PATH)
                            var fileParts = {
                                FileEntity: {
                                    FILETYPE_ID: $scope.aFile.FILETYPE_ID,
                                    FILE_URL: $scope.aFile.FILE_URL,
                                    FILE_DATE: $scope.aFile.FILE_DATE,
                                    DESCRIPTION: $scope.aFile.DESCRIPTION,
                                    SITE_ID: $scope.thisSensorSite.SITE_ID,
                                    DATA_FILE_ID: dfResonse.DATA_FILE_ID,
                                    PHOTO_DIRECTION: $scope.aFile.PHOTO_DIRECTION,
                                    LATITUDE_DD: $scope.aFile.LATITUDE_DD,
                                    LONGITUDE_DD: $scope.aFile.LONGITUDE_DD,
                                    INSTRUMENT_ID: thisSensor.Instrument.INSTRUMENT_ID
                                },
                                File: $scope.aFile.File
                            };
                            //need to put the fileParts into correct format for post
                            var fd = new FormData();
                            fd.append("FileEntity", JSON.stringify(fileParts.FileEntity));
                            fd.append("File", fileParts.File);
                            //now POST it (fileparts)
                            FILE.uploadFile(fd).$promise.then(function (fresponse) {
                                toastr.success("File Uploaded");
                                fresponse.fileBelongsTo = "DataFile File";
                                $scope.DepSensorFiles.push(fresponse);
                                $scope.allSFiles.push(fresponse);
                                Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                if (fresponse.FILETYPE_ID === 1) $scope.depSensImageFiles.push(fresponse);
                                $scope.showFileForm = false;
                            });
                        });
                   } else {
                       //it's not a data file, so do the source
                       var theSource = { SOURCE_NAME: $scope.aSource.FULLNAME, AGENCY_ID: $scope.aSource.AGENCY_ID, SOURCE_DATE: $scope.aSource.SOURCE_DATE };
                       SOURCE.save(theSource).$promise.then(function (response) {
                           //then POST fileParts (Services populate PATH)
                           var fileParts = {
                               FileEntity: {
                                   FILETYPE_ID: $scope.aFile.FILETYPE_ID,
                                   FILE_URL: $scope.aFile.FILE_URL,
                                   FILE_DATE: $scope.aFile.FILE_DATE,
                                   DESCRIPTION: $scope.aFile.DESCRIPTION,
                                   SITE_ID: $scope.thisSensorSite.SITE_ID,
                                   SOURCE_ID: response.SOURCE_ID,
                                   PHOTO_DIRECTION: $scope.aFile.PHOTO_DIRECTION,
                                   LATITUDE_DD: $scope.aFile.LATITUDE_DD,
                                   LONGITUDE_DD: $scope.aFile.LONGITUDE_DD,
                                   INSTRUMENT_ID: thisSensor.Instrument.INSTRUMENT_ID
                               },
                               File: $scope.aFile.File
                           };
                           //need to put the fileParts into correct format for post
                           var fd = new FormData();
                           fd.append("FileEntity", JSON.stringify(fileParts.FileEntity));
                           fd.append("File", fileParts.File);
                           //now POST it (fileparts)
                           FILE.uploadFile(fd).$promise.then(function (fresponse) {
                               toastr.success("File Uploaded");
                               fresponse.fileBelongsTo = "Sensor File";
                               $scope.DepSensorFiles.push(fresponse);
                               $scope.allSFiles.push(fresponse);
                               Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                               if (fresponse.FILETYPE_ID === 1) $scope.depSensImageFiles.push(fresponse);
                               $scope.showFileForm = false;
                           });
                       });//end source.save()
                   }//end if source
               }//end valid
           };//end create()

            //update this file
           $scope.saveFile = function (valid) {
               if (valid) {
                   //put source or datafile, put file
                   var whatkind = $scope.aFile.fileBelongsTo;
                   $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                   $http.defaults.headers.common.Accept = 'application/json';
                   if ($scope.datafile.DATA_FILE_ID !== undefined){
                       //has DATA_FILE
                           //check timezone and make sure date stays utc
                           if ($scope.datafile.TIME_ZONE != "UTC") {
                               //convert it
                               var utcStartDateTime = new Date($scope.datafile.GOOD_START).toUTCString();
                               var utcEndDateTime = new Date($scope.datafile.GOOD_END).toUTCString();
                               $scope.datafile.GOOD_START = utcStartDateTime;
                               $scope.datafile.GOOD_END = utcEndDateTime;
                               $scope.datafile.TIME_ZONE = 'UTC';
                           } else {
                               //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                               var si = $scope.datafile.GOOD_START.toString().indexOf('GMT') + 3;
                               var ei = $scope.datafile.GOOD_END.toString().indexOf('GMT') + 3;
                               $scope.datafile.GOOD_START = $scope.datafile.GOOD_START.toString().substring(0, si);
                               $scope.datafile.GOOD_END = $scope.datafile.GOOD_END.toString().substring(0, ei);
                           }
                           DATA_FILE.update({ id: $scope.datafile.DATA_FILE_ID }, $scope.datafile).$promise.then(function () {
                               FILE.update({ id: $scope.aFile.FILE_ID }, $scope.aFile).$promise.then(function (fileResponse) {
                                   toastr.success("File Updated");
                                   fileResponse.fileBelongsTo = "DataFile File";
                                   $scope.DepSensorFiles[$scope.existFileIndex] = fileResponse;
                                   $scope.allSFiles[$scope.allSFileIndex] = fileResponse;
                                   Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                   $scope.showFileForm = false;
                               });
                           });
                   } else {
                       //has SOURCE
                       $scope.aSource.SOURCE_NAME = $scope.aSource.FULLNAME;
                       SOURCE.update({ id: $scope.aSource.SOURCE_ID }, $scope.aSource).$promise.then(function () {
                           FILE.update({ id: $scope.aFile.FILE_ID }, $scope.aFile).$promise.then(function (fileResponse) {
                               toastr.success("File Updated");
                               fileResponse.fileBelongsTo = "Sensor File";
                               $scope.DepSensorFiles[$scope.existFileIndex] = fileResponse;
                               $scope.allSFiles[$scope.allSFileIndex] = fileResponse;
                               Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                               $scope.showFileForm = false;
                           });
                       });
                   }
               }//end valid
           };//end save()

            //delete this file
           $scope.deleteFile = function () {
               var DeleteModalInstance = $uibModal.open({
                   templateUrl: 'removemodal.html',
                   controller: 'ConfirmModalCtrl',
                   size: 'sm',
                   resolve: {
                       nameToRemove: function () {
                           return $scope.aFile;
                       },
                       what: function () {
                           return "File";
                       }
                   }
               });

               DeleteModalInstance.result.then(function (fileToRemove) {
                   $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                   FILE.delete({ id: fileToRemove.FILE_ID }).$promise.then(function () {
                       toastr.success("File Removed");
                       $scope.DepSensorFiles.splice($scope.existFileIndex, 1);
                       $scope.allSFiles.splice($scope.allSFileIndex, 1);
                       $scope.depSensImageFiles.splice($scope.existIMGFileIndex, 1);
                       Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                       $scope.showFileForm = false;
                   }, function error(errorResponse) {
                       toastr.error("Error: " + errorResponse.statusText);
                   });
               });//end DeleteModal.result.then
           };//end delete()

           $scope.cancelFile = function () {
               $scope.aFile = {};
               $scope.aSource = {};
               $scope.datafile = {};
               $scope.showFileForm = false;
           };
           //#endregion FILE STUFF


            //#region tape down section 
           $scope.addTapedown = false; //toggle tapedown section
           $scope.showTapedownPart = function () {
               if ($scope.addTapedown === true) {
                   //they are closing it. clear inputs and close
                   $scope.addTapedown = false;
               } else {
                   //they are opening to add tape down information
                   $scope.addTapedown = true;
               }
           };
           $scope.OPchosen = function () {
               //they picked an OP to use for tapedown
               var opName = $scope.OPsForTapeDown.filter(function (o) { return o.OBJECTIVE_TYPE_ID === $scope.OPMeasure.OBJECTIVE_TYPE_ID; })[0].NAME;
               $scope.OPMeasure.OP_NAME = opName;
               $scope.tapeDownTable.push($scope.OPMeasure);
           };
            //#endregion tape down section 

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
                   $scope.aSensStatus.TIME_STAMP = new Date($scope.aSensStatus.TIME_STAMP);//datetime is annoying
                   //if they changed Deployment_Type, Housing_Type, Sensor_Brand, or Sensor_Type -- update those fields for passing the model back

                   //also need: SITE_ID, EVENT_ID, INST_COLLECTION_ID (only for retrieval)
                   $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                   $http.defaults.headers.common.Accept = 'application/json';
                   INSTRUMENT.update({ id: $scope.aSensor.INSTRUMENT_ID }, $scope.aSensor).$promise.then(function (response) {
                       updatedSensor = response;
                       updatedSensor.Deployment_Type = $scope.aSensor.DEPLOYMENT_TYPE_ID > 0 ? $scope.depTypeList.filter(function (d) { return d.DEPLOYMENT_TYPE_ID == $scope.aSensor.DEPLOYMENT_TYPE_ID; })[0].METHOD : '';
                       updatedSensor.Housing_Type = $scope.aSensor.HOUSING_TYPE_ID > 0 ? $scope.houseTypeList.filter(function (h) { return h.HOUSING_TYPE_ID == $scope.aSensor.HOUSING_TYPE_ID; })[0].TYPE_NAME : '';
                       updatedSensor.Sensor_Brand = $scope.sensorBrandList.filter(function (s) { return s.SENSOR_BRAND_ID == $scope.aSensor.SENSOR_BRAND_ID; })[0].BRAND_NAME;
                       updatedSensor.Sensor_Type = $scope.sensorTypeList.filter(function (t) { return t.SENSOR_TYPE_ID == $scope.aSensor.SENSOR_TYPE_ID; })[0].SENSOR;

                       INSTRUMENT_STATUS.update({ id: $scope.aSensStatus.INSTRUMENT_STATUS_ID }, $scope.aSensStatus).$promise.then(function (statResponse) {
                           updatedSenStat = statResponse;
                           updatedSenStat.Status = 'Deployed';
                           var eDstatdate = getTimeZoneStamp(updatedSenStat.TIME_STAMP.slice(0, -1)); //remove 'z' on end
                           updatedSenStat.TIME_STAMP = eDstatdate[0]; //this keeps it as utc in display
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
                   $scope.aSensStatus.MEMBER_ID = $cookies.get('mID'); //user that logged in is deployer
                   var createdSensor = {}; var depSenStat = {};
                   $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                   $http.defaults.headers.common.Accept = 'application/json';

                   //DEPLOY PROPOSED or CREATE NEW deployment?
                   if ($scope.aSensor.INSTRUMENT_ID !== undefined) {
                       //put instrument, post status for deploying PROPOSED sensor
                       INSTRUMENT.update({ id: $scope.aSensor.INSTRUMENT_ID }, $scope.aSensor).$promise.then(function (response) {
                           //create instrumentstatus too need: STATUS_TYPE_ID and INSTRUMENT_ID
                           createdSensor = response;
                           createdSensor.Deployment_Type = $scope.aSensor.Deployment_Type;
                           createdSensor.Housing_Type = response.HOUSING_TYPE_ID > 0 ? $scope.houseTypeList.filter(function (h) { return h.HOUSING_TYPE_ID == response.HOUSING_TYPE_ID; })[0].TYPE_NAME: '';
                           createdSensor.Sensor_Brand = $scope.sensorBrandList.filter(function (s) { return s.SENSOR_BRAND_ID == response.SENSOR_BRAND_ID; })[0].BRAND_NAME;
                           createdSensor.Sensor_Type = $scope.sensorTypeList.filter(function (t) { return t.SENSOR_TYPE_ID == response.SENSOR_TYPE_ID; })[0].SENSOR;
                           $scope.aSensStatus.INSTRUMENT_ID = response.INSTRUMENT_ID;
                           INSTRUMENT_STATUS.save($scope.aSensStatus).$promise.then(function (statResponse) {
                               //build the createdSensor to send back and add to the list page
                               depSenStat = statResponse;
                               //add Status
                               depSenStat.Status = 'Deployed';
                               var d = getTimeZoneStamp(depSenStat.TIME_STAMP.slice(0, -1)); //remove 'z' on end
                               depSenStat.TIME_STAMP = d[0]; //this keeps it as utc in display
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
                       //post instrument and status for deploying NEW sensor
                       INSTRUMENT.save($scope.aSensor).$promise.then(function (response) {
                           //create instrumentstatus too need: STATUS_TYPE_ID and INSTRUMENT_ID
                           createdSensor = response;
                           createdSensor.Deployment_Type = response.DEPLOYMENT_TYPE_ID !== null  ? $scope.depTypeList.filter(function (d) { return d.DEPLOYMENT_TYPE_ID == response.DEPLOYMENT_TYPE_ID; })[0].METHOD : "";
                           createdSensor.Housing_Type = response.HOUSING_TYPE_ID > 0 ? $scope.houseTypeList.filter(function (h) { return h.HOUSING_TYPE_ID == response.HOUSING_TYPE_ID;})[0].TYPE_NAME: '';
                           createdSensor.Sensor_Brand = $scope.sensorBrandList.filter(function (s) { return s.SENSOR_BRAND_ID == response.SENSOR_BRAND_ID;})[0].BRAND_NAME;
                           createdSensor.Sensor_Type = $scope.sensorTypeList.filter(function (t) { return t.SENSOR_TYPE_ID == response.SENSOR_TYPE_ID; })[0].SENSOR;
                           $scope.aSensStatus.INSTRUMENT_ID = response.INSTRUMENT_ID;

                           INSTRUMENT_STATUS.save($scope.aSensStatus).$promise.then(function (statResponse) {
                               //build the createdSensor to send back and add to the list page
                               depSenStat = statResponse;
                               depSenStat.Status = 'Deployed';
                               var ud = getTimeZoneStamp(depSenStat.TIME_STAMP.slice(0, -1)); //remove 'z' on end
                               depSenStat.TIME_STAMP = ud[0]; //this keeps it as utc in display
                               var sensorObjectToSendBack = {
                                   Instrument: createdSensor,
                                   InstrumentStats: [depSenStat]
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
                   $scope.previousStateStatus = angular.copy(thisSensor.InstrumentStats[0]); //hold the proposed state (proposed to deployed)
                   $scope.whichButton = 'deployP';
                   $scope.aSensor.INTERVAL = $scope.aSensor.INTERVAL === 0 ? '' : $scope.aSensor.INTERVAL; //clear out the '0' value here               
                   $scope.aSensStatus.Status = "Deployed";
                   //displaying date / time it user's timezone
                   var timeParts = getTimeZoneStamp();
                   $scope.aSensStatus.TIME_STAMP = timeParts[0];
                   $scope.aSensStatus.TIME_ZONE = timeParts[1]; //will be converted to utc on post/put
                   $scope.aSensStatus.MEMBER_ID = $cookies.get('mID'); // member logged in is deploying it
                   $scope.EventName = $cookies.get('SessionEventName');
                   $scope.Deployer = $scope.LoggedInMember;
               } else {
                   //editing deployed
                   $scope.whichButton = 'edit';
                   $scope.aSensor.INTERVAL = $scope.aSensor.INTERVAL === 0 ? '' : $scope.aSensor.INTERVAL; //clear out the '0' value here   
                   //get this deployed sensor's event name
                   $scope.EventName = $scope.eventList.filter(function (e) { return e.EVENT_ID == $scope.aSensor.EVENT_ID; })[0].EVENT_NAME;
                   //date formatting. this keeps it in utc for display
                   var editDeptimeParts = getTimeZoneStamp($scope.aSensStatus.TIME_STAMP);
                   $scope.aSensStatus.TIME_STAMP = editDeptimeParts[0];   
                   //get collection member's name 
                   $scope.Deployer = $scope.aSensStatus.MEMBER_ID !== null || $scope.aSensStatus.MEMBER_ID !== undefined ? allMembers.filter(function (m) { return m.MEMBER_ID == $scope.aSensStatus.MEMBER_ID; })[0] : {};
               }
               //#endregion existing Sensor
           } else {
               //#region Deploying new Sensor
               $scope.whichButton = 'deploy';
               $scope.IntervalType.type = 'Seconds'; //default
               //displaying date / time it user's timezone
               var DeptimeParts = getTimeZoneStamp();
               $scope.aSensStatus.TIME_STAMP = DeptimeParts[0];
               $scope.aSensStatus.TIME_ZONE = DeptimeParts[1]; //will be converted to utc on post/put          
               $scope.aSensStatus.MEMBER_ID = $cookies.get('mID'); // member logged in is deploying it
               $scope.EventName = $cookies.get('SessionEventName');
               $scope.Deployer = $scope.LoggedInMember;           
               //#endregion new Sensor
           }
        }]); //end SENSOR

    // Retrieve a Sensor modal
    ModalControllers.controller('sensorRetrievalModalCtrl', ['$scope', '$timeout', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'thisSensor', 'SensorSite', 'siteOPs', 'allEventList', 'allMembers', 'allStatusTypes', 'allInstCollCond', 'INSTRUMENT', 'INSTRUMENT_STATUS',
        function ($scope, $timeout, $cookies, $http, $uibModalInstance, $uibModal, thisSensor, SensorSite, siteOPs, allEventList, allMembers, allStatusTypes, allInstCollCond, INSTRUMENT, INSTRUMENT_STATUS) {
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
            //formatter for date/time and chosen zone based on their location
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

            //default formatting for retrieval
            var dtparts = getTimeZoneStamp();
            $scope.aRetrieval = {TIME_STAMP: dtparts[0], TIME_ZONE: dtparts[1], INSTRUMENT_ID: $scope.aSensor.INSTRUMENT_ID, MEMBER_ID: $cookies.get('mID')};
            $scope.Retriever = allMembers.filter(function (am) { return am.MEMBER_ID == $cookies.get('mID'); })[0];

            //is it UTC or local time..make sure it stays UTC
            var dealWithTimeStampb4Send = function () {
                //check and see if they are not using UTC
                if ($scope.aRetrieval.TIME_ZONE != "UTC") {
                    //convert it
                    var utcDateTime = new Date($scope.aRetrieval.TIME_STAMP).toUTCString();
                    $scope.aRetrieval.TIME_STAMP = utcDateTime;
                    $scope.aRetrieval.TIME_ZONE = 'UTC';
                } else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.aRetrieval.TIME_STAMP.toString().indexOf('GMT') + 3;
                    $scope.aRetrieval.TIME_STAMP = $scope.aRetrieval.TIME_STAMP.toString().substring(0, i);
                }
            };

            //cancel
            $scope.cancel = function () {           
                $uibModalInstance.dismiss('cancel');
            };

            $scope.retrieveS = function (valid) {
                if (valid) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    var updatedSensor = {}; var createRetSens = {};
                    dealWithTimeStampb4Send(); //UTC or local?

                    INSTRUMENT.update({ id: $scope.aSensor.INSTRUMENT_ID }, $scope.aSensor).$promise.then(function (response) {
                        //create instrumentstatus too need: STATUS_TYPE_ID and INSTRUMENT_ID
                        updatedSensor = response;
                        updatedSensor.Deployment_Type = $scope.aSensor.Deployment_Type;
                        updatedSensor.Housing_Type = $scope.aSensor.Housing_Type;
                        updatedSensor.Sensor_Brand = $scope.aSensor.Sensor_Brand;
                        updatedSensor.Sensor_Type = $scope.aSensor.Sensor_Type;
                        updatedSensor.Inst_Collection = $scope.collectCondList.filter(function (i){return i.ID === $scope.aSensor.INST_COLLECTION_ID;})[0].CONDITION;

                        INSTRUMENT_STATUS.save($scope.aRetrieval).$promise.then(function (statResponse) {
                            //build the createdSensor to send back and add to the list page
                            createRetSens = statResponse;
                            createRetSens.Status = 'Retrieved';
                            var rud = getTimeZoneStamp(createRetSens.TIME_STAMP.slice(0, -1)); //remove 'z' on end
                            createRetSens.TIME_STAMP = rud[0]; //this keeps it as utc in display
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

    // view/edit retrieved sensor (deployed included here) modal
    ModalControllers.controller('fullSensorModalCtrl', ['$scope', '$filter', '$timeout', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'allDepDropdowns', 'allStatusTypes', 'allInstCollCond', 'allEvents', 'allDepTypes', 'thisSensor', 'SensorSite', 'siteOPs', 'allMembers', 'INSTRUMENT', 'INSTRUMENT_STATUS', 
        function ($scope, $filter, $timeout, $cookies, $http, $uibModalInstance, $uibModal, allDepDropdowns, allStatusTypes, allInstCollCond, allEvents, allDepTypes, thisSensor, SensorSite, siteOPs, allMembers, INSTRUMENT, INSTRUMENT_STATUS) {
            $(".page-loading").addClass("hidden"); //loading...
            /*allSensorTypes, allSensorBrands, allHousingTypes, allSensDeps*/
            $scope.sensorTypeList = allDepDropdowns[0];
            $scope.sensorBrandList = allDepDropdowns[1];
            $scope.houseTypeList = allDepDropdowns[2];
            $scope.sensorDeployList = allDepDropdowns[3];
            $scope.collectCondList = allInstCollCond;
            $scope.OPsForTapeDown = siteOPs;
            $scope.depTypeList = allDepTypes; //get fresh version so not messed up with the Temperature twice
            $scope.filteredDeploymentTypes = []; //will be populated based on the sensor type chosen
            $scope.timeZoneList = ['UTC', 'PST', 'MST', 'CST', 'EST'];
            $scope.statusTypeList = allStatusTypes.filter(function (s) { return s.STATUS !== 'Proposed' || s.STATUS !== 'Deployed'; });
            //default setting for interval
            $scope.IntervalType = { type: 'Seconds' };
            //ng-show determines whether they are editing or viewing details
            $scope.view = { DEPval: 'detail', RETval: 'detail' };
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
            $scope.addTapedown = false; //toggle tapedown section
            $scope.showTapedownPart = function () {
                if ($scope.addTapedown === true) {
                    //they are closing it. clear inputs and close
                    $scope.addTapedown = false;
                } else {
                    //they are opening to add tape down information
                    $scope.addTapedown = true;
                }
            };

            $scope.thisSensorSite = SensorSite; $scope.userRole = $cookies.get('usersRole');

            $scope.sensor = thisSensor.Instrument;
            //deploy part //////////////////
            $scope.DeployedSensorStat = thisSensor.InstrumentStats.filter(function (inst) { return inst.Status === "Deployed"; })[0];
            var dstatdate = getTimeZoneStamp($scope.DeployedSensorStat.TIME_STAMP);
            $scope.DeployedSensorStat.TIME_STAMP = dstatdate[0]; //this keeps it as utc in display
            $scope.Deployer = allMembers.filter(function (m) { return m.MEMBER_ID === $scope.DeployedSensorStat.MEMBER_ID; })[0];
            //retrieve part //////////////////
            $scope.RetrievedSensorStat = thisSensor.InstrumentStats.filter(function (inst) { return inst.Status === "Retrieved"; })[0];
            var rstatdate = getTimeZoneStamp($scope.RetrievedSensorStat.TIME_STAMP);
            $scope.RetrievedSensorStat.TIME_STAMP = rstatdate[0]; //this keeps it as utc in display
            $scope.Retriever = allMembers.filter(function (m) { return m.MEMBER_ID === $scope.RetrievedSensorStat.MEMBER_ID; })[0];
            //only need retrieved and lost statuses
            
            $scope.EventName = allEvents.filter(function (e) { return e.EVENT_ID === $scope.sensor.EVENT_ID; })[0].EVENT_NAME;
            
            //accordion open/close glyphs
            $scope.s = { depOpen: false, retOpen: true };

            //#region datetimepicker
            $scope.dateOptions = {
                startingDay: 1,
                showWeeks: false
            };
            $scope.open = function ($event, which) {
                $event.preventDefault();
                $event.stopPropagation();

                $scope.datepickrs[which] = true;
            };
            //#endregion

            // is interval is number
            $scope.isNum = function (evt) {
                var theEvent = evt || window.event;
                var key = theEvent.keyCode || theEvent.which;
                if (key != 46 && key != 45 && key > 31 && (key < 48 || key > 57)) {
                    theEvent.returnValue = false;
                    if (theEvent.preventDefault) theEvent.preventDefault();
                }
            };

            //get deployment types for sensor type chosen
            $scope.getDepTypes = function (sensType) {
                $scope.filteredDeploymentTypes = [];
                var matchingSensDeplist = $scope.sensorDeployList.filter(function (sd) { return sd.SENSOR_TYPE_ID == sensType.SENSOR_TYPE_ID; });

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

            $scope.getDepTypes($scope.sensor); //call it first time through

            //cancel
            $scope.cancel = function () {
                var sensorObjectToSendBack = {
                    Instrument: $scope.sensor,
                    InstrumentStats: [$scope.RetrievedSensorStat, $scope.DeployedSensorStat]
                };
                $timeout(function () {
                    // anything you want can go here and will safely be run on the next digest.                   
                    var sendBack = [sensorObjectToSendBack];
                    $uibModalInstance.close(sendBack);
                });               
                //$uibModalInstance.dismiss('cancel');
            };

            //is it UTC or local time..make sure it stays UTC
            var dealWithTimeStampb4Send = function (w) {
                //deployed or retrieved??      
                var utcDateTime; var i;
                if (w === 'deployed') {
                    //check and see if they are not using UTC
                    if ($scope.depStuffCopy[1].TIME_ZONE != "UTC") {
                        //convert it
                        utcDateTime = new Date($scope.depStuffCopy[1].TIME_STAMP).toUTCString();
                        $scope.depStuffCopy[1].TIME_STAMP = utcDateTime;
                        $scope.depStuffCopy[1].TIME_ZONE = 'UTC';
                    } else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        i = $scope.depStuffCopy[1].TIME_STAMP.toString().indexOf('GMT') + 3;
                        $scope.depStuffCopy[1].TIME_STAMP = $scope.depStuffCopy[1].TIME_STAMP.toString().substring(0, i);
                    }
                } else {
                    //check and see if they are not using UTC
                    if ($scope.retStuffCopy[1].TIME_ZONE != "UTC") {
                        //convert it
                        utcDateTime = new Date($scope.retStuffCopy[1].TIME_STAMP).toUTCString();
                        $scope.retStuffCopy[1].TIME_STAMP = utcDateTime;
                        $scope.retStuffCopy[1].TIME_ZONE = 'UTC';
                    } else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        i = $scope.retStuffCopy[1].TIME_STAMP.toString().indexOf('GMT') + 3;
                        $scope.retStuffCopy[1].TIME_STAMP = $scope.retStuffCopy[1].TIME_STAMP.toString().substring(0, i);
                    }
                }
            };

            //#region deploy edit
            //edit button clicked. make copy of deployed info 
            $scope.wannaEditDep = function () {
                $scope.view.DEPval = 'edit';
                $scope.depStuffCopy = [angular.copy($scope.sensor), angular.copy($scope.DeployedSensorStat)];
            };

            //save Deployed sensor info
            $scope.saveDeployed = function (valid) {
                if (valid) {                    
                    var updatedSensor = {}; var updatedSenStat = {};
                    //see if they used Minutes or seconds for interval. need to store in seconds
                    if ($scope.IntervalType.type == "Minutes")
                        $scope.depStuffCopy[0].INTERVAL = $scope.depStuffCopy[0].INTERVAL * 60;
                    dealWithTimeStampb4Send('deployed'); //UTC or local?
                    $scope.depStuffCopy[1].TIME_STAMP = new Date($scope.depStuffCopy[1].TIME_STAMP);//datetime is annoying
                    //if they changed Deployment_Type, Housing_Type, Sensor_Brand, or Sensor_Type -- update those fields for passing the model back
                    
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    INSTRUMENT.update({ id: $scope.depStuffCopy[0].INSTRUMENT_ID }, $scope.depStuffCopy[0]).$promise.then(function (response) {
                        updatedSensor = response;
                        updatedSensor.Deployment_Type = $scope.depStuffCopy[0].DEPLOYMENT_TYPE_ID > 0 ? $scope.depTypeList.filter(function (d) { return d.DEPLOYMENT_TYPE_ID === $scope.depStuffCopy[0].DEPLOYMENT_TYPE_ID; })[0].METHOD : '';
                        updatedSensor.Housing_Type = $scope.depStuffCopy[0].HOUSING_TYPE_ID > 0 ? $scope.houseTypeList.filter(function (h) { return h.HOUSING_TYPE_ID === $scope.depStuffCopy[0].HOUSING_TYPE_ID; })[0].TYPE_NAME : '';
                        updatedSensor.Sensor_Brand = $scope.sensorBrandList.filter(function (s) { return s.SENSOR_BRAND_ID === $scope.depStuffCopy[0].SENSOR_BRAND_ID; })[0].BRAND_NAME;
                        updatedSensor.Sensor_Type = $scope.sensorTypeList.filter(function (t) { return t.SENSOR_TYPE_ID === $scope.depStuffCopy[0].SENSOR_TYPE_ID; })[0].SENSOR;
                        updatedSensor.Inst_Collection = $scope.collectCondList.filter(function (i) { return i.ID === $scope.depStuffCopy[0].INST_COLLECTION_ID; })[0].CONDITION;
                        INSTRUMENT_STATUS.update({ id: $scope.depStuffCopy[1].INSTRUMENT_STATUS_ID }, $scope.depStuffCopy[1]).$promise.then(function (statResponse) {
                            updatedSenStat = statResponse;                            
                            updatedSenStat.Status = $scope.statusTypeList.filter(function (sta) { return sta.STATUS_TYPE_ID === $scope.depStuffCopy[1].STATUS_TYPE_ID; })[0].STATUS;
                            $scope.sensor = updatedSensor;
                            $scope.DeployedSensorStat = updatedSenStat;
                            var editedDstatdate = getTimeZoneStamp($scope.DeployedSensorStat.TIME_STAMP.slice(0,-1)); //remove 'z' on end
                            $scope.DeployedSensorStat.TIME_STAMP = editedDstatdate[0]; //this keeps it as utc in display
                            $scope.depStuffCopy = [];
                            $scope.IntervalType = { type: 'Seconds' };
                            $scope.view.DEPval = 'detail';
                    
                        });
                    });
                }
            };//end saveDeployed()

            //never mind, don't want to edit deployed sensor
            $scope.cancelDepEdit = function () {
                $scope.view.DEPval = 'detail';
                $scope.depStuffCopy = [];
            };
            //#endregion deploy edit

            //#region Retrieve edit
            //edit button clicked. make copy of deployed info 
            $scope.wannaEditRet = function () {
                $scope.view.RETval = 'edit';
                $scope.retStuffCopy = [angular.copy($scope.sensor), angular.copy($scope.RetrievedSensorStat)];
            };
            
            //save Retrieved sensor info
            $scope.saveRetrieved = function (valid) {
                if (valid) {
                    var updatedRetSensor = {}; var updatedRetSenStat = {};
                    dealWithTimeStampb4Send('retrieved'); //UTC or local?
                    $scope.retStuffCopy[1].TIME_STAMP = new Date($scope.retStuffCopy[1].TIME_STAMP);//datetime is annoying
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    INSTRUMENT.update({ id: $scope.retStuffCopy[0].INSTRUMENT_ID }, $scope.retStuffCopy[0]).$promise.then(function (response) {
                        updatedRetSensor = response;
                        updatedRetSensor.Deployment_Type = $scope.retStuffCopy[0].DEPLOYMENT_TYPE_ID > 0 ? $scope.depTypeList.filter(function (d) { return d.DEPLOYMENT_TYPE_ID === $scope.retStuffCopy[0].DEPLOYMENT_TYPE_ID; })[0].METHOD : '';
                        updatedRetSensor.Housing_Type = $scope.retStuffCopy[0].HOUSING_TYPE_ID > 0 ? $scope.houseTypeList.filter(function (h) { return h.HOUSING_TYPE_ID === $scope.retStuffCopy[0].HOUSING_TYPE_ID; })[0].TYPE_NAME : '';
                        updatedRetSensor.Sensor_Brand = $scope.sensorBrandList.filter(function (s) { return s.SENSOR_BRAND_ID === $scope.retStuffCopy[0].SENSOR_BRAND_ID; })[0].BRAND_NAME;
                        updatedRetSensor.Sensor_Type = $scope.sensorTypeList.filter(function (t) { return t.SENSOR_TYPE_ID === $scope.retStuffCopy[0].SENSOR_TYPE_ID; })[0].SENSOR;
                        updatedRetSensor.Inst_Collection = $scope.collectCondList.filter(function (i) { return i.ID === $scope.retStuffCopy[0].INST_COLLECTION_ID; })[0].CONDITION;
                        INSTRUMENT_STATUS.update({ id: $scope.retStuffCopy[1].INSTRUMENT_STATUS_ID }, $scope.retStuffCopy[1]).$promise.then(function (statResponse) {
                            updatedRetSenStat = statResponse;
                            updatedRetSenStat.Status = $scope.statusTypeList.filter(function (sta) { return sta.STATUS_TYPE_ID === $scope.retStuffCopy[1].STATUS_TYPE_ID; })[0].STATUS;
                            $scope.sensor = updatedRetSensor;
                            $scope.RetrievedSensorStat = updatedRetSenStat;
                            var editedRstatdate = getTimeZoneStamp($scope.RetrievedSensorStat.TIME_STAMP.slice(0, -1)); //remove 'z' on end
                            $scope.RetrievedSensorStat.TIME_STAMP = editedRstatdate[0]; //this keeps it as utc in display
                            $scope.retStuffCopy = [];
                            $scope.view.RETval = 'detail';
                        });
                    });
                }
        };//end saveDeployed()            

            //never mind, don't want to edit retrieved sensor
            $scope.cancelRetEdit = function () {
                $scope.view.RETval = 'detail';
                $scope.retStuffCopy = [];
            };
            //#endregion Retrieve edit

            //delete aSensor and sensor statuses
            $scope.deleteS = function () {
                //TODO:: Delete the files for this sensor too or reassign to the Site?? Services or client handling?
                var DeleteModalInstance = $uibModal.open({
                    templateUrl: 'removemodal.html',
                    controller: 'ConfirmModalCtrl',
                    size: 'sm',
                    resolve: {
                        nameToRemove: function () {
                            return $scope.sensor;
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

    }]);//end fullSensorModalCtrl
})();