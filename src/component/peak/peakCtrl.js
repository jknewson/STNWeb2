(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');
//#region PEAK
    STNControllers.controller('peakCtrl', ['$scope', '$cookies', '$location', '$state', '$http', '$uibModal', '$filter', '$timeout', 'thisSite', 'thisSitePeaks', 
        function peakCtrl($scope, $cookies, $location, $state, $http, $uibModal, $filter, $timeout, thisSite, thisSitePeaks) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                //global vars
                $scope.peakCount = { total: thisSitePeaks.length };
            }
        }]);
    //#endregion PEAK
})();