(function () {
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('bulkHWMCtrl', ['$scope', '$state', '$rootScope', '$cookies', '$http', '$filter', '$uibModal', 'SITE', 'HWM', 'HWM_Service', 'eventList', 'stateList', 'countyList',
        'hwmTypeList', 'markerList', 'hwmQualList', 'horizDatumList', 'horCollMethList', 'vertDatumList', 'vertCollMethList',
        function ($scope, $state, $rootScope, $cookies, $http, $filter, $uibModal, SITE, HWM, HWM_Service, eventList, stateList, countyList,
            hwmTypeList, markerList, hwmQualList, horizDatumList, horCollMethList, vertDatumList, vertCollMethList) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                //global vars
                $scope.showLoading = false; //div holding loader         
                $scope.hotInstance;
                                 //siteno,water,type,mrker,envr,uncrt,qul,bank,des,lat,long,hdatum,hcm,hag,flgDt,surDt,elev,vdatum,vcm,sUnc,notes, tranq/still
                $scope.columnWidths = [120, 180, 180, 180, 150, 170, 180, 100, 200, 140, 150, 180, 220, 100, 130, 120, 130, 160, 190, 160, 200, 200];
                
                $scope.uploadHWMs = []; //data binding in the handsontable (they will paste in hwms
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

                $scope.states = stateList;
                $scope.countyList = countyList;
                $scope.countyArray = []; //holder of state counties (will change as they change state choice)
                $scope.UpdateCounties = function () {
                    if ($scope.HWM_params.state_abbrev !== null) {
                        var thisState = $scope.states.filter(function (st) { return st.state_abbrev == $scope.HWM_params.state_abbrev; })[0];
                        $scope.countyArray = $scope.countyList.filter(function (c) { return c.state_id == thisState.state_id; });
                    } else {
                        $scope.countyArray = [];
                    }
                };
                
                $scope.chosenEvent = 0;
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
                    var monthNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
                    var dateWOtime = monthNames[month] + "/" + day + "/" + year;
                    return dateWOtime;
                };//end makeAdate()
                                                
                //#region renderers/validators
                var requiredModal = function () {
                    var reqModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>This field is required.</p></div>' +
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
                };
               
                //make site_no a link
                //var siteNoRenderer = function (instance, td, row, col, prop, value, cellProperties) {
                //    Handsontable.renderers.TextRenderer.apply(this, arguments);              
                //    td.innerHTML = '<a ng-click="goToSite()">' + value + '</a>';                   
                //    td.style.background = '#F7F5F5';
                //    return td;
                //};
                $scope.requiredValidator = function (value, callback) {
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
                        requiredModal();
                        callback(false);
                    } else {
                        callback(true);
                    }
                    //if (!value) {
                    //    requiredModal();
                    //    callback(false);
                    //} else {
                    //    callback(true);
                    //}
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
                        var latModal = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>Latitude must be between 22.0 and 55.0 (NAD83 decimal degrees).</p></div>' +
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
                        callback(false);
                    } else if (!value && otherDataInRow) {
                        requiredModal();
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
                        var longModal = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>Longitude must be between -130.0 and -55.0 (NAD83 digital degrees).</p></div>' +
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
                        callback(false);
                    } else if (!value && otherDataInRow) {
                        requiredModal();
                        callback(false);
                    }
                    else {
                        callback(true);
                    }
                };
                $scope.numericValidator = function (value, callback) {
                    if (value !== "" && value !== null && (isNaN(parseInt(value)))) {
                        setTimeout(function () { $scope.hotInstance.deselectCell(); }, 100);
                        var numModal = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>Please enter a numeric value.</p></div>' +
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
                        callback(false);
                    } else {
                        callback(true);
                    }                    
                }
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
                    if (value !== "" && value !== null && otherDataInRow) {
                        var prop = this.prop; var hasError = false;
                        switch (prop) {
                            case 'hwm_type_id':
                                if (hwmTypeList.map(function (hwT) { return hwT.hwm_type; }).indexOf(value) < 0) {
                                    hasError = true;
                                }
                                break;
                            case 'hwm_environment':
                                if ($scope.envirArray.map(function (hwE) { return hwE; }).indexOf(value) < 0) {
                                    hasError = true;
                                }
                                break;
                            case 'hwm_quality_id':
                                if (hwmQualList.map(function (hwQ) { return hwQ.hwm_quality; }).indexOf(value) < 0) {
                                    hasError = true;
                                }
                                break;
                            case 'hdatum_id':
                                if (horizDatumList.map(function (hD) { return hD.datum_name; }).indexOf(value) < 0) {
                                    hasError = true;
                                }
                                break;
                            case 'hcollect_method_id':
                                if (horCollMethList.map(function (hC) { return hC.hcollect_method; }).indexOf(value) < 0) {
                                    hasError = true;
                                }
                                break;
                        }
                        //if this one isn't in the hwm-types, callback(false)
                        //if (hwmTypeList.map(function (hwT) { return hwT.hwm_type; }).indexOf(value) < 0) {
                        //    hasError = true; which = value;
                        //}
                        if (hasError) {                            
                            callback(false);
                        } else callback(true);

                    } else if (!value && otherDataInRow) {
                        requiredModal();
                        callback(false);
                    } else callback(true);
                }
                //#endregion

                //done posting, remove the successful ones from the handsontable
                var removeUploadHWMs = function (indices) {
                    //reverve order so they remove from top down
                    var removeI = indices.sort(function (a, b) { return a - b });
                    for (var i = removeI.length; i--;)
                        $scope.uploadHWMs.splice(removeI[i], 1);
                }

                //validate before allowing save 
                $scope.validateTable = function () {
                    $scope.showLoading = true; // loading..
                    var haveData = $scope.hotInstance.getDataAtCell(0, 1);
                    if (haveData !== null){                                    
                        $scope.hotInstance.validateCells(function (valid) {
                            if (valid) {
                                $scope.showLoading = false; // loading..
                                var validModal = $uibModal.open({
                                    template: '<div class="modal-header"><h3 class="modal-title">Valid</h3></div>' +
                                        '<div class="modal-body"><p>Good to go!</p></div>' +
                                        '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                    //   backdrop: 'static',
                                    //   keyboard: false,
                                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                        $scope.ok = function () {
                                            $uibModalInstance.dismiss();
                                        };
                                    }],
                                    size: 'sm'
                                });
                                $scope.notValid = false;
                            } else {
                                $scope.showLoading = false; // loading..
                                $scope.notValid = true;
                            }
                        });                       
                    } else {
                        $scope.showLoading = false; // loading..
                        var validModal = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>No data in table to validate</p></div>' +
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
                //save updates
                $scope.save = function () {
                    var pastedHWMs = angular.copy($scope.uploadHWMs);
                    // drop the last 20 since they are empty
                    for (var i = pastedHWMs.length; i--;) {
                        if (pastedHWMs[i].site_no === undefined) {
                            pastedHWMs.splice(i, 1);
                        }
                    }
                    var deleteIndexes = [];
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //no go thru each and get rest of fields needed and post hwms
                    angular.forEach(pastedHWMs, function (hwm, index) {
                        SITE.getSearchedSite({ bySiteNo: hwm.site_no }, function success(response) {
                            hwm.site_id = response.site_id;
                            hwm.event_id = $scope.chosenEvent;
                            hwm.flag_member_id = $scope.$parent.userID;
                            hwm.hcollect_method_id = horCollMethList.filter(function (hcm) { return hcm.hcollect_method == hwm.hcollect_method_id; })[0].hcollect_method_id;
                            hwm.hdatum_id = horizDatumList.filter(function (hd) { return hd.datum_name == hwm.hdatum_id; })[0].datum_id;
                            hwm.hwm_quality_id = hwmQualList.filter(function (hq) { return hq.hwm_quality == hwm.hwm_quality_id; })[0].hwm_quality_id;
                            hwm.hwm_type_id = hwmTypeList.filter(function (ht) { return ht.hwm_type == hwm.hwm_type_id; })[0].hwm_type_id;
                            hwm.marker_id = hwm.marker_id !== "" ? markerList.filter(function (m) { return m.marker1 == hwm.marker_id; })[0].marker_id: "0";
                            hwm.stillwater = hwm.stillwater == "No" || "" ? "0" : "1";
                            hwm.vcollect_method_id = hwm.vcollect_method_id !== "" ? vertCollMethList.filter(function (vcm) { return vcm.vcollect_method == hwm.vcollect_method_id; })[0].vcollect_method_id : "0";
                            hwm.vdatum_id = hwm.vdatum_id !== "" ? vertDatumList.filter(function (vd) { return vd.datum_abbreviation == hwm.vdatum_id; })[0].vdatum_id : "0";
                            if (hwm.survey_date !== "") hwm.survey_member_id = $scope.$parent.userID;
                            //now post it
                            delete hwm.site_no;
                            HWM.save(hwm).$promise.then(function (response) {
                                toastr.success("HWM uploaded")
                                deleteIndexes.push(index);
                                //when the lengths match we are done here.
                                if (deleteIndexes.length == pastedHWMs.length) {
                                    removeUploadHWMs(deleteIndexes);
                                }; 
                            }, function (errorResponse){
                                toastr.options.timeOut = "0";
                                toastr.options.closeButton = true;
                                toastr.error("Error uploading hwm: " + errorResponse.statusText);
                            }); //end post hwm
                        }, function error(errorResponse) {
                            toastr.options.timeOut = "0";
                            toastr.options.closeButton = true;
                            toastr.error("Error getting site information for" + hwm.site_no);
                        });
                    });
                    
                   //site_id, event_id, flag_member_id, survey_member_id (if survey_date)
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

                //#region handsontable settings
                $scope.tableSettings = {
                    rowHeaders: true,
                    minSpareRows: 20,
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
                    onBeforeChange: function (data) {
                        //for (var i = data.length - 1; i >= 0; i--) {
                        //    if ((data[i][1] == 'hwm_type_id' || data[i][1] == 'marker_id' || data[i][1] == 'hwm_environment') && data[i][3] !== "") // replace 0 by the number of the field to validate
                        //    {
                        //        switch (data[i][1]) {
                        //            case 'hwm_type_id':

                        //        }
                    //                setTimeout(function () { $scope.hotInstance.deselectCell(); }, 100);
                    //                var waterModal = $uibModal.open({
                    //                    template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                    //                        '<div class="modal-body"><p>Value must be a number.</p></div>' +
                    //                        '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                    //                    backdrop: 'static',
                    //                    keyboard: false,
                    //                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                    //                        $scope.ok = function () {
                    //                            $uibModalInstance.dismiss();
                    //                        };
                    //                    }],
                    //                    size: 'sm'
                    //                });
                    //            }
                    //        }
                    //    }                        
                    },
                    //afterOnCellMouseDown: function (event, coords, td) {
                    //    //open multi-select modal for resources, media or frequencies
                    //    if (coords.col == 2) {
                    //        var site_number = $scope.hotInstance.getDataAtCell(coords.row, coords.col);
                    //        var siteId = $scope.uploadHWMs.filter(function (h) { return h.site_no == site_number; })[0].site_id;
                    //        $state.go("site.dashboard", {id: siteId});
                    //    }
                    //},
                    onAfterValidate: function (isValid, value, row, prop, souce) {
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
                    }//,                    
                    //rowHeights: 50
                };
                //#endregion

            }//end authorized
        }]);
}());