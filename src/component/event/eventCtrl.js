(function () {
    'use strict';

    var SettingsControllers = angular.module('SettingsControllers');

    SettingsControllers.controller('eventCtrl', ['$scope', '$rootScope', '$cookies', '$location', '$http', '$filter', 'MEMBER', 'allCoordMembers', 'allEvents', 'allEventTypes', 'allEventStats',
        function ($scope, $rootScope, $cookies, $location, $http, $filter, MEMBER, allCoordMembers, allEvents, allEventTypes, allEventStats) {
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
                $scope.eventCoordList = allCoordMembers;

               $scope.eventList = [];
               for (var x = 0; x < allEvents.length; x++) {
                   var E = {};
                   E.event_id = allEvents[x].event_id;
                   E.Name = allEvents[x].event_name;
                   E.Type = $scope.eventTypeList.filter(function (a) { return a.event_type_id == allEvents[x].event_type_id; })[0].type;
                   E.Status = $scope.eventStatList.filter(function (r) { return r.event_status_id == allEvents[x].event_status_id; })[0].status;
                   var coord = $scope.eventCoordList.filter(function (c) { return c.member_id == allEvents[x].even_coordinator; })[0];
                   E.StartDate = allEvents[x].event_start_date;
                   E.EndDate = allEvents[x].event_end_date;
                   E.Coord = coord !== undefined ? coord.fname + " " + coord.lname : "";

                   $scope.eventList.push(E);
               }
            }
        }]);
}());