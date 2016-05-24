(function () {
    'use strict';

    var SettingsControllers = angular.module('SettingsControllers');
    
    SettingsControllers.controller('eventInfoCtrl', ['$scope', '$cookies', '$location', '$http', '$uibModal', '$filter', 'EVENT', 'thisEvent',
        function ($scope, $cookies, $location, $http, $uibModal, $filter, EVENT, thisEvent) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                //all things both new and existing events page will need

                //#region Datepicker
                $scope.datepickrs = {};
                $scope.open = function ($event, which) {
                    $event.preventDefault();
                    $event.stopPropagation();

                    $scope.datepickrs[which] = true;
                };
                //$scope.format = 'MMM dd, yyyy';
                //#endregion Datepicker

                $scope.anEvent = {};

                //#region DELETE Event click
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
                    modalInstance.result.then(function (nameToRemove) {
                        //yes, remove this keyword
                        var test;
                        //DELETE it
                        $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');

                        EVENT.delete({ id: nameToRemove.event_id }, function success(response) {
                            var delEv = {};
                            delEv.event_id = nameToRemove.event_id;
                            delEv.Name = nameToRemove.event_name;
                            delEv.Type = $scope.eventTypeList.filter(function (a) { return a.event_type_id == nameToRemove.event_type_id; })[0].type;
                            delEv.Status = $scope.eventStatList.filter(function (r) { return r.event_status_id == nameToRemove.event_status_id; })[0].status;
                            var coord = $scope.eventCoordList.filter(function (c) { return c.member_id == nameToRemove.event_coordinator; })[0];
                            delEv.StartDate = nameToRemove.event_start_date;
                            delEv.EndDate = nameToRemove.event_end_date;
                            delEv.Coord = coord !== undefined ? coord.fname + " " + coord.lname : "";
                            var index = 0;
                            for (var i = 0; i < $scope.eventList.length; i++) {
                                if ($scope.eventList[i].event_id == delEv.event_id) {
                                    index = i;
                                    i = $scope.eventList.length;
                                }
                            }
                            $scope.eventList.splice(index, 1);
                            toastr.success("Event Deleted");
                        }, function error(errorResponse) {
                            toastr.error("Error: " + errorResponse.statusText);
                        }).$promise.then(function () {
                            $location.path('/Events/EventsList').replace();
                        });
                    });
                    //end modal
                };
                //#endregion DELETE Event click

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

                if (thisEvent !== undefined) {
                    $scope.anEvent = thisEvent;
                    $scope.anEvent.event_start_date = makeAdate($scope.anEvent.event_start_date); $scope.anEvent.event_end_date = makeAdate($scope.anEvent.event_end_date);
                    $scope.thisEventType = $scope.eventTypeList.filter(function (a) { return a.event_type_id == thisEvent.event_type_id; })[0].type;
                    $scope.thisEventStatus = $scope.eventStatList.filter(function (r) { return r.event_status_id == thisEvent.event_status_id; })[0].status;
                    var EC = $scope.eventCoordList.filter(function (c) { return c.member_id == thisEvent.event_coordinator; })[0];
                    $scope.thisEventCoord = EC !== undefined ? EC.fname + " " + EC.lname : "";

                }//end if thisEvent != null
                else {
                    //this is a new event being created
                    $scope.anEvent.event_start_date = makeAdate();
                    $scope.anEvent.event_end_date = makeAdate();

                }//end -new event

                //change to the user made, put it .. fired on each blur after change made to field
                $scope.SaveOnBlur = function (v) {
                    if (v) {
                        //ensure they don't delete required field values                    
                        $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                        $http.defaults.headers.common.Accept = 'application/json';
                        EVENT.update({ id: $scope.anEvent.event_id }, $scope.anEvent, function success(response) {
                            toastr.success("Event Updated");
                        }, function error(errorResponse) {
                            toastr.error("Error: " + errorResponse.statusText);
                        });
                    } else {
                        var errorModal = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>Please populate all required fields.</p></div>' +
                                '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                $scope.ok = function () {
                                    $uibModalInstance.close();
                                };
                            }],
                            size: 'sm'
                        });
                        //errorModal.result.then(function () {

                        //});

                    }
                };//end SaveOnBlur

                $scope.save = function (valid) {
                    if (valid) {
                        EVENT.save($scope.anEvent, function success(response) {
                            toastr.success("Event Created");
                            //push this new event into the eventList
                            var E = {};
                            E.event_id = response.event_id;
                            E.Name = response.event_name;
                            E.Type = $scope.eventTypeList.filter(function (a) { return a.event_type_id == response.event_type_id; })[0].type;
                            E.Status = $scope.eventStatList.filter(function (r) { return r.event_status_id == response.event_status_id; })[0].status;
                            var coord = $scope.eventCoordList.filter(function (c) { return c.member_id == response.event_coordinator; })[0];
                            E.StartDate = response.event_start_date;
                            E.EndDate = response.event_end_date;
                            E.Coord = coord !== undefined ? coord.fname + " " + coord.lname : "";
                            $scope.eventList.push(E);
                        }).$promise.then(function () {
                            $location.path('/Events/EventsList').replace();
                        });

                    }
                };//end $scope.save()
            }//end else (checkCreds())
        }]);
    
}());