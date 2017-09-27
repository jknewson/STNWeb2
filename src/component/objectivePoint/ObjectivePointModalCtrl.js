(function () {
    'use strict';

    var ModalControllers = angular.module('ModalControllers');
    ModalControllers.controller('OPmodalCtrl', ['$scope', '$rootScope', '$cookies', '$http', '$sce', '$uibModalInstance', '$uibModal', 'SERVER_URL', 'FILE_STAMP', 'Site_Files', 'allDropdowns', 'thisOP', 'thisOPControls', 'opSite', 'agencyList', 'allMembers', 'OBJECTIVE_POINT', 'OP_CONTROL_IDENTIFIER', 'OP_MEASURE', 'SOURCE', 'FILE',
        function ($scope, $rootScope, $cookies, $http, $sce, $uibModalInstance, $uibModal, SERVER_URL, FILE_STAMP, Site_Files, allDropdowns, thisOP, thisOPControls, opSite, agencyList, allMembers, OBJECTIVE_POINT, OP_CONTROL_IDENTIFIER, OP_MEASURE, SOURCE, FILE) {
            //defaults for radio buttons
            //dropdowns
            $scope.serverURL = SERVER_URL;
            $scope.view = { OPval: 'detail' };
            $scope.fileIsUploading = false; //Loading...    
            $scope.dl = { dlOpen: true, dlFileOpen: false };//accordions
            $scope.OPTypeList = allDropdowns[0];
            $scope.HDList = allDropdowns[1];
            $scope.HCollectMethodList = allDropdowns[2];
            $scope.VDatumList = allDropdowns[3];
            $scope.VCollectMethodList = allDropdowns[4];
            $scope.OPQualityList = allDropdowns[5];
            $scope.fileTypeList = allDropdowns[6]; //used if creating/editing OP file            
            $scope.htmlDescriptionTip = $sce.trustAsHtml('Please describe location and type of mark <em>ie. \'chiseled square on third sidewalk block on the south side of the street\'</em>');
            $scope.HWMfileIsUploading = false; //Loading...    
            $scope.OP = {};
            $scope.removeOPCarray = []; //holder if they remove any OP controls
            $scope.thisOPsite = opSite; //this OP's SITE
            $scope.addedIdentifiers = []; //holder for added Identifiers
            $scope.showControlIDinput = false; //initially hide the area containing added control Identifiers
            $scope.DMS = {}; //object for Deg Min Sec values
            $scope.allSFiles = Site_Files.getAllSiteFiles();
            $scope.OPFiles = thisOP !== "empty" ? $scope.allSFiles.filter(function (sf) { return sf.objective_point_id == thisOP.objective_point_id; }) : [];// opFiles; //holder for op files added
            $scope.opImageFiles = $scope.OPFiles.filter(function (opf) { return opf.filetype_id === 1; }); //image files for carousel
            $scope.showFileForm = false; //hidden form to add file to op
            //make uncertainty cleared and disabled when 'unquantified' is checked
            $scope.UnquantChecked = function () {
                if ($scope.opCopy.unquantified == 1)
                    $scope.opCopy.uncertainty = "";
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
                    fresponse.fileBelongsTo = "Objective Point File";
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
                    $scope.OPFiles.splice($scope.existFileIndex, 1);
                    $scope.OPFiles.push(fresponse);
                    if (fresponse.filetype_id === 1) {
                        $scope.opImageFiles.splice($scope.existFileIndex, 1);
                        $scope.opImageFiles.push(fresponse);

                    }
                    $scope.allSFiles[$scope.allSFileIndex] = fresponse;
                    Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                    $scope.sFileIsUploading = false;
                    $scope.fileItemExists = true;
                }, function (errorResponse) {
                    $scope.sFileIsUploading = false;
                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file: " + errorResponse.headers(["usgswim-messages"]));
                    else toastr.error("Error creating file: " + errorResponse.statusText);
                });
            };

            //show a modal with the larger image as a preview on the photo file for this op
            $scope.showImageModal = function (image) {
                var imageModal = $uibModal.open({
                    template: '<div class="modal-header"><h3 class="modal-title">Image File Preview</h3></div>' +
                        '<div class="modal-body"><img ng-src="{{setSRC}}" /></div>' +
                        '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                    controller:['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
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
                $scope.existFileIndex = -1; $scope.existIMGFileIndex = -1; $scope.allSFileIndex = -1; //indexes for splice/change
                $scope.aFile = {}; //holder for file
                $scope.aSource = {}; //holder for file source
                //OP will not have datafile     $scope.datafile = {}; //holder for file datafile
                if (file !== 0) {
                    //edit op file
                    $scope.existFileIndex = $scope.OPFiles.indexOf(file); $scope.allSFileIndex = $scope.allSFiles.indexOf(file);
                    $scope.existIMGFileIndex = $scope.opImageFiles.length > 0 ? $scope.opImageFiles.indexOf(file) : -1;
                    $scope.aFile = angular.copy(file);
                    $scope.aFile.fileType = $scope.fileTypeList.filter(function (ft) { return ft.filetype_id == $scope.aFile.filetype_id; })[0].filetype;
                    FILE.getFileItem({ id: $scope.aFile.file_id }).$promise.then(function (response) {
                        $scope.fileItemExists = response.Length > 0 ? true : false;
                    });
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
                    if (file.source_id !== null) {
                        SOURCE.query({ id: file.source_id }).$promise.then(function (s) {
                            $scope.aSource = s;
                            $scope.aSource.FULLname = $scope.aSource.source_name;
                            //add agency name to photo caption
                            if ($scope.aFile.filetype_id == 1)
                                $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
                        });
                    }//end if source
                }//end existing file
                else {
                    $scope.aFile.file_date = new Date(); $scope.aFile.photo_date = new Date();
                    $scope.aSource = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];
                    $scope.aSource.FULLname = $scope.aSource.fname + " " + $scope.aSource.lname;
                } //end new file
                $scope.showFileForm = true;
                
                $scope.updateAgencyForCaption = function () {
                    if ($scope.aFile.filetype_id == 1)
                        $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
                };
            };
            //create this new file
            $scope.createFile = function (valid) {
                if (valid) {
                    $scope.fileIsUploading = true;
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //post source first to get source_id
                    if ($scope.aSource.agency_id !== null) {
                        var theSource = { source_name: $scope.aSource.FULLname, agency_id: $scope.aSource.agency_id};
                        //now POST SOURCE, 
                        SOURCE.save(theSource).$promise.then(function (response) {
                            //then POST fileParts (Services populate PATH)
                            var fileParts = {
                                FileEntity: {
                                    filetype_id: $scope.aFile.filetype_id,
                                    name: $scope.aFile.File.name,
                                    file_date: $scope.aFile.file_date,
                                    photo_date: $scope.aFile.photo_date,
                                    description: $scope.aFile.description,
                                    site_id: $scope.thisOPsite.site_id,
                                    source_id: response.source_id,
                                    photo_direction: $scope.aFile.photo_direction,
                                    latitude_dd: $scope.aFile.latitude_dd,
                                    longitude_dd: $scope.aFile.longitude_dd,
                                    objective_point_id: $scope.OP.objective_point_id
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
                                fresponse.fileBelongsTo = "Objective Point File";
                                $scope.OPFiles.push(fresponse);
                                $scope.allSFiles.push(fresponse);
                                Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                FILE_STAMP.setStamp(); //hopefully update the files in the carousel ???
                                if (fresponse.filetype_id === 1) $scope.opImageFiles.push(fresponse);
                                $scope.showFileForm = false; $scope.fileIsUploading = false;
                            }, function (errorResponse) {
                                $scope.fileIsUploading = false;
                                if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file: " + errorResponse.headers(["usgswim-messages"]));
                                else toastr.error("Error creating file: " + errorResponse.statusText);
                            });
                        }, function (errorResponse) {
                            $scope.fileIsUploading = false;
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating source: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error creating source: " + errorResponse.statusText);
                        });//end source.save()
                    }
                }//end valid
            };//end create()

            //update this file
            $scope.saveFile = function (valid) {
                if (valid) {
                    $scope.fileIsUploading = true;
                    //only photo or other file type (no data file here)
                    //put source or datafile, put file
                    var whatkind = $scope.aFile.fileBelongsTo;
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    if ($scope.aSource.source_id !== undefined) {
                        // post again (if no change, will return existing one. if edited, will create a new one --instead of editing all files that use this source)
                        var theSource = { source_name: $scope.aSource.FULLname, agency_id: $scope.aSource.agency_id };
                        SOURCE.save(theSource).$promise.then(function (response) {
                            //SOURCE.update({ id: $scope.aSource.source_id }, $scope.aSource).$promise.then(function () {
                            $scope.aFile.source_id = response.source_id;
                     //   SOURCE.update({ id: $scope.aSource.source_id }, $scope.aSource).$promise.then(function () {
                            FILE.update({ id: $scope.aFile.file_id }, $scope.aFile).$promise.then(function (fileResponse) {
                                toastr.success("File Updated");
                                fileResponse.fileBelongsTo = "Objective Point File";
                                $scope.OPFiles[$scope.existFileIndex] = fileResponse;
                                $scope.allSFiles[$scope.allSFileIndex] = fileResponse;
                                Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                $scope.showFileForm = false; $scope.fileIsUploading = false;
                            }, function (errorResponse) {
                                $scope.fileIsUploading = false;
                                if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file: " + errorResponse.headers(["usgswim-messages"]));
                                else toastr.error("Error creating file: " + errorResponse.statusText);
                            });
                        }, function (errorResponse) {
                            $scope.fileIsUploading = false; //Loading...
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating source: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error creating source: " + errorResponse.statusText);
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
                    FILE.delete({ id: fileToRemove.file_id }).$promise.then(function () {
                        toastr.success("File Removed");
                        $scope.OPFiles.splice($scope.existFileIndex, 1);
                        $scope.allSFiles.splice($scope.allSFileIndex, 1);
                        $scope.opImageFiles.splice($scope.existIMGFileIndex, 1);
                        Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                        $scope.showFileForm = false; 
                    }, function error(errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error deleting file: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error deleting file: " + errorResponse.statusText);
                    });
                });//end DeleteModal.result.then
            };//end delete()

            $scope.cancelFile = function () {
                $scope.aFile = {};
                $scope.aSource = {};
              //  $scope.datafile = {};
                $scope.showFileForm = false;
            };
            //#endregion FILE STUFF

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
            };

            if (thisOP != "empty") {
                $scope.opModalHeader = "Datum Location Information";
                $scope.createOReditOP = 'edit';
                //#region existing OP
                $scope.OP = angular.copy(thisOP); //set a copy so list view doesnt change if they cancel from here after making changes
                //formatted as date for datepicker
                $scope.OP.date_established = makeAdate($scope.OP.date_established);
                //check if vdatum_id == 0, if so make undefined
                if ($scope.OP.vdatum_id === 0) delete $scope.OP.vdatum_id;

                if ($scope.OP.date_recovered !== null)
                    $scope.OP.date_recovered = makeAdate($scope.OP.date_recovered);

                if (thisOPControls.length > 0) {
                    $scope.addedIdentifiers = thisOPControls;
                    $scope.showControlIDinput = true;
                }
                $scope.OP.opType = $scope.OP.op_type_id > 0 ? $scope.OPTypeList.filter(function (t) { return t.objective_point_type_id == $scope.OP.op_type_id; })[0].op_type : '';
                $scope.OP.quality = $scope.OP.op_quality_id > 0 ? $scope.OPQualityList.filter(function (q) { return q.op_quality_id == $scope.OP.op_quality_id; })[0].quality : '';
                $scope.OP.hdatum = $scope.OP.hdatum_id > 0 ? $scope.HDList.filter(function (hd) { return hd.datum_id == $scope.OP.hdatum_id; })[0].datum_name : '';
                $scope.OP.hCollectMethod = $scope.OP.hcollect_method_id > 0 ? $scope.HCollectMethodList.filter(function (hc) { return hc.hcollect_method_id == $scope.OP.hcollect_method_id; })[0].hcollect_method : '';
                $scope.OP.vDatum = $scope.OP.vdatum_id > 0 ? $scope.VDatumList.filter(function (vd) { return vd.datum_id == $scope.OP.vdatum_id; })[0].datum_name : '';
                $scope.OP.vCollectMethod = $scope.OP.vcollect_method_id > 0 ? $scope.VCollectMethodList.filter(function (vc) { return vc.vcollect_method_id == $scope.OP.vcollect_method_id; })[0].vcollect_method : '';

                //#endregion 
            } else {
                $scope.opModalHeader = "Create new Datum Location";
                $scope.createOReditOP = 'create';
                //#region new OP 
                $scope.OP.latitude_dd = opSite.latitude_dd;
                $scope.OP.longitude_dd = opSite.longitude_dd;
                $scope.OP.hdatum_id = opSite.hdatum_id;
                //default today for establised date
                $scope.OP.date_established = makeAdate("");
                //#endregion
            }

            //default radios (has to come after OP is set one way or another)
            $scope.OP.decDegORdms = 'dd';
            $scope.OP.FTorMETER = 'ft';
            $scope.OP.FTorCM = 'ft';

            //want to add identifier
            $scope.addNewIdentifier = function () {
                if ($scope.createOReditOP == 'edit') 
                    $scope.addedIdentifiersCopy.push({ objective_point_id: $scope.OP.objective_point_id, identifier: "", identifier_type: "" });
                else 
                    $scope.addedIdentifiers.push({ identifier: "", identifier_type: "" });

                $scope.showControlIDinput = true;
                

            };

            //#region Datepicker
            $scope.datepickrs = {};
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

            //lat/long =is number
            $scope.isNum = function (evt) {
                var theEvent = evt || window.event;
                var key = theEvent.keyCode || theEvent.which;
                if (key != 46 && key != 45 && key > 31 && (key < 48 || key > 57)) {
                    theEvent.returnValue = false;
                    if (theEvent.preventDefault) theEvent.preventDefault();
                }
            };

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
                if ($scope.createOReditOP == 'edit') {
                    if ($scope.opCopy.decDegORdms == "dd") {
                        //they clicked Dec Deg..
                        if (($scope.DMS.LADeg !== undefined && $scope.DMS.LAMin !== undefined && $scope.DMS.LASec !== undefined) &&
                            $scope.DMS.LODeg !== undefined && $scope.DMS.LOMin !== undefined && $scope.DMS.LOSec !== undefined) {
                            //convert what's here for each lat and long
                            $scope.opCopy.latitude_dd = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                            $scope.opCopy.longitude_dd = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                            //clear
                            $scope.DMS = {};
                        } else {
                            //show modal telling them to populate all three (DMS) for conversion to work
                            var DMSModal = $uibModal.open({
                                template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                    '<div class="modal-body"><p>Please populate all three inputs for conversion from DMS to Decimal Degrees to work.</p></div>' +
                                    '<div class="modal-footer"><button type="button" class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                    $scope.ok = function () {
                                        $uibModalInstance.close();
                                    };
                                }],
                                size: 'sm'
                            });
                            DMSModal.result.then(function () {
                                if ($scope.DMS.LADeg !== undefined || $scope.DMS.LAMin !== undefined || $scope.DMS.LASec !== undefined)
                                    $("#LaDeg").focus();
                                if ($scope.DMS.LODeg !== undefined || $scope.DMS.LOMin !== undefined || $scope.DMS.LOSec !== undefined)
                                    $("#LoDeg").focus();
                                $scope.opCopy.decDegORdms = "dms";
                            });
                        }
                    } else {
                        //they clicked dms (convert lat/long to dms)
                        if ($scope.opCopy.latitude_dd !== undefined) {
                            var latDMS = (deg_to_dms($scope.opCopy.latitude_dd)).toString();
                            var ladDMSarray = latDMS.split(':');
                            $scope.DMS.LADeg = ladDMSarray[0];
                            $scope.DMS.LAMin = ladDMSarray[1];
                            $scope.DMS.LASec = ladDMSarray[2];

                            var longDMS = deg_to_dms($scope.opCopy.longitude_dd);
                            var longDMSarray = longDMS.split(':');
                            $scope.DMS.LODeg = longDMSarray[0] * -1;
                            $scope.DMS.LOMin = longDMSarray[1];
                            $scope.DMS.LOSec = longDMSarray[2];
                            //clear
                            $scope.opCopy.latitude_dd = undefined; $scope.opCopy.longitude_dd = undefined;
                        }
                    }
                } else {
                    if ($scope.OP.decDegORdms == "dd") {
                        //they clicked Dec Deg..
                        if (($scope.DMS.LADeg !== undefined && $scope.DMS.LAMin !== undefined && $scope.DMS.LASec !== undefined) &&
                            $scope.DMS.LODeg !== undefined && $scope.DMS.LOMin !== undefined && $scope.DMS.LOSec !== undefined) {  
                            //convert what's here for each lat and long
                            $scope.OP.latitude_dd = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                            $scope.OP.longitude_dd = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                            //clear
                            $scope.DMS = {};
                        } else {
                        //show modal telling them to populate all three (DMS) for conversion to work
                            var DMSddModal = $uibModal.open({
                                template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                    '<div class="modal-body"><p>Please populate all three inputs for conversion from DMS to Decimal Degrees to work.</p></div>' +
                                    '<div class="modal-footer"><button type="button" class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                    $scope.ok = function () {
                                        $uibModalInstance.close();
                                    };
                                }],
                                size: 'sm'
                            });
                            DMSddModal.result.then(function () {
                                if ($scope.DMS.LADeg !== undefined || $scope.DMS.LAMin !== undefined || $scope.DMS.LASec !== undefined)
                                    $("#LaDeg").focus();
                                if ($scope.DMS.LODeg !== undefined || $scope.DMS.LOMin !== undefined || $scope.DMS.LOSec !== undefined)
                                    $("#LoDeg").focus();
                                $scope.OP.decDegORdms = "dms";
                            });
                        }
                    } else {
                        //they clicked dms (convert lat/long to dms)
                        if ($scope.OP.latitude_dd !== undefined) {
                            var create_latDMS = (deg_to_dms($scope.OP.latitude_dd)).toString();
                            var create_ladDMSarray = create_latDMS.split(':');
                            $scope.DMS.LADeg = create_ladDMSarray[0];
                            $scope.DMS.LAMin = create_ladDMSarray[1];
                            $scope.DMS.LASec = create_ladDMSarray[2];

                            var create_longDMS = deg_to_dms($scope.OP.longitude_dd);
                            var create_longDMSarray = create_longDMS.split(':');
                            $scope.DMS.LODeg = create_longDMSarray[0] * -1;
                            $scope.DMS.LOMin = create_longDMSarray[1];
                            $scope.DMS.LOSec = create_longDMSarray[2];
                            //clear
                            $scope.OP.latitude_dd = undefined; $scope.OP.longitude_dd = undefined;
                        }
                    }
                }
            };

            //just need an OBJECTIVE_POINT object to post/put
            var trimOP = function (op) {
                var OBJ_PT = {
                    name: op.name,
                    description: op.description,
                    elev_ft: op.elev_ft !== undefined ? op.elev_ft : null,
                    date_established: op.date_established,
                    op_is_destroyed: op.op_is_destroyed !== undefined ? op.op_is_destroyed : 0,
                    op_notes: op.op_notes !== undefined ? op.op_notes : null,
                    site_id: $scope.thisOPsite.site_id,
                    vdatum_id: op.vdatum_id !== undefined ? op.vdatum_id : 0,
                    latitude_dd: op.latitude_dd,
                    longitude_dd: op.longitude_dd,
                    hdatum_id: op.hdatum_id !== undefined ? op.hdatum_id : 0,
                    hcollect_method_id: op.hcollect_method_id !== undefined ? op.hcollect_method_id : 0,
                    vcollect_method_id: op.vcollect_method_id !== undefined ? op.vcollect_method_id : 0,
                    op_type_id: op.op_type_id,
                    date_recovered: op.date_recovered !== undefined ? op.date_recovered : null,
                    uncertainty: op.uncertainty !== undefined && op.uncertainty !== "" ? op.uncertainty : null,
                    unquantified: op.unquantified !== undefined ? op.unquantified : null,
                    op_quality_id: op.op_quality_id !== undefined ? op.op_quality_id : null,
                };
                return OBJ_PT;
            };

            //cancel modal
            $scope.cancel = function () {
                $uibModalInstance.close();
             //   $uibModalInstance.dismiss('cancel');
            };

            //fix default radios and lat/long
            var formatDefaults = function (theOP, fromWhere) {
                if (fromWhere == "create") {
                    //$scope.OP.FTorMETER needs to be 'ft'. if 'meter' ==convert value to ft 
                    if (theOP.FTorMETER == "meter") {
                        $scope.OP.FTorMETER = 'ft';
                        $scope.OP.elev_ft = $scope.OP.elev_ft * 3.2808;
                    }
                    //$scope.OP.FTorCM needs to be 'ft'. if 'cm' ==convert value to ft 
                    if (theOP.FTorCM == "cm") {
                        $scope.OP.FTorCM = 'ft';
                        $scope.OP.uncertainty = parseFloat($scope.OP.uncertainty / 30.48).toFixed(6);
                    }
                    //$scope.OP.decDegORdms needs to be 'dd'. if 'dms' ==convert $scope.DMS values to dd
                    if (theOP.decDegORdms == "dms") {
                        $scope.OP.decDegORdms = 'dd';
                        $scope.OP.latitude_dd = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                        $scope.OP.longitude_dd = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                        $scope.DMS = {};
                        $scope.OP.site_id = $scope.thisOPsite.site_id;
                    }
                } else {
                    //$scope.OP.FTorMETER needs to be 'ft'. if 'meter' ==convert value to ft 
                    if (theOP.FTorMETER == "meter") {
                        $scope.opCopy.FTorMETER = 'ft';
                        $scope.opCopy.elev_ft = $scope.opCopy.elev_ft * 3.2808;
                    }
                    //$scope.OP.FTorCM needs to be 'ft'. if 'cm' ==convert value to ft 
                    if (theOP.FTorCM == "cm") {
                        $scope.opCopy.FTorCM = 'ft';
                        $scope.opCopy.uncertainty = parseFloat($scope.opCopy.uncertainty / 30.48).toFixed(6);
                    }
                    //$scope.OP.decDegORdms needs to be 'dd'. if 'dms' ==convert $scope.DMS values to dd
                    if (theOP.decDegORdms == "dms") {
                        $scope.opCopy.decDegORdms = 'dd';
                        $scope.opCopy.latitude_dd = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                        $scope.opCopy.longitude_dd = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                        $scope.DMS = {};
                        $scope.opCopy.site_id = $scope.thisOPsite.site_id;
                    }
                }
            };

            //Create this OP
            $scope.create = function () {
                if (this.OPForm.$valid) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    var createdOP = {};
                    //post
                    formatDefaults($scope.OP, 'create'); //$scope.OP.FTorMETER, FTorCM, decDegORdms    
                    if ($scope.OP.latitude_dd < 0 || $scope.OP.latitude_dd > 73 || isNaN($scope.OP.latitude_dd)) {
                        openLatModal('latlong');
                        //if not a number, clear the imputs to trigger the validation
                        if (isNaN($scope.OP.latitude_dd)) {
                            $scope.OP.latitude_dd = undefined;
                        }
                    } else if ($scope.OP.longitude_dd < -175 || $scope.OP.longitude_dd > -60 || isNaN($scope.OP.longitude_dd)) {
                        openLongModal('latlong');
                        //if not a number, clear the imputs to trigger the validation
                        if (isNaN($scope.OP.longitude_dd)) {
                            $scope.OP.longitude_dd = undefined;
                        }
                    } else {
                        var OPtoPOST = trimOP($scope.OP); //make it an OBJECTIVE_POINT for saving                    

                        OBJECTIVE_POINT.save(OPtoPOST, function success(response) {
                            toastr.success("Datum Location created");
                            createdOP = response;
                            if ($scope.addedIdentifiers.length > 0) {
                                //post each one THIS WILL CHANGE SOON TO HAVE objective_point_id already added and not sent along with it
                                for (var opc = 0; opc < $scope.addedIdentifiers.length; opc++) {
                                    var thisOne = $scope.addedIdentifiers[opc];
                                    thisOne.objective_point_id = response.objective_point_id;
                                    OP_CONTROL_IDENTIFIER.save(thisOne).$promise;
                                }
                            }
                        }, function error(errorResponse) {
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating datum location: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error creating datum location: " + errorResponse.statusText);
                        }).$promise.then(function () {
                            var sendBack = [createdOP, 'created'];
                            $uibModalInstance.close(sendBack);
                        });
                    } //end lat/long is good
                }// end valid
            }; //end Create

            //X was clicked next to existing Control Identifier to have it removed, store in remove array for Save()
            $scope.RemoveID = function (opControl) {
                //only add to remove list if it's an existing one to DELETE
                if ($scope.addedIdentifiersCopy !== undefined) {
                    var i = $scope.addedIdentifiersCopy.indexOf(opControl);
                    if (opControl.op_control_identifier_id !== undefined) {
                        $scope.removeOPCarray.push(opControl);
                        $scope.addedIdentifiersCopy.splice(i, 1);
                    } else {
                        $scope.addedIdentifiersCopy.splice(i, 1);
                    }
                } else {
                    //this is a create
                    var ci = $scope.addedIdentifiers.indexOf(opControl);
                    $scope.addedIdentifiers.splice(ci, 1);
                }
            };

            //Save this OP
            $scope.save = function (valid) {
                if (valid) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    if ($scope.DMS.LADeg !== undefined) $scope.opCopy.latitude_dd = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                    if ($scope.DMS.LODeg !== undefined) $scope.opCopy.longitude_dd = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                    if ($scope.opCopy.latitude_dd < 0 || $scope.opCopy.latitude_dd > 73 || isNaN($scope.opCopy.latitude_dd)) {
                        openLatModal('latlong');
                        //if not a number, clear the imputs to trigger the validation
                        if (isNaN($scope.opCopy.latitude_dd)) {
                            $scope.opCopy.latitude_dd = undefined;
                        }
                    } else if ($scope.opCopy.longitude_dd < -175 || $scope.opCopy.longitude_dd > -60 || isNaN($scope.opCopy.longitude_dd)) {
                        openLongModal('latlong');
                        //if not a number, clear the imputs to trigger the validation
                        if (isNaN($scope.opCopy.longitude_dd)) {
                            $scope.opCopy.longitude_dd = undefined;
                        }
                    } else {
                        var updatedOP = {};
                        //if there's an op_control_identifier_id, PUT .. else POST
                        if ($scope.addedIdentifiersCopy.length > 0) {
                            for (var i = 0; i < $scope.addedIdentifiersCopy.length; i++) {
                                if ($scope.addedIdentifiersCopy[i].op_control_identifier_id !== undefined) {
                                    //existing: PUTvar ind = $scope.chosenHWMList.map(function (hwm) { return hwm.hwm_id; }).indexOf(aHWM.hwm_id); //not working:: $scope.chosenHWMList.indexOf(aHWM);
                                    var existIndex = $scope.addedIdentifiers.map(function (i) { return i.op_control_identifier_id; }).indexOf($scope.addedIdentifiersCopy[i].op_control_identifier_id);
                                    OP_CONTROL_IDENTIFIER.update({ id: $scope.addedIdentifiersCopy[i].op_control_identifier_id }, $scope.addedIdentifiersCopy[i]).$promise.then(function (response) {
                                        $scope.addedIdentifiers[existIndex] = response;
                                    });
                                } else {
                                    //post each one
                                    var thisOPControlID = $scope.addedIdentifiersCopy[i];
                                    thisOPControlID.objective_point_id = $scope.OP.objective_point_id;
                                    OP_CONTROL_IDENTIFIER.save(thisOPControlID).$promise.then(function (response) {
                                        $scope.addedIdentifiers.push(response);
                                    });
                                }
                            }//end foreach addedIdentifier
                        }//end if there's addedidentifiers

                        //if there's any in removeOPCarray, DELETE those
                        if ($scope.removeOPCarray.length > 0) {
                            for (var r = 0; r < $scope.removeOPCarray.length; r++) {
                                var deIndex = $scope.addedIdentifiers.map(function (ri) { return ri.op_control_identifier_id; }).indexOf($scope.removeOPCarray[r].op_control_identifier_id);
                                OP_CONTROL_IDENTIFIER.delete({ id: $scope.removeOPCarray[r].op_control_identifier_id }).$promise.then(function () {
                                    $scope.addedIdentifiers.splice(deIndex, 1);
                                });
                            }//end foreach removeOPCarray
                        }//end if there's removeOPCs

                        //look at OP.FTorMETER ("ft"), OP.FTorCM ("ft"), and OP.decDegORdms ("dd"), make sure site_ID is on there and send it to trim before PUT                
                        formatDefaults($scope.opCopy, 'edit'); //$scope.OP.FTorMETER, FTorCM, decDegORdms
                        var OPtoPOST = trimOP($scope.opCopy);
                        OPtoPOST.objective_point_id = $scope.opCopy.objective_point_id;
                        //$http.defaults.headers.common['X-HTTP-Method-Override'] = 'PUT';
                        OBJECTIVE_POINT.update({ id: OPtoPOST.objective_point_id }, OPtoPOST, function success(response) {
                            toastr.success("Datum Location updated");
                            $scope.OP = response; thisOP = response;
                            $scope.OP.date_established = makeAdate($scope.OP.date_established);
                            if ($scope.OP.date_recovered !== null)
                                $scope.OP.date_recovered = makeAdate($scope.OP.date_recovered);
                            $scope.OP.opType = $scope.OP.op_type_id > 0 ? $scope.OPTypeList.filter(function (t) { return t.objective_point_type_id == $scope.OP.op_type_id; })[0].op_type : '';
                            $scope.OP.quality = $scope.OP.op_quality_id > 0 ? $scope.OPQualityList.filter(function (q) { return q.op_quality_id == $scope.OP.op_quality_id; })[0].quality : '';
                            $scope.OP.hdatum = $scope.OP.hdatum_id > 0 ? $scope.HDList.filter(function (hd) { return hd.datum_id == $scope.OP.hdatum_id; })[0].datum_name : '';
                            $scope.OP.hCollectMethod = $scope.OP.hcollect_method_id > 0 ? $scope.HCollectMethodList.filter(function (hc) { return hc.hcollect_method_id == $scope.OP.hcollect_method_id; })[0].hcollect_method : '';
                            $scope.OP.vDatum = $scope.OP.vdatum_id > 0 ? $scope.VDatumList.filter(function (vd) { return vd.datum_id == $scope.OP.vdatum_id; })[0].datum_name : '';
                            $scope.OP.vCollectMethod = $scope.OP.vcollect_method_id > 0 ? $scope.VCollectMethodList.filter(function (vc) { return vc.vcollect_method_id == $scope.OP.vcollect_method_id; })[0].vcollect_method : '';
                            $scope.opCopy = {};
                            $scope.addedIdentifiersCopy = []; $scope.view.OPval = 'detail';
                            //    delete $http.defaults.headers.common['X-HTTP-Method-Override'];
                        }, function error(errorResponse) {
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving datum location: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error saving datum location: " + errorResponse.statusText);
                        }).$promise;
                    }//end lat/long are good
                }// end valid
            }; //end Save

            //delete this OP from the SITE
            $scope.deleteOP = function () {
                OP_MEASURE.getDatumLocationOPMeasures({ objectivePointId: $scope.OP.objective_point_id }).$promise.then(function (result) {
                    if (result.length > 0) {
                        var opOnTapedownModal = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Cannot Delete</h3></div>' +
                                '<div class="modal-body"><p>This Datum Location is being used for one or more sensor tape downs. Please delete the tape down before deleting the datum location.</p></div>' +
                                '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                $scope.ok = function () {
                                    $uibModalInstance.dismiss();
                                };
                            }],
                            size: 'sm'
                        });
                    } else {
                        //no tapedowns, proceed
                        var DeleteModalInstance = $uibModal.open({
                            templateUrl: 'removemodal.html',
                            controller: 'ConfirmModalCtrl',
                            size: 'sm',
                            resolve: {
                                nameToRemove: function () {
                                    return $scope.OP;
                                },
                                what: function () {
                                    return "Objective Point";
                                }
                            }
                        });
                        DeleteModalInstance.result.then(function (opToRemove) {
                            $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                            OBJECTIVE_POINT.delete({ id: opToRemove.objective_point_id }, opToRemove).$promise.then(function () {
                                $scope.OPFiles = []; //clear out hwmFiles for this hwm
                                $scope.opImageFiles = []; //clear out image files for this hwm
                                //now remove all these files from SiteFiles
                                var l = $scope.allSFiles.length;
                                while (l--) {
                                    if ($scope.allSFiles[l].objective_point_id == opToRemove.objective_point_id) $scope.allSFiles.splice(l, 1);
                                }
                                //updates the file list on the sitedashboard
                                Site_Files.setAllSiteFiles($scope.allSFiles);

                                toastr.success("Datum Location Removed");
                                var sendBack = ["de", 'deleted'];
                                $uibModalInstance.close(sendBack);
                            }, function error(errorResponse) {
                                if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error deleting datum location: " + errorResponse.headers(["usgswim-messages"]));
                                else toastr.error("Error deleting datum location: " + errorResponse.statusText);
                            });
                        });//end modal
                    }//end else (proceed with delete)
                }); //end get opmeasurements
            }; //end delete

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
                    if (w == 'latlong') $("#latitude_dd").focus();
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
                    if (w == 'latlong') $("#longitude_dd").focus();
                    else $("#LoDeg").focus();
                });
            };

            //make sure lat/long are right number range
            $scope.checkValue = function (d) {
                if (d == 'dms') {
                    //check the degree value
                    if ($scope.DMS.LADeg < 0 || $scope.DMS.LADeg > 73 || (isNaN($scope.DMS.LADeg) && $scope.DMS.LADeg !== undefined) || (isNaN($scope.DMS.LAMin) && $scope.DMS.LAMin !== undefined) || (isNaN($scope.DMS.LASec) && $scope.DMS.LASec !== undefined)) {
                        openLatModal('dms');
                        //if not a number, clear the imputs to trigger the validation
                        if (isNaN($scope.DMS.LADeg)) $scope.DMS.LADeg = undefined;
                        if (isNaN($scope.DMS.LAMin)) $scope.DMS.LAMin = undefined;
                        if (isNaN($scope.DMS.LASec)) $scope.DMS.LASec = undefined;
                    }
                    if ($scope.DMS.LODeg < -175 || $scope.DMS.LODeg > -60 || (isNaN($scope.DMS.LODeg) && $scope.DMS.LODeg !== undefined) || (isNaN($scope.DMS.LOMin) && $scope.DMS.LOMin !== undefined) || (isNaN($scope.DMS.LOSec) && $scope.DMS.LOSec !== undefined)) {
                        openLongModal('dms');
                        //if not a number, clear the imputs to trigger the validation
                        if (isNaN($scope.DMS.LODeg)) $scope.DMS.LODeg = undefined;
                        if (isNaN($scope.DMS.LOMin)) $scope.DMS.LOMin = undefined;
                        if (isNaN($scope.DMS.LOSec)) $scope.DMS.LOSec = undefined;
                    }
                } else {
                    //check the latitude/longitude
                    var op = $scope.view.OPval == 'edit' ? $scope.opCopy : $scope.OP;
                    if (op.latitude_dd < 0 || op.latitude_dd > 73 || isNaN(op.latitude_dd)) {
                        openLatModal('latlong');
                        //if not a number, clear the imputs to trigger the validation
                        if (isNaN(op.latitude_dd)) {
                            op.latitude_dd = undefined;
                        }
                    }
                    if (op.longitude_dd < -175 || op.longitude_dd > -60 || isNaN(op.longitude_dd)) {
                        openLongModal('latlong');
                        //if not a number, clear the imputs to trigger the validation
                        if (isNaN(op.longitude_dd)) {
                            op.longitude_dd = undefined;
                        }
                    }
                }
            };

            //edit button clicked. make copy of hwm 
            $scope.wannaEditOP = function () {
                $scope.view.OPval = 'edit';
                $scope.opCopy = angular.copy($scope.OP);
                $scope.opCopy.decDegORdms = 'dd'; $scope.opCopy.FTorMETER = 'ft'; $scope.opCopy.FTorCM = 'ft';
                $scope.addedIdentifiersCopy = angular.copy($scope.addedIdentifiers);
            };
            $scope.cancelOPEdit = function () {
                $scope.view.OPval = 'detail';
                $scope.opCopy = [];               
            };
            $rootScope.stateIsLoading.showLoading = false;// loading..
            
        }]);//end OPmodalCtrl

})();