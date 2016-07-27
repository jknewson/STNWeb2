(function () {
    'use strict';

    var LogInOutController = angular.module('LogInOutController', []);

    LogInOutController.controller('loginCtrl', ['$scope', '$state', '$location', '$uibModal', '$http', '$cookies', '$rootScope', '$document', 'SERVER_URL', 'Login', 
        function ($scope, $state, $location, $uibModal, $http, $cookies, $rootScope, $document, SERVER_URL, Login) {
            //login //
            //#region CAP lock Check
            $('[type=password]').keypress(function (e) {
                var $password = $(this),
                    tooltipVisible = $('.tooltip').is(':visible'),
                    s = String.fromCharCode(e.which);

                if (s.toUpperCase() === s && s.toLowerCase() !== s && !e.shiftKey) {
                    if (!tooltipVisible)
                        $password.tooltip('show');
                } else {
                    if (tooltipVisible)
                        $password.tooltip('hide');
                }

                //hide the tooltip when moving away from password field
                $password.blur(function (e) {
                    $password.tooltip('hide');
                });
            });
            //#endregion CAP lock Check

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
            }
            
            $scope.serverURL = SERVER_URL;
            $scope.submit = function () {
                //$scope.sub = true;
                $rootScope.stateIsLoading.showLoading = true;// loading..
                var postData = {
                    "username": $scope.username,
                    "password": $scope.password
                };
                var up = $scope.username + ":" + $scope.password;
                $http.defaults.headers.common.Authorization = 'Basic ' + btoa(up);
                $http.defaults.headers.common.Accept = 'application/json';

                Login.login({}, 
                    function success(response) {
                        var user = response;
                        if (user !== undefined) {
                            //set user cookies (cred, username, name, role
                            var usersNAME = user.fname + " " + user.lname;
                            var enc = btoa($scope.username.concat(":", $scope.password));
                            $cookies.put('STNCreds', enc);
                            $cookies.put('STNUsername', $scope.username);
                            $cookies.put('usersName', usersNAME);
                            $cookies.put('mID', user.member_id);
                            var roleName;
                            switch (user.role_id) {
                                case 1:
                                    roleName = "Admin";
                                    break;
                                case 2:
                                    roleName = "Manager";
                                    break;
                                case 3:
                                    roleName = "Field";
                                    break;
                                case 4:
                                    roleName = "Public";
                                    break;
                                default:
                                    roleName = "CitizenManager";
                                    break;
                            }
                            $cookies.put('usersRole', roleName);

                            $rootScope.isAuth.val = true;
                            $rootScope.usersName = usersNAME;
                            $rootScope.userID = user.member_id;
                            if ($rootScope.returnToState !== undefined) {
                                $state.go($rootScope.returnToState, {id: $rootScope.returnToStateParams});
                            } else {
                                $state.go('map');                                    
                            }
                        }
                        else {
                            $rootScope.stateIsLoading.showLoading = false;// loading..
                            $scope.error = "Login Failed";
                        }
                    },
                    function error(errorResponse) {
                        $rootScope.stateIsLoading.showLoading = false;// loading..
                        //modal for error
                        var modalInstance = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                       '<div class="modal-body"><p>There was an error.</p><p>Error: {{status}} - {{statusText}}</p></div>' +
                                       '<div class="modal-footer"><button class="btn btn-primary" ng-click="ok()">OK</button></div>',
                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                $scope.ok = function () {
                                    $uibModalInstance.close();
                                };
                                $scope.status = errorResponse.status;
                                $scope.statusText = errorResponse.statusText;
                            }],
                            size: 'sm'
                        });
                        modalInstance.result.then(function (fieldFocus) {
                            $location.path('/login');
                        });
                    }
                );
            };
        }]);

    //logOut
    LogInOutController.controller('logoutCtrl', ['$scope', '$rootScope', '$cookies', '$location', 
        function ($scope, $rootScope, $cookies, $location) {
            $scope.logout = function () {
                //clear $cookies
                $cookies.remove('STNCreds');
                $cookies.remove('STNUsername');
                $cookies.remove('usersName');
                $cookies.remove('usersRole');
                $cookies.remove('mID');
                $cookies.remove('SessionEventID');
                $cookies.remove('SessionEventName');
                //clear $rootScope
                $rootScope.thisPage = undefined;
                $rootScope.returnToState = undefined;
                $rootScope.returnToStateParams = undefined;
                $rootScope.stateIsLoading = undefined;
                $rootScope.activeMenu = undefined;
                $rootScope.sessionEvent = undefined;
                $rootScope.isAuth = undefined;
                $rootScope.searchTerm = undefined;
                $rootScope.searchParams = undefined;
                $rootScope.approvalSearch = undefined;
                $location.path('/login');
            };
        }]);
}());
