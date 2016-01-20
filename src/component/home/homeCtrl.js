(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('homeCtrl', ['$scope', '$rootScope', '$location', '$cookies', '$http', 
        function ($scope, $rootScope, $location, $cookies, $http) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                //good to go
                $rootScope.thisPage = "Home";
            }//end good to go
        }]);

})();