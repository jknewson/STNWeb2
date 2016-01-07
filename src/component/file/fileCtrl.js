(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');
  //#region FILE
    STNControllers.controller('FileCtrl', ['$scope', '$cookies', '$location', '$state', '$http', '$uibModal', '$filter', '$timeout', 'thisSite', 'thisSiteFiles', FileCtrl]);
    function FileCtrl($scope, $cookies, $location, $state, $http, $uibModal, $filter, $timeout, thisSite, thisSiteFiles) {
        if ($cookies.get('STNCreds') == undefined || $cookies.get('STNCreds') == "") {
            $scope.auth = false;
            $location.path('/login');
        } else {
            //global vars
            $scope.fileCount = { total: thisSiteFiles.length };
        }
    }
    //#endregion FILE
})();