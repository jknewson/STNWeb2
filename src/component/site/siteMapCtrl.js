(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('siteMapCtrl', ['$scope', '$rootScope', '$cookies', '$location', '$state', 
        function ($scope, $rootScope, $cookies, $location, $state) {
            $scope.mapStuff = "here's the map accordion content";
        }]);//end controller
})();