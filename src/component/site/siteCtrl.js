(function () {
    'use strict';

    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('siteCtrl', ['$scope', '$state', '$rootScope', '$cookies', '$location', '$http', '$uibModal', '$filter', 'thisSite', 'latlong', 'thisSiteNetworkNames', 'thisSiteNetworkTypes', 'thisSiteHousings',
        'SITE', 'MEMBER', 'FILE_TYPE', 'AGENCY', 'allHorDatums', 'allHorCollMethods', 'allStates', 'allCounties', 'allDeployPriorities', 'allHousingTypes', 'allNetworkNames', 'allNetworkTypes', 'allDeployTypes', 'allSensorTypes',
        function ($scope, $state, $rootScope, $cookies, $location, $http, $uibModal, $filter, thisSite, latlong, thisSiteNetworkNames, thisSiteNetworkTypes, thisSiteHousings, SITE, MEMBER, FILE_TYPE, AGENCY, allHorDatums,
            allHorCollMethods, allStates, allCounties, allDeployPriorities, allHousingTypes, allNetworkNames, allNetworkTypes, allDeployTypes, allSensorTypes) {
            if ($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") {
                $scope.auth = false;
                $location.path('/login');
            } else {
                $rootScope.thisPage = "Site Dashboard";
                $scope.aSite = {};
                
                $scope.status = {
                    mapOpen: false, siteOpen: true, opOpen: false, sensorOpen: false, hwmOpen: false, filesOpen: false, peakOpen: false
                };
                $scope.thisSiteHouseTypeModel = []; //holder for when adding housing type to page from multiselect
            
                //open modal to edit or create a site
                $scope.openSiteCreate = function () {
                    $rootScope.stateIsLoading.showLoading = true; // loading..
                    var dropdownParts =[allHorDatums, allHorCollMethods, allStates, allCounties, allHousingTypes, allDeployPriorities,
                        allNetworkNames, allNetworkTypes, allDeployTypes, allSensorTypes];
                    var siteNNamesToPass =[]; //make sure only passing to edit those that are on this site (in case they edit, save, edit again)
                    if ($scope.siteNetworkNames !== undefined) {
                        for (var aNN = 0; aNN < allNetworkNames.length; aNN++) {
                            //if name matches any of the names in $scope.SiteNetworkNames, get the full network_name to pass to the modal
                            var i = $scope.siteNetworkNames.map(function (e) { return e; }).indexOf(allNetworkNames[aNN].name);
                            if (i > -1)
                                siteNNamesToPass.push(allNetworkNames[aNN]);
                        }
                    }
                    var siteNTypesToPass = []; //make sure only passing to edit those that are on this site (in case they edit, save, edit again)
                    if ($scope.siteNetworkTypes !== undefined) {
                        for (var aNT = 0; aNT < allNetworkTypes.length; aNT++) {
                            //if name matches any of the names in $scope.SiteNetworkNames, get the full network_name to pass to the modal
                            var a = $scope.siteNetworkTypes.map(function (e) { return e; }).indexOf(allNetworkTypes[aNT].network_type_name);
                            if (a > -1)
                                siteNTypesToPass.push(allNetworkTypes[aNT]);
                        }
                    }
                    //modal
                    var modalInstance = $uibModal.open({
                            templateUrl: 'SITEmodal.html',
                            controller: 'siteModalCtrl',
                            size: 'lg',
                            keyboard: false,
                            backdrop: 'static',
                            windowClass: 'rep-dialog',
                            resolve: {
                                allDropDownParts: function () {
                                    return dropdownParts;
                                },
                                thisSiteStuff: function () {
                                    if ($scope.aSite.site_id !== undefined) {
                                        var origSiteHouses = $scope.originalSiteHousings !== undefined ? $scope.originalSiteHousings : []; //needed for multi select to set prop selected
                                        var sHouseTypeModel = $scope.thisSiteHouseTypeModel.length > 0 ? $scope.thisSiteHouseTypeModel : []; //here's what the site already has
                                        var sNetNames = siteNNamesToPass.length > 0 ? siteNNamesToPass : [];
                                        var sNetTypes = siteNTypesToPass.length > 0 ? siteNTypesToPass : [];
                                        var lo = $scope.landowner !== undefined ? $scope.landowner : { };
                                        var siteRelatedStuff = [$scope.aSite, origSiteHouses, sHouseTypeModel, sNetNames, sNetTypes, lo];
                                    return siteRelatedStuff;
                                    }
                                },
                                fileTypes: function(){
                                        return FILE_TYPE.getAll().$promise;                                    
                                },
                                allMembers: function () {
                                    $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                                    $http.defaults.headers.common.Accept = 'application/json';
                                    return MEMBER.getAll().$promise;
                                },
                                agencyList: function(){
                                        return AGENCY.getAll().$promise;                                    
                                },
                                latlong: function () {
                                    if (latlong !== undefined) {
                                        return latlong;
                                    }
                                }
                        }
                    });
                    modalInstance.result.then(function (r) {
                        if (r !== 'Deleted') {
                            $scope.aSite = r[0];
                            $scope.aSite.HorizontalDatum = $scope.aSite.hdatum_id > 0 ? allHorDatums.filter(function (hd) { return hd.datum_id == $scope.aSite.hdatum_id; })[0].datum_name : "---";
                            $scope.aSite.HorizontalCollectMethod = $scope.aSite.hcollect_method_id !== undefined && $scope.aSite.hcollect_method_id > 0 ? allHorCollMethods.filter(function (hc) { return hc.hcollect_method_id == $scope.aSite.hcollect_method_id; })[0].hcollect_method : "---";
                            $scope.aSite.PriorityName = $scope.aSite.priority_id !== undefined && $scope.aSite.priority_id > 0 ? allDeployPriorities.filter(function (dp) { return dp.priority_id == $scope.aSite.priority_id; })[0].priority_name : "---";

                            $scope.siteNetworkNames = r[1];
                            $scope.siteNetworkTypes = r[2];
                        } else {
                            $scope.aSite = {};
                            $state.go('map');
                        }
                        $rootScope.stateIsLoading.showLoading = false; // loading..
                    });
                };

                // is this create new site or view existing??            
                if (thisSite !== undefined) {
                    //#region existingSite
                    if (thisSite.site_id !== undefined) {
                        $scope.aSite = thisSite;                  

                        $scope.aSite.decDegORdms = 'dd';
                        $scope.aSite.HorizontalDatum = $scope.aSite.hdatum_id > 0 ? allHorDatums.filter(function (hd) { return hd.datum_id == $scope.aSite.hdatum_id; })[0].datum_name : "---";
                        $scope.aSite.HorizontalCollectMethod = $scope.aSite.hcollect_method_id !== undefined && $scope.aSite.hcollect_method_id > 0 ? allHorCollMethods.filter(function (hc) { return hc.hcollect_method_id == $scope.aSite.hcollect_method_id; })[0].hcollect_method : "---";
                        $scope.aSite.PriorityName = $scope.aSite.priority_id !== undefined && $scope.aSite.priority_id > 0 ? allDeployPriorities.filter(function (dp) { return dp.priority_id == $scope.aSite.priority_id; })[0].priority_name: "---";
                   
                        //apply any site housings
                        if (thisSiteHousings.length > 0) {
                            $scope.originalSiteHousings = angular.copy(thisSiteHousings);
                            $scope.showSiteHouseTable = true;
                            //format for table
                            for (var z = 0; z < $scope.originalSiteHousings.length; z++) {
                                    //for each housingtypelist..make selected = true for these                       
                                var houseTypeName = allHousingTypes.filter(function (h) { return h.housing_type_id == $scope.originalSiteHousings[z].housing_type_id; })[0].type_name;
                                var houseT = {
                                    type_name: houseTypeName,
                                    housing_type_id : $scope.originalSiteHousings[z].housing_type_id,
                                    site_housing_id: $scope.originalSiteHousings[z].site_housing_id,
                                    length: $scope.originalSiteHousings[z].length,
                                    material: $scope.originalSiteHousings[z].material,
                                    notes: $scope.originalSiteHousings[z].notes,
                                    amount: $scope.originalSiteHousings[z].amount
                                };
                                $scope.thisSiteHouseTypeModel.push(houseT);
                            }
                        }//end if thisSiteHousings != undefined

                        //apply any site network names or types
                        $scope.siteNetworkNames = [];
                        if (thisSiteNetworkNames.length > 0) {
                            for (var a = 0; a < thisSiteNetworkNames.length; a++) {
                                var nn = allNetworkNames.filter(function (n) { return n.network_name_id == thisSiteNetworkNames[a].network_name_id; })[0];
                                $scope.siteNetworkNames.push(nn.name);
                            }
                        }
                        //apply any site network names or types
                        $scope.siteNetworkTypes = [];
                        if (thisSiteNetworkTypes.length > 0) {
                            for (var b = 0; b < thisSiteNetworkTypes.length; b++) {
                                var nt = allNetworkTypes.filter(function (nt) { return nt.network_type_id == thisSiteNetworkTypes[b].network_type_id; })[0];
                                $scope.siteNetworkTypes.push(nt.network_type_name);
                            }
                        }
                        if ($scope.aSite.sensor_not_appropriate !== undefined || $scope.aSite.sensor_not_appropriate > 0)
                            $scope.sensorNotAppr = "Yes";
                        else
                            $scope.sensorNotAppr = "No";


                        //get member name for display
                        if ($scope.aSite.member_id !== undefined && $scope.aSite.member_id > 0) {
                            $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                            $http.defaults.headers.common.Accept = 'application/json';
                            MEMBER.query({ id: $scope.aSite.member_id }).$promise.then(function (response) {
                                $scope.aSite.Creator = response.fname + " " + response.lname;
                            }, function (error) {
                                $scope.aSite.Creator = "Not recorded";
                            }).$promise;
                        } else $scope.aSite.Creator = "Not recorded";

                        //get the landownerCOntact with getCreds
                        if ($scope.aSite.landownercontact_id !== null && $scope.aSite.landownercontact_id !== undefined && $scope.aSite.landownercontact_id > 0) {
                            $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                            $http.defaults.headers.common.Accept = 'application/json';
                            SITE.getSiteLandOwner({ id: $scope.aSite.site_id }, function success(response) {
                                $scope.landowner = response;
                                $scope.addLandowner = true;
                            }, function error(errorResponse) {
                                toastr.error("Error getting Landowner Information: " + errorResponse.statusText);
                            }).$promise;
                        }//end if site has landownercontact id

                    } else {
                        //site != undefined but the site.site_id is == this site doesn't exist
                        toastr.error("This site does not exist");
                        $location.path('/Home').replace();
                        $scope.apply;
                    }
                        //#endregion existingSite
                } else {
                    //open modal if new site for create
                    $scope.openSiteCreate();
                }
            }//end else checkCreds is good
        }]);    
})();