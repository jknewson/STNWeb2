(function () {
    "use strict";
    var app = angular.module('app',
        ['ngResource', 'ui.router', 'ngCookies', 'ui.mask', 'ui.bootstrap', 'isteven-multi-select', 'ngInputModified', 'ui.validate', 'cgBusy',
            'angular.filter', 'xeditable', 'checklist-model', 'ngFileUpload', 'STNResource', 'ui.bootstrap.datetimepicker', 'leaflet-directive', 'ngHandsontable',
            'STNControllers', 'LogInOutController', 'ModalControllers', 'SettingsControllers', 'WiM.Services', 'WiM.Event', 'wim_angular', 'angularSpinners']);

    // ***** SWITCH BACK AND FORTH DEPENDING ON IF TEST OR PRODUCTION ***
    /* app.constant('SERVER_URL', 'https://stn.wim.usgs.gov/STNServices'); */ // PROD
    /* app.constant('SERVER_URL', 'https://stntest.wim.usgs.gov/STNServices2'); */ // TEST
    //app.constant('SERVER_URL', 'https://stnpseudoprod.wim.usgs.gov/STNServicesNew'); // TEST 2.0
    app.constant('SERVER_URL', 'http://localhost:53820');

    app.constant('ENVIRONMENT', 'Testing');
    //app.constant('ENVIRONMENT', 'Testing New Services');
    /* app.constant('ENVIRONMENT', 'Production'); */

    app.run(['$rootScope', '$uibModalStack', '$cookies', '$state', 'ENVIRONMENT', function ($rootScope, $uibModalStack, $cookies, $state, ENVIRONMENT) {
        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
            if (($cookies.get('STNCreds') === undefined || $cookies.get('STNCreds') === "") && toState.authenticate) {
                $rootScope.returnToState = toState.name;
                $rootScope.returnToStateParams = toParams.id;
                event.preventDefault();
                $state.go('entry');
            } else {
                $rootScope.stateIsLoading = { showLoading: true };
                //close all modals when changing states (site create open, want to use a nearby site or just change the url up top, close the modal too)
                $uibModalStack.dismissAll();

                if (toState.url == "/") {
                    //make username focus
                    $("#userNameFocus").focus();
                }
            }
            $rootScope.environment = ENVIRONMENT;
        });

        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams, error) {
            $rootScope.stateIsLoading.showLoading = false;
        });

        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
            $rootScope.stateIsLoading.showLoading = false;
            alert("Error occurred: Status" + error.status + ", " + error.statusText + ". The following request was unsuccessful: " + error.config.url + " Please refresh and try again.");
        });

    }]);
    //app.config(function that defines the config code. 'ui.select', 'ngSanitize','$locationProvider', $locationProvider
    app.config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {

            //if no active state, display state associated with this fragment identifier
            $urlRouterProvider.otherwise("/");

            //http://stackoverflow.com/questions/19721125/resolve-http-request-before-running-app-and-switching-to-a-route-or-state
            //http://stackoverflow.com/questions/22537311/angular-ui-router-login-authentication
            $stateProvider
                // entryPoint
                .state("entry", {
                    url: "/",
                    templateUrl: "component/main/mainView.html",
                    controller: "mainCtrl"
                })

                // map
                .state("map", {
                    url: "/Map",
                    views: {
                        '': {
                            controller: 'MapController',
                            templateUrl: "component/map/map.html"
                        },
                        'mapFilters@map': {
                            templateUrl: 'component/map/mapFilters.html',
                            controller: 'MapFiltersController',
                            resolve: {
                                s: 'STATE',
                                stateList: function (s) {
                                    return s.getAll().$promise;
                                },
                                sensT: 'SENSOR_TYPE',
                                sensorTypes: function (sensT) {
                                    return sensT.getAll().$promise;
                                },
                                netwN: 'NETWORK_NAME',
                                networkNames: function (netwN) {
                                    return netwN.getAll().$promise;
                                }
                            }
                        },
                        'mapSiteInfo@map': {
                            templateUrl: 'component/site/mapSiteInfoView.html',
                            controller: 'MapSiteInfoController'
                        },
                        'mapPeaksView@map': { templateUrl: 'component/peak/mapPeaksView.html', controller: 'MapPeaksController' },
                        'mapSensorPropose@map': {
                            templateUrl: 'component/sensor/mapSensorPropose.html',
                            resolve: {
                                dt: 'DEPLOYMENT_TYPE',
                                allDeployTypes: function (dt) {
                                    return dt.getAll().$promise;
                                },
                                sd: 'SENSOR_TYPE',
                                allSensDeps: function (sd) {
                                    return sd.getAll().$promise;
                                }
                            },
                            controller: 'MapSensorProposeController'
                        }
                    }
                })
                // approval page
                .state("approval", {
                    url: "/Approval",
                    templateUrl: "component/approval/approval.html",
                    controller: "approvalCtrl",
                    authenticate: true,
                    resolve: {
                        s: 'STATE',
                        stateList: function (s) {
                            return s.getAll().$promise;
                        },
                        c: 'COUNTIES',
                        countyList: function (c) {
                            return c.getAll().$promise;
                        },
                        i: 'INSTRUMENT',
                        instrumentList: function (i) {
                            return i.getAll().$promise;
                        },
                        st: 'SENSOR_TYPE',
                        allSensorTypes: function (st) {
                            return st.getAll().$promise;
                        },
                        dt: 'DEPLOYMENT_TYPE',
                        allDepTypes: function (dt) {
                            return dt.getAll().$promise;
                        },
                        hq: 'HWM_QUALITY',
                        hwmQualList: function (hq) {
                            return hq.getAll().$promise;
                        },
                        ht: 'HWM_TYPE',
                        hwmTypeList: function (ht) {
                            return ht.getAll().$promise;
                        }
                    }
                })
                // sitesSearch 
                .state("siteSearch", {
                    url: "/SiteSearch",
                    templateUrl: "component/siteSearch/siteSearch.html",
                    controller: "siteSearchCtrl",
                    authenticate: true,
                    resolve: {
                        s: 'STATE',
                        stateList: function (s) {
                            return s.getAll().$promise;
                        },
                        sensT: 'SENSOR_TYPE',
                        sensorTypes: function (sensT) {
                            return sensT.getAll().$promise;
                        },
                        netwN: 'NETWORK_NAME',
                        networkNames: function (netwN) {
                            return netwN.getAll().$promise;
                        }
                    }
                })
                // reporting
                .state("reporting", {
                    url: "/Reporting",
                    abstract: true,
                    templateUrl: "component/reporting/reporting.html",
                    controller: "reportingCtrl",
                    authenticate: true,
                    resolve: {
                        e: 'EVENT',
                        allEvents: function (e) {
                            return e.getAll().$promise;
                        },
                        state: 'STATE',
                        allStates: function (state) {
                            return state.getAll().$promise;
                        },
                        r: 'REPORT',
                        allReports: function (r) {
                            return r.getAll().$promise;
                        },
                        et: 'EVENT_TYPE',
                        allEventTypes: function (et) {
                            return et.getAll().$promise;
                        },
                        es: 'EVENT_STATUS',
                        allEventStatus: function (es) {
                            return es.getAll().$promise;
                        },
                        ag: 'AGENCY',
                        allAgencies: function (ag) {
                            return ag.getAll().$promise;
                        },
                        memberReports: function (r, $cookies) {
                            var mID = $cookies.get('mID');
                            return r.getMemberReports({ memberId: mID }).$promise;
                        }
                    }
                })

                // reporting.reportDash
                .state("reporting.reportDash", {
                    url: "/Dashboard",
                    templateUrl: "component/reporting/reportingDashboard.html",
                    controller: "reportingDashCtrl",
                    authenticate: true,
                    resolve: {
                        r: 'REPORT',
                        allReportsAgain: function (r) {
                            return r.getAll().$promise;
                        }
                    }
                })

                // reporting.SubmitReport
                .state("reporting.submitReport", {
                    url: "/SubmitReport",
                    templateUrl: "component/reporting/submitReport.html",
                    controller: "submitReportCtrl",
                    authenticate: true,
                })
                // reporting.GenerateReport
                .state("reporting.generateReport", {
                    url: "/GenerateReport",
                    templateUrl: "component/reporting/generateReport.html",
                    authenticate: true,
                })
                // settings 
                .state("settings", {
                    url: "/Settings",
                    templateUrl: "component/settings/settings.html",
                    controller: "settingsCtrl",
                    authenticate: true
                })

                // members
                .state("members", {
                    url: "/Members",
                    params: { id: null },
                    abstract: true,
                    template: "<div ui-view></div>",
                    controller: "memberCtrl",
                    authenticate: true,
                    resolve: {
                        r: 'ROLE',
                        allRoles: function (r) {
                            return r.getAll().$promise;
                        },
                        a: 'AGENCY',
                        allAgencies: function (a) {
                            return a.getAll().$promise;
                        },
                        userProfileId: function ($stateParams) {
                            if ($stateParams.id !== undefined)
                                return $stateParams.id;

                        }
                    }
                })

                // members.MembersList
                .state("members.MembersList", {
                    url: "/MembersList",
                    templateUrl: "component/member/membersList.html",
                    authenticate: true
                })

                // events
                .state("events", {
                    url: "/Events",
                    abstract: true,
                    template: "<div ui-view></div>",
                    controller: "eventCtrl",
                    authenticate: true,
                    resolve: {
                        e: 'EVENT',
                        allEvents: function (e) {
                            return e.getAll().$promise;
                        },
                        et: 'EVENT_TYPE',
                        allEventTypes: function (et) {
                            return et.getAll().$promise;
                        },
                        es: 'EVENT_STATUS',
                        allEventStats: function (es) {
                            return es.getAll().$promise;
                        },
                        m: 'MEMBER',
                        allCoordMembers: function (m, $http, $cookies) {
                            $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                            $http.defaults.headers.common.Accept = 'application/json';
                            return m.getRoleMembers({ roleId: 1 }).$promise;
                        }
                    }
                })

                // events.EventsList
                .state("events.EventsList", {
                    url: "/EventsList",
                    templateUrl: "component/event/eventsList.html",
                    authenticate: true
                })
                // events.EventInfof
                .state("events.EventInfo", {
                    url: "/eventInfo/:id",
                    templateUrl: "component/event/eventInfo.html",
                    controller: "eventInfoCtrl",
                    authenticate: true,
                    resolve: {
                        e: 'EVENT',
                        thisEvent: function (e, $stateParams) {
                            var eventId = $stateParams.id;
                            if (eventId > 0) {
                                return e.query(
                                    { id: eventId }).$promise;
                            }
                        }
                    }
                })
                // resources    
                .state("resources", {
                    url: "/Resources",
                    abstract: true,
                    template: "<div ui-view></div>",
                    controller: "resourcesCtrl",
                    authenticate: true,
                    resolve: {
                        state: 'STATE',
                        allStates: function (state) {
                            return state.getAll().$promise;
                        },
                        ag: 'AGENCY',
                        allAgencies: function (ag) {
                            return ag.getAll().$promise;
                        },
                        c: 'CONTACT_TYPE',
                        allContactTypes: function (c) {
                            return c.getAll().$promise;
                        },
                        d: 'DEPLOYMENT_PRIORITY',
                        allDeployPriorities: function (d) {
                            return d.getAll().$promise;
                        },
                        es: 'EVENT_STATUS',
                        allEventStats: function (es) {
                            return es.getAll().$promise;
                        },
                        et: 'EVENT_TYPE',
                        allEventTypes: function (et) {
                            return et.getAll().$promise;
                        },
                        ft: 'FILE_TYPE',
                        allFileTypes: function (ft) {
                            return ft.getAll().$promise;
                        },
                        hcm: 'HORIZONTAL_COLL_METHODS',
                        allHorCollMethods: function (hcm) {
                            return hcm.getAll().$promise;
                        },
                        hd: 'HORIZONTAL_DATUM',
                        allHorDatums: function (hd) {
                            return hd.getAll().$promise;
                        },
                        ht: 'HOUSING_TYPE',
                        allHouseTypes: function (ht) {
                            return ht.getAll().$promise;
                        },
                        hq: 'HWM_QUALITY',
                        allHWMqualities: function (hq) {
                            return hq.getAll().$promise;
                        },
                        hwmT: 'HWM_TYPE',
                        allHWMtypes: function (hwmT) {
                            return hwmT.getAll().$promise;
                        },
                        icc: 'INST_COLL_CONDITION',
                        allInstCollectConditions: function (icc) {
                            return icc.getAll().$promise;
                        },
                        m: 'MARKER',
                        allMarkers: function (m) {
                            return m.getAll().$promise;
                        },
                        nn: 'NETWORK_NAME',
                        allNetworkNames: function (nn) {
                            return nn.getAll().$promise;
                        },
                        opq: 'OP_QUALITY',
                        allObjPtQualities: function (opq) {
                            return opq.getAll().$promise;
                        },
                        opt: 'OP_TYPE',
                        allObjPtTypes: function (opt) {
                            return opt.getAll().$promise;
                        },
                        sb: 'SENSOR_BRAND',
                        allSensorBrands: function (sb) {
                            return sb.getAll().$promise;
                        },
                        dt: 'DEPLOYMENT_TYPE',
                        allDeploymentTypes: function (dt) {
                            return dt.getAll().$promise;
                        },
                        sstat: 'STATUS_TYPE',
                        allStatusTypes: function (sstat) {
                            return sstat.getAll().$promise;
                        },
                        st: 'SENSOR_TYPE',
                        allSensorTypes: function (st) {
                            return st.getAll().$promise;
                        },
                        nt: 'NETWORK_TYPE',
                        allNetworkTypes: function (nt) {
                            return nt.getAll().$promise;
                        },
                        vcm: 'VERTICAL_COLL_METHOD',
                        allVerticalCollMethods: function (vcm) {
                            return vcm.getAll().$promise;
                        },
                        vd: 'VERTICAL_DATUM',
                        allVerticalDatums: function (vd) {
                            return vd.getAll().$promise;
                        }
                    }
                })

                // resources.ResourcesList
                .state("resources.ResourcesList", {
                    url: "/ResourcesList",
                    templateUrl: "component/resources/resourcesList.html",
                    authenticate: true
                })

                // all lookup htmls
                .state("resources.ResourcesList.agency", {
                    url: "/Agencies",
                    templateUrl: "component/resources/agency.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.ContactType", {
                    url: "/ContactTypes",
                    templateUrl: "component/resources/contactType.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.DepPriority", {
                    url: "/DeploymentPriorities",
                    templateUrl: "component/resources/deploymentPriority.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.EventStatus", {
                    url: "/EventStatus",
                    templateUrl: "component/resources/eventStatus.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.EventType", {
                    url: "/EventTypes",
                    templateUrl: "component/resources/eventType.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.FileType", {
                    url: "/FileTypes",
                    templateUrl: "component/resources/fileType.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.HorCollMethd", {
                    url: "/HorizontalCollMethods",
                    templateUrl: "component/resources/horizontalCollectionMethod.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.HorDatum", {
                    url: "/HorizontalDatums",
                    templateUrl: "component/resources/horizontalDatum.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.HousingType", {
                    url: "/HousingTypes",
                    templateUrl: "component/resources/housingType.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.HWMQual", {
                    url: "/HWMQualities",
                    templateUrl: "component/resources/hwmQuality.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.HWMType", {
                    url: "/HWMTypes",
                    templateUrl: "component/resources/hwmType.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.InstrCollCondition", {
                    url: "/InstrCollConditions",
                    templateUrl: "component/resources/instrumentCollectionCondition.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.Marker", {
                    url: "/Markers",
                    templateUrl: "component/resources/marker.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.NetworkNames", {
                    url: "/NetworkNames",
                    templateUrl: "component/resources/networkNames.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.OPquality", {
                    url: "/ObjPointQualities",
                    templateUrl: "component/resources/objectivePointQuality.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.OPType", {
                    url: "/ObjPointType",
                    templateUrl: "component/resources/objectivePointType.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.SensorBrand", {
                    url: "/SensorBrands",
                    templateUrl: "component/resources/sensorBrand.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.SenDepType", {
                    url: "/SensorDeploymentTypes",
                    templateUrl: "component/resources/deploymentType.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.StatusType", {
                    url: "/StatusTypes",
                    templateUrl: "component/resources/statusType.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.SensorType", {
                    url: "/SensorTypes",
                    templateUrl: "component/resources/sensorType.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.NetworkType", {
                    url: "/NetworkTypes",
                    templateUrl: "component/resources/networkType.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.VertCollMethod", {
                    url: "/VerticalCollMethods",
                    templateUrl: "component/resources/verticalCollectionMethod.html",
                    authenticate: true
                })
                .state("resources.ResourcesList.VertDatum", {
                    url: "/VerticalDatums",
                    templateUrl: "component/resources/verticalDatum.html",
                    authenticate: true
                })

                // bulk hwm adjustment page                                 
                .state("bulkHWMAdj", {
                    url: "/BulkHWM_adjustments",
                    templateUrl: "component/hwm/bulkHWMAdj.html",
                    authenticate: true,
                    controller: "bulkHWMAdjCtrl",
                    resolve: {
                        e: 'EVENT',
                        eventList: function (e) {
                            return e.getAll().$promise;
                        },
                        s: 'STATE',
                        stateList: function (s) {
                            return s.getAll().$promise;
                        },
                        c: 'COUNTIES',
                        countyList: function (c) {
                            return c.getAll().$promise;
                        }
                    }
                })

                // bulk hwm adjustment page                                 
                .state("bulkHWM", {
                    url: "/HistoricHWM_Upload",
                    templateUrl: "component/hwm/bulkHWM.html",
                    authenticate: true,
                    controller: "bulkHWMCtrl",
                    resolve: {
                        e: 'EVENT',
                        eventList: function (e) {
                            return e.getAll().$promise;
                        },
                        s: 'STATE',
                        stateList: function (s) {
                            return s.getAll().$promise;
                        },
                        c: 'COUNTIES',
                        countyList: function (c) {
                            return c.getAll().$promise;
                        },
                        ht: 'HWM_TYPE',
                        hwmTypeList: function (ht) {
                            return ht.getAll().$promise;
                        },
                        m: 'MARKER',
                        markerList: function (m) {
                            return m.getAll().$promise;
                        },
                        hq: 'HWM_QUALITY',
                        hwmQualList: function (hq) {
                            return hq.getAll().$promise;
                        },
                        hd: 'HORIZONTAL_DATUM',
                        horizDatumList: function (hd) {
                            return hd.getAll().$promise;
                        },
                        hcm: 'HORIZONTAL_COLL_METHODS',
                        horCollMethList: function (hcm) {
                            return hcm.getAll().$promise;
                        },
                        vd: 'VERTICAL_DATUM',
                        vertDatumList: function (vd) {
                            return vd.getAll().$promise;
                        },
                        vcm: 'VERTICAL_COLL_METHOD',
                        vertCollMethList: function (vcm) {
                            return vcm.getAll().$promise;
                        },
                        f: 'FILE_TYPE',
                        fileTypesList: function (f) {
                            return f.getAll().$promise;
                        },
                        a: 'AGENCY',
                        agenciesList: function (a) {
                            return a.getAll().$promise;
                        },
                    }
                })

                // site (abstract)
                .state("site", {
                    url: "/Site/:id",
                    abstract: true,
                    params: {
                        id: null,
                        latitude: { value: null, squash: true },
                        longitude: { value: null, squash: true }
                    },
                    templateUrl: "component/site/site.html",
                    authenticate: true,
                    controller: ['$scope', '$stateParams', 'Site_Script', function ($scope, $stateParams, Site_Script ) { // 'runningScript' runningScript
                        $scope.siteID = $stateParams.id;
                        /* if ($scope.siteID != "0") Site_Script.setIsScriptRunning(runningScript.value);
                        else Site_Script.setIsScriptRunning("false"); */
                    }],
                    resolve: {
                        // site stuff
                        s: 'SITE',
                        /* runningScript: function (s, $stateParams) {
                            if ($stateParams.id > 0) {
                                return s.sensorScriptRunning({ id: $stateParams.id }).$promise;
                            }
                        }, */ // not longer using scripts integrated in STNServices
                        thisSite: function (s, $stateParams) {
                            if ($stateParams.id > 0) {
                                return s.query({ id: $stateParams.id }).$promise;
                            }
                        },
                        latlong: function ($stateParams) {
                            if ($stateParams.latitude) {
                                var latlongarray = [$stateParams.latitude, $stateParams.longitude];
                                return latlongarray;
                            }
                        },
                        thisSiteNetworkNames: function (s, $stateParams) {
                            if ($stateParams.id > 0) {
                                return s.getSiteNetworkNames({ id: $stateParams.id }).$promise;
                            }
                        },
                        thisSiteNetworkTypes: function (s, $stateParams) {
                            if ($stateParams.id > 0) {
                                return s.getSiteNetworkTypes({ id: $stateParams.id }).$promise;
                            }
                        },
                        thisSiteHousings: function (s, $stateParams) {
                            if ($stateParams.id > 0) {
                                return s.getSiteHousings({ id: $stateParams.id }).$promise;
                            }
                        },
                        thisSiteOPs: function (s, $stateParams) {
                            if ($stateParams.id > 0) {
                                return s.getSiteOPs({ id: $stateParams.id }).$promise;
                            }
                        },
                        thisSiteSensors: function (s, $stateParams) {
                            if ($stateParams.id > 0) {
                                return s.getSiteSensors({ id: $stateParams.id }).$promise;
                            }
                        },
                        thisSiteHWMs: function (s, $stateParams, $http, $cookies) {
                            if ($stateParams.id > 0) {
                                $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                                $http.defaults.headers.common.Accept = 'application/json';
                                return s.getSiteHWMs({ id: $stateParams.id }).$promise;
                            }
                        },
                        thisSiteFiles: function (s, $stateParams) {
                            if ($stateParams.id > 0) {
                                return s.getSiteFiles({ id: $stateParams.id }).$promise;
                            }
                        },
                        thisSitePeaks: function (s, $stateParams) {
                            if ($stateParams.id > 0) {
                                return s.getSitePeaks({ id: $stateParams.id }).$promise;
                            }
                        },
                        hd: 'HORIZONTAL_DATUM',
                        allHorDatums: function (hd) {
                            return hd.getAll().$promise;
                        },
                        hcm: 'HORIZONTAL_COLL_METHODS',
                        allHorCollMethods: function (hcm) {
                            return hcm.getAll().$promise;
                        },
                        st: 'STATE',
                        allStates: function (st) {
                            return st.getAll().$promise;
                        },
                        c: 'COUNTIES',
                        allCounties: function (c) {
                            return c.getAll().$promise;
                        },
                        ht: 'HOUSING_TYPE',
                        allHousingTypes: function (ht) {
                            return ht.getAll().$promise;
                        },
                        nn: 'NETWORK_NAME',
                        allNetworkNames: function (nn) {
                            return nn.getAll().$promise;
                        },
                        nt: 'NETWORK_TYPE',
                        allNetworkTypes: function (nt) {
                            return nt.getAll().$promise;
                        },
                        dt: 'DEPLOYMENT_TYPE',
                        allDeployTypes: function (dt) {
                            return dt.getAll().$promise;
                        },
                        dp: 'DEPLOYMENT_PRIORITY',
                        allDeployPriorities: function (dp) {
                            return dp.getAll().$promise;
                        },
                        // op stuff                        
                        opt: 'OP_TYPE',
                        allOPTypes: function (opt) {
                            return opt.getAll().$promise;
                        },
                        vertDats: 'VERTICAL_DATUM',
                        allVertDatums: function (vertDats) {
                            return vertDats.getAll().$promise;
                        },
                        vertColMet: 'VERTICAL_COLL_METHOD',
                        allVertColMethods: function (vertColMet) {
                            return vertColMet.getAll().$promise;
                        },
                        opQual: 'OP_QUALITY',
                        allOPQualities: function (opQual) {
                            return opQual.getAll().$promise;
                        },
                        // sensor stuff
                        e: 'EVENT',
                        allEvents: function (e) {
                            return e.getAll().$promise;
                        },
                        sent: 'SENSOR_TYPE',
                        allSensorTypes: function (sent) {
                            return sent.getAll().$promise;
                        },
                        sb: 'SENSOR_BRAND',
                        allSensorBrands: function (sb) {
                            return sb.getAll().$promise;
                        },
                        // hwm stuff
                        hwmt: 'HWM_TYPE',
                        allHWMTypes: function (hwmt) {
                            return hwmt.getAll().$promise;
                        },
                        hq: 'HWM_QUALITY',
                        allHWMQualities: function (hq) {
                            return hq.getAll().$promise;
                        },
                        m: 'MARKER',
                        allMarkers: function (m) {
                            return m.getAll().$promise;
                        },
                        // file
                        ft: 'FILE_TYPE',
                        allFileTypes: function (ft) {
                            return ft.getAll().$promise;
                        },
                        a: 'AGENCY',
                        allAgencies: function (a) {
                            return a.getAll().$promise;
                        }
                    }
                })

                // site.info
                .state("site.dashboard", {
                    url: "/SiteDashboard",
                    authenticate: true,
                    views: {
                        'siteNo': {
                            controller: ['$scope', '$cookies', 'thisSite', function ($scope, $cookies, thisSite) {
                                if (thisSite !== undefined)
                                    $scope.SiteNo = thisSite.site_no;
                                // watch for the session event to change and update
                                $scope.$watch(function () { return $cookies.get('SessionEventName'); }, function (newValue) {
                                    $scope.sessionEvent = $cookies.get('SessionEventName') !== null && $cookies.get('SessionEventName') !== undefined ? $cookies.get('SessionEventName') : "All Events";
                                });
                            }],
                            template: '<div><h2 style="margin-top:0">Site {{SiteNo}} - For {{sessionEvent}}</h2></div><hr />'
                        },
                        'aMap': {
                            controller: 'siteMapCtrl',
                            templateUrl: 'component/site/siteMapView.html',
                            resolve: {
                                aSite: function (thisSite) {
                                    if (thisSite !== undefined) {
                                        return thisSite;
                                    }
                                },
                                dt: 'DEPLOYMENT_TYPE',
                                deploymentTypes: function (thisSite, dt) {
                                    if (thisSite !== undefined) return dt.getAll().$promise;
                                },
                                s: 'SITE',
                                siteHWMs: function (thisSite, s) {
                                    if (thisSite !== undefined) {
                                        return s.getSiteHWMs({ id: thisSite.site_id }).$promise;
                                    }
                                },
                                i: 'INSTRUMENT',
                                baroSensors: function (thisSite, i) {
                                    if (thisSite !== undefined) {
                                        return i.getSensorView({ ViewType: 'baro_view' }).$promise;
                                    }
                                },
                                metSensors: function (thisSite, i) {
                                    if (thisSite !== undefined) {
                                        return i.getSensorView({ ViewType: 'met_view' }).$promise;
                                    }
                                },
                                rdgSensors: function (thisSite, i) {
                                    if (thisSite !== undefined) {
                                        return i.getSensorView({ ViewType: 'rdg_view' }).$promise;
                                    }
                                },
                                stormSensors: function (thisSite, i) {
                                    if (thisSite !== undefined) {
                                        return i.getSensorView({ ViewType: 'stormtide_view' }).$promise;
                                    }
                                },
                                waveSensors: function (thisSite, i) {
                                    if (thisSite !== undefined) {
                                        return i.getSensorView({ ViewType: 'waveheight_view' }).$promise;
                                    }
                                },
                                presTempSensors: function (thisSite, i) {
                                    if (thisSite !== undefined) {
                                        return i.getSensorView({ ViewType: 'pressuretemp_view' }).$promise;
                                    }
                                },
                                thermSensors: function (thisSite, i) {
                                    if (thisSite !== undefined) {
                                        return i.getSensorView({ ViewType: 'therm_view' }).$promise;
                                    }
                                },
                                webcamSensors: function (thisSite, i) {
                                    if (thisSite !== undefined) {
                                        return i.getSensorView({ ViewType: 'webcam_view' }).$promise;
                                    }
                                },
                                raingageSensors: function (thisSite, i) {
                                    if (thisSite !== undefined) {
                                        return i.getSensorView({ ViewType: 'raingage_view' }).$promise;
                                    }
                                }
                            }
                        },
                        'aSite': {
                            controller: 'siteCtrl',
                            templateUrl: 'component/site/siteInfoView.html'
                        },
                        'op': {
                            controller: 'objectivePointCtrl',
                            templateUrl: 'component/objectivePoint/objectivePointList.html'
                        },
                        'sensor': {
                            controller: 'sensorCtrl',
                            templateUrl: 'component/sensor/sensorList.html'
                        },
                        'hwm': {
                            controller: 'hwmCtrl',
                            templateUrl: 'component/hwm/hwmList.html'
                        },
                        'file': {
                            controller: 'fileCtrl',
                            templateUrl: 'component/file/fileList.html'
                        },
                        'peak': {
                            controller: 'peakCtrl',
                            templateUrl: 'component/peak/peakList.html'

                        }
                    }
                })

                // QuickHWM page
                .state("quickCreate", {
                    url: "/QuickCreate/:id",
                    templateUrl: "component/site/quickCreate.html",
                    controller: "quickCreateCtrl",
                    authenticate: true,
                    resolve: {
                        whichQuick: function ($stateParams) {
                            return $stateParams.id;
                        },
                        // site stuff                        
                        hd: 'HORIZONTAL_DATUM',
                        allHorDatums: function (hd) {
                            return hd.getAll().$promise;
                        },
                        hcm: 'HORIZONTAL_COLL_METHODS',
                        allHorCollMethods: function (hcm) {
                            return hcm.getAll().$promise;
                        },
                        st: 'STATE',
                        allStates: function (st) {
                            return st.getAll().$promise;
                        },
                        c: 'COUNTIES',
                        allCounties: function (c) {
                            return c.getAll().$promise;
                        },
                        // op stuff                        
                        opt: 'OP_TYPE',
                        allOPTypes: function (opt) {
                            return opt.getAll().$promise;
                        },
                        vertDats: 'VERTICAL_DATUM',
                        allVertDatums: function (vertDats) {
                            return vertDats.getAll().$promise;
                        },
                        vertColMet: 'VERTICAL_COLL_METHOD',
                        allVertColMethods: function (vertColMet) {
                            return vertColMet.getAll().$promise;
                        },
                        opQual: 'OP_QUALITY',
                        allOPQualities: function (opQual) {
                            return opQual.getAll().$promise;
                        },
                        // hwm stuff (if id='hwm')
                        hwmt: 'HWM_TYPE',
                        allHWMTypes: function (hwmt, $stateParams) {
                            if ($stateParams.id == 'HWM') return hwmt.getAll().$promise;
                        },
                        hq: 'HWM_QUALITY',
                        allHWMQualities: function (hq, $stateParams) {
                            if ($stateParams.id == 'HWM') return hq.getAll().$promise;
                        },
                        m: 'MARKER',
                        allMarkers: function (m, $stateParams) {
                            if ($stateParams.id == 'HWM') return m.getAll().$promise;
                        },
                        // sensor stuff
                        dt: 'DEPLOYMENT_TYPE',
                        allDeployTypes: function (dt) {
                            return dt.getAll().$promise;
                        },
                        e: 'EVENT',
                        allEvents: function (e, $stateParams) {
                            if ($stateParams.id == 'Sensor') return e.getAll().$promise;
                        },
                        sent: 'SENSOR_TYPE',
                        allSensorTypes: function (sent, $stateParams) {
                            if ($stateParams.id == 'Sensor') return sent.getAll().$promise;
                        },
                        sb: 'SENSOR_BRAND',
                        allSensorBrands: function (sb, $stateParams) {
                            if ($stateParams.id == 'Sensor') return sb.getAll().$promise;
                        },
                        ht: 'HOUSING_TYPE',
                        allHousingTypes: function (ht) {
                            return ht.getAll().$promise;
                        }
                    }
                });

            //this causes issues with Status404 Not found on component/main/mainView.html
            //$locationProvider.html5Mode({
            //    enabled: true,
            //    requireBase: false
            //});
        }
    ]);
}());
