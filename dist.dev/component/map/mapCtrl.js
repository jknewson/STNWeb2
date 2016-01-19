(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');
 //#region Map Controller
    STNControllers.controller('mapCtrl', ['$scope', '$rootScope', '$cookies', '$location', mapCtrl]);
    function mapCtrl($scope, $rootScope, $cookies, $location) {        
        if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
            $scope.auth = false;
            $location.path('/login');
        } else {
            $rootScope.thisPage = "Map";
            $rootScope.activeMenu = "map"; 
            $scope.map = "Welcome to the new STN Map Page!!";
           
        }
    }
    //#endregion Map Controller
})();