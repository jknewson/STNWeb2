(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('homeCtrl', ['$scope', '$state', '$rootScope', '$location', '$cookies', '$http', 
        function ($scope, $state, $rootScope, $location, $cookies, $http) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                //good to go
                $rootScope.thisPage = "Home";
                //$scope.test = function () {
                //    $state.go('site.dashboard', { id: 0, latitude: 44.323, longitude: -90.3939 });
                //}
            }//end good to go
        }]);

})();