/// <reference path="sensorModalCtrl.js" />
(function () {
    'use strict';

    var ModalControllers = angular.module('ModalControllers');

    //deploy new or proposed sensor, edit deployed modal
    ModalControllers.controller('sensorModalCtrl', ['$scope', '$rootScope', '$timeout', '$cookies', '$http', '$sce', '$uibModalInstance', '$uibModal', 'SERVER_URL','FILE_STAMP', 'allDropdowns', 'agencyList', 'Site_Files', 'allDepTypes', 'thisSensor', 'SensorSite', 'siteOPs', 'allMembers', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'DATA_FILE', 'FILE', 'SOURCE','OP_MEASURE',
        function ($scope, $rootScope, $timeout, $cookies, $http, $sce, $uibModalInstance, $uibModal, SERVER_URL, FILE_STAMP, allDropdowns, agencyList, Site_Files, allDepTypes, thisSensor, SensorSite, siteOPs, allMembers, INSTRUMENT, INSTRUMENT_STATUS, DATA_FILE, FILE, SOURCE, OP_MEASURE) {
           //dropdowns [0]allSensorTypes, [1]allSensorBrands, [2]allHousingTypes, [3]allSensDeps, [4]allEvents      
           $scope.sensorTypeList = allDropdowns[0];
           $scope.sensorBrandList = allDropdowns[1];
           $scope.houseTypeList = allDropdowns[2];
          // $scope.sensorDeployList = allDropdowns[3];
           $scope.eventList = allDropdowns[3];
           $scope.fileTypeList = allDropdowns[4]; //used if creating/editing depSens file
           $scope.vertDatumList = allDropdowns[5];
           $scope.depSenfileIsUploading = false; //Loading...
           $scope.allSFiles = Site_Files.getAllSiteFiles();
           $scope.DepSensorFiles = thisSensor !== "empty" ? $scope.allSFiles.filter(function (sf) { return sf.instrument_id == thisSensor.instrument_id; }) : [];// holder for hwm files added
           $scope.depSensImageFiles = $scope.DepSensorFiles.filter(function (hf) { return hf.filetype_id === 1; }); //image files for carousel
           $scope.showFileForm = false; //hidden form to add file to hwm
           $scope.showNWISFileForm = false; //hidden form to add nwis file to sensor
           $scope.OPsPresent = siteOPs.length > 0 ? true : false;           
           $scope.OPsForTapeDown = siteOPs;
           $scope.removeOPList = [];
           $scope.tapeDownTable = []; //holder of tapedown OP_MEASUREMENTS
           $scope.depTypeList = allDepTypes; //get fresh version so not messed up with the Temperature twice
           $scope.filteredDeploymentTypes = [];
           $scope.timeZoneList = ['UTC', 'PST', 'MST', 'CST', 'EST'];
           $scope.userRole = $cookies.get('usersRole');
           $scope.showEventDD = false; //toggle to show/hide event dd (admin only)
           $scope.adminChanged = {}; //will hold event_id if admin changes it. apply when PUTting
           $scope.IntervalType = {}; //holder for minute/second radio buttons
           $scope.whichButton = ""; //holder for save/deploy button at end .. 'deploy' if proposed->deployed, and for deploying new or save if editing existing
           $scope.serverURL = SERVER_URL;
           $scope.nwisHeaderTip = $sce.trustAsHtml('Connect your transmitting sensor with NWIS via <em>Station ID for USGS gage</em> from the Site details.');
           $scope.view = { DEPval: 'detail', RETval: 'detail' };
           $scope.sensorDataNWIS = false; //is this a rain gage, met station, or rdg sensor -- if so, data file must be created pointing to nwis (we don't store actual file, just metadata with link)
           $scope.s = { depOpen: true, sFileOpen: false, NWISFileOpen: false};
           //formatting date and time properly for chrome and ff
           var getDateTimeParts = function (d) {
               var theDate;
               var isDate = Object.prototype.toString.call(d) === '[object Date]';
               if (isDate === false) {
                   var y = d.substr(0, 4);
                   var m = d.substr(5, 2) - 1; //subtract 1 for index value (January is 0)
                   var da = d.substr(8, 2);
                   var h = d.substr(11, 2);
                   var mi = d.substr(14, 2);
                   var sec = d.substr(17, 2);
                   theDate = new Date(y, m, da, h, mi, sec);
               } else {
                   theDate = d;
               }
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

            //#region file Upload
           $scope.stamp = FILE_STAMP.getStamp(); $scope.fileItemExists = true;
            //need to reupload fileItem to this existing file OR Change out existing fileItem for new one
           $scope.saveFileUpload = function () {
               $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
               $http.defaults.headers.common.Accept = 'application/json';
               $scope.sFileIsUploading = true;
               var fileParts = {
                   FileEntity: {
                       file_id: $scope.aFile.file_id,
                       name: $scope.aFile.name,
                       description: $scope.aFile.description,
                       photo_direction: $scope.aFile.photo_direction,
                       latitude_dd: $scope.aFile.latitude_dd,
                       longitude_dd: $scope.aFile.longitude_dd,
                       file_date: $scope.aFile.file_date,
                       hwm_id: $scope.aFile.hwm_id,
                       site_id: $scope.aFile.site_id,
                       filetype_id: $scope.aFile.filetype_id,
                       source_id: $scope.aFile.source_id,
                       path: $scope.aFile.path,
                       data_file_id: $scope.aFile.data_file_id,
                       instrument_id: $scope.aFile.instrument_id,
                       photo_date: $scope.aFile.photo_date,
                       is_nwis: $scope.aFile.is_nwis,
                       objective_point_id: $scope.aFile.objective_point_id
                   },
                   File: $scope.aFile.File1 !== undefined ? $scope.aFile.File1 : $scope.aFile.File
               };
               //need to put the fileParts into correct format for post
               var fd = new FormData();
               fd.append("FileEntity", JSON.stringify(fileParts.FileEntity));
               fd.append("File", fileParts.File);
               //now POST it (fileparts)
               FILE.uploadFile(fd).$promise.then(function (fresponse) {
                   toastr.success("File Uploaded");
                   $scope.src = $scope.serverURL + '/Files/' + $scope.aFile.file_id + '/Item' + FILE_STAMP.getStamp();
                   FILE_STAMP.setStamp();
                   $scope.stamp = FILE_STAMP.getStamp();
                   if ($scope.aFile.File1.type.indexOf("image") > -1) {
                       $scope.isPhoto = true;
                   } else $scope.isPhoto = false;
                   $scope.aFile.name = fresponse.name; $scope.aFile.path = fresponse.path;
                   if ($scope.aFile.File1 !== undefined) {
                       $scope.aFile.File = $scope.aFile.File1;
                       $scope.aFile.File1 = undefined; //put it as file and remove it from 1
                   }
                   fresponse.fileBelongsTo = $scope.aFile.filetype_id == 2 ? "DataFile File" : "Sensor File";                   
                   if (fresponse.filetype_id === 1) {
                       $scope.depSensImageFiles.splice($scope.existIMGFileIndex, 1);
                       $scope.depSensImageFiles.push(fresponse);
                   }
                   $scope.DepSensorFiles[$scope.existFileIndex] = fresponse;
                   $scope.allSFiles[$scope.allSFileIndex] = fresponse;
                   Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                   $scope.sFileIsUploading = false;
                   $scope.fileItemExists = true;
               }, function (errorResponse) {
                   $scope.sFileIsUploading = false;
                   toastr.error("Error saving file: " + errorResponse.statusText);
               });
           };

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
                   FILE.getFileItem({ id: $scope.aFile.file_id }).$promise.then(function (response) {
                       $scope.fileItemExists = response.Length > 0 ? true : false;
                   });
                   $scope.aFile.fileType = $scope.fileTypeList.filter(function (ft) { return ft.filetype_id == $scope.aFile.filetype_id; })[0].filetype;
                   if ($scope.aFile.name !== undefined) {
                       var fI = $scope.aFile.name.lastIndexOf(".");
                       var fileExt = $scope.aFile.name.substring(fI + 1);
                       if (fileExt.match(/(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
                           $scope.isPhoto = true;
                       } else $scope.isPhoto = false;
                   }
                   $scope.src = $scope.serverURL + '/Files/' + $scope.aFile.file_id + '/Item' + FILE_STAMP.getStamp();
                   $scope.aFile.file_date = new Date($scope.aFile.file_date); //date for validity of form on PUT
                   if ($scope.aFile.photo_date !== undefined) $scope.aFile.photo_date = new Date($scope.aFile.photo_date); //date for validity of form on PUT
                   if (file.source_id !== undefined) {
                       SOURCE.query({ id: file.source_id }).$promise.then(function (s) {
                           $scope.aSource = s;
                           $scope.aSource.FULLname = $scope.aSource.source_name;
                           //add agency name to photo caption
                           if ($scope.aFile.filetype_id == 1)
                               $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
                       });
                   }//end if source
                   if (file.data_file_id !== undefined) {
                       DATA_FILE.query({ id: file.data_file_id }).$promise.then(function (df) {
                           $scope.datafile = df;
                           $scope.processor = allMembers.filter(function (m) { return m.member_id == $scope.datafile.processor_id; })[0];
                           $scope.datafile.collect_date = new Date($scope.datafile.collect_date);
                           $scope.datafile.good_start = getDateTimeParts($scope.datafile.good_start);
                           $scope.datafile.good_end = getDateTimeParts($scope.datafile.good_end);
                       });
                   }
               }//end existing file
               else {
                   //creating a file
                   $scope.aFile.file_date = new Date(); $scope.aFile.photo_date = new Date();
                   $scope.aSource = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];
                   $scope.aSource.FULLname = $scope.aSource.fname + " " + $scope.aSource.lname;
                   $scope.processor = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];
                   var dt = getTimeZoneStamp();                     
                   $scope.datafile.collect_date = dt[0];
                   $scope.datafile.time_zone = dt[1]; //will be converted to utc on post/put 
                   $scope.datafile.good_start = new Date();
                   $scope.datafile.good_end = new Date();
               } //end new file
               $scope.showFileForm = true;

               $scope.updateAgencyForCaption = function () {
                   if ($scope.aFile.filetype_id == 1)
                       $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
               };
           };
            //create this new file
           $scope.createFile = function (valid) {
               if ($scope.aFile.filetype_id == 2) {
                   //make sure end date is after start date
                   var s = $scope.datafile.good_start;//need to get dep status date in same format as retrieved to compare
                   var e = $scope.datafile.good_end; //stupid comma in there making it not the same
                   if (new Date(e) < new Date(s)) {
                       valid = false;
                       var fixDate = $uibModal.open({
                           template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                               '<div class="modal-body"><p>The good end date must be after the good start date.</p></div>' +
                               '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                           controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                               $scope.ok = function () {
                                   $uibModalInstance.close();
                               };
                           }],
                           size: 'sm'
                       });
                       fixDate.result.then(function () {
                           valid = false;
                       });
                   }
               }
               if (valid) {
                   $scope.depSenfileIsUploading = true; //Loading...
                   $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                   $http.defaults.headers.common.Accept = 'application/json';
                   //post source or datafile first to get source_id or data_file_id
                   if ($scope.aFile.filetype_id == 2){
                       //determine timezone
                       if ($scope.datafile.time_zone != "UTC") {
                           //convert it
                           var utcStartDateTime = new Date($scope.datafile.good_start).toUTCString();
                           var utcEndDateTime = new Date($scope.datafile.good_end).toUTCString();
                           $scope.datafile.good_start = utcStartDateTime;
                           $scope.datafile.good_end = utcEndDateTime;
                           $scope.datafile.time_zone = 'UTC';
                       } else {
                           //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                           var si = $scope.datafile.good_start.toString().indexOf('GMT') + 3;
                           var ei = $scope.datafile.good_end.toString().indexOf('GMT') + 3;
                           $scope.datafile.good_start = $scope.datafile.good_start.toString().substring(0, si);
                           $scope.datafile.good_end = $scope.datafile.good_end.toString().substring(0, ei);
                       }
                       $scope.datafile.instrument_id = thisSensor.instrument_id;
                       $scope.datafile.processor_id = $cookies.get('mID');
                       DATA_FILE.save($scope.datafile).$promise.then(function (dfResonse) {
                           //then POST fileParts (Services populate PATH)
                           var fileParts = {
                               FileEntity: {
                                   filetype_id: $scope.aFile.filetype_id,
                                   name: $scope.aFile.File.name,
                                   file_date: $scope.aFile.file_date,
                                   description: $scope.aFile.description,
                                   site_id: $scope.thisSensorSite.site_id,
                                   data_file_id: dfResonse.data_file_id,
                                   photo_direction: $scope.aFile.photo_direction,
                                   latitude_dd: $scope.aFile.latitude_dd,
                                   longitude_dd: $scope.aFile.longitude_dd,
                                   instrument_id: thisSensor.instrument_id
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
                               if (fresponse.filetype_id === 1) $scope.depSensImageFiles.push(fresponse);
                               $scope.showFileForm = false; $scope.depSenfileIsUploading = false;
                           }, function (errorResponse) {
                               $scope.depSenfileIsUploading = false;
                               toastr.error("Error saving file: " + errorResponse.statusText);
                           });
                       }, function (errorResponse) {
                           $scope.depSenfileIsUploading = false;
                           toastr.error("Error saving Source info: " + errorResponse.statusText);
                       });//end datafile.save()
                   } else {
                       //it's not a data file, so do the source
                       var theSource = { source_name: $scope.aSource.FULLname, agency_id: $scope.aSource.agency_id};//, SOURCE_DATE: $scope.aSource.SOURCE_DATE };
                       SOURCE.save(theSource).$promise.then(function (response) {
                           if ($scope.aFile.filetype_id !== 8) {
                               //then POST fileParts (Services populate PATH)
                               var fileParts = {
                                   FileEntity: {
                                       filetype_id: $scope.aFile.filetype_id,
                                       name: $scope.aFile.File.name,
                                       file_date: $scope.aFile.file_date,
                                       photo_date: $scope.aFile.photo_date,
                                       description: $scope.aFile.description,
                                       site_id: $scope.thisSensorSite.site_id,
                                       source_id: response.source_id,
                                       photo_direction: $scope.aFile.photo_direction,
                                       latitude_dd: $scope.aFile.latitude_dd,
                                       longitude_dd: $scope.aFile.longitude_dd,
                                       instrument_id: thisSensor.instrument_id
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
                                   if (fresponse.filetype_id === 1) $scope.depSensImageFiles.push(fresponse);
                                   $scope.showFileForm = false; $scope.depSenfileIsUploading = false;
                               }, function (errorResponse) {
                                   $scope.depSenfileIsUploading = false;
                                   toastr.error("Error saving file: " + errorResponse.statusText);
                               });
                           } else {
                               //this is a link file, no fileItem
                               $scope.aFile.source_id = response.source_id; $scope.aFile.site_id = $scope.thisSensorSite.site_id; $scope.aFile.instrument_id = thisSensor.instrument_id;
                               FILE.save($scope.aFile).$promise.then(function (fresponse) {
                                   toastr.success("File Uploaded");
                                   fresponse.fileBelongsTo = "Sensor File";
                                   $scope.DepSensorFiles.push(fresponse);
                                   $scope.allSFiles.push(fresponse);
                                   Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                   $scope.showFileForm = false; $scope.depSenfileIsUploading = false;
                               }, function (errorResponse) {
                                   $scope.depSenfileIsUploading = false;
                                   toastr.error("Error saving file: " + errorResponse.statusText);
                               });
                           } //end else (it's a Link file)
                       }, function (errorResponse) {
                           $scope.depSenfileIsUploading = false;
                           toastr.error("Error saving Source info: " + errorResponse.statusText);
                       });//end source.save()
                   }//end if source
                }//end valid                   
           };//end create()

           $scope.saveFile = function (valid) {
               if ($scope.aFile.filetype_id == 2) {
                   //make sure end date is after start date
                   var s = $scope.datafile.good_start;//need to get dep status date in same format as retrieved to compare
                   var e = $scope.datafile.good_end; //stupid comma in there making it not the same
                   if (new Date(e) < new Date(s)) {
                       valid = false;
                       var fixDate = $uibModal.open({
                           template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                               '<div class="modal-body"><p>The good end date must be after the good start date.</p></div>' +
                               '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                           controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                               $scope.ok = function () {
                                   $uibModalInstance.close();
                               };
                           }],
                           size: 'sm'
                       });
                       fixDate.result.then(function () {
                           valid = false;
                       });
                   }
               }
               if (valid) {
                   $scope.depSenfileIsUploading = true;
                   //put source or datafile, put file
                   var whatkind = $scope.aFile.fileBelongsTo;
                   $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                   $http.defaults.headers.common.Accept = 'application/json';
                   if ($scope.datafile.data_file_id !== undefined){
                       //has DATA_FILE
                           //check timezone and make sure date stays utc
                           if ($scope.datafile.time_zone != "UTC") {
                               //convert it
                               var utcStartDateTime = new Date($scope.datafile.good_start).toUTCString();
                               var utcEndDateTime = new Date($scope.datafile.good_end).toUTCString();
                               $scope.datafile.good_start = utcStartDateTime;
                               $scope.datafile.good_end = utcEndDateTime;
                               $scope.datafile.time_zone = 'UTC';
                           } else {
                               //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                               var si = $scope.datafile.good_start.toString().indexOf('GMT') + 3;
                               var ei = $scope.datafile.good_end.toString().indexOf('GMT') + 3;
                               $scope.datafile.good_start = $scope.datafile.good_start.toString().substring(0, si);
                               $scope.datafile.good_end = $scope.datafile.good_end.toString().substring(0, ei);
                           }
                           DATA_FILE.update({ id: $scope.datafile.data_file_id }, $scope.datafile).$promise.then(function () {
                               FILE.update({ id: $scope.aFile.file_id }, $scope.aFile).$promise.then(function (fileResponse) {
                                   toastr.success("File Updated");
                                   fileResponse.fileBelongsTo = "DataFile File";
                                   $scope.DepSensorFiles[$scope.existFileIndex] = fileResponse;
                                   $scope.allSFiles[$scope.allSFileIndex] = fileResponse;
                                   Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                   $scope.showFileForm = false; $scope.depSenfileIsUploading = false;
                               }, function (errorResponse) {
                                    $scope.depSenfileIsUploading = false;
                                    toastr.error("Error saving file: " + errorResponse.statusText);
                               });
                            }, function (errorResponse) {
                                $scope.depSenfileIsUploading = false; //Loading...
                                toastr.error("Error saving data file: " + errorResponse.statusText);
                            });
                   } else {
                       //has SOURCE
                       $scope.aSource.source_name = $scope.aSource.FULLname;
                       SOURCE.update({ id: $scope.aSource.source_id }, $scope.aSource).$promise.then(function () {
                           FILE.update({ id: $scope.aFile.file_id }, $scope.aFile).$promise.then(function (fileResponse) {
                               toastr.success("File Updated");
                               fileResponse.fileBelongsTo = "Sensor File";
                               $scope.DepSensorFiles[$scope.existFileIndex] = fileResponse;
                               $scope.allSFiles[$scope.allSFileIndex] = fileResponse;
                               Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                               $scope.showFileForm = false; $scope.depSenfileIsUploading = false;
                            }, function (errorResponse) {
                                $scope.depSenfileIsUploading = false;
                                toastr.error("Error saving file: " +errorResponse.statusText);
                            });
                        }, function (errorResponse) {
                            $scope.depSenfileIsUploading = false; //Loading...
                            toastr.error("Error saving source: " +errorResponse.statusText);
                        });
                   }
               }//end valid
           };//end save()

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
                   FILE.delete({ id: fileToRemove.file_id }).$promise.then(function () {
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
            //#endregion file Upload

            //#region NWIS Connection
            $scope.showNWISFile = function (f) {
                //want to add or edit file
                $scope.existFileIndex = -1;
                $scope.allSFileIndex = -1; //indexes for splice/change
                if (f !== 0) {
                    //edit NWIS file
                    $scope.existFileIndex = $scope.sensorNWISFiles.indexOf(f);
                    $scope.allSFileIndex = $scope.allSFiles.indexOf(f);
                    $scope.NWISFile = angular.copy(f);
                    $scope.NWISFile.file_date = new Date($scope.NWISFile.file_date); //date for validity of form on PUT
                    $scope.NWISFile.FileType = "Data";
                    DATA_FILE.query({ id: f.data_file_id }).$promise.then(function (df) {
                        $scope.NWISDF = df;
                        $scope.nwisProcessor = allMembers.filter(function (m) { return m.member_id == $scope.NWISDF.processor_id; })[0];
                        $scope.NWISDF.collect_date = new Date($scope.NWISDF.collect_date);
                        $scope.NWISDF.good_start = getDateTimeParts($scope.NWISDF.good_start);
                        $scope.NWISDF.good_end = getDateTimeParts($scope.NWISDF.good_end);
                    });
                    //end existing file
                } else {
                    //creating a nwis file
                    $scope.NWISFile = {
                        name: 'http://waterdata.usgs.gov/nwis/uv?site_no=' + $scope.thisSensorSite.usgs_sid,  // if [fill in if not here.. TODO...&begin_date=20160413&end_date=20160419 (event start/end)
                        path: '<link>',
                        file_date: new Date(),
                        filetype_id: 2,
                        FileType: 'Data',
                        site_id: $scope.aSensor.site_id,
                        data_file_id: 0,
                        instrument_id: $scope.aSensor.instrument_id,
                        is_nwis: 1
                    };
                    $scope.NWISDF = {
                        processor_id: $cookies.get("mID"),
                        instrument_id: $scope.aSensor.instrument_id,
                        collect_date: dt[0],
                        time_zone: dt[1],
                        good_start: new Date(),
                        good_end: new Date()
                    };
                    $scope.nwisProcessor = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];
                } //end new file
                $scope.showNWISFileForm = true;
            };
            var postApprovalForNWISfile = function (DFid) {
                DATA_FILE.approveNWISDF({ id: DFid }).$promise.then(function (approvalResponse) {
                    $scope.NWISDF.approval_id = approvalResponse.approval_id;
                });
            };
            $scope.createNWISFile = function (valid) {
                //make sure end date is after start date
                var s = $scope.NWISDF.good_start;//need to get dep status date in same format as retrieved to compare
                var e = $scope.NWISDF.good_end; //stupid comma in there making it not the same
                if (new Date(e) < new Date(s)) {
                    valid = false;
                    var fixDate = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>The good end date must be after the good start date.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                    fixDate.result.then(function () {
                        valid = false;
                    });
                }
                if (valid) {
                    $scope.depNWISSenfileIsUploading = true; //Loading...
                    $http.defaults.headers.common.Authorization = 'Basic ' +$cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //post datafile first to get or data_file_id
                    //determine timezone
                    if ($scope.NWISDF.time_zone != "UTC") {
                        //convert it
                        var utcStartDateTime = new Date($scope.NWISDF.good_start).toUTCString();
                        var utcEndDateTime = new Date($scope.NWISDF.good_end).toUTCString();
                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        var si = $scope.NWISDF.good_start.toString().indexOf('GMT') + 3;
                        var ei = $scope.NWISDF.good_end.toString().indexOf('GMT') + 3;
                        $scope.NWISDF.good_start = $scope.NWISDF.good_start.toString().substring(0, si);
                        $scope.NWISDF.good_end = $scope.NWISDF.good_end.toString().substring(0, ei);
                    }
                   
                    DATA_FILE.save($scope.NWISDF).$promise.then(function (NdfResponse) {
                        //now create an approval with the event's coordinator and add the approval_id, put it, then post the file TODO ::: NEW ENDPOINT FOR THIS
                        //then POST file
                        $scope.NWISDF.data_file_id = NdfResponse.data_file_id;
                        postApprovalForNWISfile(NdfResponse.data_file_id); //process approval
                        //now POST File
                        $scope.NWISFile.data_file_id = NdfResponse.data_file_id;
                        $scope.NWISFile.path = '<link>';
                        delete $scope.NWISFile.FileType;
                        FILE.save($scope.NWISFile).$promise.then(function (Fresponse) {
                            toastr.success("File Data saved");
                            Fresponse.fileBelongsTo = "DataFile File";
                            $scope.sensorNWISFiles.push(Fresponse);
                            $scope.allSFiles.push(Fresponse);
                            Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard                 
                            $scope.showNWISFileForm = false; $scope.depNWISSenfileIsUploading = false; //Loading...
                        }, function (errorResponse) {
                            $scope.depNWISSenfileIsUploading = false; //Loading...
                            toastr.error("Error saving file: " + errorResponse.statusText);
                        });
                    }, function (errorResponse) {
                        $scope.depNWISSenfileIsUploading = false; //Loading...
                        toastr.error("Error saving data file info: " + errorResponse.statusText);
                    });//end source.save()
                }//end valid
            };// end create NWIS file
            //update this NWIS file
            $scope.saveNWISFile = function (valid) {
                //make sure end date is after start date
                var s = $scope.NWISDF.good_start;//need to get dep status date in same format as retrieved to compare
                var e = $scope.NWISDF.good_end; //stupid comma in there making it not the same
                if (new Date(e) < new Date(s)) {
                    valid = false;
                    var fixDate = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>The good end date must be after the good start date.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                    fixDate.result.then(function () {
                        valid = false;
                    });
                }
                if (valid) {
                    //put source or datafile, put file
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //check timezone and make sure date stays utc
                    if ($scope.NWISDF.time_zone != "UTC") {
                        //convert it
                        var utcStartDateTime = new Date($scope.NWISDF.good_start).toUTCString();
                        var utcEndDateTime = new Date($scope.NWISDF.good_end).toUTCString();
                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        var si = $scope.NWISDF.good_start.toString().indexOf('GMT') + 3;
                        var ei = $scope.NWISDF.good_end.toString().indexOf('GMT') + 3;
                        $scope.NWISDF.good_start = $scope.NWISDF.good_start.toString().substring(0, si);
                        $scope.NWISDF.good_end = $scope.NWISDF.good_end.toString().substring(0, ei);
                    }
                    DATA_FILE.update({ id: $scope.NWISDF.data_file_id }, $scope.NWISDF).$promise.then(function () {
                        FILE.update({ id: $scope.NWISFile.file_id }, $scope.NWISFile).$promise.then(function (fileResponse) {
                            toastr.success("File Data Updated");
                            fileResponse.fileBelongsTo = "DataFile File";
                            $scope.sensorNWISFiles[$scope.existFileIndex] = fileResponse;
                            $scope.allSFiles[$scope.allSFileIndex] = fileResponse;
                            Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                            $scope.showNWISFileForm = false;
                        }, function (errorResponse) {
                            toastr.error("Error saving file: " + errorResponse.statusText);
                        });
                    }, function (errorResponse) {
                        toastr.error("Error saving data: " + errorResponse.statusText);
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
                    $http.defaults.headers.common.Authorization = 'Basic ' +$cookies.get('STNCreds');
                    FILE.delete({ id: fileToRemove.file_id }).$promise.then(function () {
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

            //#region tape down section           
            $scope.OPchosen = function (opChosen) {
               var opI = $scope.OPsForTapeDown.map(function (o) { return o.objective_point_id; }).indexOf(opChosen.objective_point_id);               
               if (opChosen.selected) {
                   //they picked an OP to use for tapedown
                   $scope.OPMeasure = {};
                   $scope.OPMeasure.op_name = opChosen.name;
                   $scope.OPMeasure.elevation = opChosen.elev_ft;
                   $scope.OPMeasure.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == opChosen.vdatum_id; })[0].datum_abbreviation;
                   $scope.OPMeasure.objective_point_id = opChosen.objective_point_id;
                   //are we looking at create deployment or edit deployment;
                   if ($scope.aSensor.instrument_id !== undefined && $scope.aSensStatus.status_type_id !== 4) {
                       $scope.depTapeCopy.push($scope.OPMeasure);
                       $scope.depStuffCopy[1].vdatum_id = opChosen.vdatum_id;
                   } else {
                       $scope.tapeDownTable.push($scope.OPMeasure);
                       $scope.aSensStatus.vdatum_id = opChosen.vdatum_id;
                   }                   
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
                           var createOrEdit = $scope.aSensor.instrument_id !== undefined && $scope.aSensStatus.status_type_id !== 4 ? "edit" : "create"; // edit deployment or creating a deployment
                           var tapeDownToRemove = createOrEdit == 'edit' ? $scope.depTapeCopy.filter(function(a) { return a.objective_point_id == opChosen.objective_point_id; })[0] :
                               $scope.tapeDownTable.filter(function (a) { return a.objective_point_id == opChosen.objective_point_id; })[0];

                           var tInd = createOrEdit == 'edit' ? $scope.depTapeCopy.map(function(o) { return o.objective_point_id; }).indexOf(tapeDownToRemove.objective_point_id) :
                                $scope.tapeDownTable.map(function (o) { return o.objective_point_id; }).indexOf(tapeDownToRemove.objective_point_id);

                           if (tapeDownToRemove.op_measurements_id !== undefined) $scope.removeOPList.push(tapeDownToRemove.op_measurements_id);
                           createOrEdit == 'edit' ? $scope.depTapeCopy.splice(tInd, 1) : $scope.tapeDownTable.splice(tInd, 1);

                           //if this empties the table, clear the sensStatus fields related to tapedowns
                           if (createOrEdit == 'edit') {
                               if ($scope.depTapeCopy.length === 0) {
                                   $scope.depStuffCopy[1].vdatum_id = 0; $scope.depStuffCopy[1].gs_elevation = ''; $scope.depStuffCopy[1].ws_elevation = ''; $scope.depStuffCopy[1].sensor_elevation = '';
                               }
                           } else {
                               if ($scope.tapeDownTable.length === 0) {
                                   $scope.aSensStatus.vdatum_id = 0; $scope.aSensStatus.gs_elevation = ''; $scope.aSensStatus.ws_elevation = ''; $scope.aSensStatus.sensor_elevation = '';
                               }
                           }
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
               $scope.EventName = $scope.eventList.filter(function (el) { return el.event_id == $scope.adminChanged.event_id; })[0].event_name;
           };

           //get deployment types for sensor type chosen
           $scope.getDepTypes = function () {
               $scope.filteredDeploymentTypes = [];
               var matchingSensDeplist = $scope.sensorTypeList.filter(function (sd) { return sd.sensor_type_id == $scope.aSensor.sensor_type_id; })[0];
               //this is 1 sensorType with inner list of  .deploymenttypes
               $scope.filteredDeploymentTypes = matchingSensDeplist.deploymenttypes;
               
               if ($scope.filteredDeploymentTypes.length == 1) 
                   $scope.aSensor.deployment_type_id = $scope.filteredDeploymentTypes[0].deployment_type_id;
               
           };

           // $scope.sessionEvent = $cookies.get('SessionEventName');
           $scope.LoggedInMember = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];

           $scope.aSensor = {};
           $scope.aSensStatus = {};
           
           $scope.thisSensorSite = SensorSite;

           //cancel
           $scope.cancel = function () {
               $rootScope.stateIsLoading.showLoading = false; // loading.. 
               var sensorObjectToSendBack = thisSensor;
               $timeout(function () {
                   // anything you want can go here and will safely be run on the next digest.                   
                   var sendBack = [sensorObjectToSendBack];
                   $uibModalInstance.close(sendBack);
               });
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
           var dealWithTimeStampb4Send = function (w) {
               //check and see if they are not using UTC
               if (w == 'saving'){
                   if ($scope.depStuffCopy[1].time_zone != "UTC") {
                       //convert it
                       var utcDateTimeS = new Date($scope.depStuffCopy[1].time_stamp).toUTCString();
                       $scope.depStuffCopy[1].time_stamp = utcDateTimeS;
                       $scope.depStuffCopy[1].time_zone = 'UTC';
                   } else {
                       //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                       var i = $scope.depStuffCopy[1].time_stamp.toString().indexOf('GMT') +3;
                       $scope.depStuffCopy[1].time_stamp = $scope.depStuffCopy[1].time_stamp.toString().substring(0, i);
                   }
               } else {
                   if ($scope.aSensStatus.time_zone != "UTC") {
                       //convert it
                       var utcDateTimeD = new Date($scope.aSensStatus.time_stamp).toUTCString();
                       $scope.aSensStatus.time_stamp = utcDateTimeD;
                       $scope.aSensStatus.time_zone = 'UTC';
                   } else {
                       //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                       var Di = $scope.aSensStatus.time_stamp.toString().indexOf('GMT') + 3;
                       $scope.aSensStatus.time_stamp = $scope.aSensStatus.time_stamp.toString().substring(0, Di);
                   }
               }
           };

            //save aSensor
            $scope.save = function (valid) {
                if(valid) {
                    var updatedSensor = {};
                    var updatedSenStat = {};
                    //admin changed the event for this sensor..
                    if ($scope.adminChanged.event_id !== undefined)
                        $scope.depStuffCopy[0].event_id = $scope.adminChanged.event_id;

                    //see if they used Minutes or seconds for interval. need to store in seconds
                    if ($scope.IntervalType.type == "Minutes")
                        $scope.depStuffCopy[0].interval = $scope.depStuffCopy[0].interval * 60;

                    dealWithTimeStampb4Send('saving'); //UTC or local?
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    INSTRUMENT.update({ id: $scope.depStuffCopy[0].instrument_id }, $scope.depStuffCopy[0]).$promise.then(function (response) {
                        updatedSensor = response;
                        updatedSensor.deploymentType = $scope.depStuffCopy[0].deployment_type_id > 0 ? $scope.depTypeList.filter(function (d) { return d.deployment_type_id == $scope.depStuffCopy[0].deployment_type_id; })[0].method : '';
                        updatedSensor.housingType = $scope.depStuffCopy[0].housing_type_id > 0 ? $scope.houseTypeList.filter(function (h) { return h.housing_type_id == $scope.depStuffCopy[0].housing_type_id; })[0].type_name : '';
                        updatedSensor.sensorBrand = $scope.sensorBrandList.filter(function (s) { return s.sensor_brand_id == $scope.depStuffCopy[0].sensor_brand_id; })[0].brand_name;
                        updatedSensor.sensorType = $scope.sensorTypeList.filter(function (t) { return t.sensor_type_id == $scope.depStuffCopy[0].sensor_type_id; })[0].sensor;
                        INSTRUMENT_STATUS.update({ id: $scope.depStuffCopy[1].instrument_status_id }, $scope.depStuffCopy[1]).$promise.then(function (statResponse) {
                            
                            //deal with tapedowns. remove/add
                            for (var rt = 0; rt < $scope.removeOPList.length; rt++) {
                                var idToRemove = $scope.removeOPList[rt];
                                OP_MEASURE.delete({ id: idToRemove }).$promise;
                            }
                            $scope.tapeDownTable = $scope.depTapeCopy.length > 0 ? [] : $scope.tapeDownTable;
                            for (var at = 0; at < $scope.depTapeCopy.length; at++) {
                                var DEPthisTape = $scope.depTapeCopy[at];
                                if (DEPthisTape.op_measurements_id !== undefined) {
                                    //existing, put in case they changed it
                                    OP_MEASURE.update({ id: DEPthisTape.op_measurements_id }, DEPthisTape).$promise.then(function (tapeResponse) {
                                        tapeResponse.op_name = DEPthisTape.op_name;
                                        tapeResponse.Vdatum = DEPthisTape.Vdatum;
                                        $scope.tapeDownTable.push(tapeResponse);
                                    });
                                } else {
                                    //new one added, post
                                    DEPthisTape.instrument_status_id = statResponse.instrument_status_id;
                                    OP_MEASURE.save(DEPthisTape).$promise.then(function (tapeResponse) {
                                        tapeResponse.op_name = DEPthisTape.op_name;
                                        tapeResponse.Vdatum = DEPthisTape.Vdatum;
                                        $scope.tapeDownTable.push(tapeResponse);
                                    });
                                }
                            }
                            //now add instrument and instrument status to send back
                            updatedSenStat = statResponse;
                            updatedSenStat.status = 'Deployed';
                            var instrument_statusesHolder = $scope.aSensor.instrument_status; //put them here so they can be updated and readded (all versions)
                            $scope.aSensor = updatedSensor;
                            thisSensor = updatedSensor; thisSensor.instrument_status = instrument_statusesHolder;
                            $scope.aSensStatus = updatedSenStat;
                            $scope.aSensStatus.time_stamp = getDateTimeParts($scope.aSensStatus.time_stamp);//this keeps it as utc in display
                                                        
                            var ind = thisSensor.instrument_status.map(function (i) { return i.status_type_id; }).indexOf(1);
                            thisSensor.instrument_status[ind] = $scope.aSensStatus;
                            $scope.depStuffCopy = []; $scope.IntervalType = { type: 'Seconds' };
                            $scope.view.DEPval = 'detail';
                            toastr.success("Sensor Updated");
                        }, function (errorResponse) {
                            toastr.error("error saving sensor status: " + errorResponse.statusText);
                        });
                    }, function (errorResponse) {
                        toastr.error("error saving sensor: " + errorResponse.statusText);
                    });
               }
           };//end save()

           //create (POST) a deployed sensor click
           $scope.deploy = function () {
               if (this.SensorForm.$valid) {
                   //see if they used Minutes or seconds for interval. need to store in seconds
                   if ($scope.IntervalType.type == "Minutes")
                       $scope.aSensor.interval = $scope.aSensor.interval * 60;
                   //set event_id
                   $scope.aSensor.event_id = $cookies.get('SessionEventID');
                   $scope.aSensor.site_id = SensorSite.site_id;
                   dealWithTimeStampb4Send('deploy'); //UTC or local?
                   $scope.aSensStatus.status_type_id = 1; //deployed status
                   $scope.aSensStatus.member_id = $cookies.get('mID'); //user that logged in is deployer
                   var createdSensor = {}; var depSenStat = {};
                   $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                   $http.defaults.headers.common.Accept = 'application/json';

                   //DEPLOY PROPOSED or CREATE NEW deployment?
                   if ($scope.aSensor.instrument_id !== undefined) {
                       //put instrument, post status for deploying PROPOSED sensor
                       INSTRUMENT.update({ id: $scope.aSensor.instrument_id }, $scope.aSensor).$promise.then(function (response) {
                           //create instrumentstatus too need: status_type_id and instrument_id
                           createdSensor = response;
                           createdSensor.deploymentType = $scope.aSensor.deploymentType;
                           createdSensor.housingType = response.housing_type_id > 0 ? $scope.houseTypeList.filter(function (h) { return h.housing_type_id == response.housing_type_id; })[0].type_name : '';
                           createdSensor.sensorBrand = $scope.sensorBrandList.filter(function (s) { return s.sensor_brand_id == response.sensor_brand_id; })[0].brand_name;
                           createdSensor.sensorType = $scope.sensorTypeList.filter(function (t) { return t.sensor_type_id == response.sensor_type_id; })[0].sensor;
                           $scope.aSensStatus.instrument_id = response.instrument_id;
                           INSTRUMENT_STATUS.save($scope.aSensStatus).$promise.then(function (statResponse) {
                               //any tape downs?
                               if ($scope.tapeDownTable.length > 0) {
                                   for (var t = 0; t < $scope.tapeDownTable.length; t++) {
                                       var thisTape = $scope.tapeDownTable[t];
                                       thisTape.instrument_status_id = statResponse.instrument_status_id;
                                       ///POST IT///
                                       OP_MEASURE.save(thisTape).$promise;
                                   }
                               }
                               //build the createdSensor to send back and add to the list page
                               depSenStat = statResponse;
                               //add Status
                               depSenStat.status = 'Deployed';
                               createdSensor.instrument_status = [depSenStat, $scope.previousStateStatus];                               
                               $timeout(function () {
                                   // anything you want can go here and will safely be run on the next digest.
                                   toastr.success("Sensor deployed");
                                   var state = $scope.whichButton == 'deployP' ? 'proposedDeployed' : 'newDeployed';
                                   var sendBack = [createdSensor, state];
                                   $uibModalInstance.close(sendBack);
                               });
                           });
                       });
                   } else {
                       //post instrument and status for deploying NEW sensor
                       INSTRUMENT.save($scope.aSensor).$promise.then(function (response) {
                           //create instrumentstatus too need: status_type_id and instrument_id
                           createdSensor = response;
                           createdSensor.deploymentType = response.deployment_type_id !== null && response.deployment_type_id !== undefined ? $scope.depTypeList.filter(function (d) { return d.deployment_type_id == response.deployment_type_id; })[0].method : "";
                           createdSensor.housingType = response.housing_type_id !== null && response.housing_type_id !== undefined ? $scope.houseTypeList.filter(function (h) { return h.housing_type_id == response.housing_type_id; })[0].type_name : '';
                           createdSensor.sensorBrand = $scope.sensorBrandList.filter(function (s) { return s.sensor_brand_id == response.sensor_brand_id; })[0].brand_name;
                           createdSensor.sensorType = $scope.sensorTypeList.filter(function (t) { return t.sensor_type_id == response.sensor_type_id; })[0].sensor;
                           $scope.aSensStatus.instrument_id = response.instrument_id;

                           INSTRUMENT_STATUS.save($scope.aSensStatus).$promise.then(function (statResponse) {
                               //any tape downs?
                               if ($scope.tapeDownTable.length > 0){
                                   for (var t = 0; t < $scope.tapeDownTable.length; t++){
                                       var thisTape = $scope.tapeDownTable[t];
                                       thisTape.instrument_status_id = statResponse.instrument_status_id;
                                       ///POST IT///
                                       OP_MEASURE.save(thisTape).$promise;
                                   } 
                               }
                               //build the createdSensor to send back and add to the list page
                               depSenStat = statResponse;
                               depSenStat.status = 'Deployed';
                               createdSensor.instrument_status = [depSenStat];                               
                               toastr.success("Sensor deployed");
                               var state = $scope.whichButton == 'deployP' ? 'proposedDeployed' : 'newDeployed';
                               var sendBack = [createdSensor, state];
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
                   INSTRUMENT.delete({ id: sensorToRemove.instrument_id }).$promise.then(function () {
                       $scope.DepSensorFiles = []; //clear out sensorFiles for this sensor
                       $scope.depSensImageFiles = []; //clear out image files for this sensor
                       //now remove all these files from SiteFiles
                       var l = $scope.allSFiles.length;
                       while (l--) {
                           if ($scope.allSFiles[l].instrument_id == sensorToRemove.instrument_id) $scope.allSFiles.splice(l, 1);
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
               $scope.aSensor = angular.copy(thisSensor);
               $scope.aSensStatus = angular.copy(thisSensor.instrument_status[0]);
               $scope.sensorDataNWIS = (($scope.aSensor.sensor_type_id == 2 || $scope.aSensor.sensor_type_id == 5) || $scope.aSensor.sensor_type_id == 6) ? true : false;
               $scope.getDepTypes();//populate $scope.filteredDeploymentTypes for dropdown options
               $scope.IntervalType.type = 'Seconds'; //default
               if ($scope.sensorDataNWIS) {
                   //FILE.VALIDATED being used to store 1 if this is an nwis file metadata link
                   $scope.sensorNWISFiles = [];
                   for (var ai = $scope.DepSensorFiles.length - 1; ai >= 0; ai--) {
                       if ($scope.DepSensorFiles[ai].is_nwis == 1) {
                           $scope.sensorNWISFiles.push($scope.DepSensorFiles[ai]);
                           $scope.DepSensorFiles.splice(ai, 1);
                       }
                   }
                   var dt = getTimeZoneStamp();
                   $scope.NWISFile = {};
                   $scope.NWISDF = {};
               }
               
               //are we deploying a proposed sensor or editing a deployed sensor??
               if (thisSensor.instrument_status[0].status == "Proposed") {
                   //deploying proposed
                   $scope.previousStateStatus = angular.copy(thisSensor.instrument_status[0]); //hold the proposed state (proposed to deployed)
                   $scope.whichButton = 'deployP';
                   $scope.aSensor.interval = $scope.aSensor.interval === 0 ? null : $scope.aSensor.interval; //clear out the '0' value here               
                  //displaying date / time it user's timezone
                   var timeParts = getTimeZoneStamp();
                   $scope.aSensStatus.time_stamp = timeParts[0];
                   $scope.aSensStatus.time_zone = timeParts[1]; //will be converted to utc on post/put
                   $scope.aSensStatus.member_id = $cookies.get('mID'); // member logged in is deploying it
                   $scope.EventName = $cookies.get('SessionEventName');
                   $scope.Deployer = $scope.LoggedInMember;
               } else {
                   //editing deployed
                   $scope.whichButton = 'edit';
                   $scope.aSensor.interval = $scope.aSensor.interval === 0 ? null : $scope.aSensor.interval; //clear out the '0' value here   
                   //get this deployed sensor's event name
                   $scope.EventName = $scope.eventList.filter(function (e) { return e.event_id == $scope.aSensor.event_id; })[0].event_name;
                   //date formatting. this keeps it in utc for display
                   $scope.aSensStatus.time_stamp = getDateTimeParts($scope.aSensStatus.time_stamp);
                   //get collection member's name 
                   $scope.Deployer = $scope.aSensStatus.member_id !== null || $scope.aSensStatus.member_id !== undefined ? allMembers.filter(function (m) { return m.member_id == $scope.aSensStatus.member_id; })[0] : {};
                   OP_MEASURE.getInstStatOPMeasures({instrumentStatusId: $scope.aSensStatus.instrument_status_id}).$promise.then(function(response){
                       for (var r = 0; r < response.length; r++) {
                           var sensMeasures = response[r];
                           var whichOP = siteOPs.filter(function (op) { return op.objective_point_id == response[r].objective_point_id; })[0];
                           sensMeasures.elevation = whichOP.elev_ft;
                           sensMeasures.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == whichOP.vdatum_id; })[0].datum_abbreviation;
                           sensMeasures.op_name = whichOP.name;
                           $scope.tapeDownTable.push(sensMeasures);
                       }
                        //go through OPsForTapeDown and add selected Property.
                       for (var i = 0; i < $scope.OPsForTapeDown.length; i++) {
                           //for each one, if response has this id, add 'selected:true' else add 'selected:false'
                           for (var y = 0; y < response.length; y++) {
                               if (response[y].objective_point_id == $scope.OPsForTapeDown[i].objective_point_id) {
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
               $rootScope.stateIsLoading.showLoading = false;// loading..
               //#endregion existing Sensor
           } else {
               //#region Deploying new Sensor
               $scope.whichButton = 'deploy';
               $scope.IntervalType.type = 'Seconds'; //default
               //displaying date / time it user's timezone
               var DeptimeParts = getTimeZoneStamp();
               $scope.aSensStatus.time_stamp = DeptimeParts[0];
               $scope.aSensStatus.time_zone = DeptimeParts[1]; //will be converted to utc on post/put          
               $scope.aSensStatus.member_id = $cookies.get('mID'); // member logged in is deploying it
               $scope.EventName = $cookies.get('SessionEventName');
               $scope.Deployer = $scope.LoggedInMember;
               $rootScope.stateIsLoading.showLoading = false;// loading..
               //#endregion new Sensor
           }

           $scope.myData = [$scope.aSensStatus.sensor_elevation, $scope.aSensStatus.ws_elevation, $scope.aSensStatus.gs_elevation];
            //edit button clicked. make copy of deployed info 
           $scope.wannaEditDep = function () {
               $scope.view.DEPval = 'edit';
               $scope.depStuffCopy = [angular.copy($scope.aSensor), angular.copy($scope.aSensStatus)];
               $scope.depTapeCopy = angular.copy($scope.tapeDownTable);
           };
           $scope.cancelDepEdit = function () {
               $scope.view.DEPval = 'detail';
               $scope.depStuffCopy = [];
               $scope.depTapeCopy = [];
               //MAKE SURE ALL SELECTED OP'S STAY SELECTED
               for (var i = 0; i < $scope.OPsForTapeDown.length; i++) {
                   //for each one, if response has this id, add 'selected:true' else add 'selected:false'
                   for (var y = 0; y < $scope.tapeDownTable.length; y++) {
                       if ($scope.tapeDownTable[y].objective_point_id == $scope.OPsForTapeDown[i].objective_point_id) {
                           $scope.OPsForTapeDown[i].selected = true;
                           y = $scope.tapeDownTable.length; //ensures it doesn't set it as false after setting it as true
                       }
                       else {
                           $scope.OPsForTapeDown[i].selected = false;
                       }
                   }
                   if ($scope.tapeDownTable.length === 0)
                       $scope.OPsForTapeDown[i].selected = false;
               }
           };

        }]); //end SENSOR

    // Retrieve a Sensor modal
    ModalControllers.controller('sensorRetrievalModalCtrl', ['$scope', '$rootScope', '$timeout', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'thisSensor', 'SensorSite', 'siteOPs', 'allEventList', 'allVDatumList', 'allMembers', 'allStatusTypes', 'allInstCollCond', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'OP_MEASURE',
        function ($scope, $rootScope, $timeout, $cookies, $http, $uibModalInstance, $uibModal, thisSensor, SensorSite, siteOPs, allEventList, allVDatumList, allMembers, allStatusTypes, allInstCollCond, INSTRUMENT, INSTRUMENT_STATUS, OP_MEASURE) {
            $scope.aSensor = thisSensor;
            $scope.EventName = allEventList.filter(function (r) {return r.event_id == $scope.aSensor.event_id;})[0].event_name;            
            $scope.depSensStatus = angular.copy(thisSensor.instrument_status[0]);
            var isDate = Object.prototype.toString.call($scope.depSensStatus.time_stamp) === '[object Date]';
            if (isDate === false) {
                var y = $scope.depSensStatus.time_stamp.substr(0, 4);
                var m = $scope.depSensStatus.time_stamp.substr(5, 2) - 1; //subtract 1 for index value (January is 0)
                var d = $scope.depSensStatus.time_stamp.substr(8, 2);
                var h = $scope.depSensStatus.time_stamp.substr(11, 2);
                var mi = $scope.depSensStatus.time_stamp.substr(14, 2);
                var sec = $scope.depSensStatus.time_stamp.substr(17, 2);
                $scope.depSensStatus.time_stamp = new Date(y, m, d, h, mi, sec);
            }
            if ($scope.depSensStatus.vdatum_id !== undefined && $scope.depSensStatus.vdatum_id > 0)
                $scope.depSensStatus.VDatum = allVDatumList.filter(function (v) { return v.datum_id == $scope.depSensStatus.vdatum_id; })[0].datum_abbreviation;

            $scope.OPsForTapeDown = siteOPs;
            $scope.OPsPresent = siteOPs.length > 0 ? true : false;
            $scope.vertDatumList = allVDatumList;
            $scope.removeOPList = [];
            $scope.tapeDownTable = []; //holder of tapedown OP_MEASUREMENTS
            $scope.DEPtapeDownTable = []; //holds any deployed tapedowns

            $scope.Deployer = allMembers.filter(function (m) { return m.member_id == $scope.depSensStatus.member_id; })[0];
            $scope.whichButton = 'Retrieve';
            $scope.statusTypeList = allStatusTypes.filter(function (s) { return s.status == "Retrieved" || s.status == "Lost"; });
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
            $scope.OPchosen = function (opChosen) {
                var opI = $scope.OPsForTapeDown.map(function (o) { return o.objective_point_id; }).indexOf(opChosen.objective_point_id);
                if (opChosen.selected) {
                    //they picked an OP to use for tapedown
                    $scope.OPMeasure = {};
                    $scope.OPMeasure.op_name = opChosen.name;
                    $scope.OPMeasure.elevation = opChosen.elev_ft;
                    $scope.OPMeasure.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == opChosen.vdatum_id; })[0].datum_abbreviation;
                    $scope.OPMeasure.objective_point_id = opChosen.objective_point_id;
                    //$scope.OPMeasure.op_name = opName;
                    $scope.tapeDownTable.push($scope.OPMeasure);
                    $scope.aRetrieval.vdatum_id = opChosen.vdatum_id;
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
                            var tapeDownToRemove = $scope.tapeDownTable.filter(function (a) { return a.objective_point_id == opChosen.objective_point_id; })[0];
                            var tInd = $scope.tapeDownTable.map(function (o) { return o.objective_point_id; }).indexOf(tapeDownToRemove.objective_point_id);
                            if (tapeDownToRemove.op_measurements_id !== undefined) $scope.removeOPList.push(tapeDownToRemove.op_measurements_id);
                            $scope.tapeDownTable.splice(tInd, 1);
                            if ($scope.tapeDownTable.length === 0) {
                                $scope.aRetrieval.vdatum_id = 0; $scope.aRetrieval.gs_elevation = ''; $scope.aRetrieval.ws_elevation = ''; $scope.aRetrieval.sensor_elevation = '';
                            }
                        } else {
                            //never mind, make it selected again
                            $scope.OPsForTapeDown[opI].selected = true;
                        }
                    });
                }
            };
            //get deploy status tapedowns to add to top for display
            OP_MEASURE.getInstStatOPMeasures({ instrumentStatusId: $scope.depSensStatus.instrument_status_id }).$promise.then(function (response) {
                for (var r = 0; r < response.length; r++) {
                    var sensMeasures = response[r];
                    var whichOP = siteOPs.filter(function (op) { return op.objective_point_id == response[r].objective_point_id; })[0];
                    sensMeasures.elevation = whichOP.elev_ft;
                    sensMeasures.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == whichOP.vdatum_id; })[0].datum_abbreviation;
                    sensMeasures.op_name = whichOP.name;
                    $scope.DEPtapeDownTable.push(sensMeasures);
                }                
            });

            //#endregion tape down section 

            //default formatting for retrieval
            var dtparts = getTimeZoneStamp();
            $scope.aRetrieval = { time_stamp: dtparts[0], time_zone: dtparts[1], instrument_id: $scope.aSensor.instrument_id, member_id: $cookies.get('mID') };
            $scope.Retriever = allMembers.filter(function (am) { return am.member_id == $cookies.get('mID'); })[0];

            //is it UTC or local time..make sure it stays UTC
            var dealWithTimeStampb4Send = function () {
                //check and see if they are not using UTC
                if ($scope.aRetrieval.time_zone != "UTC") {
                    //convert it
                    var utcDateTime = new Date($scope.aRetrieval.time_stamp).toUTCString();
                    $scope.aRetrieval.time_stamp = utcDateTime;
                    $scope.aRetrieval.time_zone = 'UTC';
                } else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.aRetrieval.time_stamp.toString().indexOf('GMT') + 3;
                    $scope.aRetrieval.time_stamp = $scope.aRetrieval.time_stamp.toString().substring(0, i);
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
                var i = $scope.depSensStatus.time_stamp.toString().indexOf('GMT') + 3;
                returnThis = $scope.depSensStatus.time_stamp.toString().substring(0, i);
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
                    var retSenTS = angular.copy($scope.aRetrieval.time_stamp.replace(/\,/g, "")); //stupid comma in there making it not the same
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
                            $scope.aRetrieval.time_stamp = '';
                            $scope.aRetrieval.time_stamp = getTimeZoneStamp()[0];
                            $scope.aRetrieval.time_zone = getTimeZoneStamp()[1];
                            angular.element('#retrievalDate').trigger('focus');
                        });
                    } else {
                        $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                        $http.defaults.headers.common.Accept = 'application/json';
                        var updatedSensor = {}; var createRetSens = {};
                        INSTRUMENT.update({ id: $scope.aSensor.instrument_id }, $scope.aSensor).$promise.then(function (response) {
                            //create instrumentstatus too need: status_type_id and instrument_id
                            updatedSensor = response;
                            updatedSensor.deploymentType = $scope.aSensor.deploymentType;
                            updatedSensor.housingType = $scope.aSensor.housingType;
                            updatedSensor.sensorBrand = $scope.aSensor.sensorBrand;
                            updatedSensor.sensorType = $scope.aSensor.sensorType;
                            updatedSensor.instCollection = $scope.collectCondList.filter(function (i) { return i.id === $scope.aSensor.inst_collection_id; })[0].condition;

                            INSTRUMENT_STATUS.save($scope.aRetrieval).$promise.then(function (statResponse) {
                                //any tape downs?
                                if ($scope.tapeDownTable.length > 0) {
                                    for (var t = 0; t < $scope.tapeDownTable.length; t++) {
                                        var thisTape = $scope.tapeDownTable[t];
                                        thisTape.instrument_status_id = statResponse.instrument_status_id;
                                        ///POST IT///
                                        OP_MEASURE.save(thisTape).$promise;
                                    }
                                }
                                //build the createdSensor to send back and add to the list page
                                createRetSens = statResponse;
                                createRetSens.status = statResponse.status_type_id == 2 ? 'Retrieved' : 'Lost';
                                updatedSensor.instrument_status = [createRetSens, thisSensor.instrument_status[0]];
                                
                                $timeout(function () {
                                    // anything you want can go here and will safely be run on the next digest.
                                    toastr.success("Sensor retrieved");
                                    var state = 'retrieved';
                                    var sendBack = [updatedSensor, state];
                                    $uibModalInstance.close(sendBack);
                                });
                            });
                        });
                    } //end retr date is correct
                }//end if valid
            };//end retrieveS
            $rootScope.stateIsLoading.showLoading = false;
        }]);//end sensorRetrievalModalCtrl

    // view/edit retrieved sensor (deployed included here) modal
    ModalControllers.controller('fullSensorModalCtrl', ['$scope', '$rootScope', '$filter', '$timeout', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'SERVER_URL', 'FILE_STAMP', 'allDepDropdowns', 'agencyList', 'Site_Files', 'allStatusTypes', 'allInstCollCond', 'allEvents', 'allDepTypes', 'thisSensor', 'SensorSite', 'siteOPs', 'allMembers', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'DATA_FILE', 'FILE', 'SOURCE', 'OP_MEASURE',
        function ($scope, $rootScope, $filter, $timeout, $cookies, $http, $uibModalInstance, $uibModal, SERVER_URL,FILE_STAMP, allDepDropdowns, agencyList, Site_Files, allStatusTypes, allInstCollCond, allEvents, allDepTypes, thisSensor, SensorSite, siteOPs, allMembers, INSTRUMENT, INSTRUMENT_STATUS, DATA_FILE, FILE, SOURCE, OP_MEASURE) {
            /*allSensorTypes, allSensorBrands, allHousingTypes, allSensDeps*/
            $scope.serverURL = SERVER_URL;
            $scope.fullSenfileIsUploading = false; //Loading...   
            $scope.sensorTypeList = allDepDropdowns[0];
            $scope.sensorBrandList = allDepDropdowns[1];
            $scope.houseTypeList = allDepDropdowns[2];
            $scope.fileTypeList = allDepDropdowns[3]; //used if creating/editing depSens file
            $scope.vertDatumList = allDepDropdowns[4];
            $scope.allSFiles = Site_Files.getAllSiteFiles();
            $scope.sensorFiles = thisSensor !== "empty" ? $scope.allSFiles.filter(function (sf) { return sf.instrument_id == thisSensor.instrument_id; }) : [];// holder for hwm files added
            $scope.sensImageFiles = $scope.sensorFiles.filter(function (hf) { return hf.filetype_id === 1; }); //image files for carousel
            $scope.showFileForm = false; //hidden form to add file to sensor
            $scope.showNWISFileForm = false; //hidden form to add nwis file to sensor
            $scope.sensorDataNWIS = false; //is this a rain gage, met station, or rdg sensor -- if so, data file must be created pointing to nwis (we don't store actual file, just metadata with link)
            $scope.collectCondList = allInstCollCond;
            $scope.OPsPresent = siteOPs.length > 0 ? true : false;
            $scope.DEPOPsForTapeDown = angular.copy(siteOPs);
            $scope.RETOPsForTapeDown = angular.copy(siteOPs);
            $scope.depTypeList = allDepTypes; //get fresh version so not messed up with the Temperature twice
            $scope.filteredDeploymentTypes = []; //will be populated based on the sensor type chosen
            $scope.timeZoneList = ['UTC', 'PST', 'MST', 'CST', 'EST'];
            $scope.statusTypeList = allStatusTypes.filter(function (s) { return s.status == 'Retrieved' || s.status == 'Lost'; });
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
                var theDate;
                var isDate = Object.prototype.toString.call(d) === '[object Date]';
                if (isDate === false) {
                    var y = d.substr(0, 4);
                    var m = d.substr(5, 2) - 1; //subtract 1 for index value (January is 0)
                    var da = d.substr(8, 2);
                    var h = d.substr(11, 2);
                    var mi = d.substr(14, 2);
                    var sec = d.substr(17, 2);
                    theDate = new Date(y, m, da, h, mi, sec);
                } else {
                    //this is already a date, return it back
                    theDate = d;
                }
                return theDate;
            };

            $scope.thisSensorSite = SensorSite; $scope.userRole = $cookies.get('usersRole');

            $scope.sensor = angular.copy(thisSensor);
            $scope.sensorDataNWIS = (($scope.sensor.sensor_type_id == 2 || $scope.sensor.sensor_type_id == 5) || $scope.sensor.sensor_type_id == 6) ? true : false;
            
            //deploy part //////////////////
            $scope.DeployedSensorStat = angular.copy(thisSensor.instrument_status.filter(function (inst) { return inst.status === "Deployed"; })[0]);
            $scope.DeployedSensorStat.time_stamp = getDateTimeParts($scope.DeployedSensorStat.time_stamp); //this keeps it as utc in display
            //if ($scope.DeployedSensorStat.vdatum_id !== undefined)
            //    $scope.DeployedSensorStat.vdatumName = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == $scope.DeployedSensorStat.vdatum_id; })[0].datum_abbreviation;
            $scope.Deployer = allMembers.filter(function (m) { return m.member_id === $scope.DeployedSensorStat.member_id; })[0];
            $scope.DEPremoveOPList = [];
            $scope.DEPtapeDownTable = []; //holder of tapedown OP_MEASUREMENTS

            $scope.DEPOPchosen = function (DEPopChosen) {
                var opI = $scope.DEPOPsForTapeDown.map(function (o) { return o.objective_point_id; }).indexOf(DEPopChosen.objective_point_id);
                if (DEPopChosen.selected) {
                    //they picked an OP to use for tapedown
                    $scope.DEPOPMeasure = {};
                    $scope.DEPOPMeasure.op_name = DEPopChosen.name;
                    $scope.DEPOPMeasure.elevation = DEPopChosen.elev_ft;
                    $scope.DEPOPMeasure.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == DEPopChosen.vdatum_id; })[0].datum_abbreviation;
                    $scope.DEPOPMeasure.objective_point_id = DEPopChosen.objective_point_id;
                    //$scope.DEPtapeDownTable.push($scope.DEPOPMeasure);
                    $scope.depTapeCopy.push($scope.DEPOPMeasure);
                    $scope.depStuffCopy[1].vdatum_id = DEPopChosen.vdatum_id;
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
                            var DEPtapeDownToRemove = $scope.depTapeCopy.filter(function (a) { return a.objective_point_id == DEPopChosen.objective_point_id; })[0];
                            var DEPtInd = $scope.depTapeCopy.map(function (o) { return o.objective_point_id; }).indexOf(DEPtapeDownToRemove.objective_point_id);
                            if (DEPtapeDownToRemove.op_measurements_id !== undefined) $scope.DEPremoveOPList.push(DEPtapeDownToRemove.op_measurements_id);
                            $scope.depTapeCopy.splice(DEPtInd, 1);
                            if ($scope.depTapeCopy.length === 0) {
                                $scope.depStuffCopy[1].vdatum_id = 0; $scope.depStuffCopy[1].gs_elevation = ''; $scope.depStuffCopy[1].ws_elevation = ''; $scope.depStuffCopy[1].sensor_elevation = '';
                            }
                        } else {
                            //never mind, make it selected again
                            $scope.DEPOPsForTapeDown[opI].selected = true;
                        }
                    });
                }
            };
            //only check for instrument opMeasures if there are any ops on this site to begin with.
            if ($scope.OPsPresent) {
                OP_MEASURE.getInstStatOPMeasures({ instrumentStatusId: $scope.DeployedSensorStat.instrument_status_id }).$promise.then(function (DEPresponse) {
                    for (var r = 0; r < DEPresponse.length; r++) {
                        var DEPsensMeasures = DEPresponse[r];
                        var whichOP = siteOPs.filter(function (op) { return op.objective_point_id == DEPresponse[r].objective_point_id; })[0];
                        DEPsensMeasures.elevation = whichOP.elev_ft;
                        DEPsensMeasures.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == whichOP.vdatum_id; })[0].datum_abbreviation;
                        DEPsensMeasures.op_name = $scope.DEPOPsForTapeDown.filter(function (op) { return op.objective_point_id == DEPresponse[r].objective_point_id; })[0].name;
                        $scope.DEPtapeDownTable.push(DEPsensMeasures);
                    }
                    //go through OPsForTapeDown and add selected Property.
                    for (var i = 0; i < $scope.DEPOPsForTapeDown.length; i++) {
                        //for each one, if response has this id, add 'selected:true' else add 'selected:false'
                        for (var y = 0; y < DEPresponse.length; y++) {
                            if (DEPresponse[y].objective_point_id == $scope.DEPOPsForTapeDown[i].objective_point_id) {
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
            }
            //retrieve part //////////////////
            $scope.RetrievedSensorStat = angular.copy(thisSensor.instrument_status.filter(function (inst) { return inst.status === "Retrieved"; })[0]);
            //if there isn't one .. then this is a lost status
            if ($scope.RetrievedSensorStat === undefined) {
                $scope.RetrievedSensorStat = angular.copy(thisSensor.instrument_status.filter(function (inst) { return inst.status === "Lost"; })[0]);
                $scope.mostRecentStatus = "Lost";
            } else {
                $scope.mostRecentStatus = "Retrieved";
            }
            if ($scope.RetrievedSensorStat.vdatum_id !== undefined) {
                $scope.RetrievedSensorStat.vdatumName = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == $scope.RetrievedSensorStat.vdatum_id; })[0].datum_abbreviation;
            }
            $scope.RetrievedSensorStat.time_stamp = getDateTimeParts($scope.RetrievedSensorStat.time_stamp); //this keeps it as utc in display
            $scope.Retriever = allMembers.filter(function (m) { return m.member_id === $scope.RetrievedSensorStat.member_id; })[0];
            $scope.RETremoveOPList =[];
            $scope.RETtapeDownTable =[]; //holder of tapedown OP_MEASUREMENTS

            $scope.RETOPchosen = function (RETopChosen) {
                var opI = $scope.RETOPsForTapeDown.map(function (o) { return o.objective_point_id; }).indexOf(RETopChosen.objective_point_id);
                if (RETopChosen.selected) {
                    //they picked an OP to use for tapedown
                    $scope.RETOPMeasure = { };
                    $scope.RETOPMeasure.op_name = RETopChosen.name;
                    $scope.RETOPMeasure.elevation = RETopChosen.elev_ft;
                    $scope.RETOPMeasure.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == RETopChosen.vdatum_id;})[0].datum_abbreviation;
                    $scope.RETOPMeasure.objective_point_id = RETopChosen.objective_point_id;
                    $scope.retTapeCopy.push($scope.RETOPMeasure);
                    $scope.retStuffCopy[1].vdatum_id = RETopChosen.vdatum_id;
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
                            var RETtapeDownToRemove = $scope.retTapeCopy.filter(function (a) { return a.objective_point_id == RETopChosen.objective_point_id; })[0];
                            var RETtInd = $scope.retTapeCopy.map(function (o) { return o.objective_point_id; }).indexOf(RETtapeDownToRemove.objective_point_id);
                            $scope.RETremoveOPList.push(RETtapeDownToRemove.op_measurements_id);
                            $scope.retTapeCopy.splice(RETtInd, 1);
                            if ($scope.retTapeCopy.length === 0) {
                                $scope.retStuffCopy[1].vdatum_id = 0; $scope.retStuffCopy[1].gs_elevation = ''; $scope.retStuffCopy[1].ws_elevation = ''; $scope.retStuffCopy[1].sensor_elevation = '';
                            }
                        } else {
                            //never mind, make it selected again
                            $scope.RETOPsForTapeDown[opI].selected = true;
                        }
                    });
                }
            };
            
            //only care about op Measures if there are ops on this site
            if ($scope.OPsPresent) {
                OP_MEASURE.getInstStatOPMeasures({ instrumentStatusId: $scope.RetrievedSensorStat.instrument_status_id }).$promise.then(function (RETresponse) {
                    for (var r = 0; r < RETresponse.length; r++) {
                        var RETsensMeasures = RETresponse[r];
                        var whichOP = siteOPs.filter(function (op) { return op.objective_point_id == RETresponse[r].objective_point_id; })[0];
                        RETsensMeasures.elevation = whichOP.elev_ft;
                        RETsensMeasures.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == whichOP.vdatum_id; })[0].datum_abbreviation;
                        RETsensMeasures.op_name = $scope.RETOPsForTapeDown.filter(function (op) { return op.objective_point_id == RETresponse[r].objective_point_id; })[0].name;
                        $scope.RETtapeDownTable.push(RETsensMeasures);
                    }
                    //go through OPsForTapeDown and add selected Property.
                    for (var i = 0; i < $scope.RETOPsForTapeDown.length; i++) {
                        //for each one, if response has this id, add 'selected:true' else add 'selected:false'
                        for (var y = 0; y < RETresponse.length; y++) {
                            if (RETresponse[y].objective_point_id == $scope.RETOPsForTapeDown[i].objective_point_id) {
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
                });
            }

            $scope.EventName = allEvents.filter(function (e) { return e.event_id === $scope.sensor.event_id; })[0].event_name;

            //accordion open/close glyphs
            $scope.s = { depOpen: false, retOpen: true, sFileOpen: false, NWISFileOpen: false };

            //#region datetimepicker
            $scope.dateOptions = {
                startingDay: 1,
                showWeeks: false
            };
            $scope.datepickrs = { };
            $scope.open = function ($event, which) {
                $event.preventDefault();
                $event.stopPropagation();
                $scope.datepickrs[which]= true;
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
                var matchingSensDeplist = $scope.sensorTypeList.filter(function (sd) { return sd.sensor_type_id == sensType.sensor_type_id; })[0];
                //this is 1 sensorType with inner list of  .deploymenttypes
                $scope.filteredDeploymentTypes = matchingSensDeplist.deploymenttypes;
            };

            $scope.getDepTypes($scope.sensor); //call it first time through

            //cancel
            $scope.cancel = function () {                
                $timeout(function () {
                    // anything you want can go here and will safely be run on the next digest.                   
                    var sendBack = [thisSensor];
                    $uibModalInstance.close(sendBack);
                });
            };

            //Done during edit PUT to ensure timezone doesn't affect db time value (is it UTC or local time..make sure it stays UTC)
            var dealWithTimeStampb4Send = function (w) {
                //deployed or retrieved??      
                var utcDateTime; var i;
                if (w === 'deployed') {
                    //check and see if they are not using UTC
                    if ($scope.depStuffCopy[1].time_zone != "UTC") {
                        //convert it
                        utcDateTime = new Date($scope.depStuffCopy[1].time_stamp).toUTCString();
                        $scope.depStuffCopy[1].time_stamp = utcDateTime;
                        $scope.depStuffCopy[1].time_zone = 'UTC';
                    } else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        i = $scope.depStuffCopy[1].time_stamp.toString().indexOf('GMT') +3;
                        $scope.depStuffCopy[1].time_stamp = $scope.depStuffCopy[1].time_stamp.toString().substring(0, i);
                    }
                } else {
                    //check and see if they are not using UTC
                    if ($scope.retStuffCopy[1].time_zone != "UTC") {
                        //convert it
                        utcDateTime = new Date($scope.retStuffCopy[1].time_stamp).toUTCString();
                        $scope.retStuffCopy[1].time_stamp = utcDateTime;
                        $scope.retStuffCopy[1].time_zone = 'UTC';
                    } else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        i = $scope.retStuffCopy[1].time_stamp.toString().indexOf('GMT') +3;
                        $scope.retStuffCopy[1].time_stamp = $scope.retStuffCopy[1].time_stamp.toString().substring(0, i);
                    }
                }
            };

            //#region deploy edit
            //edit button clicked. make copy of deployed info 
            $scope.wannaEditDep = function () {
                $scope.view.DEPval = 'edit';
                $scope.depStuffCopy =[angular.copy($scope.sensor), angular.copy($scope.DeployedSensorStat)];
                $scope.depTapeCopy = angular.copy($scope.DEPtapeDownTable);
            };


            //save Deployed sensor info
            $scope.saveDeployed = function (valid) {
                if (valid) {
                    var updatedSensor = {};
                    var updatedSenStat = {};
                    //see if they used Minutes or seconds for interval. need to store in seconds
                    if ($scope.IntervalType.type == "Minutes")
                        $scope.depStuffCopy[0].interval = $scope.depStuffCopy[0].interval * 60;
                        dealWithTimeStampb4Send('deployed'); //UTC or local?                    
                        $http.defaults.headers.common.Authorization = 'Basic ' +$cookies.get('STNCreds');
                        $http.defaults.headers.common.Accept = 'application/json';
                        INSTRUMENT.update({ id: $scope.depStuffCopy[0].instrument_id }, $scope.depStuffCopy[0]).$promise.then(function (response) {
                            updatedSensor = response;
                            updatedSensor.deploymentType = $scope.depStuffCopy[0].deployment_type_id > 0 ? $scope.depTypeList.filter(function (d) { return d.deployment_type_id === $scope.depStuffCopy[0].deployment_type_id; })[0].method : '';
                            updatedSensor.housingType = $scope.depStuffCopy[0].housing_type_id > 0 ? $scope.houseTypeList.filter(function (h) { return h.housing_type_id === $scope.depStuffCopy[0].housing_type_id; })[0].type_name : '';
                            updatedSensor.sensorBrand = $scope.sensorBrandList.filter(function (s) { return s.sensor_brand_id === $scope.depStuffCopy[0].sensor_brand_id; })[0].brand_name;
                            updatedSensor.sensorType = $scope.sensorTypeList.filter(function (t) { return t.sensor_type_id === $scope.depStuffCopy[0].sensor_type_id; })[0].sensor;
                            updatedSensor.instCollection = $scope.collectCondList.filter(function (i) { return i.id === $scope.depStuffCopy[0].inst_collection_id; })[0].condition;
                            INSTRUMENT_STATUS.update({ id: $scope.depStuffCopy[1].instrument_status_id }, $scope.depStuffCopy[1]).$promise.then(function (statResponse) {
                                //deal with tapedowns. remove/add
                                for (var rt = 0; rt < $scope.DEPremoveOPList.length; rt++) {
                                    var DEPidToRemove = $scope.DEPremoveOPList[rt];
                                    OP_MEASURE.delete({ id: DEPidToRemove }).$promise;
                                }
                                $scope.DEPtapeDownTable = $scope.depTapeCopy.length > 0 ? [] : $scope.DEPtapeDownTable;
                                for (var at = 0; at < $scope.depTapeCopy.length; at++) {
                                    var DEPthisTape = $scope.depTapeCopy[at];
                                    if (DEPthisTape.op_measurements_id !== undefined) {
                                        //existing, put in case they changed it
                                        OP_MEASURE.update({ id: DEPthisTape.op_measurements_id }, DEPthisTape).$promise.then(function (tapeResponse) {
                                            tapeResponse.op_name = DEPthisTape.op_name;
                                            tapeResponse.Vdatum = DEPthisTape.Vdatum;
                                            $scope.DEPtapeDownTable.push(tapeResponse);
                                        });
                                    } else {
                                        //new one added, post
                                        DEPthisTape.instrument_status_id = statResponse.instrument_status_id;
                                        OP_MEASURE.save(DEPthisTape).$promise.then(function (tapeResponse) {
                                            tapeResponse.op_name = DEPthisTape.op_name;
                                            tapeResponse.Vdatum = DEPthisTape.Vdatum;
                                            $scope.DEPtapeDownTable.push(tapeResponse);
                                        });
                                    }
                                }
                                updatedSenStat = statResponse;
                                updatedSenStat.status = "Deployed"; //can't change status on a deployed edit..still deployed
                                $scope.sensor = updatedSensor;
                                var allStatusHolder = thisSensor.instrument_status;
                                thisSensor = updatedSensor;
                                $scope.DeployedSensorStat = updatedSenStat;

                                $scope.DeployedSensorStat.time_stamp = getDateTimeParts($scope.DeployedSensorStat.time_stamp);//this keeps it as utc in display
                                thisSensor.instrument_status = allStatusHolder;
                                var ind = thisSensor.instrument_status.map(function (i) { return i.status_type_id; }).indexOf(1);
                                thisSensor.instrument_status[ind] = $scope.DeployedSensorStat;
                                $scope.sensor.instrument_status = thisSensor.instrument_status;
                                $scope.depStuffCopy = []; $scope.depTapeCopy = [];
                                $scope.IntervalType = { type: 'Seconds' };
                                $scope.view.DEPval = 'detail';
                                toastr.success("Sensor Updated");
                            }, function (errorResponse) {
                                toastr.error("error saving sensor status: " + errorResponse.statusText);
                            });
                        }, function (errorResponse) {
                            toastr.error("error saving sensor: " + errorResponse.statusText);
                        });
                }//end if valid
            };//end saveDeployed()

            //never mind, don't want to edit deployed sensor
            $scope.cancelDepEdit = function () {
                $scope.view.DEPval = 'detail';
                $scope.depStuffCopy =[];
                $scope.depTapeCopy =[];
                //MAKE SURE ALL SELECTED OP'S STAY SELECTED
                for (var i = 0; i < $scope.DEPOPsForTapeDown.length; i++) {
                    //for each one, if response has this id, add 'selected:true' else add 'selected:false'
                    for (var y = 0; y < $scope.DEPtapeDownTable.length; y++) {
                        if ($scope.DEPtapeDownTable[y].objective_point_id == $scope.DEPOPsForTapeDown[i].objective_point_id) {
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
            };
            //#endregion deploy edit

            //#region Retrieve edit
            //edit button clicked. make copy of deployed info 
            $scope.wannaEditRet = function () {
                $scope.view.RETval = 'edit';
                $scope.retStuffCopy =[angular.copy($scope.sensor), angular.copy($scope.RetrievedSensorStat)];
                $scope.retTapeCopy = angular.copy($scope.RETtapeDownTable);
            };

            //save Retrieved sensor info
            $scope.saveRetrieved = function (valid) {
                if (valid) {
                    var updatedRetSensor = {}; var updatedRetSenStat = { };
                    dealWithTimeStampb4Send('retrieved'); //UTC or local?
                    // $scope.retStuffCopy[1].time_stamp = new Date($scope.retStuffCopy[1].time_stamp);//datetime is annoying
                    $http.defaults.headers.common.Authorization = 'Basic ' +$cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    INSTRUMENT.update({ id: $scope.retStuffCopy[0].instrument_id }, $scope.retStuffCopy[0]).$promise.then(function (response) {
                        updatedRetSensor = response;
                        updatedRetSensor.deploymentType = $scope.retStuffCopy[0].deployment_type_id > 0 ? $scope.depTypeList.filter(function (d) { return d.deployment_type_id === $scope.retStuffCopy[0].deployment_type_id; })[0].method : '';
                        updatedRetSensor.housingType = $scope.retStuffCopy[0].housing_type_id > 0 ? $scope.houseTypeList.filter(function (h) { return h.housing_type_id === $scope.retStuffCopy[0].housing_type_id; })[0].type_name : '';
                        updatedRetSensor.sensorBrand = $scope.sensorBrandList.filter(function (s) { return s.sensor_brand_id === $scope.retStuffCopy[0].sensor_brand_id; })[0].brand_name;
                        updatedRetSensor.sensorType = $scope.sensorTypeList.filter(function (t) { return t.sensor_type_id === $scope.retStuffCopy[0].sensor_type_id; })[0].sensor;
                        updatedRetSensor.instCollection = $scope.collectCondList.filter(function (i) { return i.id === $scope.retStuffCopy[0].inst_collection_id; })[0].condition;
                        //update copied references for passing back to list
                        $scope.sensor = updatedRetSensor;
                        var statsHolder = thisSensor.instrument_status;
                        thisSensor = updatedRetSensor;
                        thisSensor.instrument_status = statsHolder;
                        INSTRUMENT_STATUS.update({ id: $scope.retStuffCopy[1].instrument_status_id }, $scope.retStuffCopy[1]).$promise.then(function (statResponse) {
                            $scope.mostRecentStatus = statResponse.status_type_id == 2 ? "Retrieved" : "Lost";
                            $scope.RetrievedSensorStat = statResponse;
                            $scope.RetrievedSensorStat.status = statResponse.status_type_id == 2 ? "Retrieved" : "Lost";
                            $scope.RetrievedSensorStat.time_stamp = getDateTimeParts($scope.RetrievedSensorStat.time_stamp);//this keeps it as utc in display
                            thisSensor.instrument_status[0] = $scope.RetrievedSensorStat;

                            //deal with tapedowns. remove/add
                            for (var rt = 0; rt < $scope.RETremoveOPList.length; rt++) {
                                var RETidToRemove = $scope.RETremoveOPList[rt];
                                OP_MEASURE.delete({ id: RETidToRemove }).$promise;
                            }
                            $scope.RETtapeDownTable = $scope.retTapeCopy.length > 0 ? [] : $scope.RETtapeDownTable;
                            for (var at = 0; at < $scope.retTapeCopy.length; at++) {
                                var RETthisTape = $scope.retTapeCopy[at];
                                if (RETthisTape.op_measurements_id !== undefined) {
                                    //existing, put in case they changed it
                                    OP_MEASURE.update({ id: RETthisTape.op_measurements_id }, RETthisTape).$promise.then(function (tapeResponse) {
                                        tapeResponse.op_name = RETthisTape.op_name;
                                        tapeResponse.Vdatum = RETthisTape.Vdatum;
                                        $scope.RETtapeDownTable.push(tapeResponse);
                                    });
                                } else {
                                    //new one added, post
                                    RETthisTape.instrument_status_id = statResponse.instrument_status_id;
                                    OP_MEASURE.save(RETthisTape).$promise.then(function (tapeResponse) {
                                        tapeResponse.op_name = RETthisTape.op_name;
                                        tapeResponse.Vdatum = RETthisTape.Vdatum;
                                        $scope.RETtapeDownTable.push(tapeResponse);
                                    });
                                }
                            }
                            $scope.retStuffCopy = []; $scope.retTapeCopy = [];
                            $scope.view.RETval = 'detail';
                            toastr.success("Sensor updated");
                        }, function (errorResponse) {
                            toastr.error("error saving sensor status: " + errorResponse.statusText);
                        });
                    }, function (errorResponse) {
                        toastr.error("error saving sensor: " + errorResponse.statusText);
                    });
                }//end if valid
        };//end saveRetrieved()            

            //never mind, don't want to edit retrieved sensor
            $scope.cancelRetEdit = function () {
                $scope.view.RETval = 'detail';
                $scope.retStuffCopy =[];
                $scope.retTapeCopy =[];
                //MAKE SURE ALL SELECTED OP'S STAY SELECTED
                for (var i = 0; i < $scope.RETOPsForTapeDown.length; i++) {
                    //for each one, if response has this id, add 'selected:true' else add 'selected:false'
                    for (var y = 0; y < $scope.RETtapeDownTable.length; y++) {
                        if ($scope.RETtapeDownTable[y].objective_point_id == $scope.RETOPsForTapeDown[i].objective_point_id) {
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
                    $http.defaults.headers.common.Authorization = 'Basic ' +$cookies.get('STNCreds');
                    //this will delete the instrument and all it's statuses
                    INSTRUMENT.delete({ id: sensorToRemove.instrument_id }).$promise.then(function () {
                        $scope.sensorFiles =[]; //clear out sensorFiles for this sensor
                        $scope.sensImageFiles =[]; //clear out image files for this sensor
                        //now remove all these files from SiteFiles
                        var l = $scope.allSFiles.length;
                        while (l--) {
                            if ($scope.allSFiles[l].instrument_id == sensorToRemove.instrument_id) $scope.allSFiles.splice(l, 1);
                        }
                        //updates the file list on the sitedashboard
                        Site_Files.setAllSiteFiles($scope.allSFiles);
                        toastr.success("Sensor Removed");
                        var sendBack =["de", 'deleted'];
                        $uibModalInstance.close(sendBack);
                    }, function error(errorResponse) {
                        toastr.error("Error: " +errorResponse.statusText);
                    });
                }, function () {
                //logic for cancel
                });//end modal
            };

            //#region FILE STUFF
            $scope.stamp = FILE_STAMP.getStamp(); $scope.fileItemExists = true;
            //need to reupload fileItem to this existing file OR Change out existing fileItem for new one
            $scope.saveFileUpload = function () {
                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                $http.defaults.headers.common.Accept = 'application/json';
                $scope.sFileIsUploading = true;
                var fileParts = {
                    FileEntity: {
                        file_id: $scope.aFile.file_id,
                        name: $scope.aFile.name,
                        description: $scope.aFile.description,
                        photo_direction: $scope.aFile.photo_direction,
                        latitude_dd: $scope.aFile.latitude_dd,
                        longitude_dd: $scope.aFile.longitude_dd,
                        file_date: $scope.aFile.file_date,
                        hwm_id: $scope.aFile.hwm_id,
                        site_id: $scope.aFile.site_id,
                        filetype_id: $scope.aFile.filetype_id,
                        source_id: $scope.aFile.source_id,
                        path: $scope.aFile.path,
                        data_file_id: $scope.aFile.data_file_id,
                        instrument_id: $scope.aFile.instrument_id,
                        photo_date: $scope.aFile.photo_date,
                        is_nwis: $scope.aFile.is_nwis,
                        objective_point_id: $scope.aFile.objective_point_id
                    },
                    File: $scope.aFile.File1 !== undefined ? $scope.aFile.File1 : $scope.aFile.File
                };
                //need to put the fileParts into correct format for post
                var fd = new FormData();
                fd.append("FileEntity", JSON.stringify(fileParts.FileEntity));
                fd.append("File", fileParts.File);
                //now POST it (fileparts)
                FILE.uploadFile(fd).$promise.then(function (fresponse) {
                    toastr.success("File Uploaded");
                    $scope.src = $scope.serverURL + '/Files/' + $scope.aFile.file_id + '/Item' + FILE_STAMP.getStamp();
                    FILE_STAMP.setStamp();
                    $scope.stamp = FILE_STAMP.getStamp();
                    if ($scope.aFile.File1.type.indexOf("image") > -1) {
                        $scope.isPhoto = true;
                    } else $scope.isPhoto = false;
                    $scope.aFile.name = fresponse.name; $scope.aFile.path = fresponse.path;
                    if ($scope.aFile.File1 !== undefined) {
                        $scope.aFile.File = $scope.aFile.File1;
                        $scope.aFile.File1 = undefined; //put it as file and remove it from 1
                    }
                    fresponse.fileBelongsTo = $scope.aFile.filetype_id == 2 ? "DataFile File" : "Sensor File";                   
                    if (fresponse.filetype_id === 1) {
                        $scope.sensImageFiles.splice($scope.existIMGFileIndex, 1);
                        $scope.sensImageFiles.push(fresponse);
                    }
                    $scope.sensorFiles[$scope.existFileIndex] = fresponse;
                    $scope.allSFiles[$scope.allSFileIndex] = fresponse;
                    Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                    $scope.sFileIsUploading = false;
                    $scope.fileItemExists = true;
                }, function (errorResponse) {
                    $scope.sFileIsUploading = false;
                    toastr.error("Error saving file: " + errorResponse.statusText);
                });
            };
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
                        $scope.setSRC = SERVER_URL + '/Files/' +$scope.imageId + '/Item';
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
                    $scope.existIMGFileIndex = $scope.sensImageFiles.length > 0 ? $scope.sensImageFiles.indexOf(file): -1;
                    $scope.aFile = angular.copy(file);
                    FILE.getFileItem({ id: $scope.aFile.file_id }).$promise.then(function (response) {
                        $scope.fileItemExists = response.Length > 0 ? true : false;
                    });
                    $scope.aFile.fileType = $scope.fileTypeList.filter(function (ft) { return ft.filetype_id == $scope.aFile.filetype_id; })[0].filetype;
                    //determine if existing file is a photo (even if type is not )
                    if ($scope.aFile.name !== undefined) {
                        var fI = $scope.aFile.name.lastIndexOf(".");
                        var fileExt = $scope.aFile.name.substring(fI + 1);
                        if (fileExt.match(/(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
                            $scope.isPhoto = true;
                        } else $scope.isPhoto = false;
                    }
                    $scope.src = $scope.serverURL + '/Files/' + $scope.aFile.file_id + '/Item' + FILE_STAMP.getStamp();
                    $scope.aFile.file_date = new Date($scope.aFile.file_date); //date for validity of form on PUT
                    if ($scope.aFile.photo_date !== undefined) $scope.aFile.photo_date = new Date($scope.aFile.photo_date); //date for validity of form on PUT
                    if (file.source_id !== undefined) {
                        SOURCE.query({ id: file.source_id }).$promise.then(function (s) {
                            $scope.aSource = s;
                            $scope.aSource.FULLname = $scope.aSource.source_name;
                            //add agency name to photo caption
                            if ($scope.aFile.filetype_id == 1)
                                $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
                        });
                    }//end if source
                    if (file.data_file_id !== undefined) {
                        $scope.ApprovalInfo = {};
                        DATA_FILE.query({ id: file.data_file_id }).$promise.then(function (df) {
                            $scope.datafile = df;
                            $scope.processor = allMembers.filter(function (m) { return m.member_id == $scope.datafile.processor_id; })[0];
                            $scope.datafile.collect_date = new Date($scope.datafile.collect_date);
                            $scope.datafile.good_start = getDateTimeParts($scope.datafile.good_start);
                            $scope.datafile.good_end = getDateTimeParts($scope.datafile.good_end);
                            if (df.approval_id !== undefined && df.approval_id !== null && df.approval_id >= 1) {
                                DATA_FILE.getDFApproval({ id: df.data_file_id }, function success(approvalResponse) {
                                    $scope.ApprovalInfo.approvalDate = new Date(approvalResponse.approval_date); //include note that it's displayed in their local time but stored in UTC
                                    $scope.ApprovalInfo.Member = allMembers.filter(function (amem) { return amem.member_id == approvalResponse.member_id; })[0];
                                }, function error(errorResponse) {
                                    toastr.error("Error getting data file approval information");
                                });
                            }
                        });
                    }
                }//end existing file
                else {
                    //creating a file
                    $scope.aFile.file_date = new Date(); $scope.aFile.photo_date = new Date();
                    $scope.aSource = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];
                    $scope.aSource.FULLname = $scope.aSource.fname + " " +$scope.aSource.lname;
                    $scope.processor = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];
                    var dt = getTimeZoneStamp();
                    $scope.datafile.collect_date = dt[0];
                    $scope.datafile.time_zone = dt[1]; //will be converted to utc on post/put 
                    $scope.datafile.good_start = new Date();
                    $scope.datafile.good_end = new Date();
                } //end new file
                $scope.showFileForm = true;

                
                $scope.updateAgencyForCaption = function () {
                    if ($scope.aFile.filetype_id == 1)
                        $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
                };
            };

            //create this new file
            $scope.createFile = function (valid) {
                if ($scope.aFile.filetype_id == 2) {
                    //make sure end date is after start date
                    var s = $scope.datafile.good_start;//need to get dep status date in same format as retrieved to compare
                    var e = $scope.datafile.good_end; //stupid comma in there making it not the same
                    if (new Date(e) < new Date(s)) {
                        valid = false;
                        var fixDate = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>The good end date must be after the good start date.</p></div>' +
                                '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                $scope.ok = function () {
                                    $uibModalInstance.close();
                                };
                            }],
                            size: 'sm'
                        });
                        fixDate.result.then(function () {
                            valid = false;
                        });
                    }
                }
                if (valid) {
                    $scope.fullSenfileIsUploading = true;
                    $http.defaults.headers.common.Authorization = 'Basic ' +$cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                //post source or datafile first to get source_id or data_file_id
                if ($scope.aFile.filetype_id == 2) {
                    //determine timezone
                    if ($scope.datafile.time_zone != "UTC") {
                        //convert it
                        var utcStartDateTime = new Date($scope.datafile.good_start).toUTCString();
                        var utcEndDateTime = new Date($scope.datafile.good_end).toUTCString();
                        $scope.datafile.good_start = utcStartDateTime;
                        $scope.datafile.good_end = utcEndDateTime;
                        $scope.datafile.time_zone = 'UTC';
                    } else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        var si = $scope.datafile.good_start.toString().indexOf('GMT') +3;
                        var ei = $scope.datafile.good_end.toString().indexOf('GMT') +3;
                        $scope.datafile.good_start = $scope.datafile.good_start.toString().substring(0, si);
                        $scope.datafile.good_end = $scope.datafile.good_end.toString().substring(0, ei);
                    }
                    $scope.datafile.instrument_id = thisSensor.instrument_id;
                    $scope.datafile.processor_id = $cookies.get('mID');
                    DATA_FILE.save($scope.datafile).$promise.then(function (dfResonse) {
                        //then POST fileParts (Services populate PATH)
                        var fileParts = {
                            FileEntity: {
                                filetype_id: $scope.aFile.filetype_id,
                                name: $scope.aFile.File.name,
                                file_date: $scope.aFile.file_date,
                                description: $scope.aFile.description,
                                site_id: $scope.thisSensorSite.site_id,
                                data_file_id: dfResonse.data_file_id,
                                photo_direction: $scope.aFile.photo_direction,
                                latitude_dd: $scope.aFile.latitude_dd,
                                longitude_dd: $scope.aFile.longitude_dd,
                                instrument_id: thisSensor.instrument_id
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
                            if (fresponse.filetype_id === 1) $scope.sensImageFiles.push(fresponse);
                            $scope.showFileForm = false; $scope.fullSenfileIsUploading = false;
                        }, function (errorResponse) {
                            $scope.fullSenfileIsUploading = false;
                            toastr.error("Error saving file: " +errorResponse.statusText);
                        });
                    }, function (errorResponse) {
                        $scope.fullSenfileIsUploading = false;
                        toastr.error("Error saving data file: " +errorResponse.statusText);
                    });//end datafile.save()
                } else {
                    //it's not a data file, so do the source
                        var theSource = { source_name: $scope.aSource.FULLname, agency_id: $scope.aSource.agency_id};
                        SOURCE.save(theSource).$promise.then(function (response) {
                            //then POST fileParts (Services populate PATH)
                            var fileParts = {
                                FileEntity: {
                                    filetype_id: $scope.aFile.filetype_id,
                                    name: $scope.aFile.File.name,
                                    file_date: $scope.aFile.file_date,
                                    photo_date: $scope.aFile.photo_date,
                                    description: $scope.aFile.description,
                                    site_id: $scope.thisSensorSite.site_id,
                                    source_id: response.source_id,
                                    photo_direction: $scope.aFile.photo_direction,
                                    latitude_dd: $scope.aFile.latitude_dd,
                                    longitude_dd: $scope.aFile.longitude_dd,
                                    instrument_id: thisSensor.instrument_id
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
                                if (fresponse.filetype_id === 1) $scope.sensImageFiles.push(fresponse);
                                $scope.showFileForm = false; $scope.fullSenfileIsUploading = false;
                            }, function (errorResponse) {
                                $scope.fullSenfileIsUploading = false;
                                toastr.error("Error saving file: " +errorResponse.statusText);
                            });
                        }, function (errorResponse) {
                            $scope.fullSenfileIsUploading = false;
                            toastr.error("Error saving source info: " +errorResponse.statusText);
                        });//end source.save()
                    }//end if source
                }//end valid
            };//end create()

            //update this file
            $scope.saveFile = function (valid) {
                if ($scope.aFile.filetype_id == 2) {
                    //make sure end date is after start date
                    var s = $scope.datafile.good_start;//need to get dep status date in same format as retrieved to compare
                    var e = $scope.datafile.good_end; //stupid comma in there making it not the same
                    if (new Date(e) < new Date(s)) {
                        valid = false;
                        var fixDate = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>The good end date must be after the good start date.</p></div>' +
                                '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                $scope.ok = function () {
                                    $uibModalInstance.close();
                                };
                            }],
                            size: 'sm'
                        });
                        fixDate.result.then(function () {
                            valid = false;
                        });
                    }
                }
                if (valid) {
                    $scope.fullSenfileIsUploading = true;
                    //put source or datafile, put file
                    var whatkind = $scope.aFile.fileBelongsTo;
                    $http.defaults.headers.common.Authorization = 'Basic ' +$cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    if ($scope.datafile.data_file_id !== undefined) {
                        //has DATA_FILE
                        //check timezone and make sure date stays utc
                        if ($scope.datafile.time_zone != "UTC") {
                            //convert it
                            var utcStartDateTime = new Date($scope.datafile.good_start).toUTCString();
                            var utcEndDateTime = new Date($scope.datafile.good_end).toUTCString();
                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        } else {
                            //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                            var si = $scope.datafile.good_start.toString().indexOf('GMT') +3;
                            var ei = $scope.datafile.good_end.toString().indexOf('GMT') +3;
                            $scope.datafile.good_start = $scope.datafile.good_start.toString().substring(0, si);
                            $scope.datafile.good_end = $scope.datafile.good_end.toString().substring(0, ei);
                        }
                        DATA_FILE.update({ id: $scope.datafile.data_file_id }, $scope.datafile).$promise.then(function () {
                            FILE.update({ id: $scope.aFile.file_id }, $scope.aFile).$promise.then(function (fileResponse) {
                                toastr.success("File Updated");
                                fileResponse.fileBelongsTo = "DataFile File";
                                $scope.sensorFiles[$scope.existFileIndex]= fileResponse;
                                $scope.allSFiles[$scope.allSFileIndex]= fileResponse;
                                Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                $scope.showFileForm = false; $scope.fullSenfileIsUploading = false;
                            }, function (errorResponse) {
                                $scope.fullSenfileIsUploading = false;
                                toastr.error("Error saving file: " + errorResponse.statusText);
                            });
                        }, function (errorResponse) {
                            $scope.fullSenfileIsUploading = false; //Loading...
                            toastr.error("Error saving data file: " + errorResponse.statusText);
                    });
                } else {
                    //has SOURCE
                    $scope.aSource.source_name = $scope.aSource.FULLname;
                    SOURCE.update({ id: $scope.aSource.source_id }, $scope.aSource).$promise.then(function () {
                        FILE.update({ id: $scope.aFile.file_id }, $scope.aFile).$promise.then(function (fileResponse) {
                            toastr.success("File Updated");
                            fileResponse.fileBelongsTo = "Sensor File";
                            $scope.sensorFiles[$scope.existFileIndex]= fileResponse;
                            $scope.allSFiles[$scope.allSFileIndex]= fileResponse;
                            Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                            $scope.showFileForm = false; $scope.fullSenfileIsUploading = false;
                        }, function (errorResponse) {
                            $scope.fullSenfileIsUploading = false;
                            toastr.error("Error saving file: " + errorResponse.statusText);
                        });
                    }, function (errorResponse) {
                        $scope.fullSenfileIsUploading = false; //Loading...
                        toastr.error("Error saving source: " + errorResponse.statusText);
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
                    $http.defaults.headers.common.Authorization = 'Basic ' +$cookies.get('STNCreds');
                    FILE.delete({ id: fileToRemove.file_id }).$promise.then(function () {
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
                $scope.aFile = { };
                $scope.aSource = { };
                $scope.datafile = { };
                $scope.showFileForm = false;
            };

            //approve this datafile (if admin or manager)
            $scope.approveDF = function () {
                //this is valid, show modal to confirm they want to approve it
                var thisDF = $scope.datafile;
                var approveModal = $uibModal.open({
                    template: "<div class='modal-header'><h3 class='modal-title'>Approve Data File</h3></div>" +
                        "<div class='modal-body'><p>Are you ready to approve this Data File?</p></div>" +
                        "<div class='modal-footer'><button class='btn btn-primary' ng-click='approveIt()'>Approve</button><button class='btn btn-warning' ng-click='cancel()'>Cancel</button></div>",
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                        $scope.approveIt = function () {
                            //delete the site and all things 
                            $uibModalInstance.close(thisDF);
                        };
                    }],
                    size: 'sm'
                });
                approveModal.result.then(function (df) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    DATA_FILE.approveDF({ id: df.data_file_id }).$promise.then(function (approvalResponse) {
                        df.approval_id = approvalResponse.approval_id;
                        $scope.datafile = df;
                        toastr.success("Data File Approved");
                        $scope.ApprovalInfo.approvalDate = new Date(approvalResponse.approval_date); //include note that it's displayed in their local time but stored in UTC
                        $scope.ApprovalInfo.Member = allMembers.filter(function (amem) { return amem.member_id == approvalResponse.member_id; })[0];
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    });
                }, function () {
                    //logic for cancel
                });//end modal
            };
            
            //approve this hwm (if admin or manager)
            $scope.unApproveDF = function () {
                //this is valid, show modal to confirm they want to approve it
                var thisDF = $scope.datafile;
                var unapproveModal = $uibModal.open({
                    template: "<div class='modal-header'><h3 class='modal-title'>Remove Approval</h3></div>" +
                        "<div class='modal-body'><p>Are you sure you wan to unapprove this Data File?</p></div>" +
                        "<div class='modal-footer'><button class='btn btn-primary' ng-click='unApproveIt()'>Unapprove</button><button class='btn btn-warning' ng-click='cancel()'>Cancel</button></div>",
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                        $scope.unApproveIt = function () {
                            //delete the site and all things 
                            $uibModalInstance.close(thisDF);
                        };
                    }],
                    size: 'sm'
                });
                unapproveModal.result.then(function (df) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    DATA_FILE.unApproveDF({ id: df.data_file_id }).$promise.then(function () {
                        df.approval_id = null;
                        $scope.datafile = df;
                        toastr.success("Data File Unapproved");
                        $scope.ApprovalInfo = {};
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    });
                }, function () {
                    //logic for cancel
                });//end modal
            };
            //#endregion FILE STUFF

            //#region NWIS DATA_FILE
            if ($scope.sensorDataNWIS) {
                //FILE.VALIDATED being used to store 1 if this is an nwis file metadata link
                $scope.sensorNWISFiles = [];
                for (var ai = $scope.sensorFiles.length - 1; ai >= 0; ai--) {
                    if ($scope.sensorFiles[ai].is_nwis == 1) {
                        $scope.sensorNWISFiles.push($scope.sensorFiles[ai]);
                        $scope.sensorFiles.splice(ai, 1);
                    }
                }
                var dt = getTimeZoneStamp();
                $scope.NWISFile = {};
                $scope.NWISDF = {};
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
                    $scope.NWISFile.file_date = new Date($scope.NWISFile.file_date); //date for validity of form on PUT
                    $scope.NWISFile.FileType = "Data";
                    DATA_FILE.query({ id: f.data_file_id }).$promise.then(function (df) {
                        $scope.NWISDF = df;
                        $scope.nwisProcessor = allMembers.filter(function (m) { return m.member_id == $scope.NWISDF.processor_id; })[0];
                        $scope.NWISDF.collect_date = new Date($scope.NWISDF.collect_date);
                        $scope.NWISDF.good_start = getDateTimeParts($scope.NWISDF.good_start);
                        $scope.NWISDF.good_end = getDateTimeParts($scope.NWISDF.good_end);
                    });
                    //end existing file
                } else {
                    //creating a nwis file
                    $scope.NWISFile = {
                        file_date: new Date(),
                        filetype_id: 2,
                        name: 'http://waterdata.usgs.gov/nwis/uv?site_no=' + $scope.thisSensorSite.usgs_sid,  // if [fill in if not here.. TODO...&begin_date=20160413&end_date=20160419 (event start/end)
                        path: '<link>',
                        FileType: 'Data',
                        site_id: $scope.sensor.site_id,
                        data_file_id: 0,
                        instrument_id: $scope.sensor.instrument_id,
                        is_nwis: 1
                    };
                    $scope.NWISDF = {
                        processor_id: $cookies.get("mID"),
                        instrument_id: $scope.sensor.instrument_id,
                        collect_date: dt[0],
                        time_zone: dt[1],
                        good_start: new Date(),
                        good_end: new Date()
                    };
                    $scope.nwisProcessor = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];
                } //end new file
                $scope.showNWISFileForm = true;
            };
            var postApprovalForNWISfile = function (DFid) {
                DATA_FILE.approveNWISDF({ id: DFid }).$promise.then(function (approvalResponse) {
                    $scope.NWISFile.approval_id = approvalResponse.approval_id;
                });
            };
            $scope.createNWISFile = function (valid) {
                //make sure end date is after start date
                var s = $scope.NWISDF.good_start;//need to get dep status date in same format as retrieved to compare
                var e = $scope.NWISDF.good_end; //stupid comma in there making it not the same
                if (new Date(e) < new Date(s)) {
                    valid = false;
                    var fixDate = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>The good end date must be after the good start date.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                    fixDate.result.then(function () {
                        valid = false;
                    });
                }                
                if (valid) {
                    $http.defaults.headers.common.Authorization = 'Basic ' +$cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //post datafile first to get or data_file_id
                    //determine timezone
                    if ($scope.NWISDF.time_zone != "UTC") {
                        //convert it
                        var utcStartDateTime = new Date($scope.NWISDF.good_start).toUTCString();
                        var utcEndDateTime = new Date($scope.NWISDF.good_end).toUTCString();
                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        var si = $scope.NWISDF.good_start.toString().indexOf('GMT') + 3;
                        var ei = $scope.NWISDF.good_end.toString().indexOf('GMT') + 3;
                        $scope.NWISDF.good_start = $scope.NWISDF.good_start.toString().substring(0, si);
                        $scope.NWISDF.good_end = $scope.NWISDF.good_end.toString().substring(0, ei);
                    }
                    DATA_FILE.save($scope.NWISDF).$promise.then(function (NdfResonse) {
                        //then POST fileParts (Services populate PATH)
                        $scope.NWISFile.data_file_id = NdfResonse.data_file_id;
                        postApprovalForNWISfile(NdfResonse.data_file_id); //process approval
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
                //make sure end date is after start date
                var s = $scope.NWISDF.good_start;//need to get dep status date in same format as retrieved to compare
                var e = $scope.NWISDF.good_end; //stupid comma in there making it not the same
                if (new Date(e) < new Date(s)) {
                    valid = false;
                    var fixDate = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>The good end date must be after the good start date.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                    fixDate.result.then(function () {
                        valid = false;
                    });
                }
                if (valid) {
                    //put source or datafile, put file
                    $http.defaults.headers.common.Authorization = 'Basic ' +$cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //check timezone and make sure date stays utc
                    if ($scope.NWISDF.time_zone != "UTC") {
                        //convert it
                        var utcStartDateTime = new Date($scope.NWISDF.good_start).toUTCString();
                        var utcEndDateTime = new Date($scope.NWISDF.good_end).toUTCString();
                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        var si = $scope.NWISDF.good_start.toString().indexOf('GMT') +3;
                        var ei = $scope.NWISDF.good_end.toString().indexOf('GMT') +3;
                        $scope.NWISDF.good_start = $scope.NWISDF.good_start.toString().substring(0, si);
                        $scope.NWISDF.good_end = $scope.NWISDF.good_end.toString().substring(0, ei);
                    }
                    DATA_FILE.update({ id: $scope.NWISDF.data_file_id }, $scope.NWISDF).$promise.then(function () {
                        FILE.update({ id: $scope.NWISFile.file_id }, $scope.NWISFile).$promise.then(function (fileResponse) {
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
                    $http.defaults.headers.common.Authorization = 'Basic ' +$cookies.get('STNCreds');
                    FILE.delete({ id: fileToRemove.file_id }).$promise.then(function () {
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
            $rootScope.stateIsLoading.showLoading = false;
        }]);//end fullSensorModalCtrl
})();