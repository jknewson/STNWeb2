(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var ModalControllers = angular.module('ModalControllers');
    ModalControllers.controller('peakModalCtrl', ['$scope', '$rootScope', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'SERVER_URL', 'allVertDatums', 'allCollectConditions', 'thisPeak', 'peakSite', 'allMembers', 'allEventHWMs', 'allSiteSensors', 'allSiteFiles', 'thisPeakDFs', 'DATA_FILE', 'PEAK', 'HWM',
        function ($scope, $rootScope, $cookies, $http, $uibModalInstance, $uibModal, SERVER_URL, allVertDatums, allCollectConditions, thisPeak, peakSite, allMembers, allEventHWMs, allSiteSensors, allSiteFiles, thisPeakDFs, DATA_FILE, PEAK, HWM) {
            $scope.serverURL = SERVER_URL;
            //dropdowns
            $scope.VDatumsList = allVertDatums;
            $scope.thisSite = peakSite;
            $scope.memberList = allMembers;
            $scope.loggedInRole = $cookies.get('usersRole');
            //need a datafile for this kind of sensor, check files for presence of df to set flag on sensor
            var determineDFPresent = function (f) {
                for (var x = 0; x < f.length; x++) {
                    if (f[x].filetype_id == 2) {
                        return true;
                    }
                }
                return false;
            };
            //add selected prop now for data files/sensor files for later use
            for (var sf = 0; sf < allSiteFiles.length; sf++) {
                if (allSiteFiles[sf].fileBelongsTo == 'DataFile File' || allSiteFiles[sf].fileBelongsTo == 'Sensor File') {
                    allSiteFiles[sf].selected = false;
                }
            }

            $scope.eventSiteHWMs = allEventHWMs.filter(function (h) { return h.site_id == peakSite.site_id; });
            angular.forEach($scope.eventSiteHWMs, function (esh) {
                esh.selected = false;
                esh.files = allSiteFiles.filter(function (sf) { return sf.hwm_id == esh.hwm_id && sf.fileBelongsTo == "HWM File"; });
            });
            
            $scope.eventSiteSensors = allSiteSensors.filter(function (s) { return s.event_id == $cookies.get('SessionEventID'); }); //maybe go from here to get all datafiles for each sensor
            angular.forEach($scope.eventSiteSensors, function (ess) {
                // if ess.Sensor_type == 2, 5, or 6 .. and there are no files.. show red ! with text
                ess.CollectCondition = ess.inst_collection_id !== null && ess.inst_collection_id > 0 ?
                    allCollectConditions.filter(function (cc) { return cc.id == ess.inst_collection_id; })[0].condition :
                    '';
                //store if this is retrieved (if not, show ! for them to retrieve it in order to complete the peak
                ess.isRetrieved = ess.instrument_status[0].status == 'Retrieved' ? true : false;
                ess.files = allSiteFiles.filter(function (sf) { return sf.instrument_id == ess.instrument_id && (sf.fileBelongsTo == "DataFile File" || sf.fileBelongsTo == "Sensor File"); });
                //var hasDF = {value:true}; (2: Met Station, 5: Rapid Deployment Gage, 6: Rain Gage)
                if (ess.sensor_type_id == 2 || ess.sensor_type_id == 5 || ess.sensor_type_id == 6) {
                    if (ess.files.length === 0) ess.NeedDF = true;
                    else {
                        if (!determineDFPresent(ess.files)) ess.NeedDF = true;
                    }
                }//end if this is a datafile requiring sensor
            });

            
            // $scope.siteFilesForSensors = allSiteFiles.filter(function (f) { return f.instrument_id !== null && f.instrument_id > 0; });
            $scope.timeZoneList = ['UTC', 'PST', 'MST', 'CST', 'EST'];
            $scope.LoggedInMember = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];
            $scope.chosenHWMList = [];//holder of chosen hwms for this peak
            $scope.removedChosenHWMList = []; //holder for removed ones for PUT (if this is edit)
            $scope.chosenDFList = []; //holder for chosen datafile for this peak
            $scope.removedChosenDFList = []; //holder for removed ones for PUT (if this is edit)
            $scope.hwmDetail = false; //show/hide hwm box of hwm details
            $scope.HWMBox = {}; //holds binding for what to show in hwm detail box
            $scope.sensorDetail = false; //show/hide sensor box of sensor details
            $scope.SensorBox = {}; //holds binding for what to show in the sensor detail box
            $scope.dataFileDetail = false; //show/hide datafile box of datafile details
            $scope.DFBox = {}; //holds binding for what to show in the datafile detail box
            $scope.aPeak = {};
            //formatting date and time properly for chrome and ff
            var getDateTimeParts = function (d) {
                var y = d.substr(0, 4);
                var m = d.substr(5, 2) - 1; //subtract 1 for index value (January is 0)
                var da = d.substr(8, 2);
                var h = d.substr(11, 2);
                var mi = d.substr(14, 2);
                var sec = d.substr(17, 2);
                var theDate = new Date(y, m, da, h, mi, sec);
                return theDate;
            };
            //get timezone and timestamp for their timezone for showing.. post/put will convert it to utc
            var getTimeZoneStamp = function (dsent) {
                var sendThis = [];
                var d;

                if (dsent !== undefined) d = new Date(dsent);
                else d = new Date();

                var offset = (d.toString()).substring(35);
                var zone = "";
                switch (offset.substr(0, 3)) {
                    case "Cen":
                        zone = 'CST';
                        break;
                    case "Eas":
                        zone = 'EST';
                        break;
                    case "Mou":
                        zone = 'MST';
                        break;
                    case "Pac":
                        zone = 'PST';
                        break;
                }
                sendThis = [d, zone];
                return sendThis;
            };

            //Datepicker
            $scope.dateOptions = {
                startingDay: 1,
                showWeeks: false
            };
            $scope.datepickrs = {};
            $scope.open = function ($event, which) {
                $event.preventDefault();
                $event.stopPropagation();

                $scope.datepickrs[which] = true;
            };

            //is it UTC or local time..make sure it stays UTC
            var dealWithTimeStampb4Send = function () {
                //check and see if they are not using UTC
                if ($scope.aPeak.time_zone != "UTC") {
                    //convert it
                    var utcDateTime = new Date($scope.aPeak.peak_date).toUTCString();
                    $scope.aPeak.peak_date = utcDateTime;
                    $scope.aPeak.time_zone = 'UTC';
                } else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.aPeak.peak_date.toString().indexOf('GMT') + 3;
                    $scope.aPeak.peak_date = $scope.aPeak.peak_date.toString().substring(0, i);
                }
            };

            //cancel
            $scope.cancel = function () {
                $rootScope.stateIsLoading.showLoading = false; // loading.. 
                $uibModalInstance.dismiss('cancel');
            };
            
            //is number
            $scope.isNum = function (evt) {
                var theEvent = evt || window.event;
                var key = theEvent.keyCode || theEvent.which;
                if (key != 46 && key != 45 && key > 31 && (key < 48 || key > 57)) {
                    theEvent.returnValue = false;
                    if (theEvent.preventDefault) theEvent.preventDefault();
                }
            };

            if (thisPeak != "empty") {
                //#region existing PEAK
                $scope.aPeak = angular.copy(thisPeak);
                $scope.aPeak.peak_date = { date: getDateTimeParts($scope.aPeak.peak_date), time: getDateTimeParts($scope.aPeak.peak_date) };
                //get peak creator name
                $scope.PeakCreator = allMembers.filter(function (m) { return m.member_id == $scope.aPeak.member_id; })[0];
                //check off those hwms used for this peak
                for (var h = 0; h < $scope.eventSiteHWMs.length; h++) {
                    if ($scope.eventSiteHWMs[h].peak_summary_id == $scope.aPeak.peak_summary_id)
                        $scope.eventSiteHWMs[h].selected = true;
                }
                //check off those hwms used for this peak
                //for each eventSiteSensor.. for each file within each sensor... if dataFileID == any of the peakDFs datafileID ====> make that file.selected =true
                for (var s = 0; s < $scope.eventSiteSensors.length; s++) {
                    //for each eventSiteSensor
                    var essI = s;
                    for (var df = 0; df < $scope.eventSiteSensors[essI].files.length; df++) {
                        //for each file within this eventSiteSensor
                        var isThere = thisPeakDFs.filter(function (pdf) { return pdf.data_file_id == $scope.eventSiteSensors[essI].files[df].data_file_id; })[0];
                        if (isThere !== undefined) $scope.eventSiteSensors[essI].files[df].selected = true;
                    }
                }
                //#endregion existing PEAK
            } else {
                //#region new PEAK
                var timeParts = getTimeZoneStamp();
                $scope.aPeak = { peak_date: { date: timeParts[0], time: timeParts[0] }, time_zone: timeParts[1], member_id: $cookies.get('mID') };
                $scope.PeakCreator = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];
               
                //#endregion new PEAK
            }

            //show a modal with the larger file image as a preview
            $scope.showImageModal = function (image) {
                var imageModal = $uibModal.open({
                    template: '<div class="modal-header"><h3 class="modal-title">Image File Preview</h3></div>' +
                        '<div class="modal-body"><img ng-src="{{setSRC}}" /></div>' +
                        '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.ok = function () {
                            $uibModalInstance.close();
                        };
                        $scope.imageId = image;
                        $scope.setSRC = SERVER_URL + '/Files/' + $scope.imageId + '/Item';
                    }],
                    size: 'md'
                });
            };

            //#region hwm list stuff
            var formatSelectedHWM = function (h) {
                var fhwm = {};
                fhwm.approval_id = h.approval_id;
                fhwm.bank = h.bank;
                fhwm.elev_ft = h.elev_ft;
                fhwm.event_id = h.event_id;
                fhwm.flag_date = h.flag_date;
                fhwm.flag_member_id = h.flag_member_id;
                fhwm.hcollect_method_id = h.hcollect_method_id;
                fhwm.hdatum_id = h.hdatum_id;
                fhwm.height_above_gnd = h.height_above_gnd;
                fhwm.hwm_environment = h.hwm_environment;
                fhwm.hwm_id = h.hwm_id;
                fhwm.hwm_locationdescription = h.hwm_locationdescription;
                fhwm.hwm_notes = h.hwm_notes;
                fhwm.hwm_uncertainty = h.hwm_uncertainty;
                fhwm.hwm_quality_id = h.hwm_quality_id;
                fhwm.hwm_type_id = h.hwm_type_id;
                fhwm.latitude_dd = h.latitude;
                fhwm.longitude_dd = h.longitude;
                fhwm.marker_id = h.marker_id;
                fhwm.peak_summary_id = h.peak_summary_id;
                fhwm.site_id = h.site_id;
                fhwm.stillwater = h.stillwater == "No" ? 0 : 1;
                fhwm.survey_date = h.survey_date;
                fhwm.survey_member_id = h.survey_member_id;
                fhwm.vcollect_method_id = h.vcollect_method_id;
                fhwm.vdatum_id = h.vdatum_id;
                fhwm.waterbody = h.waterbody;
                return fhwm;
            };
            //add or remove a hwm from the list of chosen hwms for determining this peak
            $scope.addHWM = function (h) {
                var aHWM = formatSelectedHWM(h);
                if (h.selected === true) {                    
                    $scope.chosenHWMList.push(aHWM);
                } else {
                    if ($scope.aPeak.peak_summary_id !== undefined) {
                        //edit.. need to store removed ones for PUT
                        $scope.removedChosenHWMList.push(dataFile);
                    }
                    if ($scope.chosenHWMList.length > 0) {
                        var ind = $scope.chosenHWMList.map(function (hwm) { return hwm.hwm_id; }).indexOf(aHWM.hwm_id); //not working:: $scope.chosenHWMList.indexOf(aHWM);
                        $scope.chosenHWMList.splice(ind, 1);
                    }
                }
            };
            
            //they want to see the details of the hwm, or not see it anymore
            $scope.showHWMDetails = function (h) {
                $scope.hwmDetail = true; $scope.sensorDetail = false; $scope.dataFileDetail = false;
                $scope.HWMBox = h;
            };

            //use this hwm to populate peak parts (primary hwm for determining peak)
            $scope.primaryHWM = function (h) {
                var setPrimHWM = $uibModal.open({
                    template: '<div class="modal-header"><h3 class="modal-title">Set as Primary</h3></div>' +
                        '<div class="modal-body"><p>Are you sure you want to set this as the Primary HWM? Doing so will populate the Peak Date (not including time), Stage, Vertical Datum and Height Above Ground.</p></div>' +
                        '<div class="modal-footer"><button class="btn btn-primary" ng-click="SetIt()">Set as Primary</button><button class="btn btn-primary" ng-click="cancel()">Cancel</button></div>',
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss();
                        };
                        $scope.SetIt = function () {
                            $uibModalInstance.close('Yes');
                        };
                    }],
                    size: 'sm'
                });
                setPrimHWM.result.then(function (setIt) {
                    if (setIt == 'Yes') {
                        $scope.aPeak.peak_date.date = new Date(h.flag_date);
                        $scope.aPeak.peak_stage = h.elev_ft;
                        $scope.aPeak.vdatum_id = h.vdatum_id;
                        $scope.aPeak.height_above_gnd = h.height_above_gnd;
                        var hIndex = $scope.eventSiteHWMs.indexOf(h);
                        $scope.eventSiteHWMs[hIndex].selected = true;
                    }
                });
            };
            //#endregion

            $scope.closeDetail = function () {
                $scope.sensorDetail = false; $scope.hwmDetail = false; $scope.dataFileDetail = false;
            };

            //#region sensor list stuff
            //add or remove a sensor from the list of chosen sensor for determining this peak
            $scope.addDataFile = function (datafile) {
                var dataFile = {};                
                DATA_FILE.query({ id: datafile.data_file_id }).$promise.then(function (response) {
                    dataFile = response;
                    if (datafile.selected === true) {
                        $scope.chosenDFList.push(dataFile);
                    } else {
                        if ($scope.aPeak.peak_summary_id !== undefined) {
                            //edit.. need to store removed ones for PUT
                            $scope.removedChosenDFList.push(dataFile);
                        }
                        if ($scope.chosenDFList.length > 0) {
                            var ind = $scope.chosenDFList.map(function (df) { return df.data_file_id; }).indexOf(datafile.data_file_id); //not working:: $scope.chosenDFList.indexOf(s);
                            $scope.chosenDFList.splice(ind, 1);
                        }
                    }
                });
            };

            //they want to see the details of the sensor, or not see it anymore
            $scope.showSensorDetails = function (s) {
                $scope.sensorDetail = true; $scope.hwmDetail = false; $scope.dataFileDetail = false;
                $scope.SensorBox = s;
            };
            //they want to see the details of the datafile, or not see it anymore
            $scope.showDataFileDetails = function (f) {
                DATA_FILE.query({ id: f.data_file_id }, function success(response) {
                    $scope.DFBox = response;
                    $scope.DFBox.filePath = f.path;
                    $scope.DFBox.fileID = f.file_id;
                    $scope.DFBox.fileDesc = f.description;
                    $scope.DFBox.processedBy = allMembers.filter(function (m) { return m.member_id == response.processor_id; })[0];
                    $scope.DFBox.nwisFile = f.is_nwis == 1 ? true : false;
                    $scope.DFBox.fileURL = f.name;
                    $scope.dataFileDetail = true; $scope.hwmDetail = false; $scope.sensorDetail = false;
                });
                
                
            };
            //use this hwm to populate peak parts (primary sensor for determining peak)
            /*'<div class="modal-body"><p>Are you sure you want to set this as the Primary Data file? Doing so will populate the Peak Date, Time and time zone, Stage, Vertical Datum and Height Above Ground.</p></div>' +
                        '<div class="modal-footer"><button class="btn btn-primary" ng-click="SetIt()">Set as Primary</button><button class="btn btn-primary" ng-click="cancel()">Cancel</button></div>',*/
            $scope.primaryDataFile = function (f) {
                var setPrimeDF = $uibModal.open({
                    template: '<div class="modal-header"><h3 class="modal-title">Set as Primary</h3></div>' +
                        '<div class="modal-body"><p>Are you sure you want to set this as the Primary Data file?</p><p>(Coming soon: Script processing to populate the Peak date, time and time zone, Stage, Vertical Datum and Height above ground)</p></div>' +
                        '<div class="modal-footer"><button class="btn btn-primary" ng-click="SetIt()">Set as Primary</button><button class="btn btn-primary" ng-click="cancel()">Cancel</button></div>',
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss();
                        };
                        $scope.SetIt = function () {
                            $uibModalInstance.close('Yes');
                        };
                    }],
                    size: 'sm'
                });
                setPrimeDF.result.then(function (setIt) {
                    if (setIt == 'Yes') {
                        //$scope.aPeak.peak_date.date = h.flag_date;
                        //$scope.aPeak.peak_stage = h.elev_ft;
                        //$scope.aPeak.vdatum_id = h.vdatum_id
                        //$scope.aPeak.height_above_gnd = h.height_above_gnd;
                        var sens = $scope.eventSiteSensors.filter(function (s) { return s.instrument_id == f.instrument_id; })[0];
                        var sIndex = $scope.eventSiteSensors.indexOf(sens);
                        var fIndex = sens.files.indexOf(f);
                        $scope.eventSiteSensors[sIndex].files[fIndex].selected = true;
                    }
                });
            };
            //#endregion

            //save Peak
            $scope.savePeak = function (valid) {
                if (valid) {
                    var updatedPeak = {};                       
                    var datetime = new Date($scope.aPeak.peak_date.date.getFullYear(), $scope.aPeak.peak_date.date.getMonth(), $scope.aPeak.peak_date.date.getDate(),
                        $scope.aPeak.peak_date.time.getHours(), $scope.aPeak.peak_date.time.getMinutes(), $scope.aPeak.peak_date.time.getSeconds());
                    $scope.aPeak.peak_date = datetime;
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    PEAK.update({ id: $scope.aPeak.peak_summary_id }, $scope.aPeak).$promise.then(function (response) {
                        //update hwms/datafiles used
                        //remove those unchosen
                        if ($scope.removedChosenDFList.length > 0) {
                            for (var remd = 0; remd < $scope.removedChosenDFList.length; remd++) {
                                $scope.removedChosenDFList[remd].peak_summary_id = null;
                                DATA_FILE.update({ id: $scope.removedChosenDFList[remd].data_file_id }, $scope.removedChosenDFList[remd]).$promise;
                            }
                        }
                        if ($scope.removedChosenHWMList.length > 0) {
                            for (var remh = 0; remh < $scope.removedChosenHWMList.length; remh++) {
                                $scope.removedChosenHWMList[remh].peak_summary_id = null;
                                HWM.update({ id: $scope.removedChosenHWMList[remh].data_file_id }, $scope.removedChosenHWMList[remh]).$promise;
                            }
                        }
                        //add those chosen
                        for (var addh = 0; addh < $scope.chosenHWMList.length; addh++) {
                            $scope.chosenHWMList[addh].peak_summary_id = response.peak_summary_id;
                            HWM.update({ id: $scope.chosenHWMList[addh].hwm_id }, $scope.chosenHWMList[addh]).$promise;
                        } //end foreach hwm save
                        for (var addd = 0; addd < $scope.chosenDFList.length; addd++) {
                            $scope.chosenDFList[addd].peak_summary_id = response.peak_summary_id;
                            DATA_FILE.update({ id: $scope.chosenDFList[addd].data_file_id }, $scope.chosenDFList[addd]).$promise;
                        } //end foreach hwm save
                        toastr.success("Peak updated");
                        updatedPeak = response;
                        var sendBack = [updatedPeak, 'updated'];
                        $uibModalInstance.close(sendBack);
                    });
                }
            };//end save()

            //data file ID to get df and remove peakid for peakDelete
            var updateDFwoPeakID = function (df_id) {
                //get it, change peak id, put it back
                DATA_FILE.query({ id: df_id }).$promise.then(function (res) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    res.peak_summary_id = null;
                    DATA_FILE.update({ id: res.data_file_id }, res).$promise;
                });
            };
            //delete Peak
            $scope.deletePeak = function () {
                var deletePeakMdl = $uibModal.open({
                    template: '<div class="modal-header"><h3 class="modal-title">Remove Peak</h3></div>' +
                        '<div class="modal-body"><p>Are you sure you want to delete this Peak?</p></div>' +
                        '<div class="modal-footer"><button class="btn btn-primary" ng-click="Ok()">OK</button><button class="btn btn-warning" ng-click="cancel()">Cancel</button></div>',
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.Ok = function () {
                            $uibModalInstance.close();
                        };
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss();
                        };                       
                    }],
                    size: 'sm'
                });               

                deletePeakMdl.result.then(function () {
                    var peakID = $scope.aPeak.peak_summary_id;
                    var datetime = new Date($scope.aPeak.peak_date.date.getFullYear(), $scope.aPeak.peak_date.date.getMonth(), $scope.aPeak.peak_date.date.getDate(),
                        $scope.aPeak.peak_date.time.getHours(), $scope.aPeak.peak_date.time.getMinutes(), $scope.aPeak.peak_date.time.getSeconds());
                    $scope.aPeak.peak_date = datetime;
                    //delete the peak and then PUT all hwm and df that have peakID
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    PEAK.delete({ id: $scope.aPeak.peak_summary_id }).$promise.then(function () {
                        //for each $scope.eventSiteSensors for each files if file.selected == true.. PUT and remove PEAKID
                        for (var i = 0; i < $scope.eventSiteSensors.length; i++) {
                            var thisS = $scope.eventSiteSensors[i];
                            for (var f = 0; f < thisS.files.length; f++) {
                                var thisF = thisS.files[f];
                                if (thisF.selected)
                                    updateDFwoPeakID(thisF.data_file_id);
                            }
                        }
                        //for each $scope.eventSiteHWMs if h.selected == true.. PUT and remove PEAKID 
                        
                        for (var h = 0; h < $scope.eventSiteHWMs.length; h++) {
                            var thisH = $scope.eventSiteHWMs[h];
                            if (thisH.selected) {
                                //remove peakID and PUT
                                thisH.peak_summary_id = null;
                                var updateThisHWM = formatSelectedHWM(thisH); //need to format it to remove all the site stuff
                                HWM.update({ id: thisH.hwm_id }, updateThisHWM).$promise;
                            }
                        }

                        toastr.success("Peak Removed");
                        var sendBack = ["de", 'deleted'];
                        $uibModalInstance.close(sendBack);
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    });
                }, function () {
                    //logic for cancel
                });//end modal
            };

            //create Peak
            $scope.createPeak = function (valid) {
                //first determine that they did chooose a hwm or data file for interpretatoin
                var isHwmChecked = false; var isDFChecked = false;
                angular.forEach($scope.eventSiteHWMs, function (shwm) {
                    if (shwm.selected) isHwmChecked = true;
                });
                angular.forEach($scope.eventSiteSensors, function (ssen) {
                    for (var fI = 0; fI < ssen.files.length; fI++) {
                        if (ssen.files[fI].selected) {
                            isDFChecked = true;
                            fI = ssen.files.length;
                        }
                    }
                });
                if (isHwmChecked || isDFChecked) {
                    //they chose one, but is it valid
                    if (valid) {
                        var createdPeak = {};
                        //format to combine the date and time back together into 1 date object
                        var datetime = new Date($scope.aPeak.peak_date.date.getFullYear(), $scope.aPeak.peak_date.date.getMonth(), $scope.aPeak.peak_date.date.getDate(),
                           $scope.aPeak.peak_date.time.getHours(), $scope.aPeak.peak_date.time.getMinutes(), $scope.aPeak.peak_date.time.getSeconds());
                        $scope.aPeak.peak_date = datetime;
                        dealWithTimeStampb4Send(); //UTC or local?

                        $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                        $http.defaults.headers.common.Accept = 'application/json';
                        PEAK.save($scope.aPeak).$promise.then(function (response) {
                            createdPeak = response;
                            //update the chosen hwms/data files with peak id
                            for (var h = 0; h < $scope.chosenHWMList.length; h++) {
                                $scope.chosenHWMList[h].peak_summary_id = response.peak_summary_id;
                                HWM.update({ id: $scope.chosenHWMList[h].hwm_id }, $scope.chosenHWMList[h]).$promise;
                            } //end foreach hwm save
                            for (var d = 0; d < $scope.chosenDFList.length; d++) {
                                $scope.chosenDFList[d].peak_summary_id = response.peak_summary_id;
                                DATA_FILE.update({ id: $scope.chosenDFList[d].data_file_id }, $scope.chosenDFList[d]).$promise;
                            } //end foreach hwm save

                            toastr.success("Peak created");
                            var sendBack = [createdPeak, 'created'];
                            $uibModalInstance.close(sendBack);
                        });
                    }
                } else {
                    //no data file or hwm checked as used, show modal
                    var setOneModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>You must choose at least one HWM or Data File to use for interpretation for this Peak Summary.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-click="Ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.Ok = function () {
                                $uibModalInstance.dismiss();
                            };
                        }],
                        size: 'sm'
                    });
                }
            };//end create()
      
            $scope.showIncompleteDFInfo = function () {
                var incompleteModal = $uibModal.open({
                    template: '<div class="modal-header"><h3 class="modal-title">Incomplete Data File</h3></div>' +
                        '<div class="modal-body"><p>All RDGs, Met Station, and Rain Gage sensors require data file information in order to use as primary in the Peak summary.</p>' + 
                        '<p>Please revisit the Retrieved Sensor and click on NWIS Data Connection to add a link to the NWIS data if you want to use as primary.</p></div>' +
                        '<div class="modal-footer"><button class="btn btn-primary" ng-click="Ok()">OK</button></div>',
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.Ok = function () {
                            $uibModalInstance.dismiss();
                        };
                    }],
                    size: 'sm'
                });
            };
            $scope.showIncompleteHWMInfo = function () {
                var incompleteModal = $uibModal.open({
                    template: '<div class="modal-header"><h3 class="modal-title">Incomplete HWM</h3></div>' +
                        '<div class="modal-body"><p>Survey date and elevation are required in order to use as primary in the Peak summary.</p>' +
                        '<p>Please revisit the HWM and add Survey date and elevation if you want to use as primary.</p><p>The HWM can be used for interpreation withouth a final elevation.</p></div>' +
                        '<div class="modal-footer"><button class="btn btn-primary" ng-click="Ok()">OK</button></div>',
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.Ok = function () {
                            $uibModalInstance.dismiss();
                        };
                    }],
                    size: 'sm'
                });
            };
            $scope.showRetrieveInfo = function () {
                var goRetrieveModal = $uibModal.open({
                    template: '<div class="modal-header"><h3 class="modal-title">Deployed Sensor</h3></div>' +
                        '<div class="modal-body"><p>This senosr needs to be retrieved before a Peak can be created.</p></div>' +
                        '<div class="modal-footer"><button class="btn btn-primary" ng-click="Ok()">OK</button></div>',
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.Ok = function () {
                            $uibModalInstance.dismiss();
                        };
                    }],
                    size: 'sm'
                });
            };

            $rootScope.stateIsLoading.showLoading = false; // loading..
        }]); //end HWM
})();