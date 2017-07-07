
(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('approvalCtrl', ['$scope', '$cookies', '$rootScope', '$location', '$http', 'stateList', 'countyList', 'instrumentList', 'allSensorTypes', 'allDepTypes', 'HWM', 'DATA_FILE', 'INSTRUMENT', 'SITE',
        function ($scope, $cookies, $rootScope, $location, $http, stateList, countyList, instrumentList, allSensorTypes, allDepTypes, HWM, DATA_FILE, INSTRUMENT, SITE) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                $rootScope.thisPage = "Approval";
                $rootScope.activeMenu = "approval";
                
                // watch for the session event to change and update  
                $scope.$watch(function () { return $cookies.get('SessionEventName'); }, function (newValue) {
                    $scope.sessionEvent = $cookies.get('SessionEventName') !== null && $cookies.get('SessionEventName') !== undefined ? $cookies.get('SessionEventName') : "All Events";
                });

                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                $http.defaults.headers.common.Accept = 'application/json';
                
                $scope.allStates = stateList;
                $scope.countyList = countyList;
                $scope.countyArray = []; //holder of state counties (will change as they change state choice)
                $scope.allInstruments = instrumentList;
                $scope.allSensorTypes = allSensorTypes;
                $scope.allDeploymentTypes = allDepTypes;
                $scope.ChosenEvent = {};
                $scope.ChosenState = {};
                $scope.ChosenCounties = {};
                $scope.unApprovedHWMs = []; $scope.showHWMbox = false;
                $scope.unApprovedDFs = []; $scope.showDFbox = false;
                                
                $scope.search = function () {
                    //clear contents in case they are searching multiple times
                    $scope.unApprovedHWMs = []; $scope.showHWMbox = false;
                    $scope.unApprovedDFs = []; $scope.showDFbox = false;
                    var evID = $cookies.get('SessionEventID') !== null && $cookies.get('SessionEventID') !== undefined ? $cookies.get('SessionEventID') : 0;
                    var sID = $scope.ChosenState.id !== undefined ? $scope.ChosenState.id : 0;
                    var chosenCounties = $scope.ChosenCounties.counties !== undefined ? $scope.ChosenCounties.counties : [];
                    $rootScope.approvalSearch = {
                        eventID: evID,
                        stateID: sID,
                        counties: chosenCounties
                    };
                    //go get the HWMs and DataFiles that need to be approved
                    var countyNames = [];
                   
                    angular.forEach(chosenCounties, function (c) {
                        countyNames.push(c.county_name);
                    });
                    var countiesCommaSep = countyNames.join(',');
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    HWM.getUnapprovedHWMs({ IsApproved: 'false', Event: evID, State: sID, Counties: countiesCommaSep }, function success(response) {
                        //need site no
                        angular.forEach(response, function (h) {
                            SITE.query({ id: h.site_id }).$promise.then(function (sresponse) {
                                h.site_no = sresponse.site_no;
                                $scope.unApprovedHWMs.push(h);
                            });
                        });
                        $scope.showHWMbox = true;

                    }, function error(errorResponse) {
                        alert("Error: " + errorResponse.statusText);
                    });
                    DATA_FILE.getUnapprovedDFs({ IsApproved: 'false', Event: evID, State: sID, Counties: countiesCommaSep }, function success(response1) {
                        var DFs = response1;
                        //need sensor and site info
                        angular.forEach(DFs, function (df) {
                            var thisdfInst = $scope.allInstruments.filter(function (i) { return i.instrument_id == df.instrument_id; })[0];
                            var formattedDF = {};
                            var siteID = thisdfInst.site_id;
                            formattedDF.SiteId = siteID;
                            formattedDF.senType = $scope.allSensorTypes.filter(function (s) { return s.sensor_type_id == thisdfInst.sensor_type_id; })[0].sensor;
                            var depType = $scope.allDeploymentTypes.filter(function (d) { return d.deployment_type_id == thisdfInst.deployment_type_id; })[0];
                            formattedDF.depType = depType !== undefined ? depType.method : undefined;
                            formattedDF.InstrID = thisdfInst.instrument_id;
                            SITE.query({ id: siteID }).$promise.then(function (response2) {
                                formattedDF.SiteNo = response2.site_no;
                                
                                $scope.unApprovedDFs.push(formattedDF);
                            });
                        });
                        $scope.showDFbox = true;
                    }, function error(errorResponse1) {
                        alert("Error: " + errorResponse1.statusText);
                    }); 
                };

                $scope.UpdateCounties = function () {
                    if ($scope.ChosenState.id !== null) {
                        var thisState = $scope.allStates.filter(function (st) { return st.state_abbrev == $scope.ChosenState.id; })[0];
                        $scope.countyArray = $scope.countyList.filter(function (c) { return c.state_id == thisState.state_id; });
                    } else {
                        $scope.countyArray = [];
                    }
                };
                //if they are coming back here, see if a search has been stored last time.
                if ($rootScope.approvalSearch !== undefined) {
                    var thisSearch = $rootScope.approvalSearch;
                    $scope.sessionEvent = Number(thisSearch.eventID);
                    $scope.ChosenState.id = thisSearch.stateID;
                    if (thisSearch.stateID) {
                        //populate the counties array first
                        $scope.UpdateCounties();
                    }

                    //go through allHousingTypeList and add selected Property.
                    for (var caI = 0; caI < $scope.countyArray.length; caI++) {
                        //for each one, if thisSiteHousings has this id, add 'selected:true' else add 'selected:false'
                        for (var cI = 0; cI < thisSearch.counties.length; cI++) {
                            if (thisSearch.counties[cI].county_id == $scope.countyArray[caI].county_id) {
                                $scope.countyArray[caI].selected = true;
                                cI = thisSearch.counties.length; //ensures it doesn't set it as false after setting it as true
                            }
                            else {
                                $scope.countyArray[caI].selected = false;
                            }
                        }
                        if (thisSearch.counties.length === 0)
                            $scope.countyArray[caI].selected = false;
                    }
                    var countyNames = [];
                    $scope.ChosenCounties.counties = thisSearch.counties;
                    angular.forEach(thisSearch.counties, function (c) {
                        countyNames.push(c.county_name);
                    });
                    var countiesCommaSep = countyNames.join(',');
                    //go get the HWMs and DataFiles that need to be approved
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    HWM.getUnapprovedHWMs({ IsApproved: 'false', Event: thisSearch.eventID, State: thisSearch.stateID, Counties: countiesCommaSep }, function success(response) {
                        $scope.unApprovedHWMs = response;
                        $scope.showHWMbox = true;

                    }, function error(errorResponse) {
                        alert("Error: " + errorResponse.statusText);
                    });
                    DATA_FILE.getUnapprovedDFs({ IsApproved: 'false', Event: thisSearch.eventID, State: thisSearch.stateID, Counties: countiesCommaSep }, function success(response1) {
                        var DFs = response1;
                        //need sensor and site info
                        angular.forEach(DFs, function (df) {
                            var thisdfInst = $scope.allInstruments.filter(function (i) { return i.instrument_id == df.instrument_id; })[0];
                            var formattedDF = {};
                            var siteID = thisdfInst.site_id;
                            formattedDF.SiteId = siteID;
                            formattedDF.senType = $scope.allSensorTypes.filter(function (s) { return s.sensor_type_id == thisdfInst.sensor_type_id; })[0].sensor;
                            var depType = $scope.allDeploymentTypes.filter(function (d) { return d.deployment_type_id == thisdfInst.deployment_type_id; })[0];
                            formattedDF.depType = depType !== undefined ? depType.method : undefined;
                            formattedDF.InstrID = thisdfInst.instrument_id;
                            SITE.query({ id: siteID }).$promise.then(function (response2) {
                                formattedDF.SiteNo = response2.site_no;
                                
                                $scope.unApprovedDFs.push(formattedDF);
                            });
                        });
                        $scope.showDFbox = true;
                    }, function error(errorResponse1) {
                        alert("Error: " + errorResponse1.statusText);
                    }); 
                }
            }
        }]);

})();