(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var ModalControllers = angular.module('ModalControllers');
    ModalControllers.controller('peakModalCtrl', ['$scope', '$rootScope', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'allVertDatums', 'thisPeak', 'peakSite', 'allMembers', 'allEventHWMs', 'allSiteSensors', 'allSiteFiles',
        function ($scope, $rootScope, $cookies, $http, $uibModalInstance, $uibModal, allVertDatums, thisPeak, peakSite, allMembers, allEventHWMs, allSiteSensors, allSiteFiles) {
            //dropdowns
            $scope.VDatumsList = allVertDatums;
            $scope.thisSite = peakSite;
            $scope.memberList = allMembers;
            $scope.eventSiteHWMs = allEventHWMs.filter(function (h) { return h.SITE_ID == peakSite.SITE_ID; });
            angular.forEach($scope.eventSiteHWMs, function (esh) {
                esh.selected = false;
                esh.files = allSiteFiles.filter(function (sf) { return sf.HWM_ID == esh.HWM_ID && sf.fileBelongsTo == "HWM File"; });
            });
            
            $scope.eventSiteSensors = allSiteSensors.filter(function (s) { return s.Instrument.EVENT_ID == $cookies.get('SessionEventID'); }); //maybe go from here to get all datafiles for each sensor
            angular.forEach($scope.eventSiteSensors, function (ess) {
                ess.selected = false;
                ess.files = allSiteFiles.filter(function (sf) { return sf.INSTRUMENT_ID == ess.Instrument.INSTRUMENT_ID && (sf.fileBelongsTo == "DataFile File" || sf.fileBelongsTo == "Sensor File"); });
           });
            // $scope.siteFilesForSensors = allSiteFiles.filter(function (f) { return f.INSTRUMENT_ID !== null && f.INSTRUMENT_ID > 0; });
            $scope.timeZoneList = ['UTC', 'PST', 'MST', 'CST', 'EST'];
            $scope.LoggedInMember = allMembers.filter(function (m) { return m.MEMBER_ID == $cookies.get('mID'); })[0];
            $scope.chosenHWMList = [];//holder of chosen hwms for this peak
            $scope.chosenSensorList = []; //holder for chosen sensor for this peak
            $scope.hwmDetail = false; //show/hide hwm box of hwm details
            $scope.HWMBox = {}; //holds binding for what to show in hwm detail box
            $scope.sensorDetail = false; //show/hide sensor box of sensor details
            $scope.SensorBox = {}; //holds binding for what to show in the sensor detail box
            $scope.aPeak = {};
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

            //Datepicker
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

            //cancel
            $scope.cancel = function () {
                $rootScope.stateIsLoading.showLoading = false; // loading.. 
                $uibModalInstance.dismiss('cancel');
            };
            
            //is number
            $scope.isNum = function (evt) {
                var theEvent = evt || window.event;
                var key = theEvent.keyCode || theEvent.which;
                if (key != 46 && key != 45 && key > 31 && (key < 48 || key > 57)) {
                    theEvent.returnValue = false;
                    if (theEvent.preventDefault) theEvent.preventDefault();
                }
            };

            if (thisPeak != "empty") {
                //#region existing PEAK
                $scope.aPeak = angular.copy(thisPeak);
                $scope.aPeak.PEAK_DATE = getDateTimeParts($scope.aPeak.PEAK_DATE);
                //get peak creator name
                $scope.PeakCreator = allMembers.filter(function (m) { return m.MEMBER_ID == $scope.aPeak.MEMBER_ID; })[0];
                $scope.peakHWMs = eventSiteHWMs.filter(function (evsiH) { return evsiH.PEAK_SUMMARY_ID == $scope.aPeak.PEAK_SUMMARY_ID; });
                //$scope.chosenDFsForPeak = need to go from files to get datafiles and filter those based on peaksummary id...??
                //#endregion existing PEAK
            } else {
                //#region new PEAK
                var timeParts = getTimeZoneStamp();
                $scope.aPeak = { PEAK_DATE: {date: timeParts[0], time: timeParts[0]}, TIME_ZONE: timeParts[1], MEMBER_ID: $cookies.get('mID') };
                $scope.PeakCreator = allMembers.filter(function (m) { return m.MEMBER_ID == $cookies.get('mID'); })[0];
               
                //#endregion new PEAK
            }

            //show a modal with the larger file image as a preview
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

            //#region hwm list stuff
            //add or remove a hwm from the list of chosen hwms for determining this peak
            $scope.addHWM = function (h) {
                if (h.selected === true) {
                    $scope.chosenHWMList.push(h);
                } else {
                    if ($scope.chosenHWMList.length > 0) {
                        var ind = $scope.chosenHWMList.indexOf(h);
                        $scope.chosenHWMList.splice(ind, 1);
                    }
                }
            };
            
            //they want to see the details of the hwm, or not see it anymore
            $scope.showHWMDetails = function (h) {
                $scope.hwmDetail = true; $scope.sensorDetail = false;
                $scope.HWMBox = h;
            };

            //use this hwm to populate peak parts (primary hwm for determining peak)
            $scope.primaryHWM = function (h) {
                var setPrimHWM = $uibModal.open({
                    template: '<div class="modal-header"><h3 class="modal-title">Set as Primary</h3></div>' +
                        '<div class="modal-body"><p>Are you sure you want to set this as the Primary HWM? Doing so will populate the Peak Date (not including time), Stage, Vertical Datum and Height Above Ground.</p></div>' +
                        '<div class="modal-footer"><button class="btn btn-primary" ng-click="SetIt()">Set as Primary</button><button class="btn btn-primary" ng-click="cancel()">Cancel</button></div>',
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss();
                        };
                        $scope.SetIt = function () {
                            $uibModalInstance.close('Yes');
                        };
                    }],
                    size: 'sm'
                });
                setPrimHWM.result.then(function (setIt) {
                    if (setIt == 'Yes') {
                        $scope.aPeak.PEAK_DATE.date = h.FLAG_DATE;
                        $scope.aPeak.PEAK_STAGE = h.ELEV_FT;
                        $scope.aPeak.VDATUM_ID = h.VDATUM_ID;
                        $scope.aPeak.HEIGHT_ABOVE_GND = h.HEIGHT_ABV_GND;
                    }
                });
            };
            //#endregion

            $scope.closeDetail = function () {
                $scope.sensorDetail = false; $scope.hwmDetail = false;
            };

            //#region sensor list stuff
            //add or remove a sensor from the list of chosen sensor for determining this peak
            $scope.addSensor = function (s) {
                if (s.selected === true) {
                    $scope.chosenSensorList.push(s);
                } else {
                    if ($scope.chosenSensorList.length > 0) {
                        var ind = $scope.chosenSensorList.indexOf(s);
                        $scope.chosenSensorList.splice(ind, 1);
                    }
                }
            };

            //they want to see the details of the sensor, or not see it anymore
            $scope.showSensorDetails = function (s) {
                $scope.sensorDetail = true; $scope.hwmDetail = false;
                $scope.SensorBox = s;
            };

            //use this hwm to populate peak parts (primary sensor for determining peak)
            $scope.primarySensor = function (s) {
                var setPrimHWM = $uibModal.open({
                    template: '<div class="modal-header"><h3 class="modal-title">Set as Primary</h3></div>' +
                        '<div class="modal-body"><p>Are you sure you want to set this as the Primary Sensor? Doing so will populate the Peak Date, Time and time zone, Stage, Vertical Datum and Height Above Ground.</p></div>' +
                        '<div class="modal-footer"><button class="btn btn-primary" ng-click="SetIt()">Set as Primary</button><button class="btn btn-primary" ng-click="cancel()">Cancel</button></div>',
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss();
                        };
                        $scope.SetIt = function () {
                            $uibModalInstance.close('Yes');
                        };
                    }],
                    size: 'sm'
                });
                setPrimHWM.result.then(function (setIt) {
                    if (setIt == 'Yes') {
                        //$scope.aPeak.PEAK_DATE.date = h.FLAG_DATE;
                        //$scope.aPeak.PEAK_STAGE = h.ELEV_FT;
                        //$scope.aPeak.VDATUM_ID = h.VDATUM_ID
                        //$scope.aPeak.HEIGHT_ABOVE_GND = h.HEIGHT_ABV_GND;
                    }
                });
            };
            //#endregion
            //save Peak
            $scope.save = function () {
                if ($scope.HWMForm.$valid) {
                        var updatedHWM = {};
                        if ($scope.adminChanged.EVENT_ID !== undefined) {
                            //admin changed the event for this hwm..
                            $scope.aHWM.EVENT_ID = $scope.adminChanged.EVENT_ID;
                        }
                        //if they added a survey date, apply survey member as logged in member
                        if ($scope.aHWM.SURVEY_DATE !== undefined)
                            $scope.aHWM.SURVEY_TEAM_ID = $cookies.get('mID');

                        if ($scope.aHWM.ELEV_FT !== undefined && $scope.aHWM.ELEV_FT !== null) {
                            //make sure they added the survey date if they added an elevation
                            if ($scope.aHWM.SURVEY_DATE === undefined)
                                $scope.aHWM.SURVEY_DATE = makeAdate("");

                            $scope.aHWM.SURVEY_TEAM_ID = $cookies.get('mID');
                        }

                        $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                        $http.defaults.headers.common.Accept = 'application/json';
                        HWM.update({ id: $scope.aHWM.HWM_ID }, $scope.aHWM).$promise.then(function (response) {
                            toastr.success("HWM updated");
                            updatedHWM = response;
                            var sendBack = [updatedHWM, 'updated'];
                            $uibModalInstance.close(sendBack);
                        });
                    }
                };//end save()

            //delete Peak
            $scope.deleteHWM = function () {
                    //TODO:: Delete the files for this hwm too or reassign to the Site?? Services or client handling?
                    var DeleteModalInstance = $uibModal.open({
                        templateUrl: 'removemodal.html',
                        controller: 'ConfirmModalCtrl',
                        size: 'sm',
                        resolve: {
                            nameToRemove: function () {
                                return $scope.aHWM;
                            },
                            what: function () {
                                return "HWM";
                            }
                        }
                    });

                    DeleteModalInstance.result.then(function (hwmToRemove) {
                        $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                        HWM.delete({ id: hwmToRemove.HWM_ID }, hwmToRemove).$promise.then(function () {
                            toastr.success("HWM Removed");
                            var sendBack = ["de", 'deleted'];
                            $uibModalInstance.close(sendBack);
                        }, function error(errorResponse) {
                            toastr.error("Error: " + errorResponse.statusText);
                        });
                    }, function () {
                        //logic for cancel
                    });//end modal
                };

            //create Peak
            $scope.create = function () {
                if (this.HWMForm.$valid) {
                    var createdHWM = {};
                    //if they entered a survey date or elevation, then set survey member as the flag member (flagging and surveying at same time
                    if ($scope.aHWM.SURVEY_DATE !== undefined && $scope.aHWM.SURVEY_DATE !== null)
                        $scope.aHWM.SURVEY_TEAM_ID = $scope.FLAG_TEAM_ID;

                    if ($scope.aHWM.ELEV_FT !== undefined && $scope.aHWM.ELEV_FT !== null) {
                        //make sure they added the survey date if they added an elevation
                        if ($scope.aHWM.SURVEY_DATE === undefined)
                            $scope.aHWM.SURVEY_DATE = makeAdate("");

                        $scope.aHWM.SURVEY_TEAM_ID = $scope.FLAG_TEAM_ID;
                    }

                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    HWM.save($scope.aHWM).$promise.then(function (response) {
                        createdHWM = response;
                        toastr.success("HWM created");
                        var sendBack = [createdHWM, 'created'];
                        $uibModalInstance.close(sendBack);
                    });
                }
            };//end create()
      
        }]); //end HWM
})();