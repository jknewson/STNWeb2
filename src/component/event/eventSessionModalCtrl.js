(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var ModalControllers = angular.module('ModalControllers');
    ModalControllers.controller('eventSessionModalCtrl', ['$scope', '$rootScope', '$cookies', '$uibModalInstance', 'allEvents', 'allEventTypes', 'allStates', 'EVENT',
        function ($scope, $rootScope, $cookies, $uibModalInstance, allEvents, allEventTypes, allStates, EVENT) {
            $scope.EventList = allEvents;
            $scope.EventTypeList = allEventTypes;
            $scope.StateList = allStates;
            var chosenEv = $cookies.get('SessionEventID'); //see if we need to select the session event
            $scope.event = { EventChosen: chosenEv !== undefined ? Number(chosenEv) : "" };

            //filters chosen, only show these events
            $scope.filterEvents = function () {
                //?Date: null, Type: 0, State: null
                var d = $scope.event.DATE !== null && $scope.event.DATE !== undefined ? $scope.event.DATE : null;
                var t = $scope.event.type !== null && $scope.event.type !== undefined ? $scope.event.type : 0;
                var s = $scope.event.state !== null && $scope.event.state !== undefined ? $scope.event.state : null;
                EVENT.getFilteredEvents({ Date: d, Type: t, State: s }).$promise.then(function (response) {
                    $scope.EventList = response;
                });
            };
            //clear the filters
            $scope.clearFilters = function () {
                $scope.event = { EventChosen: chosenEv !== undefined ? Number(chosenEv) : "" };
                $scope.EventList = allEvents;
            };
            //event has been chosen. Set it as session event
            $scope.setEvent = function () {
                $scope.evID = $scope.event.EventChosen;
                var eventName = allEvents.filter(function (x) { return x.event_id == $scope.evID; })[0];
                $cookies.put('SessionEventID', $scope.evID);
                $cookies.put('SessionEventName', eventName.event_name);               

                $rootScope.sessionEvent = "Session Event: " + eventName.event_name + ".";
                $uibModalInstance.dismiss('cancel');
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