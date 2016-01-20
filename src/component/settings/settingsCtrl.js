(function () {
    'use strict';

    var SettingsControllers = angular.module('SettingsControllers');

    //#region Settings Controller
    //#region settings (abstract)
    SettingsControllers.controller('settingsCtrl', ['$scope', '$rootScope', '$cookies', '$location', '$state', function($scope, $rootScope, $cookies, $location, $state) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                $rootScope.thisPage = "Settings";
                $rootScope.activeMenu = "settings";
                $scope.settings = "Welcome to the new STN Settings Page!!";
                $scope.changeView = function (view) {
                    $state.go(view);
                };
            }
    }]);
    //#endregion settings (abstract)

}());
