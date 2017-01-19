(function () {
    'use strict';

    var SettingsControllers = angular.module('SettingsControllers');

    SettingsControllers.controller('eventCtrl', ['$scope', '$rootScope', '$cookies', '$location', '$http', '$filter', '$uibModal', 'MEMBER', 'FILE_TYPE', 'allCoordMembers', 'allEvents', 'allEventTypes', 'allEventStats',
        function ($scope, $rootScope, $cookies, $location, $http, $filter, $uibModal, MEMBER, FILE_TYPE, allCoordMembers, allEvents, allEventTypes, allEventStats) {
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
                //called a to format just the date (no time) '2013-05-16T05:00:00'
                var makeAdate = function (d) {
                    var Tindex = d.indexOf("T");
                    var theDate = d.substring(0, Tindex);                    
                    return theDate;
                };//end makeAdate()

                $scope.eventTypeList = allEventTypes;
                $scope.eventStatList = allEventStats;
                $scope.eventCoordList = allCoordMembers;

                //build eventObject for eventList for table in eventsList.html
                $scope.eventList = [];
                for (var x = 0; x < allEvents.length; x++) {
                    var E = allEvents[x];
                    E.Name = allEvents[x].event_name;
                    E.Type = $scope.eventTypeList.filter(function (a) { return a.event_type_id == allEvents[x].event_type_id; })[0].type;
                    E.Status = $scope.eventStatList.filter(function (r) { return r.event_status_id == allEvents[x].event_status_id; })[0].status;
                    var coord = $scope.eventCoordList.filter(function (c) { return c.member_id == allEvents[x].event_coordinator; })[0];
                    E.StartDate = allEvents[x].event_start_date !== undefined ?  makeAdate(allEvents[x].event_start_date) : "";
                    E.EndDate = allEvents[x].event_end_date !== undefined ? makeAdate(allEvents[x].event_end_date) : "";
                    E.Coord = coord !== undefined ? coord.fname + " " + coord.lname : "";

                    $scope.eventList.push(E);
                }

                //create/view member was clicked
                $scope.showEventModal = function (eventClicked) {
                    var indexClicked = $scope.eventList.indexOf(eventClicked);
                    $rootScope.stateIsLoading = { showLoading: true }; //Loading...
                    //modal
                    var modalInstance = $uibModal.open({
                        templateUrl: 'eventModal.html',
                        controller: 'eventModalCtrl',
                        size: 'lg',
                        backdrop: 'static',
                        keyboard: false,
                        windowClass: 'rep-dialog',
                        resolve: {
                            thisEvent: function () {
                                return eventClicked !== 0 ? eventClicked : "empty";
                            },
                            eventTypeList: function () {
                                return allEventTypes;
                            },
                            eventStatusList: function () {
                                return allEventStats;
                            },
                            adminList: function () {
                               return allCoordMembers;
                            },
                            fileTypes: function () {
                                return FILE_TYPE.getAll().$promise;
                            }
                        }
                    });
                    modalInstance.result.then(function (createdEvent) {
                        //is there a new op or just closed modal
                        $rootScope.stateIsLoading = { showLoading: false }; //Loading...
                        if (createdEvent !== undefined) {
                            if (createdEvent[1] == 'created') {
                                $scope.eventList.push(createdEvent[0]);
                            }
                            if (createdEvent[1] === 'updated') {
                                //update the list
                                $scope.eventList[indexClicked] = createdEvent[0];
                            }
                            if (createdEvent[1] == 'deleted') {
                                // var indexClicked1 = $scope.memberList.indexOf(createdMember[0]);
                                $scope.eventList.splice(indexClicked, 1);
                            }
                        }
                    });
                };
            }
            
        }]);
}());