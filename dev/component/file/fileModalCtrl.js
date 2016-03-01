(function () {
    'use strict';

    var ModalControllers = angular.module('ModalControllers');//
    ModalControllers.controller('siteFileModalCtrl', ['$scope', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'fileTypeList', 'thisFile', 'allMembers', 'fileSource', 'dataFile', 'agencyList', 'fileSite', 'FILE', 'SOURCE', 'DATA_FILE',
        function ($scope, $cookies, $http, $uibModalInstance, $uibModal, fileTypeList, thisFile, allMembers, fileSource, dataFile, agencyList, fileSite, FILE, SOURCE, DATA_FILE) {
            //dropdowns
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
            }
            if (thisFile !== undefined) {
                //edit file
                $scope.aFile = thisFile;
                $scope.aFile.FILE_DATE = new Date($scope.aFile.FILE_DATE); //date for validity of form on PUT
                if (fileSource !== undefined)  {
                    $scope.aSource = fileSource;
                    $scope.aSource.FULLNAME = $scope.aSource.SOURCE_NAME;
                    $scope.aSource.SOURCE_DATE = new Date($scope.aSource.SOURCE_DATE); //date for validity of form on put
                }
                if (dataFile !== undefined) {
                    $scope.datafile = dataFile;
                    $scope.datafile.COLLECT_DATE = new Date($scope.datafile.COLLECT_DATE); //date for validity of form on put
                    $scope.datafile.GOOD_START = getDateTimeParts($scope.datafile.GOOD_START); //date for validity of form on put
                    $scope.datafile.GOOD_END = getDateTimeParts($scope.datafile.GOOD_END); //date for validity of form on put
                    $scope.timeZoneList = ['UTC', 'PST', 'MST', 'CST', 'EST'];
                    var aProcessor = $scope.datafile.PROCESSOR_ID !== null ? allMembers.filter(function (amem) { return amem.MEMBER_ID == $scope.datafile.PROCESSOR_ID; })[0] : {};
                    $scope.processor = aProcessor.FNAME !== undefined ? aProcessor.FNAME + ' ' + aProcessor.LNAME : '';
                }
            } else {
                //create file
                $scope.aFile.FILE_DATE = new Date();
                $scope.aSource = allMembers.filter(function (m) { return m.MEMBER_ID == $cookies.get('mID'); })[0];
                $scope.aSource.FULLNAME = $scope.aSource.FNAME + " " + $scope.aSource.LNAME;
                $scope.aSource.SOURCE_DATE = new Date();
            }

            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };

            //create this new file
            $scope.create = function (valid) {
                if (valid) {//only be photo file or other .. no DATA here
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //post source first to get SOURCE_ID
                    var theSource = { SOURCE_NAME: $scope.aSource.FULLNAME, AGENCY_ID: $scope.aSource.AGENCY_ID, SOURCE_DATE: $scope.aSource.SOURCE_DATE };
                    //now POST SOURCE, 
                    SOURCE.save(theSource).$promise.then(function (response) {
                        //then POST fileParts (Services populate PATH)
                        var fileParts = {
                            FileEntity: {
                                FILETYPE_ID: $scope.aFile.FILETYPE_ID,
                                FILE_URL: $scope.aFile.FILE_URL,
                                FILE_DATE: $scope.aFile.FILE_DATE,
                                DESCRIPTION: $scope.aFile.DESCRIPTION,
                                SITE_ID: $scope.theSite.SITE_ID,
                                SOURCE_ID: response.SOURCE_ID,
                                PHOTO_DIRECTION: $scope.aFile.PHOTO_DIRECTION
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
                            var whatKindaFile = '';
                            if (fresponse.HWM_ID > 0 && fresponse.HWM_ID !== null) {
                                whatKindaFile = "HWM File";
                            }
                            if (fresponse.DATA_FILE_ID > 0 && fresponse.DATA_FILE_ID !== null) {
                                whatKindaFile = "DataFile File";
                            }
                            if (fresponse.INSTRUMENT_ID > 0 && fresponse.INSTRUMENT_ID !== null) {
                                whatKindaFile = "Sensor File";
                            }
                            if (fresponse.OBJECTIVE_POINT_ID > 0 && fresponse.OBJECTIVE_POINT_ID !== null) {
                                whatKindaFile = "Objective Point File";
                            }
                            if (whatKindaFile === '') whatKindaFile = "Site File";
                            fresponse.fileBelongsTo = whatKindaFile;
                            var state = 'created';
                            //send the file back to be added to the scope list
                            var sendBack = [fresponse, state];
                            $uibModalInstance.close(sendBack);
                        });
                    });//end source.save()
                }//end valid
            };//end create()

            //update this file
            $scope.save = function (valid) {
                if (valid) {
                    //only photo or other file type (no data file here)
                    //put source or datafile, put file
                    var whatkind = $scope.aFile.fileBelongsTo;
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    if ($scope.aSource.SOURCE_ID !== undefined) {
                        $scope.aSource.SOURCE_NAME = $scope.aSource.FULLNAME;
                        SOURCE.update({ id: $scope.aSource.SOURCE_ID }, $scope.aSource).$promise.then(function () {
                            FILE.update({ id: $scope.aFile.FILE_ID }, $scope.aFile).$promise.then(function (fileResponse) {
                                toastr.success("File Updated");
                                var state = 'updated';
                                fileResponse.fileBelongsTo = whatkind;
                                //send the file back to be added to the scope list
                                var sendBack = [fileResponse, state];
                                $uibModalInstance.close(sendBack);
                            });
                        });
                    } else {
                        //data file
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
                                var state = 'updated';
                                fileResponse.fileBelongsTo = whatkind;
                                //send the file back to be added to the scope list
                                var sendBack = [fileResponse, state];
                                $uibModalInstance.close(sendBack);
                            });
                        });
                    } //end else (datafile)
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
                        var sendBack = ["de", 'deleted'];
                        $uibModalInstance.close(sendBack);
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    });
                });//end DeleteModal.result.then
            };//end delete()

        }]);//end fileModalCtrl

})();