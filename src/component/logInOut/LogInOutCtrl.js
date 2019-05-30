(function () {
    'use strict';

    var LogInOutController = angular.module('LogInOutController', []);

    LogInOutController.controller('loginCtrl', ['$scope', '$state', '$location', '$uibModal', '$sce', '$http', '$cookies', '$rootScope', '$document', 'SERVER_URL', 'ENVIRONMENT', 'Login',
        function ($scope, $state, $location, $uibModal, $sce, $http, $cookies, $rootScope, $document, SERVER_URL, ENVIRONMENT, Login) {
            //login //
            $scope.newsTitle = "";
            $scope.newsFeed = [];
            $scope.newsFeed = [];
            var areServicesRunning;
            Login.getNewsFeed({},
                function success(response) {
                    $scope.newsTitle = response.title;
                    var paragraphTags = [];
                    paragraphTags = response.body.storage.value.split("<p>");
                    paragraphTags.forEach(function (p) {
                        $scope.newsFeed.push($sce.trustAsHtml(p));
                        areServicesRunning = true;
                    });
                }, function error(errorResponse) {
                    $scope.newsTitle = "STN Notices";
                    $scope.newsFeed.push("Currently not available.");
                    areServicesRunning = false;
                }
            );
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
            Date.prototype.addHours = function (h) {
                this.setHours(this.getHours() + h);
                return this;
            };
            $scope.serverURL = SERVER_URL;
            $rootScope.environment = ENVIRONMENT;
            $scope.submit = function () {
                // checking if email was included
                var userName = $scope.username
                if (userName.includes('@')) {
                    var n = userName.indexOf('@');
                    userName = userName.substring(0, n != -1 ? n : s.length);
                }

                //userName = userName.substring(0, userName.indexOf('@'));

                //$scope.sub = true;
                $rootScope.stateIsLoading.showLoading = true;// loading..
                var postData = {
                    "username": userName,
                    "password": $scope.password
                };
                var up = userName + ":" + $scope.password;
                $http.defaults.headers.common.Authorization = 'Basic ' + btoa(up);
                $http.defaults.headers.common.Accept = 'application/json';

                Login.login({},
                    function success(response) {
                        var user = response;
                        if (user !== undefined) {
                            //set user cookies (cred, username, name, role
                            var usersNAME = user.fname + " " + user.lname;
                            var enc = btoa(userName.concat(":", $scope.password));
                            //set expiration on cookies
                            var expireDate = new Date().addHours(8);
                            $cookies.put('STNCreds', enc, { expires: expireDate });
                            $cookies.put('STNUsername', userName);
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
                            $rootScope.userRole = $cookies.get('usersRole');
                            if ($rootScope.returnToState !== undefined) {
                                $state.go($rootScope.returnToState, { id: $rootScope.returnToStateParams });
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
                $rootScope.userID = undefined;
                $rootScope.userRole = undefined;
                $rootScope.usersName = undefined;
                $rootScope.environment = undefined;

                $location.path('/login');
            };
        }]);
}());
