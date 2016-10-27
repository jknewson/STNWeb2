(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('fileCtrl', ['$scope', '$rootScope', '$cookies', '$location', '$state', '$http', 'SERVER_URL', 'FILE_STAMP', 'Site_Files', 'HWM_Service', 'Instrument_Service', '$uibModal', '$filter', '$timeout', 'thisSite', 'thisSiteFiles', 'allFileTypes', 'allAgencies', 'thisSiteSensors', 'thisSiteOPs', 'thisSiteHWMs', 'FILE', 'DATA_FILE', 'MEMBER', 'SOURCE',
        function ($scope, $rootScope, $cookies, $location, $state, $http, SERVER_URL,FILE_STAMP, Site_Files, HWM_Service, Instrument_Service, $uibModal, $filter, $timeout, thisSite, thisSiteFiles, allFileTypes, allAgencies, thisSiteSensors, thisSiteOPs, thisSiteHWMs, FILE, DATA_FILE, MEMBER, SOURCE) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                $scope.serverURL = SERVER_URL;
                $scope.stamp = FILE_STAMP.getStamp();
                $rootScope.$on('fileStampSet', function (event, st) {
                    $scope.stamp = st;
                });

                $scope.siteHWMs = thisSiteHWMs; //HWM_Service.getAllSiteHWMs(); //if create a new one, then add a file to it.. doesn't show in fileList because this doesn't have that new hwm yet..
                $scope.siteSensors = thisSiteSensors;
                //include if HWM, Instrument, Data File or OP File for each               
                for (var sf = 0; sf < thisSiteFiles.length; sf++) {
                    var whatKindaFile = '';
                    if (thisSiteFiles[sf].hwm_id > 0 && thisSiteFiles[sf].hwm_id !== null) {
                        whatKindaFile = "HWM File";
                    }
                    if (thisSiteFiles[sf].data_file_id > 0 && thisSiteFiles[sf].data_file_id !== null) {
                        whatKindaFile = "DataFile File";
                    }
                    if (thisSiteFiles[sf].instrument_id > 0 && thisSiteFiles[sf].instrument_id !== null) {
                        whatKindaFile = "Sensor File";
                        var thisIns = thisSiteSensors.filter(function (s) { return s.instrument_id == thisSiteFiles[sf].instrument_id; })[0];
                        thisSiteFiles[sf].typeName = thisIns.serial_number;
                    }
                    if (thisSiteFiles[sf].objective_point_id > 0 && thisSiteFiles[sf].objective_point_id !== null) {
                        whatKindaFile = "Objective Point File";
                        thisSiteFiles[sf].typeName = thisSiteOPs.filter(function (op) { return op.objective_point_id == thisSiteFiles[sf].objective_point_id; })[0].name;
                    }
                    if (whatKindaFile === '') whatKindaFile = "Site File";
                    thisSiteFiles[sf].fileBelongsTo = whatKindaFile;
                }
                Site_Files.setAllSiteFiles(thisSiteFiles);//, $scope.siteHWMs, $scope.siteSensors);
                $scope.SiteFiles = Site_Files.getAllSiteFiles();

                $scope.siteImageFiles = []; //holder of carousel images
                for (var s = 0; s < $scope.SiteFiles.length; s++) {
                    var extI = $scope.SiteFiles[s].name.indexOf(".");
                    var extString = $scope.SiteFiles[s].name.substring(extI + 1);
                    if (['jpg','JPG','jpeg','JPEG','png','PNG','gif','GIF'].indexOf(extString) > -1)
                        $scope.siteImageFiles.push($scope.SiteFiles[s]);
                }
                //if files are added/edited, deleted from other parts (objective Points, sensors, hwms), make sure if event is chosen to update siteFiles accordingly
                $scope.$on('siteFilesUpdated', function (event, sitefiles) {
                    $scope.siteHWMs = HWM_Service.getAllSiteHWMs(); $scope.siteSensors = Instrument_Service.getAllSiteSensors();
                    //now go about updating the FileList
                    $scope.SiteFiles = sitefiles.filter(function (h) { return h.fileBelongsTo == 'Site File' || h.fileBelongsTo == 'Objective Point File'; });  //keep all site and op files
                    angular.forEach($scope.SiteFiles, function (sf){
                        if (sf.fileBelongsTo == 'Objective Point File')
                            sf.typeName = thisSiteOPs.filter(function (op) { return op.objective_point_id == sf.objective_point_id; })[0].name;
                       
                            
                    });
                    var hwmFiles = sitefiles.filter(function (sfiles) { return sfiles.fileBelongsTo == 'HWM File'; });
                    var sensFiles = sitefiles.filter(function (sfi) { return sfi.instrument_id > 0 && sfi.instrument_id !== null; });
                    //only show files for this event (go through hwm files and match eventid
                    if ($cookies.get('SessionEventID') !== undefined) {
                        for (var Ehf = 0; Ehf < hwmFiles.length; Ehf++) {
                            for (var Ehwm = 0; Ehwm < $scope.siteHWMs.length; Ehwm++) {
                                if (hwmFiles[Ehf].hwm_id == $scope.siteHWMs[Ehwm].hwm_id && $scope.siteHWMs[Ehwm].event_id == $cookies.get('SessionEventID'))
                                    $scope.SiteFiles.push(hwmFiles[Ehf]);
                            }
                        }
                    } else {
                        for (var hf = 0; hf < hwmFiles.length; hf++) {
                            for (var hwm = 0; hwm < $scope.siteHWMs.length; hwm++) {
                                if (hwmFiles[hf].hwm_id == $scope.siteHWMs[hwm].hwm_id)
                                    $scope.SiteFiles.push(hwmFiles[hf]);
                            }
                        }
                    }
                    //only show files for this event (go through sensor files and match eventid
                    if ($cookies.get('SessionEventID') !== undefined) {
                        for (var Esf = 0; Esf < sensFiles.length; Esf++) {
                            for (var Einst = 0; Einst < $scope.siteSensors.length; Einst++) {
                                if (sensFiles[Esf].instrument_id == $scope.siteSensors[Einst].instrument_id && $scope.siteSensors[Einst].event_id == $cookies.get('SessionEventID')) {
                                    sensFiles[Esf].typeName = $scope.siteSensors[Einst].serial_number;
                                    $scope.SiteFiles.push(sensFiles[Esf]);
                                }
                            }
                        }
                    } else {
                        for (var sf = 0; sf < sensFiles.length; sf++) {
                            for (var inst = 0; inst < $scope.siteSensors.length; inst++) {
                                if (sensFiles[sf].instrument_id == $scope.siteSensors[inst].instrument_id) {
                                    sensFiles[sf].typeName = $scope.siteSensors[inst].serial_number;
                                    $scope.SiteFiles.push(sensFiles[sf]);
                                }
                            }
                        }
                    }
                    //if image, put into carousel array
                    $scope.siteImageFiles = [];
                    angular.forEach($scope.SiteFiles, function (sf) {
                        var extI = sf.name.indexOf(".");
                        var extString = sf.name.substring(extI + 1);
                        if (['jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG', 'gif', 'GIF'].indexOf(extString) > -1)
                            $scope.siteImageFiles.push(sf);
                    });
                    
                }, true);
                
                // watch for the session event to change and update SITE FILES DO NOT HAVE AN EVENT                
                $scope.$watch(function () { return $cookies.get('SessionEventName'); }, function (newValue) {
                    $scope.sessionEventName = newValue !== undefined ? newValue : "All Events";
                    $scope.sessionEventExists = $scope.sessionEventName != "All Events" ? true : false;
                    if (newValue !== undefined) {
                        $scope.siteHWMs = HWM_Service.getAllSiteHWMs(); $scope.siteSensors = Instrument_Service.getAllSiteSensors();
                        //keep all site & OP Files, filter HWM, Instrument (DF files use Instrument event)
                        $scope.SiteFiles = Site_Files.getAllSiteFiles().filter(function (h) { return h.fileBelongsTo == 'Site File' || h.fileBelongsTo == 'Objective Point File'; });  //keep all site and op files
                        angular.forEach($scope.SiteFiles, function (sf) {
                            if (sf.fileBelongsTo == 'Objective Point File')
                                sf.typeName = thisSiteOPs.filter(function (op) { return op.objective_point_id == sf.objective_point_id; })[0].name;
                            //if image, put into carousel array
                            $scope.siteImageFiles = [];
                            var extI = sf.name.indexOf(".");
                            var extString = sf.name.substring(extI + 1);
                            if (['jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG', 'gif', 'GIF'].indexOf(extString) > -1)
                                $scope.siteImageFiles.push(sf);
                        });
                        var hwmFiles = Site_Files.getAllSiteFiles().filter(function (sfiles) { return sfiles.fileBelongsTo == 'HWM File'; }); 
                        var sensFiles = Site_Files.getAllSiteFiles().filter(function (sfi) { return sfi.instrument_id > 0 && sfi.instrument_id !== null; });
                        //only show files for this event (go through hwm files and match eventid
                        for (var hf = 0; hf < hwmFiles.length; hf++) {
                            for (var hwm = 0; hwm < $scope.siteHWMs.length; hwm++) {
                                if (hwmFiles[hf].hwm_id == $scope.siteHWMs[hwm].hwm_id && $scope.siteHWMs[hwm].event_id == $cookies.get('SessionEventID')) 
                                    $scope.SiteFiles.push(hwmFiles[hf]);
                            }
                        }
                        //only show files for this event (go through sensor files and match eventid
                        for (var sf = 0; sf < sensFiles.length; sf++) {
                            for (var inst = 0; inst < $scope.siteSensors.length; inst++) {
                                if (sensFiles[sf].instrument_id == $scope.siteSensors[inst].instrument_id && $scope.siteSensors[inst].event_id == $cookies.get('SessionEventID')) {
                                    sensFiles[sf].typeName = $scope.siteSensors[inst].serial_number;
                                    $scope.SiteFiles.push(sensFiles[sf]);
                                }
                            }
                        }                                       
                    } else {
                        $scope.SiteFiles = Site_Files.getAllSiteFiles();
                    }
                }, true);

                //show a modal with the larger image as a preview
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

                //create/edit a file
                $scope.showFileModal = function (FileClicked) {                    
                    var SindexClicked = $scope.SiteFiles.indexOf(FileClicked);
                    //populate all filetypes that create/edit file needs depending on what the file is attached to
                    $scope.siteFileTypes = allFileTypes.filter(function (ft) {
                        return ft.filetype === 'Photo' || ft.filetype === 'Historic Citation' || ft.filetype === 'Field Sheets' ||
                            ft.filetype === 'Level Notes' || ft.filetype === 'Site Sketch' || ft.filetype === 'Other' || ft.filetype === 'Link' || ft.filetype === 'Sketch' ||
                            ft.filetype === 'Landowner Permission Form';
                    });
                    $scope.hwmFileTypes = allFileTypes.filter(function (hft){ 
                        return hft.filetype === 'Photo' || hft.filetype === 'Historic Citation' || hft.filetype === 'Field Sheets' ||
                            hft.filetype === 'Level Notes' || hft.filetype === 'Other' || hft.filetype === 'Link' || hft.filetype === 'Sketch';
                    });
                    $scope.sensorFileTypes = allFileTypes.filter(function (sft){
                        return sft.filetype === 'Photo' || sft.filetype === 'Data' || sft.filetype === 'Historic Citation' || sft.filetype === 'Field Sheets' ||
                           sft.filetype === 'Level Notes' || sft.filetype === 'Other' || sft.filetype === 'Link' || sft.filetype === 'Sketch';
                    });
                    $scope.opFileTypes = allFileTypes.filter(function (oft) {
                        return oft.filetype === 'Photo' || oft.filetype === 'Field Sheets' || oft.filetype === 'Level Notes' ||
                            oft.filetype === 'Other' || oft.filetype === 'NGS Datasheet' || oft.filetype === 'Sketch';
                    });

                    //modal allFileTypes, thisFile, allMembers, agencyList, fileSite,
                    var modalInstance = $uibModal.open({
                        templateUrl: FileClicked !== 0 ? 'FILEmodal.html' : 'FileCreateModal.html',
                        controller: 'siteFileModalCtrl',
                        size: 'lg',
                        backdrop: 'static',
                        keyboard: false,
                        windowClass: 'rep-dialog',
                        resolve: {
                            fileExists: function () {
                                if (FileClicked !== 0) 
                                    return FILE.getFileItem({ id: FileClicked.file_id }).$promise;
                            },
                            fileTypeList: function () {
                                if (FileClicked !== 0) {
                                    switch (FileClicked.fileBelongsTo) {
                                        case 'HWM File':
                                            return $scope.hwmFileTypes;
                                        case 'DataFile File':
                                            return $scope.sensorFileTypes;
                                        case 'Sensor File':
                                            return $scope.sensorFileTypes;
                                        case 'Objective Point File':
                                            return $scope.opFileTypes;
                                        case 'Site File':
                                            return $scope.siteFileTypes;
                                    }
                                } else {
                                    return $scope.siteFileTypes;
                                }
                            },
                            agencyList: function (){
                                return allAgencies;
                            },
                            thisFile: function () {
                                if (FileClicked !== 0)
                                    return FileClicked;
                            },
                            fileSite: function () {
                                return thisSite;
                            },
                            allMembers: function () {
                                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                                $http.defaults.headers.common.Accept = 'application/json';
                                return MEMBER.getAll().$promise;
                            },
                            fileSource: function () {
                                if (FileClicked !== 0) {
                                    if (FileClicked.source_id !== undefined)
                                        return SOURCE.query({id:FileClicked.source_id}).$promise;
                                }
                            },
                            dataFile: function () {
                                if (FileClicked !== 0) {
                                    if (FileClicked.data_file_id !== undefined)
                                        return DATA_FILE.query({ id: FileClicked.data_file_id }).$promise;
                                }
                            }
                        }
                    });
                    modalInstance.result.then(function (createdFile) {
                        //is there a new file or just closed modal
                        if (createdFile[1] == 'created') {
                            $scope.SiteFiles.push(createdFile[0]);
                            Site_Files.setAllSiteFiles($scope.SiteFiles);//, $scope.siteHWMs, $scope.siteSensors);
                        }
                        if (createdFile[1] === undefined) {
                            //this is from edit -- refresh page?
                            $scope.SiteFiles[SindexClicked] = createdFile;
                            Site_Files.setAllSiteFiles($scope.SiteFiles);
                            $scope.stamp = FILE_STAMP.getStamp();
                        }
                        if (createdFile[1] == 'deleted') {
                            $scope.SiteFiles.splice(SindexClicked, 1); //remove from file List
                            Site_Files.setAllSiteFiles($scope.SiteFiles);//, $scope.siteHWMs, $scope.siteSensors);
                        }
                    });
                };
            }
        }]);
})();