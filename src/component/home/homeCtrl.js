(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');
    //#region Home Controller 
    STNControllers.controller('HomeCtrl', ['$scope', '$rootScope', '$location', '$cookies', '$http', HomeCtrl]);
    function HomeCtrl($scope, $rootScope, $location, $cookies, $http) {
        if ($cookies.get('STNCreds') == undefined || $cookies.get('STNCreds') == "") {
            $scope.auth = false;
            $location.path('/login');
        } else {
            //good to go
            $rootScope.thisPage = "Home";
           

        }//end good to go
    }
    //#endregion Home Controller
})();