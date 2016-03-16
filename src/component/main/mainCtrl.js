(function () {
    'use strict';

    var STNControllers = angular.module('STNControllers'); 
    STNControllers.controller('mainCtrl', ['$scope', '$rootScope', '$cookies', '$uibModal', '$location', '$state', 'SITE',
        function ($scope, $rootScope, $cookies, $uibModal, $location, $state, SITE) {
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
               
                $rootScope.searchTerm = { searchBy: 'bySiteNo' };
                $rootScope.IndexSearchSites = function () {
                    switch ($scope.searchTerm.searchBy) {
                        case 'bySiteNo':
                            SITE.query({ bySiteNo: $scope.searchTerm.term }, function success(resp) {
                                siteSearchResponse(resp);
                            }, function error(errorResponse) {
                                siteSearchResponse(errorResponse);
                            }).$promise;
                            break;
                        case 'bySiteId':
                            SITE.query({ bySiteId: $scope.searchTerm.term }).$promise.then(function (resp) {
                                siteSearchResponse(resp);
                            }), function (errorResponse) {
                                siteSearchResponse(errorResponse);
                            };
                            break;
                        case 'bySiteName':
                            SITE.query({ bySiteName: $scope.searchTerm.term }).$promise.then(function (resp) {
                                siteSearchResponse(resp);
                            }), function (errorResponse) {
                                siteSearchResponse(errorResponse);
                            };
                            break;
                    }
                };
                var siteSearchResponse = function (s) {
                    if (s.status !== undefined) {
                        //errorstatus show modal with error message 'no site found'
                        var errorModal = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>No site found. For more site search options, go to the Site Search navigation tab to search for site.</p></div>' +
                                '<div class="modal-footer"><button class="btn btn-primary" ng-click="ok()">OK</button></div>',
                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                $scope.ok = function () {
                                    $uibModalInstance.close();
                                };
                            }],
                            size: 'sm'

                        });
                        errorModal.result.then(function () {
                            $rootScope.searchTerm = { searchBy: 'bySiteNo' };
                        });

                    } else {
                        //reset search and go to the site dash
                        $rootScope.searchTerm = { searchBy: 'bySiteNo' };
                        $state.go('site.dashboard', { id: s.SITE_ID });
                    }
                };
                //$state.go('home');
                $state.go('map');
            }
        }]);
})();