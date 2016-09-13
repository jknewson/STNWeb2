(function () {
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('historicHWMCtrl', ['$scope', '$rootScope', '$cookies', '$location', '$http', '$filter', '$uibModal', 'SITE', 'HWM', 'OBJECTIVE_POINT', 'GEOCODE', 'thisEvent', 'HDatums', 'HCollectMeths', 'States', 'Counties', 'OPTypes', 'VDatums', 'HTypes', 'HWMQuals',
        function ($scope, $rootScope, $cookies, $location, $http, $filter, $uibModal, SITE, HWM, OBJECTIVE_POINT, GEOCODE, thisEvent, HDatums, HCollectMeths, States, Counties, OPTypes, VDatums, HTypes, HWMQuals) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                //global vars
                $scope.showLoading = false; //div holding loader and dynamic and max for progress bar
                $scope.dynamic = 0; $scope.max = 0;
                $scope.hotInstance;  //sd   lat long hd  hcm  wat  GS   st   co   opt  opn  des  vda  opd  hwmt env   qua  flag
                $scope.columnWidths = [140, 76, 84, 220, 220, 100, 150, 120, 120, 180, 120, 140, 140, 120, 140, 140, 140, 120];
                $scope.Changes = []; //track changes made to compare for saving
                $scope.invalids = []; //store when invalid thrown
                $scope.event = thisEvent;
                $scope.hDatumList = HDatums; $scope.hDatumArray = [];
                $scope.hCollectList = HCollectMeths; $scope.hcollectArray = [];
                $scope.stateList = States; //TODO Make this interactive with counties 
                $scope.stateArray = [];
                $scope.countyList = Counties; $scope.countyArray = [];
                $scope.opTypeList = OPTypes; $scope.opTypeArray = [];
                $scope.vDatumList = VDatums; $scope.vDatumArray = [];
                $scope.hwmTypeList = HTypes; $scope.hwmTypeArray = [];
                $scope.hwmEnvirList = ['Coastal', 'Riverine'];
                $scope.hwmQualityList = HWMQuals; $scope.hwmQualityArray = [];

                $scope.historicHWMs = [];

                //#region format dropdowns from object array to string array
                angular.forEach($scope.hDatumList, function (l) { $scope.hDatumArray.push(l.datum_name); });
                angular.forEach($scope.hCollectList, function (l) { $scope.hcollectArray.push(l.hcollect_method); });
                angular.forEach($scope.stateList, function (l) { $scope.stateArray.push(l.state_name); });
                angular.forEach($scope.countyList, function (l) { $scope.countyArray.push(l.county_name); });
                angular.forEach($scope.opTypeList, function (l) { $scope.opTypeArray.push(l.op_type); });
                angular.forEach($scope.vDatumList, function (l) { $scope.vDatumArray.push(l.datum_abbreviation); });
                angular.forEach($scope.hwmTypeList, function (l) { $scope.hwmTypeArray.push(l.hwm_type); });
                angular.forEach($scope.hwmQualityList, function (l) { $scope.hwmQualityArray.push(l.hwm_quality); });
                //#endregion

                //Get state county button clicked
                $scope.getStateCo = function (c, r) {
                    var rowValues = $scope.hotInstance.getDataAtRow(r);
                    if ((rowValues[1] !== "" && rowValues[1] !== null) && (rowValues[2] !== "" && rowValues[2] !== null)) {
                        $rootScope.stateIsLoading.showLoading = true; //loading...
                        $http.defaults.headers.common.Accept = 'application/json';
                        delete $http.defaults.headers.common.Authorization;
                        GEOCODE.getAddressParts({ Longitude: rowValues[2], Latitude: rowValues[1] }, function success(response) {
                            if (response.result.geographies.Counties.length > 0) {
                                var stateFIPS = response.result.geographies.Counties[0].STATE;
                                var countyName = response.result.geographies.Counties[0].NAME;
                                var thisStateID = $scope.countyList.filter(function (c) { return c.state_fip == stateFIPS; })[0].state_id;
                                var thisState = $scope.stateList.filter(function (s) { return s.state_id == thisStateID; })[0];

                                if (thisState !== undefined) {
                                    $scope.hotInstance.setDataAtCell(r, 7, thisState.state_name);
                                    var stateCountyList = $scope.countyList.filter(function (c) { return c.state_id == thisState.state_id; });
                                    $scope.countyArray = [];
                                    angular.forEach(stateCountyList, function (l) { $scope.countyArray.push(l.county_name); });
                                    $scope.hotInstance.setCellMeta(r, 8, "source", $scope.countyArray);
                                    $scope.hotInstance.setDataAtCell(r, 8, countyName);
                                    $rootScope.stateIsLoading.showLoading = false;// loading..                                    
                                } else {
                                    $rootScope.stateIsLoading.showLoading = false;// loading..
                                    toastr.error("The Latitude/Longitude did not return a recognized state. Please choose one from the dropdown.");
                                }
                            } else {
                                $rootScope.stateIsLoading.showLoading = false;// loading..
                                toastr.error("Error getting address location.");
                            }
                        }, function (errorResponse) {
                            $rootScope.stateIsLoading.showLoading = false;// loading..
                            toastr.error("Error: " + errorResponse.statusText);
                        });
                    } else {
                        //they did not type a lat/long first...
                        $rootScope.stateIsLoading.showLoading = false;// loading..
                        var emptyLatLongModal = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>Please provide a Latitude and Longitude before clicking Get State/County</p></div>' +
                                '<div class="modal-footer"><button type="button" class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                $scope.ok = function () {
                                    $uibModalInstance.close();
                                };
                            }],
                            size: 'sm'
                        });
                    }//end if row values are there                    
                }//end getStateCo()
                $scope.UpdateCounties = function (theChange) {
                    var thisState = $scope.stateList.filter(function (s) { return s.state_name == theChange[3]; })[0];
                    var stateCountyList = $scope.countyList.filter(function (c) { return c.state_id == thisState.state_id; });
                    $scope.countyArray = [];
                    angular.forEach(stateCountyList, function (l) { $scope.countyArray.push(l.county_name); });
                    $scope.hotInstance.setCellMeta(theChange[0], 8, "source", $scope.countyArray);
                };
                //#region renderers
                var requiredModal = function () {
                    var reqModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>This field is required.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        backdrop: 'static',
                        keyboard: false,
                        controller: function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.dismiss();
                            };
                        },
                        size: 'sm'
                    });
                };
                $scope.latValidator = function (value, callback) {
                    //number and > 0
                    if (value < 0 || isNaN(value)) {
                        var latModal = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>Latitude must be greater than 0.</p></div>' +
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
                    } else if (!value) {
                        requiredModal();
                        callback(false);
                    } else {
                        callback(true);
                    }
                };
                $scope.longValidator = function (value, callback) {
                    if (value > 0 || isNaN(value)) {
                        var longModal = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>Longitude must be less than 0.</p></div>' +
                                '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                            backdrop: 'static',
                            keyboard: false,
                            controller:['$scope', '$uibModalInstance',  function ($scope, $uibModalInstance) {
                                $scope.ok = function () {
                                    $uibModalInstance.dismiss();
                                };
                            }],
                            size: 'sm'
                        });
                        callback(false);
                    } else if (!value) {
                        requiredModal();
                        callback(false);
                    }
                    else {
                        callback(true);
                    }
                };
                var colorRenderer = function (instance, td, row, col, prop, value, cellProperties) {
                    var $button = $('<button type="button" class="btn bnt-primary"></button>');
                    $button.html('Get State/County');
                    $(td).empty().append($button); //empty is needed because you are rendering to an existing cell
                  //  td.style.background = '#EEE';
                   // td.innerHTML = 'Get State/County';
                    return td;
                };
                $scope.requiredValidator = function (value, callback) {
                    if (!value) {
                        requiredModal();
                        callback(false);
                    } else {
                        callback(true);
                    }
                };
                //#endregion
                
                //reset back 
                $scope.reset = function () {
                    var resetModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title"></h3></div>' +
                            '<div class="modal-body"><p>Are you sure you want to clear the table?</p></div>' +
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
                        $scope.historicHWMs = [];
                        $scope.invalids = [];
                    });
                };

                //#region handsontable settings
                $scope.tableSettings = {
                    colHeaders: true,
                    rowHeaders: true,
                    contextMenu: ['row_above', 'row_below', 'remove_row'],
                    minSpareRows: 3,
                    afterInit: function () {
                        $scope.hotInstance = this;
                    },
                    manualColumnResize: true,
                    manualRowResize: true,
                    wordWrap: false,
                    viewportColumnRenderingOffsetNumber: 1,                   
                    colWidths: $scope.columnWidths,
                    cells: function (row, col, prop) {
                        //physical, chemical,biological, microbio, tox
                        if (col == 6) {
                            var cellprops = {};
                            cellprops.renderer = colorRenderer;
                            return cellprops;
                        }
                    },
                    onBeforeChange: function (data) {
                        for (var i = 0; i < data.length; i++) {
                            if (data[i][1] == "state" && data[i][3] !== data[i][2]) {
                                $scope.UpdateCounties(data[i]);
                            }
                        }
                    },
                    onAfterChange: function (change, source) {
                        //change is an array containing arrays for each column affected: [0] = row, [1] = dataName, [2] = value it was, [3] = value it is 
                        //source is string : "alter', "empty', "edit', "populateFromArray', "loadData', "autofill', "paste".              
                        if (source != 'loadData') {
                            for (var i = 0; i < change.length; i++) {
                                //only care if it was actually changed
                                if (change[i][2] !== change[i][3]) {
                                    $scope.Changes.push(change[i]);
                                    //if (change[i][1] == "state") {
                                    //    $scope.UpdateCounties(change[i]);
                                    //}
                                }
                                
                            }
                        }
                    },
                    afterOnCellMouseDown: function (event, coords, td) {
                        if (coords.col == 6)
                            $scope.getStateCo(coords.col, coords.row);
                    },//end afterOnCellMouseDown                
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
                    },
                    rowHeights: 50
                };
                //#endregion

            }//end authorized
    }]);
}());