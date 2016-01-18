(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');
    //#region OBJECTIVE_POINT
    STNControllers.controller('objectivePointCtrl', ['$scope', '$cookies', '$location', '$state', '$http', '$uibModal', '$filter', '$timeout', 'OBJECTIVE_POINT', 'thisSite', 'thisSiteOPs', 'allOPTypes', 'allHorDatums', 'allHorCollMethods', 'allVertDatums', 'allVertColMethods', 'allOPQualities', objectivePointCtrl]);
    function objectivePointCtrl($scope, $cookies, $location, $state, $http, $uibModal, $filter, $timeout, OBJECTIVE_POINT, thisSite, thisSiteOPs, allOPTypes, allHorDatums, allHorCollMethods, allVertDatums, allVertColMethods, allOPQualities) {
        if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
            $scope.auth = false;
            $location.path('/login');
        } else {
            //global vars
            $scope.opCount = { total: thisSiteOPs.length };
            $scope.SiteObjectivePoints = thisSiteOPs;

            $scope.showOPModal = function (OPclicked) {
                var passAllLists =[allOPTypes, allHorDatums, allHorCollMethods, allVertDatums, allVertColMethods, allOPQualities];
                var indexClicked = $scope.SiteObjectivePoints.indexOf(OPclicked);

                //modal
                var modalInstance = $uibModal.open({
                    templateUrl : 'OPmodal.html',
                    controller: 'OPmodalCtrl',
                    size: 'lg',
                    backdrop: 'static',
                    windowClass: 'rep-dialog',
                    resolve: {
                        allDropdowns: function () {
                            return passAllLists;
                        },
                        thisOP: function () {
                            return OPclicked !== 0 ? OPclicked: "empty";
                        },
                        thisOPControls: function () {
                            if (OPclicked !== 0) {
                                return OBJECTIVE_POINT.getOPControls({id: OPclicked.OBJECTIVE_POINT_ID}).$promise;
                            }
                        },
                        opSite: function () {
                            return thisSite;
                        }
                    }
                });
                modalInstance.result.then(function (createdOP) {
                    //is there a new op or just closed modal
                    if (createdOP[1] == 'created') {
                        $scope.SiteObjectivePoints.push(createdOP[0]);
                        $scope.opCount.total = $scope.SiteObjectivePoints.length;
                    }
                    if (createdOP[1] == 'updated') {
                        //this is from edit -- refresh page?
                        var indexClicked = $scope.SiteObjectivePoints.indexOf(OPclicked);
                        $scope.SiteObjectivePoints[indexClicked] = createdOP[0];
                    }
                    if (createdOP[1] == 'deleted') {
                        var indexClicked1 = $scope.SiteObjectivePoints.indexOf(OPclicked);
                        $scope.SiteObjectivePoints.splice(indexClicked1, 1);
                        $scope.opCount.total = $scope.SiteObjectivePoints.length;
                    }
                });
            };
        }
    }
    //#endregion OBJECTIVE_POINT
})();