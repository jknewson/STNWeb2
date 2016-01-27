(function () {
    'use strict';

    var ModalControllers = angular.module('ModalControllers');//
    ModalControllers.controller('siteFileModalCtrl', ['$scope', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'fileTypeList', 'thisFile', 'allMembers', 'fileSource', 'agencyList', 'fileSite', 'FILE', 'SOURCE',
        function ($scope, $cookies, $http, $uibModalInstance, $uibModal, fileTypeList, thisFile, allMembers, fileSource, agencyList, fileSite, FILE, SOURCE) {
            //dropdowns
            $scope.fileTypes = fileTypeList;
            $scope.agencies = agencyList;
            $scope.theSite = fileSite;
            $scope.aFile = {}; //holder for file
            $scope.aSource = {}; //create = loggedin user, edit = member.MEMBER_ID
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

            if (thisFile !== undefined) {
                //edit file
                $scope.aFile = thisFile;
                $scope.aFile.FILE_DATE = new Date($scope.aFile.FILE_DATE); //date for validity of form on PUT
                if (fileSource !== undefined)  {
                    $scope.aSource = fileSource;
                    $scope.aSource.FULLNAME = $scope.aSource.SOURCE_NAME;
                    $scope.aSource.SOURCE_DATE = new Date($scope.aSource.SOURCE_DATE); //date for validity of form on put
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
                    //put source, put file
                    $scope.aSource.SOURCE_NAME = $scope.aSource.FULLNAME;
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    SOURCE.update({ id: $scope.aSource.SOURCE_ID }, $scope.aSource).$promise.then(function () {
                        FILE.update({ id: $scope.aFile.FILE_ID }, $scope.aFile).$promise.then(function (fileResponse) {
                            toastr.success("File Updated");
                            var state = 'updated';
                            //send the file back to be added to the scope list
                            var sendBack = [fileResponse, state];
                            $uibModalInstance.close(sendBack);
                        })
                    })
                }
            }

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
            }//end delete()

        }]);//end fileModalCtrl

})();