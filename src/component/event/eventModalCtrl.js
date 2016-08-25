(function () {
    'use strict';

    var SettingsControllers = angular.module('SettingsControllers');
    
    SettingsControllers.controller('eventModalCtrl', ['$scope', '$rootScope', '$cookies', '$http', '$uibModal', '$uibModalInstance', '$filter','thisEvent', 'eventTypeList', 'eventStatusList', 'adminList', 'EVENT',
        function ($scope, $rootScope, $cookies, $http, $uibModal, $uibModalInstance, $filter, thisEvent, eventTypeList, eventStatusList, adminList, EVENT) {
            $scope.anEvent = {};
            $scope.eventTypes = eventTypeList;
            $scope.eventStatuses = eventStatusList;
            $scope.adminMembers = adminList;
            $scope.loggedInRole = $cookies.get('usersRole');

            //#region Datepicker
            $scope.datepickrs = {};
            $scope.open = function ($event, which) {
                $event.preventDefault();
                $event.stopPropagation();

                $scope.datepickrs[which] = true;
            };
            //$scope.format = 'MMM dd, yyyy';
            //#endregion Datepicker
                       
            //called a few times to format just the date (no time)
            var makeAdate = function (d) {
                var aDate = new Date();
                if (d !== undefined) {
                    //provided date
                    aDate = new Date(d);
                }

                var year = aDate.getFullYear();
                var month = aDate.getMonth();
                var day = ('0' + aDate.getDate()).slice(-2);
                var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                var dateWOtime = new Date(monthNames[month] + " " + day + ", " + year);
                return dateWOtime;
            }; //end makeAdate()

            if (thisEvent != "empty") {
                $scope.anEvent = angular.copy(thisEvent);
                $scope.anEvent.event_start_date = $scope.anEvent.event_start_date !== undefined ? makeAdate($scope.anEvent.event_start_date) : '';
                $scope.anEvent.event_end_date = $scope.anEvent.event_end_date !== undefined ? makeAdate($scope.anEvent.event_end_date) : '';
            }
            else {
                //this is a new event being created
                $scope.anEvent.event_start_date = makeAdate();
            }

            //on create and save, if dates entered, compare to ensure end date comes after start date
            var compareDates = function (v, sd, ed) {
                if (new Date(ed) < new Date(sd)) {
                    v = false;
                    var fixDate = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>The event end date must be after the event start date.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                    fixDate.result.then(function () {
                        v = false;
                    });
                }
                return v;
            };

            $scope.create = function (valid) {
                //make sure end date is after start date                
                if (($scope.anEvent.event_start_date !== undefined && $scope.anEvent.event_start_date !== null) &&
                    ($scope.anEvent.event_end_date !== undefined && $scope.anEvent.event_end_date !== null)) {
                    valid = compareDates(valid, $scope.anEvent.event_start_date, $scope.anEvent.event_end_date);
                }//end if there's a start and end date 
                if (valid) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    var createdEvent = {};
                    EVENT.save($scope.anEvent, function success(response) {
                        toastr.success("Event Created");
                        //push this new event into the eventList
                        createdEvent = response;
                        createdEvent.event_id = response.event_id;
                        createdEvent.Name = response.event_name;
                        createdEvent.Type = $scope.eventTypes.filter(function (a) { return a.event_type_id == response.event_type_id; })[0].type;
                        createdEvent.Status = $scope.eventStatuses.filter(function (r) { return r.event_status_id == response.event_status_id; })[0].status;
                        var coord = $scope.adminMembers.filter(function (c) { return c.member_id == response.event_coordinator; })[0];
                        createdEvent.StartDate = response.event_start_date;
                        createdEvent.EndDate = response.event_end_date;
                        createdEvent.Coord = coord !== undefined ? coord.fname + " " + coord.lname : "";                        
                    }, function error(errorResponse) {
                        toastr.error("Error creating new event: " + errorResponse.statusText);
                    }).$promise.then(function () {
                        var sendBack = [createdEvent, 'created'];
                        $uibModalInstance.close(sendBack);
                    });

                }
            };//end $scope.save()     

            $scope.save = function (valid) {
                //make sure end date is after start date
                if (($scope.anEvent.event_start_date !== undefined && $scope.anEvent.event_start_date !== null) &&
                    ($scope.anEvent.event_end_date !== undefined && $scope.anEvent.event_end_date !== null)) {
                    valid = compareDates(valid, $scope.anEvent.event_start_date, $scope.anEvent.event_end_date);                    
                }//end if there's a start and end date 
                if (valid) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    var updatedEvent = {};
                    EVENT.update({ id: $scope.anEvent.event_id }, $scope.anEvent, function success(response) {
                        updatedEvent = response;
                        updatedEvent.event_id = response.event_id;
                        updatedEvent.Name = response.event_name;
                        updatedEvent.Type = $scope.eventTypes.filter(function (a) { return a.event_type_id == response.event_type_id; })[0].type;
                        updatedEvent.Status = $scope.eventStatuses.filter(function (r) { return r.event_status_id == response.event_status_id; })[0].status;
                        var coord = $scope.adminMembers.filter(function (c) { return c.member_id == response.event_coordinator; })[0];
                        updatedEvent.StartDate = response.event_start_date;
                        updatedEvent.EndDate = response.event_end_date;
                        updatedEvent.Coord = coord !== undefined ? coord.fname + " " + coord.lname : "";
                        toastr.success("Event Updated");
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    }).$promise.then(function () {
                        var sendBack = [updatedEvent, 'updated'];
                        $uibModalInstance.close(sendBack);
                    });
                }
            };
         
            $scope.DeleteEvent = function (ev) {
                //modal
                var modalInstance = $uibModal.open({
                    templateUrl: 'removemodal.html',
                    controller: 'ConfirmModalCtrl',
                    size: 'sm',
                    resolve: {
                        nameToRemove: function () {
                            return ev;
                        },
                        what: function () {
                            return "Event";
                        }
                    }
                });
                modalInstance.result.then(function (eventToRemove) {
                    //DELETE it
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    EVENT.delete({ id: eventToRemove.event_id }, function success(response) {
                        toastr.success("Event Deleted");
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    }).$promise.then(function () {
                        $uibModalInstance.close(["de", 'deleted']);
                    });
                });
            };

            //cancel modal
            $scope.cancel = function () {
                $uibModalInstance.close();
            };
            $rootScope.stateIsLoading = { showLoading: false }; //Loading...

        }]);
    
}());