(function () {
    'use strict';

    var ModalControllers = angular.module('ModalControllers');

    //deploy new or proposed sensor, edit deployed modal
    ModalControllers.controller('sensorModalCtrl', ['$scope', '$rootScope', '$timeout', '$cookies', '$http', '$sce', '$uibModalInstance', '$uibModal', 'SERVER_URL', 'FILE_STAMP', 'allDropdowns', 'agencyList', 'Site_Files', 'allDepTypes', 'thisSensor', 'SensorSite', 'siteOPs', 'allMembers', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'DATA_FILE', 'FILE', 'SOURCE', 'OP_MEASURE',
        function ($scope, $rootScope, $timeout, $cookies, $http, $sce, $uibModalInstance, $uibModal, SERVER_URL, FILE_STAMP, allDropdowns, agencyList, Site_Files, allDepTypes, thisSensor, SensorSite, siteOPs, allMembers, INSTRUMENT, INSTRUMENT_STATUS, DATA_FILE, FILE, SOURCE, OP_MEASURE) {
            //dropdowns [0]allSensorTypes, [1]allSensorBrands, [2]allHousingTypes, [3]allSensDeps, [4]allEvents      
            $scope.sensorTypeList = allDropdowns[0];
            $scope.sensorBrandList = allDropdowns[1];
            $scope.houseTypeList = allDropdowns[2];
            // $scope.sensorDeployList = allDropdowns[3];
            $scope.eventList = allDropdowns[3];
            $scope.fileTypeList = allDropdowns[4]; //used if creating/editing depSens file
            $scope.vertDatumList = allDropdowns[5];

            // commented out method to hide datum
            /* var vdatumWoNad29 = [];
            angular.forEach($scope.vertDatumList, function (value, key) {

                if (value.datum_id == 4) {
                    // don't add it to the array
                } else {
                    vdatumWoNad29.push(value);
                }
            });
            $scope.vertDatumList = vdatumWoNad29; */
            $scope.depSenfileIsUploading = false; //Loading...
            $scope.allSFiles = Site_Files.getAllSiteFiles();
            $scope.DepSensorFiles = thisSensor !== "empty" ? $scope.allSFiles.filter(function (sf) { return sf.instrument_id == thisSensor.instrument_id; }) : [];// holder for hwm files added
            $scope.depSensImageFiles = $scope.DepSensorFiles.filter(function (hf) { return hf.filetype_id === 1; }); //image files for carousel
            $scope.showFileForm = false; //hidden form to add file to hwm
            $scope.showNWISFileForm = false; //hidden form to add nwis file to sensor
            $scope.OPsPresent = siteOPs.length > 0 ? true : false;
            $scope.OPsForTapeDown = siteOPs;
            $scope.removeOPList = [];
            $scope.tapeDownTable = []; //holder of tapedown OP_MEASUREMENTS
            $scope.depTypeList = allDepTypes; //get fresh version so not messed up with the Temperature twice
            $scope.filteredDeploymentTypes = [];
            $scope.timeZoneList = ['UTC', 'PST', 'MST', 'CST', 'EST', 'PDT', 'MDT', 'CDT', 'EDT'];
            $scope.userRole = $cookies.get('usersRole');
            $scope.showEventDD = false; //toggle to show/hide event dd (admin only)
            $scope.adminChanged = {}; //will hold event_id if admin changes it. apply when PUTting
            $scope.IntervalType = {}; //holder for minute/second radio buttons
            $scope.whichButton = ""; //holder for save/deploy button at end .. 'deploy' if proposed->deployed, and for deploying new or save if editing existing
            $scope.serverURL = SERVER_URL;
            $scope.nwisHeaderTip = $sce.trustAsHtml('Connect your transmitting sensor with NWIS via <em>Station ID for USGS gage</em> from the Site details.');
            $scope.view = { DEPval: 'detail', RETval: 'detail' };
            $scope.sensorDataNWIS = false; //is this a rain gage, met station, or rdg sensor -- if so, data file must be created pointing to nwis (we don't store actual file, just metadata with link)
            $scope.s = { depOpen: true, sFileOpen: false, NWISFileOpen: false };
            $scope.chopperResponse1 = false; //set to true and show highchart with chopper results
            $scope.chopperResponse1Keys = [];
            $scope.chartOptions1 = {};
            $scope.chartData = [];
            Array.prototype.zip = function (arr) {
                return this.map(function (e, i) {
                    return [e, arr[i]];
                })
            };

            $scope.daylightSavingsChop = { selected: false };

            $scope.runChopper = function () {
                $scope.chartData = [];
                $scope.chartOptions1 = {};
                $scope.chopperResponse1 = false;
                $scope.chopperResponse1Keys = [];
                if ($scope.chartObj) {
                    $scope.chartObj.xAxis[0].removePlotLine("start");
                    $scope.chartObj.xAxis[0].removePlotLine("end");
                }
                if ($scope.aFile.File !== undefined) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    var fileParts = {
                        FileEntity: {
                            site_id: $scope.thisSensorSite.site_id,
                            instrument_id: thisSensor.instrument_id,
                            /* description: $scope.daylightSavingsChop.selected */ // holder of the daylight savings true/false value. Services parsed it out.
                        },
                        File: $scope.aFile.File
                    };
                    //need to put the fileParts into correct format for send 
                    var fd = new FormData();
                    fd.append("FileEntity", JSON.stringify(fileParts.FileEntity));
                    fd.append("File", fileParts.File);
                    $scope.smlallLoaderGo = true;
                    DATA_FILE.runChopperScript(fd).$promise.then(function (response) {
                        $scope.smlallLoaderGo = false;
                        $scope.chopperResponse1Keys = Object.keys(response);
                        if (response.Error) {
                            var errorMessage = response.Error;
                            var failedChopper = $uibModal.open({
                                template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                    '<div class="modal-body"><p>There was an error running the chopper.</p><p>Error: {{errorMessage}}</p></div>' +
                                    '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                controller: ['$scope', '$uibModalInstance', 'message', function ($scope, $uibModalInstance, message) {
                                    $scope.errorMessage = message;
                                    $scope.ok = function () {
                                        $uibModalInstance.dismiss();
                                    };
                                }],
                                resolve: {
                                    message: function () {
                                        return errorMessage;
                                    }
                                },
                                size: 'sm'
                            });
                        } else {
                            $scope.chartData = response.time.zip(response.pressure);
                            //preset the start/end dates to the 1st and last as the chartData.time
                            var sDate = new Date(response.time[0]).toISOString();
                            var eDate = new Date(response.time[response.time.length - 1]).toISOString();
                            var sd = getDateTimeParts(sDate); var ed = getDateTimeParts(eDate);
                            $scope.datafile.good_start = sd; $scope.datafile.good_end = ed;

                            $scope.chartOptions1 = {
                                chart: {
                                    events: {
                                        load: function () {
                                            $scope.chartObj = this;
                                        }
                                    },
                                    zoomType: 'x',
                                    resetZoomButton: {
                                        position: {
                                            align: 'left', // by default
                                            verticalAlign: 'bottom', // by default
                                            // x: 0,
                                            y: 70
                                        }
                                    },
                                    panning: true,
                                    panKey: 'shift'
                                },
                                boostThreshold: 2000,
                                plotOptions: {
                                    series: {
                                        events: {
                                            click: function (event) {
                                                var pointClick = $uibModal.open({
                                                    template: '<div class="modal-header"><h3 class="modal-title"></h3></div>' +
                                                        '<div class="modal-body"><p>Would you like to set this ({{thisDate}}) as:</p>' +
                                                        '<div style="text-align:center;"><span class="radio-inline"><input type="radio" name="whichDate" ng-model="whichDate" value="start" />Good Start Date</span>' +
                                                        '<span class="radio-inline"><input type="radio" name="whichDate" ng-model="whichDate" value="end" />Good End Date</span></div>' +
                                                        '</div>' +
                                                        '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button>' +
                                                        '<button class="btn btn-primary" ng-enter="cancel()" ng-click="cancel()">Cancel</button></div>',
                                                    controller: ['$scope', '$uibModalInstance', 'chosenDate', 'xEvent', function ($scope, $uibModalInstance, chosenDate, xEvent) {
                                                        $scope.ok = function () {
                                                            if ($scope.whichDate == "") alert("No Date chosen");
                                                            else {
                                                                var parts = [$scope.whichDate, chosenDate, xEvent];
                                                                $uibModalInstance.close(parts);
                                                            };
                                                        };
                                                        $scope.cancel = function () {
                                                            $uibModalInstance.dismiss();
                                                        }
                                                        $scope.whichDate = "";
                                                        $scope.thisDate = new Date(chosenDate);
                                                    }],
                                                    resolve: {
                                                        chosenDate: event.point.category,
                                                        xEvent: event.chartX
                                                    },
                                                    size: 'sm'
                                                });
                                                pointClick.result.then(function (parts) {
                                                    var chart = $scope.chartObj.xAxis[0];
                                                    // check if there's already a plotline with this id and remove it if so
                                                    chart.removePlotLine(parts[0]);
                                                    // add the plot line to visually see where they added
                                                    chart.addPlotLine({
                                                        value: chart.toValue(parts[2]),
                                                        color: parts[0] == "start" ? '#00ff00' : '#ff0000',
                                                        width: 2,
                                                        id: parts[0],
                                                        zIndex: 19999,
                                                        label: { text: parts[0] }
                                                    });
                                                    var theDate = new Date(parts[1]).toISOString();
                                                    var d = getDateTimeParts(theDate);
                                                    if (parts[0] == "start") $scope.datafile.good_start = d;
                                                    else $scope.datafile.good_end = d;
                                                });
                                            }
                                        },
                                        allowPointSelect: true,
                                        cursor: 'pointer',
                                        point: {
                                            events: {
                                                mouseOver: function () {
                                                    if (this.series.halo) {
                                                        this.series.halo.attr({ 'class': 'highcharts-tracker' }).toFront();
                                                    }
                                                }
                                            }
                                        },
                                        marker: {
                                            enabled: false // turn dots off
                                        }
                                    }
                                },
                                title: {
                                    text: 'Preview of Pressure Data'
                                },
                                subtitle: {
                                    text: 'Click and drag to zoom in. Hold down shift key to pan. To select Good Start/End Date, click point on line.'
                                },
                                xAxis: {
                                    title: {
                                        text: $scope.chopperResponse1Keys[1]
                                    },
                                    type: 'datetime',
                                    dateTimeLabelFormats: {
                                        second: '%Y-%m-%d<br/>%H:%M:%S',
                                        minute: '%Y-%m-%d<br/>%H:%M',
                                        hour: '%Y-%m-%d<br/>%H:%M',
                                        day: '%Y<br/>%m-%d',
                                        week: '%Y<br/>%m-%d',
                                        month: '%Y-%m',
                                        year: '%Y'
                                    },
                                    offset: 10
                                },
                                yAxis: {
                                    title: {
                                        text: $scope.chopperResponse1Keys[0]
                                    },
                                    labels: {
                                        format: '{value} psi'
                                    },
                                    offset: 10
                                },
                                series: [{
                                    data: $scope.chartData,

                                }]
                            };
                            $scope.chopperResponse1 = true;
                        }
                    }, function (error) {
                        console.log(error);
                    });
                } else {
                    //the file wasn't there..
                    alert("You need to choose a file first");
                }
            };

            //formatting date and time properly for chrome and ff
            var getDateTimeParts = function (d) {
                var theDate;
                var isDate = Object.prototype.toString.call(d) === '[object Date]';
                if (isDate === false) { // "2017-09-28T09:33:09"
                    var y = d.substr(0, 4);
                    var m = d.substr(5, 2) - 1; //subtract 1 for index value (January is 0)
                    var da = d.substr(8, 2);
                    var h = d.substr(11, 2);
                    var mi = d.substr(14, 2);
                    var sec = d.substr(17, 2);
                    theDate = new Date(y, m, da, h, mi, sec);
                } else {
                    theDate = d;
                }
                return theDate;
            };

            //new datetimepicker https://github.com/zhaber/angular-js-bootstrap-datetimepicker
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

            

            //#region file Upload
            $scope.stamp = FILE_STAMP.getStamp(); $scope.fileItemExists = true;
            //need to reupload fileItem to this existing file OR Change out existing fileItem for new one
            $scope.saveFileUpload = function () {
                if ($scope.aFile.File1 == undefined && $scope.aFile.File == undefined) {
                    alert("You need to choose a file first");
                } else {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    $scope.sFileIsUploading = true;
                    var fileParts = {
                        FileEntity: {
                            file_id: $scope.aFile.file_id,
                            name: $scope.aFile.name,
                            description: $scope.aFile.description,
                            photo_direction: $scope.aFile.photo_direction,
                            latitude_dd: $scope.aFile.latitude_dd,
                            longitude_dd: $scope.aFile.longitude_dd,
                            file_date: $scope.aFile.file_date,
                            hwm_id: $scope.aFile.hwm_id,
                            site_id: $scope.aFile.site_id,
                            filetype_id: $scope.aFile.filetype_id,
                            source_id: $scope.aFile.source_id,
                            path: $scope.aFile.path,
                            data_file_id: $scope.aFile.data_file_id,
                            instrument_id: $scope.aFile.instrument_id,
                            photo_date: $scope.aFile.photo_date,
                            is_nwis: $scope.aFile.is_nwis,
                            objective_point_id: $scope.aFile.objective_point_id
                        },
                        File: $scope.aFile.File1 !== undefined ? $scope.aFile.File1 : $scope.aFile.File
                    };
                    //need to put the fileParts into correct format for post
                    var fd = new FormData();
                    fd.append("FileEntity", JSON.stringify(fileParts.FileEntity));
                    fd.append("File", fileParts.File);
                    //now POST it (fileparts)
                    FILE.uploadFile(fd).$promise.then(function (fresponse) {
                        toastr.success("File Uploaded");
                        $scope.src = $scope.serverURL + '/Files/' + $scope.aFile.file_id + '/Item' + FILE_STAMP.getStamp();
                        FILE_STAMP.setStamp();
                        $scope.stamp = FILE_STAMP.getStamp();
                        if ($scope.aFile.File1.type.indexOf("image") > -1) {
                            $scope.isPhoto = true;
                        } else $scope.isPhoto = false;
                        $scope.aFile.name = fresponse.name; $scope.aFile.path = fresponse.path;
                        if ($scope.aFile.File1 !== undefined) {
                            $scope.aFile.File = $scope.aFile.File1;
                            $scope.aFile.File1 = undefined; //put it as file and remove it from 1
                        }
                        fresponse.fileBelongsTo = $scope.aFile.filetype_id == 2 ? "DataFile File" : "Sensor File";
                        if (fresponse.filetype_id === 1) {
                            $scope.depSensImageFiles.splice($scope.existIMGFileIndex, 1);
                            $scope.depSensImageFiles.push(fresponse);
                        }
                        $scope.DepSensorFiles[$scope.existFileIndex] = fresponse;
                        $scope.allSFiles[$scope.allSFileIndex] = fresponse;
                        Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                        $scope.sFileIsUploading = false;
                        $scope.fileItemExists = true;
                    }, function (errorResponse) {
                        $scope.sFileIsUploading = false;
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error creating file: " + errorResponse.statusText);
                    });
                }
            };

            //show a modal with the larger image as a preview on the photo file for this op
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

            //want to add or edit file
            $scope.showFile = function (file) {
                $scope.fileTypes = $scope.fileTypeList;
                $scope.agencies = agencyList;
                $scope.existFileIndex = -1;
                $scope.existIMGFileIndex = -1;
                $scope.allSFileIndex = -1; //indexes for splice/change
                $scope.aFile = {}; //holder for file
                $scope.aSource = {}; //holder for file source
                $scope.datafile = {}; //holder for file datafile
                if (file !== 0) {
                    //edit op file
                    $scope.existFileIndex = $scope.DepSensorFiles.indexOf(file);
                    $scope.allSFileIndex = $scope.allSFiles.indexOf(file);
                    $scope.existIMGFileIndex = $scope.depSensImageFiles.length > 0 ? $scope.depSensImageFiles.indexOf(file) : -1;
                    $scope.aFile = angular.copy(file);
                    FILE.getFileItem({ id: $scope.aFile.file_id }).$promise.then(function (response) {
                        $scope.fileItemExists = response.Length > 0 ? true : false;
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting file item: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error getting file item: " + errorResponse.statusText);
                    });
                    $scope.aFile.fileType = $scope.fileTypeList.filter(function (ft) { return ft.filetype_id == $scope.aFile.filetype_id; })[0].filetype;
                    if ($scope.aFile.name !== undefined) {
                        var fI = $scope.aFile.name.lastIndexOf(".");
                        var fileExt = $scope.aFile.name.substring(fI + 1);
                        if (fileExt.match(/(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
                            $scope.isPhoto = true;
                        } else $scope.isPhoto = false;
                    }
                    $scope.src = $scope.serverURL + '/Files/' + $scope.aFile.file_id + '/Item' + FILE_STAMP.getStamp();
                    $scope.aFile.file_date = new Date($scope.aFile.file_date); //date for validity of form on PUT
                    if ($scope.aFile.photo_date !== undefined) $scope.aFile.photo_date = new Date($scope.aFile.photo_date); //date for validity of form on PUT
                    if (file.source_id !== undefined) {
                        SOURCE.query({ id: file.source_id }).$promise.then(function (s) {
                            $scope.aSource = s;
                            $scope.aSource.FULLname = $scope.aSource.source_name;
                            //add agency name to photo caption
                            if ($scope.aFile.filetype_id == 1)
                                $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
                        }, function (errorResponse) {
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting source: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error getting source: " + errorResponse.statusText);
                        });
                    }//end if source
                    if (file.data_file_id !== undefined) {
                        DATA_FILE.query({ id: file.data_file_id }).$promise.then(function (df) {
                            $scope.datafile = df;
                            $scope.processor = allMembers.filter(function (m) { return m.member_id == $scope.datafile.processor_id; })[0];
                            $scope.datafile.collect_date = new Date($scope.datafile.collect_date);
                            $scope.datafile.good_start = getDateTimeParts($scope.datafile.good_start);
                            $scope.datafile.good_end = getDateTimeParts($scope.datafile.good_end);
                        }, function (errorResponse) {
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting data file: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error getting data file: " + errorResponse.statusText);
                        });
                    }
                }//end existing file
                else {
                    //creating a file
                    $scope.aFile.file_date = new Date(); $scope.aFile.photo_date = new Date();
                    $scope.aSource = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];
                    $scope.aSource.FULLname = $scope.aSource.fname + " " + $scope.aSource.lname;
                    $scope.processor = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];
                    var dt = getTimeZoneStamp();
                    $scope.datafile.collect_date = dt[0];
                    $scope.datafile.time_zone = "UTC";// dt[1]; //will be converted to utc on post/put
                    $scope.datafile.good_start = moment().toISOString();//new Date();
                    $scope.datafile.good_end = moment().toISOString();//new Date();
                    $scope.datafile.good_start = getDateTimeParts($scope.datafile.good_start);//new Date();
                    $scope.datafile.good_end = getDateTimeParts($scope.datafile.good_end);//new Date();
                    getinitialDataTimeDepFile();
                } //end new file
                $scope.showFileForm = true;

                $scope.updateAgencyForCaption = function () {
                    if ($scope.aFile.filetype_id == 1)
                        $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
                };
            };
            //create this new file
            $scope.createFile = function (valid) {
                if ($scope.aFile.File !== undefined) {
                    if ($scope.aFile.filetype_id == 2) {
                        //make sure end date is after start date
                        var s = $scope.datafile.good_start;//need to get dep status date in same format as retrieved to compare
                        var e = $scope.datafile.good_end; //stupid comma in there making it not the same
                        if (new Date(e) < new Date(s)) {
                            valid = false;
                            var fixDate = $uibModal.open({
                                template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                    '<div class="modal-body"><p>The good end date must be after the good start date.</p></div>' +
                                    '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                    $scope.ok = function () {
                                        $uibModalInstance.close();
                                    };
                                }],
                                size: 'sm'
                            });
                            fixDate.result.then(function () {
                                valid = false;
                            });
                        }
                        if (s == undefined || e == undefined) {
                            valid = false;
                            var missingDate = $uibModal.open({
                                template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                    '<div class="modal-body"><p>The good data start date or good data end date is missing. Either choose a date, or click Preview Data to get a chart of the data, where you can choose the dates.</p></div>' +
                                    '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                    $scope.ok = function () {
                                        $uibModalInstance.close();
                                    };
                                }],
                                size: 'sm'
                            });
                            missingDate.result.then(function () {
                                valid = false;
                            });
                        }
                    }
                    if (valid) {
                        $scope.depSenfileIsUploading = true; //Loading...
                        $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                        $http.defaults.headers.common.Accept = 'application/json';
                        //post source or datafile first to get source_id or data_file_id
                        if ($scope.aFile.filetype_id == 2) {
                            //determine timezone
                            if ($scope.datafile.time_zone == "UTC") {
                                // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                                var enteredUtcStartDateTime = $scope.datafile.good_start;
                                enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                                var enteredUtcEndDateTime = $scope.datafile.good_end;
                                enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                                // Cloning date and changing the timezone
                                var correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                correctedutcStartDateTime = correctedutcStartDateTime.tz('Etc/GMT', true).format();

                                var correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                correctedutcEndDateTime = correctedutcEndDateTime.tz('Etc/GMT', true).format();

                                // formatting in UTC
                                var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                                var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            }
                            if ($scope.datafile.time_zone == "EST") {
                                // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                                var enteredUtcStartDateTime = $scope.datafile.good_start;
                                enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                                var enteredUtcEndDateTime = $scope.datafile.good_end;
                                enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                                var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    // Cloning date and changing the timezone
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();
                                }

                                // formatting in UTC
                                var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                                var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            } if ($scope.datafile.time_zone == "PST") {
                                // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                                var enteredUtcStartDateTime = $scope.datafile.good_start;
                                enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                                var enteredUtcEndDateTime = $scope.datafile.good_end;
                                enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                                var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    // Cloning date and changing the timezone
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                     correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();
                                }
                                // formatting in UTC
                                var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                                var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            } if ($scope.datafile.time_zone == "CST") {
                                // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                                var enteredUtcStartDateTime = $scope.datafile.good_start;
                                enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                                var enteredUtcEndDateTime = $scope.datafile.good_end;
                                enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                                var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();
                                }
                                // formatting in UTC
                                var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                                var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            } if ($scope.datafile.time_zone == "MST") {
                                // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                                var enteredUtcStartDateTime = $scope.datafile.good_start;
                                enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                                var enteredUtcEndDateTime = $scope.datafile.good_end;
                                enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                                var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                     correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();
                                }
                                // formatting in UTC
                                var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                                var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            } if ($scope.datafile.time_zone == "PDT") {
                                // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                                var enteredUtcStartDateTime = $scope.datafile.good_start;
                                enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                                var enteredUtcEndDateTime = $scope.datafile.good_end;
                                enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                                var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();
                                }
                                // formatting in UTC
                                var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                                var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            } if ($scope.datafile.time_zone == "EDT") {
                                // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                                var enteredUtcStartDateTime = $scope.datafile.good_start;
                                enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                                var enteredUtcEndDateTime = $scope.datafile.good_end;
                                enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                                var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();
                                }
                                // formatting in UTC
                                var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                                var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            } if ($scope.datafile.time_zone == "CDT") {
                                // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                                var enteredUtcStartDateTime = $scope.datafile.good_start;
                                enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                                var enteredUtcEndDateTime = $scope.datafile.good_end;
                                enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                                var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();
                                }
                                // formatting in UTC
                                var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                                var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            } if ($scope.datafile.time_zone == "MDT") {
                                // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                                var enteredUtcStartDateTime = $scope.datafile.good_start;
                                enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                                var enteredUtcEndDateTime = $scope.datafile.good_end;
                                enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                                var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();
                                }
                                // formatting in UTC
                                var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                                var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            }

                            /* if ($scope.datafile.time_zone != "UTC") {
                                //convert it
                                var utcStartDateTime = new Date($scope.datafile.good_start).toUTCString();
                                var utcEndDateTime = new Date($scope.datafile.good_end).toUTCString();
                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            } */ else {
                                //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                                var si = $scope.datafile.good_start.toString().indexOf('GMT') + 3;
                                var ei = $scope.datafile.good_end.toString().indexOf('GMT') + 3;
                                $scope.datafile.good_start = $scope.datafile.good_start.toString().substring(0, si);
                                $scope.datafile.good_end = $scope.datafile.good_end.toString().substring(0, ei);
                            }
                            $scope.datafile.instrument_id = thisSensor.instrument_id;
                            $scope.datafile.processor_id = $cookies.get('mID');
                            var datafileID = 0;
                            DATA_FILE.save($scope.datafile).$promise.then(function (dfResponse) {
                                datafileID = dfResponse.data_file_id;
                                //then POST fileParts (Services populate PATH)
                                var fileParts = {
                                    FileEntity: {
                                        filetype_id: $scope.aFile.filetype_id,
                                        name: $scope.aFile.File.name,
                                        file_date: $scope.aFile.file_date,
                                        description: $scope.aFile.description,
                                        site_id: $scope.thisSensorSite.site_id,
                                        data_file_id: dfResponse.data_file_id,
                                        photo_direction: $scope.aFile.photo_direction,
                                        latitude_dd: $scope.aFile.latitude_dd,
                                        longitude_dd: $scope.aFile.longitude_dd,
                                        instrument_id: thisSensor.instrument_id
                                    },
                                    File: $scope.aFile.File
                                };
                                //need to put the fileParts into correct format for post
                                var fd = new FormData();
                                fd.append("FileEntity", JSON.stringify(fileParts.FileEntity));
                                fd.append("File", fileParts.File);
                                //now POST it (fileparts)
                                FILE.uploadFile(fd).$promise.then(function (fresponse) {
                                    toastr.success("File Uploaded");
                                    fresponse.fileBelongsTo = "DataFile File";
                                    $scope.DepSensorFiles.push(fresponse);
                                    $scope.allSFiles.push(fresponse);
                                    Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                    if (fresponse.filetype_id === 1) $scope.depSensImageFiles.push(fresponse);
                                    $scope.showFileForm = false; $scope.depSenfileIsUploading = false;
                                }, function (errorResponse) {
                                    $scope.depSenfileIsUploading = false;
                                    $scope.aFile = {}; $scope.aSource = {}; $scope.datafile = {}; $scope.showFileForm = false;
                                    // file did not get created, delete datafile
                                    DATA_FILE.delete({ id: datafileID });
                                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file: " + errorResponse.headers(["usgswim-messages"]));
                                    else toastr.error("Error creating file: " + errorResponse.statusText);
                                });
                            }, function (errorResponse) {
                                $scope.depSenfileIsUploading = false;
                                if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file's data file: " + errorResponse.headers(["usgswim-messages"]));
                                else toastr.error("Error creating file's data file: " + errorResponse.statusText);
                            });//end datafile.save()
                        } else {
                            //it's not a data file, so do the source
                            var theSource = { source_name: $scope.aSource.FULLname, agency_id: $scope.aSource.agency_id };//, SOURCE_DATE: $scope.aSource.SOURCE_DATE };
                            SOURCE.save(theSource).$promise.then(function (response) {
                                if ($scope.aFile.filetype_id !== 8) {
                                    //then POST fileParts (Services populate PATH)
                                    var fileParts = {
                                        FileEntity: {
                                            filetype_id: $scope.aFile.filetype_id,
                                            name: $scope.aFile.File.name,
                                            file_date: $scope.aFile.file_date,
                                            photo_date: $scope.aFile.photo_date,
                                            description: $scope.aFile.description,
                                            site_id: $scope.thisSensorSite.site_id,
                                            source_id: response.source_id,
                                            photo_direction: $scope.aFile.photo_direction,
                                            latitude_dd: $scope.aFile.latitude_dd,
                                            longitude_dd: $scope.aFile.longitude_dd,
                                            instrument_id: thisSensor.instrument_id
                                        },
                                        File: $scope.aFile.File
                                    };
                                    //need to put the fileParts into correct format for post
                                    var fd = new FormData();
                                    fd.append("FileEntity", JSON.stringify(fileParts.FileEntity));
                                    fd.append("File", fileParts.File);
                                    //now POST it (fileparts)
                                    FILE.uploadFile(fd).$promise.then(function (fresponse) {
                                        toastr.success("File Uploaded");
                                        fresponse.fileBelongsTo = "Sensor File";
                                        $scope.DepSensorFiles.push(fresponse);
                                        $scope.allSFiles.push(fresponse);
                                        Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                        if (fresponse.filetype_id === 1) $scope.depSensImageFiles.push(fresponse);
                                        $scope.showFileForm = false; $scope.depSenfileIsUploading = false;
                                    }, function (errorResponse) {
                                        $scope.depSenfileIsUploading = false;
                                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file: " + errorResponse.headers(["usgswim-messages"]));
                                        else toastr.error("Error creating file: " + errorResponse.statusText);
                                    });
                                } else {
                                    //this is a link file, no fileItem
                                    $scope.aFile.source_id = response.source_id; $scope.aFile.site_id = $scope.thisSensorSite.site_id; $scope.aFile.instrument_id = thisSensor.instrument_id;
                                    FILE.save($scope.aFile).$promise.then(function (fresponse) {
                                        toastr.success("File Uploaded");
                                        fresponse.fileBelongsTo = "Sensor File";
                                        $scope.DepSensorFiles.push(fresponse);
                                        $scope.allSFiles.push(fresponse);
                                        Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                        $scope.showFileForm = false; $scope.depSenfileIsUploading = false;
                                    }, function (errorResponse) {
                                        $scope.depSenfileIsUploading = false;
                                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file: " + errorResponse.headers(["usgswim-messages"]));
                                        else toastr.error("Error creating file: " + errorResponse.statusText);
                                    });
                                } //end else (it's a Link file)
                            }, function (errorResponse) {
                                $scope.depSenfileIsUploading = false;
                                if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating source: " + errorResponse.headers(["usgswim-messages"]));
                                else toastr.error("Error creating source: " + errorResponse.statusText);
                            });//end source.save()
                        }//end if source
                    }//end valid
                } else {
                    alert("You need to choose a file first");
                }
            };//end create()

            $scope.previewDataTimeDepFile = function () {

                // getting the time initally set for peak date
                if ($scope.datafile.good_start != undefined) {
                    $scope.timePreviewStart = $scope.datafile.good_start;
                    $scope.timePreviewEnd = $scope.datafile.good_end;
                } else {
                    $scope.timePreviewStart = $scope.datafile.good_start;
                    $scope.timePreviewEnd = $scope.datafile.good_end;
                }

                //check and see if they are not using UTC
                if ($scope.datafile.time_zone == "UTC") {
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);

                    // Cloning date and changing the timezone
                    var correctedDateStart = enteredDateStart.clone();
                    var correctedDateEnd = enteredDateEnd.clone();
                    correctedDateStart = correctedDateStart.tz('Etc/GMT', true).format();
                    correctedDateEnd = correctedDateEnd.tz('Etc/GMT', true).format();

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                }
                if ($scope.datafile.time_zone == "EST") { // +5
                    // + 5
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "PST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);

                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
                    }
                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "CST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDatestart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "MST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDatestart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.datafile.time_zone == "PDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.datafile.time_zone == "EDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.datafile.time_zone == "CDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "MDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                }
                else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.timePreviewStart.toString().indexOf('GMT') + 3;
                    var d = $scope.timePreviewEnd.toString().indexOf('GMT') + 3;
                    $scope.timePreviewStart = $scope.timePreviewStart.toString().substring(0, i);
                    $scope.timePreviewEnd = $scope.timePreviewEnd.toString().substring(0, d);
                }

            };

            var getinitialDataTimeDepFile = function () {

                // getting the time initally set for peak date
                if ($scope.datafile.good_start != undefined) {
                    $scope.timePreviewStart = $scope.datafile.good_start;
                    $scope.timePreviewEnd = $scope.datafile.good_end;
                } else {
                    $scope.timePreviewStart = $scope.datafile.good_start;
                    $scope.timePreviewEnd = $scope.datafile.good_end;
                }

                //check and see if they are not using UTC
                if ($scope.datafile.time_zone == "UTC") {
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);

                    // Cloning date and changing the timezone
                    var correctedDateStart = enteredDateStart.clone();
                    var correctedDateEnd = enteredDateEnd.clone();
                    correctedDateStart = correctedDateStart.tz('Etc/GMT', true).format();
                    correctedDateEnd = correctedDateEnd.tz('Etc/GMT', true).format();

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                }
                if ($scope.datafile.time_zone == "EST") { // +5
                    // + 5
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "PST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);

                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
                    }
                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "CST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDatestart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "MST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDatestart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.datafile.time_zone == "PDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.datafile.time_zone == "EDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.datafile.time_zone == "CDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "MDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                }
                else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.timePreviewStart.toString().indexOf('GMT') + 3;
                    var d = $scope.timePreviewEnd.toString().indexOf('GMT') + 3;
                    $scope.timePreviewStart = $scope.timePreviewStart.toString().substring(0, i);
                    $scope.timePreviewEnd = $scope.timePreviewEnd.toString().substring(0, d);
                }

            };

            $scope.saveFile = function (valid) {
                if ($scope.aFile.filetype_id == 2) {
                    //make sure end date is after start date
                    var s = $scope.datafile.good_start;//need to get dep status date in same format as retrieved to compare
                    var e = $scope.datafile.good_end; //stupid comma in there making it not the same
                    if (new Date(e) < new Date(s)) {
                        valid = false;
                        var fixDate = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>The good end date must be after the good start date.</p></div>' +
                                '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                $scope.ok = function () {
                                    $uibModalInstance.close();
                                };
                            }],
                            size: 'sm'
                        });
                        fixDate.result.then(function () {
                            valid = false;
                        });
                    }
                }
                if (valid) {
                    $scope.depSenfileIsUploading = true;
                    //put source or datafile, put file
                    var whatkind = $scope.aFile.fileBelongsTo;
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    if ($scope.datafile.data_file_id !== undefined) {
                        //has DATA_FILE
                        //check timezone and make sure date stays utc
                        if ($scope.datafile.time_zone == "UTC") {
                            // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                            var enteredUtcStartDateTime = $scope.datafile.good_start;
                            enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                            var enteredUtcEndDateTime = $scope.datafile.good_end;
                            enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                            // Cloning date and changing the timezone
                            var correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                            correctedutcStartDateTime = correctedutcStartDateTime.tz('Etc/GMT', true).format();

                            var correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                            correctedutcEndDateTime = correctedutcEndDateTime.tz('Etc/GMT', true).format();

                            // formatting in UTC
                            var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                            var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        }
                        if ($scope.datafile.time_zone == "EST") {
                            // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                            var enteredUtcStartDateTime = $scope.datafile.good_start;
                            enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                            var enteredUtcEndDateTime = $scope.datafile.good_end;
                            enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                            var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    // Cloning date and changing the timezone
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();
                                }
                            // formatting in UTC
                            var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                            var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        } if ($scope.datafile.time_zone == "PST") {
                            // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                            var enteredUtcStartDateTime = $scope.datafile.good_start;
                            enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                            var enteredUtcEndDateTime = $scope.datafile.good_end;
                            enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                            var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    // Cloning date and changing the timezone
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                     correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();
                                }
                            // formatting in UTC
                            var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                            var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        } if ($scope.datafile.time_zone == "CST") {
                            // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                            var enteredUtcStartDateTime = $scope.datafile.good_start;
                            enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                            var enteredUtcEndDateTime = $scope.datafile.good_end;
                            enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                            var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();
                                }
                            // formatting in UTC
                            var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                            var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        } if ($scope.datafile.time_zone == "MST") {
                            // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                            var enteredUtcStartDateTime = $scope.datafile.good_start;
                            enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                            var enteredUtcEndDateTime = $scope.datafile.good_end;
                            enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                            var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                            var correctedutcStartDateTime;
                            var correctedutcEndDateTime;

                            if (isaylightSavings.indexOf('Daylight') >= 0) {

                                correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                correctedutcStartDateTime.add(1, 'hours');
                                correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                correctedutcEndDateTime.add(1, 'hours');
                                correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();

                            }

                            if (isaylightSavings.indexOf('Standard') >= 0) {
                                correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                 correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();
                            }
                            // formatting in UTC
                            var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                            var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        } if ($scope.datafile.time_zone == "PDT") {
                            // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                            var enteredUtcStartDateTime = $scope.datafile.good_start;
                            enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                            var enteredUtcEndDateTime = $scope.datafile.good_end;
                            enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                            var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();
                                }
                            // formatting in UTC
                            var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                            var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        } if ($scope.datafile.time_zone == "EDT") {
                            // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                            var enteredUtcStartDateTime = $scope.datafile.good_start;
                            enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                            var enteredUtcEndDateTime = $scope.datafile.good_end;
                            enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                            var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();
                                }
                            // formatting in UTC
                            var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                            var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        } if ($scope.datafile.time_zone == "CDT") {
                            // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                            var enteredUtcStartDateTime = $scope.datafile.good_start;
                            enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                            var enteredUtcEndDateTime = $scope.datafile.good_end;
                            enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                            var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();
                                }
                            // formatting in UTC
                            var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                            var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        } if ($scope.datafile.time_zone == "MDT") {
                            // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                            var enteredUtcStartDateTime = $scope.datafile.good_start;
                            enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                            var enteredUtcEndDateTime = $scope.datafile.good_end;
                            enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                            var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();
                                }
                            // formatting in UTC
                            var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                            var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        }


                        /* if ($scope.datafile.time_zone != "UTC") {
                            //convert it
                            var utcStartDateTime = new Date($scope.datafile.good_start).toUTCString();
                            var utcEndDateTime = new Date($scope.datafile.good_end).toUTCString();
                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        } */ else {
                            //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                            var si = $scope.datafile.good_start.toString().indexOf('GMT') + 3;
                            var ei = $scope.datafile.good_end.toString().indexOf('GMT') + 3;
                            $scope.datafile.good_start = $scope.datafile.good_start.toString().substring(0, si);
                            $scope.datafile.good_end = $scope.datafile.good_end.toString().substring(0, ei);
                        }
                        DATA_FILE.update({ id: $scope.datafile.data_file_id }, $scope.datafile).$promise.then(function () {
                            FILE.update({ id: $scope.aFile.file_id }, $scope.aFile).$promise.then(function (fileResponse) {
                                toastr.success("File Updated");
                                fileResponse.fileBelongsTo = "DataFile File";
                                $scope.DepSensorFiles[$scope.existFileIndex] = fileResponse;
                                $scope.allSFiles[$scope.allSFileIndex] = fileResponse;
                                Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                $scope.showFileForm = false; $scope.depSenfileIsUploading = false;
                            }, function (errorResponse) {
                                $scope.depSenfileIsUploading = false;
                                if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving file: " + errorResponse.headers(["usgswim-messages"]));
                                else toastr.error("Error saving file: " + errorResponse.statusText);
                            });
                        }, function (errorResponse) {
                            $scope.depSenfileIsUploading = false; //Loading...
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving file's data file: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error saving file's data file: " + errorResponse.statusText);
                        });
                    } else {
                        //has SOURCE
                        // post again (if no change, will return existing one. if edited, will create a new one --instead of editing all files that use this source)
                        var theSource = { source_name: $scope.aSource.FULLname, agency_id: $scope.aSource.agency_id };
                        SOURCE.save(theSource).$promise.then(function (response) {
                            $scope.aFile.source_id = response.source_id;
                            FILE.update({ id: $scope.aFile.file_id }, $scope.aFile).$promise.then(function (fileResponse) {
                                toastr.success("File Updated");
                                fileResponse.fileBelongsTo = "Sensor File";
                                $scope.DepSensorFiles[$scope.existFileIndex] = fileResponse;
                                $scope.allSFiles[$scope.allSFileIndex] = fileResponse;
                                Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                $scope.showFileForm = false; $scope.depSenfileIsUploading = false;
                            }, function (errorResponse) {
                                $scope.depSenfileIsUploading = false;
                                if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving file: " + errorResponse.headers(["usgswim-messages"]));
                                else toastr.error("Error saving file': " + errorResponse.statusText);
                            });
                        }, function (errorResponse) {
                            $scope.depSenfileIsUploading = false; //Loading...
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving source: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error saving source: " + errorResponse.statusText);
                        });
                    }
                }//end valid
            };//end save()

            $scope.deleteFile = function () {
                var DeleteModalInstance = $uibModal.open({
                    backdrop: 'static',
                    keyboard: false,
                    templateUrl: 'removemodal.html',
                    controller: 'ConfirmModalCtrl',
                    size: 'sm',
                    resolve: {
                        nameToRemove: function () {
                            return $scope.aFile;
                        },
                        what: function () {
                            return "File";
                        }
                    }
                });

                

                DeleteModalInstance.result.then(function (fileToRemove) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    FILE.delete({ id: fileToRemove.file_id }).$promise.then(function () {
                        toastr.success("File Removed");
                        $scope.DepSensorFiles.splice($scope.existFileIndex, 1);
                        $scope.allSFiles.splice($scope.allSFileIndex, 1);
                        $scope.depSensImageFiles.splice($scope.existIMGFileIndex, 1);
                        Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                        $scope.showFileForm = false;
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error deleting file: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error deleting file: " + errorResponse.statusText);
                    });
                });//end DeleteModal.result.then
            };//end delete()

            $scope.cancelFile = function () {
                $scope.aFile = {};
                $scope.aSource = {};
                $scope.datafile = {};
                $scope.showFileForm = false;
            };
            //end file Upload

            // NWIS Connection
            $scope.showNWISFile = function (f) {
                //want to add or edit file
                $scope.existFileIndex = -1;
                $scope.allSFileIndex = -1; //indexes for splice/change
                if (f !== 0) {
                    //edit NWIS file
                    $scope.existFileIndex = $scope.sensorNWISFiles.indexOf(f);
                    $scope.allSFileIndex = $scope.allSFiles.indexOf(f);
                    $scope.NWISFile = angular.copy(f);
                    $scope.NWISFile.file_date = new Date($scope.NWISFile.file_date); //date for validity of form on PUT
                    $scope.NWISFile.FileType = "Data";
                    DATA_FILE.query({ id: f.data_file_id }).$promise.then(function (df) {
                        $scope.NWISDF = df;
                        $scope.nwisProcessor = allMembers.filter(function (m) { return m.member_id == $scope.NWISDF.processor_id; })[0];
                        $scope.NWISDF.collect_date = new Date($scope.NWISDF.collect_date);
                        $scope.NWISDF.good_start = getDateTimeParts($scope.NWISDF.good_start);
                        $scope.NWISDF.good_end = getDateTimeParts($scope.NWISDF.good_end);
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting data file: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error getting data file: " + errorResponse.statusText);
                    });
                    //end existing file
                } else {
                    //creating a nwis file
                    $scope.NWISFile = {
                        name: 'https://waterdata.usgs.gov/nwis/uv?site_no=' + $scope.thisSensorSite.usgs_sid,  // if [fill in if not here.. TODO...&begin_date=20160413&end_date=20160419 (event start/end)
                        path: '<link>',
                        file_date: new Date(),
                        filetype_id: 2,
                        FileType: 'Data',
                        site_id: $scope.aSensor.site_id,
                        data_file_id: 0,
                        instrument_id: $scope.aSensor.instrument_id,
                        is_nwis: 1
                    };
                    $scope.NWISDF = {
                        processor_id: $cookies.get("mID"),
                        instrument_id: $scope.aSensor.instrument_id,
                        collect_date: dt[0],
                        time_zone: dt[1],
                        good_start: new Date(),
                        good_end: new Date()
                    };
                    getinitialtimepreviewNWIS();
                    $scope.nwisProcessor = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];
                } //end new file
                $scope.showNWISFileForm = true;
            };
            var postApprovalForNWISfile = function (DFid) {
                DATA_FILE.approveNWISDF({ id: DFid }).$promise.then(function (approvalResponse) {
                    $scope.NWISDF.approval_id = approvalResponse.approval_id;
                }, function (errorResponse) {
                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error approving nwis data file: " + errorResponse.headers(["usgswim-messages"]));
                    else toastr.error("Error approving nwis data file: " + errorResponse.statusText);
                });
            };
            $scope.createNWISFile = function (valid) {
                //make sure end date is after start date
                var s = $scope.NWISDF.good_start;//need to get dep status date in same format as retrieved to compare
                var e = $scope.NWISDF.good_end; //stupid comma in there making it not the same
                if (new Date(e) < new Date(s)) {
                    valid = false;
                    var fixDate = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>The good end date must be after the good start date.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                    fixDate.result.then(function () {
                        valid = false;
                    });
                }
                if (valid) {
                    $scope.depNWISSenfileIsUploading = true; //Loading...
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //post datafile first to get or data_file_id
                    //determine timezone
                    if ($scope.NWISDF.time_zone == "UTC") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        // Cloning date and changing the timezone
                        var correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                        correctedutcStartDateTime = correctedutcStartDateTime.tz('Etc/GMT', true).format();

                        var correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                        correctedutcEndDateTime = correctedutcEndDateTime.tz('Etc/GMT', true).format();

                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    }
                    if ($scope.NWISDF.time_zone == "EST") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    // Cloning date and changing the timezone
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "PST") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    // Cloning date and changing the timezone
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                     correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "CST") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "MST") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                        var correctedutcStartDateTime;
                        var correctedutcEndDateTime;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                            correctedutcStartDateTime.add(1, 'hours');
                            correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                            correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                            correctedutcEndDateTime.add(1, 'hours');
                            correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                             correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                            correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                            correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();
                        }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "PDT") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "EDT") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "CDT") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "MDT") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    }


                    /* if ($scope.NWISDF.time_zone != "UTC") {
                        //convert it
                        var utcStartDateTime = new Date($scope.NWISDF.good_start).toUTCString();
                        var utcEndDateTime = new Date($scope.NWISDF.good_end).toUTCString();
                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } */ else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        var si = $scope.NWISDF.good_start.toString().indexOf('GMT') + 3;
                        var ei = $scope.NWISDF.good_end.toString().indexOf('GMT') + 3;
                        $scope.NWISDF.good_start = $scope.NWISDF.good_start.toString().substring(0, si);
                        $scope.NWISDF.good_end = $scope.NWISDF.good_end.toString().substring(0, ei);
                    }
                    var datafileID = 0;
                    DATA_FILE.save($scope.NWISDF).$promise.then(function (NdfResponse) {
                        datafileID = NdfResponse.data_file_id;
                        //now create an approval with the event's coordinator and add the approval_id, put it, then post the file TODO ::: NEW ENDPOINT FOR THIS
                        //then POST file
                        $scope.NWISDF.data_file_id = NdfResponse.data_file_id;
                        postApprovalForNWISfile(NdfResponse.data_file_id); //process approval
                        //now POST File
                        $scope.NWISFile.data_file_id = NdfResponse.data_file_id;
                        $scope.NWISFile.path = '<link>';
                        delete $scope.NWISFile.FileType;
                        FILE.save($scope.NWISFile).$promise.then(function (Fresponse) {
                            toastr.success("File created");
                            Fresponse.fileBelongsTo = "DataFile File";
                            $scope.sensorNWISFiles.push(Fresponse);
                            $scope.allSFiles.push(Fresponse);
                            Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard                 
                            $scope.showNWISFileForm = false; $scope.depNWISSenfileIsUploading = false; //Loading...
                        }, function (errorResponse) {
                            // file did not get created, delete datafile
                            DATA_FILE.delete({ id: datafileID });
                            $scope.NWISFile = {}; $scope.NWISDF = {}; $scope.showNWISFileForm = false;
                            $scope.depNWISSenfileIsUploading = false; //Loading...
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error creating file: " + errorResponse.statusText);
                        });
                    }, function (errorResponse) {
                        $scope.depNWISSenfileIsUploading = false; //Loading...
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file's data file: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error creating file's data file: " + errorResponse.statusText);
                    });//end source.save()
                }//end valid
            };// end create NWIS file
            //update this NWIS file
            $scope.saveNWISFile = function (valid) {
                //make sure end date is after start date
                var s = $scope.NWISDF.good_start;//need to get dep status date in same format as retrieved to compare
                var e = $scope.NWISDF.good_end; //stupid comma in there making it not the same
                if (new Date(e) < new Date(s)) {
                    valid = false;
                    var fixDate = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>The good end date must be after the good start date.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                    fixDate.result.then(function () {
                        valid = false;
                    });
                }
                if (valid) {
                    //put source or datafile, put file
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //check timezone and make sure date stays utc
                    if ($scope.NWISDF.time_zone == "UTC") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        // Cloning date and changing the timezone
                        var correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                        correctedutcStartDateTime = correctedutcStartDateTime.tz('Etc/GMT', true).format();

                        var correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                        correctedutcEndDateTime = correctedutcEndDateTime.tz('Etc/GMT', true).format();

                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    }
                    if ($scope.NWISDF.time_zone == "EST") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    // Cloning date and changing the timezone
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "PST") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    // Cloning date and changing the timezone
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                     correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "CST") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "MST") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                        var correctedutcStartDateTime;
                        var correctedutcEndDateTime;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                            correctedutcStartDateTime.add(1, 'hours');
                            correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                            correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                            correctedutcEndDateTime.add(1, 'hours');
                            correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                             correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                            correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                            correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();
                        }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "PDT") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "EDT") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "CDT") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        // Cloning date and changing the timezone
                        var correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                        correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                        var correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                        correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();

                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "MDT") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings =  enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    }


                    /* if ($scope.NWISDF.time_zone != "UTC") {
                        //convert it
                        var utcStartDateTime = new Date($scope.NWISDF.good_start).toUTCString();
                        var utcEndDateTime = new Date($scope.NWISDF.good_end).toUTCString();
                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } */ else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        var si = $scope.NWISDF.good_start.toString().indexOf('GMT') + 3;
                        var ei = $scope.NWISDF.good_end.toString().indexOf('GMT') + 3;
                        $scope.NWISDF.good_start = $scope.NWISDF.good_start.toString().substring(0, si);
                        $scope.NWISDF.good_end = $scope.NWISDF.good_end.toString().substring(0, ei);
                    }
                    DATA_FILE.update({ id: $scope.NWISDF.data_file_id }, $scope.NWISDF).$promise.then(function () {
                        FILE.update({ id: $scope.NWISFile.file_id }, $scope.NWISFile).$promise.then(function (fileResponse) {
                            toastr.success("File Data Updated");
                            fileResponse.fileBelongsTo = "DataFile File";
                            $scope.sensorNWISFiles[$scope.existFileIndex] = fileResponse;
                            $scope.allSFiles[$scope.allSFileIndex] = fileResponse;
                            Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                            $scope.showNWISFileForm = false;
                        }, function (errorResponse) {
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving file: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error saving file: " + errorResponse.statusText);
                        });
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving file's data file: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error saving file's data file: " + errorResponse.statusText);
                    });
                }//end valid
            };//end save()
            //delete this file
            $scope.deleteNWISFile = function () {
                var DeleteModalInstance = $uibModal.open({
                    backdrop: 'static',
                    keyboard: false,
                    templateUrl: 'removemodal.html',
                    controller: 'ConfirmModalCtrl',
                    size: 'sm',
                    resolve: {
                        nameToRemove: function () {
                            return $scope.NWISFile;
                        },
                        what: function () {
                            return "File";
                        }
                    }
                });

                DeleteModalInstance.result.then(function (fileToRemove) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    FILE.delete({ id: fileToRemove.file_id }).$promise.then(function () {
                        toastr.success("File Removed");
                        $scope.sensorNWISFiles.splice($scope.existFileIndex, 1);
                        $scope.allSFiles.splice($scope.allSFileIndex, 1);
                        Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                        $scope.showNWISFileForm = false;
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error deleting file: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error deleting file: " + errorResponse.statusText);
                    });
                });//end DeleteModal.result.then
            };//end delete()
            

            $scope.previewDepTime = function () {
            
                // getting the time initally set for peak date
                if ($scope.depStuffCopy[1].time_stamp != undefined) {
                    $scope.timePreviewDep = $scope.depStuffCopy[1].time_stamp;
                } else {
                    $scope.timePreviewDep = $scope.depStuffCopy[1].time_stamp;
                }

                //check and see if they are not using UTC
                if ($scope.depStuffCopy[1].time_zone == "UTC") {
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewDep;
                    enteredDate = moment(enteredDate);

                    // Cloning date and changing the timezone
                    var correctedDate = enteredDate.clone();
                    correctedDate = correctedDate.tz('Etc/GMT', true).format();

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewDep = utcDate;
                }
                if ($scope.depStuffCopy[1].time_zone == "EST") { // +5
                    // + 5
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate =  $scope.timePreviewDep;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewDep = utcDate;

                } if ($scope.depStuffCopy[1].time_zone == "PST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate =  $scope.timePreviewDep;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewDep = utcDate;

                } if ($scope.depStuffCopy[1].time_zone == "CST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewDep;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewDep = utcDate;

                } if ($scope.depStuffCopy[1].time_zone == "MST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewDep;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewDep = utcDate;

                } if ($scope.depStuffCopy[1].time_zone == "PDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewDep;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewDep = utcDate;

                } if ($scope.depStuffCopy[1].time_zone == "EDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewDep;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewDep = utcDate;

                } if ($scope.depStuffCopy[1].time_zone == "CDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewDep;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewDep = utcDate;

                } if ($scope.depStuffCopy[1].time_zone == "MDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewDep;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewDep = utcDate;
                }
                else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.timePreviewDep.toString().indexOf('GMT') + 3;
                    $scope.timePreviewDep = $scope.timePreviewDep.toString().substring(0, i);
                }

            }

            $scope.cancelNWISFile = function () {
                $scope.NWISFile = {};
                $scope.NWISDF = {};
                $scope.showNWISFileForm = false;
            };
            

           var getinitialdepTime = function () {
            
                // getting the time initally set for peak date
                if ($scope.depStuffCopy[1].time_stamp != undefined) {
                    $scope.timePreviewDep = $scope.depStuffCopy[1].time_stamp;
                } else {
                    $scope.timePreviewDep = $scope.depStuffCopy[1].time_stamp;
                }

                //check and see if they are not using UTC
                if ($scope.depStuffCopy[1].time_zone == "UTC") {
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewDep;
                    enteredDate = moment(enteredDate);

                    // Cloning date and changing the timezone
                    var correctedDate = enteredDate.clone();
                    correctedDate = correctedDate.tz('Etc/GMT', true).format();

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewDep = utcDate;
                }
                if ($scope.depStuffCopy[1].time_zone == "EST") { // +5
                    // + 5
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate =  $scope.timePreviewDep;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewDep = utcDate;

                } if ($scope.depStuffCopy[1].time_zone == "PST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate =  $scope.timePreviewDep;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewDep = utcDate;

                } if ($scope.depStuffCopy[1].time_zone == "CST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewDep;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewDep = utcDate;

                } if ($scope.depStuffCopy[1].time_zone == "MST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewDep;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewDep = utcDate;

                } if ($scope.depStuffCopy[1].time_zone == "PDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewDep;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewDep = utcDate;

                } if ($scope.depStuffCopy[1].time_zone == "EDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewDep;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewDep = utcDate;

                } if ($scope.depStuffCopy[1].time_zone == "CDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewDep;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewDep = utcDate;

                } if ($scope.depStuffCopy[1].time_zone == "MDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewDep;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewDep = utcDate;
                }
                else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.timePreviewDep.toString().indexOf('GMT') + 3;
                    $scope.timePreviewDep = $scope.timePreviewDep.toString().substring(0, i);
                }

            }

            //#endregion

            //#region tape down section           
            $scope.OPchosen = function (opChosen) {
                var opI = $scope.OPsForTapeDown.map(function (o) { return o.objective_point_id; }).indexOf(opChosen.objective_point_id);
                if (opChosen.selected) {
                    //they picked an OP to use for tapedown
                    $scope.OPMeasure = {};
                    $scope.OPMeasure.op_name = opChosen.name;
                    $scope.OPMeasure.elevation = opChosen.elev_ft;
                    $scope.OPMeasure.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == opChosen.vdatum_id; })[0].datum_abbreviation;
                    $scope.OPMeasure.objective_point_id = opChosen.objective_point_id;
                    //are we looking at create deployment or edit deployment;
                    if ($scope.aSensor.instrument_id !== undefined && $scope.aSensStatus.status_type_id !== 4) {
                        $scope.depTapeCopy.push($scope.OPMeasure);
                        $scope.depStuffCopy[1].vdatum_id = opChosen.vdatum_id;
                    } else {
                        $scope.tapeDownTable.push($scope.OPMeasure);
                        $scope.aSensStatus.vdatum_id = opChosen.vdatum_id;
                    }
                } else {
                    //they unchecked the op to remove
                    //ask them are they sure?
                    var removeOPMeas = $uibModal.open({
                        backdrop: 'static',
                        keyboard: false,
                        template: '<div class="modal-header"><h3 class="modal-title">Remove OP Measure</h3></div>' +
                            '<div class="modal-body"><p>Are you sure you want to remove this OP Measurement from this sensor?</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button><button class="btn btn-primary" ng-click="cancel()">Cancel</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close('remove');
                            };
                            $scope.cancel = function () {
                                $uibModalInstance.close('cancel');
                            };
                        }],
                        size: 'sm'
                    });
                    removeOPMeas.result.then(function (yesOrNo) {
                        if (yesOrNo == 'remove') {
                            //add to remove it list
                            var createOrEdit = $scope.aSensor.instrument_id !== undefined && $scope.aSensStatus.status_type_id !== 4 ? "edit" : "create"; // edit deployment or creating a deployment
                            var tapeDownToRemove = createOrEdit == 'edit' ? $scope.depTapeCopy.filter(function (a) { return a.objective_point_id == opChosen.objective_point_id; })[0] :
                                $scope.tapeDownTable.filter(function (a) { return a.objective_point_id == opChosen.objective_point_id; })[0];

                            var tInd = createOrEdit == 'edit' ? $scope.depTapeCopy.map(function (o) { return o.objective_point_id; }).indexOf(tapeDownToRemove.objective_point_id) :
                                $scope.tapeDownTable.map(function (o) { return o.objective_point_id; }).indexOf(tapeDownToRemove.objective_point_id);

                            if (tapeDownToRemove.op_measurements_id !== undefined) $scope.removeOPList.push(tapeDownToRemove.op_measurements_id);
                            createOrEdit == 'edit' ? $scope.depTapeCopy.splice(tInd, 1) : $scope.tapeDownTable.splice(tInd, 1);

                            //if this empties the table, clear the sensStatus fields related to tapedowns
                            if (createOrEdit == 'edit') {
                                if ($scope.depTapeCopy.length === 0) {
                                    $scope.depStuffCopy[1].vdatum_id = 0; $scope.depStuffCopy[1].gs_elevation = ''; $scope.depStuffCopy[1].ws_elevation = ''; $scope.depStuffCopy[1].sensor_elevation = '';
                                }
                            } else {
                                if ($scope.tapeDownTable.length === 0) {
                                    $scope.aSensStatus.vdatum_id = 0; $scope.aSensStatus.gs_elevation = ''; $scope.aSensStatus.ws_elevation = ''; $scope.aSensStatus.sensor_elevation = '';
                                }
                            }
                        } else {
                            //never mind, make it selected again
                            $scope.OPsForTapeDown[opI].selected = true;
                        }
                    });
                }
            };
            //#endregion tape down section 

            //get timezone and timestamp for their timezone for showing.. post/put will convert it to utc
            var getTimeZoneStamp = function (dsent) {
                var sendThis = [];
                var d;

                if (dsent !== undefined) d = new Date(dsent);
                else d = new Date();

                /* var offset = (d.toString()).substring(35);
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
                } */
                sendThis = [d];
                return sendThis;
            };

            //button click to show event dropdown to change it on existing hwm (admin only)
            $scope.showChangeEventDD = function () {
                $scope.showEventDD = !$scope.showEventDD;
            };

            //change event = apply it to the $scope.EventName
            $scope.ChangeEvent = function () {
                $scope.EventName = $scope.eventList.filter(function (el) { return el.event_id == $scope.adminChanged.event_id; })[0].event_name;
            };

            //get deployment types for sensor type chosen
            $scope.getDepTypes = function () {
                $scope.filteredDeploymentTypes = [];
                var matchingSensDeplist = $scope.sensorTypeList.filter(function (sd) { return sd.sensor_type_id == $scope.aSensor.sensor_type_id; })[0];
                //this is 1 sensorType with inner list of  .deploymenttypes
                $scope.filteredDeploymentTypes = matchingSensDeplist.deploymenttypes;

                if ($scope.filteredDeploymentTypes.length == 1)
                    $scope.aSensor.deployment_type_id = $scope.filteredDeploymentTypes[0].deployment_type_id;

            };

            // $scope.sessionEvent = $cookies.get('SessionEventName');
            $scope.LoggedInMember = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];

            $scope.aSensor = {};
            $scope.aSensStatus = {};

            $scope.thisSensorSite = SensorSite;

            //cancel
            $scope.cancel = function () {
                $rootScope.stateIsLoading.showLoading = false; // loading.. 
                var sensorObjectToSendBack = thisSensor;
                $timeout(function () {
                    // anything you want can go here and will safely be run on the next digest.                   
                    var sendBack = [sensorObjectToSendBack];
                    $uibModalInstance.close(sendBack);
                });
            };

            // is interval is number
            $scope.isNum = function (evt) {
                var theEvent = evt || window.event;
                var key = theEvent.keyCode || theEvent.which;
                if (key != 46 && key != 45 && key > 31 && (key < 48 || key > 57)) {
                    theEvent.returnValue = false;
                    if (theEvent.preventDefault) theEvent.preventDefault();
                }
            };

            //is it UTC or local time..make sure it stays UTC
            var dealWithTimeStampb4Send = function (w) {
                //check and see if they are not using UTC
                if (w == 'saving') {
                    if ($scope.depStuffCopy[1].time_zone == "UTC") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.depStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);

                        // Cloning date and changing the timezone
                        var correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('Etc/GMT', true).format();

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.depStuffCopy[1].time_stamp = utcDate;
                        $scope.depStuffCopy[1].time_zone = 'UTC';
                    }

                    if ($scope.depStuffCopy[1].time_zone == "EST") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.depStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);

                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.add(1, 'hours');
                            correctedDate = correctedDate.tz('America/New_York', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/New_York', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.depStuffCopy[1].time_stamp = utcDate;
                        $scope.depStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.depStuffCopy[1].time_zone == "PST") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.depStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.add(1, 'hours');
                            correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.depStuffCopy[1].time_stamp = utcDate;
                        $scope.depStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.depStuffCopy[1].time_zone == "CST") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.depStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.add(1, 'hours');
                            correctedDate = correctedDate.tz('America/Chicago', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/Chicago', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.depStuffCopy[1].time_stamp = utcDate;
                        $scope.depStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.depStuffCopy[1].time_zone == "MST") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.depStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.add(1, 'hours');
                            correctedDate = correctedDate.tz('America/Denver', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/Denver', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.depStuffCopy[1].time_stamp = utcDate;
                        $scope.depStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.depStuffCopy[1].time_zone == "PDT") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.depStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.add(1, 'hours');
                            correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.depStuffCopy[1].time_stamp = utcDate;
                        $scope.depStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.depStuffCopy[1].time_zone == "EDT") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.depStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/New_York', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.subtract(1, 'hours');
                            correctedDate = correctedDate.tz('America/New_York', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.depStuffCopy[1].time_stamp = utcDate;
                        $scope.depStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.depStuffCopy[1].time_zone == "CDT") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.depStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/Chicago', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.subtract(1, 'hours');
                            correctedDate = correctedDate.tz('America/Chicago', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.depStuffCopy[1].time_stamp = utcDate;
                        $scope.depStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.depStuffCopy[1].time_zone == "MDT") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.depStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/Denver', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.subtract(1, 'hours');
                            correctedDate = correctedDate.tz('America/Denver', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.depStuffCopy[1].time_stamp = utcDate;
                        $scope.depStuffCopy[1].time_zone = 'UTC';
                    }
                    /* if ($scope.depStuffCopy[1].time_zone != "UTC") {
                        //convert it
                        var utcDateTimeS = new Date($scope.depStuffCopy[1].time_stamp).toUTCString();
                        $scope.depStuffCopy[1].time_stamp = utcDateTimeS;
                        $scope.depStuffCopy[1].time_zone = 'UTC';
                    } */ else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        var i = $scope.depStuffCopy[1].time_stamp.toString().indexOf('GMT') + 3;
                        $scope.depStuffCopy[1].time_stamp = $scope.depStuffCopy[1].time_stamp.toString().substring(0, i);
                    }
                } else {
                    //check and see if they are not using UTC
                    if ($scope.aSensStatus.time_zone == "UTC") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.aSensStatus.time_stamp;
                        enteredDate = moment(enteredDate);

                        // Cloning date and changing the timezone
                        var correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('Etc/GMT', true).format();

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.aSensStatus.time_stamp = utcDate;
                        $scope.aSensStatus.time_zone = 'UTC';
                    }

                    if ($scope.aSensStatus.time_zone == "EST") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.aSensStatus.time_stamp;
                        enteredDate = moment(enteredDate);

                        // Cloning date and changing the timezone
                        var correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.aSensStatus.time_stamp = utcDate;
                        $scope.aSensStatus.time_zone = 'UTC';

                    } if ($scope.aSensStatus.time_zone == "PST") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.aSensStatus.time_stamp;
                        enteredDate = moment(enteredDate);

                        // Cloning date and changing the timezone
                        var correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.aSensStatus.time_stamp = utcDate;
                        $scope.aSensStatus.time_zone = 'UTC';

                    } if ($scope.aSensStatus.time_zone == "CST") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.aSensStatus.time_stamp;
                        enteredDate = moment(enteredDate);

                        // Cloning date and changing the timezone
                        var correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.aSensStatus.time_stamp = utcDate;
                        $scope.aSensStatus.time_zone = 'UTC';

                    } if ($scope.aSensStatus.time_zone == "MST") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.aSensStatus.time_stamp;
                        enteredDate = moment(enteredDate);

                        // Cloning date and changing the timezone
                        var correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.aSensStatus.time_stamp = utcDate;
                        $scope.aSensStatus.time_zone = 'UTC';

                    } if ($scope.aSensStatus.time_zone == "PDT") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.aSensStatus.time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.subtract(1, 'hours');
                            correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.aSensStatus.time_stamp = utcDate;
                        $scope.aSensStatus.time_zone = 'UTC';

                    } if ($scope.aSensStatus.time_zone == "EDT") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.aSensStatus.time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/New_York', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.subtract(1, 'hours');
                            correctedDate = correctedDate.tz('America/New_York', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.aSensStatus.time_stamp = utcDate;
                        $scope.aSensStatus.time_zone = 'UTC';

                    } if ($scope.aSensStatus.time_zone == "CDT") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.aSensStatus.time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/Chicago', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.subtract(1, 'hours');
                            correctedDate = correctedDate.tz('America/Chicago', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.aSensStatus.time_stamp = utcDate;
                        $scope.aSensStatus.time_zone = 'UTC';

                    } if ($scope.aSensStatus.time_zone == "MDT") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.aSensStatus.time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/Denver', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.subtract(1, 'hours');
                            correctedDate = correctedDate.tz('America/Denver', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.aSensStatus.time_stamp = utcDate;
                        $scope.aSensStatus.time_zone = 'UTC';
                    }
                    ///
                    /* if ($scope.aSensStatus.time_zone != "UTC") {
                        //convert it
                        var utcDateTimeD = new Date($scope.aSensStatus.time_stamp).toUTCString();
                        $scope.aSensStatus.time_stamp = utcDateTimeD;
                        $scope.aSensStatus.time_zone = 'UTC';
                    } */ else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        var Di = $scope.aSensStatus.time_stamp.toString().indexOf('GMT') + 3;
                        $scope.aSensStatus.time_stamp = $scope.aSensStatus.time_stamp.toString().substring(0, Di);
                    }
                    ///
                }
            }


            $scope.previewSensTime = function () {
            
                // getting the time initally set for peak date
                if ($scope.aSensStatus.time_stamp != undefined) {
                    $scope.timePreviewSens = $scope.aSensStatus.time_stamp;
                } else {
                    $scope.timePreviewSens = $scope.aSensStatus.time_stamp;
                }

                //check and see if they are not using UTC
                if ($scope.aSensStatus.time_zone == "UTC") {
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewSens;
                    enteredDate = moment(enteredDate);

                    // Cloning date and changing the timezone
                    var correctedDate = enteredDate.clone();
                    correctedDate = correctedDate.tz('Etc/GMT', true).format();

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewSens = utcDate;
                }
                if ($scope.aSensStatus.time_zone == "EST") { // +5
                    // + 5
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate =  $scope.timePreviewSens;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewSens = utcDate;

                } if ($scope.aSensStatus.time_zone == "PST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate =  $scope.timePreviewSens;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewSens = utcDate;

                } if ($scope.aSensStatus.time_zone == "CST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewSens;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewSens = utcDate;

                } if ($scope.aSensStatus.time_zone == "MST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewSens;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewSens = utcDate;

                } if ($scope.aSensStatus.time_zone == "PDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewSens;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewSens = utcDate;

                } if ($scope.aSensStatus.time_zone == "EDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewSens;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewSens = utcDate;

                } if ($scope.aSensStatus.time_zone == "CDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewSens;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewSens = utcDate;

                } if ($scope.aSensStatus.time_zone == "MDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewSens;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewSens = utcDate;
                }
                else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.timePreviewSens.toString().indexOf('GMT') + 3;
                    $scope.timePreviewSens = $scope.timePreviewSens.toString().substring(0, i);
                }

            }
           
            var getinitialSensTime = function () { 
                
                // getting the time initally set for peak date
                if ($scope.aSensStatus.time_stamp != undefined) {
                    $scope.timePreviewSens = $scope.aSensStatus.time_stamp;
                } else {
                    $scope.timePreviewSens = $scope.aSensStatus.time_stamp;
                }

                //check and see if they are not using UTC
                if ($scope.aSensStatus.time_zone == "UTC") {
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewSens;
                    enteredDate = moment(enteredDate);

                    // Cloning date and changing the timezone
                    var correctedDate = enteredDate.clone();
                    correctedDate = correctedDate.tz('Etc/GMT', true).format();

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewSens = utcDate;
                }
                if ($scope.aSensStatus.time_zone == "EST") { // +5
                    // + 5
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate =  $scope.timePreviewSens;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewSens = utcDate;

                } if ($scope.aSensStatus.time_zone == "PST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate =  $scope.timePreviewSens;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewSens = utcDate;

                } if ($scope.aSensStatus.time_zone == "CST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewSens;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewSens = utcDate;

                } if ($scope.aSensStatus.time_zone == "MST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewSens;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewSens = utcDate;

                } if ($scope.aSensStatus.time_zone == "PDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewSens;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewSens = utcDate;

                } if ($scope.aSensStatus.time_zone == "EDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewSens;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewSens = utcDate;

                } if ($scope.aSensStatus.time_zone == "CDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewSens;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewSens = utcDate;

                } if ($scope.aSensStatus.time_zone == "MDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreviewSens;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreviewSens = utcDate;
                }
                else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.timePreviewSens.toString().indexOf('GMT') + 3;
                    $scope.timePreviewSens = $scope.timePreviewSens.toString().substring(0, i);
                }

            };
            
            // remove all the related stuff from this sensor
            var extractJustInstrumentForPUT = function (fullSensor) {
                var basicInstrument = angular.copy(fullSensor);
                var returnInstrument = {};
                returnInstrument.instrument_id = basicInstrument.instrument_id;
                if (basicInstrument.sensor_type_id) returnInstrument.sensor_type_id = basicInstrument.sensor_type_id;//sensor_type_id
                if (basicInstrument.deployment_type_id) returnInstrument.deployment_type_id = basicInstrument.deployment_type_id;//deployment_type_id
                if (basicInstrument.location_description) returnInstrument.location_description = basicInstrument.location_description;//location_description
                if (basicInstrument.serial_number) returnInstrument.serial_number = basicInstrument.serial_number;//serial_number
                if (basicInstrument.housing_serial_number) returnInstrument.housing_serial_number = basicInstrument.housing_serial_number;//housing_serial_number
                if (basicInstrument.interval) returnInstrument.interval = basicInstrument.interval;//interval
                if (basicInstrument.site_id) returnInstrument.site_id = basicInstrument.site_id; //site_id
                if (basicInstrument.event_id) returnInstrument.event_id = basicInstrument.event_id; //event_id
                if (basicInstrument.inst_collection_id) returnInstrument.inst_collection_id = basicInstrument.inst_collection_id;//inst_collection_id
                if (basicInstrument.housing_type_id) returnInstrument.housing_type_id = basicInstrument.housing_type_id;//housing_type_id
                if (basicInstrument.sensor_brand_id) returnInstrument.sensor_brand_id = basicInstrument.sensor_brand_id; //sensor_brand_id
                if (basicInstrument.vented) returnInstrument.vented = basicInstrument.vented;//vented
                if (basicInstrument.last_updated) returnInstrument.last_updated = basicInstrument.last_updated; //last_updated
                if (basicInstrument.last_updated_by) returnInstrument.last_updated_by = basicInstrument.last_updated_by;//last_updated_by
                return returnInstrument;
            }
            //save aSensor
            $scope.save = function (valid) {
                if (valid) {
                    var updatedSensor = {};
                    var updatedSenStat = {};
                    //admin changed the event for this sensor..
                    if ($scope.adminChanged.event_id !== undefined)
                        $scope.depStuffCopy[0].event_id = $scope.adminChanged.event_id;

                    //see if they used Minutes or seconds for interval. need to store in seconds
                    if ($scope.IntervalType.type == "Minutes")
                        $scope.depStuffCopy[0].interval = $scope.depStuffCopy[0].interval * 60;

                    dealWithTimeStampb4Send('saving'); //UTC or local?
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    var basicInstrument = extractJustInstrumentForPUT($scope.depStuffCopy[0]);
                    INSTRUMENT.update({ id: $scope.depStuffCopy[0].instrument_id }, basicInstrument).$promise.then(function (response) {
                        updatedSensor = response;
                        updatedSensor.deploymentType = $scope.depStuffCopy[0].deployment_type_id > 0 ? $scope.depTypeList.filter(function (d) { return d.deployment_type_id == $scope.depStuffCopy[0].deployment_type_id; })[0].method : '';
                        updatedSensor.housingType = $scope.depStuffCopy[0].housing_type_id > 0 ? $scope.houseTypeList.filter(function (h) { return h.housing_type_id == $scope.depStuffCopy[0].housing_type_id; })[0].type_name : '';
                        updatedSensor.sensorBrand = $scope.sensorBrandList.filter(function (s) { return s.sensor_brand_id == $scope.depStuffCopy[0].sensor_brand_id; })[0].brand_name;
                        updatedSensor.sensorType = $scope.sensorTypeList.filter(function (t) { return t.sensor_type_id == $scope.depStuffCopy[0].sensor_type_id; })[0].sensor;
                        INSTRUMENT_STATUS.update({ id: $scope.depStuffCopy[1].instrument_status_id }, $scope.depStuffCopy[1]).$promise.then(function (statResponse) {

                            //deal with tapedowns. remove/add
                            for (var rt = 0; rt < $scope.removeOPList.length; rt++) {
                                var idToRemove = $scope.removeOPList[rt];
                                OP_MEASURE.delete({ id: idToRemove }).$promise;
                            }
                            $scope.tapeDownTable = $scope.depTapeCopy.length > 0 ? [] : $scope.tapeDownTable;
                            for (var at = 0; at < $scope.depTapeCopy.length; at++) {
                                var DEPthisTape = $scope.depTapeCopy[at];
                                if (DEPthisTape.op_measurements_id !== undefined) {
                                    //existing, put in case they changed it
                                    OP_MEASURE.update({ id: DEPthisTape.op_measurements_id }, DEPthisTape).$promise.then(function (tapeResponse) {
                                        tapeResponse.op_name = DEPthisTape.op_name;
                                        tapeResponse.Vdatum = DEPthisTape.Vdatum;
                                        $scope.tapeDownTable.push(tapeResponse);
                                    });
                                } else {
                                    //new one added, post
                                    DEPthisTape.instrument_status_id = statResponse.instrument_status_id;
                                    OP_MEASURE.save(DEPthisTape).$promise.then(function (tapeResponse) {
                                        tapeResponse.op_name = DEPthisTape.op_name;
                                        tapeResponse.Vdatum = DEPthisTape.Vdatum;
                                        $scope.tapeDownTable.push(tapeResponse);
                                    });
                                }
                            }
                            //now add instrument and instrument status to send back
                            updatedSenStat = statResponse;
                            updatedSenStat.status = 'Deployed';
                            var instrument_statusesHolder = $scope.aSensor.instrument_status; //put them here so they can be updated and readded (all versions)
                            $scope.aSensor = updatedSensor;
                            thisSensor = updatedSensor; thisSensor.instrument_status = instrument_statusesHolder;
                            $scope.aSensStatus = updatedSenStat;
                            $scope.aSensStatus.time_stamp = getDateTimeParts($scope.aSensStatus.time_stamp);//this keeps it as utc in display
                            var ind = thisSensor.instrument_status.map(function (i) { return i.status_type_id; }).indexOf(1);
                            thisSensor.instrument_status[ind] = $scope.aSensStatus;
                            $scope.depStuffCopy = []; $scope.IntervalType = { type: 'Seconds' };
                            $scope.view.DEPval = 'detail';
                            toastr.success("Sensor Updated");
                        }, function (errorResponse) {
                            toastr.error("error saving sensor status: " + errorResponse.statusText);
                        });
                    }, function (errorResponse) {
                        toastr.error("error saving sensor: " + errorResponse.statusText);
                    });
                }
            };//end save()

            //create (POST) a deployed sensor click
            $scope.deploy = function () {
                if (this.SensorForm.$valid) {
                    if ($scope.aSensor.location_description !== "Proposed sensor at this site. Change description when deploying sensor.") {
                        //see if they used Minutes or seconds for interval. need to store in seconds
                        if ($scope.IntervalType.type == "Minutes")
                            $scope.aSensor.interval = $scope.aSensor.interval * 60;
                        //set event_id
                        $scope.aSensor.event_id = $cookies.get('SessionEventID');
                        $scope.aSensor.site_id = SensorSite.site_id;
                        dealWithTimeStampb4Send('deploy'); //UTC or local?
                        $scope.aSensStatus.status_type_id = 1; //deployed status
                        $scope.aSensStatus.member_id = $cookies.get('mID'); //user that logged in is deployer
                        var createdSensor = {}; var depSenStat = {};
                        $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                        $http.defaults.headers.common.Accept = 'application/json';

                        //DEPLOY PROPOSED or CREATE NEW deployment?
                        if ($scope.aSensor.instrument_id !== undefined) {
                            //put instrument, post status for deploying PROPOSED sensor
                            INSTRUMENT.update({ id: $scope.aSensor.instrument_id }, $scope.aSensor).$promise.then(function (response) {
                                //create instrumentstatus too need: status_type_id and instrument_id
                                createdSensor = response;
                                createdSensor.deploymentType = $scope.aSensor.deploymentType;
                                createdSensor.housingType = response.housing_type_id > 0 ? $scope.houseTypeList.filter(function (h) { return h.housing_type_id == response.housing_type_id; })[0].type_name : '';
                                createdSensor.sensorBrand = $scope.sensorBrandList.filter(function (s) { return s.sensor_brand_id == response.sensor_brand_id; })[0].brand_name;
                                createdSensor.sensorType = $scope.sensorTypeList.filter(function (t) { return t.sensor_type_id == response.sensor_type_id; })[0].sensor;
                                $scope.aSensStatus.instrument_id = response.instrument_id;
                                INSTRUMENT_STATUS.save($scope.aSensStatus).$promise.then(function (statResponse) {
                                    //any tape downs?
                                    if ($scope.tapeDownTable.length > 0) {
                                        for (var t = 0; t < $scope.tapeDownTable.length; t++) {
                                            var thisTape = $scope.tapeDownTable[t];
                                            thisTape.instrument_status_id = statResponse.instrument_status_id;
                                            ///POST IT///
                                            OP_MEASURE.save(thisTape).$promise;
                                        }
                                    }
                                    //build the createdSensor to send back and add to the list page
                                    depSenStat = statResponse;
                                    //add Status
                                    depSenStat.status = 'Deployed';
                                    createdSensor.instrument_status = [depSenStat, $scope.previousStateStatus];
                                    $timeout(function () {
                                        // anything you want can go here and will safely be run on the next digest.
                                        toastr.success("Sensor deployed");
                                        var state = $scope.whichButton == 'deployP' ? 'proposedDeployed' : 'newDeployed';
                                        var sendBack = [createdSensor, state];
                                        $uibModalInstance.close(sendBack);
                                    });
                                });
                            });
                        } else {
                            //post instrument and status for deploying NEW sensor
                            INSTRUMENT.save($scope.aSensor).$promise.then(function (response) {
                                //create instrumentstatus too need: status_type_id and instrument_id
                                createdSensor = response;
                                createdSensor.deploymentType = response.deployment_type_id !== null && response.deployment_type_id !== undefined ? $scope.depTypeList.filter(function (d) { return d.deployment_type_id == response.deployment_type_id; })[0].method : "";
                                createdSensor.housingType = response.housing_type_id !== null && response.housing_type_id !== undefined ? $scope.houseTypeList.filter(function (h) { return h.housing_type_id == response.housing_type_id; })[0].type_name : '';
                                createdSensor.sensorBrand = $scope.sensorBrandList.filter(function (s) { return s.sensor_brand_id == response.sensor_brand_id; })[0].brand_name;
                                createdSensor.sensorType = $scope.sensorTypeList.filter(function (t) { return t.sensor_type_id == response.sensor_type_id; })[0].sensor;
                                $scope.aSensStatus.instrument_id = response.instrument_id;

                                INSTRUMENT_STATUS.save($scope.aSensStatus).$promise.then(function (statResponse) {
                                    //any tape downs?
                                    if ($scope.tapeDownTable.length > 0) {
                                        for (var t = 0; t < $scope.tapeDownTable.length; t++) {
                                            var thisTape = $scope.tapeDownTable[t];
                                            thisTape.instrument_status_id = statResponse.instrument_status_id;
                                            ///POST IT///
                                            OP_MEASURE.save(thisTape).$promise;
                                        }
                                    }
                                    //build the createdSensor to send back and add to the list page
                                    depSenStat = statResponse;
                                    depSenStat.status = 'Deployed';
                                    createdSensor.instrument_status = [depSenStat];
                                    toastr.success("Sensor deployed");
                                    var state = $scope.whichButton == 'deployP' ? 'proposedDeployed' : 'newDeployed';
                                    var sendBack = [createdSensor, state];
                                    $uibModalInstance.close(sendBack);
                                });
                            });
                        }
                    } else {
                        //show modal to tell them to update the location_description before deploying sensor
                        var updateDescrModal = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>You must update the Location Description when deploying a proposed sensor.</p></div>' +
                                '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                $scope.ok = function () {
                                    $uibModalInstance.close();
                                };
                            }],
                            size: 'sm'
                        });
                    } // end else location_description
                } //end $valid
            };//end deploy()

            var getinitialtimepreviewNWIS = function () { 
                    // getting the time initally set for peak date
                    if ($scope.NWISDF.good_start != undefined) {
                        $scope.timePreviewStart = $scope.NWISDF.good_start;
                        $scope.timePreviewEnd = $scope.NWISDF.good_end;
                    } else {
                        $scope.timePreviewStart = $scope.NWISDF.good_start;
                        $scope.timePreviewEnd = $scope.NWISDF.good_end;
                    }
    
                    //check and see if they are not using UTC
                    if ($scope.NWISDF.time_zone == "UTC") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDateStart = $scope.timePreviewStart;
                        var enteredDateEnd = $scope.timePreviewEnd;
                        enteredDateStart = moment(enteredDateStart);
                        enteredDateEnd = moment(enteredDateEnd);
    
                        // Cloning date and changing the timezone
                        var correctedDateStart = enteredDateStart.clone();
                        var correctedDateEnd = enteredDateEnd.clone();
                        correctedDateStart = correctedDateStart.tz('Etc/GMT', true).format();
                        correctedDateEnd = correctedDateEnd.tz('Etc/GMT', true).format();
    
                        // formatting in UTC
                        var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                        var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();
    
                        $scope.timePreviewStart = utcDateStart;
                        $scope.timePreviewEnd = utcDateEnd;
                    }
                    if ($scope.NWISDF.time_zone == "EST") { // +5
                        // + 5
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDateStart = $scope.timePreviewStart;
                        var enteredDateEnd = $scope.timePreviewEnd;
                        enteredDateStart = moment(enteredDateStart);
                        enteredDateEnd = moment(enteredDateEnd);
                        var isaylightSavings = enteredDateStart._d.toString();
                        var correctedDateStart;
                        var correctedDateEnd;
    
                        if (isaylightSavings.indexOf('Daylight') >= 0) {
    
                            // Cloning date and changing the timezone
                            correctedDateStart = enteredDateStart.clone();
                            correctedDateStart.add(1, 'hours');
                            correctedDateStart = correctedDateStart.tz('America/New_York', true).format();
    
                            correctedDateEnd = enteredDateEnd.clone();
                            correctedDateEnd.add(1, 'hours');
                            correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
    
                        }
    
                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDateStart = enteredDateStart.clone();
                            correctedDateStart = correctedDateStart.tz('America/New_York', true).format();
    
                            correctedDateEnd = enteredDateEnd.clone();
                            correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
                        }
    
                        // formatting in UTC
                        var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                        var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();
    
                        $scope.timePreviewStart = utcDateStart;
                        $scope.timePreviewEnd = utcDateEnd;
    
                    } if ($scope.NWISDF.time_zone == "PST") {
    
                        var enteredDateStart = $scope.timePreviewStart;
                        var enteredDateEnd = $scope.timePreviewEnd;
                        enteredDateStart = moment(enteredDateStart);
                        enteredDateEnd = moment(enteredDateEnd);
    
                        var isaylightSavings = enteredDateStart._d.toString();
                        var correctedDateStart;
                        var correctedDateEnd;
    
                        if (isaylightSavings.indexOf('Daylight') >= 0) {
    
                            // Cloning date and changing the timezone
                            correctedDateStart = enteredDateStart.clone();
                            correctedDateStart.add(1, 'hours');
                            correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();
    
                            correctedDateEnd = enteredDateEnd.clone();
                            correctedDateEnd.add(1, 'hours');
                            correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
    
                        }
    
                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDateStart = enteredDateStart.clone();
                            correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();
    
                            correctedDateEnd = enteredDateEnd.clone();
                            correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
                        }
                        // formatting in UTC
                        var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                        var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();
    
                        $scope.timePreviewStart = utcDateStart;
                        $scope.timePreviewEnd = utcDateEnd;
    
                    } if ($scope.NWISDF.time_zone == "CST") {
    
                        var enteredDateStart = $scope.timePreviewStart;
                        var enteredDateEnd = $scope.timePreviewEnd;
                        enteredDateStart = moment(enteredDateStart);
                        enteredDateEnd = moment(enteredDateEnd);
                        
                        var isaylightSavings = enteredDateStart._d.toString();
                        var correctedDateStart;
                        var correctedDateEnd;
    
                        if (isaylightSavings.indexOf('Daylight') >= 0) {
    
                            // Cloning date and changing the timezone
                            correctedDateStart = enteredDateStart.clone();
                            correctedDatestart.add(1, 'hours');
                            correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();
    
                            correctedDateEnd = enteredDateEnd.clone();
                            correctedDateEnd.add(1, 'hours');
                            correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
    
                        }
    
                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDateStart = enteredDateStart.clone();
                            correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();
    
                            correctedDateEnd = enteredDateEnd.clone();
                            correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
                        }
    
                        // formatting in UTC
                        var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                        var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();
    
                        $scope.timePreviewStart = utcDateStart;
                        $scope.timePreviewEnd = utcDateEnd;
    
                    } if ($scope.NWISDF.time_zone == "MST") {
    
                        var enteredDateStart = $scope.timePreviewStart;
                        var enteredDateEnd = $scope.timePreviewEnd;
                        enteredDateStart = moment(enteredDateStart);
                        enteredDateEnd = moment(enteredDateEnd);
                        
                        var isaylightSavings = enteredDateStart._d.toString();
                        var correctedDateStart;
                        var correctedDateEnd;
    
                        if (isaylightSavings.indexOf('Daylight') >= 0) {
    
                            // Cloning date and changing the timezone
                            correctedDateStart = enteredDateStart.clone();
                            correctedDatestart.add(1, 'hours');
                            correctedDateStart = correctedDateStart.tz('America/Denver', true).format();
    
                            correctedDateEnd = enteredDateEnd.clone();
                            correctedDateEnd.add(1, 'hours');
                            correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
    
                        }
    
                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDateStart = enteredDateStart.clone();
                            correctedDateStart = correctedDateStart.tz('America/Denver', true).format();
    
                            correctedDateEnd = enteredDateEnd.clone();
                            correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
                        }
    
                        // formatting in UTC
                        var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                        var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();
    
                        $scope.timePreviewStart = utcDateStart;
                        $scope.timePreviewEnd = utcDateEnd;
                    } if ($scope.NWISDF.time_zone == "PDT") {
    
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDateStart = $scope.timePreviewStart;
                        var enteredDateEnd = $scope.timePreviewEnd;
                        enteredDateStart = moment(enteredDateStart);
                        enteredDateEnd = moment(enteredDateEnd);
                        
                        var isaylightSavings = enteredDateStart._d.toString();
                        var correctedDateStart;
                        var correctedDateEnd;
    
                        if (isaylightSavings.indexOf('Daylight') >= 0) {
    
                            // Cloning date and changing the timezone
                            correctedDateStart = enteredDateStart.clone();
                            correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();
    
                            correctedDateEnd = enteredDateEnd.clone();
                            correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
    
                        }
    
                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDateStart = enteredDateStart.clone();
                            correctedDateStart.subtract(1, 'hours');
                            correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();
    
                            correctedDateEnd = enteredDateEnd.clone();
                            correctedDateEnd.subtract(1, 'hours');
                            correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
                        }
    
                        // formatting in UTC
                        var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                        var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();
    
                        $scope.timePreviewStart = utcDateStart;
                        $scope.timePreviewEnd = utcDateEnd;
                    } if ($scope.NWISDF.time_zone == "EDT") {
    
                        var enteredDateStart = $scope.timePreviewStart;
                        var enteredDateEnd = $scope.timePreviewEnd;
                        enteredDateStart = moment(enteredDateStart);
                        enteredDateEnd = moment(enteredDateEnd);
                        
                        var isaylightSavings = enteredDateStart._d.toString();
                        var correctedDateStart;
                        var correctedDateEnd;
    
                        if (isaylightSavings.indexOf('Daylight') >= 0) {
    
                            // Cloning date and changing the timezone
                            correctedDateStart = enteredDateStart.clone();
                            correctedDateStart = correctedDateStart.tz('America/New_York', true).format();
    
                            correctedDateEnd = enteredDateEnd.clone();
                            correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
    
                        }
    
                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDateStart = enteredDateStart.clone();
                            correctedDateStart.subtract(1, 'hours');
                            correctedDateStart = correctedDateStart.tz('America/New_York', true).format();
    
                            correctedDateEnd = enteredDateEnd.clone();
                            correctedDateEnd.subtract(1, 'hours');
                            correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
                        }
    
                        // formatting in UTC
                        var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                        var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();
    
                        $scope.timePreviewStart = utcDateStart;
                        $scope.timePreviewEnd = utcDateEnd;
                    } if ($scope.NWISDF.time_zone == "CDT") {
    
                        var enteredDateStart = $scope.timePreviewStart;
                        var enteredDateEnd = $scope.timePreviewEnd;
                        enteredDateStart = moment(enteredDateStart);
                        enteredDateEnd = moment(enteredDateEnd);
                        
                        var isaylightSavings = enteredDateStart._d.toString();
                        var correctedDateStart;
                        var correctedDateEnd;
    
                        if (isaylightSavings.indexOf('Daylight') >= 0) {
    
                            // Cloning date and changing the timezone
                            correctedDateStart = enteredDateStart.clone();
                            correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();
    
                            correctedDateEnd = enteredDateEnd.clone();
                            correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
    
                        }
    
                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDateStart = enteredDateStart.clone();
                            correctedDateStart.subtract(1, 'hours');
                            correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();
    
                            correctedDateEnd = enteredDateEnd.clone();
                            correctedDateEnd.subtract(1, 'hours');
                            correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
                        }
    
                        // formatting in UTC
                        var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                        var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();
    
                        $scope.timePreviewStart = utcDateStart;
                        $scope.timePreviewEnd = utcDateEnd;
    
                    } if ($scope.NWISDF.time_zone == "MDT") {
    
                        var enteredDateStart = $scope.timePreviewStart;
                        var enteredDateEnd = $scope.timePreviewEnd;
                        enteredDateStart = moment(enteredDateStart);
                        enteredDateEnd = moment(enteredDateEnd);
                        
                        var isaylightSavings = enteredDateStart._d.toString();
                        var correctedDateStart;
                        var correctedDateEnd;
    
                        if (isaylightSavings.indexOf('Daylight') >= 0) {
    
                            // Cloning date and changing the timezone
                            correctedDateStart = enteredDateStart.clone();
                            correctedDateStart = correctedDateStart.tz('America/Denver', true).format();
    
                            correctedDateEnd = enteredDateEnd.clone();
                            correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
    
                        }
    
                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDateStart = enteredDateStart.clone();
                            correctedDateStart.subtract(1, 'hours');
                            correctedDateStart = correctedDateStart.tz('America/Denver', true).format();
    
                            correctedDateEnd = enteredDateEnd.clone();
                            correctedDateEnd.subtract(1, 'hours');
                            correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
                        }
    
                        // formatting in UTC
                        var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                        var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();
    
                        $scope.timePreviewStart = utcDateStart;
                        $scope.timePreviewEnd = utcDateEnd;
                    }
                    else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        var i = $scope.timePreviewStart.toString().indexOf('GMT') + 3;
                        var d = $scope.timePreviewEnd.toString().indexOf('GMT') + 3;
                        $scope.timePreviewStart = $scope.timePreviewStart.toString().substring(0, i);
                        $scope.timePreviewEnd = $scope.timePreviewEnd.toString().substring(0, d);
                    }
    
                };

            $scope.previewDataTimeNWISFile = function () {

                // getting the time initally set for peak date
                if ($scope.NWISDF.good_start != undefined) {
                    $scope.timePreviewStart = $scope.NWISDF.good_start;
                    $scope.timePreviewEnd = $scope.NWISDF.good_end;
                } else {
                    $scope.timePreviewStart = $scope.NWISDF.good_start;
                    $scope.timePreviewEnd = $scope.NWISDF.good_end;
                }

                //check and see if they are not using UTC
                if ($scope.NWISDF.time_zone == "UTC") {
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);

                    // Cloning date and changing the timezone
                    var correctedDateStart = enteredDateStart.clone();
                    var correctedDateEnd = enteredDateEnd.clone();
                    correctedDateStart = correctedDateStart.tz('Etc/GMT', true).format();
                    correctedDateEnd = correctedDateEnd.tz('Etc/GMT', true).format();

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                }
                if ($scope.NWISDF.time_zone == "EST") { // +5
                    // + 5
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.NWISDF.time_zone == "PST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);

                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
                    }
                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.NWISDF.time_zone == "CST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDatestart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.NWISDF.time_zone == "MST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDatestart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.NWISDF.time_zone == "PDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.NWISDF.time_zone == "EDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.NWISDF.time_zone == "CDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.NWISDF.time_zone == "MDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                }
                else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.timePreviewStart.toString().indexOf('GMT') + 3;
                    var d = $scope.timePreviewEnd.toString().indexOf('GMT') + 3;
                    $scope.timePreviewStart = $scope.timePreviewStart.toString().substring(0, i);
                    $scope.timePreviewEnd = $scope.timePreviewEnd.toString().substring(0, d);
                }

            };

            //delete aSensor and sensor statuses
            $scope.deleteS = function () {
                //TODO:: Delete the files for this sensor too or reassign to the Site?? Services or client handling?
                var DeleteModalInstance = $uibModal.open({
                    templateUrl: 'removemodal.html',
                    controller: 'ConfirmModalCtrl',
                    size: 'sm',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        nameToRemove: function () {
                            return $scope.aSensor;
                        },
                        what: function () {
                            return "Sensor";
                        }
                    }
                });

                DeleteModalInstance.result.then(function (sensorToRemove) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    //this will delete the instrument and all it's statuses
                    INSTRUMENT.delete({ id: sensorToRemove.instrument_id }).$promise.then(function () {
                        $scope.DepSensorFiles = []; //clear out sensorFiles for this sensor
                        $scope.depSensImageFiles = []; //clear out image files for this sensor
                        //now remove all these files from SiteFiles
                        var l = $scope.allSFiles.length;
                        while (l--) {
                            if ($scope.allSFiles[l].instrument_id == sensorToRemove.instrument_id) $scope.allSFiles.splice(l, 1);
                        }
                        //updates the file list on the sitedashboard
                        Site_Files.setAllSiteFiles($scope.allSFiles);
                        toastr.success("Sensor Removed");
                        var sendBack = ["de", 'deleted'];
                        $uibModalInstance.close(sendBack);
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    });
                }, function () {
                    //logic for cancel
                });//end modal
            };

            if (thisSensor != "empty") {
                //actions: 'depProp', 'editDep', 'retrieve', 'editRet'
                //#region existing deployed Sensor .. break apart the 'thisSensor' into 'aSensor' and 'aSensStatus'
                $scope.aSensor = angular.copy(thisSensor);
                $scope.aSensStatus = angular.copy(thisSensor.instrument_status[0]);
                $scope.sensorDataNWIS = (($scope.aSensor.sensor_type_id == 2 || $scope.aSensor.sensor_type_id == 5) || $scope.aSensor.sensor_type_id == 6) ? true : false;
                $scope.getDepTypes();//populate $scope.filteredDeploymentTypes for dropdown options
                $scope.IntervalType.type = 'Seconds'; //default
                if ($scope.sensorDataNWIS) {
                    //FILE.VALIDATED being used to store 1 if this is an nwis file metadata link
                    $scope.sensorNWISFiles = [];
                    for (var ai = $scope.DepSensorFiles.length - 1; ai >= 0; ai--) {
                        if ($scope.DepSensorFiles[ai].is_nwis == 1) {
                            $scope.sensorNWISFiles.push($scope.DepSensorFiles[ai]);
                            $scope.DepSensorFiles.splice(ai, 1);
                        }
                    }
                    var dt = getTimeZoneStamp();
                    $scope.NWISFile = {};
                    $scope.NWISDF = {};
                }
                //are we deploying a proposed sensor or editing a deployed sensor??
                if (thisSensor.instrument_status[0].status == "Proposed") {
                    //deploying proposed
                    $scope.previousStateStatus = angular.copy(thisSensor.instrument_status[0]); //hold the proposed state (proposed to deployed)
                    $scope.whichButton = 'deployP';
                    $scope.aSensor.interval = $scope.aSensor.interval === 0 ? null : $scope.aSensor.interval; //clear out the '0' value here               
                    //displaying date / time it user's timezone
                    var timeParts = getTimeZoneStamp();
                    $scope.aSensStatus.time_stamp = timeParts[0];
                    $scope.aSensStatus.time_zone = timeParts[1]; //will be converted to utc on post/put
                    $scope.aSensStatus.member_id = $cookies.get('mID'); // member logged in is deploying it
                    $scope.EventName = $cookies.get('SessionEventName');
                    $scope.Deployer = $scope.LoggedInMember;
                } else {
                    //editing deployed
                    $scope.whichButton = 'edit';
                    $scope.aSensor.interval = $scope.aSensor.interval === 0 ? null : $scope.aSensor.interval; //clear out the '0' value here   
                    //get this deployed sensor's event name
                    $scope.EventName = $scope.eventList.filter(function (e) { return e.event_id == $scope.aSensor.event_id; })[0].event_name;
                    //date formatting. this keeps it in utc for display
                    $scope.aSensStatus.time_stamp = getDateTimeParts($scope.aSensStatus.time_stamp);
                    //get collection member's name 
                    $scope.Deployer = $scope.aSensStatus.member_id !== null || $scope.aSensStatus.member_id !== undefined ? allMembers.filter(function (m) { return m.member_id == $scope.aSensStatus.member_id; })[0] : {};
                    OP_MEASURE.getInstStatOPMeasures({ instrumentStatusId: $scope.aSensStatus.instrument_status_id }).$promise.then(function (response) {
                        for (var r = 0; r < response.length; r++) {
                            var sensMeasures = response[r];
                            var whichOP = siteOPs.filter(function (op) { return op.objective_point_id == response[r].objective_point_id; })[0];
                            sensMeasures.elevation = whichOP.elev_ft;
                            sensMeasures.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == whichOP.vdatum_id; })[0].datum_abbreviation;
                            sensMeasures.op_name = whichOP.name;
                            $scope.tapeDownTable.push(sensMeasures);
                        }
                        //go through OPsForTapeDown and add selected Property.
                        for (var i = 0; i < $scope.OPsForTapeDown.length; i++) {
                            //for each one, if response has this id, add 'selected:true' else add 'selected:false'
                            for (var y = 0; y < response.length; y++) {
                                if (response[y].objective_point_id == $scope.OPsForTapeDown[i].objective_point_id) {
                                    $scope.OPsForTapeDown[i].selected = true;
                                    y = response.length; //ensures it doesn't set it as false after setting it as true
                                }
                                else {
                                    $scope.OPsForTapeDown[i].selected = false;
                                }
                            }
                            if (response.length === 0)
                                $scope.OPsForTapeDown[i].selected = false;
                        }
                        //end if thisSiteHousings != undefined
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting sensor status measurement: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error getting sensor status measurement: " + errorResponse.statusText);
                    });
                }
                $rootScope.stateIsLoading.showLoading = false;// loading..
                //#endregion existing Sensor
            } else {
                //#region Deploying new Sensor
                $scope.whichButton = 'deploy';
                $scope.IntervalType.type = 'Seconds'; //default
                //displaying date / time it user's timezone
                var DeptimeParts = getTimeZoneStamp();
                $scope.aSensStatus.time_stamp = DeptimeParts[0];
                $scope.aSensStatus.time_zone = "UTC";// DeptimeParts[1]; //will be converted to utc on post/put
                $scope.aSensStatus.member_id = $cookies.get('mID'); // member logged in is deploying it
                getinitialSensTime()
                $scope.EventName = $cookies.get('SessionEventName');
                $scope.Deployer = $scope.LoggedInMember;
                $rootScope.stateIsLoading.showLoading = false;// loading..
                //#endregion new Sensor
            }

            $scope.myData = [$scope.aSensStatus.sensor_elevation, $scope.aSensStatus.ws_elevation, $scope.aSensStatus.gs_elevation];
            //edit button clicked. make copy of deployed info 
            $scope.wannaEditDep = function () {
                $scope.view.DEPval = 'edit';
                $scope.depStuffCopy = [angular.copy($scope.aSensor), angular.copy($scope.aSensStatus)];
                $scope.depTapeCopy = angular.copy($scope.tapeDownTable);
                getinitialdepTime();
            };
            $scope.cancelDepEdit = function () {
                $scope.view.DEPval = 'detail';
                $scope.depStuffCopy = [];
                $scope.depTapeCopy = [];
                //MAKE SURE ALL SELECTED OP'S STAY SELECTED
                for (var i = 0; i < $scope.OPsForTapeDown.length; i++) {
                    //for each one, if response has this id, add 'selected:true' else add 'selected:false'
                    for (var y = 0; y < $scope.tapeDownTable.length; y++) {
                        if ($scope.tapeDownTable[y].objective_point_id == $scope.OPsForTapeDown[i].objective_point_id) {
                            $scope.OPsForTapeDown[i].selected = true;
                            y = $scope.tapeDownTable.length; //ensures it doesn't set it as false after setting it as true
                        }
                        else {
                            $scope.OPsForTapeDown[i].selected = false;
                        }
                    }
                    if ($scope.tapeDownTable.length === 0)
                        $scope.OPsForTapeDown[i].selected = false;
                }
            };

        }]); //end SENSOR

    // Retrieve a Sensor modal
    ModalControllers.controller('sensorRetrievalModalCtrl', ['$scope', '$rootScope', '$timeout', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'thisSensor', 'SensorSite', 'siteOPs', 'allEventList', 'allVDatumList', 'allMembers', 'allStatusTypes', 'allInstCollCond', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'OP_MEASURE',
        function ($scope, $rootScope, $timeout, $cookies, $http, $uibModalInstance, $uibModal, thisSensor, SensorSite, siteOPs, allEventList, allVDatumList, allMembers, allStatusTypes, allInstCollCond, INSTRUMENT, INSTRUMENT_STATUS, OP_MEASURE) {
            $scope.aSensor = thisSensor;
            $scope.EventName = allEventList.filter(function (r) { return r.event_id == $scope.aSensor.event_id; })[0].event_name;
            $scope.depSensStatus = angular.copy(thisSensor.instrument_status[0]);
            var isDate = Object.prototype.toString.call($scope.depSensStatus.time_stamp) === '[object Date]';
            if (isDate === false) {
                var y = $scope.depSensStatus.time_stamp.substr(0, 4);
                var m = $scope.depSensStatus.time_stamp.substr(5, 2) - 1; //subtract 1 for index value (January is 0)
                var d = $scope.depSensStatus.time_stamp.substr(8, 2);
                var h = $scope.depSensStatus.time_stamp.substr(11, 2);
                var mi = $scope.depSensStatus.time_stamp.substr(14, 2);
                var sec = $scope.depSensStatus.time_stamp.substr(17, 2);
                $scope.depSensStatus.time_stamp = new Date(y, m, d, h, mi, sec);
            }
            if ($scope.depSensStatus.vdatum_id !== undefined && $scope.depSensStatus.vdatum_id > 0)
                $scope.depSensStatus.VDatum = allVDatumList.filter(function (v) { return v.datum_id == $scope.depSensStatus.vdatum_id; })[0].datum_abbreviation;

            $scope.OPsForTapeDown = siteOPs;
            $scope.OPsPresent = siteOPs.length > 0 ? true : false;
            $scope.vertDatumList = allVDatumList;
            /* var vdatumWo29 = [];
                angular.forEach($scope.vertDatumList, function (value, key) {

                    if (value.datum_id == 4) {
                        // don't add it to the array
                    } else {
                        hdatumWoNad27.push(value);
                    }
                }); 
            $scope.vertDatumList = vdatumWo29;*/
            $scope.removeOPList = [];
            $scope.tapeDownTable = []; //holder of tapedown OP_MEASUREMENTS
            $scope.DEPtapeDownTable = []; //holds any deployed tapedowns

            $scope.Deployer = allMembers.filter(function (m) { return m.member_id == $scope.depSensStatus.member_id; })[0];
            $scope.whichButton = 'Retrieve';
            $scope.statusTypeList = allStatusTypes.filter(function (s) { return s.status == "Retrieved" || s.status == "Lost"; });
            $scope.collectCondList = allInstCollCond;
            $scope.timeZoneList = ['UTC', 'PST', 'MST', 'CST', 'EST', 'PDT', 'MDT', 'CDT', 'EDT'];
            $scope.userRole = $cookies.get('usersRole');
            //formatter for date/time and chosen zone based on their location
            var getTimeZoneStamp = function (dsent) {
                var sendThis = [];
                var d;

                if (dsent !== undefined) d = new Date(dsent);
                else d = new Date();

                /* var offset = (d.toString()).substring(35);
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
                } */
                sendThis = [d];
                return sendThis;
            };

            //#region tape down section            
            $scope.OPchosen = function (opChosen) {
                var opI = $scope.OPsForTapeDown.map(function (o) { return o.objective_point_id; }).indexOf(opChosen.objective_point_id);
                if (opChosen.selected) {
                    //they picked an OP to use for tapedown
                    $scope.OPMeasure = {};
                    $scope.OPMeasure.op_name = opChosen.name;
                    $scope.OPMeasure.elevation = opChosen.elev_ft;
                    $scope.OPMeasure.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == opChosen.vdatum_id; })[0].datum_abbreviation;
                    $scope.OPMeasure.objective_point_id = opChosen.objective_point_id;
                    //$scope.OPMeasure.op_name = opName;
                    $scope.tapeDownTable.push($scope.OPMeasure);
                    $scope.aRetrieval.vdatum_id = opChosen.vdatum_id;
                } else {
                    //they unchecked the op to remove
                    //ask them are they sure?
                    var removeOPMeas = $uibModal.open({
                        backdrop: 'static',
                        keyboard: false,
                        template: '<div class="modal-header"><h3 class="modal-title">Remove OP Measure</h3></div>' +
                            '<div class="modal-body"><p>Are you sure you want to remove this OP Measurement from this sensor?</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button><button class="btn btn-primary" ng-click="cancel()">Cancel</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close('remove');
                            };
                            $scope.cancel = function () {
                                $uibModalInstance.close('cancel');
                            };
                        }],
                        size: 'sm'
                    });
                    removeOPMeas.result.then(function (yesOrNo) {
                        if (yesOrNo == 'remove') {
                            //add to remove it list
                            var tapeDownToRemove = $scope.tapeDownTable.filter(function (a) { return a.objective_point_id == opChosen.objective_point_id; })[0];
                            var tInd = $scope.tapeDownTable.map(function (o) { return o.objective_point_id; }).indexOf(tapeDownToRemove.objective_point_id);
                            if (tapeDownToRemove.op_measurements_id !== undefined) $scope.removeOPList.push(tapeDownToRemove.op_measurements_id);
                            $scope.tapeDownTable.splice(tInd, 1);
                            if ($scope.tapeDownTable.length === 0) {
                                $scope.aRetrieval.vdatum_id = 0; $scope.aRetrieval.gs_elevation = ''; $scope.aRetrieval.ws_elevation = ''; $scope.aRetrieval.sensor_elevation = '';
                            }
                        } else {
                            //never mind, make it selected again
                            $scope.OPsForTapeDown[opI].selected = true;
                        }
                    });
                }
            };
            //get deploy status tapedowns to add to top for display
            OP_MEASURE.getInstStatOPMeasures({ instrumentStatusId: $scope.depSensStatus.instrument_status_id }).$promise.then(function (response) {
                for (var r = 0; r < response.length; r++) {
                    var sensMeasures = response[r];
                    var whichOP = siteOPs.filter(function (op) { return op.objective_point_id == response[r].objective_point_id; })[0];
                    sensMeasures.elevation = whichOP.elev_ft;
                    sensMeasures.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == whichOP.vdatum_id; })[0].datum_abbreviation;
                    sensMeasures.op_name = whichOP.name;
                    $scope.DEPtapeDownTable.push(sensMeasures);
                }
            }, function (errorResponse) {
                if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting sensor status measurement: " + errorResponse.headers(["usgswim-messages"]));
                else toastr.error("Error getting sensor status measurement: " + errorResponse.statusText);
            });

            var getinitialRetDateTime = function () {
                // getting the time initally set for peak date
                if ($scope.aRetrieval.time_stamp != undefined) {
                    $scope.timePreview = $scope.aRetrieval.time_stamp;
                } else {
                    $scope.timePreview = $scope.aRetrieval.time_stamp;
                }

                //check and see if they are not using UTC
                if ($scope.aRetrieval.time_zone == "UTC") {
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);

                    // Cloning date and changing the timezone
                    var correctedDate = enteredDate.clone();
                    correctedDate = correctedDate.tz('Etc/GMT', true).format();

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;
                }
                if ($scope.aRetrieval.time_zone == "EST") { // +5
                    // + 5
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate =  $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.aRetrieval.time_zone == "PST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate =  $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.aRetrieval.time_zone == "CST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.aRetrieval.time_zone == "MST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.aRetrieval.time_zone == "PDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.aRetrieval.time_zone == "EDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.aRetrieval.time_zone == "CDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.aRetrieval.time_zone == "MDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;
                }
                else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.timePreview.toString().indexOf('GMT') + 3;
                    $scope.timePreview = $scope.timePreview.toString().substring(0, i);
                }

            }

            //#endregion tape down section 

            //default formatting for retrieval
            var dtparts = getTimeZoneStamp();
            $scope.aRetrieval = { time_stamp: dtparts[0], instrument_id: $scope.aSensor.instrument_id, member_id: $cookies.get('mID') }; //time_zone: dtparts[1]
            $scope.Retriever = allMembers.filter(function (am) { return am.member_id == $cookies.get('mID'); })[0];
            getinitialRetDateTime();
            //is it UTC or local time..make sure it stays UTC
            var dealWithTimeStampb4Send = function () {
                //check and see if they are not using UTC

                if ($scope.aRetrieval.time_zone == "UTC") {
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.aRetrieval.time_stamp;
                    enteredDate = moment(enteredDate);

                    // Cloning date and changing the timezone
                    var correctedDate = enteredDate.clone();
                    correctedDate = correctedDate.tz('Etc/GMT', true).format();

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.aRetrieval.time_stamp = utcDate;
                    $scope.aRetrieval.time_zone = 'UTC';
                }

                if ($scope.aRetrieval.time_zone == "EST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.aRetrieval.time_stamp;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.aRetrieval.time_stamp = utcDate;
                    $scope.aRetrieval.time_zone = 'UTC';

                } if ($scope.aRetrieval.time_zone == "PST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.aRetrieval.time_stamp;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.aRetrieval.time_stamp = utcDate;
                    $scope.aRetrieval.time_zone = 'UTC';

                } if ($scope.aRetrieval.time_zone == "CST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.aRetrieval.time_stamp;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.aRetrieval.time_stamp = utcDate;
                    $scope.aRetrieval.time_zone = 'UTC';

                } if ($scope.aRetrieval.time_zone == "MST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.aRetrieval.time_stamp;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.aRetrieval.time_stamp = utcDate;
                    $scope.aRetrieval.time_zone = 'UTC';

                } if ($scope.aRetrieval.time_zone == "PDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.aRetrieval.time_stamp;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                    }

                    // Cloning date and changing the timezone
                    var correctedDate = enteredDate.clone();
                    correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.aRetrieval.time_stamp = utcDate;
                    $scope.aRetrieval.time_zone = 'UTC';

                } if ($scope.aRetrieval.time_zone == "EDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.aRetrieval.time_stamp;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.aRetrieval.time_stamp = utcDate;
                    $scope.aRetrieval.time_zone = 'UTC';

                } if ($scope.aRetrieval.time_zone == "CDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.aRetrieval.time_stamp;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.aRetrieval.time_stamp = utcDate;
                    $scope.aRetrieval.time_zone = 'UTC';

                } if ($scope.aRetrieval.time_zone == "MDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.aRetrieval.time_stamp;
                    enteredDate = moment(enteredDate);

                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.aRetrieval.time_stamp = utcDate;
                    $scope.aRetrieval.time_zone = 'UTC';
                }

                

                /* if ($scope.aRetrieval.time_zone != "UTC") {
                    //convert it
                    var utcDateTime = new Date($scope.aRetrieval.time_stamp).toUTCString();
                    $scope.aRetrieval.time_stamp = utcDateTime;
                    $scope.aRetrieval.time_zone = 'UTC';
                } */ else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.aRetrieval.time_stamp.toString().indexOf('GMT') + 3;
                    $scope.aRetrieval.time_stamp = $scope.aRetrieval.time_stamp.toString().substring(0, i);
                }
            };

            //cancel
            $scope.cancel = function () {
                $rootScope.stateIsLoading.showLoading = false;// loading..
                $uibModalInstance.dismiss('cancel');
            };
            var depTimeStampb4Send = function () {
                //check and see if they are not using UTC
                var returnThis;
                //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                var i = $scope.depSensStatus.time_stamp.toString().indexOf('GMT') + 3;
                returnThis = $scope.depSensStatus.time_stamp.toString().substring(0, i);
                return returnThis;
            };

            //cancel
            $scope.cancel = function () {
                $rootScope.stateIsLoading.showLoading = false;// loading..
                $uibModalInstance.dismiss('cancel');
            };

            // remove all the related stuff from this sensor
            var extractJustInstrumentForPUT = function (fullSensor) {
                var basicInstrument = angular.copy(fullSensor);
                var returnInstrument = {};
                returnInstrument.instrument_id = basicInstrument.instrument_id;
                if (basicInstrument.sensor_type_id) returnInstrument.sensor_type_id = basicInstrument.sensor_type_id;//sensor_type_id
                if (basicInstrument.deployment_type_id) returnInstrument.deployment_type_id = basicInstrument.deployment_type_id;//deployment_type_id
                if (basicInstrument.location_description) returnInstrument.location_description = basicInstrument.location_description;//location_description
                if (basicInstrument.serial_number) returnInstrument.serial_number = basicInstrument.serial_number;//serial_number
                if (basicInstrument.housing_serial_number) returnInstrument.housing_serial_number = basicInstrument.housing_serial_number;//housing_serial_number
                if (basicInstrument.interval) returnInstrument.interval = basicInstrument.interval;//interval
                if (basicInstrument.site_id) returnInstrument.site_id = basicInstrument.site_id; //site_id
                if (basicInstrument.event_id) returnInstrument.event_id = basicInstrument.event_id; //event_id
                if (basicInstrument.inst_collection_id) returnInstrument.inst_collection_id = basicInstrument.inst_collection_id;//inst_collection_id
                if (basicInstrument.housing_type_id) returnInstrument.housing_type_id = basicInstrument.housing_type_id;//housing_type_id
                if (basicInstrument.sensor_brand_id) returnInstrument.sensor_brand_id = basicInstrument.sensor_brand_id; //sensor_brand_id
                if (basicInstrument.vented) returnInstrument.vented = basicInstrument.vented;//vented
                if (basicInstrument.last_updated) returnInstrument.last_updated = basicInstrument.last_updated; //last_updated
                if (basicInstrument.last_updated_by) returnInstrument.last_updated_by = basicInstrument.last_updated_by;//last_updated_by
                return returnInstrument;
            }

            $scope.previewRetDateTime = function () {
                // getting the time initally set for peak date
                if ($scope.aRetrieval.time_stamp != undefined) {
                    $scope.timePreview = $scope.aRetrieval.time_stamp;
                } else {
                    $scope.timePreview = $scope.aRetrieval.time_stamp;
                }

                //check and see if they are not using UTC
                if ($scope.aRetrieval.time_zone == "UTC") {
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);

                    // Cloning date and changing the timezone
                    var correctedDate = enteredDate.clone();
                    correctedDate = correctedDate.tz('Etc/GMT', true).format();

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;
                }
                if ($scope.aRetrieval.time_zone == "EST") { // +5
                    // + 5
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate =  $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.aRetrieval.time_zone == "PST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate =  $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.aRetrieval.time_zone == "CST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.aRetrieval.time_zone == "MST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.aRetrieval.time_zone == "PDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.aRetrieval.time_zone == "EDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.aRetrieval.time_zone == "CDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.aRetrieval.time_zone == "MDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;
                }
                else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.timePreview.toString().indexOf('GMT') + 3;
                    $scope.timePreview = $scope.timePreview.toString().substring(0, i);
                }

            }

            //retrieve the sensor
            $scope.retrieveS = function (valid) {
                if (valid) {
                    dealWithTimeStampb4Send(); //for retrieval for post and for comparison to deployed (ensure it's after)
                    var depSenTS = depTimeStampb4Send();//need to get dep status date in same format as retrieved to compare
                    var retSenTS = angular.copy($scope.aRetrieval.time_stamp.replace(/\,/g, "")); //stupid comma in there making it not the same
                    if (new Date(retSenTS) < new Date(depSenTS)) {
                        var fixDate = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>The retrieval date must be after the deployed date.</p></div>' +
                                '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                $scope.ok = function () {
                                    $uibModalInstance.close();
                                };
                            }],
                            size: 'sm'
                        });
                        fixDate.result.then(function () {
                            //reset to now
                            $scope.aRetrieval.time_stamp = '';
                            $scope.aRetrieval.time_stamp = getTimeZoneStamp()[0];
                            $scope.aRetrieval.time_zone = getTimeZoneStamp()[1];
                            angular.element('#retrievalDate').trigger('focus');
                            
                        });
                    } else {
                        $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                        $http.defaults.headers.common.Accept = 'application/json';
                        var updatedSensor = {}; var createRetSens = {};
                        var justTheInstrument = extractJustInstrumentForPUT($scope.aSensor);

                        INSTRUMENT.update({ id: $scope.aSensor.instrument_id }, justTheInstrument).$promise.then(function (response) {
                            //create instrumentstatus too need: status_type_id and instrument_id
                            updatedSensor = response;
                            updatedSensor.deploymentType = $scope.aSensor.deploymentType;
                            updatedSensor.housingType = $scope.aSensor.housingType;
                            updatedSensor.sensorBrand = $scope.aSensor.sensorBrand;
                            updatedSensor.sensorType = $scope.aSensor.sensorType;
                            updatedSensor.instCollection = $scope.collectCondList.filter(function (i) { return i.id === $scope.aSensor.inst_collection_id; })[0].condition;

                            INSTRUMENT_STATUS.save($scope.aRetrieval).$promise.then(function (statResponse) {
                                //any tape downs?
                                if ($scope.tapeDownTable.length > 0) {
                                    for (var t = 0; t < $scope.tapeDownTable.length; t++) {
                                        var thisTape = $scope.tapeDownTable[t];
                                        thisTape.instrument_status_id = statResponse.instrument_status_id;
                                        ///POST IT///
                                        OP_MEASURE.save(thisTape).$promise;
                                    }
                                }
                                //build the createdSensor to send back and add to the list page
                                createRetSens = statResponse;
                                createRetSens.status = statResponse.status_type_id == 2 ? 'Retrieved' : 'Lost';
                                updatedSensor.instrument_status = [createRetSens, thisSensor.instrument_status[0]];

                                $timeout(function () {
                                    // anything you want can go here and will safely be run on the next digest.
                                    toastr.success("Sensor retrieved");
                                    var state = 'retrieved';
                                    var sendBack = [updatedSensor, state];
                                    $uibModalInstance.close(sendBack);
                                });
                            }, function (errorResponse) {
                                if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error retrieving sensor: " + errorResponse.headers(["usgswim-messages"]));
                                else toastr.error("Error retrieving sensor: " + errorResponse.statusText);
                            });
                        }, function (errorResponse) {
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving sensor: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error saving sensor: " + errorResponse.statusText);
                        });
                    } //end retr date is correct
                }//end if valid
            };//end retrieveS
            

            $rootScope.stateIsLoading.showLoading = false;
        }]);//end sensorRetrievalModalCtrl

    // view/edit retrieved sensor (deployed included here) modal
    ModalControllers.controller('fullSensorModalCtrl', ['$scope', '$rootScope', '$filter', '$timeout', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'SERVER_URL', 'FILE_STAMP', 'allDepDropdowns',
        'agencyList', 'Site_Files', 'allStatusTypes', 'allInstCollCond', 'allEvents', 'allDepTypes', 'thisSensor', 'SensorSite', 'siteOPs', 'allMembers', 'allEventDataFiles',
        'INSTRUMENT', 'INSTRUMENT_STATUS', 'DATA_FILE', 'FILE', 'SOURCE', 'OP_MEASURE', 'Site_Script',
        function ($scope, $rootScope, $filter, $timeout, $cookies, $http, $uibModalInstance, $uibModal, SERVER_URL, FILE_STAMP, allDepDropdowns, agencyList, Site_Files, allStatusTypes, allInstCollCond, allEvents,
            allDepTypes, thisSensor, SensorSite, siteOPs, allMembers, allEventDataFiles, INSTRUMENT, INSTRUMENT_STATUS, DATA_FILE, FILE, SOURCE, OP_MEASURE, Site_Script) {
            /*allSensorTypes, allSensorBrands, allHousingTypes, allSensDeps*/
            $scope.serverURL = SERVER_URL;
            $scope.fullSenfileIsUploading = false; //Loading...   
            $scope.showProcessing = false; // processing script...
            $scope.stormSection = false; // section holding all baro pressure sensors for this event.
            $scope.sensorTypeList = allDepDropdowns[0];
            $scope.sensorBrandList = allDepDropdowns[1];
            $scope.houseTypeList = allDepDropdowns[2];
            $scope.fileTypeList = allDepDropdowns[3]; //used if creating/editing depSens file
            $scope.vertDatumList = allDepDropdowns[4];
            $scope.allSFiles = Site_Files.getAllSiteFiles();
            $scope.sensorFiles = thisSensor !== "empty" ? $scope.allSFiles.filter(function (sf) { return sf.instrument_id == thisSensor.instrument_id; }) : [];// holder for hwm files added
            $scope.sensImageFiles = $scope.sensorFiles.filter(function (hf) { return hf.filetype_id === 1; }); //image files for carousel            
            $scope.showFileForm = false; //hidden form to add file to sensor
            $scope.showNWISFileForm = false; //hidden form to add nwis file to sensor
            $scope.sensorDataNWIS = false; //is this a rain gage, met station, or rdg sensor -- if so, data file must be created pointing to nwis (we don't store actual file, just metadata with link)
            $scope.collectCondList = allInstCollCond;
            $scope.OPsPresent = siteOPs.length > 0 ? true : false;
            $scope.DEPOPsForTapeDown = angular.copy(siteOPs);
            $scope.RETOPsForTapeDown = angular.copy(siteOPs);
            $scope.depTypeList = allDepTypes; //get fresh version so not messed up with the Temperature twice
            $scope.filteredDeploymentTypes = []; //will be populated based on the sensor type chosen
            $scope.timeZoneList = ['UTC', 'PST', 'MST', 'CST', 'EST', 'PDT', 'MDT', 'CDT', 'EDT'];
            $scope.statusTypeList = allStatusTypes.filter(function (s) { return s.status == 'Retrieved' || s.status == 'Lost'; });
            $scope.eventDataFiles = [];

            $scope.daylightSavingsStorm = { selected: false };
            $scope.daylightSavingsAir = { selected: false };
            $scope.is4Hz = { selected: false };
            $scope.dl = { showdlSection: false };
            //default setting for interval
            $scope.IntervalType = { type: 'Seconds' };
            //ng-show determines whether they are editing or viewing details
            $scope.view = { DEPval: 'detail', RETval: 'detail' };
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

            //formatting date and time properly for chrome and ff
            var getDateTimeParts = function (d) {
                var theDate;
                var isDate = Object.prototype.toString.call(d) === '[object Date]';
                if (isDate === false) {
                    var y = d.substr(0, 4);
                    var m = d.substr(5, 2) - 1; //subtract 1 for index value (January is 0)
                    var da = d.substr(8, 2);
                    var h = d.substr(11, 2);
                    var mi = d.substr(14, 2);
                    var sec = d.substr(17, 2);
                    theDate = new Date(y, m, da, h, mi, sec);
                } else {
                    //this is already a date, return it back
                    theDate = d;
                }
                return theDate;
            };

            $scope.thisSensorSite = SensorSite; $scope.userRole = $cookies.get('usersRole');

            $scope.sensor = angular.copy(thisSensor);
            $scope.sensorDataNWIS = (($scope.sensor.sensor_type_id == 2 || $scope.sensor.sensor_type_id == 5) || $scope.sensor.sensor_type_id == 6) ? true : false;

            //deploy part //////////////////
            $scope.DeployedSensorStat = angular.copy(thisSensor.instrument_status.filter(function (inst) { return inst.status === "Deployed"; })[0]);
            $scope.DeployedSensorStat.time_stamp = getDateTimeParts($scope.DeployedSensorStat.time_stamp); //this keeps it as utc in display
            $scope.Deployer = allMembers.filter(function (m) { return m.member_id === $scope.DeployedSensorStat.member_id; })[0];
            $scope.DEPremoveOPList = [];
            $scope.DEPtapeDownTable = []; //holder of tapedown OP_MEASUREMENTS

            $scope.DEPOPchosen = function (DEPopChosen) {
                var opI = $scope.DEPOPsForTapeDown.map(function (o) { return o.objective_point_id; }).indexOf(DEPopChosen.objective_point_id);
                if (DEPopChosen.selected) {
                    //they picked an OP to use for tapedown
                    $scope.DEPOPMeasure = {};
                    $scope.DEPOPMeasure.op_name = DEPopChosen.name;
                    $scope.DEPOPMeasure.elevation = DEPopChosen.elev_ft;
                    $scope.DEPOPMeasure.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == DEPopChosen.vdatum_id; })[0].datum_abbreviation;
                    $scope.DEPOPMeasure.objective_point_id = DEPopChosen.objective_point_id;
                    //$scope.DEPtapeDownTable.push($scope.DEPOPMeasure);
                    $scope.depTapeCopy.push($scope.DEPOPMeasure);
                    $scope.depStuffCopy[1].vdatum_id = DEPopChosen.vdatum_id;
                } else {
                    //they unchecked the op to remove
                    //ask them are they sure?
                    var DEPremoveOPMeas = $uibModal.open({
                        backdrop: 'static',
                        keyboard: false,
                        template: '<div class="modal-header"><h3 class="modal-title">Remove OP Measure</h3></div>' +
                            '<div class="modal-body"><p>Are you sure you want to remove this OP Measurement from this deployed sensor?</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-click="DEPok()">OK</button><button class="btn btn-primary" ng-click="DEPcancel()">Cancel</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.DEPok = function () {
                                $uibModalInstance.close('remove');
                            };
                            $scope.DEPcancel = function () {
                                $uibModalInstance.close('cancel');
                            };
                        }],
                        size: 'sm'
                    });
                    DEPremoveOPMeas.result.then(function (yesOrNo) {
                        if (yesOrNo == 'remove') {
                            //add to remove it list
                            var DEPtapeDownToRemove = $scope.depTapeCopy.filter(function (a) { return a.objective_point_id == DEPopChosen.objective_point_id; })[0];
                            var DEPtInd = $scope.depTapeCopy.map(function (o) { return o.objective_point_id; }).indexOf(DEPtapeDownToRemove.objective_point_id);
                            if (DEPtapeDownToRemove.op_measurements_id !== undefined) $scope.DEPremoveOPList.push(DEPtapeDownToRemove.op_measurements_id);
                            $scope.depTapeCopy.splice(DEPtInd, 1);
                            if ($scope.depTapeCopy.length === 0) {
                                $scope.depStuffCopy[1].vdatum_id = 0; $scope.depStuffCopy[1].gs_elevation = ''; $scope.depStuffCopy[1].ws_elevation = ''; $scope.depStuffCopy[1].sensor_elevation = '';
                            }
                        } else {
                            //never mind, make it selected again
                            $scope.DEPOPsForTapeDown[opI].selected = true;
                        }
                    });
                }
            };
            //only check for instrument opMeasures if there are any ops on this site to begin with.
            if ($scope.OPsPresent) {
                OP_MEASURE.getInstStatOPMeasures({ instrumentStatusId: $scope.DeployedSensorStat.instrument_status_id }).$promise.then(function (DEPresponse) {
                    for (var r = 0; r < DEPresponse.length; r++) {
                        var DEPsensMeasures = DEPresponse[r];
                        var whichOP = siteOPs.filter(function (op) { return op.objective_point_id == DEPresponse[r].objective_point_id; })[0];
                        DEPsensMeasures.elevation = whichOP.elev_ft;
                        DEPsensMeasures.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == whichOP.vdatum_id; })[0].datum_abbreviation;
                        DEPsensMeasures.op_name = $scope.DEPOPsForTapeDown.filter(function (op) { return op.objective_point_id == DEPresponse[r].objective_point_id; })[0].name;
                        $scope.DEPtapeDownTable.push(DEPsensMeasures);
                    }
                    //go through OPsForTapeDown and add selected Property.
                    for (var i = 0; i < $scope.DEPOPsForTapeDown.length; i++) {
                        //for each one, if response has this id, add 'selected:true' else add 'selected:false'
                        for (var y = 0; y < DEPresponse.length; y++) {
                            if (DEPresponse[y].objective_point_id == $scope.DEPOPsForTapeDown[i].objective_point_id) {
                                $scope.DEPOPsForTapeDown[i].selected = true;
                                y = DEPresponse.length; //ensures it doesn't set it as false after setting it as true
                            }
                            else {
                                $scope.DEPOPsForTapeDown[i].selected = false;
                            }
                        }
                        if (DEPresponse.length === 0)
                            $scope.DEPOPsForTapeDown[i].selected = false;
                    }
                    //end if thisSiteHousings != undefined
                }, function (errorResponse) {
                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting sensor status measurement: " + errorResponse.headers(["usgswim-messages"]));
                    else toastr.error("Error getting sensor status measurement: " + errorResponse.statusText);
                });
            }
            //retrieve part //////////////////
            $scope.RetrievedSensorStat = angular.copy(thisSensor.instrument_status.filter(function (inst) { return inst.status === "Retrieved"; })[0]);
            //if there isn't one .. then this is a lost status
            if ($scope.RetrievedSensorStat === undefined) {
                $scope.RetrievedSensorStat = angular.copy(thisSensor.instrument_status.filter(function (inst) { return inst.status === "Lost"; })[0]);
                $scope.mostRecentStatus = "Lost";
            } else {
                $scope.mostRecentStatus = "Retrieved";
            }
            if ($scope.RetrievedSensorStat.vdatum_id !== undefined && $scope.RetrievedSensorStat.vdatum_id > 0) {
                $scope.RetrievedSensorStat.vdatumName = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == $scope.RetrievedSensorStat.vdatum_id; })[0].datum_abbreviation;
            }
            if ($scope.RetrievedSensorStat.vdatum_id == undefined) {
            var vdatum29 = [];
                angular.forEach($scope.vertDatumList, function (value, key) {

                    if (value.datum_id == 4) {
                        // don't add it to the array
                    } else {
                        vdatum29.push(value);
                    }
                });
            $scope.vertDatumList = vdatum29;
            }
            $scope.RetrievedSensorStat.time_stamp = getDateTimeParts($scope.RetrievedSensorStat.time_stamp); //this keeps it as utc in display
            $scope.Retriever = allMembers.filter(function (m) { return m.member_id === $scope.RetrievedSensorStat.member_id; })[0];
            $scope.RETremoveOPList = [];
            $scope.RETtapeDownTable = []; //holder of tapedown OP_MEASUREMENTS

            $scope.RETOPchosen = function (RETopChosen) {
                var opI = $scope.RETOPsForTapeDown.map(function (o) { return o.objective_point_id; }).indexOf(RETopChosen.objective_point_id);
                if (RETopChosen.selected) {
                    //they picked an OP to use for tapedown
                    $scope.RETOPMeasure = {};
                    $scope.RETOPMeasure.op_name = RETopChosen.name;
                    $scope.RETOPMeasure.elevation = RETopChosen.elev_ft;
                    $scope.RETOPMeasure.Vdatum = $scope.ALLvertDatumList.filter(function (vd) { return vd.datum_id == RETopChosen.vdatum_id; })[0].datum_abbreviation;
                    $scope.RETOPMeasure.objective_point_id = RETopChosen.objective_point_id;
                    $scope.retTapeCopy.push($scope.RETOPMeasure);
                    $scope.retStuffCopy[1].vdatum_id = RETopChosen.vdatum_id;
                } else {
                    //they unchecked the op to remove
                    //ask them are they sure?
                    var RETremoveOPMeas = $uibModal.open({
                        backdrop: 'static',
                        keyboard: false,
                        template: '<div class="modal-header"><h3 class="modal-title">Remove OP Measure</h3></div>' +
                            '<div class="modal-body"><p>Are you sure you want to remove this OP Measurement from this retrieved sensor?</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-click="RETok()">OK</button><button class="btn btn-primary" ng-click="RETcancel()">Cancel</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.RETok = function () {
                                $uibModalInstance.close('remove');
                            };
                            $scope.RETcancel = function () {
                                $uibModalInstance.close('cancel');
                            };
                        }],
                        size: 'sm'
                    });
                    RETremoveOPMeas.result.then(function (yesOrNo) {
                        if (yesOrNo == 'remove') {
                            //add to remove it list
                            var RETtapeDownToRemove = $scope.retTapeCopy.filter(function (a) { return a.objective_point_id == RETopChosen.objective_point_id; })[0];
                            var RETtInd = $scope.retTapeCopy.map(function (o) { return o.objective_point_id; }).indexOf(RETtapeDownToRemove.objective_point_id);
                            $scope.RETremoveOPList.push(RETtapeDownToRemove.op_measurements_id);
                            $scope.retTapeCopy.splice(RETtInd, 1);
                            if ($scope.retTapeCopy.length === 0) {
                                $scope.retStuffCopy[1].vdatum_id = 0; $scope.retStuffCopy[1].gs_elevation = ''; $scope.retStuffCopy[1].ws_elevation = ''; $scope.retStuffCopy[1].sensor_elevation = '';
                            }
                        } else {
                            //never mind, make it selected again
                            $scope.RETOPsForTapeDown[opI].selected = true;
                        }
                    });
                }
            };

            //only care about op Measures if there are ops on this site
            if ($scope.OPsPresent) {
                OP_MEASURE.getInstStatOPMeasures({ instrumentStatusId: $scope.RetrievedSensorStat.instrument_status_id }).$promise.then(function (RETresponse) {
                    for (var r = 0; r < RETresponse.length; r++) {
                        var RETsensMeasures = RETresponse[r];
                        var whichOP = siteOPs.filter(function (op) { return op.objective_point_id == RETresponse[r].objective_point_id; })[0];
                        RETsensMeasures.elevation = whichOP.elev_ft;
                        RETsensMeasures.Vdatum = $scope.vertDatumList.filter(function (vd) { return vd.datum_id == whichOP.vdatum_id; })[0].datum_abbreviation;
                        RETsensMeasures.op_name = $scope.RETOPsForTapeDown.filter(function (op) { return op.objective_point_id == RETresponse[r].objective_point_id; })[0].name;
                        $scope.RETtapeDownTable.push(RETsensMeasures);
                    }
                    //go through OPsForTapeDown and add selected Property.
                    for (var i = 0; i < $scope.RETOPsForTapeDown.length; i++) {
                        //for each one, if response has this id, add 'selected:true' else add 'selected:false'
                        for (var y = 0; y < RETresponse.length; y++) {
                            if (RETresponse[y].objective_point_id == $scope.RETOPsForTapeDown[i].objective_point_id) {
                                $scope.RETOPsForTapeDown[i].selected = true;
                                y = RETresponse.length; //ensures it doesn't set it as false after setting it as true
                            }
                            else {
                                $scope.RETOPsForTapeDown[i].selected = false;
                            }
                        }
                        if (RETresponse.length === 0)
                            $scope.RETOPsForTapeDown[i].selected = false;
                    }
                }, function (errorResponse) {
                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting sensor status measurement: " + errorResponse.headers(["usgswim-messages"]));
                    else toastr.error("Error getting sensor status measurement: " + errorResponse.statusText);
                });
            }

            $scope.EventName = allEvents.filter(function (e) { return e.event_id === $scope.sensor.event_id; })[0].event_name;

            //accordion open/close glyphs
            $scope.s = { depOpen: false, retOpen: true, sFileOpen: false, NWISFileOpen: false };

            // datetimepicker
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
            //#endregion

            // is interval is number
            $scope.isNum = function (evt) {
                var theEvent = evt || window.event;
                var key = theEvent.keyCode || theEvent.which;
                if (key != 46 && key != 45 && key > 31 && (key < 48 || key > 57)) {
                    theEvent.returnValue = false;
                    if (theEvent.preventDefault) theEvent.preventDefault();
                }
            };

            //get deployment types for sensor type chosen
            $scope.getDepTypes = function (sensType) {
                $scope.filteredDeploymentTypes = [];
                var matchingSensDeplist = $scope.sensorTypeList.filter(function (sd) { return sd.sensor_type_id == sensType.sensor_type_id; })[0];
                //this is 1 sensorType with inner list of  .deploymenttypes
                $scope.filteredDeploymentTypes = matchingSensDeplist.deploymenttypes;
            };

            $scope.getDepTypes($scope.sensor); //call it first time through

            //cancel
            $scope.cancel = function () {
                $timeout(function () {
                    // anything you want can go here and will safely be run on the next digest.                   
                    var sendBack = [thisSensor];
                    $uibModalInstance.close(sendBack);
                });
            };

            //Done during edit PUT to ensure timezone doesn't affect db time value (is it UTC or local time..make sure it stays UTC)
            var dealWithTimeStampb4Send = function (w) {
                //deployed or retrieved??      
                var utcDateTime; var i;
                if (w === 'deployed') {
                    if ($scope.depStuffCopy[1].time_zone == "UTC") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.depStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);

                        // Cloning date and changing the timezone
                        var correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('Etc/GMT', true).format();

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.depStuffCopy[1].time_stamp = utcDate;
                        $scope.depStuffCopy[1].time_zone = 'UTC';
                    }

                    if ($scope.depStuffCopy[1].time_zone == "EST") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.depStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.add(1, 'hours');
                            correctedDate = correctedDate.tz('America/New_York', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/New_York', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.depStuffCopy[1].time_stamp = utcDate;
                        $scope.depStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.depStuffCopy[1].time_zone == "PST") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.depStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.add(1, 'hours');
                            correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.depStuffCopy[1].time_stamp = utcDate;
                        $scope.depStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.depStuffCopy[1].time_zone == "CST") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.depStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.add(1, 'hours');
                            correctedDate = correctedDate.tz('America/Chicago', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/Chicago', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.depStuffCopy[1].time_stamp = utcDate;
                        $scope.depStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.depStuffCopy[1].time_zone == "MST") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.depStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.add(1, 'hours');
                            correctedDate = correctedDate.tz('America/Denver', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/Denver', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.depStuffCopy[1].time_stamp = utcDate;
                        $scope.depStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.depStuffCopy[1].time_zone == "PDT") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.depStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.subtract(1, 'hours');
                            correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.depStuffCopy[1].time_stamp = utcDate;
                        $scope.depStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.depStuffCopy[1].time_zone == "EDT") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.depStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/New_York', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.subtract(1, 'hours');
                            correctedDate = correctedDate.tz('America/New_York', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.depStuffCopy[1].time_stamp = utcDate;
                        $scope.depStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.depStuffCopy[1].time_zone == "CDT") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.depStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/Chicago', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.subtract(1, 'hours');
                            correctedDate = correctedDate.tz('America/Chicago', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.depStuffCopy[1].time_stamp = utcDate;
                        $scope.depStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.depStuffCopy[1].time_zone == "MDT") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.depStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/Denver', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.subtract(1, 'hours');
                            correctedDate = correctedDate.tz('America/Denver', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.depStuffCopy[1].time_stamp = utcDate;
                        $scope.depStuffCopy[1].time_zone = 'UTC';
                    }


                    //check and see if they are not using UTC
                    /* if ($scope.depStuffCopy[1].time_zone != "UTC") {
                        //convert it
                        utcDateTime = new Date($scope.depStuffCopy[1].time_stamp).toUTCString();
                        $scope.depStuffCopy[1].time_stamp = utcDateTime;
                        $scope.depStuffCopy[1].time_zone = 'UTC';
                    } else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        i = $scope.depStuffCopy[1].time_stamp.toString().indexOf('GMT') + 3;
                        $scope.depStuffCopy[1].time_stamp = $scope.depStuffCopy[1].time_stamp.toString().substring(0, i);
                    } */
                } else {
                    if ($scope.retStuffCopy[1].time_zone == "UTC") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.retStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);

                        // Cloning date and changing the timezone
                        var correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('Etc/GMT', true).format();

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.retStuffCopy[1].time_stamp = utcDate;
                        $scope.retStuffCopy[1].time_zone = 'UTC';
                    }

                    if ($scope.retStuffCopy[1].time_zone == "EST") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.retStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);

                        // Cloning date and changing the timezone
                        var correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.retStuffCopy[1].time_stamp = utcDate;
                        $scope.retStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.retStuffCopy[1].time_zone == "PST") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.retStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);

                        // Cloning date and changing the timezone
                        var correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.retStuffCopy[1].time_stamp = utcDate;
                        $scope.retStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.retStuffCopy[1].time_zone == "CST") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.retStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);

                        // Cloning date and changing the timezone
                        var correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.retStuffCopy[1].time_stamp = utcDate;
                        $scope.retStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.retStuffCopy[1].time_zone == "MST") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.retStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);

                        // Cloning date and changing the timezone
                        var correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.retStuffCopy[1].time_stamp = utcDate;
                        $scope.retStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.retStuffCopy[1].time_zone == "PDT") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.retStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.subtract(1, 'hours');
                            correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.retStuffCopy[1].time_stamp = utcDate;
                        $scope.retStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.retStuffCopy[1].time_zone == "EDT") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.retStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/New_York', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.subtract(1, 'hours');
                            correctedDate = correctedDate.tz('America/New_York', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.retStuffCopy[1].time_stamp = utcDate;
                        $scope.retStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.retStuffCopy[1].time_zone == "CDT") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.retStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/Chicago', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.subtract(1, 'hours');
                            correctedDate = correctedDate.tz('America/Chicago', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.retStuffCopy[1].time_stamp = utcDate;
                        $scope.retStuffCopy[1].time_zone = 'UTC';

                    } if ($scope.retStuffCopy[1].time_zone == "MDT") {

                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredDate = $scope.retStuffCopy[1].time_stamp;
                        enteredDate = moment(enteredDate);
                        var isaylightSavings = enteredDate._i.toString();
                        var correctedDate;

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate = correctedDate.tz('America/Denver', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedDate = enteredDate.clone();
                            correctedDate.subtract(1, 'hours');
                            correctedDate = correctedDate.tz('America/Denver', true).format();
                        }

                        // formatting in UTC
                        var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                        $scope.retStuffCopy[1].time_stamp = utcDate;
                        $scope.retStuffCopy[1].time_zone = 'UTC';
                    }
                    //check and see if they are not using UTC
                    /* if ($scope.retStuffCopy[1].time_zone != "UTC") {
                        //convert it
                        utcDateTime = new Date($scope.retStuffCopy[1].time_stamp).toUTCString();
                        $scope.retStuffCopy[1].time_stamp = utcDateTime;
                        $scope.retStuffCopy[1].time_zone = 'UTC';
                    } */ else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        i = $scope.retStuffCopy[1].time_stamp.toString().indexOf('GMT') + 3;
                        $scope.retStuffCopy[1].time_stamp = $scope.retStuffCopy[1].time_stamp.toString().substring(0, i);
                    }
                }
            };

            $scope.previewTimeRet = function () {
            

                // getting the time initally set for peak date
                if ($scope.retStuffCopy[1].time_stamp != undefined) {
                    $scope.timePreview = $scope.retStuffCopy[1].time_stamp;
                } else {
                    $scope.timePreview = $scope.retStuffCopy[1].time_stamp;
                }

                //check and see if they are not using UTC
                if ($scope.retStuffCopy[1].time_zone == "UTC") {
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);

                    // Cloning date and changing the timezone
                    var correctedDate = enteredDate.clone();
                    correctedDate = correctedDate.tz('Etc/GMT', true).format();

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;
                }
                if ($scope.retStuffCopy[1].time_zone == "EST") { // +5
                    // + 5
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate =  $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.retStuffCopy[1].time_zone == "PST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate =  $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.retStuffCopy[1].time_zone == "CST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.retStuffCopy[1].time_zone == "MST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.retStuffCopy[1].time_zone == "PDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.retStuffCopy[1].time_zone == "EDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.retStuffCopy[1].time_zone == "CDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.retStuffCopy[1].time_zone == "MDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;
                }
                else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.timePreview.toString().indexOf('GMT') + 3;
                    $scope.timePreview = $scope.timePreview.toString().substring(0, i);
                }

            }

            var getinitialTimeRet = function () {
            

                // getting the time initally set for peak date
                if ($scope.retStuffCopy[1].time_stamp != undefined) {
                    $scope.timePreview = $scope.retStuffCopy[1].time_stamp;
                } else {
                    $scope.timePreview = $scope.retStuffCopy[1].time_stamp;
                }

                //check and see if they are not using UTC
                if ($scope.retStuffCopy[1].time_zone == "UTC") {
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);

                    // Cloning date and changing the timezone
                    var correctedDate = enteredDate.clone();
                    correctedDate = correctedDate.tz('Etc/GMT', true).format();

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;
                }
                if ($scope.retStuffCopy[1].time_zone == "EST") { // +5
                    // + 5
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate =  $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.retStuffCopy[1].time_zone == "PST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate =  $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.retStuffCopy[1].time_zone == "CST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.retStuffCopy[1].time_zone == "MST") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.add(1, 'hours');
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.retStuffCopy[1].time_zone == "PDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.retStuffCopy[1].time_zone == "EDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.retStuffCopy[1].time_zone == "CDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;

                } if ($scope.retStuffCopy[1].time_zone == "MDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDate = $scope.timePreview;
                    enteredDate = moment(enteredDate);
                    var isaylightSavings = enteredDate._i.toString();
                    var correctedDate;

                    if (isaylightSavings.indexOf('Daylight') >= 0){

                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate = correctedDate.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDate = enteredDate.clone();
                        correctedDate.subtract(1, 'hours');
                        correctedDate = correctedDate.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDate = moment.utc(correctedDate).toDate().toUTCString();

                    $scope.timePreview = utcDate;
                }
                else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.timePreview.toString().indexOf('GMT') + 3;
                    $scope.timePreview = $scope.timePreview.toString().substring(0, i);
                }

            }

            // remove all the related stuff from this sensor
            var extractJustInstrumentForPUT = function (fullSensor) {
                var basicInstrument = angular.copy(fullSensor);
                var returnInstrument = {};
                returnInstrument.instrument_id = basicInstrument.instrument_id;
                if (basicInstrument.sensor_type_id) returnInstrument.sensor_type_id = basicInstrument.sensor_type_id;//sensor_type_id
                if (basicInstrument.deployment_type_id) returnInstrument.deployment_type_id = basicInstrument.deployment_type_id;//deployment_type_id
                if (basicInstrument.location_description) returnInstrument.location_description = basicInstrument.location_description;//location_description
                if (basicInstrument.serial_number) returnInstrument.serial_number = basicInstrument.serial_number;//serial_number
                if (basicInstrument.housing_serial_number) returnInstrument.housing_serial_number = basicInstrument.housing_serial_number;//housing_serial_number
                if (basicInstrument.interval) returnInstrument.interval = basicInstrument.interval;//interval
                if (basicInstrument.site_id) returnInstrument.site_id = basicInstrument.site_id; //site_id
                if (basicInstrument.event_id) returnInstrument.event_id = basicInstrument.event_id; //event_id
                if (basicInstrument.inst_collection_id) returnInstrument.inst_collection_id = basicInstrument.inst_collection_id;//inst_collection_id
                if (basicInstrument.housing_type_id) returnInstrument.housing_type_id = basicInstrument.housing_type_id;//housing_type_id
                if (basicInstrument.sensor_brand_id) returnInstrument.sensor_brand_id = basicInstrument.sensor_brand_id; //sensor_brand_id
                if (basicInstrument.vented) returnInstrument.vented = basicInstrument.vented;//vented
                if (basicInstrument.last_updated) returnInstrument.last_updated = basicInstrument.last_updated; //last_updated
                if (basicInstrument.last_updated_by) returnInstrument.last_updated_by = basicInstrument.last_updated_by;//last_updated_by
                return returnInstrument;
            }

            // deploy edit
            //edit button clicked. make copy of deployed info 
            $scope.wannaEditDep = function () {
                $scope.view.DEPval = 'edit';
                $scope.depStuffCopy = [angular.copy($scope.sensor), angular.copy($scope.DeployedSensorStat)];
                $scope.depTapeCopy = angular.copy($scope.DEPtapeDownTable);
            };

            //save Deployed sensor info
            $scope.saveDeployed = function (valid) {
                if (valid) {
                    var updatedSensor = {};
                    var updatedSenStat = {};
                    //see if they used Minutes or seconds for interval. need to store in seconds
                    if ($scope.IntervalType.type == "Minutes")
                        $scope.depStuffCopy[0].interval = $scope.depStuffCopy[0].interval * 60;
                    dealWithTimeStampb4Send('deployed'); //UTC or local?                    
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    var basicInstrumentD = extractJustInstrumentForPUT($scope.depStuffCopy[0]);
                    INSTRUMENT.update({ id: $scope.depStuffCopy[0].instrument_id }, basicInstrumentD).$promise.then(function (response) {
                        updatedSensor = response;
                        updatedSensor.deploymentType = $scope.depStuffCopy[0].deployment_type_id > 0 ? $scope.depTypeList.filter(function (d) { return d.deployment_type_id === $scope.depStuffCopy[0].deployment_type_id; })[0].method : '';
                        updatedSensor.housingType = $scope.depStuffCopy[0].housing_type_id > 0 ? $scope.houseTypeList.filter(function (h) { return h.housing_type_id === $scope.depStuffCopy[0].housing_type_id; })[0].type_name : '';
                        updatedSensor.sensorBrand = $scope.sensorBrandList.filter(function (s) { return s.sensor_brand_id === $scope.depStuffCopy[0].sensor_brand_id; })[0].brand_name;
                        updatedSensor.sensorType = $scope.sensorTypeList.filter(function (t) { return t.sensor_type_id === $scope.depStuffCopy[0].sensor_type_id; })[0].sensor;
                        updatedSensor.instCollection = $scope.collectCondList.filter(function (i) { return i.id === $scope.depStuffCopy[0].inst_collection_id; })[0].condition;
                        INSTRUMENT_STATUS.update({ id: $scope.depStuffCopy[1].instrument_status_id }, $scope.depStuffCopy[1]).$promise.then(function (statResponse) {
                            //deal with tapedowns. remove/add
                            for (var rt = 0; rt < $scope.DEPremoveOPList.length; rt++) {
                                var DEPidToRemove = $scope.DEPremoveOPList[rt];
                                OP_MEASURE.delete({ id: DEPidToRemove }).$promise;
                            }
                            $scope.DEPtapeDownTable = $scope.depTapeCopy.length > 0 ? [] : $scope.DEPtapeDownTable;
                            for (var at = 0; at < $scope.depTapeCopy.length; at++) {
                                var DEPthisTape = $scope.depTapeCopy[at];
                                if (DEPthisTape.op_measurements_id !== undefined) {
                                    //existing, put in case they changed it
                                    OP_MEASURE.update({ id: DEPthisTape.op_measurements_id }, DEPthisTape).$promise.then(function (tapeResponse) {
                                        tapeResponse.op_name = DEPthisTape.op_name;
                                        tapeResponse.Vdatum = DEPthisTape.Vdatum;
                                        $scope.DEPtapeDownTable.push(tapeResponse);
                                    });
                                } else {
                                    //new one added, post
                                    DEPthisTape.instrument_status_id = statResponse.instrument_status_id;
                                    OP_MEASURE.save(DEPthisTape).$promise.then(function (tapeResponse) {
                                        tapeResponse.op_name = DEPthisTape.op_name;
                                        tapeResponse.Vdatum = DEPthisTape.Vdatum;
                                        $scope.DEPtapeDownTable.push(tapeResponse);
                                    });
                                }
                            }
                            updatedSenStat = statResponse;
                            updatedSenStat.status = "Deployed"; //can't change status on a deployed edit..still deployed
                            $scope.sensor = updatedSensor;
                            var allStatusHolder = thisSensor.instrument_status;
                            thisSensor = updatedSensor;
                            $scope.DeployedSensorStat = updatedSenStat;

                            $scope.DeployedSensorStat.time_stamp = getDateTimeParts($scope.DeployedSensorStat.time_stamp);//this keeps it as utc in display
                            thisSensor.instrument_status = allStatusHolder;
                            var ind = thisSensor.instrument_status.map(function (i) { return i.status_type_id; }).indexOf(1);
                            thisSensor.instrument_status[ind] = $scope.DeployedSensorStat;
                            $scope.sensor.instrument_status = thisSensor.instrument_status;
                            $scope.depStuffCopy = []; $scope.depTapeCopy = [];
                            $scope.IntervalType = { type: 'Seconds' };
                            $scope.view.DEPval = 'detail';
                            toastr.success("Sensor Updated");
                        }, function (errorResponse) {
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving sensor's status: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error saving sensor's status: " + errorResponse.statusText);
                        });
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving sensor: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error saving sensor: " + errorResponse.statusText);
                    });
                }//end if valid
            };//end saveDeployed()

            //never mind, don't want to edit deployed sensor
            $scope.cancelDepEdit = function () {
                $scope.view.DEPval = 'detail';
                $scope.depStuffCopy = [];
                $scope.depTapeCopy = [];
                //MAKE SURE ALL SELECTED OP'S STAY SELECTED
                for (var i = 0; i < $scope.DEPOPsForTapeDown.length; i++) {
                    //for each one, if response has this id, add 'selected:true' else add 'selected:false'
                    for (var y = 0; y < $scope.DEPtapeDownTable.length; y++) {
                        if ($scope.DEPtapeDownTable[y].objective_point_id == $scope.DEPOPsForTapeDown[i].objective_point_id) {
                            $scope.DEPOPsForTapeDown[i].selected = true;
                            y = $scope.DEPtapeDownTable.length; //ensures it doesn't set it as false after setting it as true
                        }
                        else {
                            $scope.DEPOPsForTapeDown[i].selected = false;
                        }
                    }
                    if ($scope.DEPtapeDownTable.length === 0)
                        $scope.DEPOPsForTapeDown[i].selected = false;
                }
            };
            //#endregion deploy edit

            //#region Retrieve edit
            //edit button clicked. make copy of deployed info 
            $scope.wannaEditRet = function () {
                $scope.view.RETval = 'edit';
                $scope.retStuffCopy = [angular.copy($scope.sensor), angular.copy($scope.RetrievedSensorStat)];
                $scope.retTapeCopy = angular.copy($scope.RETtapeDownTable);
                getinitialTimeRet();
            };

            //save Retrieved sensor info
            $scope.saveRetrieved = function (valid) {
                if (valid) {
                    var updatedRetSensor = {}; var updatedRetSenStat = {};
                    dealWithTimeStampb4Send('retrieved'); //UTC or local?
                    // $scope.retStuffCopy[1].time_stamp = new Date($scope.retStuffCopy[1].time_stamp);//datetime is annoying
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    var basicInstrumentR = extractJustInstrumentForPUT($scope.retStuffCopy[0]);
                    INSTRUMENT.update({ id: $scope.retStuffCopy[0].instrument_id }, basicInstrumentR).$promise.then(function (response) {
                        updatedRetSensor = response;
                        updatedRetSensor.deploymentType = $scope.retStuffCopy[0].deployment_type_id > 0 ? $scope.depTypeList.filter(function (d) { return d.deployment_type_id === $scope.retStuffCopy[0].deployment_type_id; })[0].method : '';
                        updatedRetSensor.housingType = $scope.retStuffCopy[0].housing_type_id > 0 ? $scope.houseTypeList.filter(function (h) { return h.housing_type_id === $scope.retStuffCopy[0].housing_type_id; })[0].type_name : '';
                        updatedRetSensor.sensorBrand = $scope.sensorBrandList.filter(function (s) { return s.sensor_brand_id === $scope.retStuffCopy[0].sensor_brand_id; })[0].brand_name;
                        updatedRetSensor.sensorType = $scope.sensorTypeList.filter(function (t) { return t.sensor_type_id === $scope.retStuffCopy[0].sensor_type_id; })[0].sensor;
                        updatedRetSensor.instCollection = $scope.collectCondList.filter(function (i) { return i.id === $scope.retStuffCopy[0].inst_collection_id; })[0].condition;
                        //update copied references for passing back to list
                        $scope.sensor = updatedRetSensor;
                        var statsHolder = thisSensor.instrument_status;
                        thisSensor = updatedRetSensor;
                        thisSensor.instrument_status = statsHolder;
                        INSTRUMENT_STATUS.update({ id: $scope.retStuffCopy[1].instrument_status_id }, $scope.retStuffCopy[1]).$promise.then(function (statResponse) {
                            $scope.mostRecentStatus = statResponse.status_type_id == 2 ? "Retrieved" : "Lost";
                            $scope.RetrievedSensorStat = statResponse;
                            $scope.RetrievedSensorStat.status = statResponse.status_type_id == 2 ? "Retrieved" : "Lost";
                            $scope.RetrievedSensorStat.time_stamp = getDateTimeParts($scope.RetrievedSensorStat.time_stamp);//this keeps it as utc in display
                            thisSensor.instrument_status[0] = $scope.RetrievedSensorStat;

                            //deal with tapedowns. remove/add
                            for (var rt = 0; rt < $scope.RETremoveOPList.length; rt++) {
                                var RETidToRemove = $scope.RETremoveOPList[rt];
                                OP_MEASURE.delete({ id: RETidToRemove }).$promise;
                            }
                            $scope.RETtapeDownTable = $scope.retTapeCopy.length > 0 ? [] : $scope.RETtapeDownTable;
                            for (var at = 0; at < $scope.retTapeCopy.length; at++) {
                                var RETthisTape = $scope.retTapeCopy[at];
                                if (RETthisTape.op_measurements_id !== undefined) {
                                    //existing, put in case they changed it
                                    OP_MEASURE.update({ id: RETthisTape.op_measurements_id }, RETthisTape).$promise.then(function (tapeResponse) {
                                        tapeResponse.op_name = RETthisTape.op_name;
                                        tapeResponse.Vdatum = RETthisTape.Vdatum;
                                        $scope.RETtapeDownTable.push(tapeResponse);
                                    });
                                } else {
                                    //new one added, post
                                    RETthisTape.instrument_status_id = statResponse.instrument_status_id;
                                    OP_MEASURE.save(RETthisTape).$promise.then(function (tapeResponse) {
                                        tapeResponse.op_name = RETthisTape.op_name;
                                        tapeResponse.Vdatum = RETthisTape.Vdatum;
                                        $scope.RETtapeDownTable.push(tapeResponse);
                                    });
                                }
                            }
                            $scope.retStuffCopy = []; $scope.retTapeCopy = [];
                            $scope.view.RETval = 'detail';
                            toastr.success("Sensor updated");
                        }, function (errorResponse) {
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving sensor's status: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error saving sensor's status: " + errorResponse.statusText);
                        });
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving sensor: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error saving sensor: " + errorResponse.statusText);
                    });
                }//end if valid
            };//end saveRetrieved()            

            //never mind, don't want to edit retrieved sensor
            $scope.cancelRetEdit = function () {
                $scope.view.RETval = 'detail';
                $scope.retStuffCopy = [];
                $scope.retTapeCopy = [];
                //MAKE SURE ALL SELECTED OP'S STAY SELECTED
                for (var i = 0; i < $scope.RETOPsForTapeDown.length; i++) {
                    //for each one, if response has this id, add 'selected:true' else add 'selected:false'
                    for (var y = 0; y < $scope.RETtapeDownTable.length; y++) {
                        if ($scope.RETtapeDownTable[y].objective_point_id == $scope.RETOPsForTapeDown[i].objective_point_id) {
                            $scope.RETOPsForTapeDown[i].selected = true;
                            y = $scope.RETtapeDownTable.length; //ensures it doesn't set it as false after setting it as true
                        }
                        else {
                            $scope.RETOPsForTapeDown[i].selected = false;
                        }
                    }
                    if ($scope.RETtapeDownTable.length === 0)
                        $scope.RETOPsForTapeDown[i].selected = false;
                }
            };
            //#endregion Retrieve edit

            //delete aSensor and sensor statuses
            $scope.deleteS = function () {
                //TODO:: Delete the files for this sensor too or reassign to the Site?? Services or client handling?
                var DeleteModalInstance = $uibModal.open({
                    backdrop: 'static',
                    keyboard: false,
                    templateUrl: 'removemodal.html',
                    controller: 'ConfirmModalCtrl',
                    size: 'sm',
                    resolve: {
                        nameToRemove: function () {
                            return $scope.sensor;
                        },
                        what: function () {
                            return "Sensor";
                        }
                    }
                });

                DeleteModalInstance.result.then(function (sensorToRemove) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    //this will delete the instrument and all it's statuses
                    INSTRUMENT.delete({ id: sensorToRemove.instrument_id }).$promise.then(function () {
                        $scope.sensorFiles = []; //clear out sensorFiles for this sensor
                        $scope.sensImageFiles = []; //clear out image files for this sensor
                        //now remove all these files from SiteFiles
                        var l = $scope.allSFiles.length;
                        while (l--) {
                            if ($scope.allSFiles[l].instrument_id == sensorToRemove.instrument_id) $scope.allSFiles.splice(l, 1);
                        }
                        //updates the file list on the sitedashboard
                        Site_Files.setAllSiteFiles($scope.allSFiles);
                        toastr.success("Sensor Removed");
                        var sendBack = ["de", 'deleted'];
                        $uibModalInstance.close(sendBack);
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error deleting sensor: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error deleting sensor: " + errorResponse.statusText);
                    });
                });//end modal
            };

            // FILE STUFF
            $scope.stamp = FILE_STAMP.getStamp(); $scope.fileItemExists = true;
            //need to reupload fileItem to this existing file OR Change out existing fileItem for new one
            $scope.saveFileUpload = function () {
                if ($scope.aFile.File == undefined && $scope.aFile.File1 == undefined) {
                    alert("You need to choose a file first");
                } else {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    $scope.sFileIsUploading = true;
                    var fileParts = {
                        FileEntity: {
                            file_id: $scope.aFile.file_id,
                            name: $scope.aFile.name,
                            description: $scope.aFile.description,
                            photo_direction: $scope.aFile.photo_direction,
                            latitude_dd: $scope.aFile.latitude_dd,
                            longitude_dd: $scope.aFile.longitude_dd,
                            file_date: $scope.aFile.file_date,
                            hwm_id: $scope.aFile.hwm_id,
                            site_id: $scope.aFile.site_id,
                            filetype_id: $scope.aFile.filetype_id,
                            source_id: $scope.aFile.source_id,
                            path: $scope.aFile.path,
                            data_file_id: $scope.aFile.data_file_id,
                            instrument_id: $scope.aFile.instrument_id,
                            photo_date: $scope.aFile.photo_date,
                            is_nwis: $scope.aFile.is_nwis,
                            objective_point_id: $scope.aFile.objective_point_id
                        },
                        File: $scope.aFile.File1 !== undefined ? $scope.aFile.File1 : $scope.aFile.File
                    };
                    //need to put the fileParts into correct format for post
                    var fd = new FormData();
                    fd.append("FileEntity", JSON.stringify(fileParts.FileEntity));
                    fd.append("File", fileParts.File);
                    //now POST it (fileparts)
                    FILE.uploadFile(fd).$promise.then(function (fresponse) {
                        toastr.success("File Uploaded");
                        $scope.src = $scope.serverURL + '/Files/' + $scope.aFile.file_id + '/Item' + FILE_STAMP.getStamp();
                        FILE_STAMP.setStamp();
                        $scope.stamp = FILE_STAMP.getStamp();
                        if ($scope.aFile.File1.type.indexOf("image") > -1) {
                            $scope.isPhoto = true;
                        } else $scope.isPhoto = false;
                        $scope.aFile.name = fresponse.name; $scope.aFile.path = fresponse.path;
                        if ($scope.aFile.File1 !== undefined) {
                            $scope.aFile.File = $scope.aFile.File1;
                            $scope.aFile.File1 = undefined; //put it as file and remove it from 1
                        }
                        fresponse.fileBelongsTo = $scope.aFile.filetype_id == 2 ? "DataFile File" : "Sensor File";
                        if (fresponse.filetype_id === 1) {
                            $scope.sensImageFiles.splice($scope.existIMGFileIndex, 1);
                            $scope.sensImageFiles.push(fresponse);
                        }
                        $scope.sensorFiles[$scope.existFileIndex] = fresponse;
                        $scope.allSFiles[$scope.allSFileIndex] = fresponse;
                        Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                        $scope.sFileIsUploading = false;
                        $scope.fileItemExists = true;
                    }, function (errorResponse) {
                        $scope.sFileIsUploading = false;
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error creating file: " + errorResponse.statusText);
                    });
                }
            };
            //show a modal with the larger image as a preview on the photo file for this op
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

            var getinitialpreviewDataTime = function () {

                // getting the time initally set for file date
                if ($scope.datafile.good_start != undefined) {
                    $scope.timePreviewStart = $scope.datafile.good_start;
                    $scope.timePreviewEnd = $scope.datafile.good_end;
                } else {
                    $scope.timePreviewStart = $scope.datafile.good_start;
                    $scope.timePreviewEnd = $scope.datafile.good_end;
                }

                //check and see if they are not using UTC
                if ($scope.datafile.time_zone == "UTC") {
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);

                    // Cloning date and changing the timezone
                    var correctedDateStart = enteredDateStart.clone();
                    var correctedDateEnd = enteredDateEnd.clone();
                    correctedDateStart = correctedDateStart.tz('Etc/GMT', true).format();
                    correctedDateEnd = correctedDateEnd.tz('Etc/GMT', true).format();

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                }
                if ($scope.datafile.time_zone == "EST") { // +5
                    // + 5
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "PST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);

                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
                    }
                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "CST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDatestart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "MST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDatestart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.datafile.time_zone == "PDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.datafile.time_zone == "EDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.datafile.time_zone == "CDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "MDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                }
                else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.timePreviewStart.toString().indexOf('GMT') + 3;
                    var d = $scope.timePreviewEnd.toString().indexOf('GMT') + 3;
                    $scope.timePreviewStart = $scope.timePreviewStart.toString().substring(0, i);
                    $scope.timePreviewEnd = $scope.timePreviewEnd.toString().substring(0, d);
                }

            };

            //want to add or edit file
            $scope.showFile = function (file) {
                $scope.fileTypes = $scope.fileTypeList;
                $scope.agencies = agencyList;
                $scope.existFileIndex = -1;
                $scope.existIMGFileIndex = -1;
                $scope.allSFileIndex = -1; //indexes for splice/change
                $scope.aFile = {}; //holder for file
                $scope.aSource = {}; //holder for file source
                $scope.datafile = {}; //holder for file datafile
                if (file !== 0) {
                    //edit op file
                    $scope.existFileIndex = $scope.sensorFiles.indexOf(file);
                    $scope.allSFileIndex = $scope.allSFiles.indexOf(file);
                    $scope.existIMGFileIndex = $scope.sensImageFiles.length > 0 ? $scope.sensImageFiles.indexOf(file) : -1;
                    $scope.aFile = angular.copy(file);
                    FILE.getFileItem({ id: $scope.aFile.file_id }).$promise.then(function (response) {
                        $scope.fileItemExists = response.Length > 0 ? true : false;
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting file item: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error getting file item: " + errorResponse.statusText);
                    });
                    $scope.aFile.fileType = $scope.fileTypeList.filter(function (ft) { return ft.filetype_id == $scope.aFile.filetype_id; })[0].filetype;
                    //determine if existing file is a photo (even if type is not )
                    if ($scope.aFile.name !== undefined) {
                        var fI = $scope.aFile.name.lastIndexOf(".");
                        var fileExt = $scope.aFile.name.substring(fI + 1);
                        if (fileExt.match(/(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
                            $scope.isPhoto = true;
                        } else $scope.isPhoto = false;
                    }
                    $scope.src = $scope.serverURL + '/Files/' + $scope.aFile.file_id + '/Item' + FILE_STAMP.getStamp();
                    $scope.aFile.file_date = new Date($scope.aFile.file_date); //date for validity of form on PUT
                    if ($scope.aFile.photo_date !== undefined) $scope.aFile.photo_date = new Date($scope.aFile.photo_date); //date for validity of form on PUT
                    if (file.source_id !== undefined) {
                        SOURCE.query({ id: file.source_id }).$promise.then(function (s) {
                            $scope.aSource = s;
                            $scope.aSource.FULLname = $scope.aSource.source_name;
                            //add agency name to photo caption
                            if ($scope.aFile.filetype_id == 1)
                                $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
                        }, function (errorResponse) {
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting source: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error getting source: " + errorResponse.statusText);
                        });
                    }//end if source
                    if (file.data_file_id !== undefined) {
                        $scope.ApprovalInfo = {};
                        DATA_FILE.query({ id: file.data_file_id }).$promise.then(function (df) {
                            $scope.datafile = df;
                            $scope.processor = allMembers.filter(function (m) { return m.member_id == $scope.datafile.processor_id; })[0];
                            $scope.datafile.collect_date = new Date($scope.datafile.collect_date);
                            $scope.datafile.good_start = getDateTimeParts($scope.datafile.good_start);
                            $scope.datafile.good_end = getDateTimeParts($scope.datafile.good_end);
                            if (df.approval_id !== undefined && df.approval_id !== null && df.approval_id >= 1) {
                                DATA_FILE.getDFApproval({ id: df.data_file_id }, function success(approvalResponse) {
                                    $scope.ApprovalInfo.approvalDate = new Date(approvalResponse.approval_date); //include note that it's displayed in their local time but stored in UTC
                                    $scope.ApprovalInfo.Member = allMembers.filter(function (amem) { return amem.member_id == approvalResponse.member_id; })[0];
                                }, function error(errorResponse) {
                                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting data file approval: " + errorResponse.headers(["usgswim-messages"]));
                                    else toastr.error("Error getting data file approval: " + errorResponse.statusText);
                                });
                            }
                        }, function (errorResponse) {
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting data file: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error getting data file: " + errorResponse.statusText);
                        });
                    }
                }//end existing file
                else {
                    //creating a file
                    $scope.aFile.file_date = new Date(); $scope.aFile.photo_date = new Date();
                    $scope.aSource = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];
                    $scope.aSource.FULLname = $scope.aSource.fname + " " + $scope.aSource.lname;
                    $scope.processor = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];
                    var dt = getTimeZoneStamp();
                    $scope.datafile.collect_date = dt[0];
                    $scope.datafile.time_zone = dt[1]; //will be converted to utc on post/put 
                    $scope.datafile.good_start = moment().toISOString();//new Date();
                    $scope.datafile.good_end = moment().toISOString();//new Date();
                    $scope.datafile.good_start = getDateTimeParts($scope.datafile.good_start);//new Date();
                    $scope.datafile.good_end = getDateTimeParts($scope.datafile.good_end);//new Date();
                    getinitialpreviewDataTime();
                } //end new file
                $scope.showFileForm = true;
                // preview ret file datetime in sensor modal
            $scope.previewDataTimeRetFile = function () {

                // getting the time initally set for peak date
                if ($scope.datafile.good_start != undefined) {
                    $scope.timePreviewStart = $scope.datafile.good_start;
                    $scope.timePreviewEnd = $scope.datafile.good_end;
                } else {
                    $scope.timePreviewStart = $scope.datafile.good_start;
                    $scope.timePreviewEnd = $scope.datafile.good_end;
                }

                //check and see if they are not using UTC
                if ($scope.datafile.time_zone == "UTC") {
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);

                    // Cloning date and changing the timezone
                    var correctedDateStart = enteredDateStart.clone();
                    var correctedDateEnd = enteredDateEnd.clone();
                    correctedDateStart = correctedDateStart.tz('Etc/GMT', true).format();
                    correctedDateEnd = correctedDateEnd.tz('Etc/GMT', true).format();

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                }
                if ($scope.datafile.time_zone == "EST") { // +5
                    // + 5
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "PST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);

                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
                    }
                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "CST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDatestart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "MST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDatestart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.datafile.time_zone == "PDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.datafile.time_zone == "EDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.datafile.time_zone == "CDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "MDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                }
                else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.timePreviewStart.toString().indexOf('GMT') + 3;
                    var d = $scope.timePreviewEnd.toString().indexOf('GMT') + 3;
                    $scope.timePreviewStart = $scope.timePreviewStart.toString().substring(0, i);
                    $scope.timePreviewEnd = $scope.timePreviewEnd.toString().substring(0, d);
                }

            };

                $scope.updateAgencyForCaption = function () {
                    if ($scope.aFile.filetype_id == 1)
                        $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
                };
            };

            //create this new file
            $scope.createFile = function (valid) {
                if ($scope.aFile.File !== undefined) {
                    if ($scope.aFile.filetype_id == 2) {
                        //make sure end date is after start date
                        var s = $scope.datafile.good_start;//need to get dep status date in same format as retrieved to compare
                        var e = $scope.datafile.good_end; //stupid comma in there making it not the same
                        if (new Date(e) < new Date(s)) {
                            valid = false;
                            var fixDate = $uibModal.open({
                                template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                    '<div class="modal-body"><p>The good end date must be after the good start date.</p></div>' +
                                    '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                    $scope.ok = function () {
                                        $uibModalInstance.close();
                                    };
                                }],
                                size: 'sm'
                            });
                            fixDate.result.then(function () {
                                valid = false;
                            });
                        }
                        if (s == undefined || e == undefined) {
                            valid = false;
                            var missingDate = $uibModal.open({
                                template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                    '<div class="modal-body"><p>The good data start date or good data end date is missing. Either choose a date, or click Preview Data to get a chart of the data, where you can choose the dates.</p></div>' +
                                    '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                    $scope.ok = function () {
                                        $uibModalInstance.close();
                                    };
                                }],
                                size: 'sm'
                            });
                            missingDate.result.then(function () {
                                valid = false;
                            });
                        }
                    }
                    if (valid) {
                        $scope.fullSenfileIsUploading = true;
                        $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                        $http.defaults.headers.common.Accept = 'application/json';
                        //post source or datafile first to get source_id or data_file_id
                        if ($scope.aFile.filetype_id == 2) {
                            if ($scope.datafile.time_zone == "UTC") {
                                // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                                var enteredUtcStartDateTime = $scope.datafile.good_start;
                                enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                                var enteredUtcEndDateTime = $scope.datafile.good_end;
                                enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                                // Cloning date and changing the timezone
                                var correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                correctedutcStartDateTime = correctedutcStartDateTime.tz('Etc/GMT', true).format();

                                var correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                correctedutcEndDateTime = correctedutcEndDateTime.tz('Etc/GMT', true).format();

                                // formatting in UTC
                                var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                                var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            }
                            if ($scope.datafile.time_zone == "EST") {
                                // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                                var enteredUtcStartDateTime = $scope.datafile.good_start;
                                enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                                var enteredUtcEndDateTime = $scope.datafile.good_end;
                                enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                                var isaylightSavings = enteredUtcStartDateTime._i.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    // Cloning date and changing the timezone
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();
                                }
                                // formatting in UTC
                                var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                                var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            } if ($scope.datafile.time_zone == "PST") {
                                // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                                var enteredUtcStartDateTime = $scope.datafile.good_start;
                                enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                                var enteredUtcEndDateTime = $scope.datafile.good_end;
                                enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                                var isaylightSavings = enteredUtcStartDateTime._i.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    // Cloning date and changing the timezone
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                     correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();
                                }
                                // formatting in UTC
                                var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                                var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            } if ($scope.datafile.time_zone == "CST") {
                                // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                                var enteredUtcStartDateTime = $scope.datafile.good_start;
                                enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                                var enteredUtcEndDateTime = $scope.datafile.good_end;
                                enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                                var isaylightSavings = enteredUtcStartDateTime._i.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();
                                }
                                // formatting in UTC
                                var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                                var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            } if ($scope.datafile.time_zone == "MST") {
                                // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                                var enteredUtcStartDateTime = $scope.datafile.good_start;
                                enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                                var enteredUtcEndDateTime = $scope.datafile.good_end;
                                enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                                var isaylightSavings = enteredUtcStartDateTime._i.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                     correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();
                                }
                                // formatting in UTC
                                var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                                var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            } if ($scope.datafile.time_zone == "PDT") {
                                // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                                var enteredUtcStartDateTime = $scope.datafile.good_start;
                                enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                                var enteredUtcEndDateTime = $scope.datafile.good_end;
                                enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                                var isaylightSavings = enteredUtcStartDateTime._i.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();
                                }
                                // formatting in UTC
                                var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                                var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            } if ($scope.datafile.time_zone == "EDT") {
                                // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                                var enteredUtcStartDateTime = $scope.datafile.good_start;
                                enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                                var enteredUtcEndDateTime = $scope.datafile.good_end;
                                enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                                var isaylightSavings = enteredUtcStartDateTime._i.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();
                                }
                                // formatting in UTC
                                var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                                var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            } if ($scope.datafile.time_zone == "CDT") {
                                // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                                var enteredUtcStartDateTime = $scope.datafile.good_start;
                                enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                                var enteredUtcEndDateTime = $scope.datafile.good_end;
                                enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                                var isaylightSavings = enteredUtcStartDateTime._i.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();
                                }
                                // formatting in UTC
                                var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                                var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            } if ($scope.datafile.time_zone == "MDT") {
                                // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                                var enteredUtcStartDateTime = $scope.datafile.good_start;
                                enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                                var enteredUtcEndDateTime = $scope.datafile.good_end;
                                enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                                var isaylightSavings = enteredUtcStartDateTime._i.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();
                                }
                                // formatting in UTC
                                var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                                var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            }
                            //determine timezone
                            /* if ($scope.datafile.time_zone != "UTC") {
                                //convert it
                                var utcStartDateTime = new Date($scope.datafile.good_start).toUTCString();
                                var utcEndDateTime = new Date($scope.datafile.good_end).toUTCString();
                                $scope.datafile.good_start = utcStartDateTime;
                                $scope.datafile.good_end = utcEndDateTime;
                                $scope.datafile.time_zone = 'UTC';
                            } */ else {
                                //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                                var si = $scope.datafile.good_start.toString().indexOf('GMT') + 3;
                                var ei = $scope.datafile.good_end.toString().indexOf('GMT') + 3;
                                $scope.datafile.good_start = $scope.datafile.good_start.toString().substring(0, si);
                                $scope.datafile.good_end = $scope.datafile.good_end.toString().substring(0, ei);
                            }
                            $scope.datafile.instrument_id = thisSensor.instrument_id;
                            $scope.datafile.processor_id = $cookies.get('mID');
                            var datafileID = 0;
                            DATA_FILE.save($scope.datafile).$promise.then(function (dfResponse) {
                                datafileID = dfResponse.data_file_id;
                                //then POST fileParts (Services populate PATH)
                                var fileParts = {
                                    FileEntity: {
                                        filetype_id: $scope.aFile.filetype_id,
                                        name: $scope.aFile.File.name,
                                        file_date: $scope.aFile.file_date,
                                        description: $scope.aFile.description,
                                        site_id: $scope.thisSensorSite.site_id,
                                        data_file_id: dfResponse.data_file_id,
                                        photo_direction: $scope.aFile.photo_direction,
                                        latitude_dd: $scope.aFile.latitude_dd,
                                        longitude_dd: $scope.aFile.longitude_dd,
                                        instrument_id: thisSensor.instrument_id
                                    },
                                    File: $scope.aFile.File
                                };
                                //need to put the fileParts into correct format for post
                                var fd = new FormData();
                                fd.append("FileEntity", JSON.stringify(fileParts.FileEntity));
                                fd.append("File", fileParts.File);
                                //now POST it (fileparts)
                                FILE.uploadFile(fd).$promise.then(function (fresponse) {
                                    toastr.success("File Uploaded");
                                    fresponse.fileBelongsTo = "DataFile File";
                                    $scope.sensorFiles.push(fresponse);
                                    $scope.allSFiles.push(fresponse);
                                    Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                    if (fresponse.filetype_id === 1) $scope.sensImageFiles.push(fresponse);
                                    $scope.showFileForm = false; $scope.fullSenfileIsUploading = false;
                                }, function (errorResponse) {
                                    // file did not get created, delete datafile
                                    DATA_FILE.delete({ id: datafileID });
                                    $scope.aFile = {}; $scope.aSource = {}; $scope.datafile = {}; $scope.showFileForm = false;
                                    $scope.fullSenfileIsUploading = false;
                                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file: " + errorResponse.headers(["usgswim-messages"]));
                                    else toastr.error("Error creating file: " + errorResponse.statusText);
                                });
                            }, function (errorResponse) {
                                $scope.fullSenfileIsUploading = false;
                                if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file's data file: " + errorResponse.headers(["usgswim-messages"]));
                                else toastr.error("Error creating file's data file: " + errorResponse.statusText);
                            });//end datafile.save()
                        } else {
                            //it's not a data file, so do the source
                            var theSource = { source_name: $scope.aSource.FULLname, agency_id: $scope.aSource.agency_id };
                            SOURCE.save(theSource).$promise.then(function (response) {
                                //then POST fileParts (Services populate PATH)
                                var fileParts = {
                                    FileEntity: {
                                        filetype_id: $scope.aFile.filetype_id,
                                        name: $scope.aFile.File.name,
                                        file_date: $scope.aFile.file_date,
                                        photo_date: $scope.aFile.photo_date,
                                        description: $scope.aFile.description,
                                        site_id: $scope.thisSensorSite.site_id,
                                        source_id: response.source_id,
                                        photo_direction: $scope.aFile.photo_direction,
                                        latitude_dd: $scope.aFile.latitude_dd,
                                        longitude_dd: $scope.aFile.longitude_dd,
                                        instrument_id: thisSensor.instrument_id
                                    },
                                    File: $scope.aFile.File
                                };
                                //need to put the fileParts into correct format for post
                                var fd = new FormData();
                                fd.append("FileEntity", JSON.stringify(fileParts.FileEntity));
                                fd.append("File", fileParts.File);
                                //now POST it (fileparts)
                                FILE.uploadFile(fd).$promise.then(function (fresponse) {
                                    toastr.success("File Uploaded");
                                    fresponse.fileBelongsTo = "Sensor File";
                                    $scope.sensorFiles.push(fresponse);
                                    $scope.allSFiles.push(fresponse);
                                    Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                    if (fresponse.filetype_id === 1) $scope.sensImageFiles.push(fresponse);
                                    $scope.showFileForm = false; $scope.fullSenfileIsUploading = false;
                                }, function (errorResponse) {
                                    $scope.fullSenfileIsUploading = false;
                                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file: " + errorResponse.headers(["usgswim-messages"]));
                                    else toastr.error("Error creating file: " + errorResponse.statusText);
                                });
                            }, function (errorResponse) {
                                $scope.fullSenfileIsUploading = false;
                                if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating source: " + errorResponse.headers(["usgswim-messages"]));
                                else toastr.error("Error creating source: " + errorResponse.statusText);
                            });//end source.save()
                        }//end if source
                    }//end valid
                } else {
                    alert("You need to choose a file first");
                }
            };//end create()

            //update this file
            $scope.saveFile = function (valid) {
                if ($scope.aFile.filetype_id == 2) {
                    //make sure end date is after start date
                    var s = $scope.datafile.good_start;//need to get dep status date in same format as retrieved to compare
                    var e = $scope.datafile.good_end; //stupid comma in there making it not the same
                    if (new Date(e) < new Date(s)) {
                        valid = false;
                        var fixDate = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>The good end date must be after the good start date.</p></div>' +
                                '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                $scope.ok = function () {
                                    $uibModalInstance.close();
                                };
                            }],
                            size: 'sm'
                        });
                        fixDate.result.then(function () {
                            valid = false;
                        });
                    }
                }
                if (valid) {
                    $scope.fullSenfileIsUploading = true;
                    //put source or datafile, put file
                    var whatkind = $scope.aFile.fileBelongsTo;
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    if ($scope.datafile.data_file_id !== undefined) {
                        //has DATA_FILE
                        //check timezone and make sure date stays utc
                        if ($scope.datafile.time_zone == "UTC") {
                            // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                            var enteredUtcStartDateTime = $scope.datafile.good_start;
                            enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                            var enteredUtcEndDateTime = $scope.datafile.good_end;
                            enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                            // Cloning date and changing the timezone
                            var correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                            correctedutcStartDateTime = correctedutcStartDateTime.tz('Etc/GMT', true).format();

                            var correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                            correctedutcEndDateTime = correctedutcEndDateTime.tz('Etc/GMT', true).format();

                            // formatting in UTC
                            var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                            var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        }
                        if ($scope.datafile.time_zone == "EST") {
                            // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                            var enteredUtcStartDateTime = $scope.datafile.good_start;
                            enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                            var enteredUtcEndDateTime = $scope.datafile.good_end;
                            enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                            var isaylightSavings = enteredDate._i.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    // Cloning date and changing the timezone
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();
                                }

                            // formatting in UTC
                            var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                            var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        } if ($scope.datafile.time_zone == "PST") {
                            // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                            var enteredUtcStartDateTime = $scope.datafile.good_start;
                            enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                            var enteredUtcEndDateTime = $scope.datafile.good_end;
                            enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                            var isaylightSavings = enteredDate._i.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    // Cloning date and changing the timezone
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                     correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();
                                }
                            // formatting in UTC
                            var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                            var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        } if ($scope.datafile.time_zone == "CST") {
                            // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                            var enteredUtcStartDateTime = $scope.datafile.good_start;
                            enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                            var enteredUtcEndDateTime = $scope.datafile.good_end;
                            enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                            var isaylightSavings = enteredDate._i.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();
                                }
                            // formatting in UTC
                            var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                            var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        } if ($scope.datafile.time_zone == "MST") {
                            // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                            var enteredUtcStartDateTime = $scope.datafile.good_start;
                            enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                            var enteredUtcEndDateTime = $scope.datafile.good_end;
                            enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                            var isaylightSavings = enteredDate._i.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                     correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();
                                }
                            // formatting in UTC
                            var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                            var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        } if ($scope.datafile.time_zone == "PDT") {
                            // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                            var enteredUtcStartDateTime = $scope.datafile.good_start;
                            enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                            var enteredUtcEndDateTime = $scope.datafile.good_end;
                            enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                            var isaylightSavings = enteredDate._i.toString();
                            var correctedutcStartDateTime;
                            var correctedutcEndDateTime;

                            if (isaylightSavings.indexOf('Daylight') >= 0) {

                                correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();

                            }

                            if (isaylightSavings.indexOf('Standard') >= 0) {
                                correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                correctedutcStartDateTime.subract(1, 'hours');
                                correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                correctedutcEndDateTime.subract(1, 'hours');
                                correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();
                            }
                            // formatting in UTC
                            var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                            var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        } if ($scope.datafile.time_zone == "EDT") {
                            // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                            var enteredUtcStartDateTime = $scope.datafile.good_start;
                            enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                            var enteredUtcEndDateTime = $scope.datafile.good_end;
                            enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                            var isaylightSavings = enteredDate._i.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();
                                }
                            // formatting in UTC
                            var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                            var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        } if ($scope.datafile.time_zone == "CDT") {
                            // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                            var enteredUtcStartDateTime = $scope.datafile.good_start;
                            enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                            var enteredUtcEndDateTime = $scope.datafile.good_end;
                            enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                            var isaylightSavings = enteredDate._i.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();
                                }
                            // formatting in UTC
                            var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                            var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        } if ($scope.datafile.time_zone == "MDT") {
                            // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                            var enteredUtcStartDateTime = $scope.datafile.good_start;
                            enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                            var enteredUtcEndDateTime = $scope.datafile.good_end;
                            enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                            var isaylightSavings = enteredDate._i.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();
                                }
                            // formatting in UTC
                            var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                            var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        }
                        ////
                        /* if ($scope.datafile.time_zone != "UTC") {
                            //convert it
                            var utcStartDateTime = new Date($scope.datafile.good_start).toUTCString();
                            var utcEndDateTime = new Date($scope.datafile.good_end).toUTCString();
                            $scope.datafile.good_start = utcStartDateTime;
                            $scope.datafile.good_end = utcEndDateTime;
                            $scope.datafile.time_zone = 'UTC';
                        } */ else {
                            //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                            var si = $scope.datafile.good_start.toString().indexOf('GMT') + 3;
                            var ei = $scope.datafile.good_end.toString().indexOf('GMT') + 3;
                            $scope.datafile.good_start = $scope.datafile.good_start.toString().substring(0, si);
                            $scope.datafile.good_end = $scope.datafile.good_end.toString().substring(0, ei);
                        }
                        DATA_FILE.update({ id: $scope.datafile.data_file_id }, $scope.datafile).$promise.then(function () {
                            FILE.update({ id: $scope.aFile.file_id }, $scope.aFile).$promise.then(function (fileResponse) {
                                toastr.success("File Updated");
                                fileResponse.fileBelongsTo = "DataFile File";
                                $scope.sensorFiles[$scope.existFileIndex] = fileResponse;
                                $scope.allSFiles[$scope.allSFileIndex] = fileResponse;
                                Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                $scope.showFileForm = false; $scope.fullSenfileIsUploading = false;
                            }, function (errorResponse) {
                                $scope.fullSenfileIsUploading = false;
                                if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving file: " + errorResponse.headers(["usgswim-messages"]));
                                else toastr.error("Error saving file: " + errorResponse.statusText);
                            });
                        }, function (errorResponse) {
                            $scope.fullSenfileIsUploading = false; //Loading...
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving file's data file: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error saving file's data file: " + errorResponse.statusText);
                        });
                    } else {
                        //has SOURCE
                        // post again (if no change, will return existing one. if edited, will create a new one --instead of editing all files that use this source)
                        var theSource = { source_name: $scope.aSource.FULLname, agency_id: $scope.aSource.agency_id };
                        SOURCE.save(theSource).$promise.then(function (response) {
                            $scope.aFile.source_id = response.source_id;
                            FILE.update({ id: $scope.aFile.file_id }, $scope.aFile).$promise.then(function (fileResponse) {
                                toastr.success("File Updated");
                                fileResponse.fileBelongsTo = "Sensor File";
                                $scope.sensorFiles[$scope.existFileIndex] = fileResponse;
                                $scope.allSFiles[$scope.allSFileIndex] = fileResponse;
                                Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                $scope.showFileForm = false; $scope.fullSenfileIsUploading = false;
                            }, function (errorResponse) {
                                $scope.fullSenfileIsUploading = false;
                                if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving file: " + errorResponse.headers(["usgswim-messages"]));
                                else toastr.error("Error saving file: " + errorResponse.statusText);
                            });
                        }, function (errorResponse) {
                            $scope.fullSenfileIsUploading = false; //Loading...
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving source: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error saving source: " + errorResponse.statusText);
                        });
                    }
                }//end valid
            };//end save()

            //delete this file
            $scope.deleteFile = function () {
                var DeleteModalInstance = $uibModal.open({
                    backdrop: 'static',
                    keyboard: false,
                    templateUrl: 'removemodal.html',
                    controller: 'ConfirmModalCtrl',
                    size: 'sm',
                    resolve: {
                        nameToRemove: function () {
                            return $scope.aFile;
                        },
                        what: function () {
                            return "File";
                        }
                    }
                });

                DeleteModalInstance.result.then(function (fileToRemove) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    FILE.delete({ id: fileToRemove.file_id }).$promise.then(function () {
                        toastr.success("File Removed");
                        $scope.sensorFiles.splice($scope.existFileIndex, 1);
                        $scope.allSFiles.splice($scope.allSFileIndex, 1);
                        $scope.sensImageFiles.splice($scope.existIMGFileIndex, 1);
                        Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                        $scope.showFileForm = false;
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error deleting file: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error deleting file: " + errorResponse.statusText);
                    });
                });//end DeleteModal.result.then
            };//end delete()

            $scope.cancelFile = function () {
                $scope.aFile = {};
                $scope.aSource = {};
                $scope.datafile = {};
                $scope.showFileForm = false;
                $scope.showProcessing = false;
                $scope.stormSection = false; // in case they clicked run script
                $scope.eventDataFiles = [];
                $scope.is4Hz = { selected: false };
                $scope.daylightSavingsStorm = { selected: false };
                $scope.daylightSavingsAir = { selected: false };
            };

            //approve this datafile (if admin or manager)
            $scope.approveDF = function () {
                //this is valid, show modal to confirm they want to approve it
                var thisDF = $scope.datafile;
                var approveModal = $uibModal.open({
                    template: "<div class='modal-header'><h3 class='modal-title'>Approve Data File</h3></div>" +
                        "<div class='modal-body'><p>Are you ready to approve this Data File?</p></div>" +
                        "<div class='modal-footer'><button class='btn btn-primary' ng-click='approveIt()'>Approve</button><button class='btn btn-warning' ng-click='cancel()'>Cancel</button></div>",
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                        $scope.approveIt = function () {
                            //delete the site and all things 
                            $uibModalInstance.close(thisDF);
                        };
                    }],
                    size: 'sm'
                });
                approveModal.result.then(function (df) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    DATA_FILE.approveDF({ id: df.data_file_id }).$promise.then(function (approvalResponse) {
                        df.approval_id = approvalResponse.approval_id;
                        $scope.datafile = df;
                        toastr.success("Data File Approved");
                        $scope.ApprovalInfo.approvalDate = new Date(approvalResponse.approval_date); //include note that it's displayed in their local time but stored in UTC
                        $scope.ApprovalInfo.Member = allMembers.filter(function (amem) { return amem.member_id == approvalResponse.member_id; })[0];
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error approving data file: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error approving data file: " + errorResponse.statusText);
                    });
                });//end modal
            };

            //approve this hwm (if admin or manager)
            $scope.unApproveDF = function () {
                //this is valid, show modal to confirm they want to approve it
                var thisDF = $scope.datafile;
                var unapproveModal = $uibModal.open({
                    template: "<div class='modal-header'><h3 class='modal-title'>Remove Approval</h3></div>" +
                        "<div class='modal-body'><p>Are you sure you wan to unapprove this Data File?</p></div>" +
                        "<div class='modal-footer'><button class='btn btn-primary' ng-click='unApproveIt()'>Unapprove</button><button class='btn btn-warning' ng-click='cancel()'>Cancel</button></div>",
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                        $scope.unApproveIt = function () {
                            //delete the site and all things 
                            $uibModalInstance.close(thisDF);
                        };
                    }],
                    size: 'sm'
                });
                unapproveModal.result.then(function (df) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    DATA_FILE.unApproveDF({ id: df.data_file_id }).$promise.then(function () {
                        df.approval_id = null;
                        $scope.datafile = df;
                        toastr.success("Data File Unapproved");
                        $scope.ApprovalInfo = {};
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error unapproving data file: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error unapproving data file: " + errorResponse.statusText);
                    });
                });//end modal
            };

            $scope.showdlSection = function () {
                $scope.dl.showdlSection = true;
            }

            // this is a pressure transducer sensor's data file, run air script using the data file id
            $scope.runAirScript = function () {
                // ensure the air sensor has a tapedown with the sensor_elevation on both dep and retrieved
                if ($scope.DeployedSensorStat.sensor_elevation !== undefined && $scope.RetrievedSensorStat.sensor_elevation !== undefined) {
                    if ($scope.aFile.script_parent == 'true') {
                        // show modal asking if they want to delete all the processed files
                        var rerunModal = $uibModal.open({
                            backdrop: 'static',
                            keyboard: false,
                            template: '<div class="modal-header"><h3 class="modal-title">Warning</h3></div>' +
                                '<div class="modal-body"><p>The Air Script has already been processed for this sensor data file. Would you like to delete the output files and rerun the script?</p>' +
                                '<div class="modal-footer"><button class="btn btn-warning" ng-enter="no()" ng-click="no()">Cancel</button><button class="btn btn-primary" ng-enter="yes()" ng-click="yes()">Rerun Script</button></div>',
                            controller: ['$scope', '$uibModalInstance', 'theFile', function ($scope, $uibModalInstance, theFile) {
                                $scope.no = function () {
                                    $uibModalInstance.dismiss();
                                };
                                $scope.yes = function () {
                                    $uibModalInstance.close(theFile);
                                };
                            }],
                            size: 'sm',
                            resolve: {
                                theFile: function () {
                                    return $scope.aFile;
                                }
                            }
                        });
                        rerunModal.result.then(function (afile) {
                            $scope.showProcessing = true;
                            $scope.dl.showdlSection = false;
                            //delete all the output files that have this file_id as their 'script_parent' value
                            $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                            var processedFileCount = $scope.sensorFiles.filter(function (f) { return f.script_parent == afile.file_id.toString(); });
                            var matchCnt = 0;
                            if (processedFileCount == 0) {
                                //all done, run it again now
                                DATA_FILE.runAirScript({ airDFID: afile.data_file_id, daylightSavings: $scope.daylightSavingsAir.selected, username: $cookies.get('STNUsername') }).$promise.then(function () {
                                    $scope.showProcessing = false;
                                }, function error(errorResponse) {
                                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error running Air Script: " + errorResponse.headers(["usgswim-messages"]));
                                    else toastr.error("Error running Air Script: " + errorResponse.statusText);
                                });
                                Site_Script.setIsScriptRunning("true"); //tell site.ctrl to show toastr notification
                                $scope.cancelFile();
                            }
                            $scope.sensorFiles.forEach(function (f) {
                                if (f.script_parent == afile.file_id.toString()) {
                                    FILE.delete({ id: f.file_id }).$promise.then(function () {
                                        matchCnt++;
                                        $scope.sensorFiles.splice($scope.existFileIndex, 1);
                                        $scope.allSFiles.splice($scope.allSFileIndex, 1);
                                        $scope.sensImageFiles.splice($scope.existIMGFileIndex, 1);
                                        Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                        if (matchCnt == processedFileCount.length) {
                                            //all done, run it again now
                                            DATA_FILE.runAirScript({ airDFID: afile.data_file_id, daylightSavings: $scope.daylightSavingsAir.selected, username: $cookies.get('STNUsername') }).$promise.then(function () {
                                                $scope.showProcessing = false;
                                            }, function error(errorResponse) {
                                                if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error running Air Script: " + errorResponse.headers(["usgswim-messages"]));
                                                else toastr.error("Error running Air Script: " + errorResponse.statusText);
                                            });
                                            Site_Script.setIsScriptRunning("true"); //tell site.ctrl to show toastr notification
                                            $scope.cancelFile();
                                        }
                                    }, function error(errorResponse) {
                                        toastr.error("Error deleting output file: " + errorResponse.statusText);
                                    });
                                }
                            }); //end foreach                                
                        });//end rerunModal.result.then
                    } else {
                        // script_parent is not true, never been run before
                        $scope.dl.showdlSection = false;
                        $scope.showProcessing = true;
                        DATA_FILE.runAirScript({ airDFID: $scope.datafile.data_file_id, daylightSavings: $scope.daylightSavingsAir.selected, username: $cookies.get('STNUsername') }).$promise.then(function () {
                            $scope.showProcessing = false;
                        }, function error(errorResponse) {
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error running Air Script: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error running Air Script: " + errorResponse.statusText);
                        });
                        Site_Script.setIsScriptRunning("true"); //tell site.ctrl to show toastr notification
                        $scope.cancelFile();
                    }
                } else {
                    var missingSeaElev = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>This Pressure Transducer Sensor does not have a sensor elevation.</p>' +
                            '<p>Please update the sensor, providing a sensor elevation for both the deployed section and retrieved section. This is required for the script.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                }
            };

            function calcDistance(lat1, lon1) {
                // http://www.geodatasource.com/developers/javascript
                var radlat1 = Math.PI * lat1 / 180;
                var radlat2 = Math.PI * $scope.thisSensorSite.latitude_dd / 180;
                var theta = lon1 - $scope.thisSensorSite.longitude_dd;
                var radtheta = Math.PI * theta / 180;
                var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                dist = Math.acos(dist);
                dist = dist * 180 / Math.PI;
                dist = dist * 60 * 1.1515; // miles
                return dist;
            }

            $scope.showStormSection = function () {
                $scope.stormSection = true;
                var parentFileName = "";
                angular.forEach(allEventDataFiles, function (df) {
                    df.selected = false;
                    df.distance = calcDistance(df.latitude_dd, df.longitude_dd);
                    if (df.script_parent === undefined || df.script_parent == "true")
                        $scope.eventDataFiles.push(df);
                });
                // now sort by distance by default
                $scope.eventDataFiles.sort(function (a, b) {
                    return parseFloat(a.distance) - parseFloat(b.distance);
                });
            };

            
            // add PAGINATION stuff 
            // change sorting order
            $scope.sort_by = function (newSortingOrder) {
                if ($scope.sortingOrder == newSortingOrder) {
                    $scope.reverse = !$scope.reverse;
                }
                $scope.sortingOrder = newSortingOrder;
                // icon setup
                $('th i').each(function () {
                    // icon reset
                    $(this).removeClass().addClass('glyphicon glyphicon-sort');
                });
                if ($scope.reverse) {
                    $('th.' + newSortingOrder + ' i').removeClass().addClass('glyphicon glyphicon-chevron-up');
                } else {
                    $('th.' + newSortingOrder + ' i').removeClass().addClass('glyphicon glyphicon-chevron-down');
                }
            };

            $scope.pagination = {
                currentPage: 1,
                maxPaginationSize: 200
            };

            $scope.itemsPerPage = 10;
            // update the beginning and end points for shown people
            // this will be called when the user changes page in the pagination bar
            $scope.updatePageIndexes = function (a) {
                console.log('Page changed to: ' + $scope.pagination.currentPage);
                $scope.firstIndex = ($scope.pagination.currentPage - 1) * $scope.itemsPerPage;
                $scope.lastIndex = $scope.pagination.currentPage * $scope.itemsPerPage;
            };
            $scope.updatePageIndexes();

            //end PAGINATION stuff 

            $scope.updateChosenAirRadio = function (dfile) {
                for (var i = 0; i < $scope.eventDataFiles.length; i++) {
                    if (dfile.data_file_id != $scope.eventDataFiles[i].data_file_id)
                        $scope.eventDataFiles[i].selected = 'false';
                }
            };

            var runTheStormScript = function (airDF) {
                INSTRUMENT.getFullInstrument({ id: airDF.instrument_id }).$promise.then(function (airSensor) {
                    /* Why are we doing this? var instrumentstats */
                    var instrumentStats = airSensor.instrument_status;
                    var waterDF = $scope.datafile.data_file_id;
                    var hertzBool = $scope.is4Hz.selected;
                    var daylightBool = $scope.daylightSavingsStorm.selected;
                    // run the script if airDF and waterDF are present                    
                    DATA_FILE.runStormScript({ seaDFID: waterDF, airDFID: airDF.data_file_id, hertz: hertzBool, daylightSavings: daylightBool, username: $cookies.get('STNUsername') }).$promise.then(function () {
                        var allDone = true;
                    }, function error(errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error running Air Script: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error running Air Script: " + errorResponse.statusText);
                    });
                    Site_Script.setIsScriptRunning("true"); //tell site.ctrl to show toastr notification
                    $scope.cancelFile();
                }, function (error) {
                    toastr.error("Error retrieving Air Sensor: " + error.statusText);
                });// end getFullInstrument
            };

            // this is a water sensor's data file, run storm script using air and water data file ids           
            $scope.runStormScript = function () {
                var airDF = $scope.eventDataFiles.filter(function (d) { return d.selected == "true"; })[0];
                if (airDF !== undefined) {
                    // make sure they added a tapedown with the required fields for the script to run
                    // required => sea dep and retr status: sensor_elevation && sea dep and retr status: gs_elevation                    
                    var waterFile = $scope.sensorFiles.filter(function (f) { return f.data_file_id == $scope.datafile.data_file_id; })[0];
                    var watAirIDS = waterFile.file_id + "_" + airDF.file_id;
                    var alreadyRan = false;
                    //has script been ran already with this water/air file combo?
                    $scope.sensorFiles.forEach(function (sensFile) {
                        if (sensFile.script_parent == watAirIDS)
                            alreadyRan = true;
                    });
                    if (alreadyRan) {
                        //already ran. show modal stating the script has already been run with this                            
                        var rerunStormModal = $uibModal.open({
                            backdrop: 'static',
                            keyboard: false,
                            template: '<div class="modal-header"><h3 class="modal-title">Warning</h3></div>' +
                                '<div class="modal-body"><p>The Storm Script has already been processed for this sensor data file with this air data file. Would you like to delete the output files and rerun the script?</p>' +
                                '<div class="modal-footer"><button class="btn btn-warning" ng-enter="no()" ng-click="no()">Cancel</button><button class="btn btn-primary" ng-enter="yes()" ng-click="yes()">Rerun Script</button></div>',
                            controller: ['$scope', '$uibModalInstance', 'theAirFile', 'theWaterFile', function ($scope, $uibModalInstance, theAirFile, theWaterFile) {
                                $scope.no = function () {
                                    $uibModalInstance.dismiss();
                                };
                                $scope.yes = function () {
                                    var filesArray = [theAirFile, theWaterFile];
                                    $uibModalInstance.close(filesArray);
                                };
                            }],
                            size: 'sm',
                            resolve: {
                                theAirFile: function () {
                                    return airDF;
                                },
                                theWaterFile: function () {
                                    return waterFile;
                                }
                            }
                        });
                        rerunStormModal.result.then(function (bothFiles) {
                            $scope.showProcessing = true;
                            //delete all the output files that have this file_id as their 'script_parent' value
                            $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                            var processedFileCount = $scope.sensorFiles.filter(function (f) { return f.script_parent == bothFiles[1].file_id.toString() + "_" + bothFiles[0].file_id.toString(); });
                            var matchCnt = 0;
                            $scope.sensorFiles.forEach(function (f) {
                                if (f.script_parent == bothFiles[1].file_id.toString() + "_" + bothFiles[0].file_id.toString()) {
                                    var deleteThis = f.file_id;
                                    FILE.delete({ id: f.file_id }).$promise.then(function () {
                                        matchCnt++;
                                        $scope.sensorFiles.splice($scope.existFileIndex, 1);
                                        $scope.allSFiles.splice($scope.allSFileIndex, 1);
                                        $scope.sensImageFiles.splice($scope.existIMGFileIndex, 1);
                                        Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                        if (matchCnt == processedFileCount.length) {
                                            runTheStormScript(airDF);
                                        }
                                    }, function error(errorResponse) {
                                        toastr.error("Error deleting output file: " + errorResponse.statusText);
                                    });
                                }
                            }); //end foreach                                
                        });//end rerunModal.result.then
                    }
                    else {
                        runTheStormScript(airDF);
                    }// end if sea dep/retr has sensor_elevation && gs_elevation

                } // end if airDF != undefined
                else {
                    var missingInfo = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>Please choose an air data file to use for the storm script.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                } // end else (airDF is undefined)
            }; // end runStormScript()

            $scope.chopperResponse2 = false; //set to true and show highchart with chopper results
            $scope.chopperResponse2Keys = [];
            $scope.chartOptions2 = {};
            $scope.chartData = [];
            Array.prototype.zip = function (arr) {
                return this.map(function (e, i) {
                    return [e, arr[i]];
                })
            };

            $scope.daylightSavingsChop = { selected: false };
            $scope.runChopper = function () {
                $scope.chartData = [];
                $scope.chartOptions2 = {};
                $scope.chopperResponse2 = false;
                $scope.chopperResponse2Keys = [];
                if ($scope.chartObj) {
                    $scope.chartObj.xAxis[0].removePlotLine("start");
                    $scope.chartObj.xAxis[0].removePlotLine("end");
                }
                if ($scope.aFile.File !== undefined) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    var fileParts = {
                        FileEntity: {
                            site_id: $scope.thisSensorSite.site_id,
                            instrument_id: thisSensor.instrument_id,
                            /* description: $scope.daylightSavingsChop.selected */ // holder of the daylight savings true/false value. Services parsed it out.
                        },
                        File: $scope.aFile.File
                    };
                    //need to put the fileParts into correct format for send
                    var fd = new FormData();
                    fd.append("FileEntity", JSON.stringify(fileParts.FileEntity));
                    fd.append("File", fileParts.File);
                    $scope.smlallLoaderGo = true;
                    DATA_FILE.runChopperScript(fd).$promise.then(function (response) {
                        $scope.smlallLoaderGo = false;
                        $scope.chopperResponse2Keys = Object.keys(response);
                        if (response.Error) {
                            var errorMessage = response.Error;
                            var failedChopper = $uibModal.open({
                                template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                    '<div class="modal-body"><p>There was an error running the chopper.</p><p>Error: {{errorMessage}}</p></div>' +
                                    '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                                controller: ['$scope', '$uibModalInstance', 'message', function ($scope, $uibModalInstance, message) {
                                    $scope.errorMessage = message;
                                    $scope.ok = function () {
                                        $uibModalInstance.dismiss();
                                    };
                                }],
                                resolve: {
                                    message: function () {
                                        return errorMessage;
                                    }
                                },
                                size: 'sm'
                            });
                        } else {
                            $scope.chartData = response.time.zip(response.pressure);
                            $scope.chartOptions2 = {
                                chart: {
                                    events: {
                                        load: function () {
                                            $scope.chartObj = this;
                                        }
                                    },
                                    zoomType: 'x',
                                    panning: true,
                                    panKey: 'shift'
                                },
                                boostThreshold: 2000,
                                plotOptions: {
                                    series: {
                                        events: {
                                            click: function (event) {
                                                var pointClick = $uibModal.open({
                                                    template: '<div class="modal-header"><h3 class="modal-title"></h3></div>' +
                                                        '<div class="modal-body"><p>Would you like to set this ({{thisDate}}) as:</p>' +
                                                        '<div style="text-align:center;"><span class="radio-inline"><input type="radio" name="whichDate" ng-model="whichDate" value="start" />Good Start Date</span>' +
                                                        '<span class="radio-inline"><input type="radio" name="whichDate" ng-model="whichDate" value="end" />Good End Date</span></div>' +
                                                        '</div>' +
                                                        '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button>' +
                                                        '<button class="btn btn-primary" ng-enter="cancel()" ng-click="cancel()">Cancel</button></div>',
                                                    controller: ['$scope', '$uibModalInstance', 'chosenDate', 'xEvent', function ($scope, $uibModalInstance, chosenDate, xEvent) {
                                                        $scope.ok = function () {
                                                            if ($scope.whichDate == "") alert("No Date chosen");
                                                            else {
                                                                var parts = [$scope.whichDate, chosenDate, xEvent];
                                                                $uibModalInstance.close(parts);
                                                            };
                                                        };
                                                        $scope.cancel = function () {
                                                            $uibModalInstance.dismiss();
                                                        }
                                                        $scope.whichDate = "";
                                                        $scope.thisDate = new Date(chosenDate);
                                                    }],
                                                    resolve: {
                                                        chosenDate: event.point.category,
                                                        xEvent: event.chartX
                                                    },
                                                    size: 'sm'
                                                });
                                                pointClick.result.then(function (parts) {
                                                    var chart = $scope.chartObj.xAxis[0];
                                                    // check if there's already a plotline with this id and remove it if so
                                                    chart.removePlotLine(parts[0]);
                                                    // add the plot line to visually see where they added
                                                    chart.addPlotLine({
                                                        value: chart.toValue(parts[2]),
                                                        color: parts[0] == "start" ? '#00ff00' : '#ff0000',
                                                        width: 2,
                                                        id: parts[0],
                                                        zIndex: 19999,
                                                        label: { text: parts[0] }
                                                    });
                                                    var theDate = new Date(parts[1]).toISOString();
                                                    var d = getDateTimeParts(theDate);
                                                    if (parts[0] == "start") $scope.datafile.good_start = d;
                                                    else $scope.datafile.good_end = d;
                                                });
                                            }
                                        },
                                        allowPointSelect: true,
                                        cursor: 'pointer',
                                        point: {
                                            events: {
                                                mouseOver: function () {
                                                    if (this.series.halo) {
                                                        this.series.halo.attr({ 'class': 'highcharts-tracker' }).toFront();
                                                    }
                                                }
                                            }
                                        },
                                        marker: {
                                            enabled: false // turn dots off
                                        }
                                    }
                                },
                                title: {
                                    text: 'Preview of Pressure Data'
                                },
                                subtitle: {
                                    text: 'Click and drag to zoom in. Hold down shift key to pan. To select Good Start/End Date, click point on line.'
                                },
                                xAxis: {
                                    title: {
                                        text: $scope.chopperResponse2Keys[1]
                                    },
                                    type: 'datetime',
                                    dateTimeLabelFormats: {
                                        second: '%Y-%m-%d<br/>%H:%M:%S',
                                        minute: '%Y-%m-%d<br/>%H:%M',
                                        hour: '%Y-%m-%d<br/>%H:%M',
                                        day: '%Y<br/>%m-%d',
                                        week: '%Y<br/>%m-%d',
                                        month: '%Y-%m',
                                        year: '%Y'
                                    },
                                    offset: 10
                                },
                                yAxis: {
                                    title: {
                                        text: $scope.chopperResponse2Keys[0]
                                    },
                                    labels: {
                                        format: '{value} psi'
                                    },
                                    offset: 10
                                },
                                series: [{
                                    data: $scope.chartData,

                                }]
                            };
                            $scope.chopperResponse2 = true;
                        }
                    }, function (error) {
                        console.log(error);
                    });
                } else {
                    //the file wasn't there..
                    alert("You need to choose a file first");
                }
            };

            ///////////////////////////////////////////////////////////////////////
            // NWIS DATA_FILE
            if ($scope.sensorDataNWIS) {
                //FILE.VALIDATED being used to store 1 if this is an nwis file metadata link
                $scope.sensorNWISFiles = [];
                for (var ai = $scope.sensorFiles.length - 1; ai >= 0; ai--) {
                    if ($scope.sensorFiles[ai].is_nwis == 1) {
                        $scope.sensorNWISFiles.push($scope.sensorFiles[ai]);
                        $scope.sensorFiles.splice(ai, 1);
                    }
                }
            
                var dt = getTimeZoneStamp();
                $scope.NWISFile = {};
                $scope.NWISDF = {};
            }
            var getinitialtimepreviewNWIS = function () { 
                // getting the time initally set for peak date
                if ($scope.NWISDF.good_start != undefined) {
                    $scope.timePreviewStart = $scope.NWISDF.good_start;
                    $scope.timePreviewEnd = $scope.NWISDF.good_end;
                } else {
                    $scope.timePreviewStart = $scope.NWISDF.good_start;
                    $scope.timePreviewEnd = $scope.NWISDF.good_end;
                }

                //check and see if they are not using UTC
                if ($scope.NWISDF.time_zone == "UTC") {
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);

                    // Cloning date and changing the timezone
                    var correctedDateStart = enteredDateStart.clone();
                    var correctedDateEnd = enteredDateEnd.clone();
                    correctedDateStart = correctedDateStart.tz('Etc/GMT', true).format();
                    correctedDateEnd = correctedDateEnd.tz('Etc/GMT', true).format();

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                }
                if ($scope.NWISDF.time_zone == "EST") { // +5
                    // + 5
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.NWISDF.time_zone == "PST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);

                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
                    }
                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.NWISDF.time_zone == "CST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDatestart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.NWISDF.time_zone == "MST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDatestart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.NWISDF.time_zone == "PDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.NWISDF.time_zone == "EDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.NWISDF.time_zone == "CDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.NWISDF.time_zone == "MDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                }
                else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.timePreviewStart.toString().indexOf('GMT') + 3;
                    var d = $scope.timePreviewEnd.toString().indexOf('GMT') + 3;
                    $scope.timePreviewStart = $scope.timePreviewStart.toString().substring(0, i);
                    $scope.timePreviewEnd = $scope.timePreviewEnd.toString().substring(0, d);
                }

            };

            $scope.previewRETNWISTime = function () { 
                // getting the time initally set for peak date
                if ($scope.NWISDF.good_start != undefined) {
                    $scope.timePreviewStart = $scope.NWISDF.good_start;
                    $scope.timePreviewEnd = $scope.NWISDF.good_end;
                } else {
                    $scope.timePreviewStart = $scope.NWISDF.good_start;
                    $scope.timePreviewEnd = $scope.NWISDF.good_end;
                }

                //check and see if they are not using UTC
                if ($scope.NWISDF.time_zone == "UTC") {
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);

                    // Cloning date and changing the timezone
                    var correctedDateStart = enteredDateStart.clone();
                    var correctedDateEnd = enteredDateEnd.clone();
                    correctedDateStart = correctedDateStart.tz('Etc/GMT', true).format();
                    correctedDateEnd = correctedDateEnd.tz('Etc/GMT', true).format();

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                }
                if ($scope.NWISDF.time_zone == "EST") { // +5
                    // + 5
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.NWISDF.time_zone == "PST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);

                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
                    }
                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.NWISDF.time_zone == "CST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDatestart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.NWISDF.time_zone == "MST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDatestart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.NWISDF.time_zone == "PDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.NWISDF.time_zone == "EDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.NWISDF.time_zone == "CDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.NWISDF.time_zone == "MDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                }
                else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.timePreviewStart.toString().indexOf('GMT') + 3;
                    var d = $scope.timePreviewEnd.toString().indexOf('GMT') + 3;
                    $scope.timePreviewStart = $scope.timePreviewStart.toString().substring(0, i);
                    $scope.timePreviewEnd = $scope.timePreviewEnd.toString().substring(0, d);
                }

            };

            $scope.showNWISFile = function (f) {
                //want to add or edit file
                $scope.existFileIndex = -1;
                $scope.allSFileIndex = -1; //indexes for splice/change
                if (f !== 0) {
                    //edit NWIS file
                    $scope.existFileIndex = $scope.sensorNWISFiles.indexOf(f);
                    $scope.allSFileIndex = $scope.allSFiles.indexOf(f);
                    $scope.NWISFile = angular.copy(f);
                    $scope.NWISFile.file_date = new Date($scope.NWISFile.file_date); //date for validity of form on PUT
                    $scope.NWISFile.FileType = "Data";
                    DATA_FILE.query({ id: f.data_file_id }).$promise.then(function (df) {
                        $scope.NWISDF = df;
                        $scope.nwisProcessor = allMembers.filter(function (m) { return m.member_id == $scope.NWISDF.processor_id; })[0];
                        $scope.NWISDF.collect_date = new Date($scope.NWISDF.collect_date);
                        $scope.NWISDF.good_start = getDateTimeParts($scope.NWISDF.good_start);
                        $scope.NWISDF.good_end = getDateTimeParts($scope.NWISDF.good_end);
                        getinitialtimepreviewNWIS();
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting data file: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error getting data file: " + errorResponse.statusText);
                    });
                    //end existing file
                } else {
                    //creating a nwis file
                    $scope.NWISFile = {
                        file_date: new Date(),
                        filetype_id: 2,
                        name: 'https://waterdata.usgs.gov/nwis/uv?site_no=' + $scope.thisSensorSite.usgs_sid,  // if [fill in if not here.. TODO...&begin_date=20160413&end_date=20160419 (event start/end)
                        path: '<link>',
                        FileType: 'Data',
                        site_id: $scope.sensor.site_id,
                        data_file_id: 0,
                        instrument_id: $scope.sensor.instrument_id,
                        is_nwis: 1
                    };
                    $scope.NWISDF = {
                        processor_id: $cookies.get("mID"),
                        instrument_id: $scope.sensor.instrument_id,
                        collect_date: dt[0],
                        time_zone: dt[1],
                        good_start: new Date(),
                        good_end: new Date()
                    };
                    getinitialtimepreviewNWIS();
                    $scope.nwisProcessor = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];
                } //end new file
                $scope.showNWISFileForm = true;
            };
            var postApprovalForNWISfile = function (DFid) {
                DATA_FILE.approveNWISDF({ id: DFid }).$promise.then(function (approvalResponse) {
                    $scope.NWISFile.approval_id = approvalResponse.approval_id;
                }, function (errorResponse) {
                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error approving nwis data file: " + errorResponse.headers(["usgswim-messages"]));
                    else toastr.error("Error approving nwis data file: " + errorResponse.statusText);
                });
            };
            $scope.createNWISFile = function (valid) {
                //make sure end date is after start date
                var s = $scope.NWISDF.good_start;//need to get dep status date in same format as retrieved to compare
                var e = $scope.NWISDF.good_end; //stupid comma in there making it not the same
                if (new Date(e) < new Date(s)) {
                    valid = false;
                    var fixDate = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>The good end date must be after the good start date.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                    fixDate.result.then(function () {
                        valid = false;
                    });
                }
                if (valid) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //post datafile first to get or data_file_id
                    //determine timezone

                    //check and see if they are not using UTC
                    if ($scope.NWISDF.time_zone == "UTC") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        // Cloning date and changing the timezone
                        var correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                        correctedutcStartDateTime = correctedutcStartDateTime.tz('Etc/GMT', true).format();

                        var correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                        correctedutcEndDateTime = correctedutcEndDateTime.tz('Etc/GMT', true).format();

                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    }
                    if ($scope.NWISDF.time_zone == "EST") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings = enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    // Cloning date and changing the timezone
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "PST") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                            correctedutcStartDateTime.add(1, 'hours');
                            correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                            correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                            correctedutcEndDateTime.add(1, 'hours');
                            correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                             correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                            correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                            correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();
                        }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "CST") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings = enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "MST") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings = enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                     correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "PDT") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings = enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "EDT") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings = enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "CDT") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings = enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "MDT") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings = enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    }

                    /* if ($scope.NWISDF.time_zone != "UTC") {
                        //convert it
                        var utcStartDateTime = new Date($scope.NWISDF.good_start).toUTCString();
                        var utcEndDateTime = new Date($scope.NWISDF.good_end).toUTCString();
                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } 
                     */


                    else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        var si = $scope.NWISDF.good_start.toString().indexOf('GMT') + 3;
                        var ei = $scope.NWISDF.good_end.toString().indexOf('GMT') + 3;
                        $scope.NWISDF.good_start = $scope.NWISDF.good_start.toString().substring(0, si);
                        $scope.NWISDF.good_end = $scope.NWISDF.good_end.toString().substring(0, ei);
                    }
                    var datafileID = 0;
                    DATA_FILE.save($scope.NWISDF).$promise.then(function (NdfResponse) {
                        datafileID = NdfResponse.data_file_id;
                        //then POST fileParts (Services populate PATH)
                        $scope.NWISFile.data_file_id = NdfResponse.data_file_id;
                        postApprovalForNWISfile(NdfResponse.data_file_id); //process approval
                        //now POST File
                        FILE.save($scope.NWISFile).$promise.then(function (Fresponse) {
                            toastr.success("File Data saved");
                            Fresponse.fileBelongsTo = "DataFile File";
                            //$scope.sensorFiles.push(Fresponse);
                            $scope.sensorNWISFiles.push(Fresponse);
                            $scope.allSFiles.push(Fresponse);
                            Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard                            
                            $scope.showNWISFileForm = false;
                        }, function (errorResponse) {
                            // file did not get created, delete datafile
                            DATA_FILE.delete({ id: datafileID });
                            $scope.NWISFile = {}; $scope.NWISDF = {}; $scope.showNWISFileForm = false;
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error creating file: " + errorResponse.statusText);
                        });
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error creating file's data file: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error creating file's data file: " + errorResponse.statusText);
                    });//end datafile.save()
                }//end valid
            };// end create NWIS file
            //update this NWIS file
            $scope.saveNWISFile = function (valid) {
                //make sure end date is after start date
                var s = $scope.NWISDF.good_start;//need to get dep status date in same format as retrieved to compare
                var e = $scope.NWISDF.good_end; //stupid comma in there making it not the same
                if (new Date(e) < new Date(s)) {
                    valid = false;
                    var fixDate = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>The good end date must be after the good start date.</p></div>' +
                            '<div class="modal-footer"><button class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                    fixDate.result.then(function () {
                        valid = false;
                    });
                }
                if (valid) {
                    //put source or datafile, put file
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //check timezone and make sure date stays utc
                    if ($scope.NWISDF.time_zone == "UTC") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        // Cloning date and changing the timezone
                        var correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                        correctedutcStartDateTime = correctedutcStartDateTime.tz('Etc/GMT', true).format();

                        var correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                        correctedutcEndDateTime = correctedutcEndDateTime.tz('Etc/GMT', true).format();

                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    }
                    if ($scope.NWISDF.time_zone == "EST") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings = enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    // Cloning date and changing the timezone
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "PST") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        if (isaylightSavings.indexOf('Daylight') >= 0) {

                            correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                            correctedutcStartDateTime.add(1, 'hours');
                            correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                            correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                            correctedutcEndDateTime.add(1, 'hours');
                            correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();

                        }

                        if (isaylightSavings.indexOf('Standard') >= 0) {
                            // Cloning date and changing the timezone
                            correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                             correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                            correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                            correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();
                        }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "CST") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings = enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "MST") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings = enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.add(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.add(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                     correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "PDT") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings = enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Los_Angeles', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Los_Angeles', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "EDT") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings = enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/New_York', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/New_York', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "CDT") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings = enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Chicago', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Chicago', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } if ($scope.NWISDF.time_zone == "MDT") {
                        // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                        var enteredUtcStartDateTime = $scope.NWISDF.good_start;
                        enteredUtcStartDateTime = moment(enteredUtcStartDateTime);

                        var enteredUtcEndDateTime = $scope.NWISDF.good_end;
                        enteredUtcEndDateTime = moment(enteredUtcEndDateTime);

                        var isaylightSavings = enteredUtcEndDateTime._d.toString();
                                var correctedutcStartDateTime;
                                var correctedutcEndDateTime;

                                if (isaylightSavings.indexOf('Daylight') >= 0) {

                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();

                                }

                                if (isaylightSavings.indexOf('Standard') >= 0) {
                                    correctedutcStartDateTime = enteredUtcStartDateTime.clone();
                                    correctedutcStartDateTime.subract(1, 'hours');
                                    correctedutcStartDateTime = correctedutcStartDateTime.tz('America/Denver', true).format();

                                    correctedutcEndDateTime = enteredUtcEndDateTime.clone();
                                    correctedutcEndDateTime.subract(1, 'hours');
                                    correctedutcEndDateTime = correctedutcEndDateTime.tz('America/Denver', true).format();
                                }
                        // formatting in UTC
                        var utcStartDateTime = moment.utc(correctedutcStartDateTime).toDate().toUTCString();
                        var utcEndDateTime = moment.utc(correctedutcEndDateTime).toDate().toUTCString();

                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    }
                    /* if ($scope.NWISDF.time_zone != "UTC") {
                        //convert it
                        var utcStartDateTime = new Date($scope.NWISDF.good_start).toUTCString();
                        var utcEndDateTime = new Date($scope.NWISDF.good_end).toUTCString();
                        $scope.NWISDF.good_start = utcStartDateTime;
                        $scope.NWISDF.good_end = utcEndDateTime;
                        $scope.NWISDF.time_zone = 'UTC';
                    } */ else {
                        //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                        var si = $scope.NWISDF.good_start.toString().indexOf('GMT') + 3;
                        var ei = $scope.NWISDF.good_end.toString().indexOf('GMT') + 3;
                        $scope.NWISDF.good_start = $scope.NWISDF.good_start.toString().substring(0, si);
                        $scope.NWISDF.good_end = $scope.NWISDF.good_end.toString().substring(0, ei);
                    }
                    DATA_FILE.update({ id: $scope.NWISDF.data_file_id }, $scope.NWISDF).$promise.then(function () {
                        FILE.update({ id: $scope.NWISFile.file_id }, $scope.NWISFile).$promise.then(function (fileResponse) {
                            toastr.success("File Data Updated");
                            fileResponse.fileBelongsTo = "DataFile File";
                            $scope.sensorNWISFiles[$scope.existFileIndex] = fileResponse;
                            $scope.allSFiles[$scope.allSFileIndex] = fileResponse;
                            Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                            $scope.showNWISFileForm = false;
                        }, function (errorResponse) {
                            if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving nwis file: " + errorResponse.headers(["usgswim-messages"]));
                            else toastr.error("Error saving nwis file: " + errorResponse.statusText);
                        });
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error saving nwis data file: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error saving nwis data file: " + errorResponse.statusText);
                    });
                }//end valid
            };//end save()

            

            $scope.previewDataTimeDepFile = function () {

                // getting the time initally set for peak date
                if ($scope.datafile.good_start != undefined) {
                    $scope.timePreviewStart = $scope.datafile.good_start;
                    $scope.timePreviewEnd = $scope.datafile.good_end;
                } else {
                    $scope.timePreviewStart = $scope.datafile.good_start;
                    $scope.timePreviewEnd = $scope.datafile.good_end;
                }

                //check and see if they are not using UTC
                if ($scope.datafile.time_zone == "UTC") {
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);

                    // Cloning date and changing the timezone
                    var correctedDateStart = enteredDateStart.clone();
                    var correctedDateEnd = enteredDateEnd.clone();
                    correctedDateStart = correctedDateStart.tz('Etc/GMT', true).format();
                    correctedDateEnd = correctedDateEnd.tz('Etc/GMT', true).format();

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                }
                if ($scope.datafile.time_zone == "EST") { // +5
                    // + 5
                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "PST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);

                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
                    }
                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "CST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDatestart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "MST") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDatestart.add(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.add(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.datafile.time_zone == "PDT") {

                    // Date the user enters is in their computer's timezone, so we need to clone it and change the timezone. This way the values stay the same.
                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Los_Angeles', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Los_Angeles', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.datafile.time_zone == "EDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/New_York', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/New_York', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                } if ($scope.datafile.time_zone == "CDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Chicago', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Chicago', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;

                } if ($scope.datafile.time_zone == "MDT") {

                    var enteredDateStart = $scope.timePreviewStart;
                    var enteredDateEnd = $scope.timePreviewEnd;
                    enteredDateStart = moment(enteredDateStart);
                    enteredDateEnd = moment(enteredDateEnd);
                    
                    var isaylightSavings = enteredDateStart._d.toString();
                    var correctedDateStart;
                    var correctedDateEnd;

                    if (isaylightSavings.indexOf('Daylight') >= 0) {

                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();

                    }

                    if (isaylightSavings.indexOf('Standard') >= 0) {
                        // Cloning date and changing the timezone
                        correctedDateStart = enteredDateStart.clone();
                        correctedDateStart.subtract(1, 'hours');
                        correctedDateStart = correctedDateStart.tz('America/Denver', true).format();

                        correctedDateEnd = enteredDateEnd.clone();
                        correctedDateEnd.subtract(1, 'hours');
                        correctedDateEnd = correctedDateEnd.tz('America/Denver', true).format();
                    }

                    // formatting in UTC
                    var utcDateStart = moment.utc(correctedDateStart).toDate().toUTCString();
                    var utcDateEnd = moment.utc(correctedDateEnd).toDate().toUTCString();

                    $scope.timePreviewStart = utcDateStart;
                    $scope.timePreviewEnd = utcDateEnd;
                }
                else {
                    //make sure 'GMT' is tacked on so it doesn't try to add hrs to make the already utc a utc in db
                    var i = $scope.timePreviewStart.toString().indexOf('GMT') + 3;
                    var d = $scope.timePreviewEnd.toString().indexOf('GMT') + 3;
                    $scope.timePreviewStart = $scope.timePreviewStart.toString().substring(0, i);
                    $scope.timePreviewEnd = $scope.timePreviewEnd.toString().substring(0, d);
                }

            };

            

            //delete this file
            $scope.deleteNWISFile = function () {
                var DeleteModalInstance = $uibModal.open({
                    backdrop: 'static',
                    keyboard: false,
                    templateUrl: 'removemodal.html',
                    controller: 'ConfirmModalCtrl',
                    size: 'sm',
                    resolve: {
                        nameToRemove: function () {
                            return $scope.NWISFile;
                        },
                        what: function () {
                            return "File";
                        }
                    }
                });

                DeleteModalInstance.result.then(function (fileToRemove) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    FILE.delete({ id: fileToRemove.file_id }).$promise.then(function () {
                        toastr.success("File Removed");
                        $scope.sensorNWISFiles.splice($scope.existFileIndex, 1);
                        $scope.allSFiles.splice($scope.allSFileIndex, 1);
                        Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                        $scope.showNWISFileForm = false;
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error deleting file: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error deleting file: " + errorResponse.statusText);
                    });
                });//end DeleteModal.result.then
            };//end delete()

            $scope.cancelNWISFile = function () {
                $scope.NWISFile = {};
                $scope.NWISDF = {};
                $scope.showNWISFileForm = false;
            };

            $rootScope.stateIsLoading.showLoading = false;
        }]);//end fullSensorModalCtrl
})();