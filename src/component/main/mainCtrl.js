(function () {
    'use strict';

    var STNControllers = angular.module('STNControllers'); 
    STNControllers.controller('mainCtrl', ['$scope', '$rootScope', '$document', '$cookies', '$uibModal', '$location', '$state',
        function ($scope, $rootScope, $document, $cookies, $uibModal, $location, $state) {
            $rootScope.isAuth = {};        
            $rootScope.activeMenu = 'home'; //scope var for setting active class
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $rootScope.isAuth.val = false;
                $location.path('/login');
            } else {
                if ($document[0].documentMode !== undefined) {
                    var browserInstance = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Warning</h3></div>' +
                                   '<div class="modal-body"><p>This application uses functionality that is not completely supported by Internet Explorer. The preferred browser is Chrome (bison connect).</p></div>' +
                                   '<div class="modal-footer"><button class="btn btn-primary" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                };
                $rootScope.isAuth.val = true;
                $rootScope.usersName = $cookies.get('usersName');
                $rootScope.userID = $cookies.get('mID');
                var EventName = $cookies.get('SessionEventName');
                if (EventName !== null && EventName !== undefined)
                    $rootScope.sessionEvent = "Session Event: " + EventName + ".";                
                
                $state.go('map');
            }
        }]);
})();