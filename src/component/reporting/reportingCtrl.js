(function () {
    'use strict';

    var STNControllers = angular.module('STNControllers');
//#region Reporting Controller
    STNControllers.controller('reportingCtrl', ['$scope', '$rootScope', '$cookies', '$location', '$http', '$uibModal', 'memberReports', 'allEvents', 'allStates', 'allReports', 'allEventTypes', 'allEventStatus', 'allAgencies', 'SERVER_URL', 'REPORT', 'MEMBER',
        function ($scope, $rootScope, $cookies, $location, $http, $uibModal, memberReports, allEvents, allStates, allReports, allEventTypes, allEventStatus, allAgencies, SERVER_URL, REPORT, MEMBER) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                $rootScope.thisPage = "Reporting";
                $rootScope.activeMenu = "report"; 
                //#region changing tabs handler /////////////////////
                $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
                    var formIsPopulated = false;
                    switch (fromState.url) {
                        case '/SubmitReport':
                            if ($scope.fullReportForm.submit !== undefined) {
                                formIsPopulated = $scope.fullReportForm.submit.$dirty;
                                formIsPopulated = $scope.fullReportForm.submit.event_id.$viewValue !== undefined ? true : formIsPopulated;
                            }
                            break;
                    }
                    if (formIsPopulated) { //is dirty
                        console.log('toState.name: ' + toState.name);
                        console.log('fromState.name: ' + fromState.name);

                        if (confirm("Are you sure you want to leave the Submit Report Tab? Any unsaved information will be lost.")) {
                            console.log('go to: ' + toState.name);
                        } else {
                            console.log('stay at state: ' + fromState.name);
                            $rootScope.stateIsLoading.showLoading = false;
                            //$scope.$apply();// loading..//$(".page-loading").addClass("hidden");
                            event.preventDefault();
                            //event.stopPropagation;
                        }
                    }
                });
                //#endregion changing tabs handler //////////////////////

                //#region Datepicker
                $scope.datepickrs = {};
               
                $scope.open = function ($event, which) {
                    $event.preventDefault();
                    $event.stopPropagation();

                    $scope.datepickrs[which] = true;
                };
                //#endregion

                //format the date mm/dd/yyyy
                $scope.formatDate = function (d) {
                    var currentDt = new Date(d);
                    var mm = currentDt.getMonth() + 1;
                    mm = (mm < 10) ? '0' + mm : mm;
                    var dd = currentDt.getDate();
                    var yyyy = currentDt.getFullYear();
                    var date = mm + '/' + dd + '/' + yyyy;
                    return date;
                };

                //#region global vars
                $scope.serverURL = SERVER_URL;
                $scope.fullReportForm = {};
                $scope.newReport = {};
                $scope.DeployStaff = {}; $scope.GenStaff = {};
                $scope.InlandStaff = {}; $scope.CoastStaff = {};
                $scope.WaterStaff = {};
                $scope.disabled = true;
                $scope.needToComplete = false;
                $scope.memberIncompletes = memberReports.filter(function (ir) { return ir.complete === 0; });
                $scope.events = allEvents;
                $scope.states = allStates;
                $scope.reports = allReports;
            
                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                $http.defaults.headers.common.Accept = 'application/json';
                MEMBER.query({ id: $cookies.get('mID') }, function success(response) {
                    $scope.MemberLoggedIn = response;
                    var memberAgency = allAgencies.filter(function (a) { return a.agency_id == $scope.MemberLoggedIn.agency_id; })[0];
                    $scope.MemberLoggedIn.agency_name = memberAgency.agency_name;
                    $scope.MemberLoggedIn.agency_address = memberAgency.address + ", " + memberAgency.city + " " + memberAgency.state + " " + memberAgency.zip;
                }).$promise;
                MEMBER.getAll().$promise.then(function (response) {
                    $scope.members = response;
                });

                $scope.agencies = allAgencies;
                $scope.eventTypes = allEventTypes;
                $scope.eventStats = allEventStatus;

                //#endregion global vars

                //#region Generate Report tab
                $scope.Statemodel = {};//binding to the state multi-select
                $scope.genSummary = {};//binding for the event chosen, and date chosen
                $scope.filteredReports = []; //result of filter options

                //each option the populate, need to show selection in 'Confirm Selections' section (date works)
                $scope.genRepChange = function () {
                    $scope.EventName = $scope.events.filter(function (e) { return e.event_id == $scope.genSummary.event_id; })[0];
                    var names = [];
                    var abbrevs = [];
                    angular.forEach($scope.Statemodel.value, function (state) {
                        names.push(state.state_name); abbrevs.push(state.state_abbrev);
                    });

                    $scope.StateNames = names.join(','); $scope.StateAbbrevs = abbrevs.join(',');
                };

                $scope.MetricDisplayModel = []; //hold all reportModels for 'Display Metrics Summary'
                //clicked Display Metrics Summary, show content in new tab
                $scope.displayMetricSum = function (valid) {
                    if (valid) {
                        //#region scopes needed for this action
                        $scope.MetricDisplayModel = [];
                        $scope.GenRepEventModel = {};
                        $scope.totalRow = {}; //model to hold totals for tables last row
                        $scope.totalRow.notAcctForEmps = 0; $scope.totalRow.cumPField = 0; $scope.totalRow.yesPField = 0; $scope.totalRow.todPField = 0;
                        $scope.totalRow.tomPField = 0; $scope.totalRow.cumPOffice = 0; $scope.totalRow.yesPOffice = 0; $scope.totalRow.todPOffice = 0;
                        $scope.totalRow.tomPOffice = 0; $scope.totalRow.truck = 0; $scope.totalRow.boat = 0; $scope.totalRow.other = 0;

                        $scope.totalRow.gageVisits = 0; $scope.totalRow.gagesDown = 0; $scope.totalRow.disCtoDate = 0; $scope.totalRow.disCPlanned = 0;
                        $scope.totalRow.CheckMeasToDate = 0; $scope.totalRow.CheckMeasPlanned = 0; $scope.totalRow.indMeas = 0; $scope.totalRow.ratExt = 0;
                        $scope.totalRow.peaksOfRec = 0; $scope.totalRow.QWGageVis = 0; $scope.totalRow.contQWGageVis = 0; $scope.totalRow.contQWGageDown = 0;
                        $scope.totalRow.disQWSamples = 0; $scope.totalRow.sedSamples = 0;

                        $scope.totalRow.rdgPlan = 0; $scope.totalRow.rdgDep = 0; $scope.totalRow.rdgRec = 0; $scope.totalRow.rdgLost = 0;
                        $scope.totalRow.waterPlan = 0; $scope.totalRow.waterDep = 0; $scope.totalRow.waterRec = 0; $scope.totalRow.waterLost = 0;
                        $scope.totalRow.wavePlan = 0; $scope.totalRow.waveDep = 0; $scope.totalRow.waveRec = 0; $scope.totalRow.waveLost = 0;
                        $scope.totalRow.baroPlan = 0; $scope.totalRow.baroDep = 0; $scope.totalRow.baroRec = 0; $scope.totalRow.baroLost = 0;
                        $scope.totalRow.metPlan = 0; $scope.totalRow.metDep = 0; $scope.totalRow.metRec = 0; $scope.totalRow.metLost = 0;
                        $scope.totalRow.hwmFlag = 0; $scope.totalRow.hwmCol = 0;
                        //#endregion scopes needed for this action

                        //get metrics summary to show in new tab                    
                        var abbrevs = [];
                        angular.forEach($scope.Statemodel.value, function (state) {
                            abbrevs.push(state.state_abbrev);
                        });
                        var abbrevString = abbrevs.join(',');
                        var thisDate = $scope.formatDate($scope.genSummary.sum_date);
                        //need: 
                        //1. all reports
                        REPORT.getFilteredReports({
                            Event: $scope.EventName.event_id, States: abbrevString, Date: thisDate
                        }).$promise.then(function (result) {
                            //for each report, get all reports with that event and state
                            for (var x = 0; x < result.length; x++) {
                                var thisRPModel = {};
                                thisRPModel.report = result[x];

                                //add to totals for total row
                                $scope.totalRow.notAcctForEmps += (thisRPModel.report.sw_fieldpers_notacct + thisRPModel.report.wq_fieldpers_notacct);
                                $scope.totalRow.cumPField += thisRPModel.report.yest_fieldpers + thisRPModel.report.tod_fieldpers + thisRPModel.report.tmw_fieldpers;
                                $scope.totalRow.yesPField += thisRPModel.report.yest_fieldpers;
                                $scope.totalRow.todPField += thisRPModel.report.tod_fieldpers;
                                $scope.totalRow.tomPField += thisRPModel.report.tmw_fieldpers;
                                $scope.totalRow.cumPOffice += thisRPModel.report.yest_officepers + thisRPModel.report.tod_officepers + thisRPModel.report.tmw_officepers;
                                $scope.totalRow.yesPOffice += thisRPModel.report.yest_officepers;
                                $scope.totalRow.todPOffice += thisRPModel.report.tod_officepers;
                                $scope.totalRow.tomPOffice += thisRPModel.report.tmw_officepers;
                               
                                $scope.totalRow.gageVisits += thisRPModel.report.gage_visit; $scope.totalRow.gagesDown += thisRPModel.report.gage_down;
                                $scope.totalRow.disCtoDate += thisRPModel.report.tot_discharge_meas; $scope.totalRow.disCPlanned += thisRPModel.report.plan_discharge_meas;                               
                                $scope.totalRow.indMeas += thisRPModel.report.plan_indirect_meas; $scope.totalRow.ratExt += thisRPModel.report.rating_extens;
                                $scope.totalRow.peaksOfRec += thisRPModel.report.gage_peak_record; 
                                $scope.totalRow.disQWSamples += thisRPModel.report.qw_discr_samples; $scope.totalRow.sedSamples += thisRPModel.report.coll_sedsamples;

                                $scope.totalRow.rdgPlan += thisRPModel.report.plan_rapdepl_gage; $scope.totalRow.rdgDep += thisRPModel.report.dep_rapdepl_gage;
                                $scope.totalRow.rdgRec += thisRPModel.report.rec_rapdepl_gage; $scope.totalRow.rdgLost += thisRPModel.report.lost_rapdepl_gage;
                                $scope.totalRow.waterPlan += thisRPModel.report.plan_wtrlev_sensor; $scope.totalRow.waterDep += thisRPModel.report.dep_wtrlev_sensor;
                                $scope.totalRow.waterRec += thisRPModel.report.rec_wtrlev_sensor; $scope.totalRow.waterLost += thisRPModel.report.lost_wtrlev_sensor;
                                $scope.totalRow.wavePlan += thisRPModel.report.plan_wv_sens; $scope.totalRow.waveDep += thisRPModel.report.dep_wv_sens;
                                $scope.totalRow.waveRec += thisRPModel.report.rec_wv_sens; $scope.totalRow.waveLost += thisRPModel.report.lost_wv_sens;
                                $scope.totalRow.baroPlan += thisRPModel.report.plan_barometric; $scope.totalRow.baroDep += thisRPModel.report.dep_barometric;
                                $scope.totalRow.baroRec += thisRPModel.report.rec_barometric; $scope.totalRow.baroLost += thisRPModel.report.lost_barometric;
                                $scope.totalRow.metPlan += thisRPModel.report.plan_meteorological; $scope.totalRow.metDep += thisRPModel.report.dep_meteorological;
                                $scope.totalRow.metRec += thisRPModel.report.rec_meteorological; $scope.totalRow.metLost += thisRPModel.report.lost_meteorological;
                                $scope.totalRow.hwmFlag += thisRPModel.report.hwm_flagged; $scope.totalRow.hwmCol = thisRPModel.report.hwm_collected;

                                $scope.MetricDisplayModel.push(thisRPModel);
                            }//end forloop for ReportModelList
                            //2. this Event
                            $scope.GenRepEventModel = {};
                            $scope.GenRepEventModel.Event = $scope.EventName;
                            $scope.GenRepEventModel.EventType = $scope.eventTypes.filter(function (et) { return et.event_type_id == $scope.EventName.event_type_id; })[0];
                            $scope.GenRepEventModel.EventStat = $scope.eventStats.filter(function (es) { return es.event_status_id == $scope.EventName.event_status_id; })[0];
                            //3. event Coordinator info
                            $scope.GenRepEventModel.Coordinator = $scope.members.filter(function (m) { return m.member_id == $scope.GenRepEventModel.Event.event_coordinator; })[0];
                            $scope.GenRepEventModel.CoordAgency = $scope.agencies.filter(function (a) { return a.agency_id == $scope.GenRepEventModel.Coordinator.agency_id; })[0];

                            //modal
                            var modalInstance = $uibModal.open({
                                templateUrl: 'MetricsSummary.html',
                                size: 'lg',
                                windowClass: 'rep-dialog',
                                resolve: {
                                    thisReport: function () {
                                        return $scope.MetricDisplayModel;
                                    },
                                    thisEvent: function () {
                                        return $scope.GenRepEventModel;
                                    },
                                    theTotalRow: function () {
                                        return $scope.totalRow;
                                    }
                                },
                                controller: ['$scope', '$uibModalInstance', 'thisReport', 'thisEvent', 'theTotalRow',  function ($scope, $uibModalInstance, thisReport, thisEvent, theTotalRow) {
                                    $scope.Report = thisReport;
                                    $scope.Event = thisEvent;
                                    $scope.totals = theTotalRow;
                                    $scope.ok = function () {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                    $scope.print = function () {
                                        window.print();
                                    };
                                }]
                            });
                            modalInstance.result.then(function () {
                                //nothing                            
                            });//end modal
                        });
                    }//end if valid = true
                };

                //clicked Display Contacts Summary, show content in new tab
                $scope.displayContactsSum = function (valid) {
                    if (valid) {
                        //get metrics summary to show in new tab
                        //contains the states chosen     $scope.Statemodel.value; 
                        //event chosen    $scope.EventName[0];
                        var abbrevs = [];
                        angular.forEach($scope.Statemodel.value, function (state) {
                            abbrevs.push(state.state_abbrev);
                        });
                        var abbrevString = abbrevs.join(',');
                        var thisDate = $scope.formatDate($scope.genSummary.sum_date);
                        $scope.reportModel = [];
                        //all filtered reports 
                        $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                        $http.defaults.headers.common.Accept = 'application/json';
                        REPORT.getReportwithContacts({
                            Event: $scope.EventName.event_id, States: abbrevString, Date: thisDate
                        }).$promise.then(function (result) {
                            //loop through reports and get each's contacts
                            for (var x = 0; x < result.length; x++) {
                                var rep = {};
                                rep.repID = result[x].reporting_metrics_id; rep.State = result[x].state; rep.report_date = result[x].report_date;
                                var submitter = $scope.members.filter(function (m) { return m.member_id == result[x].member_id; })[0];
                                var submitterAgency = $scope.agencies.filter(function (a) { return a.agency_id == submitter.agency_id; })[0];
                                var sub = {};
                                sub.fname = submitter.fname; sub.lname = submitter.lname;
                                sub.email = submitter.email; sub.phone = submitter.phone;
                                sub.agencyname = submitterAgency.agency_name;
                                sub.agencyadd = submitterAgency.city + " " + submitterAgency.state + " " + submitterAgency.zip;
                                rep.submitter = sub;
                                rep.depC = result[x].ReportContacts.filter(function (x) { return x.type == "Deployed Staff"; })[0];
                                rep.genC = result[x].ReportContacts.filter(function (x) { return x.type == "General"; })[0];
                                rep.inlC = result[x].ReportContacts.filter(function (x) { return x.type == "Inland Flood"; })[0];
                                rep.coastC = result[x].ReportContacts.filter(function (x) { return x.type == "Coastal Flood"; })[0];
                                rep.waterC = result[x].ReportContacts.filter(function (x) { return x.type == "Water Quality"; })[0];
                                $scope.reportModel.push(rep);
                            } //end for loop 

                            setTimeout(function () { showModal(); }, 3000);

                            //now send it all to the modal
                            var showModal = function () {
                                var modalInstance = $uibModal.open({
                                    templateUrl: 'ContactMetricsSummary.html',
                                    size: 'lg',
                                    windowClass: 'rep-dialog',
                                    resolve: {
                                        theseReports: function () {
                                            return $scope.reportModel;
                                        },
                                        thisEvent: function () {
                                            $scope.GenRepEventModel = {};
                                            $scope.GenRepEventModel.Event = $scope.EventName;
                                            $scope.GenRepEventModel.EventType = $scope.eventTypes.filter(function (et) { return et.event_type_id == $scope.EventName.event_type_id; })[0];
                                            $scope.GenRepEventModel.EventStat = $scope.eventStats.filter(function (es) { return es.event_status_id == $scope.EventName.event_status_id; })[0];
                                            //3. event Coordinator info
                                            $scope.GenRepEventModel.Coordinator = $scope.members.filter(function (m) { return m.member_id == $scope.EventName.event_coordinator; })[0];
                                            $scope.GenRepEventModel.CoordAgency = $scope.agencies.filter(function (a) { return a.agency_id == $scope.GenRepEventModel.Coordinator.agency_id; })[0];
                                            return $scope.GenRepEventModel;
                                        }
                                    },
                                    controller: ['$scope', '$http', '$uibModalInstance', 'theseReports', 'thisEvent', function ($scope, $http, $uibModalInstance, theseReports, thisEvent) {
                                        $scope.Reports = theseReports;
                                        $scope.Event = thisEvent;
                                        $scope.ok = function () {
                                            $uibModalInstance.dismiss('cancel');
                                        };
                                        $scope.print = function () {
                                            window.print();
                                        };
                                    }]
                                });
                                modalInstance.result.then(function () {
                                    //nothing
                                });
                            }; //end modal
                        });
                    } //end if valid
                };

                //clicked generate csv
                $scope.getCSVfile = function (valid) {
                    if (valid) {
                        //get reports and give a csv file back
                        $http.defaults.headers.common.Accept = 'text/csv';
                  
                        REPORT.getReportsCSV({ Event: $scope.genSummary.event_id, States: $scope.StateAbbrevs, Date: $scope.genSummary.sum_date }).$promise.then(function (result) {
                            var anchor = angular.element('<a/>');
                            var joinedResponse = result.join("");
                            var file = new Blob([joinedResponse], { type: 'application/csv' });
                            var fileURL = URL.createObjectURL(file);
                            anchor.href = fileURL;
                            anchor.download = 'report.csv';
                            anchor.click();
                            var test;
                            //File.saveAs(blob, "report.csv");
                        }), function () {
                            console.log('error');
                        };
                    }
                };//#endregion Generate Report tab
            }
    }]);
})();