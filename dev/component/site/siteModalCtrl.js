(function () {
    'use strict';

    var ModalControllers = angular.module('ModalControllers');

    ModalControllers.controller('siteModalCtrl', ['$scope', '$rootScope', '$cookies', '$q', '$location', '$state', '$http', '$sce', '$timeout', '$uibModal', '$uibModalInstance', '$filter', 'leafletMarkerEvents', 'allDropDownParts',
        'fileTypes', 'agencyList', 'latlong', 'thisSiteStuff', 'allMembers', 'SITE', 'SITE_HOUSING', 'Site_Files', 'MEMBER', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'LANDOWNER_CONTACT', 'GEOCODE', 'FILE_STAMP', 'FILE', 'SOURCE', 'SERVER_URL',
        function ($scope, $rootScope, $cookies, $q, $location, $state, $http, $sce, $timeout, $uibModal, $uibModalInstance, $filter, leafletMarkerEvents, allDropDownParts, fileTypes, agencyList, latlong, thisSiteStuff, allMembers, SITE,
            SITE_HOUSING, Site_Files, MEMBER, INSTRUMENT, INSTRUMENT_STATUS, LANDOWNER_CONTACT, GEOCODE, FILE_STAMP, FILE, SOURCE, SERVER_URL) {
            //dropdowns 
            $scope.HorizontalDatumList = allDropDownParts[0];
            $scope.HorCollMethodList = allDropDownParts[1];
            $scope.StateList = allDropDownParts[2];
            $scope.AllCountyList = allDropDownParts[3];
            $scope.stateCountyList = [];
            $scope.DMS = {}; //holder of deg min sec values
            $scope.allHousingTypeList = allDropDownParts[4];
            $scope.DepPriorityList = allDropDownParts[5];
            $scope.NetNameList = allDropDownParts[6];
            $scope.NetTypeList = allDropDownParts[7];
            $scope.ProposedSens = allDropDownParts[8];
            $scope.SensorDeployment = allDropDownParts[9];
            $scope.userRole = $cookies.get('usersRole');
            $scope.closeSites = 0;
            $scope.showMap = false;
            $scope.siteLat = 0;
            $scope.siteLong = 0;
            $scope.htmlDescriptionTip = $sce.trustAsHtml('Required by NWIS. Can be listed as <em>\'unknown\'</em> or <em>\'Atlantic Ocean\'</em>');
            $scope.mapCenter = {
                lat: $scope.siteLat,
                lng: $scope.siteLong,
                zoom: 17
            };

            $scope.events = {
                mapMarkers: {
                    enable: leafletMarkerEvents.getAvailableEvents()
                }
            };
            $scope.mapMarkers = [];
            
            var icons = {
                stn: {
                    type: 'div',
                    iconSize: [10, 10],
                    className: 'stnSiteIcon'
                },
                newSTN: {
                    type: 'div',
                    iconSize: [10, 10],
                    className: 'newSiteIcon',
                    iconAnchor: [5, 5]
                }
            };
            //convert deg min sec to dec degrees
            var azimuth = function (deg, min, sec) {
                var azi = 0;
                if (deg < 0) {
                    azi = -1.0 * deg + 1.0 * min / 60.0 + 1.0 * sec / 3600.0;
                    return (-1.0 * azi).toFixed(5);
                }
                else {
                    azi = 1.0 * deg + 1.0 * min / 60.0 + 1.0 * sec / 3600.0;
                    return (azi).toFixed(5);
                }
            };

            $scope.updateAddressOnly = function () {                
                if ($scope.DMS.LADeg !== undefined) $scope.aSite.latitude_dd = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                if ($scope.DMS.LODeg !== undefined) $scope.aSite.longitude_dd = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                delete $http.defaults.headers.common.Authorization;
                $http.defaults.headers.common.Accept = 'application/json';
                GEOCODE.getAddressParts({ Longitude: $scope.aSite.longitude_dd, Latitude: $scope.aSite.latitude_dd }, function success(response) {
                    if (response.result.geographies.Counties.length > 0) {
                        var stateFIPS = response.result.geographies.Counties[0].STATE;
                        var countyName = response.result.geographies.Counties[0].NAME;
                        var thisStateID = $scope.AllCountyList.filter(function (c) { return c.state_fip == stateFIPS; })[0].state_id;
                        var thisState = $scope.StateList.filter(function (s) { return s.state_id == thisStateID; })[0];
                        if (thisState !== undefined) {
                            $scope.aSite.state = thisState.state_abbrev;
                            $scope.stateCountyList = $scope.AllCountyList.filter(function (c) { return c.state_id == thisState.state_id; });
                            $scope.aSite.county = countyName;
                        } else {
                            $rootScope.stateIsLoading.showLoading = false;// loading..
                            toastr.error("The Latitude/Longitude did not return a recognized state. Please choose one from the dropdown.");
                        }
                    } else {
                        $rootScope.stateIsLoading.showLoading = false;// loading..
                        toastr.error("No location information came back from that lat/long");
                    }
                }, function error (errorResponse){
                    toastr.error("Error getting location information.");
                });
            };
            ///update newSite lat/lng after dragend
            $scope.$on("leafletDirectiveMarker.dragend", function (event, args) {
                var dragendLocation = args.model;
                //update lat/long
                $scope.aSite.latitude_dd = parseFloat(dragendLocation.lat.toFixed(6));
                $scope.aSite.longitude_dd = parseFloat(dragendLocation.lng.toFixed(6));
                //update dms also in case they have that showing
                var latDMS = (deg_to_dms($scope.aSite.latitude_dd)).toString();
                var ladDMSarray = latDMS.split(':');
                $scope.DMS.LADeg = ladDMSarray[0];
                $scope.DMS.LAMin = ladDMSarray[1];
                $scope.DMS.LASec = ladDMSarray[2];

                var longDMS = deg_to_dms($scope.aSite.longitude_dd);
                var longDMSarray = longDMS.split(':');
                $scope.DMS.LODeg = longDMSarray[0] * -1;
                $scope.DMS.LOMin = longDMSarray[1];
                $scope.DMS.LOSec = longDMSarray[2];
            
                $scope.updateAddressOnly();
            });

            //get address parts and existing sites 
            $scope.getAddress = function () {
                if ($scope.DMS.LADeg !== undefined) $scope.aSite.latitude_dd = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                if ($scope.DMS.LODeg !== undefined) $scope.aSite.longitude_dd = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                if ($scope.aSite.latitude_dd !== undefined && $scope.aSite.longitude_dd !== undefined && !isNaN($scope.aSite.latitude_dd) && !isNaN($scope.aSite.longitude_dd)) {
                    $scope.mapCenter = { lat: parseFloat($scope.aSite.latitude_dd), lng: parseFloat($scope.aSite.longitude_dd), zoom: 18 };
                    $scope.mapMarkers = [];
                    $rootScope.stateIsLoading.showLoading = true; //loading...
                    $http.defaults.headers.common.Accept = 'application/json';
                    delete $http.defaults.headers.common.Authorization;
                    GEOCODE.getAddressParts({ Longitude: $scope.aSite.longitude_dd, Latitude: $scope.aSite.latitude_dd }, function success(response) {
                        if (response.result.geographies.Counties.length > 0) {
                            var stateFIPS = response.result.geographies.Counties[0].STATE;
                            var countyName = response.result.geographies.Counties[0].NAME;
                            var thisStateID = $scope.AllCountyList.filter(function (c) { return c.state_fip == stateFIPS; })[0].state_id;
                            var thisState = $scope.StateList.filter(function (s) { return s.state_id == thisStateID; })[0];

                            if (thisState !== undefined) {
                                $scope.aSite.state = thisState.state_abbrev;
                                $scope.stateCountyList = $scope.AllCountyList.filter(function (c) { return c.state_id == thisState.state_id; });
                                $scope.aSite.county = countyName;
                                //see if there are any sites within a 0.0005 buffer of here for them to use instead
                                SITE.getProximitySites({ Latitude: $scope.aSite.latitude_dd, Longitude: $scope.aSite.longitude_dd, Buffer: 0.0005 }, function success(response) {
                                    $scope.closeSites = response;
                                    if ($scope.closeSites.length > 0) {
                                        for (var i = 0; i < $scope.closeSites.length; i++) {
                                            var a = $scope.closeSites[i];
                                            $scope.mapMarkers.push({
                                                lat: a.latitude_dd,
                                                lng: a.longitude_dd,
                                                site_id: a.site_id,
                                                site_no: a.site_no,
                                                icon: icons.stn,
                                                message: a.site_no,
                                                focus: false
                                            });
                                        }
                                    }
                                    $scope.mapMarkers.push({
                                        lat: parseFloat($scope.aSite.latitude_dd),
                                        lng: parseFloat($scope.aSite.longitude_dd),
                                        icon: icons.newSTN,
                                        message: 'New draggable STN site',
                                        focus: false,
                                        draggable: true
                                    });
                                    $scope.showMap = true;
                                    $rootScope.stateIsLoading.showLoading = false;// loading..
                                }, function error(errorResponse) {
                                    $rootScope.stateIsLoading.showLoading = false;// loading..
                                    toastr.error("Error: " + errorResponse.statusText);
                                }).$promise;
                            } else {
                                $rootScope.stateIsLoading.showLoading = false;// loading..
                                toastr.error("The Latitude/Longitude did not return a recognized state. Please choose one from the dropdown.");
                            }
                        } else {
                            $rootScope.stateIsLoading.showLoading = false;// loading..
                            toastr.error("Error getting address location.");
                        }
                    }, function (errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    });
                } else {
                    //they did not type a lat/long first...
                    var emptyLatLongModal = $uibModal.open({
                        template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>Please provide a Latitude and Longitude before clicking Verify Location</p></div>' +
                            '<div class="modal-footer"><button type="button" class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                        }],
                        size: 'sm'
                    });
                }
            };

            //globals 
            $scope.houseDirty = false; $scope.netTypeDirty = false;
            $scope.siteHouseTypesTable = [];
            $scope.aSite = {};

            //if latlong, then it's coming from the map tab. populate lat,long,hdatum and do geosearch
            if (latlong !== undefined) {
                $scope.aSite.latitude_dd = parseFloat(latlong[0].toFixed(6));
                $scope.aSite.longitude_dd = parseFloat(latlong[1].toFixed(6));
                $scope.aSite.hdatum_id = 4;
                $scope.aSite.hcollect_method_id = 4;
                $scope.getAddress(); //get the address using passed in lat/long and check for nearby sites
            }

            $scope.aSite.decDegORdms = 'dd';
            
            $scope.originalSiteHousings = [];
            $scope.checked = ""; $scope.checkedName = "Not Defined"; //comparers for disabling network names if 'Not Defined' checked
            $scope.landowner = {};
            $scope.addLandowner = false; //hide landowner fields
            $scope.disableSensorParts = false; //toggle to disable/enable sensor housing installed and add proposed sensor
            $scope.showSiteHouseTable = false;
            $scope.siteHouseTypesTable = []; //holder for when adding housing type to page from multiselect
            $scope.siteHousesModel = {};
            $scope.siteHousesToRemove = []; //holder for editing site to add removing house types to for PUT
            $scope.NetworkNAMEToAdd = []; //holder for objective types added
            $scope.NetworkNAMEToRemove = []; //holder for objective types removed on existing projects (edit)
            $scope.NetworkTYPEToAdd = []; //holder for objective types added
            $scope.NetworkTYPEToRemove = []; //holder for objective types removed on existing projects (edit)

            $scope.siteNetworkNames = []; //holds the NetworkName (list of strings) to pass back;
            $scope.siteNetworkTypes = []; //holds the NetworkType (list of strings) to pass back;
           
            //SITE FILE PART /////            
            $scope.serverURL = SERVER_URL; //constant with stntest.wim.usgs.gov/STNServices2 
            $scope.fileTypeList = fileTypes.filter(function (ft) {
                return ft.filetype === 'Photo' || ft.filetype === 'Historic Citation' || ft.filetype === 'Field Sheets' ||
                                ft.filetype === 'Level Notes' || ft.filetype === 'Site Sketch' || ft.filetype === 'Other' || ft.filetype === 'Link' || ft.filetype === 'Sketch' ||
                                ft.filetype === 'Landowner Permission Form';
            });
            $scope.allSFiles = Site_Files.getAllSiteFiles();
            //if thisSiteStuff is not undefined, filter the allSFiles and give me just those for the site ONLY
            $scope.SITEFiles = thisSiteStuff !== undefined ?
                $scope.allSFiles.filter(function (sf) {
                    return sf.site_id == thisSiteStuff[0].site_id &&
                        (sf.hwm_id == undefined || sf.hwm_id == 0) &&
                        (sf.instrument_id == undefined || sf.instrument_id == 0) &&
                        (sf.objective_point_id == undefined || sf.objective_point_id == 0);
                })
                : [];// holder for site files added
            $scope.siteImageFiles = $scope.SITEFiles.filter(function (hf) { return hf.filetype_id === 1; }); //image files for carousel
            $scope.showFileForm = false; //hidden form to add file to site
            
            //#region FILE STUFF
            $scope.stamp = FILE_STAMP.getStamp(); $scope.fileItemExists = true;
            //need to reupload fileItem to this existing file OR Change out existing fileItem for new one
            $scope.saveFileUpload = function () {
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
                        site_id: $scope.aFile.site_id,
                        filetype_id: $scope.aFile.filetype_id,
                        source_id: $scope.aFile.source_id,
                        path: $scope.aFile.path,                        
                        photo_date: $scope.aFile.photo_date,
                        is_nwis: $scope.aFile.is_nwis                        
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
                    fresponse.fileBelongsTo = "Site File";
                    $scope.SITEFiles.splice($scope.existFileIndex, 1);
                    $scope.SITEFiles.push(fresponse);
                    if (fresponse.filetype_id === 1) {
                        $scope.siteImageFiles.splice($scope.existFileIndex, 1);
                        $scope.siteImageFiles.push(fresponse);
                    }
                    $scope.allSFiles[$scope.allSFileIndex] = fresponse;
                    Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                    $scope.sFileIsUploading = false;
                    $scope.fileItemExists = true;
                }, function (errorResponse) {
                    $scope.sFileIsUploading = false;
                    toastr.error("Error saving file: " + errorResponse.statusText);
                });
            };

            //show a modal with the larger image as a preview on the photo file for this hwm
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
                $scope.existFileIndex = -1; $scope.existIMGFileIndex = -1; $scope.allSFileIndex = -1; //indexes for splice/change
                $scope.aFile = {}; //holder for file
                $scope.aSource = {}; //holder for file source
                //SITE will not have datafile 
                if (file !== 0) {
                    //edit site file
                    $scope.existFileIndex = $scope.SITEFiles.indexOf(file);
                    $scope.allSFileIndex = $scope.allSFiles.indexOf(file);
                    $scope.existIMGFileIndex = $scope.siteImageFiles.length > 0 ? $scope.siteImageFiles.indexOf(file) : -1;
                    $scope.aFile = angular.copy(file);
                    FILE.getFileItem({ id: $scope.aFile.file_id }).$promise.then(function (response) {
                        $scope.fileItemExists = response.Length > 0 ? true : false;
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
                    if (file.source_id !== null) {
                        SOURCE.query({ id: file.source_id }).$promise.then(function (s) {
                            $scope.aSource = s;
                            $scope.aSource.FULLname = $scope.aSource.source_name;
                            $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
                        });
                    }//end if source
                }//end existing file
                else {
                    $scope.aFile.file_date = new Date(); $scope.aFile.photo_date = new Date();
                    $scope.aSource = allMembers.filter(function (m) { return m.member_id == $cookies.get('mID'); })[0];
                    $scope.aSource.FULLname = $scope.aSource.fname + " " + $scope.aSource.lname;
                    $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
                } //end new file
                $scope.showFileForm = true;

                  
                $scope.updateAgencyForCaption = function () {
                    if ($scope.aFile.filetype_id == 1)
                        $scope.agencyNameForCap = $scope.agencies.filter(function (a) { return a.agency_id == $scope.aSource.agency_id; })[0].agency_name;
                };
            };
            //create this new file
            $scope.createFile = function (valid) {
                if (valid) {
                    $scope.SITEfileIsUploading = true;
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    var theSource = { source_name: $scope.aSource.FULLname, agency_id: $scope.aSource.agency_id };
                    //post source first to get source_id
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
                                    site_id: $scope.aSite.site_id,
                                    source_id: response.source_id,
                                    photo_direction: $scope.aFile.photo_direction,
                                    latitude_dd: $scope.aFile.latitude_dd,
                                    longitude_dd: $scope.aFile.longitude_dd
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
                                fresponse.fileBelongsTo = "Site File";
                                $scope.SITEFiles.push(fresponse);
                                $scope.allSFiles.push(fresponse);
                                Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                if (fresponse.filetype_id === 1) $scope.siteImageFiles.push(fresponse);
                                $scope.showFileForm = false; $scope.SITEfileIsUploading = false;
                            }, function (errorResponse) {
                                $scope.SITEfileIsUploading = false;
                                toastr.error("Error uploading file: " + errorResponse.statusText);
                            });
                        } else {
                            $scope.aFile.source_id = response.source_id; $scope.aFile.site_id = $scope.aSite.site_id;
                            FILE.save($scope.aFile).$promise.then(function (fresponse) {
                                toastr.success("Link saved");
                                fresponse.fileBelongsTo = "Site File";
                                $scope.SITEFiles.push(fresponse);
                                $scope.allSFiles.push(fresponse);
                                Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard                                
                                $scope.showFileForm = false; $scope.SITEfileIsUploading = false;
                            }, function (errorResponse) {
                                $scope.SITEfileIsUploading = false;
                                toastr.error("Error saving file: " + errorResponse.statusText);
                            });
                        }//end else
                    }, function (errorResponse) {
                        $scope.SITEfileIsUploading = false;
                        toastr.error("Error creating Source info: " + errorResponse.statusText);
                    });//end source.save()              
                }//end valid
            };//end create()

            //update this file
            $scope.saveFile = function (valid) {
                if (valid) {
                    $scope.SITEfileIsUploading = true;
                    //only photo or other file type (no data file here)
                    //put source or datafile, put file
                    var whatkind = $scope.aFile.fileBelongsTo;
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    if ($scope.aSource.source_id !== undefined) {
                        $scope.aSource.source_name = $scope.aSource.FULLname;
                        SOURCE.update({ id: $scope.aSource.source_id }, $scope.aSource).$promise.then(function () {
                            FILE.update({ id: $scope.aFile.file_id }, $scope.aFile).$promise.then(function (fileResponse) {
                                toastr.success("File Updated");
                                fileResponse.fileBelongsTo = "Site File";
                                $scope.SITEFiles[$scope.existFileIndex] = fileResponse;
                                $scope.allSFiles[$scope.allSFileIndex] = fileResponse;
                                Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                                $scope.showFileForm = false; $scope.SITEfileIsUploading = false;
                            }, function (errorResponse) {
                                $scope.SITEfileIsUploading = false;
                                toastr.error("Error saving file: " + errorResponse.statusText);
                            });
                        }, function (errorResponse) {
                            $scope.SITEfileIsUploading = false; //Loading...
                            toastr.error("Error saving file: " + errorResponse.statusText);
                        });
                    }
                }//end valid
            };//end save()

            //delete this file
            $scope.deleteFile = function () {
                var DeleteModalInstance = $uibModal.open({
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
                        $scope.SITEFiles.splice($scope.existFileIndex, 1);
                        $scope.allSFiles.splice($scope.allSFileIndex, 1);
                        $scope.siteImageFiles.splice($scope.existIMGFileIndex, 1);
                        Site_Files.setAllSiteFiles($scope.allSFiles); //updates the file list on the sitedashboard
                        $scope.showFileForm = false;
                    }, function error(errorResponse) {
                        toastr.error("Error: " + errorResponse.statusText);
                    });
                });//end DeleteModal.result.then
            };//end delete()

            $scope.cancelFile = function () {
                $scope.aFile = {};
                $scope.aSource = {};
                //  $scope.datafile = {};
                $scope.showFileForm = false;
            };
            //#endregion FILE STUFF
            
            //lat modal 
            var openLatModal = function (w) {
                var latModal = $uibModal.open({
                    template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                        '<div class="modal-body"><p>The Latitude must be between 0 and 73.0</p></div>' +
                        '<div class="modal-footer"><button type="button" class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.ok = function () {
                            $uibModalInstance.close();
                        };
                    }],
                    size: 'sm'
                });
                latModal.result.then(function (fieldFocus) {
                    if (w == 'latlong') $("#latitude_dd").focus();
                    else $("#LaDeg").focus();
                });
            };

            //long modal
            var openLongModal = function (w) {
                var longModal = $uibModal.open({
                    template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                        '<div class="modal-body"><p>The Longitude must be between -175.0 and -60.0</p></div>' +
                        '<div class="modal-footer"><button type="button" class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.ok = function () {
                            $uibModalInstance.close();
                        };
                    }],
                    size: 'sm'
                });
                longModal.result.then(function (fieldFocus) {
                    if (w == 'latlong') $("#longitude_dd").focus();
                    else $("#LoDeg").focus();
                });
            };

            //make sure lat/long are right number range
            $scope.checkValue = function (d,direction) {
                if (d == 'dms') {
                    //check the degree value
                    if (direction == 'lat') {
                        if ($scope.DMS.LADeg < 0 || $scope.DMS.LADeg > 73 || (isNaN($scope.DMS.LADeg) && $scope.DMS.LADeg !== undefined) || (isNaN($scope.DMS.LAMin) && $scope.DMS.LAMin !== undefined) || (isNaN($scope.DMS.LASec) && $scope.DMS.LASec !== undefined)) {
                            openLatModal('dms');
                            //if not a number, clear the imputs to trigger the validation
                            if (isNaN($scope.DMS.LADeg)) $scope.DMS.LADeg = undefined;
                            if (isNaN($scope.DMS.LAMin)) $scope.DMS.LAMin = undefined;
                            if (isNaN($scope.DMS.LASec)) $scope.DMS.LASec = undefined;
                        }
                    }
                    if (direction == 'long') {
                        if ($scope.DMS.LODeg < -175 || $scope.DMS.LODeg > -60 || (isNaN($scope.DMS.LODeg) && $scope.DMS.LODeg !== undefined) || (isNaN($scope.DMS.LOMin) && $scope.DMS.LOMin !== undefined) || (isNaN($scope.DMS.LOSec) && $scope.DMS.LOSec !== undefined)) {
                            openLongModal('dms');
                            //if not a number, clear the imputs to trigger the validation
                            if (isNaN($scope.DMS.LODeg)) $scope.DMS.LODeg = undefined;
                            if (isNaN($scope.DMS.LOMin)) $scope.DMS.LOMin = undefined;
                            if (isNaN($scope.DMS.LOSec)) $scope.DMS.LOSec = undefined;
                        }
                    }
                } else {
                    //check the latitude/longitude
                    if (direction == 'lat') {
                        if ($scope.aSite.latitude_dd < 0 || $scope.aSite.latitude_dd > 73 || isNaN($scope.aSite.latitude_dd)) {
                            openLatModal('latlong');
                            //if not a number, clear the imputs to trigger the validation
                            if (isNaN($scope.aSite.latitude_dd)) {
                                $scope.aSite.latitude_dd = undefined;
                            }
                        }
                    }
                    if (direction == 'long') {
                        if ($scope.aSite.longitude_dd < -175 || $scope.aSite.longitude_dd > -60 || isNaN($scope.aSite.longitude_dd)) {
                            openLongModal('latlong');
                            //if not a number, clear the imputs to trigger the validation
                            if (isNaN($scope.aSite.longitude_dd)) {
                                $scope.aSite.longitude_dd = undefined;
                            }
                        }
                    }
                }
            };

            //convert dec degrees to dms
            var deg_to_dms = function (deg) {
                if (deg < 0) {
                    deg = deg.toString();

                    //longitude, remove the - sign
                    deg = deg.substring(1);
                }
                var d = Math.floor(deg);
                var minfloat = (deg - d) * 60;
                var m = Math.floor(minfloat);
                var s = ((minfloat - m) * 60).toFixed(3);

                return ("" + d + ":" + m + ":" + s);
            };

            //they changed radio button for dms dec deg
            $scope.latLongChange = function () {
                if ($scope.aSite.decDegORdms == "dd") {
                    //they clicked Dec Deg..
                    if (($scope.DMS.LADeg !== undefined && $scope.DMS.LAMin !== undefined && $scope.DMS.LASec !== undefined) &&
                        ($scope.DMS.LODeg !== undefined && $scope.DMS.LOMin !== undefined && $scope.DMS.LOSec !== undefined)) {
                        //convert what's here for each lat and long
                        $scope.aSite.latitude_dd = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                        $scope.aSite.longitude_dd = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);                        
                    } else {
                        //show modal telling them to populate all three (DMS) for conversion to work
                        var DMSModal = $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>Please populate all three inputs for conversion from DMS to Decimal Degrees to work.</p></div>' +
                                '<div class="modal-footer"><button type="button" class="btn btn-primary" ng-enter="ok()" ng-click="ok()">OK</button></div>',
                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                $scope.ok = function () {
                                    $uibModalInstance.close();
                                };
                            }],
                            size: 'sm'
                        });
                        DMSModal.result.then(function () {
                            if ($scope.DMS.LADeg !== undefined || $scope.DMS.LAMin !== undefined || $scope.DMS.LASec !== undefined)
                                $("#LaDeg").focus();
                            if ($scope.DMS.LODeg !== undefined || $scope.DMS.LOMin !== undefined || $scope.DMS.LOSec !== undefined)
                                $("#LoDeg").focus();
                            $scope.aSite.decDegORdms = "dms";
                        });
                    }
                } else {
                    //they clicked dms (convert lat/long to dms)
                    if ($scope.aSite.latitude_dd !== undefined) {
                        var latDMS = (deg_to_dms($scope.aSite.latitude_dd)).toString();
                        var ladDMSarray = latDMS.split(':');
                        $scope.DMS.LADeg = ladDMSarray[0];
                        $scope.DMS.LAMin = ladDMSarray[1];
                        $scope.DMS.LASec = ladDMSarray[2];

                        var longDMS = deg_to_dms($scope.aSite.longitude_dd);
                        var longDMSarray = longDMS.split(':');
                        $scope.DMS.LODeg = longDMSarray[0] * -1;
                        $scope.DMS.LOMin = longDMSarray[1];
                        $scope.DMS.LOSec = longDMSarray[2];
                    }
                }
            };

            //networkType check event --trigger dirty
            $scope.netTypeChg = function (nt) {
                //store this to handle in PUT or POST
                if (nt.selected) { //selected
                    $scope.NetworkTYPEToAdd.push(nt); 
                    if ($scope.aSite.site_id !== undefined) { //if this is edit
                        //editing (remove from remove list if there)
                        var i = $scope.NetworkTYPEToRemove.map(function (e) { return e.network_type_id; }).indexOf(nt.network_type_id);
                        if (i >= 0) $scope.NetworkTYPEToRemove.splice(i, 1); //remove from removeList ..in case they removed and then added it back
                    }
                } else {
                    //n.selected == false
                    var ind = $scope.NetworkTYPEToAdd.map(function (e) { return e.network_type_id; }).indexOf(nt.network_type_id);
                    if (ind >= 0) $scope.NetworkTYPEToAdd.splice(ind, 1); //remove it from addList if they added then removed

                    if ($scope.aSite.site_id !== undefined) { //edit
                        $scope.NetworkTYPEToRemove.push(nt); //add it to removeList
                    }
                }
            };

            //networkName check event.. if "Not Defined" chosen, disable the other 2 checkboxes
            $scope.whichOne = function (n) {
                //store this to handle in PUT or POST
                if (n.selected) { //selected
                    $scope.NetworkNAMEToAdd.push(n); 
                    if ($scope.aSite.site_id !== undefined) { //if this is edit
                        //editing (remove from remove list if there)
                        var i = $scope.NetworkNAMEToRemove.map(function (e) { return e.network_name_id; }).indexOf(n.network_name_id);
                        if (i >= 0) $scope.NetworkNAMEToRemove.splice(i, 1); //remove from removeList ..in case they removed and then added it back
                    }
                } else {
                    //n.selected == false
                    var ind = $scope.NetworkNAMEToAdd.map(function (e) { return e.network_name_id; }).indexOf(n.network_name_id);
                    if (ind >= 0) $scope.NetworkNAMEToAdd.splice(ind, 1); //remove it from addList if they added then removed

                    if ($scope.aSite.site_id !== undefined) { //edit
                        $scope.NetworkNAMEToRemove.push(n); //add it to removeList

                    }
                }
                
                if (n.name == "Not Defined" && n.selected === true) {
                    //they checked "not defined"
                    for (var nn = 0; nn < $scope.NetNameList.length; nn++) {
                        //unselect all but not defined TODO:::: If any, put them in NetworkNAMEToRemove list
                        if ($scope.NetNameList[nn].name != "Not Defined" && $scope.NetNameList[nn].selected === true) {
                            $scope.NetworkNAMEToRemove.push($scope.NetNameList[nn]);
                            $scope.NetNameList[nn].selected = false;
                        }
                    }
                    //make these match so rest get disabled
                    $scope.checked = "Not Defined";
                }
                //they they unchecked not define, unmatch vars so the other become enabled
                if (n.name == "Not Defined" && n.selected === false)
                    $scope.checked = "";
            };

            //toggle dim on div for sensor not appropriate click
            $scope.dimAction = function () {
                if ($scope.aSite.sensor_not_appropriate == 1) {
                    $scope.disableSensorParts = true;
                    //clear radio and checkboxes if disabling
                    for (var x = 0; x < $scope.ProposedSens.length; x++) {
                        $scope.ProposedSens[x].selected = false;
                    }
                    $scope.aSite.is_permanent_housing_installed = "No";
                } else {
                    $scope.disableSensorParts = false;
                }
            };

            $scope.useSiteAddress;
            $scope.useAddressforLO = function () {
                if ($scope.useSiteAddress) {
                    $scope.landowner.address = $scope.aSite.address;
                    $scope.landowner.city = $scope.aSite.city;
                    $scope.landowner.state = $scope.aSite.state;
                    $scope.landowner.zip = $scope.aSite.zip;
                } else {
                    $scope.landowner.address = "";
                    $scope.landowner.city = "";
                    $scope.landowner.state = "";
                    $scope.landowner.zip = "";
                }
            };
            //site PUT
            $scope.save = function (valid) {
                if (valid) {
                    $rootScope.stateIsLoading.showLoading = true; // loading..
                    //update the site
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    //did they add or edit the landowner
                    if ($scope.addLandowner === true) {
                        //there's a landowner.. edit or add?
                        if ($scope.aSite.landownercontact_id !== null && $scope.aSite.landownercontact_id !== undefined && $scope.aSite.landownercontact_id > 0) {
                            //did they change anything to warrent a put
                            LANDOWNER_CONTACT.update({ id: $scope.aSite.landownercontact_id }, $scope.landowner).$promise.then(function () {
                                putSiteAndParts();
                            });
                        } else if ($scope.landowner.fname !== undefined || $scope.landowner.lname !== undefined || $scope.landowner.title !== undefined ||
                                $scope.landowner.address !== undefined || $scope.landowner.city !== undefined || $scope.landowner.primaryphone !== undefined) {
                            //they added something.. POST (rather than just clicking button and not)
                            LANDOWNER_CONTACT.save($scope.landowner, function success(response) {
                                $scope.aSite.landownercontact_id = response.landownercontactid;
                                putSiteAndParts();
                            }, function error(errorResponse) { toastr.error("Error adding Landowner: " + errorResponse.statusText); });
                        } else putSiteAndParts();
                    } else putSiteAndParts();
                }
            };//end save
            var putSiteAndParts = function () {
                if ($scope.DMS.LADeg !== undefined) $scope.aSite.latitude_dd = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                if ($scope.DMS.LODeg !== undefined) $scope.aSite.longitude_dd = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                var updateSite = angular.copy($scope.aSite);
                delete updateSite.Creator; delete updateSite.HorizontalCollectMethod; delete updateSite.HorizontalDatum; delete updateSite.PriorityName;
                delete updateSite.decDegORdms; 
                SITE.update({ id: $scope.aSite.site_id }, updateSite, function success(response) {
                    //update site housings
                    var defer = $q.defer();
                    var RemovePromises = [];
                    var AddPromises = [];
                    //Remove siteHousings (these are just site_housing_id 's
                    angular.forEach($scope.siteHousesToRemove, function (shID) {
                        var delSHProm = SITE_HOUSING.delete({ id: shID }).$promise;
                        RemovePromises.push(delSHProm);
                    });
                    //Remove NetNames                   
                    angular.forEach($scope.NetworkNAMEToRemove, function (nnL) {
                        var delNNProm = SITE.deleteSiteNetworkName({ siteId: $scope.aSite.site_id, networkNameId: nnL.network_name_id }).$promise;
                        RemovePromises.push(delNNProm);
                    });                   
                    //Remove NetTypes
                    angular.forEach($scope.NetworkTYPEToRemove, function (ntL) {
                        var delNTProm = SITE.deleteSiteNetworkType({ siteId: $scope.aSite.site_id, networkTypeId: ntL.network_type_id }).$promise;
                        RemovePromises.push(delNTProm);                                                
                    });                    
                    //Add siteHousings
                    if ($scope.houseDirty === true) {
                        angular.forEach($scope.siteHouseTypesTable, function (ht) {
                            var addHtProm;
                            if (ht.site_housing_id !== undefined) {
                                //PUT it
                                addHtProm = SITE_HOUSING.update({ id: ht.site_housing_id }, ht).$promise;
                            } else {
                                //POST it
                                ht.site_id = $scope.aSite.site_id;
                                addHtProm = SITE_HOUSING.save(ht).$promise;
                            }
                            AddPromises.push(addHtProm);
                        });
                    }
                    //Add NetNames
                    angular.forEach($scope.NetworkNAMEToAdd, function (AnnL) {
                        $scope.siteNetworkNames.push(AnnL.name);
                        var addNNProm = SITE.postSiteNetworkName({ siteId: $scope.aSite.site_id, networkNameId: AnnL.network_name_id }).$promise;
                        AddPromises.push(addNNProm);                    
                    });
                    //Add NetTypes
                    angular.forEach($scope.NetworkTYPEToAdd, function (AnTL) {
                        $scope.siteNetworkTypes.push(AnTL.network_type_name);
                        var addNTProm = SITE.postSiteNetworkType({ siteId: $scope.aSite.site_id, networkTypeId: AnTL.network_type_id }).$promise;
                        AddPromises.push(addNTProm);                        
                    });

                    //ok now run the removes, then the adds and then pass the stuff back out of here.
                    $q.all(RemovePromises).then(function () {
                        $q.all(AddPromises).then(function (response) {
                            $scope.siteNetworkNames = []; $scope.siteNetworkTypes = [];
                            angular.forEach($scope.NetNameList, function (nn) {
                                if (nn.selected === true) $scope.siteNetworkNames.push(nn.name);
                            });
                            angular.forEach($scope.NetTypeList, function (nt) {
                                if (nt.selected === true) $scope.siteNetworkTypes.push(nt.network_type_name);
                            });
                            var sendBack = [$scope.aSite, $scope.siteNetworkNames, $scope.siteNetworkTypes];
                            $uibModalInstance.close(sendBack);
                            $rootScope.stateIsLoading.showLoading = false; // loading..
                            toastr.success("Site updated");
                            //$location.path('/Site/' + $scope.aSite.site_id + '/SiteDashboard').replace();//.notify(false);
                            //$scope.apply;
                        }).catch(function error(msg) {
                            console.error(msg);
                        });
                    }).catch(function error(msg) {
                        console.error(msg);
                    }); //all added
                }, function error(errorResponse) {
                    $rootScope.stateIsLoading.showLoading = false; // loading..
                    toastr.error("Error updating Site: " + errorResponse.statusText);
                });//end SITE.save(...
            }; // end PUTsite()

            //create this site clicked (3 separate functions.. 1: landowner, 2: the site and proposed instruments, 3: network names & types, housing types
            var finishPOST = function (sID) {
                //do all the rest....
                var defer = $q.defer();
                var postPromises = [];
                //site_housingTypes (if any)
                angular.forEach($scope.siteHouseTypesTable, function (htype) {
                    htype.site_id = sID;
                    delete htype.type_name;
                    var hTPromise = SITE_HOUSING.save(htype).$promise;
                    postPromises.push(hTPromise);
                });
                //site_NetworkNames
                angular.forEach($scope.NetNameList, function (nName) {
                    if (nName.selected === true) {
                        var nNPromise = SITE.postSiteNetworkName({ siteId: sID, networkNameId: nName.network_name_id }).$promise;
                        postPromises.push(nNPromise);
                    }
                });
                //site_NetworkTypes
                angular.forEach($scope.NetTypeList, function (nType) {
                    if (nType.selected === true) {
                        var nTPromise = SITE.postSiteNetworkType({ siteId: sID, networkTypeId: nType.network_type_id }).$promise;
                        postPromises.push(nTPromise);
                    }
                });
                //when all the promises are done
                $q.all(postPromises).then(function (response) {
                    $uibModalInstance.dismiss('cancel');
                    $rootScope.stateIsLoading.showLoading = false; // loading..
                    $timeout(function () {
                        // anything you want can go here and will safely be run on the next digest.                   
                        $state.go('site.dashboard', { id: sID });
                    });
                });//end $q
            };
            $scope.create = function (valid) {
                if (valid) {
                    $rootScope.stateIsLoading.showLoading = true; // loading..
                    //POST landowner, if they added one
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common.Accept = 'application/json';
                    delete $scope.aSite.Creator; delete $scope.aSite.decDegORdms;
                    if ($scope.addLandowner === true) {
                        if ($scope.landowner.fname !== undefined || $scope.landowner.lname !== undefined || $scope.landowner.title !== undefined ||
                                       $scope.landowner.address !== undefined || $scope.landowner.city !== undefined || $scope.landowner.primaryphone !== undefined) {
                            LANDOWNER_CONTACT.save($scope.landowner, function success(response) {
                                $scope.aSite.landownercontact_id = response.landownercontactid;
                                //now post the site
                                postSiteAndParts();
                            }, function error(errorResponse) {
                                $rootScope.stateIsLoading.showLoading = false; // loading.. 
                                toastr.error("Error posting landowner: " + errorResponse.statusText);
                            });
                        } else {
                            postSiteAndParts();
                        }
                    } else {
                        postSiteAndParts();
                    }
                }
            };
            var postSiteAndParts = function () {
                //make sure longitude is < 0, otherwise * (-1),
                var createdSiteID = 0;
                if ($scope.DMS.LADeg !== undefined) $scope.aSite.latitude_dd = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                if ($scope.DMS.LODeg !== undefined) $scope.aSite.longitude_dd = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                //POST site
                SITE.save($scope.aSite, function success(response) {
                    createdSiteID = response.site_id;
                    //do proposed sensors first since it's 2 parts to it.
                    if ($scope.disableSensorParts === false) {
                        //not disabled..could be selected proposed sensors
                        var selectedProposedSensors = $scope.ProposedSens.filter(function (p) { return p.selected === true; });
                        if (selectedProposedSensors.length > 0) {
                            angular.forEach(selectedProposedSensors, function (propSens, index) {
                                //POST each sensor and status type (after going thru the sensDeps to get the matching deploymenttypeid from each sensor's inner list
                                var sID = 0;
                                angular.forEach($scope.SensorDeployment, function (sdt) {
                                    for (var x = 0; x < sdt.deploymenttypes.length; x++) {
                                        if (sdt.deploymenttypes[x].deployment_type_id == propSens.deployment_type_id)
                                            sID = sdt.sensor_type_id;
                                    }
                                });

                                var sensorTypeID = sID;
                                var inst = { deployment_type_id: propSens.deployment_type_id, site_id: createdSiteID, sensor_type_id: sensorTypeID };
                                INSTRUMENT.save(inst).$promise.then(function (insResponse) {
                                    var instStat = { instrument_id: insResponse.instrument_id, status_type_id: 4, member_id: $scope.aSite.member_id, time_stamp: new Date(), time_zone: 'UTC' };
                                    INSTRUMENT_STATUS.save(instStat).$promise.then(function () {
                                        //when done looping, go to last step in this post
                                        if (index == selectedProposedSensors.length - 1)
                                            finishPOST(createdSiteID);
                                    }, function (errorResponse) {
                                        $rootScope.stateIsLoading.showLoading = false; // loading.. 
                                        toastr.error("Error adding proposed Sensor: " + errorResponse.statusText);
                                    });//end status post
                                }, function (errorResponse) {
                                    $rootScope.stateIsLoading.showLoading = false; // loading.. 
                                    toastr.error("Error adding proposed Sensor: " + errorResponse.statusText);
                                });//end sensor post
                            });//end angular.foreach on proposed sensors
                        } else finishPOST(createdSiteID);
                    } else {
                        finishPOST(createdSiteID);
                    }
                }, function (errorResponse) {
                    $rootScope.stateIsLoading.showLoading = false; // loading.. 
                    toastr.error("Error creating site: " + errorResponse.statusText);
                });
            };//end postSiteand Parts
        
            if (thisSiteStuff !== undefined) {
                //#region existing site 
                //$scope.aSite[0], $scope.originalSiteHousings[1], $scope.existingSiteHouseTypesTable[2], thisSiteNetworkNames[3], siteNetworkTypes[4], $scope.landowner[5]
                $scope.aSite = angular.copy(thisSiteStuff[0]);
                //for some reason there are tons of sites with hcollect_method_id set to 0 when it's required..make it null so validation picks up on required field
                if ($scope.aSite.hcollect_method_id <= 0) $scope.aSite.hcollect_method_id = null;
                //if this site is not appropriate for sensor, dim next 2 fields
                if ($scope.aSite.sensor_not_appropriate > 0) {
                    $scope.disableSensorParts = true;
                    //clear radio and checkboxes if disabling
                    for (var x = 0; x < $scope.ProposedSens.length; x++) {
                        $scope.ProposedSens[x].selected = false;
                    }
                    $scope.aSite.is_permanent_housing_installed = "No";
                }

                //update countiesList with this state's counties
                var thisState = $scope.StateList.filter(function (s) { return s.state_abbrev == $scope.aSite.state; })[0];
                $scope.stateCountyList = $scope.AllCountyList.filter(function (c) { return c.state_id == thisState.state_id; });

                //apply any site housings for EDIT
                if (thisSiteStuff[1].length > 0) {
                    $scope.originalSiteHousings = thisSiteStuff[1]; //for multiselect .selected = true/false
                    $scope.showSiteHouseTable = true;
                    $scope.siteHouseTypesTable = thisSiteStuff[2]; //for table to show all info on house type
                    $scope.landowner = thisSiteStuff[5];
                    $scope.addLandowner = $scope.landowner.fname !== undefined || $scope.landowner.lname !== undefined || $scope.landowner.address !== undefined || $scope.landowner.primaryphone !== undefined ? true : false;

                    //go through allHousingTypeList and add selected Property.
                    for (var ht = 0; ht < $scope.allHousingTypeList.length; ht++) {
                        //for each one, if thisSiteHousings has this id, add 'selected:true' else add 'selected:false'
                        for (var y = 0; y < $scope.originalSiteHousings.length; y++) {
                            if ($scope.originalSiteHousings[y].housing_type_id == $scope.allHousingTypeList[ht].housing_type_id) {
                                $scope.allHousingTypeList[ht].selected = true;
                                y = $scope.originalSiteHousings.length; //ensures it doesn't set it as false after setting it as true
                            }
                            else {
                                $scope.allHousingTypeList[ht].selected = false;
                            }
                        }
                        if ($scope.originalSiteHousings.length === 0)
                            $scope.allHousingTypeList[ht].selected = false;
                    }

                }//end if thisSiteHousings != undefined

                //apply any site network names or types
                if (thisSiteStuff[3].length > 0) {
                    var projNNames = angular.copy(thisSiteStuff[3]);
                    //for each $scope.NetNameList .. add .selected property = true/false if thissitenetworknames ==
                    for (var a = 0; a < $scope.NetNameList.length; a++) {
                        for (var e = 0; e < projNNames.length; e++) {
                            if (projNNames[e].network_name_id == $scope.NetNameList[a].network_name_id) {
                                $scope.NetNameList[a].selected = true;
                                e = projNNames.length;
                            } else {
                                $scope.NetNameList[a].selected = false;
                            }                            
                        }
                        if (projNNames.length === 0)
                            $scope.NetNameList[a].selected = false;
                    }
                    if ($scope.NetNameList[0].selected === true) {
                        //make these match so rest get disabled
                        $scope.checked = "Not Defined";
                    }
                }//end if thisSiteNetworkNames != undefined

                if (thisSiteStuff[4].length > 0) {
                    var projNType = angular.copy(thisSiteStuff[4]);
                    //for each $scope.NetTypeList .. add .selected property = true/false if thissitenetworktypes ==
                    for (var ni = 0; ni < $scope.NetTypeList.length; ni++) {
                        for (var ny = 0; ny < projNType.length; ny++) {
                            if (projNType[ny].network_type_id == $scope.NetTypeList[ni].network_type_id) {
                                $scope.NetTypeList[ni].selected = true;
                                ny = projNType.length;
                            } else {
                                $scope.NetTypeList[ni].selected = false;
                            }                            
                        }
                        if (projNType.length === 0)
                            $scope.NetTypeList[ni].selected = false;
                    }
                }//end if thisSiteNetworkNames != undefined   
                $scope.s = { sOpen: false, sFileOpen: false }; //accordions
                //#endregion existing site 
            }
            else {
                //#region this is a NEW SITE CREATE (site == undefined)
                //get logged in member to make them creator
                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                $http.defaults.headers.common.Accept = 'application/json';
                MEMBER.query({ id: $cookies.get('mID') }, function success(response) {
                    $scope.aSite.Creator = response.fname + " " + response.lname;
                    $scope.aSite.member_id = response.member_id;
                    $scope.aSite.is_permanent_housing_installed = "No";
                    $scope.aSite.access_granted = "Not Needed";
                    //TODO: get member's id in there too
                }, function error(errorResponse) {
                    toastr.error("Error getting Member info: " + errorResponse.statusText);
                });
                $scope.s = { sOpen: true }; //accordions
                //#endregion this is a NEW SITE CREATE (site == undefined)
            }//end new site

            //  lat/long =is number
            $scope.isNum = function (evt) {
                var theEvent = evt || window.event;
                var key = theEvent.keyCode || theEvent.which;
                if (key != 46 && key != 45 && key > 31 && (key < 48 || key > 57)) {
                    theEvent.returnValue = false;
                    if (theEvent.preventDefault) theEvent.preventDefault();
                }
            };

            //multiselect one checked..
            $scope.HouseTypeClick = function (ht) {
                $scope.houseDirty = true; //they clicked it..used when post/put
                //add/remove house type and inputs to table row -- foreach on post or put will handle the rest
           
                //new site being created
                if (ht.selected === true) {
                    var houseT = { type_name: ht.type_name, housing_type_id: ht.housing_type_id, length: ht.length, material: ht.material, notes: ht.notes, amount: 1 };
                    $scope.siteHouseTypesTable.push(houseT);
                    $scope.showSiteHouseTable = true;
                }
                if (ht.selected === false) {
                    if ($scope.aSite.site_id !== undefined) {
                        var sH_ID = $scope.siteHouseTypesTable.filter(function (h) { return h.type_name == ht.type_name; })[0].site_housing_id;
                        $scope.siteHousesToRemove.push(sH_ID); //edit page, add site_housing_id to remove list for PUT
                    }
                    var i = $scope.siteHouseTypesTable.indexOf($scope.siteHouseTypesTable.filter(function (h) { return h.type_name == ht.type_name; })[0]);
                    $scope.siteHouseTypesTable.splice(i, 1);
                    if ($scope.siteHouseTypesTable.length === 0) {
                        $scope.showSiteHouseTable = false;
                    }
                }
            
            };

            // want to add a landowner contact
            $scope.showLandOwnerPart = function () {
                $scope.addLandowner = true;
            };

            //when state changes, update county list
            $scope.updateCountyList = function (s) {
                var thisState = $scope.StateList.filter(function (st) { return st.state_abbrev == s; })[0];
                $scope.stateCountyList = $scope.AllCountyList.filter(function (c) { return c.state_id == thisState.state_id; });
            };

            //cancel modal
            $scope.cancel = function () {
                $rootScope.stateIsLoading.showLoading = false; // loading..
                $uibModalInstance.dismiss('cancel');
            };

            //delete this Site
            $scope.deleteSite = function () {
                var thisSite = $scope.aSite;
                var dSiteModal = $uibModal.open({
                    template: '<div class="modal-header"><h3 class="modal-title">Delete Site</h3></div>' +
                        '<div class="modal-body"><p>Are you sure you want to delete site {{siteNo}}?</p></div>' +
                        '<div class="modal-footer"><button type="button" class="btn btn-danger" ng-click="deleteIt()">Delete</button><button type="button" class="btn btn-primary" ng-click="ok()">Cancel</button></div>',
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        $scope.siteNo = thisSite.site_no;
                        $scope.ok = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                        $scope.deleteIt = function () {
                            //delete the site and all things 
                            $uibModalInstance.close(thisSite);
                        };
                    }],
                    size: 'sm'
                });
                dSiteModal.result.then(function (s) {
                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                    SITE.delete({ id: s.site_id }).$promise.then(function () {
                        toastr.success("Site Removed");
                        var sendBack = "Deleted";
                        $uibModalInstance.close(sendBack);
                    }, function error(errorResponse) {
                        $uibModal.open({
                            template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                            '<div class="modal-body"><p>{{message}}</p></div>' +
                            '<div class="modal-footer"><button type="button" class="btn btn-primary" ng-click="ok()">Cancel</button></div>',
                            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                $scope.message = errorResponse.headers("usgswim-messages");
                                $scope.ok = function () {
                                    $uibModalInstance.dismiss('cancel');
                                };
                            }], size: 'sm'
                        });                       
                    });
                }, function () {
                    //logic for cancel
                });//end modal
            };

            $rootScope.stateIsLoading.showLoading = false;// loading..
        }]);
})();