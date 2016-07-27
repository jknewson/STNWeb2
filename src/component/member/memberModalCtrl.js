(function () {
    'use strict';

    var SettingsControllers = angular.module('SettingsControllers');

    SettingsControllers.controller('memberModalCtrl', ['$scope', '$rootScope', '$cookies', '$http', '$uibModal', '$uibModalInstance', '$filter', '$sce', 'roleList', 'agencyList', 'thisMember', 'MEMBER',
        function ($scope, $rootScope, $cookies, $http, $uibModal, $uibModalInstance, $filter, $sce, roleList, agencyList, thisMember, MEMBER) {
            //all things both new and existing member page will need
            $scope.aMember = {}; //holder for member (either coming in for edit, or being created for post
            $scope.matchingUsers = true;
            $scope.usernameTooltip = $sce.trustAsHtml('Active Directory user ID. ie: \'mpeppler\' not \'mpeppler@usgs.gov\'.');
            $scope.agencyList = agencyList;
            $scope.pass = {
                newP: '',
                confirmP: ''
            };
            $scope.newPass = "";
            //populate roles based on who's logged in
            $scope.loggedInUser = {};
            $scope.loggedInUser.Name = $cookies.get('usersName'); //User's NAME
            $scope.loggedInUser.ID = $cookies.get('mID');
            $scope.loggedInUser.Role = $cookies.get('usersRole');

            //populate role list based on who's logged in (admin can assign manager or field, manager can only assign field
            switch ($scope.loggedInUser.Role) {
                case 'Admin':
                    $scope.roleList = roleList.filter(function (r) { return r.role_id <= 3; });
                    break;
                case 'Manager':
                    $scope.roleList = roleList.filter(function (r) { return r.role_id == 3; });
                    break;
            }
            //is this creating new member or editing existing?
            if (thisMember != "empty") {
                //check to see if the acct User is the same as the user they are looking at
                $scope.matchingUsers = thisMember.member_id == $scope.loggedInUser.ID ? true : false;

                $scope.aMember = angular.copy(thisMember);
                $scope.aMember.Role = roleList.filter(function (r) { return r.role_id == $scope.aMember.role_id; })[0].role_name;
                $scope.changePass = false;

                
                //password update section
                $scope.changeMyPassBtn = function (evt) {
                    $scope.changePass === false ? $scope.changePass = true : $scope.changePass = false;
                };


                $scope.DontChangePass = function () {
                    //nevermind,  clear input
                    $scope.changePass = false;
                };
            } //end existing mmeber edit
            else {
                //new member being created.. 
                $scope.aMember = {};
                // if there's only 1 in the roleList, then this member is a field person
                if ($scope.roleList.length == 1)
                    $scope.aMember.role_id = $scope.roleList[0].role_id;
            }

            $scope.create = function (valid) {
                if (valid) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    $scope.aMember.password = btoa($scope.pass.confirmP);
                    var createdMember = {};
                    MEMBER.save($scope.aMember, function success(response) {
                        toastr.success("Member Created");
                        //push this new member into the memberList                        
                        createdMember = response;
                        var ag = $scope.agencyList.filter(function (a) { return a.agency_id == response.agency_id; })[0];
                        var ro = roleList.filter(function (r) { return r.role_id == response.role_id; })[0];
                        createdMember.Agency = ag.agency_name;
                        createdMember.Role = ro.role_name;
                        //$scope.memberList.push(nm);
                    }, function error(errorResponse) {
                        toastr.error("Error creating new member: " + errorResponse.statusText);
                    }).$promise.then(function () {
                        var sendBack = [createdMember, 'created'];
                        $uibModalInstance.close(sendBack);
                    });
                }
            }; // end create()
            
            $scope.save = function (valid) {
                if (valid) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    if ($scope.pass.newP !== undefined) $scope.aMember.password = btoa($scope.pass.newP);
                    var updatedMember = {};
                    var formattedMember = angular.copy($scope.aMember);
                    
                    delete formattedMember.Role; delete formattedMember.Agency;
                    MEMBER.update({ id: formattedMember.member_id }, formattedMember, function success(response) {
                        updatedMember = response;
                        var ag = $scope.agencyList.filter(function (a) { return a.agency_id == response.agency_id; })[0];
                        var ro = roleList.filter(function (r) { return r.role_id == response.role_id; })[0];
                        updatedMember.Agency = ag.agency_name;
                        updatedMember.Role = ro.role_name;
                        
                        //check if this is the member logged in and update the cookies if so
                        if ($scope.loggedInUser.ID == response.member_id) {
                            if ($scope.aMember.password !== undefined) {
                                var enc = btoa(updatedMember.username.concat(":", $scope.pass.newP));
                                $cookies.put('STNCreds', enc);
                            }
                            $cookies.put('STNUsername', updatedMember.username);
                            var usersNAME = updatedMember.fname + " " + updatedMember.lname;
                            $cookies.put('usersName', usersNAME);
                        }
                        toastr.success("Member Updated");
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    }).$promise.then(function () {
                        var sendBack = [updatedMember, 'updated'];
                        $uibModalInstance.close(sendBack);
                    });
                } else {
                    var errorModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>Please populate all required fields.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                }
            };//end Save

            //#region DELETE Member click
            $scope.DeleteMember = function (mem) {
                //modal
                var modalInstance = $uibModal.open({
                    templateUrl: 'removemodal.html',
                    controller: 'ConfirmModalCtrl',
                    size: 'sm',
                    resolve: {
                        nameToRemove: function () {
                            return mem;
                        },
                        what: function () {
                            return "Member";
                        }
                    }
                });
                modalInstance.result.then(function (memToRemove) {
                    //DELETE it
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');

                    MEMBER.deleteMember({ id: memToRemove.member_id }, function success(response) {
                        toastr.success("Member Deleted");
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    }).$promise.then(function () {                        
                        $uibModalInstance.close(["de", 'deleted']);
                    });
                });
                //end modal
            };
            //#endregion DELETE Member click
            //cancel modal
            $scope.cancel = function () {
                $uibModalInstance.close();                
            };
            $rootScope.stateIsLoading = { showLoading: false }; //Loading...
        }]);
}());