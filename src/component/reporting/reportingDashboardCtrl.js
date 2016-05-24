(function () {
    'use strict';

    var STNControllers = angular.module('STNControllers');
    STNControllers.controller('reportingDashCtrl', ['$scope', '$cookies', '$filter', '$uibModal', '$state', '$http', 'CONTACT', 'MEMBER', 'allReportsAgain', 
        function ($scope, $cookies, $filter, $uibModal, $state, $http, CONTACT, MEMBER, allReportsAgain) {
            $scope.reportsToDate = allReportsAgain;
            $scope.todayRpts = []; $scope.yesterdayRpts = []; $scope.pickDateRpts = []; $scope.pickAdateReports = false;
            $scope.today = new Date();
            $scope.today.setHours(0, 0, 0, 0);
            $scope.yesterday = new Date($scope.today);
            $scope.yesterday.setDate($scope.today.getDate() - 1);
            $scope.today = $scope.today.toISOString().substr(0, 10);
            $scope.yesterday = $scope.yesterday.toISOString().substr(0,10);

            $scope.THIS_DATE = {};
            //View Report button clicked, get stuff and make a pdf 
            $scope.ViewReport = function (r) {
                //modal
                var modalInstance = $uibModal.open({
                    templateUrl: 'ViewReport.html',
                    controller: 'reportModalCtrl',
                    size: 'lg',
                    windowClass: 'rep-dialog',
                    resolve: {  //TODO :: Change this to get ReportModel --includes contacts
                        report: function () {
                            return r;
                        },
                        submitPerson: function () {
                            $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                            $http.defaults.headers.common.Accept = 'application/json';
                            var member = {};
                            MEMBER.query({ id: r.member_id }, function success(response) {
                                member.mem = response;
                                var memberAgency = $scope.agencies.filter(function (a) { return a.agency_id == member.mem.agency_id; })[0];
                                member.agency_name = memberAgency.agency_name;
                                member.agency_address = memberAgency.address + ", " + memberAgency.city + " " + memberAgency.state + " " + memberAgency.zip;
                            }).$promise;
                            return member;
                        },
                        contacts: function () {
                            $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                            $http.defaults.headers.common.Accept = 'application/json';
                            return CONTACT.getContactModel({ ReportMetric: r.reporting_metrics_id }).$promise;
                        }
                    }
                });
                modalInstance.result.then(function (r) {
                    //nothing to do here
                });
                //end modal
            };//end ViewReport click

            //function call to add event_name to list of reports
            var formatReport = function (repList) {
                var returnList = [];
                for (var i = 0; i < repList.length; i++) {
                    var rep = repList[i];
                    var event = $scope.events.filter(function (e) { return e.event_id == rep.event_id; })[0];
                    rep.event_name = event.event_name;
                    returnList.push(rep);
                }
                return returnList;
            };

            var todayReports = $scope.reportsToDate.filter(function (todayrep) {
                var reportDate = todayrep.report_date.toString().substring(0, 10);
                return reportDate == $scope.today;
            });
            $scope.todayRpts = formatReport(todayReports);

            var yesterdayReports = $scope.reportsToDate.filter(function (yestrep) {
                var reportDate = yestrep.report_date.toString().substring(0, 10);
                return reportDate == $scope.yesterday;
            });
            $scope.yesterdayRpts = formatReport(yesterdayReports);

            //give me the reports done on this date
            $scope.getReportsByDate = function () {
                if ($scope.THIS_DATE.date !== undefined) {
                    var formatDate = new Date($scope.THIS_DATE.date);
                    formatDate.setHours(0, 0, 0, 0);
                    formatDate = formatDate.toISOString().substr(0, 10);
                    var thisDateReports = $scope.reportsToDate.filter(function (tdate) {
                        var reportDate = tdate.report_date.toString().substring(0, 10);
                        return reportDate == formatDate;
                    });
                    $scope.pickDateRpts = formatReport(thisDateReports);
                    $scope.pickAdateReports = true;
                } else {
                    alert("Pick a date first.");
                }

            };

            //complete the report button clicked -- send back to submit with report populated
            $scope.CompleteThisReport = function (rep) {
                $scope.$parent.newReport = rep;
               // $scope.$parent.newReport.report_date = new Date(rep.report_date); //keeps it valid
                $scope.$parent.disabled = false;
                $scope.$parent.needToComplete = true;
                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                $http.defaults.headers.common.Accept = 'application/json';
                CONTACT.getContactModel({ ReportMetric: rep.reporting_metrics_id }, function success(response) {
                    if (response.length >= 1) {
                        $scope.$parent.DeployStaff = response.filter(function (d) { return d.contactType == "Deployed Staff"; })[0];
                        $scope.$parent.GenStaff = response.filter(function (d) { return d.contactType == "General"; })[0];
                        $scope.$parent.InlandStaff = response.filter(function (d) { return d.contactType == "Inland Flood"; })[0];
                        $scope.$parent.CoastStaff = response.filter(function (d) { return d.contactType == "Coastal Flood"; })[0];
                        $scope.$parent.WaterStaff = response.filter(function (d) { return d.contactType == "Water Quality"; })[0];
                    } else {
                        $scope.$parent.DeployStaff = {}; $scope.$parent.GenStaff = {}; $scope.$parent.InlandStaff = {}; $scope.$parent.CoastStaff = {}; $scope.$parent.WaterStaff = {};
                    }
                }).$promise.then(function () {
                    $state.go('reporting.submitReport');
                });
            };

            //project alert text in modal
            $scope.getProjectAlertText = function (rep) {

                //need: 
                //1. thisReport
                $scope.ProjectAlertParts = {};
                $scope.ProjectAlertParts.Report = rep;
                //2. total of YEST FIELDPERS
                $scope.ProjectAlertParts.totYestFieldPers = rep.sw_yest_fieldpers + rep.wq_yest_fieldpers;
                //3. total of OFFICEPERS
                $scope.ProjectAlertParts.totYestOfficPers = rep.sw_yest_officepers + rep.wq_yest_officepers;
                //4. total tot_check_meas+tot_discharge_meas
                $scope.ProjectAlertParts.measureCts = rep.tot_check_meas + rep.tot_discharge_meas;
                //5. total states responding (all reports with this event_id, count of each state)
                var eventReports = $scope.reportsToDate.filter(function (r) { return r.event_id == rep.event_id; });
                var test = $filter('countBy')(eventReports, 'state');
                $scope.ProjectAlertParts.stateCount = 0;
                angular.forEach(test, function (er) {
                    $scope.ProjectAlertParts.stateCount++;
                });
                //6. this event
                $scope.ProjectAlertParts.Event = $scope.events.filter(function (e) { return e.event_id == rep.event_id; })[0];

                //modal
                var modalInstance = $uibModal.open({
                    templateUrl: $scope.ProjectAlertParts.Event.event_type_id == 1 ? 'FloodPA.html' : 'HurricanePA.html',
                    controller: 'ProjAlertModalCtrl',
                    size: 'md',
                    windowClass: 'rep-dialog',
                    resolve: {
                        ProjAlert: function () {
                            return $scope.ProjectAlertParts;
                        }
                    }
                });
                modalInstance.result.then(function (r) {
                    //nothing to do here
                });
                //end modal
            };
        }]);
})();