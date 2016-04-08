(function () {
    'use strict';

    var ModalControllers = angular.module('ModalControllers');

    //deploy new or proposed sensor, edit deployed modal
    ModalControllers.controller('sensorModalCtrl', ['$scope', '$rootScope', '$timeout', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'SERVER_URL', 'allDropdowns', 'agencyList', 'Site_Files', 'allDepTypes', 'thisSensor', 'SensorSite', 'siteOPs', 'allMembers', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'DATA_FILE', 'FILE', 'SOURCE','OP_MEASURE',
        function ($scope, $rootScope, $timeout, $cookies, $http, $uibModalInstance, $uibModal, SERVER_URL, allDropdowns, agencyList, Site_Files, allDepTypes, thisSensor, SensorSite, siteOPs, allMembers, INSTRUMENT, INSTRUMENT_STATUS, DATA_FILE, FILE, SOURCE, OP_MEASURE) {
           //dropdowns [0]allSensorTypes, [1]allSensorBrands, [2]allHousingTypes, [3]allSensDeps, [4]allEvents      
           $scope.sensorTypeList = allDropdowns[0];
           $scope.sensorBrandList = allDropdowns[1];
           $scope.houseTypeList = allDropdowns[2];
           $scope.sensorDeployList = allDropdowns[3];
           $scope.eventList = allDropdowns[4];
           $scope.fileTypeList = allDropdowns[5]; //used if creating/editing depSens file
           $scope.vertDatumList = allDropdowns[6];
           $scope.allSFiles = Site_Files.getAllSiteFiles();
           $scope.DepSensorFiles = thisSensor !== "empty" ? $scope.allSFiles.filter(function (sf) { return sf.INSTRUMENT_ID == thisSensor.Instrument.INSTRUMENT_ID; }) : [];// holder for hwm files added
           $scope.depSensImageFiles = $scope.DepSensorFiles.filter(function (hf) { return hf.FILETYPE_ID === 1; }); //image files for carousel
           $scope.showFileForm = false; //hidden form to add file to hwm

           $scope.OPsForTapeDown = siteOPs;
           $scope.removeOPList = [];
           $scope.tapeDownTable = []; //holder of tapedown OP_MEASUREMENTS
           $scope.depTypeList = allDepTypes; //get fresh version so not messed up with the Temperature twice
           $scope.filteredDeploymentTypes = [];
           $scope.timeZoneList = ['UTC', 'PST', 'MST', 'CST', 'EST'];
           $scope.userRole = $cookies.get('usersRole');
           $scope.showEventDD = false; //toggle to show/hide event dd (admin only)
           $scope.adminChanged = {}; //will hold EVENT_ID if admin changes it. apply when PUTting
           $scope.IntervalType = {}; //holder for minute/second radio buttons
           $scope.whichButton = ""; //holder for save/deploy button at end .. 'deploy' if proposed->deployed, and for deploying new or save if editing existing
           $scope.serverURL = SERVER_URL;
           //formatting date and time properly for chrome and ff
           var getDateTimeParts = function (d) {
               var y = d.substr(0, 4);
               var m = d.substr(5, 2) - 1; //subtract 1 for index value (January is 0)
               var da = d.substr(8, 2);
               var h = d.substr(11, 2);
               var mi = d.substr(14, 2);
               var sec = d.substr(17, 2);
               var theDate = new Date(y, m, da, h, mi, sec);
               return theDate;
           };

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
                       '<div class="modal-body"><img ng-src="{{setSRC}}" /></div>' +
                       '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                   controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                       $scope.ok = function () {
                           $uibModalInstance.close();
                       };
                       $scope.imageId = image;
                       $scope.setSRC = SERVER_URL + '/Files/' + $scope.imageId + '/Item';
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
                           $scope.datafile.GOOD_START = getDateTimeParts($scope.datafile.GOOD_START);
                           $scope.datafile.GOOD_END = getDateTimeParts($scope.datafile.GOOD_END);
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
                   backdrop: 'static',
                   keyboard: false,
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
               if ($scope.addTapedown) {
                   //they are closing it. clear inputs and close
                   $scope.addTapedown = false;
               } else {
                   //they are opening to add tape down information
                   $scope.addTapedown = true;
               }
           };
           $scope.OPchosen = function (opChosen) {
               var opI = $scope.OPsForTapeDown.map(function (o) { return o.OBJECTIVE_POINT_ID; }).indexOf(opChosen.OBJECTIVE_POINT_ID);               
               if (opChosen.selected) {
                   //they picked an OP to use for tapedown
                   $scope.OPMeasure = {};
                   $scope.OPMeasure.OP_NAME = opChosen.NAME;
                   $scope.OPMeasure.elevation = opChosen.ELEV_FT;
                   $scope.OPMeasure.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.DATUM_ID == opChosen.VDATUM_ID; })[0].DATUM_ABBREVIATION;
                   $scope.OPMeasure.OBJECTIVE_POINT_ID = opChosen.OBJECTIVE_POINT_ID;
                   //$scope.OPMeasure.OP_NAME = opName;
                   $scope.tapeDownTable.push($scope.OPMeasure);
               } else {
                   //they unchecked the op to remove
                   //ask them are they sure?
                   var removeOPMeas = $uibModal.open({
                       backdrop: 'static',
                       keyboard: false,
                       template: '<div class="modal-header"><h3 class="modal-title">Remove OP Measure</h3></div>' +
                           '<div class="modal-body"><p>Are you sure you want to remove this OP Measurement from this sensor?</p></div>' +
                           '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button><button class="btn btn-primary" ng-click="cancel()">Cancel</button></div>',
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
                           //add to remove it list
                           var tapeDownToRemove = $scope.tapeDownTable.filter(function (a) { return a.OBJECTIVE_POINT_ID == opChosen.OBJECTIVE_POINT_ID; })[0];
                           var tInd = $scope.tapeDownTable.map(function (o) { return o.OBJECTIVE_POINT_ID; }).indexOf(tapeDownToRemove.OBJECTIVE_POINT_ID);
                           if (tapeDownToRemove.OP_MEASUREMENTS_ID !== undefined) $scope.removeOPList.push(tapeDownToRemove.OP_MEASUREMENTS_ID);
                           $scope.tapeDownTable.splice(tInd, 1);
                       } else {
                           //never mind, make it selected again
                           $scope.OPsForTapeDown[opI].selected = true;
                       }
                       
                   });
               }
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
               $rootScope.stateIsLoading.showLoading = false; // loading.. 
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
                           //deal with tapedowns. remove/add
                           for (var rt = 0; rt < $scope.removeOPList.length; rt++) {
                               var idToRemove = $scope.removeOPList[rt];
                               OP_MEASURE.delete({ id: idToRemove }).$promise;
                           }
                           for (var at = 0; at < $scope.tapeDownTable.length; at++) {
                               var thisTape = $scope.tapeDownTable[at];
                               if (thisTape.OP_MEASUREMENTS_ID !== undefined) {
                                   //existing, put in case they changed it
                                   OP_MEASURE.update({ id: thisTape.OP_MEASUREMENTS_ID }, thisTape).$promise;
                               } else {
                                   //new one added, post
                                   thisTape.INSTRUMENT_STATUS_ID = statResponse.INSTRUMENT_STATUS_ID;
                                   OP_MEASURE.addInstStatMeasure({ instrumentStatusId: statResponse.INSTRUMENT_STATUS_ID }, thisTape).$promise;
                               }
                           }
                           //now add instrument and instrument status to send back
                           updatedSenStat = statResponse;
                           updatedSenStat.Status = 'Deployed';
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
                               //any tape downs?
                               if ($scope.tapeDownTable.length > 0) {
                                   for (var t = 0; t < $scope.tapeDownTable.length; t++) {
                                       var thisTape = $scope.tapeDownTable[t];
                                       thisTape.INSTRUMENT_STATUS_ID = statResponse.INSTRUMENT_STATUS_ID;
                                       ///POST IT///
                                       OP_MEASURE.addInstStatMeasure({ instrumentStatusId: statResponse.INSTRUMENT_STATUS_ID }, thisTape).$promise;
                                   }
                               }
                               //build the createdSensor to send back and add to the list page
                               depSenStat = statResponse;
                               //add Status
                               depSenStat.Status = 'Deployed';
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
                       var test;
                       INSTRUMENT.save($scope.aSensor).$promise.then(function (response) {
                           //create instrumentstatus too need: STATUS_TYPE_ID and INSTRUMENT_ID
                           createdSensor = response;
                           createdSensor.Deployment_Type = response.DEPLOYMENT_TYPE_ID !== null  ? $scope.depTypeList.filter(function (d) { return d.DEPLOYMENT_TYPE_ID == response.DEPLOYMENT_TYPE_ID; })[0].METHOD : "";
                           createdSensor.Housing_Type = response.HOUSING_TYPE_ID > 0 ? $scope.houseTypeList.filter(function (h) { return h.HOUSING_TYPE_ID == response.HOUSING_TYPE_ID;})[0].TYPE_NAME: '';
                           createdSensor.Sensor_Brand = $scope.sensorBrandList.filter(function (s) { return s.SENSOR_BRAND_ID == response.SENSOR_BRAND_ID;})[0].BRAND_NAME;
                           createdSensor.Sensor_Type = $scope.sensorTypeList.filter(function (t) { return t.SENSOR_TYPE_ID == response.SENSOR_TYPE_ID; })[0].SENSOR;
                           $scope.aSensStatus.INSTRUMENT_ID = response.INSTRUMENT_ID;

                           INSTRUMENT_STATUS.save($scope.aSensStatus).$promise.then(function (statResponse) {
                               //any tape downs?
                               if ($scope.tapeDownTable.length > 0){
                                   for (var t = 0; t < $scope.tapeDownTable.length; t++){
                                       var thisTape = $scope.tapeDownTable[t];
                                       thisTape.INSTRUMENT_STATUS_ID = statResponse.INSTRUMENT_STATUS_ID;
                                       ///POST IT///
                                       OP_MEASURE.addInstStatMeasure({ instrumentStatusId: statResponse.INSTRUMENT_STATUS_ID }, thisTape).$promise;
                                   } 
                               }
                               //build the createdSensor to send back and add to the list page
                               depSenStat = statResponse;
                               depSenStat.Status = 'Deployed';
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
                   backdrop: 'static',
                   keyboard: false,
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
                       $scope.DepSensorFiles = []; //clear out sensorFiles for this sensor
                       $scope.depSensImageFiles = []; //clear out image files for this sensor
                       //now remove all these files from SiteFiles
                       var l = $scope.allSFiles.length;
                       while (l--) {
                           if ($scope.allSFiles[l].INSTRUMENT_ID == sensorToRemove.INSTRUMENT_ID) $scope.allSFiles.splice(l, 1);
                       }
                       //updates the file list on the sitedashboard
                       Site_Files.setAllSiteFiles($scope.allSFiles);
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
                   $scope.aSensor.INTERVAL = $scope.aSensor.INTERVAL === 0 ? null : $scope.aSensor.INTERVAL; //clear out the '0' value here               
                   //$scope.aSensStatus.Status = "Deployed";
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
                   $scope.aSensor.INTERVAL = $scope.aSensor.INTERVAL === 0 ? null : $scope.aSensor.INTERVAL; //clear out the '0' value here   
                   //get this deployed sensor's event name
                   $scope.EventName = $scope.eventList.filter(function (e) { return e.EVENT_ID == $scope.aSensor.EVENT_ID; })[0].EVENT_NAME;
                   //date formatting. this keeps it in utc for display
                   $scope.aSensStatus.TIME_STAMP = getDateTimeParts($scope.aSensStatus.TIME_STAMP);
                   //get collection member's name 
                   $scope.Deployer = $scope.aSensStatus.MEMBER_ID !== null || $scope.aSensStatus.MEMBER_ID !== undefined ? allMembers.filter(function (m) { return m.MEMBER_ID == $scope.aSensStatus.MEMBER_ID; })[0] : {};
                   OP_MEASURE.getInstStatOPMeasures({instrumentStatusId: $scope.aSensStatus.INSTRUMENT_STATUS_ID}).$promise.then(function(response){
                       for (var r = 0; r < response.length; r++) {
                           var sensMeasures = response[r];
                           var whichOP = siteOPs.filter(function (op) { return op.OBJECTIVE_POINT_ID == response[r].OBJECTIVE_POINT_ID; })[0];
                           sensMeasures.elevation = whichOP.ELEV_FT;
                           sensMeasures.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.DATUM_ID == whichOP.VDATUM_ID; })[0].DATUM_ABBREVIATION;
                           sensMeasures.OP_NAME = whichOP.NAME;
                           $scope.tapeDownTable.push(sensMeasures);
                       }
                        //go through OPsForTapeDown and add selected Property.
                       for (var i = 0; i < $scope.OPsForTapeDown.length; i++) {
                           //for each one, if response has this id, add 'selected:true' else add 'selected:false'
                           for (var y = 0; y < response.length; y++) {
                               if (response[y].OBJECTIVE_POINT_ID == $scope.OPsForTapeDown[i].OBJECTIVE_POINT_ID) {
                                   $scope.OPsForTapeDown[i].selected = true;
                                   y = response.length; //ensures it doesn't set it as false after setting it as true
                               }
                               else {
                                   $scope.OPsForTapeDown[i].selected = false;
                               }
                           }
                           if (response.length === 0)
                               $scope.OPsForTapeDown[i].selected = false;
                       }
                   //end if thisSiteHousings != undefined
                   });
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

           $scope.myData = [$scope.aSensStatus.SENSOR_ELEVATION, $scope.aSensStatus.WS_ELEVATION, $scope.aSensStatus.GS_ELEVATION];


        }]); //end SENSOR

    // Retrieve a Sensor modal
    ModalControllers.controller('sensorRetrievalModalCtrl', ['$scope', '$rootScope', '$timeout', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'thisSensor', 'SensorSite', 'siteOPs', 'allEventList', 'allVDatumList', 'allMembers', 'allStatusTypes', 'allInstCollCond', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'OP_MEASURE',
        function ($scope, $rootScope, $timeout, $cookies, $http, $uibModalInstance, $uibModal, thisSensor, SensorSite, siteOPs, allEventList, allVDatumList, allMembers, allStatusTypes, allInstCollCond, INSTRUMENT, INSTRUMENT_STATUS, OP_MEASURE) {
            $scope.aSensor = thisSensor.Instrument;
            $scope.EventName = allEventList.filter(function (r) {return r.EVENT_ID == $scope.aSensor.EVENT_ID;})[0].EVENT_NAME;
            $scope.depSensStatus = angular.copy(thisSensor.InstrumentStats[0]);
            var y = $scope.depSensStatus.TIME_STAMP.substr(0, 4);
            var m = $scope.depSensStatus.TIME_STAMP.substr(5, 2) - 1; //subtract 1 for index value (January is 0)
            var d = $scope.depSensStatus.TIME_STAMP.substr(8, 2);
            var h = $scope.depSensStatus.TIME_STAMP.substr(11, 2);
            var mi = $scope.depSensStatus.TIME_STAMP.substr(14, 2);
            var sec = $scope.depSensStatus.TIME_STAMP.substr(17, 2);
            $scope.depSensStatus.TIME_STAMP = new Date(y, m, d, h, mi, sec);

            $scope.OPsForTapeDown = siteOPs;
            $scope.vertDatumList = allVDatumList;
            $scope.removeOPList = [];
            $scope.tapeDownTable = []; //holder of tapedown OP_MEASUREMENTS
            $scope.DEPtapeDownTable = []; //holds any deployed tapedowns

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
            
            //#region tape down section 
            $scope.addTapedown = false; //toggle tapedown section
            $scope.showTapedownPart = function () {
                if ($scope.addTapedown) {
                    //they are closing it. clear inputs and close
                    $scope.addTapedown = false;
                } else {
                    //they are opening to add tape down information
                    $scope.addTapedown = true;
                }
            };
            $scope.OPchosen = function (opChosen) {
                var opI = $scope.OPsForTapeDown.map(function (o) { return o.OBJECTIVE_POINT_ID; }).indexOf(opChosen.OBJECTIVE_POINT_ID);
                if (opChosen.selected) {
                    //they picked an OP to use for tapedown
                    $scope.OPMeasure = {};
                    $scope.OPMeasure.OP_NAME = opChosen.NAME;
                    $scope.OPMeasure.elevation = opChosen.ELEV_FT;
                    $scope.OPMeasure.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.DATUM_ID == opChosen.VDATUM_ID; })[0].DATUM_ABBREVIATION;
                    $scope.OPMeasure.OBJECTIVE_POINT_ID = opChosen.OBJECTIVE_POINT_ID;
                    //$scope.OPMeasure.OP_NAME = opName;
                    $scope.tapeDownTable.push($scope.OPMeasure);
                } else {
                    //they unchecked the op to remove
                    //ask them are they sure?
                    var removeOPMeas = $uibModal.open({
                        backdrop: 'static',
                        keyboard: false,
                        template: '<div class="modal-header"><h3 class="modal-title">Remove OP Measure</h3></div>' +
                            '<div class="modal-body"><p>Are you sure you want to remove this OP Measurement from this sensor?</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button><button class="btn btn-primary" ng-click="cancel()">Cancel</button></div>',
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
                            //add to remove it list
                            var tapeDownToRemove = $scope.tapeDownTable.filter(function (a) { return a.OBJECTIVE_POINT_ID == opChosen.OBJECTIVE_POINT_ID; })[0];
                            var tInd = $scope.tapeDownTable.map(function (o) { return o.OBJECTIVE_POINT_ID; }).indexOf(tapeDownToRemove.OBJECTIVE_POINT_ID);
                            if (tapeDownToRemove.OP_MEASUREMENTS_ID !== undefined) $scope.removeOPList.push(tapeDownToRemove.OP_MEASUREMENTS_ID);
                            $scope.tapeDownTable.splice(tInd, 1);
                        } else {
                            //never mind, make it selected again
                            $scope.OPsForTapeDown[opI].selected = true;
                        }
                    });
                }
            };
            //get deploy status tapedowns to add to top for display
            OP_MEASURE.getInstStatOPMeasures({ instrumentStatusId: $scope.depSensStatus.INSTRUMENT_STATUS_ID }).$promise.then(function (response) {
                for (var r = 0; r < response.length; r++) {
                    var sensMeasures = response[r];
                    var whichOP = siteOPs.filter(function (op) { return op.OBJECTIVE_POINT_ID == response[r].OBJECTIVE_POINT_ID; })[0];
                    sensMeasures.elevation = whichOP.ELEV_FT;
                    sensMeasures.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.DATUM_ID == whichOP.VDATUM_ID; })[0].DATUM_ABBREVIATION;
                    sensMeasures.OP_NAME = whichOP.NAME;
                    $scope.DEPtapeDownTable.push(sensMeasures);
                }                
            });

            //#endregion tape down section 

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
                $rootScope.stateIsLoading.showLoading = false;// loading..
                $uibModalInstance.dismiss('cancel');
            };
            var depTimeStampb4Send = function () {
                //check and see if they are not using UTC
                var returnThis;
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                var i = $scope.depSensStatus.TIME_STAMP.toString().indexOf('GMT') + 3;
                returnThis = $scope.depSensStatus.TIME_STAMP.toString().substring(0, i);
                return returnThis;
            };

            //cancel
            $scope.cancel = function () {
                $rootScope.stateIsLoading.showLoading = false;// loading..
                $uibModalInstance.dismiss('cancel');
            };

            //retrieve the sensor
            $scope.retrieveS = function (valid) {
                if (valid) {
                    dealWithTimeStampb4Send(); //for retrieval for post and for comparison to deployed (ensure it's after)
                    var depSenTS = depTimeStampb4Send();//need to get dep status date in same format as retrieved to compare
                    var retSenTS = angular.copy($scope.aRetrieval.TIME_STAMP.replace(/\,/g, "")); //stupid comma in there making it not the same
                    if (new Date(retSenTS) < new Date(depSenTS)) {                        
                        var fixDate = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>The retrieval date must be after the deployed date.</p></div>' +
                                '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                $scope.ok = function () {
                                    $uibModalInstance.close();
                                };
                            }],
                            size: 'sm'
                        });
                        fixDate.result.then(function () {
                            //reset to now
                            $scope.aRetrieval.TIME_STAMP = '';
                            $scope.aRetrieval.TIME_STAMP = getTimeZoneStamp()[0];
                            $scope.aRetrieval.TIME_ZONE = getTimeZoneStamp()[1];
                            angular.element('#retrievalDate').trigger('focus');
                        });
                    } else {
                        $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                        $http.defaults.headers.common.Accept = 'application/json';
                        var updatedSensor = {}; var createRetSens = {};
                        INSTRUMENT.update({ id: $scope.aSensor.INSTRUMENT_ID }, $scope.aSensor).$promise.then(function (response) {
                            //create instrumentstatus too need: STATUS_TYPE_ID and INSTRUMENT_ID
                            updatedSensor = response;
                            updatedSensor.Deployment_Type = $scope.aSensor.Deployment_Type;
                            updatedSensor.Housing_Type = $scope.aSensor.Housing_Type;
                            updatedSensor.Sensor_Brand = $scope.aSensor.Sensor_Brand;
                            updatedSensor.Sensor_Type = $scope.aSensor.Sensor_Type;
                            updatedSensor.Inst_Collection = $scope.collectCondList.filter(function (i) { return i.ID === $scope.aSensor.INST_COLLECTION_ID; })[0].CONDITION;

                            INSTRUMENT_STATUS.save($scope.aRetrieval).$promise.then(function (statResponse) {
                                //any tape downs?
                                if ($scope.tapeDownTable.length > 0) {
                                    for (var t = 0; t < $scope.tapeDownTable.length; t++) {
                                        var thisTape = $scope.tapeDownTable[t];
                                        thisTape.INSTRUMENT_STATUS_ID = statResponse.INSTRUMENT_STATUS_ID;
                                        ///POST IT///
                                        OP_MEASURE.addInstStatMeasure({ instrumentStatusId: statResponse.INSTRUMENT_STATUS_ID }, thisTape).$promise;
                                    }
                                }
                                //build the createdSensor to send back and add to the list page
                                createRetSens = statResponse;
                                createRetSens.Status = 'Retrieved';
                                var sensorObjectToSendBack = {

                                    Instrument: updatedSensor,
                                    InstrumentStats: [createRetSens, thisSensor.InstrumentStats[0]]
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
                    } //end retr date is correct
                }//end if valid
            };//end retrieveS
        }]);//end sensorRetrievalModalCtrl

    // view/edit retrieved sensor (deployed included here) modal
    ModalControllers.controller('fullSensorModalCtrl', ['$scope', '$filter', '$timeout', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'SERVER_URL', 'allDepDropdowns', 'agencyList', 'Site_Files', 'allStatusTypes', 'allInstCollCond', 'allEvents', 'allDepTypes', 'thisSensor', 'SensorSite', 'siteOPs', 'allMembers', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'DATA_FILE', 'FILE', 'SOURCE', 'OP_MEASURE',
        function ($scope, $filter, $timeout, $cookies, $http, $uibModalInstance, $uibModal, SERVER_URL, allDepDropdowns, agencyList, Site_Files, allStatusTypes, allInstCollCond, allEvents, allDepTypes, thisSensor, SensorSite, siteOPs, allMembers, INSTRUMENT, INSTRUMENT_STATUS, DATA_FILE, FILE, SOURCE, OP_MEASURE) {
            /*allSensorTypes, allSensorBrands, allHousingTypes, allSensDeps*/
            $scope.serverURL = SERVER_URL;
            $scope.sensorTypeList = allDepDropdowns[0];
            $scope.sensorBrandList = allDepDropdowns[1];
            $scope.houseTypeList = allDepDropdowns[2];
            $scope.sensorDeployList = allDepDropdowns[3];
            $scope.fileTypeList = allDepDropdowns[4]; //used if creating/editing depSens file
            $scope.vertDatumList = allDepDropdowns[5];
            $scope.allSFiles = Site_Files.getAllSiteFiles();
            $scope.sensorFiles = thisSensor !== "empty" ? $scope.allSFiles.filter(function (sf) { return sf.INSTRUMENT_ID == thisSensor.Instrument.INSTRUMENT_ID; }) : [];// holder for hwm files added
            $scope.sensImageFiles = $scope.sensorFiles.filter(function (hf) { return hf.FILETYPE_ID === 1; }); //image files for carousel
            $scope.showFileForm = false; //hidden form to add file to sensor
            $scope.showNWISFileForm = false; //hidden form to add nwis file to sensor
            $scope.sensorDataNWIS = false; //is this a rain gage, met station, or rdg sensor -- if so, data file must be created pointing to nwis (we don't store actual file, just metadata with link)
            $scope.collectCondList = allInstCollCond;
            $scope.DEPOPsForTapeDown = angular.copy(siteOPs);
            $scope.RETOPsForTapeDown = angular.copy(siteOPs);
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

            //formatting date and time properly for chrome and ff
            var getDateTimeParts = function (d) {
                var y = d.substr(0, 4);
                var m = d.substr(5, 2) - 1; //subtract 1 for index value (January is 0)
                var da = d.substr(8, 2);
                var h = d.substr(11, 2);
                var mi = d.substr(14, 2);
                var sec = d.substr(17, 2);
                var theDate = new Date(y, m, da, h, mi, sec);
                return theDate;
            };
            
            $scope.thisSensorSite = SensorSite; $scope.userRole = $cookies.get('usersRole');

            $scope.sensor = angular.copy(thisSensor.Instrument);
            $scope.sensorDataNWIS = (($scope.sensor.SENSOR_TYPE_ID == 2 || $scope.sensor.SENSOR_TYPE_ID == 5) || $scope.sensor.SENSOR_TYPE_ID == 6) ? true : false;
            //deploy part //////////////////
            $scope.DeployedSensorStat = angular.copy(thisSensor.InstrumentStats.filter(function (inst) { return inst.Status === "Deployed"; })[0]);
            $scope.DeployedSensorStat.TIME_STAMP = getDateTimeParts($scope.DeployedSensorStat.TIME_STAMP); //this keeps it as utc in display
            $scope.Deployer = allMembers.filter(function (m) { return m.MEMBER_ID === $scope.DeployedSensorStat.MEMBER_ID; })[0];
            $scope.DEPremoveOPList = [];
            $scope.DEPtapeDownTable = []; //holder of tapedown OP_MEASUREMENTS
            //$scope.DEPaddTapedown = true; //toggle tapedown section
            //$scope.DEPshowTapedownPart = function () {
            //    if ($scope.DEPaddTapedown) {
            //        //they are closing it. clear inputs and close
            //        $scope.DEPaddTapedown = false;
            //    } else {
            //        //they are opening to add tape down information
            //        $scope.DEPaddTapedown = true;
            //    }
            //};
            $scope.DEPOPchosen = function (DEPopChosen) {
                var opI = $scope.DEPOPsForTapeDown.map(function (o) { return o.OBJECTIVE_POINT_ID; }).indexOf(DEPopChosen.OBJECTIVE_POINT_ID);
                if (DEPopChosen.selected) {
                    //they picked an OP to use for tapedown
                    $scope.DEPOPMeasure = {};
                    $scope.DEPOPMeasure.OP_NAME = DEPopChosen.NAME;
                    $scope.DEPOPMeasure.elevation = DEPopChosen.ELEV_FT;
                    $scope.DEPOPMeasure.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.DATUM_ID == DEPopChosen.VDATUM_ID; })[0].DATUM_ABBREVIATION;
                    $scope.DEPOPMeasure.OBJECTIVE_POINT_ID = DEPopChosen.OBJECTIVE_POINT_ID;
                    //$scope.DEPtapeDownTable.push($scope.DEPOPMeasure);
                    $scope.depTapeCopy.push($scope.DEPOPMeasure);
                } else {
                    //they unchecked the op to remove
                    //ask them are they sure?
                    var DEPremoveOPMeas = $uibModal.open({
                        backdrop: 'static',
                        keyboard: false,
                        template: '<div class="modal-header"><h3 class="modal-title">Remove OP Measure</h3></div>' +
                            '<div class="modal-body"><p>Are you sure you want to remove this OP Measurement from this deployed sensor?</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-click="DEPok()">OK</button><button class="btn btn-primary" ng-click="DEPcancel()">Cancel</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.DEPok = function () {
                                $uibModalInstance.close('remove');
                            };
                            $scope.DEPcancel = function () {
                                $uibModalInstance.close('cancel');
                            };
                        }],
                        size: 'sm'
                    });
                    DEPremoveOPMeas.result.then(function (yesOrNo) {
                        if (yesOrNo == 'remove') {
                            //add to remove it list
                            var DEPtapeDownToRemove = $scope.depTapeCopy.filter(function (a) { return a.OBJECTIVE_POINT_ID == DEPopChosen.OBJECTIVE_POINT_ID; })[0];
                            var DEPtInd = $scope.depTapeCopy.map(function (o) { return o.OBJECTIVE_POINT_ID; }).indexOf(DEPtapeDownToRemove.OBJECTIVE_POINT_ID);
                            if (DEPtapeDownToRemove.OP_MEASUREMENTS_ID !== undefined) $scope.DEPremoveOPList.push(DEPtapeDownToRemove.OP_MEASUREMENTS_ID);
                            // $scope.DEPtapeDownTable.splice(DEPtInd, 1);
                            $scope.depTapeCopy.splice(DEPtInd, 1);
                        } else {
                            //never mind, make it selected again
                            $scope.DEPOPsForTapeDown[opI].selected = true;
                        }

                    });
                }
            };
            OP_MEASURE.getInstStatOPMeasures({ instrumentStatusId: $scope.DeployedSensorStat.INSTRUMENT_STATUS_ID }).$promise.then(function (DEPresponse) {
                for (var r = 0; r < DEPresponse.length; r++) {
                    var DEPsensMeasures = DEPresponse[r];
                    var whichOP = siteOPs.filter(function (op) { return op.OBJECTIVE_POINT_ID == DEPresponse[r].OBJECTIVE_POINT_ID; })[0];
                    DEPsensMeasures.elevation = whichOP.ELEV_FT;
                    DEPsensMeasures.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.DATUM_ID == whichOP.VDATUM_ID; })[0].DATUM_ABBREVIATION;
                    DEPsensMeasures.OP_NAME = $scope.DEPOPsForTapeDown.filter(function (op) { return op.OBJECTIVE_POINT_ID == DEPresponse[r].OBJECTIVE_POINT_ID; })[0].NAME;
                    $scope.DEPtapeDownTable.push(DEPsensMeasures);
                }
                //go through OPsForTapeDown and add selected Property.
                for (var i = 0; i < $scope.DEPOPsForTapeDown.length; i++) {
                    //for each one, if response has this id, add 'selected:true' else add 'selected:false'
                    for (var y = 0; y < DEPresponse.length; y++) {
                        if (DEPresponse[y].OBJECTIVE_POINT_ID == $scope.DEPOPsForTapeDown[i].OBJECTIVE_POINT_ID) {
                            $scope.DEPOPsForTapeDown[i].selected = true;
                            y = DEPresponse.length; //ensures it doesn't set it as false after setting it as true
                        }
                        else {
                            $scope.DEPOPsForTapeDown[i].selected = false;
                        }
                    }
                    if (DEPresponse.length === 0)
                        $scope.DEPOPsForTapeDown[i].selected = false;
                }
                //end if thisSiteHousings != undefined
            });
            //retrieve part //////////////////
            $scope.RetrievedSensorStat = angular.copy(thisSensor.InstrumentStats.filter(function (inst) { return inst.Status === "Retrieved"; })[0]);
            $scope.RetrievedSensorStat.TIME_STAMP = getDateTimeParts($scope.RetrievedSensorStat.TIME_STAMP); //this keeps it as utc in display
            $scope.Retriever = allMembers.filter(function (m) { return m.MEMBER_ID === $scope.RetrievedSensorStat.MEMBER_ID; })[0];
            $scope.RETremoveOPList = [];
            $scope.RETtapeDownTable = []; //holder of tapedown OP_MEASUREMENTS
           // $scope.RETaddTapedown = false; //toggle tapedown section
            //$scope.RETshowTapedownPart = function () {
            //    if ($scope.RETaddTapedown) {
            //        //they are closing it. clear inputs and close
            //        $scope.RETaddTapedown = false;
            //    } else {
            //        //they are opening to add tape down information
            //        $scope.RETaddTapedown = true;
            //    }
            //};
            $scope.RETOPchosen = function (RETopChosen) {
                var opI = $scope.RETOPsForTapeDown.map(function (o) { return o.OBJECTIVE_POINT_ID; }).indexOf(RETopChosen.OBJECTIVE_POINT_ID);
                if (RETopChosen.selected) {
                    //they picked an OP to use for tapedown
                    $scope.RETOPMeasure = {};
                    $scope.RETOPMeasure.OP_NAME = RETopChosen.NAME;
                    $scope.RETOPMeasure.elevation = RETopChosen.ELEV_FT;
                    $scope.RETOPMeasure.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.DATUM_ID == RETopChosen.VDATUM_ID; })[0].DATUM_ABBREVIATION;
                    $scope.RETOPMeasure.OBJECTIVE_POINT_ID = RETopChosen.OBJECTIVE_POINT_ID;
                    $scope.retTapeCopy.push($scope.RETOPMeasure);
                } else {
                    //they unchecked the op to remove
                    //ask them are they sure?
                    var RETremoveOPMeas = $uibModal.open({
                        backdrop: 'static',
                        keyboard: false,
                        template: '<div class="modal-header"><h3 class="modal-title">Remove OP Measure</h3></div>' +
                            '<div class="modal-body"><p>Are you sure you want to remove this OP Measurement from this retrieved sensor?</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-click="RETok()">OK</button><button class="btn btn-primary" ng-click="RETcancel()">Cancel</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.RETok = function () {
                                $uibModalInstance.close('remove');
                            };
                            $scope.RETcancel = function () {
                                $uibModalInstance.close('cancel');
                            };
                        }],
                        size: 'sm'
                    });
                    RETremoveOPMeas.result.then(function (yesOrNo) {
                        if (yesOrNo == 'remove') {
                            //add to remove it list
                            var RETtapeDownToRemove = $scope.retTapeCopy.filter(function (a) { return a.OBJECTIVE_POINT_ID == RETopChosen.OBJECTIVE_POINT_ID; })[0];
                            var RETtInd = $scope.retTapeCopy.map(function (o) { return o.OBJECTIVE_POINT_ID; }).indexOf(RETtapeDownToRemove.OBJECTIVE_POINT_ID);
                            $scope.RETremoveOPList.push(RETtapeDownToRemove.OP_MEASUREMENTS_ID);
                            $scope.retTapeCopy.splice(RETtInd, 1);
                        } else {
                            //never mind, make it selected again
                            $scope.RETOPsForTapeDown[opI].selected = true;
                        }
                    });
                }
            };
            OP_MEASURE.getInstStatOPMeasures({ instrumentStatusId: $scope.RetrievedSensorStat.INSTRUMENT_STATUS_ID }).$promise.then(function (RETresponse) {
                for (var r = 0; r < RETresponse.length; r++) {
                    var RETsensMeasures = RETresponse[r];
                    var whichOP = siteOPs.filter(function (op) { return op.OBJECTIVE_POINT_ID == RETresponse[r].OBJECTIVE_POINT_ID; })[0];
                    RETsensMeasures.elevation = whichOP.ELEV_FT;
                    RETsensMeasures.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.DATUM_ID == whichOP.VDATUM_ID; })[0].DATUM_ABBREVIATION;
                    RETsensMeasures.OP_NAME = $scope.RETOPsForTapeDown.filter(function (op) { return op.OBJECTIVE_POINT_ID == RETresponse[r].OBJECTIVE_POINT_ID; })[0].NAME;
                    $scope.RETtapeDownTable.push(RETsensMeasures);
                }
                //go through OPsForTapeDown and add selected Property.
                for (var i = 0; i < $scope.RETOPsForTapeDown.length; i++) {
                    //for each one, if response has this id, add 'selected:true' else add 'selected:false'
                    for (var y = 0; y < RETresponse.length; y++) {
                        if (RETresponse[y].OBJECTIVE_POINT_ID == $scope.RETOPsForTapeDown[i].OBJECTIVE_POINT_ID) {
                            $scope.RETOPsForTapeDown[i].selected = true;
                            y = RETresponse.length; //ensures it doesn't set it as false after setting it as true
                        }
                        else {
                            $scope.RETOPsForTapeDown[i].selected = false;
                        }
                    }
                    if (RETresponse.length === 0)
                        $scope.RETOPsForTapeDown[i].selected = false;
                }
                //end if thisSiteHousings != undefined
            });

            //only need retrieved and lost statuses
            
            $scope.EventName = allEvents.filter(function (e) { return e.EVENT_ID === $scope.sensor.EVENT_ID; })[0].EVENT_NAME;
            
            //accordion open/close glyphs
            $scope.s = { depOpen: false, retOpen: true, sFileOpen: false, NWISFileOpen: false };

            //#region datetimepicker
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
                    Instrument: thisSensor.Instrument,
                    InstrumentStats: [
                        thisSensor.InstrumentStats.filter(function (inst) { return inst.Status === "Retrieved"; })[0],
                        thisSensor.InstrumentStats.filter(function (inst) { return inst.Status === "Deployed"; })[0]
                    ]
                };
                $timeout(function () {
                    // anything you want can go here and will safely be run on the next digest.                   
                    var sendBack = [sensorObjectToSendBack];
                    $uibModalInstance.close(sendBack);
                });                
            };

            //Done during edit PUT to ensure timezone doesn't affect db time value (is it UTC or local time..make sure it stays UTC)
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
                $scope.depTapeCopy = angular.copy($scope.DEPtapeDownTable);
            };

            
            //save Deployed sensor info
            $scope.saveDeployed = function (valid) {
                if (valid) {                    
                    var updatedSensor = {}; var updatedSenStat = {}; 
                    //see if they used Minutes or seconds for interval. need to store in seconds
                    if ($scope.IntervalType.type == "Minutes")
                        $scope.depStuffCopy[0].INTERVAL = $scope.depStuffCopy[0].INTERVAL * 60;
                    dealWithTimeStampb4Send('deployed'); //UTC or local?                    
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
                            //deal with tapedowns. remove/add
                            for (var rt = 0; rt < $scope.DEPremoveOPList.length; rt++) {
                                var DEPidToRemove = $scope.DEPremoveOPList[rt];
                                OP_MEASURE.delete({ id: DEPidToRemove }).$promise;
                            }
                            $scope.DEPtapeDownTable = $scope.depTapeCopy.length > 0 ? [] : $scope.DEPtapeDownTable;
                            for (var at = 0; at < $scope.depTapeCopy.length; at++) {
                                var DEPthisTape = $scope.depTapeCopy[at];
                                if (DEPthisTape.OP_MEASUREMENTS_ID !== undefined) {
                                    //existing, put in case they changed it
                                    OP_MEASURE.update({ id: DEPthisTape.OP_MEASUREMENTS_ID }, DEPthisTape).$promise.then(function (tapeResponse) {
                                        $scope.DEPtapeDownTable.push(tapeResponse);
                                    });
                                } else {
                                    //new one added, post
                                    DEPthisTape.INSTRUMENT_STATUS_ID = statResponse.INSTRUMENT_STATUS_ID;
                                    OP_MEASURE.addInstStatMeasure({ instrumentStatusId: statResponse.INSTRUMENT_STATUS_ID }, DEPthisTape).$promise.then(function (tapeResponse) {
                                        $scope.DEPtapeDownTable.push(tapeResponse);
                                    });
                                }                                
                            }

                            updatedSenStat = statResponse;
                            updatedSenStat.Status = $scope.statusTypeList.filter(function (sta) { return sta.STATUS_TYPE_ID === $scope.depStuffCopy[1].STATUS_TYPE_ID; })[0].STATUS;
                            $scope.sensor = updatedSensor;
                            $scope.DeployedSensorStat = updatedSenStat;
                           
                            $scope.DeployedSensorStat.TIME_STAMP = getDateTimeParts($scope.DeployedSensorStat.TIME_STAMP);//this keeps it as utc in display
                            $scope.depStuffCopy = []; $scope.depTapeCopy = [];
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
                $scope.depTapeCopy = [];
                //MAKE SURE ALL SELECTED OP'S STAY SELECTED
                for (var i = 0; i < $scope.DEPOPsForTapeDown.length; i++) {
                    //for each one, if response has this id, add 'selected:true' else add 'selected:false'
                    for (var y = 0; y < $scope.DEPtapeDownTable.length; y++) {
                        if ($scope.DEPtapeDownTable[y].OBJECTIVE_POINT_ID == $scope.DEPOPsForTapeDown[i].OBJECTIVE_POINT_ID) {
                            $scope.DEPOPsForTapeDown[i].selected = true;
                            y = $scope.DEPtapeDownTable.length; //ensures it doesn't set it as false after setting it as true
                        }
                        else {
                            $scope.DEPOPsForTapeDown[i].selected = false;
                        }
                    }
                    if ($scope.DEPtapeDownTable.length === 0)
                        $scope.DEPOPsForTapeDown[i].selected = false;
                }
                //$scope.DEPaddTapedown = false;
            };
            //#endregion deploy edit

            //#region Retrieve edit
            //edit button clicked. make copy of deployed info 
            $scope.wannaEditRet = function () {
                $scope.view.RETval = 'edit';
                $scope.retStuffCopy = [angular.copy($scope.sensor), angular.copy($scope.RetrievedSensorStat)];
                $scope.retTapeCopy = angular.copy($scope.RETtapeDownTable);
            };
            
            //save Retrieved sensor info
            $scope.saveRetrieved = function (valid) {
                if (valid) {
                    var updatedRetSensor = {}; var updatedRetSenStat = {};
                    dealWithTimeStampb4Send('retrieved'); //UTC or local?
                   // $scope.retStuffCopy[1].TIME_STAMP = new Date($scope.retStuffCopy[1].TIME_STAMP);//datetime is annoying
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
                            //deal with tapedowns. remove/add
                            for (var rt = 0; rt < $scope.RETremoveOPList.length; rt++) {
                                var RETidToRemove = $scope.RETremoveOPList[rt];
                                OP_MEASURE.delete({ id: RETidToRemove }).$promise;
                            }
                            $scope.RETtapeDownTable = $scope.retTapeCopy.length > 0 ? [] : $scope.RETtapeDownTable;
                            for (var at = 0; at < $scope.retTapeCopy.length; at++) {
                                var RETthisTape = $scope.retTapeCopy[at];
                                if (RETthisTape.OP_MEASUREMENTS_ID !== undefined) {
                                    //existing, put in case they changed it
                                    OP_MEASURE.update({ id: RETthisTape.OP_MEASUREMENTS_ID }, RETthisTape).$promise.then(function (tapeResponse) {
                                        $scope.RETtapeDownTable.push(tapeResponse);
                                    });
                                } else {
                                    //new one added, post
                                    RETthisTape.INSTRUMENT_STATUS_ID = statResponse.INSTRUMENT_STATUS_ID;
                                    OP_MEASURE.addInstStatMeasure({ instrumentStatusId: statResponse.INSTRUMENT_STATUS_ID }, RETthisTape).$promise.then(function (tapeResponse) {
                                        $scope.RETtapeDownTable.push(tapeResponse);
                                    });
                                }
                            }

                            updatedRetSenStat = statResponse;
                            updatedRetSenStat.Status = $scope.statusTypeList.filter(function (sta) { return sta.STATUS_TYPE_ID === $scope.retStuffCopy[1].STATUS_TYPE_ID; })[0].STATUS;
                            $scope.sensor = updatedRetSensor;
                            $scope.RetrievedSensorStat = updatedRetSenStat;                            
                            $scope.RetrievedSensorStat.TIME_STAMP = getDateTimeParts($scope.RetrievedSensorStat.TIME_STAMP);//this keeps it as utc in display
                            $scope.retStuffCopy = []; $scope.retTapeCopy = [];
                            $scope.view.RETval = 'detail';
                        });
                    });
                }
            };//end saveRetrieved()            

            //never mind, don't want to edit retrieved sensor
            $scope.cancelRetEdit = function () {
                $scope.view.RETval = 'detail';
                $scope.retStuffCopy = [];
                $scope.retTapeCopy = [];
                //$scope.RETaddTapedown = false;
                //MAKE SURE ALL SELECTED OP'S STAY SELECTED
                for (var i = 0; i < $scope.RETOPsForTapeDown.length; i++) {
                    //for each one, if response has this id, add 'selected:true' else add 'selected:false'
                    for (var y = 0; y < $scope.RETtapeDownTable.length; y++) {
                        if ($scope.RETtapeDownTable[y].OBJECTIVE_POINT_ID == $scope.RETOPsForTapeDown[i].OBJECTIVE_POINT_ID) {
                            $scope.RETOPsForTapeDown[i].selected = true;
                            y = $scope.RETtapeDownTable.length; //ensures it doesn't set it as false after setting it as true
                        }
                        else {
                            $scope.RETOPsForTapeDown[i].selected = false;
                        }
                    }
                    if ($scope.RETtapeDownTable.length === 0)
                        $scope.RETOPsForTapeDown[i].selected = false;
                }
            };
            //#endregion Retrieve edit

            //#region NWIS DATA_FILE
            if ($scope.sensorDataNWIS) {
                //FILE.VALIDATED being used to store 1 if this is an nwis file metadata link
                $scope.sensorNWISFiles = [];
                var indexArray = []; //holder of indexes to remove from sensorFiles if this is a nwis file data (only want it in lowest accordion, not both)
                angular.forEach($scope.sensorFiles, function (sf, index) {
                    if (sf.VALIDATED == 1) {
                        indexArray.push(index);
                        $scope.sensorNWISFiles.push(sf);
                    }
                });
                for (var i = 0; i < indexArray.length; i++) $scope.sensorFiles.splice(indexArray[i], 1);

                var dt = getTimeZoneStamp();
                $scope.NWISFile = {};
                $scope.NWISDF = {};                
                $scope.nwisProcessor = allMembers.filter(function (m) { return m.MEMBER_ID == $cookies.get("mID"); })[0];
            }
            $scope.showNWISFile = function (f) {
                //want to add or edit file
                $scope.existFileIndex = -1;
                $scope.allSFileIndex = -1; //indexes for splice/change
                if (f !== 0) {
                    //edit NWIS file
                    $scope.existFileIndex = $scope.sensorNWISFiles.indexOf(f);
                    $scope.allSFileIndex = $scope.allSFiles.indexOf(f);
                    $scope.NWISFile = angular.copy(f);
                    $scope.NWISFile.FILE_DATE = new Date($scope.NWISFile.FILE_DATE); //date for validity of form on PUT
                    $scope.NWISFile.FileType = "Data";
                    DATA_FILE.query({ id: f.DATA_FILE_ID }).$promise.then(function (df) {
                        $scope.NWISDF = df;
                        $scope.nwisProcessor = allMembers.filter(function (m) { return m.MEMBER_ID == $scope.NWISDF.PROCESSOR_ID; })[0];
                        $scope.NWISDF.COLLECT_DATE = new Date($scope.NWISDF.COLLECT_DATE);
                        $scope.NWISDF.GOOD_START = getDateTimeParts($scope.NWISDF.GOOD_START);
                        $scope.NWISDF.GOOD_END = getDateTimeParts($scope.NWISDF.GOOD_END);
                    });

                }//end existing file
                else {
                    //creating a nwis file
                    $scope.NWISFile = {
                        FILE_DATE: new Date(),
                        FILETYPE_ID: 2,
                        FileType: 'Data',
                        PATH: 'datafile name',
                        DESCRIPTION: 'Link to NWIS data file for this sensor.',
                        SITE_ID: $scope.sensor.SITE_ID,
                        FILE_URL: 'http://nwis.gov/somethingHere',
                        DATA_FILE_ID: 0,
                        INSTRUMENT_ID: $scope.sensor.INSTRUMENT_ID,
                        VALIDATED: 1
                    };
                    $scope.NWISDF = {
                        PROCESSOR_ID: $cookies.get("mID"),
                        INSTRUMENT_ID: $scope.sensor.INSTRUMENT_ID,
                        COLLECT_DATE: dt[0],
                        TIME_ZONE: dt[1],
                        GOOD_START: new Date(),
                        GOOD_END: new Date()
                    };
                    $scope.nwisProcessor = allMembers.filter(function (m) { return m.MEMBER_ID == $cookies.get('mID'); })[0];

                } //end new file
                $scope.showNWISFileForm = true;

            };
            $scope.createNWISFile = function (valid) {
                if (valid) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //post datafile first to get or DATA_FILE_ID
                    //determine timezone
                    if ($scope.NWISDF.TIME_ZONE != "UTC") {
                        //convert it
                        var utcStartDateTime = new Date($scope.NWISDF.GOOD_START).toUTCString();
                        var utcEndDateTime = new Date($scope.NWISDF.GOOD_END).toUTCString();
                        $scope.NWISDF.GOOD_START = utcStartDateTime;
                        $scope.NWISDF.GOOD_END = utcEndDateTime;
                        $scope.NWISDF.TIME_ZONE = 'UTC';
                    } else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        var si = $scope.NWISDF.GOOD_START.toString().indexOf('GMT') + 3;
                        var ei = $scope.NWISDF.GOOD_END.toString().indexOf('GMT') + 3;
                        $scope.NWISDF.GOOD_START = $scope.NWISDF.GOOD_START.toString().substring(0, si);
                        $scope.NWISDF.GOOD_END = $scope.NWISDF.GOOD_END.toString().substring(0, ei);
                    }
                    DATA_FILE.save($scope.NWISDF).$promise.then(function (NdfResonse) {
                        //then POST fileParts (Services populate PATH)
                        $scope.NWISFile.DATA_FILE_ID = NdfResonse.DATA_FILE_ID;
                        //now POST File
                        FILE.save($scope.NWISFile).$promise.then(function (Fresponse) {
                            toastr.success("File Data saved");
                            Fresponse.fileBelongsTo = "DataFile File";
                            //$scope.sensorFiles.push(Fresponse);
                            $scope.sensorNWISFiles.push(Fresponse);
                            $scope.allSFiles.push(Fresponse);
                            Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard                            
                            $scope.showNWISFileForm = false;
                        });
                    });
                }//end valid
            };// end create NWIS file
            //update this NWIS file
            $scope.saveNWISFile = function (valid) {
                if (valid) {
                    //put source or datafile, put file
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //check timezone and make sure date stays utc
                    if ($scope.NWISDF.TIME_ZONE != "UTC") {
                        //convert it
                        var utcStartDateTime = new Date($scope.NWISDF.GOOD_START).toUTCString();
                        var utcEndDateTime = new Date($scope.NWISDF.GOOD_END).toUTCString();
                        $scope.NWISDF.GOOD_START = utcStartDateTime;
                        $scope.NWISDF.GOOD_END = utcEndDateTime;
                        $scope.NWISDF.TIME_ZONE = 'UTC';
                    } else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        var si = $scope.NWISDF.GOOD_START.toString().indexOf('GMT') + 3;
                        var ei = $scope.NWISDF.GOOD_END.toString().indexOf('GMT') + 3;
                        $scope.NWISDF.GOOD_START = $scope.NWISDF.GOOD_START.toString().substring(0, si);
                        $scope.NWISDF.GOOD_END = $scope.NWISDF.GOOD_END.toString().substring(0, ei);
                    }
                    DATA_FILE.update({ id: $scope.NWISDF.DATA_FILE_ID }, $scope.NWISDF).$promise.then(function () {
                        FILE.update({ id: $scope.NWISFile.FILE_ID }, $scope.NWISFile).$promise.then(function (fileResponse) {
                            toastr.success("File Data Updated");
                            fileResponse.fileBelongsTo = "DataFile File";
                            $scope.sensorNWISFiles[$scope.existFileIndex] = fileResponse;
                            $scope.allSFiles[$scope.allSFileIndex] = fileResponse;
                            Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                            $scope.showNWISFileForm = false;
                        });
                    });                    
                }//end valid
            };//end save()

            //delete this file
            $scope.deleteNWISFile = function () {
                var DeleteModalInstance = $uibModal.open({
                    backdrop: 'static',
                    keyboard: false,
                    templateUrl: 'removemodal.html',
                    controller: 'ConfirmModalCtrl',
                    size: 'sm',
                    resolve: {
                        nameToRemove: function () {
                            return $scope.NWISFile;
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
                        $scope.sensorNWISFiles.splice($scope.existFileIndex, 1);
                        $scope.allSFiles.splice($scope.allSFileIndex, 1);
                        Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                        $scope.showNWISFileForm = false;
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    });
                });//end DeleteModal.result.then
            };//end delete()

            $scope.cancelNWISFile = function () {
                $scope.NWISFile = {};
                $scope.NWISDF = {};
                $scope.showNWISFileForm = false;
            };
            //#endregion

            //delete aSensor and sensor statuses
            $scope.deleteS = function () {
                //TODO:: Delete the files for this sensor too or reassign to the Site?? Services or client handling?
                var DeleteModalInstance = $uibModal.open({
                    backdrop: 'static',
                    keyboard: false,
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
                        $scope.sensorFiles = []; //clear out sensorFiles for this sensor
                        $scope.sensImageFiles = []; //clear out image files for this sensor
                        //now remove all these files from SiteFiles
                        var l = $scope.allSFiles.length;
                        while (l--) {
                            if ($scope.allSFiles[l].INSTRUMENT_ID == sensorToRemove.INSTRUMENT_ID) $scope.allSFiles.splice(l, 1);
                        }
                        //updates the file list on the sitedashboard
                        Site_Files.setAllSiteFiles($scope.allSFiles);
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

            //#region FILE STUFF
            //show a modal with the larger image as a preview on the photo file for this op
            $scope.showImageModal = function (image) {
                var imageModal = $uibModal.open({
                    template: '<div class="modal-header"><h3 class="modal-title">Image File Preview</h3></div>' +
                        '<div class="modal-body"><img ng-src="{{setSRC}}" /></div>' +
                        '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.ok = function () {
                            $uibModalInstance.close();
                        };
                        $scope.imageId = image;
                        $scope.setSRC = SERVER_URL + '/Files/' + $scope.imageId + '/Item';
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
                    $scope.existFileIndex = $scope.sensorFiles.indexOf(file);
                    $scope.allSFileIndex = $scope.allSFiles.indexOf(file);
                    $scope.existIMGFileIndex = $scope.sensImageFiles.length > 0 ? $scope.sensImageFiles.indexOf(file) : -1;
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
                            $scope.datafile.GOOD_START = getDateTimeParts($scope.datafile.GOOD_START);
                            $scope.datafile.GOOD_END = getDateTimeParts($scope.datafile.GOOD_END);
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
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //post source or datafile first to get SOURCE_ID or DATA_FILE_ID
                    if ($scope.aFile.FILETYPE_ID == 2) {
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
                                $scope.sensorFiles.push(fresponse);
                                $scope.allSFiles.push(fresponse);
                                Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                if (fresponse.FILETYPE_ID === 1) $scope.sensImageFiles.push(fresponse);
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
                                $scope.sensorFiles.push(fresponse);
                                $scope.allSFiles.push(fresponse);
                                Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                if (fresponse.FILETYPE_ID === 1) $scope.sensImageFiles.push(fresponse);
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
                    if ($scope.datafile.DATA_FILE_ID !== undefined) {
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
                                $scope.sensorFiles[$scope.existFileIndex] = fileResponse;
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
                                $scope.sensorFiles[$scope.existFileIndex] = fileResponse;
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
                    backdrop: 'static',
                    keyboard: false,
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
                        $scope.sensorFiles.splice($scope.existFileIndex, 1);
                        $scope.allSFiles.splice($scope.allSFileIndex, 1);
                        $scope.sensImageFiles.splice($scope.existIMGFileIndex, 1);
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
    }]);//end fullSensorModalCtrl
})();