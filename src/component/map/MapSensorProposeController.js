/**
 * Created by bdraper on 3/9/2016.
 */
(function () {
    'use strict';
    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('MapSensorProposeController', ['$scope', '$http', '$timeout', '$rootScope', '$cookies', '$location', 'SITE', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'allDeployTypes', 'allSensDeps', 'leafletMarkerEvents', 'leafletBoundsHelpers', '$state',
        function ($scope, $http, $timeout, $rootScope, $cookies, $location, SITE, INSTRUMENT, INSTRUMENT_STATUS, allDeployTypes, allSensDeps, leafletMarkerEvents, leafletBoundsHelpers, $state) {
            //when a site is  clicked, this will be triggered from service to let this controller know about it
            $rootScope.$on('mapSiteClickResults', function (event, siteParts) {
                $scope.thisSite = siteParts[0]; //here's the site they clicked
                $scope.status.sensorOpen = false; //make sure the proposed sensor accordion is closed so they have to open and trigger the get
                $scope.ProposedSensors4Site = []; //make sure this is clear in case they are clicking on one site after another
                $scope.showProposed = false; //hide the proposed sensor type list initially
            });
            //all deployment types
            $scope.deployTypeList = angular.copy(allDeployTypes);
            var tempDepTypeID = 0;

            //fix deployment types so that "Temperature" becomes 2 : Temperature (Met sensor)-SensorType:2 and Temperature (pressure transducer)-SensorType:1 -- just for proposed
            for (var d = 0; d < $scope.deployTypeList.length; d++) {
                if ($scope.deployTypeList[d].method === "Temperature") {
                    tempDepTypeID = $scope.deployTypeList[d].deployment_type_id;
                    $scope.deployTypeList[d].method = "Temperature (Met sensor)";
                }
            }
            $scope.deployTypeList.push({ deployment_type_id: tempDepTypeID, method: "Temperature (Pressure Transducer)" });

            //proposed sensors accordion was opened, go get them
            $scope.getProposedSensors = function () {
                SITE.getSiteSensors({ id: $scope.thisSite.site_id }).$promise.then(function (sResponse) {
                    //need to make sure the instrument_statuses are in the correct order ([0]Retrieved, [1]Deployed, [2]Proposed                
                    for (var s = 0; s < sResponse.length; s++) {
                        var correctOrderSS = [];
                        var sensorStatuses = sResponse[s].instrument_status;
                        if (sensorStatuses.length > 1) {
                            //only care about order if there's more than 1
                            var proposedStat = sensorStatuses.filter(function (ps) { return ps.status == "Proposed"; })[0];
                            var deployedStat = sensorStatuses.filter(function (ps) { return ps.status == "Deployed"; })[0];
                            var retLostStat = sensorStatuses.filter(function (ps) { return ps.status == "Retrieved" || ps.status == "Lost"; })[0];
                            //now add them back in correctly                            
                            if (retLostStat) correctOrderSS.push(retLostStat);
                            if (deployedStat) correctOrderSS.push(deployedStat);
                            if (proposedStat) correctOrderSS.push(proposedStat);
                        } else {
                            correctOrderSS.push(sensorStatuses[0]);
                        }
                        //now put it back in the object
                        sResponse[s].instrument_status = [];
                        sResponse[s].instrument_status = correctOrderSS;
                    }
                    $scope.ProposedSensors4Site = sResponse.filter(function (ss) { return ss.instrument_status[0].status_type_id == 4; });
                }, function (errorResponse) {
                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting site sensors: " + errorResponse.headers(["usgswim-messages"]));
                    else toastr.error("Error getting site sensors: " + errorResponse.statusText);
                });
            };

            //all sensor deployments (relationship table)
            $scope.sensDepTypes = allSensDeps;
            $scope.showProposed = false; //they want to add a proposed sensor, open options (boolean toggle)
            $scope.status = { sensorOpen: false }; //accordion open or closed
            //show/hide proposed sensors to add
            $scope.showHideProposed = function () {
                $scope.showProposed = !$scope.showProposed;
            };

            //cancel proposing a sensor, close the list
            $scope.cancelProposing = function () {
                $scope.showProposed = false;
            };
            //add these checked Proposed sensors to this site
            $scope.AddProposed = function () {
                var Time_STAMP = new Date();
                for (var dt = 0; dt < $scope.deployTypeList.length; dt++) {
                    if ($scope.deployTypeList[dt].selected === true) {
                        var proposedToAdd = {}; var propStatToAdd = {};

                        if ($scope.deployTypeList[dt].method.substring(0, 4) == "Temp") {
                            //temperature proposed sensor
                            proposedToAdd = {
                                event_id: 0,
                                location_description: "Proposed sensor at this site. Change description when deploying sensor.",
                                deployment_type_id: $scope.deployTypeList[dt].deployment_type_id,
                                site_id: $scope.thisSite.site_id,
                                sensor_type_id: $scope.deployTypeList[dt].method == "Temperature (Pressure Transducer)" ? 1 : 2,
                            };
                        } else {
                            //go through the new fullInstrument and see if any of the sensor's deploymenttypes are this deployment type to set the sensor_type_id
                            var sID = 0;
                            angular.forEach($scope.sensDepTypes, function (sdt) {
                                for (var x = 0; x < sdt.deploymenttypes.length; x++) {
                                    if (sdt.deploymenttypes[x].deployment_type_id == $scope.deployTypeList[dt].deployment_type_id)
                                        sID = sdt.sensor_type_id;
                                }
                            });
                            //any other type
                            proposedToAdd = {
                                event_id: 0,
                                location_description: "Proposed sensor at this site. Change description when deploying sensor.",
                                deployment_type_id: $scope.deployTypeList[dt].deployment_type_id,
                                site_id: $scope.thisSite.site_id,
                                sensor_type_id: sID
                            };
                        }
                        //now post it (Instrument first, then Instrument Status
                        $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                        $http.defaults.headers.common.Accept = 'application/json';
                        var instrumentID = 0;
                        INSTRUMENT.save(proposedToAdd).$promise.then(function (response) {
                            instrumentID = response.instrument_id;
                            var createdPropSensor = {
                                deployment_type_id: response.deployment_type_id,
                                site_id: response.site_id,
                                sensor_type_id: response.sensor_type_id,
                                instrument_id: response.instrument_id,
                                deploymentType: $scope.deployTypeList.filter(function (dtl) { return dtl.deployment_type_id == response.deployment_type_id; })[0].method,
                                sensorType: $scope.sensDepTypes.filter(function (s) { return s.sensor_type_id == response.sensor_type_id; })[0].sensor
                            };
                            propStatToAdd = { instrument_id: response.instrument_id, status_type_id: 4, member_id: $cookies.get('mID'), time_stamp: Time_STAMP, time_zone: 'UTC', };

                            INSTRUMENT_STATUS.save(propStatToAdd).$promise.then(function (statResponse) {
                                propStatToAdd.status = 'Proposed'; propStatToAdd.instrument_status_id = statResponse.instrument_status_id;
                                createdPropSensor.instrument_status = [propStatToAdd];
                                $scope.ProposedSensors4Site.push(createdPropSensor);

                                //clean up ...all unchecked and then hide
                                for (var dep = 0; dep < $scope.deployTypeList.length; dep++) {
                                    $scope.deployTypeList[dep].selected = false;
                                }
                                $timeout(function () {
                                    // anything you want can go here and will safely be run on the next digest.
                                    $scope.showProposed = false;
                                    toastr.success("Proposed sensor created");
                                });

                            }, function (errorResponse) {
                                // if status fails, delete the instrument too
                                INSTRUMENT.delete({ id: instrumentID });
                                angular.forEach($scope.deployTypeList, function (dt) { dt.selected = false; });
                                if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating proposed sensor: " + errorResponse.headers(["usgswim-messages"]));
                                else toastr.error("Error creating proposed sensor: " + errorResponse.statusText);
                            });//end INSTRUMENT_STATUS.save
                        }, function (errorResponse) {
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating proposed sensor: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error creating proposed sensor: " + errorResponse.statusText);
                        }); //end INSTRUMENT.save
                    }//end if selected == true
                }//end foreach deployTypeList
            };//end AddProposed()

        }]);//end controller function
})();