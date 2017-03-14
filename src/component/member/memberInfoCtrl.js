(function () {
    'use strict';

    var SettingsControllers = angular.module('SettingsControllers');

    SettingsControllers.controller('memberInfoCtrl', ['$scope', '$cookies', '$location', '$http', '$uibModal', '$stateParams', '$filter', '$sce', 'allRoles', 'MEMBER', 'thisMember', 
        function ($scope, $cookies, $location, $http, $uibModal, $stateParams, $filter, $sce, allRoles, MEMBER, thisMember) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                //all things both new and existing member page will need
                $scope.aMember = {}; //holder for member (either coming in for edit, or being created for post
                $scope.matchingUsers = true;
                $scope.usernameTooltip = $sce.trustAsHtml('Active Directory user ID. ie: \'mpeppler\' not \'mpeppler@usgs.gov\'.');
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
                    modalInstance.result.then(function (nameToRemove) {
                        //yes, remove this keyword
                        var test;
                        //DELETE it
                        $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');

                        MEMBER.deleteMember({ id: nameToRemove.member_id }, function success(response) {
                            var delMem = {};
                            delMem.member_id = nameToRemove.member_id;
                            delMem.Name = nameToRemove.fname + " " + nameToRemove.lname;
                            var ag = $scope.agencyList.filter(function (a) { return a.agency_id == nameToRemove.agency_id; })[0];
                            var ro = allRoles.filter(function (r) { return r.role_id == nameToRemove.role_id; })[0];
                            delMem.Agency = ag.agency_name;
                            delMem.Role = ro.role_name;
                            $scope.memberList.splice($scope.memberList.indexOf(delMem), 1);
                            toastr.success("Member Deleted");
                        }, function error(errorResponse) {
                            toastr.error("Error: " + errorResponse.statusText);
                        }).$promise.then(function () {
                            $location.path('/Members/MembersList').replace();
                        });
                    });
                    //end modal
                };
                //#endregion DELETE Member click

                $scope.pass = {
                    newP: '',
                    confirmP: ''
                };
                $scope.newPass = "";

                //is this creating new member or editing existing?
                if (thisMember !== undefined) {

                    //check to see if the acct User is the same as the user they are looking at
                    $scope.matchingUsers = $stateParams.id == $scope.loggedInUser.ID ? true : false;

                    $scope.aMember = thisMember;
                    $scope.aMember.Role = allRoles.filter(function (r) { return r.role_id == $scope.aMember.role_id; })[0].role_name;
                    $scope.changePass = false;

                    //change to the user made, put it .. fired on each blur after change made to field
                    $scope.SaveOnBlur = function (v) {
                        if (v) {
                            //ensure they don't delete required field values                        
                            $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                            $http.defaults.headers.common.Accept = 'application/json';
                            MEMBER.update({ id: $scope.aMember.member_id }, $scope.aMember, function success(response) {
                                toastr.success("Member Updated");
                            }, function error(errorResponse) {
                                toastr.error("Error: " + errorResponse.statusText);
                            });                        
                        } else {
                            var errorModal = $uibModal.open({
                                template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                    '<div class="modal-body"><p>Please populate all required fields.</p></div>' +
                                    '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                controller:['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                    $scope.ok = function () {
                                        $uibModalInstance.close();
                                    };
                                }],
                                size: 'sm'
                            });                        
                        }
                    };//end SaveOnBlur

                    //password update section
                    $scope.changeMyPassBtn = function (evt) {
                        $scope.changePass === false ? $scope.changePass = true : $scope.changePass = false;
                    };

                    $scope.ChangePassword = function () {
                        //change User's password
                        if ($scope.pass.newP === "" || $scope.pass.confirmP === "") {
                            var errorModal = $uibModal.open({
                                template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                    '<div class="modal-body"><p>You must first enter a new password.</p></div>' +
                                    '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                controller:['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                    $scope.ok = function () {
                                        $uibModalInstance.close();
                                    };
                                }],
                                size: 'sm'
                            });                        
                        } else {
                            MEMBER.changePW({ username: $scope.aMember.username, newPass: $scope.pass.newP },
                                function success(response) {
                                    toastr.success("Password Updated");
                                    //update creds ONLY IF user logged in is == this updating member
                                    if ($scope.aMember.member_id == $scope.loggedInUser.member_id) {
                                        var enc = btoa($scope.aMember.username.concat(":", $scope.pass.newP));
                                        $cookies.put('STNCreds', enc);
                                        $cookies.put('STNUsername', $scope.aMember.username);
                                        $cookies.put('usersName', $scope.loggedInUser.Name);
                                        $cookies.put('mID', $scope.aMember.member_id);
                                        var roleName;
                                        switch ($scope.aMember.role_id) {
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
                                    }
                                    $scope.changePass = false;
                                    $scope.pass.newP = '';
                                    $scope.pass.confirmP = '';
                                },
                                function error(errorResponse) {
                                    toastr.error("Error: " + errorResponse.statusText);
                                }
                            );
                        }
                    }; //end ChangePassword()

                    $scope.DontChangePass = function () {
                        //nevermind,  clear input
                        $scope.changePass = false;
                    };
                } //end of $stateParams > 0 (existing)
                else {
                    //this is a new member being created
                    $scope.save = function (valid) {
                        if (valid) {
                            $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                            $http.defaults.headers.common.Accept = 'application/json';

                            MEMBER.addMember({ pass: $scope.pass.confirmP }, $scope.aMember, function success(response) {
                                toastr.success("Member Created");
                                //push this new member into the memberList
                                var nm = {};
                                nm.member_id = response.member_id;
                                nm.Name = response.fname + " " + response.lname;
                                var ag = $scope.agencyList.filter(function (a) { return a.agency_id == response.agency_id; })[0];
                                var ro = allRoles.filter(function (r) { return r.role_id == response.role_id; })[0];
                                nm.Agency = ag.agency_name;
                                nm.Role = ro.role_name;
                                $scope.memberList.push(nm);
                            }).$promise.then(function () {
                                $location.path('/Members/MembersList').replace();
                            });

                        }
                    }; // end save()
                }
            }
        }]);
}());