(function () {
   'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('peakCtrl', ['$scope', '$cookies', '$location', '$state', '$http', '$uibModal', '$filter', '$timeout', 'thisSite', 'thisSitePeaks', 
        function ($scope, $cookies, $location, $state, $http, $uibModal, $filter, $timeout, thisSite, thisSitePeaks) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                //global vars
                $scope.peakCount = { total: thisSitePeaks.length };
            }
        }]);
})();