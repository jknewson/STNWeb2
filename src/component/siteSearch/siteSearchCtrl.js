(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');
    //#region Site Search Controller
    STNControllers.controller('siteSearchCtrl', ['$scope', '$cookies', '$rootScope', '$location', 'stateList', 'sensorTypes', 'networkNames', 'SITE', siteSearchCtrl]);
    function siteSearchCtrl($scope, $cookies, $rootScope, $location, stateList, sensorTypes, networkNames, SITE) {
        if ($cookies.get('STNCreds') == undefined || $cookies.get('STNCreds') == "") {
            $scope.auth = false;
            $location.path('/login');
        } else {
            $rootScope.thisPage = "Site Search";
            $rootScope.activeMenu = "sites"; // report, settings
            //$scope.events = eventList;
            // watch for the session event to change and update
            $scope.$watch(function () { return $cookies.get('SessionEventName'); }, function (newValue) {
                $scope.sessionEvent = $cookies.get('SessionEventName') != null ? $cookies.get('SessionEventName') : "All Events";
            });
            $scope.states = stateList;
            $scope.senTypes = sensorTypes;
            $scope.netNames = networkNames;
            $scope.Chosen = {};
            $scope.chosenStates = []; //used to join each abbrev to pass to call
            $scope.siteResponse = false;
            $scope.checkboxModel = {
                hwmOnly: 0,
                senOnly: 0,
                rdgOnly: 0,
                opDefined: 0
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

            //filter options chosen, go get these sites to show in a table
            $scope.searchSites = function () {
                $(".page-loading").removeClass("hidden");
                var stateString = $scope.chosenStates.join();
                $scope.siteResponse = false;
                $scope.siteList = [];
                var evID = $cookies.get('SessionEventID') != null ? $cookies.get('SessionEventID') : 0;
                SITE.getAll({
                    Event: evID,
                    State: stateString,
                    SensorType: $scope.Chosen.sensor,
                    NetworkName: $scope.Chosen.network,
                    HWMOnly: $scope.checkboxModel.hwmOnly,
                    SensorOnly: $scope.checkboxModel.senOnly,
                    RDGOnly: $scope.checkboxModel.rdgOnly,
                    OPDefined: $scope.checkboxModel.opDefined
                },
                function success(response) {
                    $scope.siteList = response;
                    $scope.siteResponse = true;
                    $(".page-loading").addClass("hidden");
                }, function error(errorResponse) {
                    $(".page-loading").removeClass("hidden");
                    alert("Error: " + errorResponse.statusText);
                });
            };//end searchSites click action

            //add each state to an array to be joined in the GET
            $scope.stateClick = function (data) {
                if (data.selected == true) {
                    $scope.chosenStates.push(data.STATE_ABBREV);
                }
                if (data.selected == false) {
                    var ind = $scope.chosenStates.indexOf(data.STATE_ABBREV);
                    if (ind >= 0) {
                        $scope.chosenStates.splice(ind, 1);
                    }
                }
            };

            //clear the filter choices (start over)
            $scope.clearFilters = function () {
                $scope.checkboxModel = {
                    hwmOnly: 0,
                    senOnly: 0,
                    rdgOnly: 0,
                    opDefined: 0
                };
                $scope.Chosen = {};
                $scope.chosenStates = [];

                angular.forEach($scope.states, function (st) {
                    st.selected = false;
                });
            };
        }
    }
    //#endregion Site Search Controller
})();