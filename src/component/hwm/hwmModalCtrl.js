(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var ModalControllers = angular.module('ModalControllers');
    ModalControllers.controller('hwmModalCtrl', ['$scope', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'allDropdowns', 'thisHWM', 'hwmSite', 'allMembers', 'HWM', 
        function hwmModalCtrl($scope, $cookies, $http, $uibModalInstance, $uibModal, allDropdowns, thisHWM, hwmSite, allMembers, HWM) {
            //TODO:: check to see if they chose an event.. if not, they need to before creating a hwm
            //dropdowns
            $scope.hwmTypeList = allDropdowns[0];
            $scope.hwmQualList = allDropdowns[1];
            $scope.HDatumsList = allDropdowns[2];
            $scope.hCollMList = allDropdowns[3];
            $scope.VDatumsList = allDropdowns[4];
            $scope.vCollMList = allDropdowns[5];
            $scope.markerList = allDropdowns[6];
            $scope.eventList = allDropdowns[7];
            $scope.userRole = $cookies.get('usersRole');
            $scope.FlagMember = ""; //just for show on page
            $scope.SurveyMember = ""; //just for show on page
            $scope.showEventDD = false; //toggle to show/hide event dd (admin only)
            $scope.adminChanged = {}; //will hold EVENT_ID if admin changes it. apply when PUTting

            //button click to show event dropdown to change it on existing hwm (admin only)
            $scope.showChangeEventDD = function () {
                $scope.showEventDD = !$scope.showEventDD;
            };

            //change event = apply it to the $scope.EventName
            $scope.ChangeEvent = function () {
                $scope.EventName = $scope.eventList.filter(function (el) { return el.EVENT_ID == $scope.adminChanged.EVENT_ID; })[0].EVENT_NAME;
            };
            // $scope.sessionEvent = $cookies.get('SessionEventName');
            $scope.LoggedInMember = allMembers.filter(function (m) { return m.MEMBER_ID == $cookies.get('mID'); })[0];

            $scope.aHWM = {};
            $scope.DMS = {};
            $scope.thisHWMsite = hwmSite;

            //Datepicker
            $scope.datepickrs = {};
            $scope.open = function ($event, which) {
                $event.preventDefault();
                $event.stopPropagation();

                $scope.datepickrs[which] = true;
            };

            //cancel
            $scope.cancel = function () {
                $scope.adminChanged = {};
                $scope.EventName = $scope.eventList.filter(function (e) { return e.EVENT_ID == $scope.aHWM.EVENT_ID; })[0].EVENT_NAME;
                $uibModalInstance.dismiss('cancel');
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
                if ($scope.aHWM.decDegORdms == "dd") {
                    //they clicked Dec Deg..
                    if ($scope.DMS.LADeg !== undefined) {
                        //convert what's here for each lat and long
                        $scope.aHWM.LATITUDE_DD = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                        $scope.aHWM.LONGITUDE_DD = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                        //clear
                        $scope.DMS = {};
                    }
                } else {
                    //they clicked dms (convert lat/long to dms)
                    if ($scope.aHWM.LATITUDE_DD !== undefined) {
                        var latDMS = (deg_to_dms($scope.aHWM.LATITUDE_DD)).toString();
                        var ladDMSarray = latDMS.split(':');
                        $scope.DMS.LADeg = ladDMSarray[0];
                        $scope.DMS.LAMin = ladDMSarray[1];
                        $scope.DMS.LASec = ladDMSarray[2];

                        var longDMS = deg_to_dms($scope.aHWM.LONGITUDE_DD);
                        var longDMSarray = longDMS.split(':');
                        $scope.DMS.LODeg = longDMSarray[0] * -1;
                        $scope.DMS.LOMin = longDMSarray[1];
                        $scope.DMS.LOSec = longDMSarray[2];
                        //clear
                        $scope.aHWM.LATITUDE_DD = undefined; $scope.aHWM.LONGITUDE_DD = undefined;
                    }
                }
            };

            //  lat/long =is number
            $scope.isNum = function (evt) {
                var theEvent = evt || window.event;
                var key = theEvent.keyCode || theEvent.which;
                if (key != 46 && key != 45 && key > 31 && (key < 48 || key > 57)) {
                    theEvent.returnValue = false;
                    if (theEvent.preventDefault) theEvent.preventDefault();
                }
            };

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
            };//end makeAdate()

            if (thisHWM != "empty") {
                //#region existing HWM
                $scope.aHWM = thisHWM;
                //get this hwm's event name
                $scope.EventName = $scope.eventList.filter(function (e) { return e.EVENT_ID == $scope.aHWM.EVENT_ID; })[0].EVENT_NAME;
                //date formatting
                $scope.aHWM.FLAGGED_DATE = makeAdate($scope.aHWM.FLAGGED_DATE);

                //if this is surveyed, date format and get survey member's name
                if ($scope.aHWM.SURVEY_DATE !== null) {
                    $scope.aHWM.SURVEY_DATE = makeAdate($scope.aHWM.SURVEY_DATE);
                    $scope.SurveyMember = allMembers.filter(function (m) { return m.MEMBER_ID == $scope.aHWM.SURVEY_TEAM_ID; })[0];
                }

                //get flagging member's name
                $scope.FlagMember = allMembers.filter(function (m) { return m.MEMBER_ID == $scope.aHWM.FLAG_TEAM_ID; })[0];

                //save aHWM
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

                //delete aHWM
                $scope.deleteHWM = function () {
                    //TODO:: Delete the files for this OP too or reassign to the Site?? Services or client handling?
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

                //#endregion existing HWM
            } else {
                //#region new HWM
                //use site's LAT, LONG, WATERBODY, HDATUM, HCOLLECTMETHOD, set FLAGDATE with today
                $scope.aHWM = {
                    SITE_ID: $scope.thisHWMsite.SITE_ID,
                    EVENT_ID: $cookies.get('SessionEventID'),
                    HWM_ENVIRONMENT: 'Riverine',
                    BANK: 'N/A',
                    STILLWATER: 0,
                    LATITUDE_DD: hwmSite.LATITUDE_DD,
                    LONGITUDE_DD: hwmSite.LONGITUDE_DD,
                    WATERBODY: hwmSite.WATERBODY,
                    HDATUM_ID: hwmSite.HDATUM_ID,
                    HCOLLECT_METHOD_ID: hwmSite.HCOLLECT_METHOD_ID,
                    FLAG_DATE: makeAdate(""),
                    FLAG_TEAM_ID: $scope.LoggedInMember.MEMBER_ID //need to make this FLAG_MEMBER_ID ... and at siteCtrl level get all members and pass to these modals to filter for member info to show
                };
                $scope.EventName = $cookies.get('SessionEventName');
                $scope.FlagMember = $scope.LoggedInMember;

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
                //#endregion new HWM
            }
            //radio button defaults
            $scope.aHWM.decDegORdms = 'dd';
        }]); //end HWM
})();