(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');
 //#region HWM
    STNControllers.controller('HWMCtrl', ['$scope', '$cookies', '$location', '$state', '$http', '$uibModal', '$filter', '$timeout', 'thisSite', 'thisSiteHWMs', 'allHWMTypes', 'allHWMQualities', 'allHorDatums', 'allMarkers', 'allHorCollMethods', 'allVertDatums', 'allVertColMethods', 'allEvents', 'MEMBER', HWMCtrl]);
    function HWMCtrl($scope, $cookies, $location, $state, $http, $uibModal, $filter, $timeout, thisSite, thisSiteHWMs, allHWMTypes, allHWMQualities, allHorDatums, allMarkers, allHorCollMethods, allVertDatums, allVertColMethods, allEvents, MEMBER) {
        if ($cookies.get('STNCreds') == undefined || $cookies.get('STNCreds') == "") {
            $scope.auth = false;
            $location.path('/login');
            } else {
            //global vars
            $scope.hwmCount = { total: thisSiteHWMs.length };
            $scope.SiteHWMs = thisSiteHWMs;
            // watch for the session event to change and update
            $scope.$watch(function () { return $cookies.get('SessionEventName'); }, function (newValue) {
                $scope.sessionEventName = newValue != undefined ? newValue : "All Events";
                $scope.sessionEventExists = $scope.sessionEventName != "All Events" ? true : false;
                if (newValue != undefined) {
                    $scope.SiteHWMs = thisSiteHWMs.filter(function (h) { return h.EVENT_ID == $cookies.get('SessionEventID'); });
                    $scope.hwmCount = { total: $scope.SiteHWMs.length };
                } else {
                    $scope.SiteHWMs = thisSiteHWMs;
                    $scope.hwmCount = { total: $scope.SiteHWMs.length };
                }
            });

            $scope.showHWMModal = function (HWMclicked) {
                var passAllLists = [allHWMTypes, allHWMQualities, allHorDatums, allHorCollMethods, allVertDatums, allVertColMethods, allMarkers, allEvents];
                var indexClicked = $scope.SiteHWMs.indexOf(HWMclicked);

                //modal
                var modalInstance = $uibModal.open({
                    templateUrl: 'HWMmodal.html',
                    controller: 'HWMmodalCtrl',
                        size: 'lg',
                        backdrop: 'static',
                        windowClass: 'rep-dialog',
                        resolve: {
                            allDropdowns: function () {
                                return passAllLists;
                            },
                            thisHWM: function () {
                                return HWMclicked != 0 ? HWMclicked: "empty";
                            },
                            hwmSite: function () {
                                return thisSite;
                            },
                            allMembers: function () {
                                $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookies.get('STNCreds');
                                $http.defaults.headers.common['Accept'] = 'application/json';
                                return MEMBER.getAll().$promise;
                            }
                       }
                });

                modalInstance.result.then(function (createdHWM) {
                    //is there a new HWM or just closed modal
                    if (createdHWM[1]== 'created') {
                        $scope.SiteHWMs.push(createdHWM[0]);
                        $scope.hwmCount.total = $scope.SiteHWMs.length;
                        }
                    if (createdHWM[1]== 'updated') {
                            //this is from edit -- refresh page?
                        var indexClicked = $scope.SiteHWMs.indexOf(HWMclicked);
                        $scope.SiteHWMs[indexClicked]= createdHWM[0];
                        }
                    if (createdHWM[1]== 'deleted') {
                        var indexClicked1 = $scope.SiteHWMs.indexOf(HWMclicked);
                        $scope.SiteHWMs.splice(indexClicked1, 1);
                        $scope.hwmCount.total = $scope.SiteHWMs.length;
                    }
                });
            }; //end showHWMModal function
        } //end stncreds good
    } //#endregion HWM

})();