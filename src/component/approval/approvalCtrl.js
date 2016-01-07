(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');
 //#region Approval Controller
    STNControllers.controller('ApprovalCtrl', ['$scope', '$cookies', '$rootScope', '$location', '$http', 'stateList', 'instrumentList',  'allSensorTypes', 'HWM', 'DATA_FILE', 'INSTRUMENT', 'MEMBER', 'SITE', ApprovalCtrl]);
    function ApprovalCtrl($scope, $cookies, $rootScope, $location, $http, stateList, instrumentList, allSensorTypes, HWM, DATA_FILE, INSTRUMENT, MEMBER, SITE) {
        if ($cookies.get('STNCreds') == undefined || $cookies.get('STNCreds') == "") {
            $scope.auth = false;
            $location.path('/login');
        } else {
            //TODO: Who can do approvals????????
            $rootScope.thisPage = "Approval";
            $rootScope.activeMenu = "approval";

            // watch for the session event to change and update
            $scope.$watch(function () { return $cookies.get('SessionEventName'); }, function (newValue) {
                $scope.sessionEvent = $cookies.get('SessionEventName') != null ? $cookies.get('SessionEventName') : "All Events";
            });
            
            $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookies.get('STNCreds');
            $http.defaults.headers.common['Accept'] = 'application/json';
            MEMBER.getAll(function success(response) {
                $scope.allMembers = response;
            }).$promise;

            $scope.allStates = stateList;
            $scope.allInstruments = instrumentList;
            $scope.allSensorTypes = allSensorTypes;
            $scope.ChosenEvent = {};
            $scope.ChosenState = {};
            $scope.ChosenMember = {};
            $scope.unApprovedHWMs = []; $scope.showHWMbox = false;
            $scope.unApprovedDFs = []; $scope.showDFbox = false;

            $scope.search = function () {
                //clear contents in case they are searching multiple times
                $scope.unApprovedHWMs = []; $scope.showHWMbox = false;
                $scope.unApprovedDFs = []; $scope.showDFbox = false;
                var evID = $cookies.get('SessionEventID') != null ? $cookies.get('SessionEventID') : 0;
                //var evID = this.ChosenEvent.id != undefined ? this.ChosenEvent.id : 0;
                var sID = this.ChosenState.id != undefined ? this.ChosenState.id : 0;
                var mID = this.ChosenMember.id != undefined ? this.ChosenMember.id : 0;

                //go get the HWMs and DataFiles that need to be approved
                $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookies.get('STNCreds');
                $http.defaults.headers.common['Accept'] = 'application/json';
                HWM.getUnapprovedHWMs({ IsApproved: 'false', Event: evID, TeamMember: mID, State: sID }, function success(response) {
                    $scope.unApprovedHWMs = response.HWMs;
                    $scope.showHWMbox = true;

                }, function error(errorResponse) {
                    alert("Error: " + errorResponse.statusText);
                });
                DATA_FILE.getUnapprovedDFs({ IsApproved: 'false', Event: evID, Processor: mID, State: sID }, function success(response1) {
                    var DFs = response1;
                    //need sensor and site info
                    angular.forEach(DFs, function (df) {
                        var thisdfInst = $scope.allInstruments.filter(function (i) { return i.INSTRUMENT_ID == df.INSTRUMENT_ID; })[0];
                        var formattedDF = {};
                        var siteID = thisdfInst.SITE_ID;
                        var senType = $scope.allSensorTypes.filter(function (s) { return s.SENSOR_TYPE_ID == thisdfInst.SENSOR_TYPE_ID; })[0];
                        formattedDF.InstrID = thisdfInst.INSTRUMENT_ID;
                        SITE.query({ id: siteID }).$promise.then(function (response2) {
                            formattedDF.stringToShow = response2.SITE_NO + ": " + senType.SENSOR;
                            $scope.unApprovedDFs.push(formattedDF);
                        });
                    });
                    $scope.showDFbox = true;
                }, function error(errorResponse1) {
                    alert("Error: " + errorResponse1.statusText);
                });
            };
        }
    }
    //#endregion Approval Controller

})();