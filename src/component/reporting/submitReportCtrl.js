(function () {
    'use strict';

    var STNControllers = angular.module('STNControllers');
    STNControllers.controller('submitReportCtrl', ['$scope', '$http', '$cookies', '$uibModal', '$state', 'CONTACT', 'REPORT', 
        function ($scope, $http, $cookies, $uibModal, $state, CONTACT, REPORT) {
            //#make sure this clears except for if they are needing to complete a report
            if ($scope.$parent.needToComplete !== true) {
                $scope.$parent.newReport = {report_date: new Date()};
            }
            else {
                //keeps it valid and tells it it's utc so it will convert proper local
                var yr = $scope.newReport.report_date.substr(0, 4);
                var mo = $scope.newReport.report_date.substr(5, 2);
                var day = $scope.newReport.report_date.substr(8, 2);
                $scope.newReport.report_date = new Date(mo + "/" + day + "/" + yr);
//                $scope.newReport.report_date = new Date($scope.newReport.report_date);
            }
            $scope.status = { openContacts: false }; //if submit form invalid, open contacts to show required field
            //called a few times to format just the date (no time)
            var makeAdate = function (d) {
                var aDate = new Date();
                if (d !== "" && d !== undefined) {
                    //provided date
                    aDate = new Date(d);
                }
                var year = aDate.getFullYear();
                var month = aDate.getMonth();
                var day = ('0' + aDate.getDate()).slice(-2);
                var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                var dateWOtime = new Date(monthNames[month] + " " + day + ", " + year);
                return dateWOtime;
            };//end makeAdate()
            //reset it here so form will clear when they leave and come back.
            $scope.$parent.needToComplete = false;

            if ($scope.newReport.reporting_metrics_id === undefined)
                $scope.disabled = true;

            //get this event name from the eventid
            $scope.getEventName = function (evID) {
                var name;
                var thisEvent = $scope.events.filter(function (e) { return e.event_id == evID; })[0];
                name = thisEvent.event_name;
                return name;
            };

            //#region GET Report Contacts
            var getReportContacts = function (reportID) {
                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                $http.defaults.headers.common.Accept = 'application/json';
                CONTACT.getContactModel({ ReportMetric: reportID }, function success(response) {
                    $scope.DeployStaff = response.filter(function (d) { return d.contactType == "Deployed Staff"; })[0];
                    $scope.GenStaff = response.filter(function (d) { return d.contactType == "General"; })[0];
                    $scope.InlandStaff = response.filter(function (d) { return d.contactType == "Inland Flood"; })[0];
                    $scope.CoastStaff = response.filter(function (d) { return d.contactType == "Coastal Flood"; })[0];
                    $scope.WaterStaff = response.filter(function (d) { return d.contactType == "Water Quality"; })[0];
                }).$promise;
                $scope.disabled = false;
            };
            //#endregion GET Report Contacts

            //#region POST Report Contacts
            var postReportContacts = function (reportID) {
                if (!angular.equals({}, $scope.DeployStaff) && $scope.DeployStaff !== undefined) {
                    //first post contact, then post reportContact
                    CONTACT.save($scope.DeployStaff).$promise.then(function (newDep) {
                        CONTACT.addReportContact({ contactId: newDep.contact_id, contactTypeId: 1, reportId: reportID }, function success(response1) {
                            toastr.success("Deploy Staff Updated");
                        }, function error(errorResponse1) {
                            alert("Error: " + errorResponse1.statusText);
                        }).$promise;
                    });                    
                }
                if (!angular.equals({}, $scope.GenStaff) && $scope.GenStaff !== undefined) {
                    CONTACT.save($scope.GenStaff).$promise.then(function (newGen) {
                        CONTACT.addReportContact({ contactId: newGen.contact_id, contactTypeId: 2, reportId: reportID }, function success(response2) {
                            toastr.success("General Staff Updated");
                        }, function error(errorResponse2) {
                            alert("Error: " + errorResponse2.statusText);
                        }).$promise;
                    });
                }
                if (!angular.equals({}, $scope.InlandStaff) && $scope.InlandStaff !== undefined) {
                    CONTACT.save($scope.InlandStaff).$promise.then(function (newInl) {
                        CONTACT.addReportContact({ contactId: newInl.contact_id, ContactTypeId: 3, ReportId: reportID }, function success(response3) {
                            toastr.success("Inland Staff Updated");
                        }, function error(errorResponse3) {
                            alert("Error: " + errorResponse3.statusText);
                        }).$promise;
                    });                    
                }
                if (!angular.equals({}, $scope.CoastStaff) && $scope.CoastStaff !== undefined) {
                    CONTACT.save($scope.CoastStaff).$promise.then(function (newCoa) {
                        CONTACT.addReportContact({ contactId: newCoa.contact_id, ContactTypeId: 4, ReportId: reportID }, function success(response4) {
                            toastr.success("Coastal Staff Updated");
                        }, function error(errorResponse4) {
                            alert("Error: " + errorResponse4.statusText);
                        }).$promise;
                    });
                }
                if (!angular.equals({}, $scope.WaterStaff) && $scope.WaterStaff !== undefined) {
                    CONTACT.save($scope.WaterStaff).$promise.then(function (newWat) {
                        CONTACT.addReportContact({ contactId: $scope.WaterStaff.contact_id, ContactTypeId: 5, ReportId: reportID }, function success(response5) {
                            toastr.success("Water Staff Updated");
                        }, function error(errorResponse5) {
                            alert("Error: " + errorResponse5.statusText);
                        }).$promise;
                    });
                }
            };
            //#endregion POST Report Contacts

            var removeIncomplete = function () {
                //remove it from the list of incompletes
                var index = 0;
                for (var i = 0; i < $scope.memberIncompletes.length; i++) {
                    if ($scope.memberIncompletes[i].reporting_metrics_id == $scope.newReport.reporting_metrics_id) {
                        index = i;
                        i = $scope.memberIncompletes.length;
                    }
                }
                $scope.memberIncompletes.splice(index, 1);
            };

            //Post/Put the Report and Report Contacts. Called twice (from within Modal (incomplete) and outside (complete))
            var PostPutReportAndReportContacts = function () {
                //POST or PUT        
                $scope.newReport.report_date = $scope.newReport.report_date.toDateString();
                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                $http.defaults.headers.common.Accept = 'application/json';
                if ($scope.newReport.reporting_metrics_id !== undefined) {                    
                    //PUT
                    REPORT.update({ id: $scope.newReport.reporting_metrics_id }, $scope.newReport, function success(response) {
                        toastr.success("Report Updated");
                        $scope.newReport.event_name = $scope.getEventName($scope.newReport.event_id);
                        if ($scope.newReport.complete == 1) {
                            removeIncomplete();
                            $scope.isCompleted = true;
                        }
                        //then POST the ReportContacts
                        postReportContacts($scope.newReport.reporting_metrics_id);
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    }).$promise.then(function () {
                        $scope.fullReportForm.submit.$setPristine();
                        $scope.fullReportForm.submit.event_id.$viewValue = undefined;//needed for the changeState to not throw up leaving tab message
                        $state.go('reporting.reportDash');
                    });
                } else {
                    //POST
                    REPORT.save($scope.newReport, function success(response) {
                        toastr.success("Report Created");
                        $scope.reports.push(response); //add to the list of all reports for filtering on the generate tab
                        if ($scope.newReport.complete == 1) {
                            removeIncomplete(); $scope.isCompleted = true;
                            $scope.newReport.event_name = $scope.getEventName($scope.newReport.event_id);
                        } else {
                            $scope.memberIncompletes.push(response);
                        }
                        //then POST the ReportContacts
                        $scope.newReport.reporting_metrics_id = response.reporting_metrics_id;
                        postReportContacts($scope.newReport.reporting_metrics_id);
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    }).$promise.then(function () {
                        $scope.fullReportForm.submit.$setPristine();
                        $scope.fullReportForm.submit.event_id.$viewValue = undefined; //needed for the changeState to not throw up leaving tab message
                        $state.go('reporting.reportDash');
                    });
                }//end post
            };

            //get values for Personnel Yesterdays, and Contacts (if report was done yesterday), and all counts for instruments & hwms
            $scope.populateYestTots = function () {
                if ($scope.newReport.report_date !== undefined && $scope.newReport.state !== undefined && $scope.newReport.event_id !== undefined) {
                    var formatDate = new Date($scope.newReport.report_date);
                    formatDate.setHours(0, 0, 0, 0);
                    formatDate = formatDate.toISOString().substr(0, 10);
                    var myDate = formatDate;
                    var theState = $scope.newReport.state;
                    var eID = $scope.newReport.event_id;

                    $scope.disabled = false;
                    $scope.newReport = { report_date: $scope.newReport.report_date, state: theState, event_id: eID };
                    $scope.DeployStaff = {}; $scope.GenStaff = {}; $scope.InlandStaff = {};
                    $scope.CoastStaff = {}; $scope.WaterStaff = {};
                    var previousDay = new Date(myDate);
                    previousDay.setHours(0, 0, 0, 0);
                    previousDay = previousDay.toISOString().substr(0, 10);
                    
                    var yesterdayRpt = $scope.reports.filter(function (r) {
                        var repDate = r.report_date.toString().substring(0, 10);
                        return (r.event_id == $scope.newReport.event_id && r.state == $scope.newReport.state) && (repDate == previousDay);
                    })[0];
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    if (yesterdayRpt !== undefined) {
                        // PERSONNEL populating
                        $scope.newReport.sw_yest_fieldpers = yesterdayRpt.sw_tod_fieldpers;
                        $scope.newReport.wq_yest_fieldpers = yesterdayRpt.wq_tod_fieldpers;
                        $scope.newReport.sw_yest_officepers = yesterdayRpt.sw_tod_officepers;
                        $scope.newReport.wq_yest_officepers = yesterdayRpt.wq_tod_officepers;

                        // CONTACTS populating 
                        getReportContacts(yesterdayRpt.reporting_metrics_id);
                    }//end if yesterdayRpt != undefined
                    else {
                        $scope.newReport.sw_yest_fieldpers = 0;
                        $scope.newReport.wq_yest_fieldpers = 0;
                        $scope.newReport.sw_yest_officepers = 0;
                        $scope.newReport.wq_yest_officepers = 0;
                    }
                    //now get totals for all sensors and hwms to populate in this newReport
                    REPORT.getDailyReportTots({ Date: myDate, Event: $scope.newReport.event_id, State: $scope.newReport.state }, function success(response6) {
                        //only care about the counts
                        $scope.newReport.dep_rapdepl_gage = response6.dep_rapdepl_gage;
                        $scope.newReport.rec_rapdepl_gage = response6.rec_rapdepl_gage;
                        $scope.newReport.lost_rapdepl_gage = response6.lost_rapdepl_gage;
                        $scope.newReport.dep_wtrlev_sensor = response6.dep_wtrlev_sensor;
                        $scope.newReport.rec_wtrlev_sensor = response6.rec_wtrlev_sensor;
                        $scope.newReport.lost_wtrlev_sensor = response6.lost_wtrlev_sensor;
                        $scope.newReport.dep_wv_sens = response6.dep_wv_sens;
                        $scope.newReport.rec_wv_sens = response6.rec_wv_sens;
                        $scope.newReport.lost_wv_sens = response6.lost_wv_sens;
                        $scope.newReport.dep_barometric = response6.dep_barometric;
                        $scope.newReport.rec_barometric = response6.rec_barometric;
                        $scope.newReport.lost_barometric = response6.lost_barometric;
                        $scope.newReport.dep_meteorological = response6.dep_meteorological;
                        $scope.newReport.rec_meteorological = response6.rec_meteorological;
                        $scope.newReport.lost_meteorological = response6.lost_meteorological;
                        $scope.newReport.hwm_flagged = response6.hwm_flagged;
                        $scope.newReport.hwm_collected = response6.hwm_collected;
                    }, function error(errorResponse6) {
                        alert("Error: " + errorResponse6.statusText);
                    });
                }
                else {
                    alert("Please choose a date, event and state first.");
                }
            }; // end populateYestTots

            //save this report and it's contacts
            $scope.saveReport = function (valid) {
                if ($scope.newReport.complete === undefined || $scope.newReport.complete === 0) {
                    //don't worry if valid, just postput modal confirming they want to save this without marking it complete
                    var modalInstance = $uibModal.open({
                        templateUrl: 'saveReportModal.html',
                        controller: 'confirmReportModalCtrl',
                        size: 'sm'
                    });
                    modalInstance.result.then(function () {
                        //yes, post this as incomplete
                        $scope.newReport.complete = 0;
                        $scope.newReport.member_id = $scope.MemberLoggedIn.member_id;
                        PostPutReportAndReportContacts();
                    });//end modalInstance.result.then
                } else {
                    //..complete is 1 .. check if valid
                    if (valid) {
                        //the report is complete and valid, just post/put it                        
                        $scope.newReport.member_id = $scope.MemberLoggedIn.member_id;
                        PostPutReportAndReportContacts();
                    } else {
                        //alert("All fields are required");
                        $scope.status.openContacts = true;
                        angular.element("[name='" + $scope.fullReportForm.submit.$name + "']").find('.ng-invalid:visible:first').focus();
                    }
                }
            };

            $scope.populateDeployer = function () {
                $scope.DeployStaff = $scope.MemberLoggedIn;
            };
            //incomplete report was clicked, go get it and the contacts for it
            $scope.getIncompleteReport = function () {
                var reportId = this.ir.reporting_metrics_id;
                REPORT.query({ id: reportId }, function success(response) {
                    $scope.newReport = response;
                    //if Chrome, format date:
                    var yr = response.report_date.substr(0, 4);
                    var mo = response.report_date.substr(5, 2);
                    var day = response.report_date.substr(8, 2);
                    $scope.newReport.report_date = new Date(mo + "/" + day + "/" + yr);
                    //$scope.newReport.report_date = new Date($scope.newReport.report_date);
                    $scope.fullReportForm.submit.$setDirty();
                    //get contacts 
                    getReportContacts(reportId);
                }).$promise;
            };
        }]);
})();