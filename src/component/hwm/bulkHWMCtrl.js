(function () {
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('bulkHWMCtrl', ['$scope', '$state', '$rootScope', '$cookies', '$http', '$q', '$filter', '$uibModal', 'SITE', 'HWM', 'MEMBER', 'FILE', 'INST_COLL_CONDITION', 'PEAK', 'SOURCE', 'SERVER_URL',
        'eventList', 'stateList', 'countyList', 'hwmTypeList', 'markerList', 'hwmQualList', 'horizDatumList', 'horCollMethList', 'vertDatumList', 'vertCollMethList', 'fileTypesList', 'agenciesList',
        function ($scope, $state, $rootScope, $cookies, $http, $q, $filter, $uibModal, SITE, HWM, MEMBER, FILE, INST_COLL_CONDITION, PEAK, SOURCE, SERVER_URL, eventList, stateList, countyList,
            hwmTypeList, markerList, hwmQualList, horizDatumList, horCollMethList, vertDatumList, vertCollMethList, fileTypesList, agenciesList) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                //global vars
                $scope.showTips = true; //toggle show/hide tips
                $scope.status = { hwmOpen: true };
                $scope.serverURL = SERVER_URL; //constant with stntest.wim.usgs.gov/STNServices2 
                $scope.hwmTypes = hwmTypeList;
                $scope.markers = markerList;
                $scope.hwmQuals = hwmQualList;
                $scope.horDatums = horizDatumList;
                $scope.horCollMeths = horCollMethList;
                $scope.vertDatums = vertDatumList;
                $scope.vertCollMeths = vertCollMethList;
                $scope.states = stateList;
                $scope.counties = countyList;

                $scope.showLoading = false; //div holding loader      
                $scope.max = 0; $scope.dynamic = 0; //values for number of hwms are uploading (used in progressbar
                $scope.showProgressBar = false; //progressbar for uploading hwms
                $scope.hotInstance;
                //water, label, type,mrker,envr,uncrt,qul,bank,des,lat,long,hdatum,hcm,hag,flgDt,surDt,elev,vdatum,vcm,sUnc,notes, tranq/still,siteno
                $scope.columnWidths = [180, 150, 180, 180, 150, 170, 180, 100, 200, 140, 150, 180, 220, 100, 130, 120, 130, 160, 190, 160, 200, 200, 120];
                $scope.siteNoArrowClicked = false; //need a flag when clicked to check so that the required validation doesn't fire and show error modal at same time as sitemodal
                $scope.uploadHWMs = []; //data binding in the handsontable (they will paste in hwms)
                $scope.postedHWMs = []; //once posted, they are removed from the handsontable and added to this array to show in a table below
                $scope.invalids = []; //store when invalid thrown
                $scope.events = eventList;
                $scope.notValid = true;  //sent notValid to true by default so that it gets set to false once table is validated(button click)
                //#region make dropdowns
                $scope.hwmTypeArray = [];
                angular.forEach(hwmTypeList, function (ht) { $scope.hwmTypeArray.push(ht.hwm_type); });
                $scope.envirArray = ["Coastal", "Riverine"];
                $scope.markerArray = [];
                angular.forEach(markerList, function (m) { $scope.markerArray.push(m.marker1); });
                $scope.qualArray = [];
                angular.forEach(hwmQualList, function (hq) { $scope.qualArray.push(hq.hwm_quality); });
                $scope.bankArray = ["Left", "Right", "N/A"];
                $scope.hdatumArray = [];
                angular.forEach(horizDatumList, function (hd) { $scope.hdatumArray.push(hd.datum_name); });
                $scope.hcollMethArray = [];
                angular.forEach(horCollMethList, function (hcm) { $scope.hcollMethArray.push(hcm.hcollect_method); });
                $scope.vdatumArray = [];
                angular.forEach(vertDatumList, function (vd) { $scope.vdatumArray.push(vd.datum_abbreviation); });
                $scope.vcollMethArray = [];
                angular.forEach(vertCollMethList, function (vcm) { $scope.vcollMethArray.push(vcm.vcollect_method); });
                $scope.tranqArray = ["Yes", "No"];
                //#endregion make dropdowns

                $scope.chosenEvent = 0;
                $scope.chosenEventName = "";
                $scope.delIndex = -1; //if they delete a hwm from the DONE table, need index they clicked so closing warning modal will know which one to remove from postedHWMs list
                $scope.sitePeakarray = [];//when saving handsontable, each row, get sitePeaks, if so, store here
                //add FILE for approval memo or publication link
                $scope.addApprovalFile = function () {
                    var approvedFILEmodal = $uibModal.open({
                        templateUrl: 'BulkApprovalFILE_modal.html',
                        controller: ['$scope', '$cookies', '$uibModal', '$uibModalInstance', 'fileTypeList', 'agencyList', 'thisMember',
                            function ($scope, $cookies, $uibModal, $uibModalInstance, fileTypeList, agencyList, thisMember) {
                                $scope.hwmFileTypes = fileTypeList.filter(function (hft) {
                                    return hft.filetype === 'Photo' || hft.filetype === 'Historic Citation' || hft.filetype === 'Field Sheets' ||
                                        hft.filetype === 'Level Notes' || hft.filetype === 'Other' || hft.filetype === 'Link' || hft.filetype === 'Sketch';
                                });
                                $scope.aFile = {}; //holder for file
                                $scope.aFile.filetype_id = 7;
                                $scope.aFile.description = "PDF of Approval Memo";
                                $scope.aSource = {}; //holder for file source
                                $scope.agencies = agencyList;
                                $scope.approval_type = 7; //holder of approval type, used to update filetype_id and description
                                //radio approval type changed, update filetype_id and description
                                $scope.updateFileType = function () {
                                    $scope.aFile.filetype_id = Number($scope.approval_type);
                                    $scope.aFile.description = $scope.approval_type == "7" ? "PDF of Approval Memo" : "Report Link";
                                }

                                //Datepicker
                                $scope.datepickrs = {};
                                $scope.open = function ($event, which) {
                                    $event.preventDefault();
                                    $event.stopPropagation();

                                    $scope.datepickrs[which] = true;
                                };

                                $scope.aFile.file_date = new Date();
                                $scope.aFile.photo_date = new Date();
                                $scope.aSource = thisMember;
                                $scope.aSource.FULLname = $scope.aSource.fname + " " + $scope.aSource.lname;
                                $scope.addFile = function (valid) {
                                    if (valid) {
                                        if ($scope.aFile.name || $scope.aFile.File) {
                                            var fileParts = [$scope.aFile, $scope.aSource];
                                            $uibModalInstance.close(fileParts);
                                        } else {
                                            var errorModal = $uibModal.open({
                                                template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                                '<div class="modal-body"><p>You must upload a File for Approval Memo or a File URL for Report Link.</p></div>' +
                                                '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                                backdrop: 'static',
                                                keyboard: false,
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
                                $scope.cancelFile = function () {
                                    $uibModalInstance.dismiss();
                                };
                            }
                        ],
                        size: 'lg',
                        backdrop: 'static',
                        keyboard: false,
                        windowClass: 'rep-dialog',
                        resolve: {
                            fileTypeList: function () {
                                return fileTypesList
                            },
                            agencyList: function () {
                                return agenciesList;
                            },
                            thisMember: function () {
                                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                                $http.defaults.headers.common.Accept = 'application/json';
                                return MEMBER.query({ id: $cookies.get('mID') }).$promise;
                            }
                        }
                    });
                    approvedFILEmodal.result.then(function (createdFile) {
                        $scope.approvalFile = createdFile[0];
                        $scope.approvalSource = createdFile[1];
                    });
                };//end addApprovalFile
                //end add FILE

                //called to format just the date (no time)
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

                //#region SITE NO dropdown arrow Click MODAL part ------------------------------------------------------------------------
                var getFindSiteModal = function (r, c, hwmParts) {
                    //   $scope.showLoading = true; // loading..
                    angular.element('#loadingDiv').removeClass('noShow');
                    var dataAtRow = $scope.hotInstance.getDataAtRow(r); setTimeout(function () { $scope.hotInstance.deselectCell(); }, 100);
                    if (dataAtRow[9] !== "" && dataAtRow[10] !== "" && dataAtRow[9] !== null && dataAtRow[10] !== null) {
                        angular.element('#loadingDiv').addClass('noShow');
                        var siteModal = $uibModal.open({
                            templateUrl: 'associateSitemodal.html',
                            backdrop: 'static',
                            keyboard: false,
                            resolve: {
                                nearBySites: function () {
                                    return SITE.getProximitySites({ Latitude: dataAtRow[9], Longitude: dataAtRow[10], Buffer: 0.0005 }).$promise;
                                },
                                HWMparts: function () { return hwmParts; },
                                siteNoAlreadyThere: function () { return dataAtRow[22]; },
                                hdatums: function () { return $scope.horDatums; },
                                hcolMeths: function () { return $scope.horCollMeths; },
                                vdatums: function () { return $scope.vertDatums; },
                                vcolMeths: function () { return $scope.vertCollMeths; },
                                states: function () { return $scope.states; },
                                counties: function () { return $scope.counties; }
                            },
                            controller: 'hwmSiteModalCtrl',
                            size: 'sm'
                        });
                        siteModal.result.then(function (thisSite) {
                            angular.element('#loadingDiv').addClass('noShow');
                            if (thisSite !== undefined) $scope.hotInstance.setDataAtCell(r, c, thisSite.site_no);
                        });
                    } else {
                        angular.element('#loadingDiv').addClass('noShow');
                        var errorModal = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>Please populate this row\'s latitude and longitude before finding a site to associate.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                            backdrop: 'static',
                            keyboard: false,
                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                $scope.ok = function () {
                                    $uibModalInstance.dismiss();
                                };
                            }],
                            size: 'sm'
                        });
                    }
                };
                //#endregion SITE NO dropdown arrow Click MODAL part ------------------------------------------------------------------------

                //#region renderers/validators
                $scope.requiredValidator = function (value, callback) {
                    //if this is the dropdown arrow being clicked in siteNo cell, don't show error message
                    if ($scope.siteNoArrowClicked) {
                        $scope.siteNoArrowClicked = false;
                        callback(true);
                    } else {
                        //only care if there's other data in this row
                        var row = this.row; var col = this.col;
                        //var physicalIndex = untranslateRow(row);
                        var dataAtRow = $scope.hotInstance.getDataAtRow(row);
                        var otherDataInRow = false;
                        angular.forEach(dataAtRow, function (d, index) {
                            //need the col too because right after removing req value, it's still in the .getDataAtRow..
                            if (d !== null && d !== "" && index !== col)
                                otherDataInRow = true;
                        });
                        if (!value && otherDataInRow) {
                            var whichOne = $scope.hotInstance.getColHeader(col);
                            toastr.options.timeOut = "6000";
                            toastr.options.closeButton = true;
                            toastr.error(whichOne + " is a required field."); //  requiredModal();
                            callback(false);
                        } else {
                            callback(true);
                        }
                    }
                };
                $scope.latValidator = function (value, callback) {
                    var row = this.row; var col = this.col;
                    var dataAtRow = $scope.hotInstance.getDataAtRow(row);
                    var otherDataInRow = false;
                    angular.forEach(dataAtRow, function (d, index) {
                        //need the col too because right after removing req value, it's still in the .getDataAtRow..
                        if (d !== null && d !== "" && index !== col)
                            otherDataInRow = true;
                    });
                    if (((value < 22 || value > 55) || isNaN(value)) && otherDataInRow) {
                        setTimeout(function () { $scope.hotInstance.deselectCell(); }, 100);
                        toastr.options.timeOut = "6000";
                        toastr.options.closeButton = true;
                        toastr.error("Latitude must be between 22.0 and 55.0 (dec deg).");
                        callback(false);
                    } else if (!value && otherDataInRow) {
                        var whichOne = $scope.hotInstance.getColHeader(col);
                        toastr.options.timeOut = "6000";
                        toastr.options.closeButton = true;
                        toastr.error(whichOne + " is a required field.");
                        callback(false);
                    } else {
                        callback(true);
                    }
                };
                $scope.longValidator = function (value, callback) {
                    var row = this.row; var col = this.col;
                    var dataAtRow = $scope.hotInstance.getDataAtRow(row);
                    var otherDataInRow = false;
                    angular.forEach(dataAtRow, function (d, index) {
                        //need the col too because right after removing req value, it's still in the .getDataAtRow..
                        if (d !== null && d !== "" && index !== col)
                            otherDataInRow = true;
                    });
                    if (((value < -130 || value > -55) || isNaN(value)) && otherDataInRow) {
                        setTimeout(function () { $scope.hotInstance.deselectCell(); }, 100);
                        toastr.options.timeOut = "6000";
                        toastr.options.closeButton = true;
                        toastr.error("Longitude must be between -130.0 and -55.0 (dec deg).");
                        callback(false);
                    } else if (!value && otherDataInRow) {
                        var whichOne = $scope.hotInstance.getColHeader(col);
                        toastr.options.timeOut = "6000";
                        toastr.options.closeButton = true;
                        toastr.error(whichOne + " is a required field.");
                        //  requiredModal();
                        callback(false);
                    }
                    else {
                        callback(true);
                    }
                };
                $scope.numericValidator = function (value, callback) {
                    var whichOne = $scope.hotInstance.getColHeader(this.col);
                    if (value !== "" && value !== null && (isNaN(Number(value)))) {
                        setTimeout(function () { $scope.hotInstance.deselectCell(); }, 100);
                        toastr.options.timeOut = "6000";
                        toastr.options.closeButton = true;
                        toastr.error(whichOne + " must be an numeric value (ex: 0.03).");
                        callback(false);
                    } else if (whichOne == "HWM Uncertainty (ft)" && value !== "" && value !== null) {
                        //check if hwmQuality has value. if so, see if it's within proper range
                        var hwmQualValue = $scope.hotInstance.getDataAtCell(this.row, 6);
                        if (hwmQualValue !== null && hwmQualValue !== "") {
                            var appropriateHWMQual = "";
                            if (value > 0.4) appropriateHWMQual = "VP: > 0.40 ft";
                            else if (value < 0.05) appropriateHWMQual = "Excellent: +/- 0.05 ft";
                            else {
                                appropriateHWMQual = $scope.hwmQuals.filter(function (h) { return h.min_range <= value && h.max_range >= value; })[0].hwm_quality;
                            }
                            if (appropriateHWMQual !== hwmQualValue) {
                                toastr.options.timeOut = "6000";
                                toastr.options.closeButton = true;
                                toastr.error(whichOne + " does not have a matching HWM Quality for row " + Number(this.row + 1));
                                callback(false);
                            } else callback(true);
                        } else callback(true);
                    } else {
                        callback(true);
                    }
                };
                $scope.matchingDDValue = function (value, callback) {
                    var row = this.row; var col = this.col;
                    var dataAtRow = $scope.hotInstance.getDataAtRow(row);
                    var otherDataInRow = false;
                    angular.forEach(dataAtRow, function (d, index) {
                        //need the col too because right after removing req value, it's still in the .getDataAtRow..
                        if (d !== null && d !== "" && index !== col)
                            otherDataInRow = true;
                    });
                    //if value isn't empty and theres other data in row...
                    if (value !== "" && value !== null) {// && otherDataInRow) {
                        var prop = this.prop; var hasError = false;
                        switch (prop) {
                            case 'hwm_type_id':
                                if ($scope.hwmTypeArray.map(function (hwT) { return hwT; }).indexOf(value) < 0) {
                                    hasError = true;
                                }
                                break;
                            case 'marker_id':
                                if ($scope.markerArray.map(function (hwM) { return hwM; }).indexOf(value) < 0) {
                                    hasError = true;
                                }
                                break;
                            case 'hwm_environment':
                                if ($scope.envirArray.map(function (hwE) { return hwE; }).indexOf(value) < 0) {
                                    hasError = true;
                                }
                                break;
                            case 'hwm_quality_id':
                                if ($scope.qualArray.map(function (hwQ) { return hwQ; }).indexOf(value) < 0) {
                                    hasError = true;
                                }
                                break;
                            case 'bank':
                                if ($scope.bankArray.map(function (hwB) { return hwB; }).indexOf(value) < 0) {
                                    hasError = true;
                                }
                                break;
                            case 'hdatum_id':
                                if ($scope.hdatumArray.map(function (hD) { return hD; }).indexOf(value) < 0) {
                                    hasError = true;
                                }
                                break;
                            case 'hcollect_method_id':
                                if ($scope.hcollMethArray.map(function (hC) { return hC; }).indexOf(value) < 0) {
                                    hasError = true;
                                }
                                break;
                            case 'vdatum_id':
                                if ($scope.vdatumArray.map(function (hD) { return hD; }).indexOf(value) < 0) {
                                    hasError = true;
                                }
                                break;
                            case 'vcollect_method_id':
                                if ($scope.vcollMethArray.map(function (hC) { return hC; }).indexOf(value) < 0) {
                                    hasError = true;
                                }
                                break;
                            case 'stillwater':
                                if ($scope.tranqArray.map(function (t) { return t; }).indexOf(value) < 0) {
                                    hasError = true;
                                }
                                break;
                        }

                        if (hasError) {
                            callback(false);
                        } else if (prop == "hwm_quality_id") {
                            //check if hwm uncertainty has value. if so, see if it's within proper range
                            var uncertValue = $scope.hotInstance.getDataAtCell(row, 5);
                            if (uncertValue !== null && uncertValue !== "") {
                                var appropriatequal = "";
                                if (uncertValue > 0.4) appropriatequal = "VP: > 0.40 ft";
                                else if (uncertValue < 0.05) appropriatequal = "Excellent: +/- 0.05 ft";
                                else {
                                    appropriatequal = $scope.hwmQuals.filter(function (h) { return h.min_range <= uncertValue && h.max_range >= uncertValue; })[0].hwm_quality;
                                }
                                if (appropriatequal !== value) {
                                    toastr.options.timeOut = "6000";
                                    toastr.options.closeButton = true;
                                    toastr.error("HWM Quality does not have a matching HWM uncertainty range value for row " + Number(row + 1));
                                    callback(false);
                                } else { callback(true); }
                            } else callback(true);
                        } else callback(true);
                    } else if (!value && otherDataInRow && [3, 7, 17, 18, 21].indexOf(this.col) < 0) {
                        var whichOne = $scope.hotInstance.getColHeader(col);
                        toastr.options.timeOut = "6000";
                        toastr.options.closeButton = true;
                        toastr.error(whichOne + " is a required field.");
                        callback(false);
                    } else callback(true);
                };
                //#endregion

                //called from in save function, done posting now remove the successful one from the handsontable above
                var removeThisUploadHWM = function (successfulHWM) {
                    // find this one in the $scope.uploadHWMs and splice it out
                    var spliceIndex = -1;
                    var bank = successfulHWM.bank;
                    var hcmName = horCollMethList.filter(function (hcm) { return hcm.hcollect_method_id == successfulHWM.hcollect_method_id; })[0].hcollect_method;
                    var hdName = horizDatumList.filter(function (hd) { return hd.datum_id == successfulHWM.hdatum_id; })[0].datum_name;
                    var hwmQName = hwmQualList.filter(function (hq) { return hq.hwm_quality_id == successfulHWM.hwm_quality_id; })[0].hwm_quality;
                    var hwmTName = hwmTypeList.filter(function (ht) { return ht.hwm_type_id == successfulHWM.hwm_type_id; })[0].hwm_type;
                    var mark = successfulHWM.marker_id !== undefined ? markerList.filter(function (m) { return m.marker_id == successfulHWM.marker_id; })[0].marker1 : undefined;
                    var vcmName = successfulHWM.vcollect_method_id !== undefined ? vertCollMethList.filter(function (vcm) { return vcm.vcollect_method_id == successfulHWM.vcollect_method_id; })[0].vcollect_method : undefined;
                    var vdName = successfulHWM.vdatum_id !== undefined ? vertDatumList.filter(function (vd) { return vd.datum_id == successfulHWM.vdatum_id; })[0].datum_abbreviation : undefined;
                    var hag = successfulHWM.height_above_gnd !== undefined ? Number(successfulHWM.height_above_gnd) : undefined;
                    var elFt = successfulHWM.elev_ft !== undefined ? Number(successfulHWM.elev_ft) : undefined;
                    var unc = successfulHWM.uncertainty !== undefined ? Number(successfulHWM.uncertainty) : undefined;
                    var hwmUnc = successfulHWM.hwm_uncertainty !== undefined ? Number(successfulHWM.hwm_uncertainty) : undefined;
                    for (var hwmI = 0; hwmI < $scope.uploadHWMs.length; hwmI++) {
                        if ($scope.uploadHWMs[hwmI].site_no !== undefined) {
                            //format each uploadHWM first to compare apples to apples
                            var upload_hwmUnc = $scope.uploadHWMs[hwmI].hwm_uncertainty !== "" && $scope.uploadHWMs[hwmI].hwm_uncertainty !== undefined ? Number($scope.uploadHWMs[hwmI].hwm_uncertainty) : undefined;
                            var upload_mark = $scope.uploadHWMs[hwmI].marker_id !== "" && $scope.uploadHWMs[hwmI].marker_id !== undefined ? $scope.uploadHWMs[hwmI].marker_id : undefined;
                            var upload_unc = $scope.uploadHWMs[hwmI].uncertainty !== "" && $scope.uploadHWMs[hwmI].uncertainty !== undefined ? Number($scope.uploadHWMs[hwmI].uncertainty) : undefined;
                            var upload_hag = $scope.uploadHWMs[hwmI].height_above_gnd !== "" && $scope.uploadHWMs[hwmI].height_above_gnd !== undefined ? Number($scope.uploadHWMs[hwmI].height_above_gnd) : undefined;
                            var upload_elFt = $scope.uploadHWMs[hwmI].elev_ft !== "" && $scope.uploadHWMs[hwmI].elev_ft !== undefined ? Number($scope.uploadHWMs[hwmI].elev_ft) : undefined;
                            var upload_vcollMeth = $scope.uploadHWMs[hwmI].vcollect_method_id !== "" && $scope.uploadHWMs[hwmI].vcollect_method_id !== undefined ? $scope.uploadHWMs[hwmI].vcollect_method_id : undefined;
                            var upload_vdat = $scope.uploadHWMs[hwmI].vdatum_id !== "" && $scope.uploadHWMs[hwmI].vdatum_id !== undefined ? $scope.uploadHWMs[hwmI].vdatum_id : undefined;
                            //not a null row
                            if ($scope.uploadHWMs[hwmI].site_no == successfulHWM.site_no &&
                                $scope.uploadHWMs[hwmI].waterbody == successfulHWM.waterbody &&
                                upload_hwmUnc == hwmUnc && //uploadHWMs[..].hwm_uncertainty is "" and comparing to undefined
                                $scope.uploadHWMs[hwmI].bank == bank &&
                                $scope.uploadHWMs[hwmI].hwm_locationdescription == successfulHWM.hwm_locationdescription &&
                                Number($scope.uploadHWMs[hwmI].latitude_dd) == successfulHWM.latitude_dd && Number($scope.uploadHWMs[hwmI].longitude_dd) == successfulHWM.longitude_dd &&
                                upload_hag == hag &&
                                $scope.uploadHWMs[hwmI].hcollect_method_id == hcmName &&
                                $scope.uploadHWMs[hwmI].hdatum_id == hdName &&
                                $scope.uploadHWMs[hwmI].hwm_quality_id == hwmQName &&
                                $scope.uploadHWMs[hwmI].hwm_type_id == hwmTName &&
                                upload_mark == mark && //uploadHWMs[..].marker_id is "" and comparing to undefined
                                upload_vcollMeth == vcmName &&
                                upload_vdat == vdName &&
                                upload_elFt == elFt &&
                                upload_unc == unc &&
                                $scope.uploadHWMs[hwmI].hwm_notes == successfulHWM.hwm_notes) {
                                spliceIndex = hwmI;
                            }
                        }
                        if (spliceIndex >= 0) {
                            $scope.uploadHWMs.splice(spliceIndex, 1);
                            hwmI = $scope.uploadHWMs.length;//break!
                        }
                    }
                    if ($scope.dynamic == $scope.max)
                        $scope.showProgressBar = false;
                    $scope.showLoading = 'false'; // loading..
                };

                //validate before allowing save 
                $scope.validateTable = function () {
                    $scope.showLoading = true; // loading..
                    angular.element('#loadingDiv').removeClass('noShow');
                    var haveData = $scope.hotInstance.getDataAtCell(0, 2); //  (row,col) hwm_type
                    if (haveData !== null) {
                        $scope.hotInstance.validateCells(function (valid) {
                            if (valid) {
                                var validModal = $uibModal.open({
                                    template: '<div class="modal-header"><h3 class="modal-title">Valid</h3></div>' +
                                    '<div class="modal-body"><p>Validation successful!</p></div>' +
                                    '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                    controller: ['$scope', '$rootScope', '$uibModalInstance', function ($scope, $rootScope, $uibModalInstance) {
                                        $scope.ok = function () {
                                            $uibModalInstance.dismiss();
                                        };
                                        $scope.showLoading = false; // loading..
                                        angular.element('#loadingDiv').addClass('noShow'); //addClass =false, removeClass =true                                        
                                    }],
                                    size: 'sm'
                                });
                                $scope.notValid = false;

                            } else {
                                $scope.notValid = true;
                                var invalidModal = $uibModal.open({
                                    template: '<div class="modal-header"><h3 class="modal-title">Invalid!</h3></div>' +
                                    '<div class="modal-body"><p>The table is not valid. Please correct red cells and try again.</p></div>' +
                                    '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                    controller: ['$scope', '$rootScope', '$uibModalInstance', function ($scope, $rootScope, $uibModalInstance) {
                                        $scope.ok = function () {
                                            $uibModalInstance.dismiss();
                                        };
                                        $scope.showLoading = false; // loading..
                                        angular.element('#loadingDiv').addClass('noShow'); //addClass =false, removeClass =true                                        
                                    }],
                                    size: 'sm'
                                });
                                angular.element('#loadingDiv').addClass('noShow'); //need to do this way for some reason changing boolean isn't working . $rootScope either
                                //$scope.showLoading = false; // loading..
                            }
                        });
                    } else {
                        angular.element('#loadingDiv').addClass('noShow'); //addClass =false, removeClass =true
                        $scope.showLoading = false; // loading..                 
                        var validModal = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>Not enough data in the table to validate.</p></div>' +
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

                //save updates
                $scope.save = function () {
                    $scope.dynamic = 0;
                    $scope.chosenEventName = $scope.events.filter(function (e) { return e.event_id == $scope.chosenEvent; })[0].event_name;
                    var pastedHWMs = angular.copy($scope.uploadHWMs);
                    // drop the last 20 since they are empty
                    for (var i = pastedHWMs.length; i--;) {
                        if (pastedHWMs[i].site_no === undefined || pastedHWMs[i].site_no === null || pastedHWMs[i].site_no === "") {
                            pastedHWMs.splice(i, 1);
                        }
                    }
                    $scope.max = pastedHWMs.length;
                    $scope.showLoading = 'true'; // loading..
                    $scope.notValid = true; //reset so they don't click it again before having to validate
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    $scope.showProgressBar = true;
                    //no go thru each and get rest of fields needed and post hwms
                    angular.forEach(pastedHWMs, function (hwm, index) {
                        // var sitePeak = {};
                        SITE.getSearchedSite({ bySiteNo: hwm.site_no }).$promise.then(function (response) {
                            SITE.getSitePeaks({ id: response.site_id }, function (peakResponse) {
                                for (var p = 0; p < peakResponse.length; p++) {
                                    //make sure the site peak is for this event
                                    if (peakResponse[p].event_name == $scope.chosenEventName) {
                                        $scope.sitePeakarray.push([response.site_id, peakResponse[p].peak_summary_id]);
                                    }
                                }
                                hwm.site_id = response.site_id;
                                hwm.event_id = $scope.chosenEvent;
                                hwm.flag_member_id = $scope.$parent.userID;
                                hwm.flag_date = makeAdate(hwm.flag_date);
                                if (hwm.survey_date !== "" && hwm.survey_date !== undefined) hwm.survey_date = makeAdate(hwm.survey_date);
                                hwm.hcollect_method_id = horCollMethList.filter(function (hcm) { return hcm.hcollect_method == hwm.hcollect_method_id; })[0].hcollect_method_id;
                                hwm.hdatum_id = horizDatumList.filter(function (hd) { return hd.datum_name == hwm.hdatum_id; })[0].datum_id;
                                hwm.hwm_quality_id = hwmQualList.filter(function (hq) { return hq.hwm_quality == hwm.hwm_quality_id; })[0].hwm_quality_id;
                                hwm.hwm_type_id = hwmTypeList.filter(function (ht) { return ht.hwm_type == hwm.hwm_type_id; })[0].hwm_type_id;
                                hwm.marker_id = hwm.marker_id !== "" && hwm.marker_id !== undefined ? markerList.filter(function (m) { return m.marker1 == hwm.marker_id; })[0].marker_id : undefined;
                                if (hwm.stillwater !== "" && hwm.stillwater !== undefined) hwm.stillwater = hwm.stillwater == "No" ? "0" : "1";
                                hwm.vcollect_method_id = hwm.vcollect_method_id !== "" && hwm.vcollect_method_id !== undefined ? vertCollMethList.filter(function (vcm) { return vcm.vcollect_method == hwm.vcollect_method_id; })[0].vcollect_method_id : undefined;
                                hwm.vdatum_id = hwm.vdatum_id !== "" && hwm.vdatum_id !== undefined ? vertDatumList.filter(function (vd) { return vd.datum_abbreviation == hwm.vdatum_id; })[0].datum_id : undefined;
                                if (hwm.survey_date !== "" && hwm.survey_date !== undefined) hwm.survey_member_id = $scope.$parent.userID;
                                //now post it
                                var siteNo = hwm.site_no;
                                delete hwm.site_no;
                                // (let services handle this) hwm.hwm_label = "hwm-" + parseInt(index + 1);
                                HWM.save(hwm).$promise.then(function (hwmResponse) {
                                    //approve it
                                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                                    HWM.approveHWM({ id: hwmResponse.hwm_id }).$promise.then(function (approvalResponse) {
                                        hwmResponse.approval_id = approvalResponse.approval_id;
                                        hwmResponse.site_no = siteNo;
                                        if (hwmResponse.stillwater !== undefined) {
                                            hwmResponse.stillwater = hwmResponse.stillwater > 0 ? "Yes" : "No";
                                        } else hwmResponse.stillwater = "";
                                        var sitePeakId = $scope.sitePeakarray.filter(function (sp) { return sp[0] == hwmResponse.site_id; })[0];
                                        if (sitePeakId !== undefined) {
                                            //there's a peak this hwm could be added to
                                            hwmResponse.PeakSummary = sitePeakId;
                                        }
                                        //post the file and add to the hwm before pushing to postedHWMs
                                        var theSource = { source_name: $scope.approvalSource.FULLname, agency_id: $scope.approvalSource.agency_id };
                                        //post source first to get source_id
                                        SOURCE.save(theSource).$promise.then(function (sourceResponse) {
                                            if ($scope.approvalFile.filetype_id !== 8) {
                                                //then POST fileParts (Services populate PATH)
                                                var fileParts = {
                                                    FileEntity: {
                                                        filetype_id: $scope.approvalFile.filetype_id,
                                                        name: $scope.approvalFile.File.name,
                                                        file_date: $scope.approvalFile.file_date,
                                                        photo_date: $scope.approvalFile.photo_date,
                                                        description: $scope.approvalFile.description,
                                                        site_id: hwmResponse.site_id,
                                                        source_id: sourceResponse.source_id,
                                                        photo_direction: $scope.approvalFile.photo_direction,
                                                        latitude_dd: $scope.approvalFile.latitude_dd,
                                                        longitude_dd: $scope.approvalFile.longitude_dd,
                                                        hwm_id: hwmResponse.hwm_id
                                                    },
                                                    File: $scope.approvalFile.File
                                                };//end fileParts
                                                //need to put the fileParts into correct format for post
                                                var fd = new FormData();
                                                fd.append("FileEntity", JSON.stringify(fileParts.FileEntity));
                                                fd.append("File", fileParts.File);
                                                //now POST it (fileparts)
                                                FILE.uploadFile(fd).$promise.then(function (fresponse) {
                                                    hwmResponse.HWMFiles = [];
                                                    hwmResponse.HWMFiles.push(fresponse);
                                                    //add to the done list (make sure it's not already there)
                                                    if ($scope.postedHWMs.map(function (p) { return p.hwm_id; }).indexOf(hwmResponse.hwm_id) < 0) {
                                                        toastr.success("HWM uploaded: hwm_id:" + hwmResponse.hwm_id);
                                                        $scope.postedHWMs.push(hwmResponse);
                                                    }
                                                    else toastr.error("HWM " + hwmResponse.hwm_id + " is already in the successfully uploaded list below.");
                                                    $scope.dynamic++;
                                                    removeThisUploadHWM(hwmResponse); //remove it from the handsontable
                                                }, function (errorResponse) {
                                                    $scope.showProgressBar = false;
                                                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error uploading file: " + errorResponse.headers(["usgswim-messages"]));
                                                    else toastr.error("Error uploading file: " + errorResponse.statusText);
                                                });
                                            }//end if filetype_id !== 8
                                            else {
                                                $scope.approvalFile.source_id = sourceResponse.source_id;
                                                $scope.approvalFile.site_id = hwmResponse.site_id;
                                                $scope.approvalFile.hwm_id = hwmResponse.hwm_id;
                                                $scope.approvalFile.path = '<link>';
                                                FILE.save($scope.approvalFile).$promise.then(function (fresponse) {
                                                    hwmResponse.HWMFiles = [];
                                                    hwmResponse.HWMFiles.push(fresponse);
                                                    //add to the done list (make sure it's not already there)
                                                    if ($scope.postedHWMs.map(function (p) { return p.hwm_id; }).indexOf(hwmResponse.hwm_id) < 0) {
                                                        toastr.success("HWM uploaded: hwm_id:" + hwmResponse.hwm_id);
                                                        $scope.postedHWMs.push(hwmResponse);
                                                    }
                                                    else toastr.error("HWM " + hwmResponse.hwm_id + " is already in the successfully uploaded list below.");
                                                    $scope.dynamic++;
                                                    removeThisUploadHWM(hwmResponse); //remove it from the handsontable
                                                }, function (errorResponse) {
                                                    $scope.HWMfileIsUploading = false;
                                                    $scope.showProgressBar = false;
                                                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file: " + errorResponse.headers(["usgswim-messages"]));
                                                    else toastr.error("Error creating file: " + errorResponse.statusText);
                                                });
                                            }//end else (filetype_id does == 8)                                        
                                        }, function (sourceError) {
                                            $scope.showLoading = 'false'; // loading..
                                            toastr.options.timeOut = "0";
                                            toastr.options.closeButton = true;
                                            $scope.showProgressBar = false;
                                            if (sourceError.headers(["usgswim-messages"]) !== undefined) toastr.error("Error uploading approval File Source: " + sourceError.headers(["usgswim-messages"]));
                                            else toastr.error("Error uploading approval File Source: " + sourceError.statusText);
                                        });
                                    }, function (approveError) {
                                        $scope.showLoading = 'false'; // loading..
                                        toastr.options.timeOut = "0";
                                        toastr.options.closeButton = true;
                                        $scope.showProgressBar = false;
                                        if (approveError.headers(["usgswim-messages"]) !== undefined) toastr.error("Error approving hwm: " + approveError.headers(["usgswim-messages"]));
                                        else toastr.error("Error approving hwm: " + approveError.statusText);
                                    });//end approve hwm
                                }, function (hwmSaveError) {
                                    $scope.showLoading = 'false'; // loading..
                                    toastr.options.timeOut = "0";
                                    toastr.options.closeButton = true;
                                    $scope.showProgressBar = false;
                                    if (hwmSaveError.headers(["usgswim-messages"]) !== undefined) toastr.error("Error uploading hwm: " + hwmSaveError.headers(["usgswim-messages"]));
                                    else toastr.error("Error uploading hwm: " + hwmSaveError.statusText);
                                });
                            }, function (getSitePeakError) {
                                $scope.showProgressBar = false;
                                if (getSitePeakError.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting site peak: " + getSitePeakError.headers(["usgswim-messages"]));
                                else toastr.error("Error getting site peak: " + getSitePeakError.statusText);
                            });
                        }, function (getHwmSiteError) {
                            $scope.showLoading = 'false'; // loading..
                            toastr.options.timeOut = "0";
                            toastr.options.closeButton = true;
                            $scope.showProgressBar = false;
                            if (getHwmSiteError.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting site info (" + hwm.site_no + "): " + getHwmSiteError.headers(["usgswim-messages"]));
                            else toastr.error("Error getting site info (" + hwm.site_no + "): " + getHwmSiteError.statusText);
                        });
                    });
                    // $scope.showProgressBar = false;
                };

                //reset back 
                $scope.clearTable = function () {
                    var resetModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title"></h3></div>' +
                        '<div class="modal-body"><p>Warning! This will remove all hwms from the table.</p></div>' +
                        '<div class="modal-footer"><button class="btn btn-primary" ng-click="ok()">OK</button><button class="btn btn-primary" ng-click="cancel()">Cancel</button></div>',
                        backdrop: 'static',
                        keyboard: false,
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                            $scope.cancel = function () {
                                $uibModalInstance.dismiss();
                            };
                        }],
                        size: 'sm'
                    });
                    resetModal.result.then(function () {
                        $scope.uploadHWMs = [];
                        $scope.invalids = [];
                        $scope.notValid = true;
                    });
                };

                // change sorting order
                $scope.sort_by = function (newSortingOrder) {
                    if ($scope.sortingOrder == newSortingOrder) {
                        $scope.reverse = !$scope.reverse;
                    }
                    $scope.sortingOrder = newSortingOrder;
                    // icon setup
                    $('th i').each(function () {
                        // icon reset
                        $(this).removeClass().addClass('glyphicon glyphicon-sort');
                    });
                    if ($scope.reverse) {
                        $('th.' + newSortingOrder + ' i').removeClass().addClass('glyphicon glyphicon-chevron-up');
                    } else {
                        $('th.' + newSortingOrder + ' i').removeClass().addClass('glyphicon glyphicon-chevron-down');
                    }
                };

                //#region successfully Uploaded Table stuff ----------------------------------------------------------------------------------------------------------------

                //they clicked the site no in the finished table 
                $scope.goToSiteDash = function (siteID) {
                    //show warning modal
                    var warningModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Warning!</h3></div>' +
                        '<div class="modal-body"><p>You are about to leave the Bulk HWM Uploader.<br />In doing so, you will no longer be able to see the list of successfully uploaded HWMs.</p><p>Are you sure you want to leave this page?</p></div>' +
                        '<div class="modal-footer"><button class="btn btn-warning" ng-enter="ok()" ng-click="ok()">Yes</button><button class="btn btn-primary" ng-enter="cancel()" ng-click="cancel()">Cancel</button></div>',
                        backdrop: 'static',
                        keyboard: false,
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.cancel = function () {
                                $uibModalInstance.dismiss();
                            };
                            $scope.ok = function () {
                                $uibModalInstance.close(siteID);
                            };
                        }],
                        size: 'sm'
                    });
                    warningModal.result.then(function (siteId) {
                        $state.go('site.dashboard', { id: siteId });
                    });
                };
                //delete this hwm and remove from done table
                $scope.DeleteHWM = function (hwm) {
                    $scope.delIndex = $scope.postedHWMs.indexOf(hwm);
                    //TODO:: Delete the files for this hwm too or reassign to the Site?? Services or client handling?
                    var DeleteModalInstance = $uibModal.open({
                        templateUrl: 'removemodal.html',
                        controller: 'ConfirmModalCtrl',
                        size: 'sm',
                        resolve: {
                            nameToRemove: function () {
                                return hwm;
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
                            toastr.success("HWM Removed");
                            $scope.postedHWMs.splice($scope.delIndex, 1);
                            $scope.delIndex = -1;
                        }, function (errorResponse) {
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error deleting hwm: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error deleting hwm: " + errorResponse.statusText);
                        });
                    });//end modal
                }; //end DeleteHWM                

                //want to edit hwm or add files to it
                $scope.OpenHWMEdit = function (HWMclicked) {
                    var passAllLists = [hwmTypeList, hwmQualList, horizDatumList, horCollMethList, vertDatumList, vertCollMethList, markerList, eventList];
                    var indexClicked = $scope.postedHWMs.indexOf(HWMclicked);
                    var siteNo = HWMclicked.site_no;
                    $rootScope.stateIsLoading.showLoading = true; // loading..
                    //modal
                    var hwmEditInstance = $uibModal.open({
                        templateUrl: 'HWM_Modal.html',
                        size: 'sm',
                        backdrop: 'static',
                        keyboard: false,
                        resolve: {
                            allDropdowns: function () {
                                return passAllLists;
                            },
                            thisHWM: function () {
                                return HWMclicked;
                            },
                            siteHMWs: function () {
                                return HWM.getEventSiteHWMs({ siteId: HWMclicked.site_id, Event: HWMclicked.event_id }).$promise;
                            },
                            hwmSite: function () {
                                return SITE.query({ id: HWMclicked.site_id }).$promise;
                            },
                            agencyList: function () {
                                return agenciesList;
                            },
                            allMembers: function () {
                                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                                $http.defaults.headers.common.Accept = 'application/json';
                                return MEMBER.getAll().$promise;
                            },
                            fileTypes: function () {
                                return fileTypesList;
                            }
                        },
                        controller: 'hwmEditModalCtrl'//end modal controller
                    });
                    hwmEditInstance.result.then(function (hwmUpdatedANDFileCnt) {
                        var h = hwmUpdatedANDFileCnt[0];
                        var files = hwmUpdatedANDFileCnt[1];
                        h.site_no = siteNo; //add back the sit_no
                        //add files count
                        h.HWMFiles = files;
                        //fix stillwater
                        if (h.stillwater !== undefined) {
                            h.stillwater = h.stillwater > 0 ? "Yes" : "No";
                        } else h.stillwater = "";
                        //update list
                        $scope.postedHWMs[indexClicked] = h;
                    });
                };
                //#endregion successfully Uploaded Table stuff -------------------------------------------------------------------------------------------------------------

                //#region HWM PEAK "add/edit" clicked ------------------------------------------------------------------------------------------
                $scope.OpenPeakEdit = function (peakId, siteId, eventId) {
                    $rootScope.stateIsLoading.showLoading = true; // loading..
                    //modal
                    var peakEditInstance = $uibModal.open({
                        templateUrl: 'PeakEdit_Modal.html',
                        size: 'sm',
                        backdrop: 'static',
                        keyboard: false,
                        resolve: {
                            allCollectConditions: function () {
                                return INST_COLL_CONDITION.getAll().$promise;
                            },
                            allVertDatums: function () {
                                return vertDatumList;
                            },
                            thisPeak: function () {
                                return PEAK.query({ id: peakId }).$promise;
                            },
                            thisPeakDFs: function () {
                                return PEAK.getPeakSummaryDFs({ id: peakId }).$promise;
                            },
                            peakSite: function () {
                                return SITE.query({ id: siteId }).$promise;
                            },
                            allMembers: function () {
                                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                                $http.defaults.headers.common.Accept = 'application/json';
                                return MEMBER.getAll().$promise;
                            },
                            allEventHWMs: function () {
                                return HWM.getFilteredHWMs({ Event: $scope.chosenEvent, EventStatus: 0 }).$promise;
                            },
                            allSiteFiles: function () {
                                return SITE.getSiteFiles({ id: siteId });
                            },
                            allSiteSensors: function () {
                                return SITE.getSiteSensors({ id: siteId }).$promise;
                            }
                        },
                        controller: 'peakModalCtrl'
                    });
                    peakEditInstance.result.then(function (updated) {
                        //updated[0] will be the peak, updated[1] will be 'updated'
                    });
                };
                $scope.OpenPeakCreate = function (siteId, eventId) {
                    $rootScope.stateIsLoading.showLoading = true; // loading..
                    //modal
                    var peakCreateInstance = $uibModal.open({
                        templateUrl: 'PeakEdit_Modal.html',
                        size: 'sm',
                        backdrop: 'static',
                        keyboard: false,
                        resolve: {
                            allCollectConditions: function () {
                                return INST_COLL_CONDITION.getAll().$promise;
                            },
                            allVertDatums: function () {
                                return vertDatumList;
                            },
                            thisPeak: function () {
                                return "empty";
                            },
                            thisPeakDFs: function () {
                                return "empty";
                            },
                            peakSite: function () {
                                return SITE.query({ id: siteId }).$promise;
                            },
                            allMembers: function () {
                                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                                $http.defaults.headers.common.Accept = 'application/json';
                                return MEMBER.getAll().$promise;
                            },
                            allEventHWMs: function () {
                                return HWM.getFilteredHWMs({ Event: $scope.chosenEvent, EventStatus: 0 }).$promise;
                            },
                            allSiteFiles: function () {
                                return SITE.getSiteFiles({ id: siteId });
                            },
                            allSiteSensors: function () {
                                return SITE.getSiteSensors({ id: siteId }).$promise;
                            }
                        },
                        controller: 'peakModalCtrl'
                    });
                    peakCreateInstance.result.then(function (createdPk) {
                        //createdPk[0] will be the peak, createdPk[1] will be 'created'
                        //add this 'PeakSummary' [site_id, peak_summary_id] to each hwm in postedHWMs that have this siteId
                        angular.forEach($scope.postedHWMs, function (pHWM) {
                            if (pHWM.site_id == siteId) {
                                pHWM.PeakSummary = [siteId, createdPk[0].peak_summary_id];
                            }
                        })
                    });
                };
                //#endregion HWM PEAK "add/edit" clicked----------------------------------------------------------------------------------------
                //#region handsontable settings
                $scope.tableSettings = {
                    //colHeaders: true,
                    colHeaders: [
                        '<span title="Required">Waterbody *</span>',
                        '<span title="Identifying Label. If left blank, defaults to &quot;no_label&quot;">HWM Label</span>',
                        '<span title="Required">HWM Type *</span>',
                        "Marker",
                        '<span title="Required">HWM Environment *</span>',
                        "HWM Uncertainty (ft)",
                        '<span title="Required">HWM Quality *</span>',
                        "Bank",
                        "Loc. Description",
                        '<span title="Required">HWM Latitude *</span>',
                        '<span title="Required">HWM Longitude *</span>',
                        '<span title="Required">Horizontal Datum *</span>',
                        '<span title="Required">Horizontal Collect Method *</span>',
                        '<span title="Height above ground">HAG (ft)</span>',
                        '<span title="Required">Flag/Found Date *</span>',
                        "Survey Date",
                        "Surveyed Elev (ft)",
                        "Vertical Datum",
                        "Vertical Collect Method",
                        "Survey Uncertainty (ft)",
                        "Notes", "Tranquil/Stillwater",
                        '<span title="Site Number, Required"> Site No *</span>'
                    ],
                    rowHeaders: true,
                    minSpareRows: 10,
                    maxRows: 10,
                    afterInit: function () {
                        $scope.hotInstance = this;
                    },
                    columnSorting: false,
                    manualColumnResize: true,
                    manualRowResize: true,
                    wordWrap: false,
                    preventOverflow: 'horizontal',
                    viewportColumnRenderingOffsetNumber: 1,
                    colWidths: $scope.columnWidths,
                    //interesting-- could use this for hover text on invalids maybe
                    //afterOnCellMouseOver:function (event, coords, td) {
                    //    var test = 'hi';
                    //},
                    afterOnCellMouseDown: function (event, coords, td) {
                        //open modal for siteNo
                        //open multi-select modal for resources, media or frequencies
                        if (coords.col === 22 && event.realTarget.className == "htAutocompleteArrow") {
                            $scope.siteNoArrowClicked = true;
                            var passHWMvals = [];
                            passHWMvals.push($scope.hotInstance.getDataAtCell(coords.row, 0)); //waterbody
                            passHWMvals.push($scope.hotInstance.getDataAtCell(coords.row, 9)); //lat 
                            passHWMvals.push($scope.hotInstance.getDataAtCell(coords.row, 10)); //long  
                            passHWMvals.push($scope.hotInstance.getDataAtCell(coords.row, 11)); //hdatum  
                            passHWMvals.push($scope.hotInstance.getDataAtCell(coords.row, 12)); //hcollectmethd 

                            getFindSiteModal(coords.row, coords.col, passHWMvals);
                        }
                    },
                    contextMenu: ['remove_row'],

                    onAfterValidate: function (isValid, value, row, prop, source) {
                        if (!isValid)
                            $scope.invalids.push({ "isValid": isValid, "row": row, "prop": prop });
                        if (isValid) {
                            var vIndex = -1;
                            for (var vI = 0; vI < $scope.invalids.length; vI++) {
                                if ($scope.invalids[vI].row == row && $scope.invalids[vI].prop == prop) {
                                    vIndex = vI;
                                    break;
                                }
                            }
                            if (vIndex > -1)
                                $scope.invalids.splice(vIndex, 1);
                        }
                    },
                    onAfterChange: function (change, source) {
                        //source can be 'loadData' (first time), 'edit' (one cell at a time), 'paste' (bunch at a time)
                        //change is an array containing arrays for each column affected: [0] = row, [1] = dataName, [2] = value it was, [3] = value it is         
                        if (source != 'loadData') {
                            for (var i = 0; i < change.length; i++) {
                                //only care if it was actually changed -- make them validate again
                                if (change[i][2] !== change[i][3] && $scope.notValid === false) $scope.notValid = true;
                            }//end foreach change
                        }
                    },
                    onAfterRemoveRow: function (index, amount) {
                        //if any $scope.invalids[i].row == index then splice it out
                        var selected = $scope.hotInstance.getSelected(); //[startRow, startCol, endRow, endCol]
                        if (amount > 1) {
                            //more than 1 row being deleted. 
                            var eachRowIndexArray = []; //holder for array index to loop thru for splicing invalids
                            var cnt = (selected[2] - selected[0] + 1); //gives me count of selected rows
                            eachRowIndexArray.push(selected[0]);
                            for (var c = 1; c < cnt; c++)
                                eachRowIndexArray.push(selected[0] + 1);
                            //loop thru invalids to see if any are in the deleting rows
                            for (var Mi = $scope.invalids.length; Mi--;) {
                                if (eachRowIndexArray.indexOf($scope.invalids[Mi].row) > -1)
                                    $scope.invalids.splice(Mi, 1);
                            }
                        } else {
                            //just 1 row selected
                            for (var i = $scope.invalids.length; i--;) {
                                if ($scope.invalids[i].row == index)
                                    $scope.invalids.splice(i, 1);
                            }
                        }
                    }
                };
                //#endregion handsontable settings
            }//end authorized
        }]);

    //controller for the hwm site No modal that comes up when clicking the dropdown arrow in the site no cell in the handsontable
    STNControllers.controller('hwmSiteModalCtrl', ['$scope', '$rootScope', '$http', '$cookies', '$uibModalInstance', 'nearBySites', 'HWMparts', 'siteNoAlreadyThere', 'hdatums', 'hcolMeths', 'vdatums', 'vcolMeths', 'states', 'counties', 'leafletData', 'leafletMarkerEvents', 'GEOCODE', 'SITE',
        function ($scope, $rootScope, $http, $cookies, $uibModalInstance, nearBySites, HWMparts, siteNoAlreadyThere, hdatums, hcolMeths, vdatums, vcolMeths, states, counties, leafletData, leafletMarkerEvents, GEOCODE, SITE) {
            $scope.localSites = nearBySites;
            $scope.horDatums = hdatums;
            $scope.horCollMeths = hcolMeths;
            $scope.vertDatums = vdatums;
            $scope.vertCollMeths = vcolMeths;
            $scope.states = states;
            $scope.counties = counties;
            $scope.showSiteCreateArea = false; //create new site checkbox click toggle show/hide 
            $scope.disableOK = false;
            $scope.createChecked = "0"; // default is unchecked on create new site
            $scope.showMap = false; //show map toggle (only shows if there are sites in the localSites list
            $scope.showHideMap = "Show";
            // show/hide create site area
            $scope.showHideCreateSiteDiv = function () {
                $scope.showSiteCreateArea = !$scope.showSiteCreateArea;
                //unselect all radio buttons (if existing nearby sites)
                angular.forEach($scope.localSites, function (s) {
                    delete s.selected;
                });
                //remove/show OK button from bottom of modal
                if ($scope.showSiteCreateArea) {
                    $scope.disableOK = true;
                    $scope.showMap = false; $scope.showHideMap = $scope.showHideMap == "Show" ? "Hide" : "Show";
                    //populate newSite with hwm parts if present  0:waterbody, 1:lat, 2:long, 3:hdatum, 4:hcollectmethd
                    $scope.newSite.waterbody = HWMparts[0] !== "" && HWMparts[0] !== null ? HWMparts[0] : "";
                    $scope.newSite.latitude_dd = HWMparts[1] !== "" && HWMparts[1] !== null ? HWMparts[1] : "";
                    $scope.newSite.longitude_dd = HWMparts[2] !== "" && HWMparts[2] !== null ? HWMparts[2] : "";
                    $scope.newSite.hdatum_id = HWMparts[3] !== "" && HWMparts[3] !== null ? $scope.horDatums.filter(function (hd) { return hd.datum_name == HWMparts[3]; })[0].datum_id : "";
                    $scope.newSite.hcollect_method_id = HWMparts[4] !== "" && HWMparts[4] !== null ? $scope.horCollMeths.filter(function (hd) { return hd.hcollect_method == HWMparts[4]; })[0].hcollect_method_id : "";

                    //getAddress with lat/long
                    $scope.getAddress();
                }
                else $scope.disableOK = false;
                //make all markers (if any) default blue (unselected)
                angular.forEach($scope.markers, function (mm) { if (mm.layer == 'stnSites') mm.icon = icons.stn; });
            };
            //if they check a radio button (chose a site) make sure the checkbox for new site is unchecked.
            $scope.unchkCreate = function (checkedSite) {
                $scope.createChecked = "0";
                $scope.showSiteCreateArea = false;
                //change icon color of that marker in map
                angular.forEach($scope.markers, function (m) {
                    if (m.layer == 'stnSites') {
                        if (m.lat == checkedSite.latitude_dd && m.lng == checkedSite.longitude_dd) {
                            delete m.icon;
                            m.icon = icons.selectedStn;
                        }
                        else m.icon = icons.stn;
                    }
                });

                $scope.disableOK = false;
            };
            // show/hide the map 
            $scope.showSitesOnMap = function () {
                $scope.showMap = !$scope.showMap;
                $scope.showHideMap = $scope.showHideMap == "Show" ? "Hide" : "Show";
                if ($scope.showMap) fitMapBounds();
            };

            //map stuff
            $scope.markers = [];

            var icons = {
                stn: {
                    type: 'div',
                    iconSize: [10, 10],
                    className: 'stnSiteIcon'
                },
                selectedStn: {
                    type: 'div',
                    iconSize: [14, 14],
                    className: 'newSiteIcon'
                },
                hwmIcon: {
                    type: 'div',
                    iconSize: [16, 20],
                    className: 'stnHWMIcon'
                }
            };

            //push each localSite into the markers array
            for (var i = 0; i < $scope.localSites.length; i++) {
                var a = $scope.localSites[i];
                $scope.markers.push({
                    layer: 'stnSites',
                    message: '<div><b>Site Number:</b> ' + a.site_no + '<br />' +
                    '<b>Site Name:</b> ' + a.site_name + '<br />' +
                    '<b>Waterbody:</b> ' + a.waterbody + '<br />' +
                    '<b>Latitude/Longitude:</b> ' + a.latitude_dd + ' ' + a.longitude_dd + '<br /></div>',
                    lat: a.latitude_dd,
                    lng: a.longitude_dd,
                    site_id: a.site_id,
                    title: a.site_no,
                    icon: icons.stn
                });
            }
            //push the hwm into the markers
            $scope.markers.push({
                layer: 'stnHWM',
                message: '<div><b>HWM</b><br/>' +
                '<b>Latitude:</b> ' + HWMparts[1] + '<br/>' +
                '<b>Lontitude:</b> ' + HWMparts[2] + '<br/></div>',
                lat: Number(HWMparts[1]),
                lng: Number(HWMparts[2]),
                title: 'HWM',
                icon: icons.hwmIcon
            });
            //get bounds based on lat long of 2 points
            var bounds = [];
            angular.forEach($scope.localSites, function (s) {
                bounds.push([s.latitude_dd, s.longitude_dd]);
            });
            var fitMapBounds = function () {
                leafletData.getMap("associatedSiteMap").then(function (map) {
                    map.fitBounds(bounds, { padding: [20, 20] });
                });
            };
            fitMapBounds();
            angular.extend($scope, {
                markers: $scope.markers,
                layers: {
                    baselayers: {
                        topo: {
                            name: "World Topographic",
                            type: "agsBase",
                            layer: "Topographic",
                            visible: false
                        }
                    },
                    overlays: {
                        stnSites: {
                            type: 'group',
                            name: 'STN Sites',
                            visible: true
                        },
                        stnHWM: {
                            type: 'group',
                            name: 'HWM',
                            visible: true
                        }
                    }
                }
            });//end angular $scope.extend statement
            //end map part

            //if there's already been a site_no added to this row, get it from the localSites and select it
            if (siteNoAlreadyThere !== "" && siteNoAlreadyThere !== null) {
                angular.forEach($scope.localSites, function (s) {
                    if (s.site_no == siteNoAlreadyThere) {
                        s.selected = 'true';
                        var selectedMarker = $scope.markers.filter(function (m) { return m.lat == s.latitude_dd && m.lng == s.longitude_dd; })[0];
                        selectedMarker.icon = icons.selectedStn;
                    }
                });
            }

            //new site create section
            $scope.newSite = {};

            //lat error modal 
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
                    if (w == 'latlong') $("#SITE_latitude_dd").focus();
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
                    if (w == 'latlong') $("#SITE_longitude_dd").focus();
                    else $("#LoDeg").focus();
                });
            };
            //make sure lat/long are right number range
            $scope.checkValue = function (direction) {
                if (direction == 'lat') {
                    if ($scope.newSite.latitude_dd < 0 || $scope.newSite.latitude_dd > 73 || isNaN($scope.newSite.latitude_dd)) {
                        openLatModal('latlong');
                        //if not a number, clear the imputs to trigger the validation
                        if (isNaN($scope.newSite.latitude_dd))
                            $scope.newSite.latitude_dd = undefined;
                    }
                }
                if (direction == 'long') {
                    if ($scope.newSite.longitude_dd < -175 || $scope.newSite.longitude_dd > -60 || isNaN($scope.newSite.longitude_dd)) {
                        openLongModal('latlong');
                        //if not a number, clear the imputs to trigger the validation
                        if (isNaN($scope.newSite.longitude_dd))
                            $scope.newSite.longitude_dd = undefined;
                    }
                }
            };

            //when SITE.state changes, update county list
            $scope.updateCountyList = function (s) {
                var thisState = $scope.states.filter(function (st) { return st.state_abbrev == s; })[0];
                $scope.stateCountyList = $scope.counties.filter(function (c) { return c.state_id == thisState.state_id; });
            };//end updateCountyList() for Site

            //get address parts and existing sites 
            $scope.getAddress = function () {
                //clear them all first
                delete $scope.newSite.address; delete $scope.newSite.city; delete $scope.newSite.state;
                $scope.stateCountyList = []; delete $scope.newSite.zip;

                if ($scope.newSite.latitude_dd !== undefined && $scope.newSite.longitude_dd !== undefined && !isNaN($scope.newSite.latitude_dd) && !isNaN($scope.newSite.longitude_dd)) {
                    $rootScope.stateIsLoading.showLoading = true; //loading...
                    delete $http.defaults.headers.common.Authorization;
                    $http.defaults.headers.common.Accept = 'application/json';
                    GEOCODE.getAddressParts({ Longitude: $scope.newSite.longitude_dd, Latitude: $scope.newSite.latitude_dd }, function success(response) {
                        if (response.result !== undefined) {
                            if (response.result.geographies.Counties.length > 0) {
                                var stateFIPS = response.result.geographies.Counties[0].STATE;
                                var countyName = response.result.geographies.Counties[0].NAME;
                                var thisStateID = $scope.counties.filter(function (c) { return c.state_fip == stateFIPS; })[0].state_id;
                                var thisState = $scope.states.filter(function (s) { return s.state_id == thisStateID; })[0];

                                if (thisState !== undefined) {
                                    $scope.newSite.state = thisState.state_abbrev;
                                    $scope.stateCountyList = $scope.counties.filter(function (c) { return c.state_id == thisState.state_id; });
                                    $scope.newSite.county = countyName;
                                    $rootScope.stateIsLoading.showLoading = false;// loading..                                   
                                } else {
                                    $rootScope.stateIsLoading.showLoading = false;// loading..
                                    toastr.error("The Latitude/Longitude did not return a recognized state. Please choose one from the dropdown.");
                                }
                            } else {
                                $rootScope.stateIsLoading.showLoading = false;// loading..
                                toastr.error("No location information came back from that lat/long");
                            }
                        } else {
                            $rootScope.stateIsLoading.showLoading = false;// loading..
                            toastr.error("Error getting address. Choose State and County from dropdowns.");
                        }
                    }, function error(errorResponse) {
                        $rootScope.stateIsLoading.showLoading = false;// loading..
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting address: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error getting address: " + errorResponse.statusText);
                    });
                } else {
                    //they did not type a lat/long first...
                    $rootScope.stateIsLoading.showLoading = false;// loading..
                    var emptyLatLongModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                        '<div class="modal-body"><p>Please provide a Latitude and Longitude before clicking Verify Location</p></div>' +
                        '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                }
            };//end getAddress()

            //they created a new site, post it and use pass the site_no back to the handsontable row
            $scope.createNewSite = function (valid) {
                if (valid) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //post the site
                    $scope.newSite.member_id = $scope.$parent.userID;
                    SITE.save($scope.newSite, function success(response) {
                        //send it back to handsontable row
                        $uibModalInstance.close(response);
                    }, function error(errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating site: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error creating site: " + errorResponse.statusText);
                    });
                }
            };
            //end create new site section

            $scope.ok = function () {
                //send the selected one back so site_no shows
                var selectedSite = nearBySites.filter(function (s) { return s.selected == "true"; })[0];
                $uibModalInstance.close(selectedSite);
            };
            $scope.cancel = function () {
                $uibModalInstance.dismiss();
            };
        }]);//end Modal controller

    STNControllers.controller('hwmEditModalCtrl', ['$scope', '$rootScope', '$http', '$cookies', '$uibModal', '$uibModalInstance', 'allDropdowns', 'thisHWM', 'siteHMWs', 'agencyList', 'allMembers', 'fileTypes', 'hwmSite',
        'SERVER_URL', 'HWM', 'FILE', 'SOURCE', 'FILE_STAMP',
        function ($scope, $rootScope, $http, $cookies, $uibModal, $uibModalInstance, allDropdowns, thisHWM, siteHMWs, agencyList, allMembers, fileTypes, hwmSite, SERVER_URL, HWM, FILE, SOURCE, FILE_STAMP) {
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
            $scope.thisHWMsite = hwmSite;
            $scope.fileTypeList = fileTypes.filter(function (hft) {
                //Photo (1), Historic (3), Field Sheets (4), Level Notes (5), Other (7), Link (8), Sketch (10)
                return hft.filetype === 'Photo' || hft.filetype === 'Historic Citation' || hft.filetype === 'Field Sheets' || hft.filetype === 'Level Notes' ||
                    hft.filetype === 'Other' || hft.filetype === 'Link' || hft.filetype === 'Sketch';
            });


            $scope.hwmImageFiles = [];
            $scope.showFileForm = false; //hidden form to add file to hwm
            $scope.userRole = $cookies.get('usersRole');
            $scope.showEventDD = false; //toggle to show/hide event dd (admin only)
            $scope.adminChanged = {}; //will hold event_id if admin changes it. apply when PUTting
            $scope.serverURL = SERVER_URL; //constant with stntest.wim.usgs.gov/STNServices2 
            //button click to show event dropdown to change it on existing hwm (admin only)
            $scope.showChangeEventDD = function () {
                $scope.showEventDD = !$scope.showEventDD;
            };

            $scope.LoggedInMember = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];

            $scope.aHWM = {};
            $scope.HWMFiles = [];
            //Datepicker
            $scope.datepickrs = {};
            $scope.open = function ($event, which) {
                $event.preventDefault();
                $event.stopPropagation();

                $scope.datepickrs[which] = true;
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
            $scope.checkValue = function () {
                //check the latitude/longitude
                var h = $scope.view.HWMval == 'edit' ? $scope.hwmCopy : $scope.aHWM;
                if (h.latitude_dd < 0 || h.latitude_dd > 73 || isNaN(h.latitude_dd)) {
                    openLatModal('latlong');
                    //if not a number, clear the imputs to trigger the validation
                    if (isNaN(h.latitude_dd))
                        h.latitude_dd = undefined;
                }
                if (h.longitude_dd < -175 || h.longitude_dd > -60 || isNaN(h.longitude_dd)) {
                    openLongModal('latlong');
                    //if not a number, clear the imputs to trigger the validation
                    if (isNaN(h.longitude_dd))
                        h.longitude_dd = undefined;
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
            //hwm_uncertainty typed in, choose cooresponding hwm_environment
            $scope.chooseQuality = function () {
                var h = $scope.view.HWMval == 'edit' ? $scope.hwmCopy : $scope.aHWM;
                if (h.hwm_uncertainty !== "") {
                    var x = Number(h.hwm_uncertainty);
                    if (x > 0.4) h.hwm_quality_id = 5;
                    else if (x < 0.05) h.hwm_quality_id = 1;
                    else {
                        h.hwm_quality_id = $scope.hwmQualList.filter(function (h) { return h.min_range <= x && h.max_range >= x; })[0].hwm_quality_id;
                    }
                }
            };
            //hwm quality chosen (or it changed from above), check to make sure it is congruent with input above
            $scope.compareToUncertainty = function () {
                var h = $scope.view.HWMval == 'edit' ? $scope.hwmCopy : $scope.aHWM;
                if (h.hwm_uncertainty !== "" && h.hwm_uncertainty !== undefined) {
                    var x = Number(h.hwm_uncertainty);
                    var matchingQualId = $scope.hwmQualList.filter(function (h) {
                        if (h.min_range !== undefined)
                            return h.min_range <= x && h.max_range >= x;
                    })[0].hwm_quality_id;
                    if (h.hwm_quality_id !== matchingQualId) {
                        //show warning modal and focus in uncertainty
                        var incongruentModal = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Warning</h3></div>' +
                            '<div class="modal-body"><p>There is a mismatch between the hwm quality chosen and the hwm uncertainty above. Please correct your hwm uncertainty.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                $scope.ok = function () {
                                    $uibModalInstance.close();
                                };
                            }],
                            size: 'sm'
                        });
                        incongruentModal.result.then(function () {
                            angular.element("[name='hwm_uncertainty']").focus();
                        });
                    }
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


            $scope.aHWM = angular.copy(thisHWM);
            delete $scope.aHWM.site_no; //remove this so that it's the true object for PUT
            if ($scope.aHWM.HWMFiles)
                for (var f = 0; f < $scope.aHWM.HWMFiles.length; f++)
                    $scope.HWMFiles.push($scope.aHWM.HWMFiles[f]);
            delete $scope.aHWM.HWMFiles;

            $scope.aHWM.flag_date = makeAdate($scope.aHWM.flag_date);
            //if this is surveyed, date format and get survey member's name
            if ($scope.aHWM.survey_date !== null && $scope.aHWM.survey_date !== undefined)
                $scope.aHWM.survey_date = makeAdate($scope.aHWM.survey_date);

            //save aHWM
            $scope.save = function (valid) {
                if (valid) {
                    var updatedHWM = {};
                    if ($scope.adminChanged.event_id !== undefined) {
                        //admin changed the event for this hwm..
                        $scope.hwmCopy.event_id = $scope.adminChanged.event_id;
                    }
                    //if they added a survey date, apply survey member as logged in member
                    if ($scope.hwmCopy.survey_date !== undefined && $scope.hwmCopy.survey_date !== null && $scope.hwmCopy.survey_member_id === undefined)
                        $scope.hwmCopy.survey_member_id = $cookies.get('mID');

                    //fix stillwater before put
                    //if ($scope.hwmCopy.stillwater == "1") $scope.hwmCopy.stillwater = "Yes";
                    //else if ($scope.hwmCopy.stillwater == "0") $scope.hwmCopy.stillwater = "No";
                    //else $scope.hwmCopy.stillwater = null;

                    if ($scope.hwmCopy.elev_ft !== undefined && $scope.hwmCopy.elev_ft !== null) {
                        //make sure they added the survey date if they added an elevation
                        if ($scope.hwmCopy.survey_date === undefined)
                            $scope.hwmCopy.survey_date = makeAdate("");

                        if ($scope.hwmCopy.survey_member_id === undefined)
                            $scope.hwmCopy.survey_member_id = $cookies.get('mID');
                    }

                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //var cleanHWM = formatHWM($scope.hwmCopy);
                    HWM.update({ id: $scope.hwmCopy.hwm_id }, $scope.hwmCopy).$promise.then(function (response) {
                        toastr.success("HWM updated");
                        $scope.aHWM = response; thisHWM = response;
                        //get all the names for details view
                        // $scope.aHWM.hwm_type = $scope.hwmTypeList.filter(function (ht) { return ht.hwm_type_id == $scope.aHWM.hwm_type_id; })[0].hwm_type;
                        if ($scope.aHWM.stillwater !== undefined)
                            $scope.aHWM.Tranquil = $scope.aHWM.stillwater > 0 ? 'Yes' : 'No';

                        $scope.aHWM.flag_date = makeAdate($scope.aHWM.flag_date);

                        //if this is surveyed, date format and get survey member's name
                        if ($scope.aHWM.survey_date !== null && $scope.aHWM.survey_date !== undefined)
                            $scope.aHWM.survey_date = makeAdate($scope.aHWM.survey_date);

                        $scope.hwmCopy = {};
                        $scope.view.HWMval = 'detail';
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving hwm: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error saving hwm: " + errorResponse.statusText);
                    });
                }
            };//end save()

            //cancel
            $scope.cancel = function () {
                $rootScope.stateIsLoading.showLoading = false; // loading.. 
                var sendBack = [$scope.aHWM, $scope.HWMFiles];
                $uibModalInstance.close(sendBack);
            };

            //edit button clicked. make copy of hwm 
            $scope.wannaEditHWM = function () {
                $scope.view.HWMval = 'edit';
                $scope.hwmCopy = angular.copy($scope.aHWM);
                $scope.adminChanged.event_id = $scope.aHWM.event_id;
            };
            $scope.cancelHWMEdit = function () {
                $scope.view.HWMval = 'detail';
                $scope.hwmCopy = [];
                $scope.adminChanged = {};
                $scope.EventName = $scope.eventList.filter(function (e) { return e.event_id == $scope.aHWM.event_id; })[0].event_name;
            };
            $scope.ensurehwmLabelUnique = function () {
                var h = $scope.view.HWMval == 'edit' ? $scope.hwmCopy : $scope.aHWM;
                angular.forEach(siteHMWs, function (hwm) {
                    if (hwm.hwm_label == h.hwm_label) {
                        //not unique, clear it and show warning
                        h.hwm_label = h.hwm_id !== undefined ? $scope.aHWM.hwm_label : 'hwm-' + (parseFloat(siteHMWs.length) + 1);
                        var uniqueModal = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Warning</h3></div>' +
                            '<div class="modal-body"><p>The hwm label must be unique from all other hwms at this site for this event.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                $scope.ok = function () {
                                    $uibModalInstance.close();
                                };
                            }],
                            size: 'sm'
                        });
                        uniqueModal.result.then(function () {
                            angular.element("[name='hwm_label']").focus();
                        });
                    }
                });
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
                        photo_date: $scope.aFile.photo_date
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
                    fresponse.fileBelongsTo = "HWM File";
                    $scope.HWMFiles.splice($scope.existFileIndex, 1);
                    $scope.HWMFiles.push(fresponse);
                    if (fresponse.filetype_id === 1) {
                        $scope.hwmImageFiles.splice($scope.existFileIndex, 1);
                        $scope.hwmImageFiles.push(fresponse);
                    }
                    //  $scope.allSFiles[$scope.allSFileIndex] = fresponse;
                    //  Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                    //  $scope.sFileIsUploading = false;
                    $scope.fileItemExists = true;
                }, function (errorResponse) {
                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file: " + errorResponse.headers(["usgswim-messages"]));
                    else toastr.error("Error creating file: " + errorResponse.statusText);
                });
            };

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
                $scope.existFileIndex = -1; $scope.existIMGFileIndex = -1;  //indexes for splice/change
                $scope.aFile = {}; //holder for file
                $scope.aSource = {}; //holder for file source
                //HWM will not have datafile 
                if (file !== 0) {
                    //edit hwm file
                    $scope.existFileIndex = $scope.HWMFiles.indexOf(file);
                    $scope.existIMGFileIndex = $scope.hwmImageFiles.length > 0 ? $scope.hwmImageFiles.indexOf(file) : -1;
                    $scope.aFile = angular.copy(file);
                    if (file.filetype_id !== 8) {
                        FILE.getFileItem({ id: $scope.aFile.file_id }).$promise.then(function (response) {
                            $scope.fileItemExists = response.Length > 0 ? true : false;
                        }, function (errorResponse) {
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting file item: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error getting file item: " + errorResponse.statusText);
                        });
                    }
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
                    if (file.source_id !== null) {
                        SOURCE.query({ id: file.source_id }).$promise.then(function (s) {
                            $scope.aSource = s;
                            $scope.aSource.FULLname = $scope.aSource.source_name;
                            $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
                        }, function (errorResponse) {
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting source: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error getting source: " + errorResponse.statusText);
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
                if ($scope.aFile.File !== undefined) {
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
                                    if (fresponse.filetype_id === 1) $scope.hwmImageFiles.push(fresponse);
                                    $scope.showFileForm = false; $scope.HWMfileIsUploading = false;
                                }, function (errorResponse) {
                                    $scope.HWMfileIsUploading = false;
                                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file: " + errorResponse.headers(["usgswim-messages"]));
                                    else toastr.error("Error creating file: " + errorResponse.statusText);
                                });
                            } else {
                                $scope.aFile.source_id = response.source_id; $scope.aFile.site_id = $scope.thisHWMsite.site_id; $scope.aFile.hwm_id = $scope.aHWM.hwm_id;
                                FILE.save($scope.aFile).$promise.then(function (fresponse) {
                                    toastr.success("Link saved");
                                    fresponse.fileBelongsTo = "HWM File";
                                    $scope.HWMFiles.push(fresponse);
                                    $scope.showFileForm = false; $scope.HWMfileIsUploading = false;
                                }, function (errorResponse) {
                                    $scope.HWMfileIsUploading = false;
                                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file: " + errorResponse.headers(["usgswim-messages"]));
                                    else toastr.error("Error creating file: " + errorResponse.statusText);
                                });
                            }//end else
                        }, function (errorResponse) {
                            $scope.HWMfileIsUploading = false;
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating source: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error creating source: " + errorResponse.statusText);
                        });//end source.save()              
                    }//end valid
                } else {
                    alert("Need to choose a file first");
                }
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
                        // post again (if no change, will return existing one. if edited, will create a new one --instead of editing all files that use this source)
                        var theSource = { source_name: $scope.aSource.FULLname, agency_id: $scope.aSource.agency_id };
                        SOURCE.save(theSource).$promise.then(function (sResponse) {
                            $scope.aFile.source_id = sResponse.source_id;
                            FILE.update({ id: $scope.aFile.file_id }, $scope.aFile).$promise.then(function (fileResponse) {
                                toastr.success("File Updated");
                                fileResponse.fileBelongsTo = "HWM File";
                                $scope.HWMFiles[$scope.existFileIndex] = fileResponse;
                                $scope.showFileForm = false; $scope.HWMfileIsUploading = false;
                            }, function (errorResponse) {
                                $scope.HWMfileIsUploading = false;
                                if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file: " + errorResponse.headers(["usgswim-messages"]));
                                else toastr.error("Error creating file: " + errorResponse.statusText);
                            });
                        }, function (errorResponse) {
                            $scope.HWMfileIsUploading = false; //Loading...
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
                        $scope.HWMFiles.splice($scope.existFileIndex, 1);
                        $scope.hwmImageFiles.splice($scope.existIMGFileIndex, 1);
                        $scope.showFileForm = false;
                    }, function (errorResponse) {
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
            $rootScope.stateIsLoading.showLoading = false; // loading..
        }]);
}());