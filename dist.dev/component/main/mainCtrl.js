(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');
    //#region MAIN Controller 
    STNControllers.controller('mainCtrl', ['$scope', '$rootScope', '$cookies', '$uibModal', '$location', '$state', mainCtrl]);
    function mainCtrl($scope, $rootScope, $cookies, $uibModal, $location, $state) {
        $rootScope.isAuth = {};        
        $rootScope.activeMenu = 'home'; //scope var for setting active class
        if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
            $rootScope.isAuth.val = false;
            $location.path('/login');
        } else {
            $rootScope.isAuth.val = true;
            $rootScope.usersName = $cookies.get('usersName');
            $rootScope.userID = $cookies.get('mID');
            var EventName = $cookies.get('SessionEventName');
            if (EventName !== null && EventName !== undefined)
                $rootScope.sessionEvent = "Session Event: " + EventName + "."; 
           // $rootScope.sessionTeam = "";
            $state.go('home');

            $scope.status = {
                isopen: false
            };
            $scope.toggleDropdown = function ($event) {
                $event.preventDefault();
                $event.stopPropagation();
                $scope.status.isopen = !$scope.status.isopen;
            };
        }
    }
    //#endregion MAIN Controller
})();