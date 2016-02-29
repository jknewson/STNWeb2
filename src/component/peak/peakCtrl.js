(function () {
   'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('peakCtrl', ['$scope', '$cookies', '$location', '$state', '$http', '$uibModal', '$filter', '$timeout', 'thisSite', 'thisSitePeaks', 'allVertDatums', 'HWM', 'MEMBER', 'SITE',
        function ($scope, $cookies, $location, $state, $http, $uibModal, $filter, $timeout, thisSite, thisSitePeaks, allVertDatums, HWM, MEMBER, SITE) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                //global vars
                $scope.peakCount = { total: thisSitePeaks.length };
                $scope.SitePeaks = thisSitePeaks;

                //for this to work, I'd need to bring in HWMs and Data Files(through sensors since that holds event) for this event and filter based on those .. or just add eventid to peak
                $scope.$watch(function () { return $cookies.get('SessionEventName'); }, function (newValue) {
                    $scope.sessionEventName = newValue !== undefined ? newValue : "All Events";
                    $scope.sessionEventExists = $scope.sessionEventName != "All Events" ? true : false;
                //    if (newValue !== undefined) {
                //        $scope.SitePeaks = thisSitePeaks.filter(function (p) { return h.EVENT_ID == $cookies.get('SessionEventID'); });
                //        $scope.hwmCount = { total: $scope.SiteHWMs.length };
                //    } else {
                //        $scope.SiteHWMs = thisSiteHWMs;
                //        $scope.hwmCount = { total: $scope.SiteHWMs.length };
                //    }
                });
                $scope.showPeakModal = function (peakClicked) {                    
                    var indexClicked = $scope.SitePeaks.indexOf(peakClicked);

                    //modal
                    var modalInstance = $uibModal.open({
                        templateUrl: 'PEAKmodal.html',
                        controller: 'peakModalCtrl',
                        size: 'lg',
                        backdrop: 'static',
                        windowClass: 'rep-dialog',
                        resolve: {
                            allVertDatums: function () {
                                return allVertDatums;
                            },
                            thisPeak: function () {
                                return peakClicked !== 0 ? peakClicked : "empty";
                            },                            
                            peakSite: function () {
                                return thisSite;
                            },
                            allMembers: function () {
                                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                                $http.defaults.headers.common.Accept = 'application/json';
                                return MEMBER.getAll().$promise;
                            },
                            allEventHWMs: function () {
                                return HWM.getFilteredHWMs({ Event: $cookies.get('SessionEventID'), EventStatus: 0 }).$promise;
                            },
                            allSiteSensors: function () {
                                return SITE.getSiteSensors({ id: thisSite.SITE_ID }).$promise;
                            },
                            allSiteFiles: function () {
                                return SITE.getSiteFiles({ id: thisSite.SITE_ID }).$promise;
                            }
                        }
                    });

                    modalInstance.result.then(function (createdPeak) {
                        //is there a new HWM or just closed modal
                        //if (createdHWM[1] == 'created') {
                        //    $scope.SiteHWMs.push(createdHWM[0]);
                        //    $scope.hwmCount.total = $scope.SiteHWMs.length;
                        //}
                        //if (createdHWM[1] == 'updated') {
                        //    //this is from edit -- refresh page?
                        //    var indexClicked = $scope.SiteHWMs.indexOf(HWMclicked);
                        //    $scope.SiteHWMs[indexClicked] = createdHWM[0];
                        //}
                        //if (createdHWM[1] == 'deleted') {
                        //    var indexClicked1 = $scope.SiteHWMs.indexOf(HWMclicked);
                        //    $scope.SiteHWMs.splice(indexClicked1, 1);
                        //    $scope.hwmCount.total = $scope.SiteHWMs.length;
                        //}
                    });
                }; //end showHWMModal function

            }
        }]);
})();