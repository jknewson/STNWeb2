(function () {
    'use strict';

    var SettingsControllers = angular.module('SettingsControllers');
   //#region events inside Settings Tab
    //#region event Controller (abstract)
    SettingsControllers.controller('eventCtrl', ['$scope', '$rootScope', '$cookies', '$location', '$http', '$filter', 'MEMBER', 'allEvents', 'allEventTypes', 'allEventStats',
        function eventCtrl($scope, $rootScope, $cookies, $location, $http, $filter, MEMBER, allEvents, allEventTypes, allEventStats) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                $rootScope.thisPage = "Settings/Events";
                $scope.loggedInRole = $cookies.get('usersRole');
                $scope.isAdmin = $scope.loggedInRole == "Admin" ? true : false;

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

                $scope.eventTypeList = allEventTypes;
                $scope.eventStatList = allEventStats;
                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                $http.defaults.headers.common.Accept = 'application/json';
                MEMBER.getRoleMembers({ roleId: 1 }).$promise.then(function (response) {
                    $scope.eventCoordList = response;
                    $scope.eventList = [];
                    for (var x = 0; x < allEvents.length; x++) {
                        var E = {};
                        E.EVENT_ID = allEvents[x].EVENT_ID;
                        E.Name = allEvents[x].EVENT_NAME;
                        E.Type = $scope.eventTypeList.filter(function (a) { return a.EVENT_TYPE_ID == allEvents[x].EVENT_TYPE_ID; })[0].TYPE;
                        E.Status = $scope.eventStatList.filter(function (r) { return r.EVENT_STATUS_ID == allEvents[x].EVENT_STATUS_ID; })[0].STATUS;
                        var coord = $scope.eventCoordList.filter(function (c) { return c.MEMBER_ID == allEvents[x].EVENT_COORDINATOR; })[0];
                        E.StartDate = allEvents[x].EVENT_START_DATE;
                        E.EndDate = allEvents[x].EVENT_END_DATE;
                        E.Coord = coord !== undefined ? coord.FNAME + " " + coord.LNAME : "";

                        $scope.eventList.push(E);
                    }
                });
            }
        }]);
    //#endregion  event Controller (abstract)
}());