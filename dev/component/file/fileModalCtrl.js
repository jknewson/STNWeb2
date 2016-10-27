(function () {
    'use strict';

    var ModalControllers = angular.module('ModalControllers');//
    ModalControllers.controller('siteFileModalCtrl', ['$scope', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'SERVER_URL', 'FILE_STAMP', 'fileTypeList', 'thisFile', 'fileExists', 'allMembers', 'fileSource', 'dataFile', 'agencyList', 'fileSite', 'FILE', 'SOURCE', 'DATA_FILE',
        function ($scope, $cookies, $http, $uibModalInstance, $uibModal, SERVER_URL, FILE_STAMP, fileTypeList, thisFile, fileExists, allMembers, fileSource, dataFile, agencyList, fileSite, FILE, SOURCE, DATA_FILE) {
            //dropdowns
            $scope.serverURL = SERVER_URL;
            $scope.userRole = $cookies.get('usersRole');
            $scope.view = { FILEval: 'detail' };
            $scope.sFileIsUploading = false; //Loading...    
            $scope.fileTypes = fileTypeList;
            $scope.agencies = agencyList;
            $scope.theSite = fileSite;
            
            $scope.aFile = {}; //holder for file
            $scope.aSource = {}; //holder for file source
            $scope.datafile = {}; //holder for file datafile
            // is interval is number
            $scope.isNum = function (evt) {
                var theEvent = evt || window.event;
                var key = theEvent.keyCode || theEvent.which;
                if (key != 46 && key != 45 && key > 31 && (key < 48 || key > 57)) {
                    theEvent.returnValue = false;
                    if (theEvent.preventDefault) theEvent.preventDefault();
                }
            };
            $scope.fileItemExists = fileExists === undefined || fileExists.Length > 0 ? true:false;

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

            $scope.updateAgencyForCaption = function () {
                if ($scope.createOReditFile == 'create') {
                    if ($scope.aFile.filetype_id == 1)
                        $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
                } else {
                    if ($scope.fileCopy.filetype_id == 1)
                        $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.sourceCopy.agency_id; })[0].agency_name;
                }
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
            if (thisFile !== undefined) {
                //edit file
                $scope.createOReditFile = 'edit';
                $scope.whoseFile = thisFile.fileBelongsTo;
                if ($scope.whoseFile == 'Objective Point File') $scope.whoseFile = 'Datum Location File';
                $scope.aFile = thisFile;
                $scope.aFile.fileType = fileTypeList.filter(function (ft) { return ft.filetype_id == $scope.aFile.filetype_id; })[0].filetype;
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
                if (fileSource !== undefined)  {
                    $scope.aSource = fileSource;
                    $scope.aSource.FULLname = $scope.aSource.source_name;
                    $scope.aSource.agencyName = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
                    //add agency name to photo caption
                    $scope.agencyNameForCap = $scope.aSource.agencyName;
                }
                if (dataFile !== undefined) {
                    $scope.ApprovalInfo = {};
                    $scope.datafile = dataFile;
                    $scope.timeZoneList = ['UTC', 'PST', 'MST', 'CST', 'EST'];                
                    $scope.datafile.collect_date = new Date($scope.datafile.collect_date); //date for validity of form on put
                    $scope.datafile.good_start = getDateTimeParts($scope.datafile.good_start); //date for validity of form on put
                    $scope.datafile.good_end = getDateTimeParts($scope.datafile.good_end); //date for validity of form on put
                    
                    if ($scope.datafile.approval_id !== undefined && $scope.datafile.approval_id !== null && $scope.datafile.approval_id >= 1) {
                        DATA_FILE.getDFApproval({ id: $scope.datafile.data_file_id }, function success(approvalResponse) {
                            $scope.ApprovalInfo.approvalDate = new Date(approvalResponse.approval_date); //include note that it's displayed in their local time but stored in UTC
                            $scope.ApprovalInfo.Member = allMembers.filter(function (amem) { return amem.member_id == approvalResponse.member_id; })[0];
                        }, function error(errorResponse) {
                            toastr.error("Error getting data file approval information");
                        });
                    }
                    var aProcessor = $scope.datafile.processor_id !== null ? allMembers.filter(function (amem) { return amem.member_id == $scope.datafile.processor_id; })[0] : {};
                    $scope.processor = aProcessor.fname !== undefined ? aProcessor.fname + ' ' + aProcessor.lname : '';
                }
            } else {
                //create file
                $scope.whoseFile = "Site File";
                $scope.createOReditFile = 'create';
                $scope.aFile.file_date = new Date();
                $scope.aFile.photo_date = new Date();
                $scope.aSource = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];
                $scope.aSource.FULLname = $scope.aSource.fname + " " + $scope.aSource.lname;
                $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
            }

            $scope.cancel = function () {
                $scope.sFileIsUploading = false;
                var sendBack = $scope.aFile;
                $uibModalInstance.close(sendBack);
            };

            //create this new file
            $scope.create = function (valid) {
                if (valid) {//only be photo file or other .. no DATA here
                    $scope.sFileIsUploading = true;
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //post source first to get source_id
                    var theSource = { source_name: $scope.aSource.FULLname, agency_id: $scope.aSource.agency_id };
                    //now POST SOURCE, 
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
                                    site_id: $scope.theSite.site_id,
                                    source_id: response.source_id,
                                    photo_direction: $scope.aFile.photo_direction
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
                                fresponse.fileBelongsTo = "Site File";
                                var state = 'created';
                                //send the file back to be added to the scope list
                                var sendBack = [fresponse, state];
                                $scope.sFileIsUploading = false;
                                $uibModalInstance.close(sendBack);
                            }, function (errorResponse) {
                                $scope.sFileIsUploading = false;
                                toastr.error("Error saving file: " + errorResponse.statusText);
                            });
                        } else {
                            //this is a link
                            $scope.aFile.site_id = $scope.theSite.site_id; $scope.aFile.source_id = response.source_id;
                            FILE.save($scope.aFile).$promise.then(function (fresponse) {
                                toastr.success("File Uploaded");
                                fresponse.fileBelongsTo = "Site File";
                                var state = 'created';
                                //send the file back to be added to the scope list
                                var sendBack = [fresponse, state];
                                $scope.sFileIsUploading = false;
                                $uibModalInstance.close(sendBack);
                            }, function (errorResponse) {
                                $scope.sFileIsUploading = false;
                                toastr.error("Error saving file: " + errorResponse.statusText);
                            });
                        }//end save link file
                    }, function (errorResponse) {
                        $scope.sFileIsUploading = false;
                        toastr.error("Error saving Source info: " + errorResponse.statusText);
                    });//end source.save()
                }//end valid
            };//end create()
            $scope.changedFileType = function () {
                //from photo to data
                //from data to photo
                //from data to other
                //from photo to other
                //from other to other
            };
            //update this file
            $scope.save = function (valid) {                
                if ($scope.fileCopy.filetype_id == 2) {
                    //make sure end date is after start date
                    var s = $scope.dfCopy.good_start;//need to get dep status date in same format as retrieved to compare
                    var e = $scope.dfCopy.good_end; //stupid comma in there making it not the same
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
                    }//end if Date<Date
                }//end file.Copy.filetype_id == 2
                if (valid) {
                    $scope.sFileIsUploading = true;
                    //only photo or other file type (no data file here)
                    //put source or datafile, put file
                    var whatkind = $scope.aFile.fileBelongsTo;
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    if ($scope.sourceCopy.source_id !== undefined) {
                        $scope.sourceCopy.source_name = $scope.sourceCopy.FULLname;
                        SOURCE.update({ id: $scope.sourceCopy.source_id }, $scope.sourceCopy).$promise.then(function (sResponse) {
                            $scope.aSource = sResponse;
                            $scope.aSource.FULLname = $scope.aSource.source_name;
                            $scope.aSource.agencyName = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
                            //editing just the file
                            FILE.update({ id: $scope.fileCopy.file_id }, $scope.fileCopy).$promise.then(function (fileResponse) {
                                toastr.success("File Updated");
                                fileResponse.fileBelongsTo = whatkind;
                                $scope.aFile = fileResponse;
                                $scope.aFile.fileType = fileTypeList.filter(function (ft) { return ft.filetype_id == $scope.aFile.filetype_id; })[0].filetype;
                                $scope.aFile.file_date = new Date($scope.aFile.file_date); //date for validity of form on PUT
                                if ($scope.aFile.photo_date !== undefined) $scope.aFile.photo_date = new Date($scope.aFile.photo_date); //date for validity of form on PUT
                                $scope.fileCopy = {}; $scope.sourceCopy = {};
                                $scope.view.FILEval = 'detail';
                                $scope.sFileIsUploading = false;
                            }, function (errorResponse) {
                                $scope.sFileIsUploading = false;
                                toastr.error("Error saving file: " + errorResponse.statusText);
                            });
                        }, function (errorResponse) {
                            $scope.sFileIsUploading = false; //Loading...
                            toastr.error("Error saving source: " + errorResponse.statusText);
                        });
                    } else {
                        //data file
                        //check timezone and make sure date stays utc
                        if ($scope.dfCopy.time_zone != "UTC") {
                            //convert it
                            var utcStartDateTime = new Date($scope.dfCopy.good_start).toUTCString();
                            var utcEndDateTime = new Date($scope.dfCopy.good_end).toUTCString();
                            $scope.dfCopy.good_start = utcStartDateTime;
                            $scope.dfCopy.good_end = utcEndDateTime;
                            $scope.dfCopy.time_zone = 'UTC';
                        } else {
                            //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                            var si = $scope.dfCopy.good_start.toString().indexOf('GMT') + 3;
                            var ei = $scope.dfCopy.good_end.toString().indexOf('GMT') + 3;
                            $scope.dfCopy.good_start = $scope.dfCopy.good_start.toString().substring(0, si);
                            $scope.dfCopy.good_end = $scope.dfCopy.good_end.toString().substring(0, ei);
                        }
                        DATA_FILE.update({ id: $scope.dfCopy.data_file_id }, $scope.dfCopy).$promise.then(function (dfResponse) {
                            $scope.datafile = dfResponse;
                            $scope.datafile.collect_date = new Date($scope.datafile.collect_date); //date for validity of form on put
                            $scope.datafile.good_start = getDateTimeParts($scope.datafile.good_start); //date for validity of form on put
                            $scope.datafile.good_end = getDateTimeParts($scope.datafile.good_end); //date for validity of form on put
                            var aProcessor = $scope.datafile.processor_id !== null ? allMembers.filter(function (amem) { return amem.member_id == $scope.datafile.processor_id; })[0] : {};
                            $scope.processor = aProcessor.fname !== undefined ? aProcessor.fname + ' ' + aProcessor.lname : '';
                            FILE.update({ id: $scope.fileCopy.file_id }, $scope.fileCopy).$promise.then(function (fileResponse) {
                                toastr.success("File Updated");
                                fileResponse.fileBelongsTo = whatkind;
                                $scope.aFile = fileResponse;
                                $scope.aFile.fileType = fileTypeList.filter(function (ft) { return ft.filetype_id == $scope.aFile.filetype_id; })[0].filetype;
                                $scope.aFile.file_date = new Date($scope.aFile.file_date); //date for validity of form on PUT
                                if ($scope.aFile.photo_date !== undefined) $scope.aFile.photo_date = new Date($scope.aFile.photo_date); //date for validity of form on PUT
                                $scope.fileCopy = {}; $scope.dfCopy = {};
                                $scope.view.FILEval = 'detail';
                                $scope.sFileIsUploading = false;
                            }, function (errorResponse) {
                                $scope.sFileIsUploading = false;
                                toastr.error("Error saving file: " + errorResponse.statusText);
                            });
                        }, function (errorResponse) {
                            $scope.sFileIsUploading = false; //Loading...
                            toastr.error("Error saving data file: " + errorResponse.statusText);
                        });
                    } //end else (datafile)
                }//end valid                
            };//end save()

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
                    $scope.aFile.name = fresponse.name;
                    $scope.aFile.path = fresponse.path;
                    //if this is a photo file, flag so thumbnail shows and make sure
                    if ($scope.aFile.File1 !== undefined) {
                        if ($scope.aFile.File1.type.indexOf("image") > -1) {
                            $scope.isPhoto = true;
                        }
                        else { $scope.isPhoto = false; }
                    } else {
                        if ($scope.aFile.File.type.indexOf("image") > -1) {
                            $scope.isPhoto = true;
                        }
                        else { $scope.isPhoto = false; }
                    }
                    
                    if ($scope.aFile.File1 !== undefined) {
                        $scope.aFile.File = $scope.aFile.File1;
                        $scope.aFile.File1 = undefined; //put it as file and remove it from 1
                    }
                    //update the siteImageFiles for carousel if photo was changed to a different type or vise versa
                    
                    $scope.sFileIsUploading = false;
                    $scope.fileItemExists = true;
                }, function (errorResponse) {
                    $scope.sFileIsUploading = false;
                    toastr.error("Error saving file: " + errorResponse.statusText);
                });
            };

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
                        var sendBack = ["de", 'deleted'];
                        $uibModalInstance.close(sendBack);
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    });
                });//end DeleteModal.result.then
            };//end delete()

            //edit button clicked. make copy of hwm 
            $scope.wannaEditFILE = function () {                
                $scope.view.FILEval = 'edit';
                $scope.fileCopy = angular.copy($scope.aFile);
                $scope.dfCopy = angular.copy($scope.datafile);
                $scope.sourceCopy = angular.copy($scope.aSource);
            };
            $scope.cancelFILEEdit = function () {
                $scope.view.FILEval = 'detail';
                $scope.fileCopy = {};
                $scope.dfCopy = {};
                $scope.sourceCopy = {};
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
        }]);//end fileModalCtrl

})();