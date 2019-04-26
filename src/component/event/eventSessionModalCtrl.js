(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var ModalControllers = angular.module('ModalControllers');
    ModalControllers.controller('eventSessionModalCtrl', ['$scope', '$timeout', '$rootScope', '$cookies', '$uibModalInstance', 'allEvents', 'allEventTypes', 'allStates', 'EVENT',
        function ($scope, $timeout, $rootScope, $cookies, $uibModalInstance, allEvents, allEventTypes, allStates, EVENT) {
            $scope.EventList = allEvents;
            $scope.EventTypeList = allEventTypes;
            $scope.StateList = allStates;
            var chosenEv = $cookies.get('SessionEventID'); //see if we need to select the session event
            $scope.event = { EventChosen: chosenEv !== undefined ? Number(chosenEv) : "" };
            $scope.test = "false";
            $scope.filterButtonText = "Filter Events";

            //filters chosen, only show these events
            $scope.filterEvents = function () {
                $scope.test = "true";
                $scope.filterButtonText = " Filtering Events";
                //?Date: null, Type: 0, State: null
                var d = $scope.event.DATE !== null && $scope.event.DATE !== undefined ? $scope.event.DATE : null;
                var t = $scope.event.type !== null && $scope.event.type !== undefined ? $scope.event.type : 0;
                var s = $scope.event.state !== null && $scope.event.state !== undefined ? $scope.event.state : null;
                EVENT.getFilteredEvents({ Date: d, Type: t, State: s }).$promise.then(function (response) {
                    $scope.EventList = response;
                    $scope.filterButtonText = "Filter Events";
                }, $timeout(function(){
                    $scope.filterButtonText = "Filter Events";
                }, 10000),
                function (errorResponse) {
                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting filtered events: " + errorResponse.headers(["usgswim-messages"]));
                    else toastr.error("Error getting filtered events: " + errorResponse.statusText);
                    $scope.filterButtonText = "Filter Events";
                });
                /* $timeout(function(){
                    $scope.searchButtonText = "Filter Events";
                }, 6000); */
            };
            //clear the filters
            $scope.clearFilters = function () {
                $scope.event = { EventChosen: chosenEv !== undefined ? Number(chosenEv) : "" };
                $scope.EventList = allEvents;
            };
            //event has been chosen. Set it as session event
            $scope.setEvent = function () {
                $scope.evID = $scope.event.EventChosen;
                if ($scope.evID !== "") {
                    var eventName = allEvents.filter(function (x) { return x.event_id == $scope.evID; })[0];
                    $cookies.put('SessionEventID', $scope.evID);
                    $cookies.put('SessionEventName', eventName.event_name);

                    $rootScope.sessionEvent = "Session Event: " + eventName.event_name + ".";
                    $uibModalInstance.dismiss('cancel');
                } else {
                    toastr.error("You must choose an Event first.");
                }
            };

            //they want to clear the session event
            $scope.clearEvent = function () {
                $scope.event = {};
                $cookies.remove('SessionEventID');
                $cookies.remove('SessionEventName');
                $rootScope.sessionEvent = "";
                $uibModalInstance.dismiss('cancel');
            };

            //Datepicker
            $scope.datepickrs = {};
            $scope.open = function ($event, which) {
                $event.preventDefault();
                $event.stopPropagation();

                $scope.datepickrs[which] = true;
            };

            //cancel
            $scope.close = function () {
                $uibModalInstance.dismiss('cancel');
            };
        }]);
})();