(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('hwmCtrl', ['$scope', '$rootScope', '$cookies', '$location', '$state', '$http', '$uibModal', '$filter', '$timeout', 'thisSite', 'thisSiteHWMs', 'HWM_Service', 'allAgencies', 'allHWMTypes', 'allHWMQualities', 'allHorDatums', 'allMarkers', 'allHorCollMethods', 'allVertDatums', 'allVertColMethods', 'allEvents', 'allFileTypes', 'MEMBER', 'HWM',
        function ($scope, $rootScope, $cookies, $location, $state, $http, $uibModal, $filter, $timeout, thisSite, thisSiteHWMs, HWM_Service, allAgencies, allHWMTypes, allHWMQualities, allHorDatums, allMarkers, allHorCollMethods, allVertDatums, allVertColMethods, allEvents, allFileTypes, MEMBER, HWM) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
                } else {
                //global vars
                $scope.hwmCount = { total: thisSiteHWMs.length };

                $scope.SiteHWMs = thisSiteHWMs;
                HWM_Service.setAllSiteHWMs($scope.SiteHWMs);
                // watch for the session event to change and update
                $scope.$watch(function () { return $cookies.get('SessionEventName'); }, function (newValue) {
                    $scope.sessionEventName = newValue !== undefined ? newValue : "All Events";
                    $scope.sessionEventExists = $scope.sessionEventName != "All Events" ? true : false;
                    if (newValue !== undefined) {
                        $scope.SiteHWMs = thisSiteHWMs.filter(function (h) { return h.event_id == $cookies.get('SessionEventID'); });
                        $scope.hwmCount = { total: $scope.SiteHWMs.length };
                    } else {
                        $scope.SiteHWMs = thisSiteHWMs;
                        $scope.hwmCount = { total: $scope.SiteHWMs.length };
                    }
                });

                $scope.showHWMModal = function (HWMclicked) {
                    var hwmFileTypes = allFileTypes.filter(function (hft) {
                        //Photo (1), Historic (3), Field Sheets (4), Level Notes (5), Other (7), Link (8), Sketch (10)
                        return hft.filetype === 'Photo' || hft.filetype === 'Historic Citation' || hft.filetype === 'Field Sheets' || hft.filetype === 'Level Notes' ||
                            hft.filetype === 'Other' || hft.filetype === 'Link' || hft.filetype === 'Sketch';
                    });
                    var passAllLists = [allHWMTypes, allHWMQualities, allHorDatums, allHorCollMethods, allVertDatums, allVertColMethods, allMarkers, allEvents, hwmFileTypes];
                    var indexClicked = $scope.SiteHWMs.indexOf(HWMclicked);
                    $rootScope.stateIsLoading.showLoading = true; // loading..
                    //modal
                    var modalInstance = $uibModal.open({
                        templateUrl: 'HWMmodal.html',
                        controller: 'hwmModalCtrl',
                            size: 'lg',
                            backdrop: 'static',
                            keyboard: false,
                            windowClass: 'rep-dialog',
                            resolve: {
                                allDropdowns: function () {
                                    return passAllLists;
                                },
                                thisHWM: function () {
                                    return HWMclicked !== 0 ? HWMclicked: "empty";
                                },
                                allSiteHWMs: function(){
                                    return $scope.SiteHWMs;
                                },
                                hwmApproval: function () {
                                    if (HWMclicked !== 0 && (HWMclicked.approval_id !== undefined && HWMclicked.approval_id > 0)) {
                                        return HWM.getHWMApproval({ id: HWMclicked.hwm_id }).$promise;
                                    }
                                },
                                hwmSite: function () {
                                    return thisSite;
                                },
                                agencyList: function () {
                                    return allAgencies;
                                },
                                allMembers: function () {
                                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                                    $http.defaults.headers.common.Accept = 'application/json';
                                    return MEMBER.getAll().$promise;
                                }
                           }
                    });

                    modalInstance.result.then(function (createdHWM) {
                        //is there a new HWM or just closed modal
                        if (createdHWM[1]== 'created') {
                            $scope.SiteHWMs.push(createdHWM[0]);
                            HWM_Service.setAllSiteHWMs($scope.SiteHWMs);
                            $scope.hwmCount.total = $scope.SiteHWMs.length;
                        }
                        if (createdHWM[1] === undefined) {
                            //this is from edit -- refresh page?
                            //update the list
                            var indexClicked = $scope.SiteHWMs.indexOf(HWMclicked);
                            $scope.SiteHWMs[indexClicked] = createdHWM;
                            HWM_Service.setAllSiteHWMs($scope.SiteHWMs);
                        }
                        if (createdHWM[1]== 'deleted') {
                            var indexClicked1 = $scope.SiteHWMs.indexOf(HWMclicked);
                            $scope.SiteHWMs.splice(indexClicked1, 1);
                            $scope.hwmCount.total = $scope.SiteHWMs.length;
                            HWM_Service.setAllSiteHWMs($scope.SiteHWMs);
                        }
                    });
                }; //end showHWMModal function
            }//end stncreds good
        }]);

})();