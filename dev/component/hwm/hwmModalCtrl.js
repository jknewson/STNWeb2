(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var ModalControllers = angular.module('ModalControllers');
    ModalControllers.controller('hwmModalCtrl', ['$scope', '$rootScope', '$cookies', '$http', '$sce', '$uibModalInstance', '$uibModal', 'SERVER_URL', 'allDropdowns', 'Site_Files', 'thisHWM', 'hwmApproval', 'agencyList', 'hwmSite', 'allMembers', 'HWM', 'SOURCE', 'FILE',
        function ($scope, $rootScope, $cookies, $http, $sce, $uibModalInstance, $uibModal, SERVER_URL, allDropdowns, Site_Files, thisHWM, hwmApproval, agencyList, hwmSite, allMembers, HWM, SOURCE, FILE) {
            //dropdowns
            $scope.view = { HWMval: 'detail' };
            $scope.h = { hOpen: true, hFileOpen: false }; //accordions
            $scope.hwmTypeList = allDropdowns[0];
            $scope.hwmQualList = allDropdowns[1];
            $scope.HDatumsList = allDropdowns[2];
            $scope.hCollMList = allDropdowns[3];
            $scope.VDatumsList = allDropdowns[4];
            $scope.vCollMList = allDropdowns[5];
            $scope.markerList = allDropdowns[6];
            $scope.eventList = allDropdowns[7];            
            $scope.fileTypeList = allDropdowns[8]; //used if creating/editing HWM file    
            
            $scope.allSFiles = Site_Files.getAllSiteFiles();
            $scope.HWMFiles = thisHWM !== "empty" ? $scope.allSFiles.filter(function (sf) { return sf.hwm_id == thisHWM.hwm_id; }) : [];// holder for hwm files added
            $scope.hwmImageFiles = $scope.HWMFiles.filter(function (hf) { return hf.filetype_id === 1; }); //image files for carousel
            $scope.showFileForm = false; //hidden form to add file to hwm
            $scope.userRole = $cookies.get('usersRole');
            $scope.FlagMember = ""; //just for show on page
            $scope.SurveyMember = ""; //just for show on page
            $scope.showEventDD = false; //toggle to show/hide event dd (admin only)
            $scope.adminChanged = {}; //will hold event_id if admin changes it. apply when PUTting
            $scope.serverURL = SERVER_URL; //constant with stntest.wim.usgs.gov/STNServices2 
            //button click to show event dropdown to change it on existing hwm (admin only)
            $scope.showChangeEventDD = function () {
                $scope.showEventDD = !$scope.showEventDD;
            };

            //change event = apply it to the $scope.EventName
            $scope.ChangeEvent = function () {
                $scope.EventName = $scope.eventList.filter(function (el) { return el.event_id == $scope.adminChanged.event_id; })[0].event_name;
            };
            // $scope.sessionEvent = $cookies.get('SessionEventName');
            $scope.LoggedInMember = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];

            $scope.aHWM = {};
            $scope.DMS = {};
            $scope.thisHWMsite = hwmSite;
            $scope.ApprovalInfo = {}; //when it gets approved or if it is approved, populate this with member and date
            //Datepicker
            $scope.datepickrs = {};
            $scope.open = function ($event, which) {
                $event.preventDefault();
                $event.stopPropagation();

                $scope.datepickrs[which] = true;
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
                if ($scope.createOReditHWM == 'edit') {
                    if ($scope.hwmCopy.decDegORdms == "dd") {
                        //they clicked Dec Deg..
                        if ($scope.DMS.LADeg !== undefined) {
                            //convert what's here for each lat and long
                            $scope.hwmCopy.latitude_dd = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                            $scope.hwmCopy.longitude_dd = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                            //clear
                            $scope.DMS = {};
                        }
                    } else {
                        //they clicked dms (convert lat/long to dms)
                        if ($scope.hwmCopy.latitude_dd !== undefined) {
                            var latDMS = (deg_to_dms($scope.hwmCopy.latitude_dd)).toString();
                            var ladDMSarray = latDMS.split(':');
                            $scope.DMS.LADeg = ladDMSarray[0];
                            $scope.DMS.LAMin = ladDMSarray[1];
                            $scope.DMS.LASec = ladDMSarray[2];

                            var longDMS = deg_to_dms($scope.hwmCopy.longitude_dd);
                            var longDMSarray = longDMS.split(':');
                            $scope.DMS.LODeg = longDMSarray[0] * -1;
                            $scope.DMS.LOMin = longDMSarray[1];
                            $scope.DMS.LOSec = longDMSarray[2];
                            //clear
                            $scope.hwmCopy.latitude_dd = undefined; $scope.hwmCopy.longitude_dd = undefined;
                        }
                    }
                } else {
                    //create view
                    if ($scope.aHWM.decDegORdms == "dd") {
                        //they clicked Dec Deg..
                        if ($scope.DMS.LADeg !== undefined) {
                            //convert what's here for each lat and long
                            $scope.aHWM.latitude_dd = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                            $scope.aHWM.longitude_dd = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                            //clear
                            $scope.DMS = {};
                        }
                    } else {
                        //they clicked dms (convert lat/long to dms)
                        if ($scope.aHWM.latitude_dd !== undefined) {
                            var create_latDMS = (deg_to_dms($scope.aHWM.latitude_dd)).toString();
                            var create_ladDMSarray = create_latDMS.split(':');
                            $scope.DMS.LADeg = create_ladDMSarray[0];
                            $scope.DMS.LAMin = create_ladDMSarray[1];
                            $scope.DMS.LASec = create_ladDMSarray[2];

                            var create_longDMS = deg_to_dms($scope.aHWM.longitude_dd);
                            var create_longDMSarray = create_longDMS.split(':');
                            $scope.DMS.LODeg = create_longDMSarray[0] * -1;
                            $scope.DMS.LOMin = create_longDMSarray[1];
                            $scope.DMS.LOSec = create_longDMSarray[2];
                            //clear
                            $scope.aHWM.latitude_dd = undefined; $scope.aHWM.longitude_dd = undefined;
                        }
                    }
                }
            };

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
                    if ($scope.DMS.LADeg < 0 || $scope.DMS.LADeg > 73) {
                        openLatModal('dms');
                    }
                    if ($scope.DMS.LODeg < -175 || $scope.DMS.LODeg > -60) {
                        openLongModal('dms');
                    }
                } else {
                    //check the latitude/longitude
                    var h = $scope.view.HWMval == 'edit' ? $scope.hwmCopy : $scope.aHWM;
                    if (h.latitude_dd < 0 || h.latitude_dd > 73) {
                        openLatModal('latlong');
                    }
                    if (h.longitude_dd < -175 || h.longitude_dd > -60) {
                        openLongModal('latlong');
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
                $scope.createOReditHWM = 'edit';
                $scope.aHWM = angular.copy(thisHWM);
                //get all the names for details view
                $scope.aHWM.hwm_type = $scope.hwmTypeList.filter(function (ht) { return ht.hwm_type_id == $scope.aHWM.hwm_type_id; })[0].hwm_type;
                if ($scope.aHWM.stillwater !== null) {
                    $scope.aHWM.Tranquil = $scope.aHWM.stillwater > 0 ? 'Yes' : 'No';
                }
                $scope.aHWM.Marker = $scope.aHWM.marker_id > 0 ? $scope.markerList.filter(function (m) { return m.marker_id == $scope.aHWM.marker_id; })[0].marker1 : '';
                $scope.aHWM.Quality = $scope.aHWM.hwm_quality_id > 0 ? $scope.hwmQualList.filter(function (hq) { return hq.hwm_quality_id == $scope.aHWM.hwm_quality_id; })[0].hwm_quality : '';
                $scope.aHWM.hdatum = $scope.aHWM.hdatum_id > 0 ? $scope.HDatumsList.filter(function (hd) { return hd.datum_id == $scope.aHWM.hdatum_id; })[0].datum_name : '';
                $scope.aHWM.hCollectMethod = $scope.aHWM.hcollect_method_id > 0 ? $scope.hCollMList.filter(function (hc) { return hc.hcollect_method_id == $scope.aHWM.hcollect_method_id; })[0].hcollect_method : '';
                $scope.aHWM.vDatum = $scope.aHWM.vdatum_id > 0 ? $scope.VDatumsList.filter(function (vd) { return vd.datum_id == $scope.aHWM.vdatum_id; })[0].datum_name : '';
                $scope.aHWM.vCollectMethod = $scope.aHWM.vcollect_method_id > 0 ? $scope.vCollMList.filter(function (vc) { return vc.vcollect_method_id == $scope.aHWM.vcollect_method_id; })[0].vcollect_method : '';

                $scope.hwmModalHeader = "HWM Information";
                //get this hwm's event name
                $scope.EventName = $scope.aHWM.event_id > 0 ? $scope.eventList.filter(function (e) { return e.event_id == $scope.aHWM.event_id; })[0].event_name : 'None provided';
                //date formatting
                $scope.aHWM.flag_date = makeAdate($scope.aHWM.flag_date);                
                //if this is surveyed, date format and get survey member's name
                if ($scope.aHWM.survey_date !== null) {
                    $scope.aHWM.survey_date = makeAdate($scope.aHWM.survey_date);
                    $scope.SurveyMember = allMembers.filter(function (m) { return m.member_id == $scope.aHWM.survey_member_id; })[0];
                }
                //get flagging member's name
                $scope.FlagMember = allMembers.filter(function (m) { return m.member_id == $scope.aHWM.flag_member_id; })[0];
                //#endregion existing HWM
            } else {
                //#region new HWM
                $scope.hwmModalHeader = "Create new HWM";
                $scope.createOReditHWM = 'create';
                //use site's LAT, LONG, waterbody, HDATUM, HCOLLECTMETHOD, set FLAGDATE with today
                $scope.aHWM = {
                    site_id: $scope.thisHWMsite.site_id,
                    event_id: $cookies.get('SessionEventID'),
                    hwm_environment: 'Riverine',
                    bank: 'N/A',
                    stillwater: 0,
                    latitude_dd: hwmSite.latitude_dd,
                    longitude_dd: hwmSite.longitude_dd,
                    waterbody: hwmSite.waterbody,
                    hdatum_id: hwmSite.hdatum_id,
                    hcollect_method_id: hwmSite.hcollect_method_id,
                    flag_date: makeAdate(""),
                    flag_member_id: $scope.LoggedInMember.member_id
                };
                $scope.EventName = $cookies.get('SessionEventName');
                $scope.FlagMember = $scope.LoggedInMember;
                //#endregion new HWM
            }
            //radio button defaults
            $scope.aHWM.decDegORdms = 'dd';
            $scope.FTorCM = 'ft';

            $scope.create = function (valid) {
                if (valid) {
                    var createdHWM = {};
                    if ($scope.DMS.LADeg !== undefined) $scope.aHWM.latitude_dd = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                    if ($scope.DMS.LODeg !== undefined) $scope.aHWM.longitude_dd = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                    //if they entered a survey date or elevation, then set survey member as the flag member (flagging and surveying at same time
                    if ($scope.aHWM.survey_date !== undefined && $scope.aHWM.survey_date !== null)
                        $scope.aHWM.survey_member_id = $scope.flag_member_id;

                    if ($scope.FTorCM == "cm") {
                        $scope.FTorCM = 'ft';
                        if ($scope.aHWM.uncertainty !== undefined)
                            $scope.aHWM.uncertainty = $scope.aHWM.uncertainty / 30.48;
                    }

                    if ($scope.aHWM.elev_ft !== undefined && $scope.aHWM.elev_ft !== null) {
                        //make sure they added the survey date if they added an elevation
                        if ($scope.aHWM.survey_date === undefined)
                            $scope.aHWM.survey_date = makeAdate("");

                        $scope.aHWM.survey_member_id = $scope.flag_member_id;
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

            //approve this hwm (if admin or manager)
            $scope.approveHWM = function () {
                //this is valid, show modal to confirm they want to approve it
                var thisHWM = $scope.aHWM;
                var approveModal = $uibModal.open({
                    template: "<div class='modal-header'><h3 class='modal-title'>Approve HWM</h3></div>" +
                        "<div class='modal-body'><p>Are you ready to approve this HWM?</p><p>The surveyed elevation is {{approveHWM.elev_ft || '---'}}</p><p>The height above ground is {{approveHWM.height_above_gnd || '---'}}</p></div>" +
                        "<div class='modal-footer'><button class='btn btn-primary' ng-click='approveIt()'>Approve</button><button class='btn btn-warning' ng-click='cancel()'>Cancel</button></div>",
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.approveHWM = thisHWM;
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                        $scope.approveIt = function () {
                            $uibModalInstance.close(thisHWM);
                        };
                    }],
                    size: 'sm'
                });
                approveModal.result.then(function (h) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    HWM.approveHWM({ id: h.hwm_id }).$promise.then(function (approvalResponse) {
                        h.approval_id = approvalResponse.approval_id;
                        toastr.success("HWM Approved");
                        $scope.ApprovalInfo.approvalDate = new Date(approvalResponse.approval_date); //include note that it's displayed in their local time but stored in UTC
                        $scope.ApprovalInfo.Member = allMembers.filter(function (amem) { return amem.member_id == approvalResponse.member_id; })[0];
                        //var sendBack = [h, 'updated'];
                        //$uibModalInstance.close(sendBack);
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    });
                }, function () {
                    //logic for cancel
                });//end modal
            };
            //approve this hwm (if admin or manager)
            $scope.unApproveHWM = function () {
                //this is valid, show modal to confirm they want to approve it
                var thisHWM = $scope.aHWM;
                var unapproveModal = $uibModal.open({
                    template: "<div class='modal-header'><h3 class='modal-title'>Remove Approval</h3></div>" +
                        "<div class='modal-body'><p>Are you sure you wan to unapprove this HWM?</p></div>" +
                        "<div class='modal-footer'><button class='btn btn-primary' ng-click='unApproveIt()'>Unapprove</button><button class='btn btn-warning' ng-click='cancel()'>Cancel</button></div>",
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.approveHWM = thisHWM;
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                        $scope.unApproveIt = function () {
                            $uibModalInstance.close(thisHWM);
                        };
                    }],
                    size: 'sm'
                });
                unapproveModal.result.then(function (h) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    HWM.unApproveHWM({ id: h.hwm_id }).$promise.then(function () {
                        h.approval_id = null;
                        toastr.success("HWM Unapproved");
                        $scope.ApprovalInfo = {};
                        //var sendBack = [h, 'updated'];
                        //$uibModalInstance.close(sendBack);
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    });
                }, function () {
                    //logic for cancel
                });//end modal
            };
            
            //save aHWM
            $scope.save = function (valid) {
                if (valid) {
                    var updatedHWM = {};
                    if ($scope.DMS.LADeg !== undefined) $scope.hwmCopy.latitude_dd = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                    if ($scope.DMS.LODeg !== undefined) $scope.hwmCopy.longitude_dd = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                    if ($scope.adminChanged.event_id !== undefined) {
                        //admin changed the event for this hwm..
                        $scope.hwmCopy.event_id = $scope.adminChanged.event_id;
                    }
                    //if they added a survey date, apply survey member as logged in member
                    if ($scope.hwmCopy.survey_date !== undefined)
                        $scope.hwmCopy.survey_member_id = $cookies.get('mID');

                    if ($scope.FTorCM == "cm") {
                        $scope.FTorCM = 'ft';
                        if ($scope.hwmCopy.uncertainty !== undefined)
                            $scope.hwmCopy.uncertainty = $scope.hwmCopy.uncertainty / 30.48;
                    }

                    if ($scope.hwmCopy.elev_ft !== undefined && $scope.hwmCopy.elev_ft !== null) {
                        //make sure they added the survey date if they added an elevation
                        if ($scope.hwmCopy.survey_date === undefined)
                            $scope.hwmCopy.survey_date = makeAdate("");

                        $scope.hwmCopy.survey_member_id = $cookies.get('mID');
                    }

                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    HWM.update({ id: $scope.hwmCopy.hwm_id }, $scope.hwmCopy).$promise.then(function (response) {
                        toastr.success("HWM updated");
                        $scope.aHWM = response; thisHWM = response;
                        //get all the names for details view
                        $scope.aHWM.hwm_type = $scope.hwmTypeList.filter(function (ht) { return ht.hwm_type_id == $scope.aHWM.hwm_type_id; })[0].hwm_type;
                        if ($scope.aHWM.stillwater !== null) {
                            $scope.aHWM.Tranquil = $scope.aHWM.stillwater > 0 ? 'Yes' : 'No';
                        }
                        $scope.aHWM.Marker = $scope.aHWM.marker_id > 0 ? $scope.markerList.filter(function (m) { return m.marker_id == $scope.aHWM.marker_id; })[0].marker1 : '';
                        $scope.aHWM.Quality = $scope.aHWM.hwm_quality_id > 0 ? $scope.hwmQualList.filter(function (hq) { return hq.hwm_quality_id == $scope.aHWM.hwm_quality_id; })[0].hwm_quality : '';
                        $scope.aHWM.hdatum = $scope.aHWM.hdatum_id > 0 ? $scope.HDatumsList.filter(function (hd) { return hd.datum_id == $scope.aHWM.hdatum_id; })[0].datum_name : '';
                        $scope.aHWM.hCollectMethod = $scope.aHWM.hcollect_method_id > 0 ? $scope.hCollMList.filter(function (hc) { return hc.hcollect_method_id == $scope.aHWM.hcollect_method_id; })[0].hcollect_method : '';
                        $scope.aHWM.vDatum = $scope.aHWM.vdatum_id > 0 ? $scope.VDatumsList.filter(function (vd) { return vd.datum_id == $scope.aHWM.vdatum_id; })[0].datum_name : '';
                        $scope.aHWM.vCollectMethod = $scope.aHWM.vcollect_method_id > 0 ? $scope.vCollMList.filter(function (vc) { return vc.vcollect_method_id == $scope.aHWM.vcollect_method_id; })[0].vcollect_method : '';
                        $scope.aHWM.flag_date = makeAdate($scope.aHWM.flag_date);
                        //is it approved?
                        if (hwmApproval !== undefined) {
                            $scope.ApprovalInfo.approvalDate = new Date(hwmApproval.approval_date); //include note that it's displayed in their local time but stored in UTC
                            $scope.ApprovalInfo.Member = allMembers.filter(function (amem) { return amem.member_id == hwmApproval.member_id; })[0];

                        }
                        //if this is surveyed, date format and get survey member's name
                        if ($scope.aHWM.survey_date !== null) {
                            $scope.aHWM.survey_date = makeAdate($scope.aHWM.survey_date);
                            $scope.SurveyMember = allMembers.filter(function (m) { return m.member_id == $scope.aHWM.survey_member_id; })[0];
                        }

                        //get flagging member's name
                        $scope.FlagMember = allMembers.filter(function (m) { return m.member_id == $scope.aHWM.flag_member_id; })[0];

                        $scope.hwmCopy = {};
                        $scope.view.HWMval = 'detail';
                        //var sendBack = [updatedHWM, 'updated'];
                        //$uibModalInstance.close(sendBack);
                    });
                }
            };//end save()

            //delete aHWM
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
                    HWM.delete({ id: hwmToRemove.hwm_id }, hwmToRemove).$promise.then(function () {
                        $scope.HWMFiles = []; //clear out hwmFiles for this hwm
                        $scope.hwmImageFiles = []; //clear out image files for this hwm
                        //now remove all these files from SiteFiles
                        var l = $scope.allSFiles.length;
                        while (l--) {
                            if ($scope.allSFiles[l].hwm_id == hwmToRemove.hwm_id) $scope.allSFiles.splice(l, 1);
                        }
                        //updates the file list on the sitedashboard
                        Site_Files.setAllSiteFiles($scope.allSFiles); 
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

            //cancel
            $scope.cancel = function () {
                $rootScope.stateIsLoading.showLoading = false; // loading.. 
                var sendBack = $scope.aHWM;
                $uibModalInstance.close(sendBack);
            };

            //edit button clicked. make copy of hwm 
            $scope.wannaEditHWM = function () {
                $scope.view.HWMval = 'edit'; 
                $scope.hwmCopy = angular.copy($scope.aHWM);
                $scope.hwmCopy.decDegORdms = 'dd';
            };
            $scope.cancelHWMEdit = function () {
                $scope.view.HWMval = 'detail';
                $scope.hwmCopy = []; 
                $scope.adminChanged = {};
                $scope.EventName = $scope.eventList.filter(function (e) { return e.event_id == $scope.aHWM.event_id; })[0].event_name;
            };

            //#region FILE STUFF
            //show a modal with the larger image as a preview on the photo file for this hwm
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
                $scope.existFileIndex = -1; $scope.existIMGFileIndex = -1; $scope.allSFileIndex = -1; //indexes for splice/change
                $scope.aFile = {}; //holder for file
                $scope.aSource = {}; //holder for file source
                //HWM will not have datafile 
                if (file !== 0) {
                    //edit hwm file
                    $scope.existFileIndex = $scope.HWMFiles.indexOf(file);
                    $scope.allSFileIndex = $scope.allSFiles.indexOf(file);
                    $scope.existIMGFileIndex = $scope.hwmImageFiles.length > 0 ? $scope.hwmImageFiles.indexOf(file) : -1;
                    $scope.aFile = angular.copy(file);
                    $scope.aFile.file_date = new Date($scope.aFile.file_date); //date for validity of form on PUT
                    if ($scope.aFile.photo_date !== undefined) $scope.aFile.photo_date = new Date($scope.aFile.photo_date); //date for validity of form on PUT
                    if (file.source_id !== null) {
                        SOURCE.query({ id: file.source_id }).$promise.then(function (s) {
                            $scope.aSource = s;
                            $scope.aSource.FULLname = $scope.aSource.source_name;
                            $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
                        });
                    }//end if source
                }//end existing file
                else {
                    $scope.aFile.file_date = new Date(); $scope.aFile.photo_date = new Date();
                    $scope.aSource = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];
                    $scope.aSource.FULLname = $scope.aSource.fname + " " + $scope.aSource.lname;
                    $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
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
                    $scope.HWMfileIsUploading = true;
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    var theSource = { source_name: $scope.aSource.FULLname, agency_id: $scope.aSource.agency_id };
                    //post source first to get source_id
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
                                    site_id: $scope.thisHWMsite.site_id,
                                    source_id: response.source_id,
                                    photo_direction: $scope.aFile.photo_direction,
                                    latitude_dd: $scope.aFile.latitude_dd,
                                    longitude_dd: $scope.aFile.longitude_dd,
                                    hwm_id: $scope.aHWM.hwm_id
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
                                fresponse.fileBelongsTo = "HWM File";
                                $scope.HWMFiles.push(fresponse);
                                $scope.allSFiles.push(fresponse);
                                Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                if (fresponse.filetype_id === 1) $scope.hwmImageFiles.push(fresponse);
                                $scope.showFileForm = false; $scope.HWMfileIsUploading = false;
                            }, function (errorResponse) {
                                $scope.HWMfileIsUploading = false;
                                toastr.error("Error uploading file: " + errorResponse.statusText);
                            });
                        } else {
                            $scope.aFile.source_id = response.source_id; $scope.aFile.site_id = $scope.thisHWMsite.site_id; $scope.aFile.hwm_id = $scope.aHWM.hwm_id;
                            FILE.save($scope.aFile).$promise.then(function (fresponse) {
                                toastr.success("Link saved");
                                fresponse.fileBelongsTo = "HWM File";
                                $scope.HWMFiles.push(fresponse);
                                $scope.allSFiles.push(fresponse);
                                Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard                                
                                $scope.showFileForm = false; $scope.HWMfileIsUploading = false;
                            }, function (errorResponse) {
                                $scope.HWMfileIsUploading = false;
                                toastr.error("Error saving file: " + errorResponse.statusText);
                            });
                        }//end else
                    }, function (errorResponse) {
                        $scope.HWMfileIsUploading = false;
                        toastr.error("Error creating Source info: " + errorResponse.statusText);
                    });//end source.save()              
                }//end valid
            };//end create()

            //update this file
            $scope.saveFile = function (valid) {
                if (valid) {
                    $scope.HWMfileIsUploading = true;
                    //only photo or other file type (no data file here)
                    //put source or datafile, put file
                    var whatkind = $scope.aFile.fileBelongsTo;
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    if ($scope.aSource.source_id !== undefined) {
                        $scope.aSource.source_name = $scope.aSource.FULLname;
                        SOURCE.update({ id: $scope.aSource.source_id }, $scope.aSource).$promise.then(function () {
                            FILE.update({ id: $scope.aFile.file_id }, $scope.aFile).$promise.then(function (fileResponse) {
                                toastr.success("File Updated");
                                fileResponse.fileBelongsTo = "HWM File";
                                $scope.HWMFiles[$scope.existFileIndex] = fileResponse;
                                $scope.allSFiles[$scope.allSFileIndex] = fileResponse;
                                Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                $scope.showFileForm = false; $scope.HWMfileIsUploading = false;
                            }, function (errorResponse) {
                                $scope.HWMfileIsUploading = false;
                                toastr.error("Error saving file: " + errorResponse.statusText);
                            });
                        }, function (errorResponse) {
                            $scope.HWMfileIsUploading = false; //Loading...
                            toastr.error("Error saving file: " + errorResponse.statusText);
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
                        $scope.HWMFiles.splice($scope.existFileIndex, 1);
                        $scope.allSFiles.splice($scope.allSFileIndex, 1);
                        $scope.hwmImageFiles.splice($scope.existIMGFileIndex, 1);
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
                //  $scope.datafile = {};
                $scope.showFileForm = false;
            };
            //#endregion FILE STUFF
            $rootScope.stateIsLoading.showLoading = false; // loading..
        }]); //end HWM
})();