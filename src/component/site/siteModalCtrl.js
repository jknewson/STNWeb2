(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var ModalControllers = angular.module('ModalControllers');
    ModalControllers.controller('siteModalCtrl', ['$scope', '$cookies', '$location', '$state', '$http', '$timeout', '$uibModal', '$uibModalInstance', '$filter', 'allDropDownParts', 'thisSiteStuff', 'SITE', 'SITE_HOUSING', 'MEMBER', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'LANDOWNER_CONTACT', siteModalCtrl]);
function siteModalCtrl($scope, $cookies, $location, $state, $http, $timeout, $uibModal, $uibModalInstance, $filter, allDropDownParts, thisSiteStuff, SITE, SITE_HOUSING, MEMBER, INSTRUMENT, INSTRUMENT_STATUS, LANDOWNER_CONTACT) {
        //dropdowns
        $scope.HorizontalDatumList = allDropDownParts[0];
        $scope.HorCollMethodList = allDropDownParts[1];
        $scope.StateList = allDropDownParts[2];
        $scope.AllCountyList = allDropDownParts[3];
        $scope.stateCountyList = [];
        $scope.HousingTypeList = allDropDownParts[4];
        $scope.DepPriorityList = allDropDownParts[5]
        $scope.NetNameList = allDropDownParts[6];
        $scope.NetTypeList = allDropDownParts[7];
        $scope.ProposedSens = allDropDownParts[8];
        $scope.SensorDeployment = allDropDownParts[9];

        //globals 
        $scope.addedHouseType = [];
        $scope.aSite = {};
        $scope.aSite.decDegORdms = 'dd';
        $scope.DMS = {}; //holder of deg min sec values
        $scope.originalSiteHousings = [];
        $scope.checked = ""; $scope.checkedName = "Not Defined"; //comparers for disabling network names if 'Not Defined' checked
        $scope.landowner = {};
        $scope.addLandowner = false; //hide landowner fields
        $scope.disableSensorParts = false; //toggle to disable/enable sensor housing installed and add proposed sensor
        $scope.showSiteHouseTable = false;
        $scope.addedHouseType = []; //holder for when adding housing type to page from multiselect
        $scope.siteHousesModel = {};
        //$scope.LOCATION = { Latitude: '28.206323', Longitude: '-80.650249' };
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
        }

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
        }

        //they changed radio button for dms dec deg
        $scope.latLongChange = function () {
            if ($scope.aSite.decDegORdms == "dd") {
                //they clicked Dec Deg..
                if ($scope.DMS.LADeg != undefined) {
                    //convert what's here for each lat and long
                    $scope.aSite.LATITUDE_DD = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                    $scope.aSite.LONGITUDE_DD = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                    var test;
                }
            } else {
                //they clicked dms (convert lat/long to dms)
                if ($scope.aSite.LATITUDE_DD != undefined) {
                    var latDMS = (deg_to_dms($scope.aSite.LATITUDE_DD)).toString();
                    var ladDMSarray = latDMS.split(':');
                    $scope.DMS.LADeg = ladDMSarray[0];
                    $scope.DMS.LAMin = ladDMSarray[1];
                    $scope.DMS.LASec = ladDMSarray[2];

                    var longDMS = deg_to_dms($scope.aSite.LONGITUDE_DD);
                    var longDMSarray = longDMS.split(':');
                    $scope.DMS.LODeg = longDMSarray[0] * -1;
                    $scope.DMS.LOMin = longDMSarray[1];
                    $scope.DMS.LOSec = longDMSarray[2];
                    var test;
                }
            }
        }

        //networkName check event.. if "Not Defined" chosen, disable the other 2 checkboxes
        $scope.whichOne = function (n) {
            if (n.NAME == "Not Defined" && n.selected == true) {
                //they checked "not defined"
                for (var nn = 0; nn < $scope.NetNameList.length; nn++) {
                    //unselect all but not defined
                    if ($scope.NetNameList[nn].NAME != "Not Defined")
                        $scope.NetNameList[nn].selected = false;
                }
                //make these match so rest get disabled
                $scope.checked = "Not Defined";
            }
            //they they unchecked not define, unmatch vars so the other become enabled
            if (n.NAME == "Not Defined" && n.selected == false)
                $scope.checked = "";
        };

        //toggle dim on div for sensor not appropriate click
        $scope.dimAction = function () {
            if ($scope.aSite.SENSOR_NOT_APPROPRIATE == 1) {
                $scope.disableSensorParts = true;
                //clear radio and checkboxes if disabling
                for (var x = 0; x < $scope.ProposedSens.length; x++) {
                    $scope.ProposedSens[x].selected = false;
                }
                $scope.aSite.IS_PERMANENT_HOUSING_INSTALLED = "No";
            } else {
                $scope.disableSensorParts = false;
            }
        };

        if (thisSiteStuff != undefined) {
            //#region existing site 
            //$scope.aSite[0], $scope.originalSiteHousings[1], $scope.addedHouseType[2], thisSiteNetworkNames[3], siteNetworkTypes[4], $scope.landowner[5]
            //testing angular.copy -- when hitting cancel after making changes in the modal, those changes still affect the scope aSite in the dashboard
            $scope.aSite = angular.copy(thisSiteStuff[0]);            
            //if this site is not appropriate for sensor, dim next 2 fields
            if ($scope.aSite.SENSOR_NOT_APPROPRIATE > 0) {
                $scope.disableSensorParts = true;
                //clear radio and checkboxes if disabling
                for (var x = 0; x < $scope.ProposedSens.length; x++) {
                    $scope.ProposedSens[x].selected = false;
                }
                $scope.aSite.IS_PERMANENT_HOUSING_INSTALLED = "No";
            }

            //update countiesList with this state's counties
            var thisState = $scope.StateList.filter(function (s) { return s.STATE_ABBREV == $scope.aSite.STATE; })[0];
            $scope.stateCountyList = $scope.AllCountyList.filter(function (c) { return c.STATE_ID == thisState.STATE_ID; });

            //apply any site housings for EDIT
            if (thisSiteStuff[1].length > 0) {
                //var test = ;
                $scope.originalSiteHousings = thisSiteStuff[1];
                $scope.showSiteHouseTable = true;
                $scope.addedHouseType = thisSiteStuff[2];
                $scope.landowner = thisSiteStuff[5];
                $scope.addLandowner = $scope.landowner.FNAME != undefined || $scope.landowner.LNAME != undefined || $scope.landowner.ADDRESS != undefined || $scope.landowner.PRIMARYPHONE != undefined ? true : false;

                //go through HousingTypeList and add selected Property.
                for (var i = 0; i < $scope.HousingTypeList.length; i++) {
                    //for each one, if thisSiteHousings has this id, add 'selected:true' else add 'selected:false'
                    for (var y = 0; y < $scope.originalSiteHousings.length; y++) {
                        if ($scope.originalSiteHousings[y].HOUSING_TYPE_ID == $scope.HousingTypeList[i].HOUSING_TYPE_ID) {
                            $scope.HousingTypeList[i].selected = true;
                            y = $scope.originalSiteHousings.length; //ensures it doesn't set it as false after setting it as true
                        }
                        else {
                            $scope.HousingTypeList[i].selected = false;
                        }
                    }
                    if ($scope.originalSiteHousings.length == 0)
                        $scope.HousingTypeList[i].selected = false;
                }

            }//end if thisSiteHousings != undefined

            //apply any site network names or types
            if (thisSiteStuff[3].length > 0) {
                //for each $scope.NetNameList .. add .selected property = true/false if thissitenetworknames ==
                for (var a = 0; a < $scope.NetNameList.length; a++) {
                    for (var e = 0; e < thisSiteStuff[3].length; e++) {
                        if (thisSiteStuff[3][e].NETWORK_NAME_ID == $scope.NetNameList[a].NETWORK_NAME_ID) {
                            $scope.NetNameList[a].selected = true;
                            e = thisSiteStuff[3].length;
                        } else {
                            $scope.NetNameList[a].selected = false;
                        }
                        if (thisSiteStuff[3].length == 0)
                            $scope.NetNameList[a].selected = false;
                    }
                }
                if ($scope.NetNameList[0].selected = true) {
                    //make these match so rest get disabled
                    $scope.checked = "Not Defined";
                }
            }//end if thisSiteNetworkNames != undefined

            if (thisSiteStuff[4].length > 0) {
                //for each $scope.NetTypeList .. add .selected property = true/false if thissitenetworktypes ==
                for (var ni = 0; ni < $scope.NetTypeList.length; ni++) {
                    for (var ny = 0; ny < thisSiteStuff[4].length; ny++) {
                        if (thisSiteStuff[4][ny].NETWORK_TYPE_ID == $scope.NetTypeList[ni].NETWORK_TYPE_ID) {
                            $scope.NetTypeList[ni].selected = true;
                            ny = thisSiteStuff[4].length;
                        } else {
                            $scope.NetTypeList[ni].selected = false;
                        }
                        if (thisSiteStuff[4].length == 0)
                            $scope.NetTypeList[ni].selected = false;
                    }
                }
            }//end if thisSiteNetworkNames != undefined

            //site PUT
            $scope.save = function (valid) {
                if (valid == true) {
                    $(".page-loading").removeClass("hidden");
                    //update the site
                    $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common['Accept'] = 'application/json';
                    //did they add or edit the landowner
                    if ($scope.addLandowner == true) {
                        //there's a landowner.. edit or add?
                        if ($scope.aSite.LANDOWNERCONTACT_ID != null) {
                            //put
                            LANDOWNER_CONTACT.update({ id: $scope.aSite.LANDOWNERCONTACT_ID }, $scope.landowner).$promise.then(function () {
                                PUTsite();
                            });
                        } else if ($scope.landowner.FNAME != undefined || $scope.landowner.LNAME != undefined || $scope.landowner.TITLE != undefined ||
                                $scope.landowner.ADDRESS != undefined || $scope.landowner.CITY != undefined || $scope.landowner.PRIMARYPHONE != undefined) {
                            //they added something.. POST (rather than just clicking button and not)
                            LANDOWNER_CONTACT.save($scope.landowner, function success(response) {
                                $scope.aSite.LANDOWNERCONTACT_ID = response.LANDOWNERCONTACTID;
                                PUTsite();
                            }, function error(errorResponse) { toastr.error("Error adding Landowner: " + errorResponse.statusText); });
                        } else {
                            PUTsite();
                        }
                    } else {
                        PUTsite();
                    }
                }
            };//end save

            var PUTsite = function () {                
                SITE.update({ id: $scope.aSite.SITE_ID }, $scope.aSite, function success(response) {
                    toastr.success("Site updated");
                    //update site housings (remove them all and add what's here) //did they add one? did they remove one? did they edit one?                                  
                    for (var sh = 0; sh < $scope.originalSiteHousings.length; sh++) {
                        SITE_HOUSING.delete({ id: $scope.originalSiteHousings[sh].SITE_HOUSING_ID }, $scope.originalSiteHousings[sh]).$promise;
                    }//end for each old sitehouse (delete)

                    //clear this out after deleting all of them;
                    setTimeout(function () { $scope.originalSiteHousings = []; }, 3000);
                    //now POST if any
                    for (var siteh = 0; siteh < $scope.addedHouseType.length; siteh++) {
                        SITE.postSiteHousing({ id: $scope.aSite.SITE_ID }, $scope.addedHouseType[siteh], function success(okResponse) {
                            var i = siteh;
                            $scope.originalSiteHousings.push($scope.addedHouseType[i]);
                        }, function error(errorR) {
                            $(".page-loading").addClass("hidden");
                            var notsuccessful;
                        }).$promise;
                    }//end foreach newsitehousings (post)

                    //update site networkNames (delete all and re-add)
                    for (var nn = 0; nn < $scope.NetNameList.length; nn++) {
                        if ($scope.NetNameList[nn].selected == true) {
                            //post it (if it's there already, it won't do anything)
                            var NNtoAdd = { NETWORK_NAME_ID: $scope.NetNameList[nn].NETWORK_NAME_ID, NAME: $scope.NetNameList[nn].NAME };
                            SITE.postSiteNetworkName({ id: $scope.aSite.SITE_ID }, NNtoAdd, function success(responseSNNames) {
                                var nothingNeeded;
                            }, function error(errorResponse) {
                                toastr.error("Error: " + errorResponse.statusText);
                            }).$promise;
                        } else {
                            //delete it
                            $http.defaults.headers.common['X-HTTP-Method-Override'] = 'DELETE';
                            var NNtoDelete = { NETWORK_NAME_ID: $scope.NetNameList[nn].NETWORK_NAME_ID, NAME: $scope.NetNameList[nn].NAME };
                            SITE.deleteSiteNetworkName({ id: $scope.aSite.SITE_ID }, NNtoDelete).$promise;
                            delete $http.defaults.headers.common['X-HTTP-Method-Override'];
                        }
                    }//end for each NetNameList

                    //update site networkTypes (delete all and re-add)
                    for (var nt = 0; nt < $scope.NetTypeList.length; nt++) {
                        if ($scope.NetTypeList[nt].selected == true) {
                            //post it (if it's there already, it won't do anything)
                            var NTtoAdd = { NETWORK_TYPE_ID: $scope.NetTypeList[nt].NETWORK_TYPE_ID, NETWORK_TYPE_NAME: $scope.NetTypeList[nt].NETWORK_TYPE_NAME };
                            SITE.postSiteNetworkType({ id: $scope.aSite.SITE_ID }, NTtoAdd, function success(responseSNTypes) {
                                var nothingNeeded;
                            }, function error(errorResponse) {
                                toastr.error("Error: " + errorResponse.statusText);
                            }).$promise;
                        } else {
                            //delete it
                            $http.defaults.headers.common['X-HTTP-Method-Override'] = 'DELETE';
                            var NTtoDelete = { NETWORK_TYPE_ID: $scope.NetTypeList[nt].NETWORK_TYPE_ID, NETWORK_TYPE_NAME: $scope.NetTypeList[nt].NETWORK_TYPE_NAME };
                            SITE.deleteSiteNetworkType({ id: $scope.aSite.SITE_ID }, NTtoDelete).$promise;
                            delete $http.defaults.headers.common['X-HTTP-Method-Override'];
                        }
                    } //end for each NetTypeList
                }, function error(errorResponse) {
                    toastr.error("Error updating Site: " + errorResponse.statusText);
                }).$promise.then(function () {
                    $uibModalInstance.close($scope.aSite);
                    $(".page-loading").addClass("hidden");
                    $location.path('/Site/' + $scope.aSite.SITE_ID + '/SiteDashboard').replace();//.notify(false);
                    $scope.apply;
                });//end SITE.save(...
            }; // end PUTsite()
            //#endregion existing site 
        }
        else {
            //#region this is a NEW SITE CREATE (site == undefined)
            //get logged in member to make them creator
            $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookies.get('STNCreds');
            $http.defaults.headers.common['Accept'] = 'application/json';
            MEMBER.query({ id: $cookies.get('mID') }, function success(response) {
                $scope.aSite.Creator = response.FNAME + " " + response.LNAME;
                $scope.aSite.MEMBER_ID = response.MEMBER_ID;
                $scope.aSite.IS_PERMANENT_HOUSING_INSTALLED = "No";
                $scope.aSite.ACCESS_GRANTED = "Not Needed";
                //TODO: get member's id in there too
            }, function error(errorResponse) {
                toastr.error("Error getting Member info: " + errorResponse.statusText);
            });

            //create this site clicked
            $scope.create = function (valid) {
                if (valid == true) {
                    $(".page-loading").removeClass("hidden");
                    //POST landowner, if they added one
                    $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookies.get('STNCreds');
                    $http.defaults.headers.common['Accept'] = 'application/json';
                    delete $scope.aSite.Creator;
                    if ($scope.addLandowner == true) {
                        if ($scope.landowner.FNAME != undefined || $scope.landowner.LNAME != undefined || $scope.landowner.TITLE != undefined ||
                                       $scope.landowner.ADDRESS != undefined || $scope.landowner.CITY != undefined || $scope.landowner.PRIMARYPHONE != undefined) {
                            LANDOWNER_CONTACT.save($scope.landowner, function success(response) {
                                $scope.aSite.LANDOWNERCONTACT_ID = response.LANDOWNERCONTACTID;
                                //now post the site
                                postSite();
                            }, function error(errorResponse) {
                                $(".page-loading").addClass("hidden");
                                toastr.error("Error posting landowner: " + errorResponse.statusText);
                            });
                        } else {
                            postSite();
                        }
                    } else {
                        postSite();
                    }
                } 
            };

            var postSite = function () {
                //make sure longitude is < 0, otherwise * (-1),
                var createdSiteID = 0;
                if ($scope.aSite.LONGITUDE_DD > 0)
                    $scope.aSite.LONGITUDE_DD = $scope.aSite.LONGITUDE_DD * (-1);
                //POST site
                SITE.save($scope.aSite, function success(response) {
                    createdSiteID = response.SITE_ID;
                    //POST site_HouseTypes 
                    for (var ht = 0; ht < $scope.addedHouseType.length; ht++) {
                        $scope.addedHouseType[ht].SITE_ID = createdSiteID;
                        delete $scope.addedHouseType[ht].TYPE_NAME;
                        //now post it
                        SITE.postSiteHousing({ id: createdSiteID }, $scope.addedHouseType[ht], function success(houseResponse) {
                            toastr.success("Site Housing Added");
                        }, function error(errorResponse) {
                            $(".page-loading").removeClass("hidden");
                            toastr.error("Error added Site Housing: " + errorResponse.statusText);
                        }).$promise;
                    }//end foreach addedHouseType
                    //now go deal with networkNames and networkTypes
                    POSTnetworks(createdSiteID);

                }, function error(errorResponse) {
                    toastr.error("Error creating Site: " + errorResponse.statusText);
                });
            };

            var POSTnetworks = function (newSiteId) {
                //POST site_NetworkNames
                //loop through $scope.NetNameList for selected == true --post each
                for (var nn = 0; nn < $scope.NetNameList.length; nn++) {
                    if ($scope.NetNameList[nn].selected == true) {
                        //post it
                        var siteNetName = { NETWORK_NAME_ID: $scope.NetNameList[nn].NETWORK_NAME_ID, NAME: $scope.NetNameList[nn].NAME };
                        SITE.postSiteNetworkName({ id: newSiteId }, siteNetName, function success(netNameResponse) {
                            toastr.success("Site Network Name added");
                        }, function error(errorResponse) {
                            $(".page-loading").removeClass("hidden");
                            toastr.error("Error adding Network Name: " + errorResponse.statusText);
                        }).$promise;
                    }//end if selected
                }//end for each netnamelist

                //POST site_NetworkTypes 
                //loop through $scope.NetTypeList for selected == true --post each
                for (var nt = 0; nt < $scope.NetTypeList.length; nt++) {
                    if ($scope.NetTypeList[nt].selected == true) {
                        //post it
                        var siteNetType = { NETWORK_TYPE_ID: $scope.NetTypeList[nt].NETWORK_TYPE_ID, NETWORK_TYPE_NAME: $scope.NetTypeList[nt].NETWORK_TYPE_NAME };
                        SITE.postSiteNetworkType({ id: newSiteId }, siteNetType, function success(netTypeResponse) {
                            toastr.success("Site Network Type added");
                        }, function error(errorResponse) {
                            $(".page-loading").removeClass("hidden");
                            toastr.error("Error adding Network Type: " + errorResponse.statusText);
                        }).$promise;
                    }//end if selected
                }//end for each nettypelist

                //see if they checked any proposed sensors and POST those 
                if ($scope.disableSensorParts == false) {
                    for (var ps = 0; ps < $scope.ProposedSens.length; ps++) {
                        if ($scope.ProposedSens[ps].selected == true) {
                            //POST it
                            var sensorTypeID = $scope.SensorDeployment.filter(function (sd) { return sd.DEPLOYMENT_TYPE_ID == $scope.ProposedSens[ps].DEPLOYMENT_TYPE_ID; })[0].SENSOR_TYPE_ID;
                            var inst = { DEPLOYMENT_TYPE_ID: $scope.ProposedSens[ps].DEPLOYMENT_TYPE_ID, SITE_ID: newSiteId, SENSOR_TYPE_ID: sensorTypeID };
                            INSTRUMENT.save(inst, function success(instResponse) {
                                //INSTRUMENT_STATUS (INSTRUMENT_ID, STATUS_TYPE_ID =4, COLLECTION_TEAM_ID = memberID)
                                var instStat = { INSTRUMENT_ID: instResponse.INSTRUMENT_ID, STATUS_TYPE_ID: 4, COLLECTION_TEAM_ID: $scope.aSite.MEMBER_ID };
                                INSTRUMENT_STATUS.save(instStat, function success(insStatResponse) {
                                    toastr.success("Proposed Sensor Added");
                                }, function error(errorResponse) {
                                    $(".page-loading").removeClass("hidden");
                                    toastr.error("Error adding Proposed Sensor");
                                }).$promise;
                            }).$promise;
                        }//end if selected == true
                    }//end for each proposedSens
                } //end if sensor parts aren't disabled
                //now update page
                $timeout(function () {
                    $uibModalInstance.dismiss('cancel');
                    $(".page-loading").addClass("hidden");
                    $location.path('/Site/' + newSiteId + '/SiteDashboard').replace();//.notify(false);
                    $scope.apply;
                }, 3000);
            }; //end POSTnetworks

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
            //add/remove house type and inputs to table row                
            if (ht.selected == true) {
                var houseT = { TYPE_NAME: ht.TYPE_NAME, HOUSING_TYPE_ID: ht.HOUSING_TYPE_ID, LENGTH: ht.LENGTH, MATERIAL: ht.MATERIAL, NOTES: ht.NOTES, AMOUNT: 1 };
                $scope.addedHouseType.push(houseT);
                $scope.showSiteHouseTable = true;
            }
            if (ht.selected == false) {
                var i = $scope.addedHouseType.indexOf($scope.addedHouseType.filter(function (h) { return h.TYPE_NAME == ht.TYPE_NAME; })[0]);
                $scope.addedHouseType.splice(i, 1);
                if ($scope.addedHouseType.length == 0) {
                    $scope.showSiteHouseTable = false;
                }
            }
        };

        //get address parts and existing sites 
        $scope.getAddress = function () {
            var geocoder = new google.maps.Geocoder(); //reverse address lookup
            var latlng = new google.maps.LatLng($scope.aSite.LATITUDE_DD, $scope.aSite.LONGITUDE_DD);
            geocoder.geocode({ 'latLng': latlng }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    //parse the results out into components ('street_number', 'route', 'locality', 'administrative_area_level_2', 'administrative_area_level_1', 'postal_code'
                    var address_components = results[0].address_components;
                    var components = {};
                    $.each(address_components, function (k, v1) {
                        $.each(v1.types, function (k2, v2) {
                            components[v2] = v1.long_name;
                        });
                    });

                    $scope.aSite.ADDRESS = components.street_number != undefined ? components.street_number + " " + components.route : components.route;
                    $scope.aSite.CITY = components.locality;

                    var thisState = $scope.StateList.filter(function (s) { return s.STATE_NAME == components.administrative_area_level_1; })[0];
                    if (thisState != undefined) {
                        $scope.aSite.STATE = thisState.STATE_ABBREV;
                        $scope.stateCountyList = $scope.AllCountyList.filter(function (c) { return c.STATE_ID == thisState.STATE_ID; });
                        $scope.aSite.COUNTY = components.administrative_area_level_2;
                        $scope.aSite.ZIP = components.postal_code;
                        //see if there are any sites within a 0.0005 buffer of here for them to use instead
                        SITE.query({ Latitude: $scope.aSite.LATITUDE_DD, Longitude: $scope.aSite.LONGITUDE_DD, Buffer: 0.0005 }, function success(response) {
                            var closeSites = response.Sites;

                            //modal for showing # of sites near                  
                            var modalInstance = $uibModal.open({
                                template: '<div class="modal-header"><h3 class="modal-title">Sites nearby</h3></div>' +
                                           '<div class="modal-body"><p>There are: {{num}} sites nearby.</p>' +
                                           '<p ng-if="num > 0"><span>To use one of these sites instead, click on the site name.</span>' +
                                           '<ul><li ng-repeat="s in siteListNear" style="list-style:none"><a ui-sref="site.dashboard({id: s.SITE_ID})" ng-click="$close()">{{s.SITE_NO}}</a></li></ul></p></div>' +
                                           '<div class="modal-footer"><button class="btn btn-primary" ng-click="ok()">OK</button></div>',
                                controller: function ($scope, $uibModalInstance) {
                                    $scope.ok = function () {
                                        $uibModalInstance.close();
                                    }
                                    $scope.num = closeSites.length;
                                    $scope.siteListNear = closeSites;
                                },
                                size: 'sm'
                            });
                            modalInstance.result.then(function () {
                                $(".page-loading").addClass("hidden");
                            });
                            // alert("Number of nearby Sites: " + closeSites.length);
                        }, function error(errorResponse) {
                            toastr.error("Error: " + errorResponse.statusText);
                        }).$promise;
                    } else {
                        toastr.error("The Latitude/Longitude did not return a location within the U.S.");
                    }
                } else {
                    toastr.error("There was an error getting address. Please try again.");
                }
            });
        };

        // want to add a landowner contact
        $scope.showLandOwnerPart = function () {
            $scope.addLandowner = true;
        };

        //when state changes, update county list
        $scope.updateCountyList = function (s) {
            var thisState = $scope.StateList.filter(function (st) { return st.STATE_ABBREV == s; })[0];
            $scope.stateCountyList = allCounties.filter(function (c) { return c.STATE_ID == thisState.STATE_ID; });
        };

        //cancel modal
        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

    }

})();