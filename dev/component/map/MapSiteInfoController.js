/**
 * Created by bdraper on 3/9/2016.
 */
(function () {
    'use strict';
    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('MapSiteInfoController', ['$scope', '$http', '$rootScope', '$cookies', '$location', 'SITE', 'leafletMarkerEvents', 'leafletBoundsHelpers', '$state',
        function ($scope, $http, $rootScope, $cookies, $location, SITE,  leafletMarkerEvents, leafletBoundsHelpers, $state) {
            $rootScope.$on('mapSiteClick', function (event, siteParts) {
                $scope.aSite = siteParts[0];
            });
            
        }]);//end controller function
})();
