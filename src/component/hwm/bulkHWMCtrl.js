(function () {
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('bulkHWMCtrl', ['$scope', '$state', '$rootScope', '$cookies', '$http', '$filter', '$uibModal', 'SITE', 'HWM', 'HWM_Service', 'eventList', 'stateList', 'countyList',
        'hwmTypeList', 'markerList', 'hwmQualList', 'horizDatumList', 'horCollMethList', 'vertDatumList', 'vertCollMethList', 'leafletData', 
        function ($scope, $state, $rootScope, $cookies, $http, $filter, $uibModal, SITE, HWM, HWM_Service, eventList, stateList, countyList, 
            hwmTypeList, markerList, hwmQualList, horizDatumList, horCollMethList, vertDatumList, vertCollMethList, leafletData) {
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
                var getFindSiteModal = function (r, c) {
                    var dataAtRow = $scope.hotInstance.getDataAtRow(r); setTimeout(function () { $scope.hotInstance.deselectCell(); }, 100);
                    if (dataAtRow[9] !== "" && dataAtRow[10] !== "" && dataAtRow[9] !== null && dataAtRow[10] !== null) {
                        var siteModal = $uibModal.open({
                            templateUrl: 'associateSitemodal.html',
                            backdrop: 'static',
                            keyboard: false,
                            resolve: {
                                nearBySites: function () {
                                    return SITE.getProximitySites({ Latitude: dataAtRow[9], Longitude: dataAtRow[10], Buffer: 1.1 }).$promise;
                                },
                                siteNoAlreadyThere: function () {
                                    return dataAtRow[0];
                                }
                            },
                            controller: ['$scope', '$uibModalInstance', 'nearBySites','siteNoAlreadyThere', 'leafletData', function ($scope, $uibModalInstance, nearBySites, siteNoAlreadyThere, leafletData) {
                                $scope.localSites = nearBySites;
                                
                                $scope.showSiteCreateArea = false; //create new site checkbox click toggle show/hide 
                                $scope.createChecked = "0"; // default is unchecked on create new site
                                $scope.showMap = false; //show map toggle (only shows if there are sites in the localSites list
                                $scope.showHideMap = "Show";
                                // show/hide create site area
                                $scope.showHideCreateSiteDiv = function () {
                                    $scope.showSiteCreateArea = !$scope.showSiteCreateArea;
                                    angular.forEach($scope.localSites, function (s) {
                                        delete s.selected;
                                    });
                                }
                                //if they check a radio button (chose a site) make sure the checkbox for new site is unchecked.
                                $scope.unchkCreate = function (checkedSite) {
                                    $scope.createChecked = "0";
                                    $scope.showSiteCreateArea = false;
                                    //change icon color of that marker in map
                                    angular.forEach($scope.markers, function (mm) { mm.icon = icons.stn; });
                                    var selectedMarker = $scope.markers.filter(function (m) { return m.lat == checkedSite.latitude_dd && m.lng == checkedSite.longitude_dd; })[0];
                                    selectedMarker.icon = icons.selectedStn;
                                }
                                // show/hide the map 
                                $scope.showSitesOnMap = function () {
                                    $scope.showMap = !$scope.showMap;
                                    $scope.showHideMap = $scope.showHideMap == "Show" ? "Hide" : "Show";
                                    if ($scope.showMap) fitMapBounds();
                                }
                                
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
                                        iconSize: [10, 10],
                                        className: 'newSiteIcon'
                                    }
                                };
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

                                //get bounds based on lat long of 2 points
                                var bounds = [];
                                angular.forEach($scope.localSites, function(s){
                                    bounds.push([s.latitude_dd, s.longitude_dd]);
                                });
                                var fitMapBounds = function () {
                                    leafletData.getMap("associatedSiteMap").then(function (map) {
                                        map.fitBounds(bounds, { padding: [20, 20] });
                                    });
                                }
                                fitMapBounds();
                                angular.extend($scope, {                                    
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
                                $scope.ok = function () {
                                    //send the selected one back so site_no shows
                                    var selectedSite = nearBySites.filter(function (s) { return s.selected == "true"; })[0];
                                    $uibModalInstance.close(selectedSite);
                                };
                                $scope.cancel = function () {
                                    $uibModalInstance.dismiss();
                                }
                            }],
                            size: 'sm'
                        });
                        siteModal.result.then(function (thisSite) {
                            $scope.hotInstance.setDataAtCell(r, c, thisSite.site_no);
                        });
                    } else {
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
                    
                }
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
                                //TODO: instead of taking row away, add hwm_id and then check for presence before posting (already uploaded)
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
                    afterOnCellMouseDown: function (event, coords, td) {
                        //open modal for siteNo
                        //open multi-select modal for resources, media or frequencies
                        if (coords.col == 0 && event.realTarget.className == "htAutocompleteArrow")
                            getFindSiteModal(coords.col, coords.row);
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
                    }//,                    
                    //rowHeights: 50
                };
                //#endregion

            }//end authorized
        }]);
}());