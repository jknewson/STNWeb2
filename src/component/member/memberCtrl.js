(function () {
    'use strict';

    var SettingsControllers = angular.module('SettingsControllers');

    SettingsControllers.controller('memberCtrl', ['$scope', '$rootScope', '$cookies', '$location', '$http', '$filter', '$uibModal', 'MEMBER', 'allRoles', 'allAgencies', 
        function ($scope, $rootScope, $cookies, $location, $http, $filter, $uibModal, MEMBER, allRoles, allAgencies) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                //all things both new and existing member page will need
                $rootScope.thisPage = "Settings/Members";
                // change sorting order
                $scope.sort_by = function (newSortingOrder) {
                    if ($scope.sortingOrder == newSortingOrder) {
                        $scope.reverse = !$scope.reverse;
                    }
                    $scope.sortingOrder = newSortingOrder;
                    // icon setup
                    $('th i').each(function () {
                        // icon reset
                        $(this).removeClass().addClass('glyphicon glyphicon-sort');
                    });
                    if ($scope.reverse) {
                        $('th.' + newSortingOrder + ' i').removeClass().addClass('glyphicon glyphicon-chevron-up');
                    } else {
                        $('th.' + newSortingOrder + ' i').removeClass().addClass('glyphicon glyphicon-chevron-down');
                    }
                };

                //$scope.loggedInUser = {};
                //$scope.loggedInUser.Name = $cookies.get('usersName'); //User's NAME
                //$scope.loggedInUser.ID = $cookies.get('mID');
                //$scope.loggedInUser.Role = $cookies.get('usersRole');

                ////populate role list based on who's logged in (admin can assign manager or field, manager can only assign field
                //switch ($scope.loggedInUser.Role) {
                //    case 'Admin':
                //        $scope.roleList = allRoles.filter(function (r) { return r.role_id <= 3; });
                //        break;
                //    case 'Manager':
                //        $scope.roleList = allRoles.filter(function (r) { return r.role_id == 3; });
                //        break;
                //}
                //create/view member was clicked
                $scope.showMemberModal = function (memberClicked) {
                    var indexClicked = $scope.memberList.indexOf(memberClicked);
                    $rootScope.stateIsLoading = { showLoading: true }; //Loading...
                    //modal
                    var modalInstance = $uibModal.open({
                        templateUrl: 'memberModal.html',
                        controller: 'memberModalCtrl',
                        size: 'lg',
                        backdrop: 'static',
                        keyboard: false,
                        windowClass: 'rep-dialog',
                        resolve: {                            
                            thisMember: function () {
                                return memberClicked !== 0 ? memberClicked : "empty";
                            },                            
                            agencyList: function () {
                                return allAgencies;
                            },
                            roleList: function () {
                                return allRoles;
                            }
                        }
                    });
                    modalInstance.result.then(function (createdMember) {
                        //is there a new op or just closed modal
                        $rootScope.stateIsLoading = { showLoading: false }; //Loading...
                        if (createdMember !== undefined) {
                            if (createdMember[1] == 'created') {
                                $scope.memberList.push(createdMember[0]);
                            }
                            if (createdMember[1] === 'updated') {
                                //update the list
                                $scope.memberList[indexClicked] = createdMember[0];
                            }
                            //if (createdMember[1] == 'deleted') {
                            //    var indexClicked1 = $scope.SiteObjectivePoints.indexOf(OPclicked);
                            //    $scope.SiteObjectivePoints.splice(indexClicked1, 1);
                            //    $scope.opCount.total = $scope.SiteObjectivePoints.length;
                            //}
                        }
                    });                    
                }
                $scope.agencyList = allAgencies;
                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                $http.defaults.headers.common.Accept = 'application/json';
                MEMBER.getAll().$promise.then(function (response) {
                    $scope.memberList = [];
                    for (var x = 0; x < response.length; x++) {
                        var eachM = response[x];                        
                        var ag = $scope.agencyList.filter(function (a) { return a.agency_id == response[x].agency_id; })[0];
                        var ro = allRoles.filter(function (r) { return r.role_id == response[x].role_id; })[0];
                        eachM.Agency = ag.agency_name;
                        eachM.Role = ro.role_name;

                        $scope.memberList.push(eachM);
                    }
                });
            }
        }]);
}());