(function () {
    'use strict';

    var SettingsControllers = angular.module('SettingsControllers');

    SettingsControllers.controller('eventModalCtrl', ['$scope', '$rootScope', '$cookies', '$http', '$uibModal', '$uibModalInstance', '$filter', 'thisEvent', 'eventTypeList', 'eventStatusList', 'adminList', 'fileTypes', 'EVENT', 'FILE', 'SERVER_URL',
        function ($scope, $rootScope, $cookies, $http, $uibModal, $uibModalInstance, $filter, thisEvent, eventTypeList, eventStatusList, adminList, fileTypes, EVENT, FILE, SERVER_URL) {
            $scope.serverURL = SERVER_URL;
            $scope.downloadZipUrl = ""; //tack on end of url for getting zip file
            $scope.objectChoices = ["HWM", "Sensor"];
            $scope.anEvent = {};
            $scope.eventTypes = eventTypeList;
            $scope.eventStatuses = eventStatusList;
            $scope.adminMembers = adminList;
            $scope.loggedInRole = $cookies.get('usersRole');
            $scope.view = { EVval: 'detail' };
            $scope.dl = { dlOpen: true, dlFileOpen: false };//accordions
            //#region Datepicker
            $scope.datepickrs = {};
            $scope.open = function ($event, which) {
                $event.preventDefault();
                $event.stopPropagation();

                $scope.datepickrs[which] = true;
            };
            //$scope.format = 'MMM dd, yyyy';
            //#endregion Datepicker

            //edit button clicked. make copy of hwm 
            $scope.wannaEditEV = function () {
                $scope.view.EVval = 'edit';
                $scope.evCopy = angular.copy($scope.anEvent);
            };
            $scope.cancelEVEdit = function () {
                $scope.view.EVval = 'detail';
                $scope.evCopy = [];
            };
            //called a few times to format just the date (no time)
            var makeAdate = function (d) {
                var aDate = new Date();
                if (d !== undefined) {
                    //provided date
                    aDate = new Date(d);
                }

                var year = aDate.getFullYear();
                var month = aDate.getMonth();
                var day = ('0' + aDate.getDate()).slice(-2);
                var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                var dateWOtime = new Date(monthNames[month] + " " + day + ", " + year);
                return dateWOtime;
            }; //end makeAdate()

            if (thisEvent != "empty") {
                $scope.createOReditEV = 'edit';
                $scope.evModalHeader = "Event Information";
                $scope.anEvent = angular.copy(thisEvent);
                $scope.anEvent.event_start_date = $scope.anEvent.event_start_date !== undefined ? makeAdate($scope.anEvent.event_start_date) : '';
                $scope.anEvent.event_end_date = $scope.anEvent.event_end_date !== undefined ? makeAdate($scope.anEvent.event_end_date) : '';
            }
            else {
                //this is a new event being created
                $scope.createOReditEV = 'create';
                $scope.anEvent.event_start_date = makeAdate();
            }

            //on create and save, if dates entered, compare to ensure end date comes after start date
            var compareDates = function (v, sd, ed) {
                if (new Date(ed) < new Date(sd)) {
                    v = false;
                    var fixDate = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>The event end date must be after the event start date.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                    fixDate.result.then(function () {
                        v = false;
                    });
                } else if (ed === "" || sd === "") {
                    //they entered an invalid date
                    v = false;
                }
                return v;
            };

            $scope.create = function (valid) {
                //make sure end date is after start date                
                if (($scope.anEvent.event_start_date !== undefined && $scope.anEvent.event_start_date !== null) &&
                    ($scope.anEvent.event_end_date !== undefined && $scope.anEvent.event_end_date !== null)) {
                    valid = compareDates(valid, $scope.anEvent.event_start_date, $scope.anEvent.event_end_date);
                }//end if there's a start and end date 
                if (valid) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    var createdEvent = {};
                    EVENT.save($scope.anEvent, function success(response) {
                        toastr.success("Event Created");
                        //push this new event into the eventList
                        createdEvent = response;
                        createdEvent.event_id = response.event_id;
                        createdEvent.Name = response.event_name;
                        createdEvent.Type = $scope.eventTypes.filter(function (a) { return a.event_type_id == response.event_type_id; })[0].type;
                        createdEvent.Status = $scope.eventStatuses.filter(function (r) { return r.event_status_id == response.event_status_id; })[0].status;
                        var coord = $scope.adminMembers.filter(function (c) { return c.member_id == response.event_coordinator; })[0];
                        createdEvent.StartDate = response.event_start_date;
                        createdEvent.EndDate = response.event_end_date;
                        createdEvent.Coord = coord !== undefined ? coord.fname + " " + coord.lname : "";
                    }, function error(errorResponse) {
                        toastr.error("Error creating new event: " + errorResponse.statusText);
                    }).$promise.then(function () {
                        var sendBack = [createdEvent, 'created'];
                        $uibModalInstance.close(sendBack);
                    });

                }
            };//end $scope.save()     

            $scope.save = function (valid) {
                //make sure end date is after start date
                if (($scope.evCopy.event_start_date !== undefined && $scope.evCopy.event_start_date !== null) &&
                    ($scope.evCopy.event_end_date !== undefined && $scope.evCopy.event_end_date !== null)) {
                    valid = compareDates(valid, $scope.evCopy.event_start_date, $scope.evCopy.event_end_date);
                }//end if there's a start and end date 
                if (valid) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    var updatedEvent = {};
                    EVENT.update({ id: $scope.evCopy.event_id }, $scope.evCopy, function success(response) {
                        updatedEvent = response;
                        updatedEvent.event_id = response.event_id;
                        updatedEvent.Name = response.event_name;
                        updatedEvent.Type = $scope.eventTypes.filter(function (a) { return a.event_type_id == response.event_type_id; })[0].type;
                        updatedEvent.Status = $scope.eventStatuses.filter(function (r) { return r.event_status_id == response.event_status_id; })[0].status;
                        var coord = $scope.adminMembers.filter(function (c) { return c.member_id == response.event_coordinator; })[0];
                        updatedEvent.StartDate = response.event_start_date;
                        updatedEvent.EndDate = response.event_end_date;
                        updatedEvent.Coord = coord !== undefined ? coord.fname + " " + coord.lname : "";
                        toastr.success("Event Updated");
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    }).$promise.then(function () {
                        var sendBack = [updatedEvent, 'updated'];
                        $uibModalInstance.close(sendBack);
                    });
                }
            };

            $scope.DeleteEvent = function (ev) {
                //modal
                var modalInstance = $uibModal.open({
                    templateUrl: 'removemodal.html',
                    controller: 'ConfirmModalCtrl',
                    size: 'sm',
                    resolve: {
                        nameToRemove: function () {
                            return ev;
                        },
                        what: function () {
                            return "Event";
                        }
                    }
                });
                modalInstance.result.then(function (eventToRemove) {
                    //DELETE it
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    EVENT.delete({ id: eventToRemove.event_id }, function success(response) {
                        toastr.success("Event Deleted");
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    }).$promise.then(function () {
                        $uibModalInstance.close(["de", 'deleted']);
                    });
                });
            };

            //cancel modal
            $scope.cancel = function () {
                $uibModalInstance.close();
            };
            $rootScope.stateIsLoading = { showLoading: false }; //Loading...

            //#region Zip File Download Section
            //list of file types for hwm
            $scope.HWMfileTypes = fileTypes.filter(function (hft) {
                //Photo (1), Historic (3), Field Sheets (4), Level Notes (5), Other (7), Link (8), Sketch (10)
                return hft.filetype === 'Photo' || hft.filetype === 'Historic Citation' || hft.filetype === 'Field Sheets' || hft.filetype === 'Level Notes' ||
                    hft.filetype === 'Other' || hft.filetype === 'Sketch';
            });
            //list of file types for sensors
            $scope.sensorfileTypes = fileTypes.filter(function (sft) {
                //Photo (1), Data (2), Historic (3), Field Sheets (4), Level Notes (5), Other (7), Link (8), Sketch (10)
                return sft.filetype === 'Photo' || sft.filetype === 'Data' || sft.filetype === 'Historic Citation' || sft.filetype === 'Field Sheets' || sft.filetype === 'Level Notes' ||
                   sft.filetype === 'Other' || sft.filetype === 'Sketch';
            });
            //hwm or sensor was chosen, update file type checkboxlist
            $scope.updatefileTypeChecks = function (d) {
                //depending on which they chose (HWM OR SENSOR), update checkbox scope list
                $scope.hwmFileTypesWanted = []; var sensorFileTypesWanted = []; //reset each time this changes
                $scope.hwmFileTypesString = ""; $scope.sensorFileTypesString = ""; //reset each time this changes
                //uncheck all checkboxes for hwm and sensor file types
                angular.forEach($scope.HWMfileTypes, function (hwmFT) {
                    hwmFT.selected = false;
                });
                angular.forEach($scope.sensorfileTypes, function (senFT) {
                    senFT.selected = false;
                });
                $scope.filesWanted = d;
                $scope.hPlease = ""; $scope.sPlease = "";
                if (d == "HWM") {
                    $scope.fileTypeCheckList = $scope.HWMfileTypes;
                    $scope.hPlease = "1";
                }
                if (d == "Sensor") {
                    $scope.fileTypeCheckList = $scope.sensorfileTypes;
                    $scope.sPlease = "1";
                }
                $scope.filesWantedChosen = true;
            };
            //holder of string array of filetypes wanted

            //oncheck event
            $scope.checkedFile = function (f) {
                //fileType checked/unchecked == add/remove it from string array to pass into url
                if ($scope.filesWanted == "HWM") {
                    $scope.hwmFileTypesWanted = [];
                    angular.forEach($scope.HWMfileTypes, function (hf) {
                        if (hf.selected) $scope.hwmFileTypesWanted.push(hf.filetype_id);
                    });
                    $scope.hwmFileTypesString = $scope.hwmFileTypesWanted.join(",");
                }
                if ($scope.filesWanted == "Sensor") {
                    $scope.sensorFileTypesWanted = [];
                    angular.forEach($scope.sensorfileTypes, function (sf) {
                        if (sf.selected) $scope.sensorFileTypesWanted.push(sf.filetype_id);
                    });
                    $scope.sensorFileTypesString = $scope.sensorFileTypesWanted.join(",");
                }
            };

            //download zip clicked
            $scope.DownloadZip = function () {
                //make sure they checked at least the hwm or sensor checkbox
                //ng-href="{{serverURL}}/Events/{{anEvent.event_id}}/EventFileItems?HWMFiles={{hPlease}}&HWMFileType={{hwmFileTypesString}}&SensorFiles={{sPlease}}&SensorFileTypes={{sensorFileTypesString}}"
                if ($scope.hPlease !== "" || $scope.sPlease !== "") {
                    //  /Events/:eventId/EventFileItems' },//?HWMFiles={hwmFiles}&HWMFileType={hwmFileTypes}&SensorFiles={sensorFiles}&SensorFileTypes={sensorFileTypes}
                    var filepath = $scope.serverURL + '/Events/' + $scope.anEvent.event_id + '/EventFileItems?HWMFiles=' + $scope.hPlease + '&HWMFileType=' + $scope.hwmFileTypesString + '&SensorFiles=' + $scope.sPlease + '&SensorFileTypes=' + $scope.sensorFileTypesString;
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', filepath); //,true);       

                    toastr.options = {
                        "closeButton": true,
                        "positionClass": "toast-bottom-right",
                        "onclick": null,
                        "timeOut": "0",
                        "extendedTimeOut": "0"
                    };
                    toastr.warning("Zip file is downloading.");
                    xhr.responseType = "blob";
                    xhr.setRequestHeader("Content-type", "application/*; charset=utf-8");
                    xhr.setRequestHeader("Authorization", 'Basic ' + $cookies.get('STNCreds'));
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState === 4) {
                            if (xhr.statusText !== "Internal Server Error") {
                                var usgsWiMmessage = xhr.getResponseHeader("usgswim-messages");
                                if (usgsWiMmessage == "info: FileCount:0,Count: 0") {
                                    toastr.clear();
                                    var errorModal = $uibModal.open({
                                        template: '<div class="modal-header"><h3 class="modal-title">No Files</h3></div>' +
                                            '<div class="modal-body"><p>There are no files that match your query.</p>' +
                                            '<p>Please narrow your search and try again.</p></div>' +
                                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                            $scope.ok = function () {
                                                $uibModalInstance.dismiss();
                                            };
                                        }],
                                        size: 'sm'
                                    });
                                } else {
                                    var blob = new Blob([xhr.response], { type: 'application/octet-stream' });
                                    var a = document.createElement('a');
                                    var urlCreator = window.URL || window.webkitURL || window.mozURL || window.msURL;
                                    var fileURL = urlCreator.createObjectURL(blob);
                                    //Blob, client side object created to with holding browser specific download popup, on the URL created with the help of window obj.
                                    a.style = "display: none";
                                    a.href = fileURL;
                                    a.download = 'EventFileDownload.zip';
                                    a.target = '_blank';
                                    document.body.appendChild(a);
                                    a.click();
                                    toastr.clear();
                                }
                            } else {
                                //something went wrong
                                toastr.clear();
                                var errorModal1 = $uibModal.open({
                                    template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                        '<div class="modal-body"><p>Download was unsuccessful. Possible cause is that the zip file is too large to download.</p>' +
                                        '<p>Please narrow your search and try again.</p></div>' +
                                        '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                        $scope.ok = function () {
                                            $uibModalInstance.dismiss();
                                        };
                                    }],
                                    size: 'sm'
                                });
                            }
                        }
                    };
                    xhr.send();
                } else {
                    //show modal saying you must choose at least the hwm or sensor to filter
                    var latModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>You must choose either HWM files or Sensor files before a downloaded zip file can be requested.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.dismiss();
                            };
                        }],
                        size: 'sm'
                    });
                }
            };
            //#endregion Zip File Download Section
        }]);

}());