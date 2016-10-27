(function () {
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('bulkHWMCtrl', ['$scope', '$state', '$rootScope', '$cookies', '$http', '$filter', '$uibModal', 'SITE', 'HWM', 'HWM_Service', 'eventList', 'stateList', 'countyList', 
        function ($scope, $state, $rootScope, $cookies, $http, $filter, $uibModal, SITE, HWM, HWM_Service, eventList, stateList, countyList) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                //global vars
                $scope.querySearch = {}; //holds what they searched for to get the adjustedHWMs again and have it shown to them
                $scope.showLoading = false; //div holding loader and dynamic and max for progress bar
                $scope.dynamic = 0; $scope.max = 0;
                $scope.hotInstance;  //id   wtr sNO desc lat  long date elev unc  not 
                $scope.columnWidths = [84, 120, 120, 220, 120, 120, 150, 130, 160, 180];
                $scope.Changes = []; //track changes made to compare for saving
                $scope.invalids = []; //store when invalid thrown
                $scope.events = eventList;
                $scope.states = stateList;
                $scope.HWM_params = {};
                $scope.countyList = countyList;
                $scope.countyArray = []; //holder of state counties (will change as they change state choice)
                $scope.result = { 'searchClicked':false };

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
                $scope.adjustHWMs = []; $scope.eventStateHWMs = []; //holds the event hwm objects for updating
                $scope.hwmCount = "";
                $scope.UpdateCounties = function () {
                    if ($scope.HWM_params.state_abbrev !== null) {
                        var thisState = $scope.states.filter(function (st) { return st.state_abbrev == $scope.HWM_params.state_abbrev; })[0];
                        $scope.countyArray = $scope.countyList.filter(function (c) { return c.state_id == thisState.state_id; });
                    } else {
                        $scope.countyArray = [];
                    }
                };
                                
                
                //event,state,counties chosen, get hwms
                $scope.getHWMs = function (valid) {
                    if (valid) {
                        $scope.result = {};
                        $scope.result.searchClicked = true;
                        var countyNames = [];
                        angular.forEach($scope.HWM_params.counties, function (c) {
                            countyNames.push(c.county_name);
                        });
                        var countiesCommaSep = countyNames.join(',');
                        $scope.adjustHWMs = []; $scope.eventStateHWMs = [];
                        //store search for leave/come back
                        $scope.querySearch = {};
                        $scope.querySearch.Event = $scope.HWM_params.event_id;
                        $scope.querySearch.State = $scope.HWM_params.state_abbrev;
                        $scope.querySearch.Counties = countiesCommaSep;
                        HWM_Service.setBulkHWMSearch($scope.querySearch);
                        HWM.getFilteredHWMs({ Event: $scope.HWM_params.event_id, States: $scope.HWM_params.state_abbrev, County: countiesCommaSep }, function (response) {
                            $scope.hwmCount = response.length;
                            $scope.result.isResponse = $scope.hwmCount > 0 ? true : false;
                            for (var i = 0; i < response.length; i++) {
                                var one = {};
                                one.hwm_id = response[i].hwm_id;
                                one.waterbody = response[i].waterbody;
                                one.site_id = response[i].site_id;
                                one.site_no = response[i].site_no,
                                one.hwm_locationdescription = response[i].hwm_locationdescription;
                                one.latitude_dd = response[i].latitude_dd;
                                one.longitude_dd = response[i].longitude_dd;
                                if (response[i].survey_date !== "") {
                                    one.survey_date = makeAdate(response[i].survey_date);
                                }
                                one.elev_ft = response[i].elev_ft;
                                one.uncertainty = response[i].uncertainty;
                                one.hwm_notes = response[i].hwm_notes;
                                $scope.adjustHWMs.push(one);
                            }
                        }, function (error) {
                            toastr.error("Error getting hwms.");
                        });
                    }
                };
                
                if (!angular.equals({}, HWM_Service.getBulkHWMSearch())) {
                    var theSearch = HWM_Service.getBulkHWMSearch();
                    $scope.HWM_params.event_id = theSearch.Event;
                    $scope.HWM_params.state_abbrev = theSearch.State;
                    $scope.UpdateCounties();
                    if (theSearch.Counties !== "") {
                        var counties = theSearch.Counties.split(",");
                        $scope.HWM_params.counties = [];
                        angular.forEach($scope.countyArray, function (c) {
                            //make those selected if in counties
                            if (counties.map(function (cA) { return cA; }).indexOf(c.county_name) > -1) {
                                c.selected = true;
                                $scope.HWM_params.counties.push(c);
                            }
                        });
                    }
                    $scope.getHWMs(true);
                }
                //#region renderers/validators
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
               
                //make readonly grey
                var colorRenderer = function (instance, td, row, col, prop, value, cellProperties) {
                    Handsontable.renderers.TextRenderer.apply(this, arguments);
                    td.style.background = '#F7F5F5';
                    return td;
                };
                //make site_no a link
                var siteNoRenderer = function (instance, td, row, col, prop, value, cellProperties) {
                    Handsontable.renderers.TextRenderer.apply(this, arguments);              
                    td.innerHTML = '<a ng-click="goToSite()">' + value + '</a>';                   
                    td.style.background = '#F7F5F5';
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
                $scope.numberValidator = function (value, callback) {
                    //handling this myself, never will be invalid
                    callback(true);                    
                };         
                //#endregion

                //save updates
                $scope.save = function () {
                    HWM.getEventStateHWMs({ eventId: $scope.HWM_params.event_id, state: $scope.HWM_params.state_abbrev }).$promise.then(function (response) {
                        $scope.eventStateHWMs = response;
                        //look through $scope.eventStateHWMs and grab the ones that were on this adjustment page
                        var updateTheseHWMs = [];
                        for (var evH = 0; evH < $scope.eventStateHWMs.length; evH++) {
                            var theyHaveItHere = $scope.adjustHWMs.filter(function (a) { return a.hwm_id == $scope.eventStateHWMs[evH].hwm_id; })[0];
                            if (theyHaveItHere !== undefined) {
                                //update survey_date,elev_ft, uncertainty, and hwm_notes 
                                $scope.eventStateHWMs[evH].survye_date = theyHaveItHere.survey_date;
                                $scope.eventStateHWMs[evH].elev_ft = theyHaveItHere.elev_ft;
                                $scope.eventStateHWMs[evH].uncertainty = theyHaveItHere.uncertainty;
                                $scope.eventStateHWMs[evH].hwm_notes = theyHaveItHere.hwm_notes;
                                updateTheseHWMs.push($scope.eventStateHWMs[evH]);
                            }
                        }
                        //PUT
                        $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                        $http.defaults.headers.common.Accept = 'application/json';
                        angular.forEach(updateTheseHWMs, function (u) {
                            HWM.update({ id: u.hwm_id }, u).$promise.then(function () {
                                toastr.success("HWMs updated");
                                $scope.adjustHWMs = []; $scope.eventStateHWMs = [];
                                $scope.invalids = [];
                                $scope.getHWMs(true);
                            }, function (error) {
                                toastr.error("Error updating HWMs");
                            });
                        });
                    });
                };
                //reset back 
                $scope.reset = function () {
                    var resetModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title"></h3></div>' +
                            '<div class="modal-body"><p>Warning! This will revert the hwm data to the last saved version. All unsaved edits will be lost.</p></div>' +
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
                        $scope.adjustHWMs = []; HWM_Service.setBulkHWMSearch({});
                        $scope.invalids = [];
                        $scope.getHWMs(true);                        
                    });
                };

                //#region handsontable settings
                $scope.tableSettings = {
                  //  colHeaders: true,
                    rowHeaders: true,
                    //contextMenu: ['row_above', 'row_below', 'remove_row'],
                    minSpareRows: 0,
                    afterInit: function () {
                        $scope.hotInstance = this;
                    },
                    manualColumnResize: true,
                    manualRowResize: true,
                    wordWrap: false,
                    preventOverflow: 'horizontal',
                    viewportColumnRenderingOffsetNumber: 1,
                    colWidths: $scope.columnWidths,
                    cells: function (row, col, prop) {
                        //first 6 are readonly (grey) and site_no is a link
                        var cellprops = {};
                        if (col <= 5) cellprops.renderer = colorRenderer;                         
                        if (col == 2) cellprops.renderer = siteNoRenderer;                            
                        return cellprops;                        
                    },
                    onBeforeChange: function (data) {
                        for (var i = data.length - 1; i >= 0; i--) {
                            if ((data[i][1] == 'elev_ft' || data[i][1] == 'uncertainty') && data[i][3] !== "") // replace 0 by the number of the field to validate
                            {
                                if (isNaN(data[i][3])) {
                                    data.splice(i, 1);
                                    setTimeout(function () { $scope.hotInstance.deselectCell(); }, 100);
                                    var waterModal = $uibModal.open({
                                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                            '<div class="modal-body"><p>Value must be a number.</p></div>' +
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
                        }                        
                    },
                    afterOnCellMouseDown: function (event, coords, td) {
                        //open multi-select modal for resources, media or frequencies
                        if (coords.col == 2) {
                            var site_number = $scope.hotInstance.getDataAtCell(coords.row, coords.col);
                            var siteId = $scope.adjustHWMs.filter(function (h) { return h.site_no == site_number; })[0].site_id;
                            $state.go("site.dashboard", {id: siteId});
                        }
                    },
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
                    fillHandle:{autoInsertRow:false},
                    rowHeights: 50
                };
                //#endregion

            }//end authorized
        }]);
}());