(function () {
    "use strict";

    //look up common service module, and register the new factory with that module 
    var STNResource = angular.module('STNResource', ['ngResource']);

    // ***** SWITCH BACK AND FORTH DEPENDING ON IF TEST OR PRODUCTION ***
    /* var rootURL = "https://stn.wim.usgs.gov/STNServices"; */
    // var rootURL = "https://stntest.wim.usgs.gov/STNServices2";
    // var rootURL = "https://stntest.wim.usgs.gov/STNServices2";
    var rootURL = "http://localhost:53820";

    // GEOCODE https://geocoding.geo.census.gov/geocoder/geographies/coordinates?benchmark=4&vintage=4&format=json
    STNResource.factory('GEOCODE', ['$resource', function ($resource) {
        return $resource(rootURL + '/Geocode/location',
            {}, {
                getAddressParts: { method: 'GET', params: { Latitude: '@Latitude', Longitude: '@Longitude' } } //y=28.35975&x=-81.421988
            });
    }]);
    // AGENCY
    STNResource.factory('AGENCY', ['$resource', function ($resource) {
        return $resource(rootURL + '/Agencies/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // CONTACT_TYPE
    STNResource.factory('CONTACT_TYPE', ['$resource', function ($resource) {
        return $resource(rootURL + '/ContactTypes/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // CONTACT
    STNResource.factory('CONTACT', ['$resource', function ($resource) {
        return $resource(rootURL + '/Contacts/:id',
            {}, {
                query: {},
                getContactModel: { method: 'GET', isArray: true },
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // COUNTIES
    STNResource.factory('COUNTIES', ['$resource', function ($resource) {
        return $resource(rootURL + '/Counties/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // DATA_FILE
    STNResource.factory('DATA_FILE', ['$resource', function ($resource) {
        return $resource(rootURL + '/DataFiles/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                getDFApproval: { method: 'GET', cache: false, isArray: false, url: rootURL + '/DataFiles/:id/Approval' },
                getUnapprovedDFs: { method: 'GET', isArray: true, cache: false }, //?IsApproved={approved}&Event={eventId}&Counties={counties}&State={state}
                getEventDataView: { method: 'GET', isArray: true, cache: false, url: rootURL + '/DataFileView?EventId=:eventId' },
                runStormScript: { method: 'GET', url: rootURL + '/DataFiles/RunStormScript?SeaDataFileID=:seaDFID&AirDataFileID=:airDFID&Hertz=:hertz&DaylightSavings=:daylightSavings&Username=:username' },
                runAirScript: { method: 'GET', url: rootURL + '/DataFiles/RunAirScript?AirDataFileID=:airDFID&DaylightSavings=:daylightSavings&Username=:username' },
                runChopperScript: { method: 'POST', url: rootURL + '/Files/RunChopperScript', headers: { 'Content-Type': undefined }, transformRequest: angular.identity, cache: false, isArray: false }, //?SensorId=:sensorId&FileName=:fileName
                approveDF: { method: 'POST', cache: false, isArray: false, params: { id: '@id' }, url: rootURL + '/datafiles/:id/Approve' }, //posts an APPROVAL, updates the data file with approval_id and returns APPROVAL
                approveNWISDF: { method: 'POST', cache: false, isArray: false, params: { id: '@id' }, url: rootURL + '/datafiles/:id/NWISApprove' }, //posts an APPROVAL (using EventCoord), updates the data file with approval_id and returns APPROVAL
                unApproveDF: { method: 'DELETE', cache: false, isArray: false, url: rootURL + '/datafiles/:id/Unapprove' }, //posts an APPROVAL, updates the datafile with approval_id and returns APPROVAL
                stormScript: { method: 'GET', cache: false, isArray: false, url: rootURL + '/DataFiles/RunScript?SeaDataFileID=:seaDataFileId&AirDataFileID=:airDataFileId&Hertz=:hertz&Username=username' },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // DEPLOYMENT_PRIORITY
    STNResource.factory('DEPLOYMENT_PRIORITY', ['$resource', function ($resource) {
        return $resource(rootURL + '/DeploymentPriorities/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // DEPLOYMENT_TYPE
    STNResource.factory('DEPLOYMENT_TYPE', ['$resource', function ($resource) {
        return $resource(rootURL + '/DeploymentTypes/:id',
            {}, {
                query: {},
                getDepSensType: { method: 'GET', isArray: false, url: rootURL + '/DeploymentTypes/:id/SensorType' },
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // EVENT
    STNResource.factory('EVENT', ['$resource', function ($resource) {
        return $resource(rootURL + '/Events/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                getEventSites: { method: 'GET', isArray: true, url: rootURL + '/Events/:id/Sites' },
                getFilteredEvents: { method: 'GET', isArray: true, url: rootURL + '/Events/FilteredEvents' }, //?Date: null, Type: 0, State: null
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // EVENT_STATUS
    STNResource.factory('EVENT_STATUS', ['$resource', function ($resource) {
        return $resource(rootURL + '/EventStatus/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // EVENT_TYPE
    STNResource.factory('EVENT_TYPE', ['$resource', function ($resource) {
        return $resource(rootURL + '/EventTypes/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // FILE    
    STNResource.factory('FILE', ['$resource', function ($resource) {
        return $resource(rootURL + '/Files/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                getFileItem: { method: 'GET', isArray: false, url: rootURL + '/Files/:id/Item' },
                getTESTdata: { method: 'GET', url: rootURL + '/Files/testDataFile' },
                update: { method: 'PUT', cache: false, isArray: false },
                uploadFile: { method: 'POST', url: rootURL + '/Files/bytes', headers: { 'Content-Type': undefined }, transformRequest: angular.identity, cache: false, isArray: false },
                downloadZip: {
                    method: 'GET', responseType: 'arraybuffer', cache: false, url: rootURL + '/Events/:eventId/EventFileItems'
                },//?HWMFiles={hwmFiles}&HWMFileType={hwmFileTypes}&SensorFiles={sensorFiles}&SensorFileTypes={sensorFileTypes}"
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // photoFileStamp
    STNResource.factory('FILE_STAMP', ['$rootScope', function ($rootScope) {
        //need to update the ng-src on photo files if one changes, update the stamp part of the image to refresh the link        
        return {
            getStamp: function () {
                var stamp = '?' + new Date().getTime();
                return stamp;
            },
            setStamp: function () {
                var stamp = '?' + new Date().getTime();
                $rootScope.$broadcast('fileStampSet', stamp);
            }
        };
    }]);
    // FILE_TYPE
    STNResource.factory('FILE_TYPE', ['$resource', function ($resource) {
        return $resource(rootURL + '/FileTypes/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // HORIZONTAL_COLL_METHODS
    STNResource.factory('HORIZONTAL_COLL_METHODS', ['$resource', function ($resource) {
        return $resource(rootURL + '/HorizontalMethods/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // HORIZONTAL_DATUM
    STNResource.factory('HORIZONTAL_DATUM', ['$resource', function ($resource) {
        return $resource(rootURL + '/HorizontalDatums/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // HOUSING_TYPE
    STNResource.factory('HOUSING_TYPE', ['$resource', function ($resource) {
        return $resource(rootURL + '/HousingTypes/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // HWM
    STNResource.factory('HWM', ['$resource', function ($resource) {
        return $resource(rootURL + '/hwms/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                getEventStateHWMs: { method: 'GET', isArray: true, url: rootURL + '/Events/:eventId/stateHWMs?State=:state' },
                getEventSiteHWMs: { method: 'GET', isArray: true, url: rootURL + '/Sites/:siteId/EventHWMs' },//?Event=:eventId
                getFilteredHWMs: { method: 'GET', isArray: true, url: rootURL + '/HWMs/FilteredHWMs' }, //Event={eventIds}&EventType={eventTypeIDs}&EventStatus={eventStatusID}&States={states}&County={counties}&HWMType={hwmTypeIDs}&HWMQuality={hwmQualIDs}&HWMEnvironment={hwmEnvironment}&SurveyComplete={surveyComplete}&StillWater={stillWater}
                getUnapprovedHWMs: { method: 'GET', isArray: true, cache: false }, //IsApproved={'true'/'false'}&Event={eventId}&Member={memberId}&State={state}
                getHWMApproval: { method: 'GET', cache: false, isArray: false, url: rootURL + '/hwms/:id/Approval' },
                approveHWM: { method: 'POST', cache: false, isArray: false, params: { id: '@id' }, url: rootURL + '/hwms/:id/Approve' }, //posts an APPROVAL, updates the HWM with approval_id and returns APPROVAL
                unApproveHWM: { method: 'DELETE', cache: false, isArray: false, url: rootURL + '/hwms/:id/Unapprove' }, //posts an APPROVAL, updates the HWM with approval_id and returns APPROVAL
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // HWM_Service
    STNResource.factory('HWM_Service', [function () {
        //when hwm is created or deleted, this gets updated so that filesCtrl will update it's list of siteHWMs
        var allSiteHWMs = []; var bulkSearch = {};
        return {
            getAllSiteHWMs: function () {
                return allSiteHWMs;
            },
            setAllSiteHWMs: function (sh) {
                allSiteHWMs = sh;
            },
            setBulkHWMSearch: function (searchTerms) {
                bulkSearch = searchTerms;
            },
            getBulkHWMSearch: function () {
                return bulkSearch;
            }

        };
    }]);
    // HWM_QUALITY
    STNResource.factory('HWM_QUALITY', ['$resource', function ($resource) {
        return $resource(rootURL + '/HWMQualities/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // HWM_TYPE
    STNResource.factory('HWM_TYPE', ['$resource', function ($resource) {
        return $resource(rootURL + '/HWMTypes/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // INSTRUMENT
    STNResource.factory('INSTRUMENT', ['$resource', function ($resource) {
        return $resource(rootURL + '/Instruments/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                getSensorView: { method: 'GET', isArray: true, url: rootURL + '/SensorViews' }, //?ViewType={}&Event={}
                getstatusInstruments: { method: 'GET', isArray: true, url: rootURL + '/Instruments' }, //CurrentStatus: 1, Event: $scope.evID 
                getFullInstrument: { method: 'GET', url: rootURL + '/Instruments/:id/FullInstrument' }, //gets instrument and it's stats together
                getInstrumentStatus: { method: 'GET', url: rootURL + '/Instruments/:id/InstrumentStatus' },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // Instrument_Service
    STNResource.factory('Instrument_Service', [function () {
        //when hwm is created or deleted, this gets updated so that filesCtrl will update it's list of siteHWMs
        var allSiteSensors = [];
        return {
            getAllSiteSensors: function () {
                return allSiteSensors;
            },
            setAllSiteSensors: function (ss) {
                allSiteSensors = ss;
            }
        };
    }]);
    // INSTRUMENT_STATUS
    STNResource.factory('INSTRUMENT_STATUS', ['$resource', function ($resource) {
        return $resource(rootURL + '/InstrumentStatus/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // INST_COLL_CONDITION
    STNResource.factory('INST_COLL_CONDITION', ['$resource', function ($resource) {
        return $resource(rootURL + '/InstrCollectConditions/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // LANDOWNER_CONTACT
    STNResource.factory('LANDOWNER_CONTACT', ['$resource', function ($resource) {
        return $resource(rootURL + '/LandOwners/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // Map_Site
    STNResource.factory('Map_Site', ['SITE', '$rootScope', '$cookies', function (SITE, $rootScope, $cookies) {
        var MapSiteParts = [];

        return {
            getMapSiteParts: function () {
                return MapSiteParts;
            },
            setMapSiteParts: function (siteId) {
                MapSiteParts = [];
                SITE.query({ id: siteId }).$promise.then(function (response) {
                    MapSiteParts.push(response);
                    SITE.getSitePeaks({ id: siteId }).$promise.then(function (pResponse) {
                        MapSiteParts.push(pResponse);
                        $rootScope.$broadcast('mapSiteClickResults', MapSiteParts);
                    }, function (errorResponse) {
                        if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting site peak: " + errorResponse.headers(["usgswim-messages"]));
                        else toastr.error("Error getting site peak: " + errorResponse.statusText);
                    });
                }, function (errorResponse) {
                    if (errorResponse.headers(["usgswim-messages"]) !== undefined) toastr.error("Error getting site: " + errorResponse.headers(["usgswim-messages"]));
                    else toastr.error("Error getting site: " + errorResponse.statusText);
                });
            }
        };
    }]);
    // Map_filter
    STNResource.factory('Map_Filter', ['$rootScope', function ($rootScope) {
        var filteredSites = [];

        return {
            // getFilteredSites: function () {
            //     return filteredSites;
            // },
            setFilteredSites: function (sitesArray) {
                filteredSites = sitesArray;
                $rootScope.$broadcast('filterSitesClick', filteredSites);
            }
        };
    }]);
    // MARKER
    STNResource.factory('MARKER', ['$resource', function ($resource) {
        return $resource(rootURL + '/Markers/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // MEMBER
    STNResource.factory('MEMBER', ['$resource', function ($resource) {
        return $resource(rootURL + '/Members/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                getRoleMembers: { method: 'GET', isArray: true, url: rootURL + '/Roles/:roleId/Members' },
                getEventPeople: { method: 'GET', isArray: true, url: rootURL + '/Events/:Eventid/Members' },

                changePW: { method: 'GET', isArray: false, url: rootURL + '/Members' },
                addMember: { method: 'POST', cache: false, isArray: false, url: rootURL + '/Members/:pass/addMember' },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                deleteMember: { method: 'DELETE', cache: false, isArray: false, url: rootURL + '/Members/:id' }
            });
    }]);
    // NETWORK_NAME
    STNResource.factory('NETWORK_NAME', ['$resource', function ($resource) {
        return $resource(rootURL + '/NetworkNames/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // NETWORK_TYPE
    STNResource.factory('NETWORK_TYPE', ['$resource', function ($resource) {
        return $resource(rootURL + '/NetworkTypes/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // OBJECTIVE_POINT
    STNResource.factory('OBJECTIVE_POINT', ['$resource', function ($resource) {
        return $resource(rootURL + '/ObjectivePoints/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                getOPFiles: { method: 'GET', isArray: true, url: rootURL + "/ObjectivePoints/:id/Files" },
                getOPControls: { method: 'GET', cache: false, isArray: true, url: rootURL + "/ObjectivePoints/:id/OPControls.json" },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // OP_CONTROL_IDENTIFIER
    STNResource.factory('OP_CONTROL_IDENTIFIER', ['$resource', function ($resource) {
        return $resource(rootURL + '/OPControlIdentifiers/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // OP_MEASURE
    STNResource.factory('OP_MEASURE', ['$resource', function ($resource) {
        return $resource(rootURL + '/OPMeasurements/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                getInstStatOPMeasures: { method: 'GET', isArray: true, url: rootURL + '/InstrumentStatus/:instrumentStatusId/OPMeasurements' },
                getDatumLocationOPMeasures: { method: 'GET', isArray: true, url: rootURL + '/ObjectivePoints/:objectivePointId/OPMeasurements' },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // OP_QUALITY
    STNResource.factory('OP_QUALITY', ['$resource', function ($resource) {
        return $resource(rootURL + '/ObjectivePointQualities/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // OP_TYPE
    STNResource.factory('OP_TYPE', ['$resource', function ($resource) {
        return $resource(rootURL + '/OPTypes/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // PEAK
    STNResource.factory('PEAK', ['$resource', function ($resource) {
        return $resource(rootURL + '/PeakSummaries/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                getPeakSummaryDFs: { method: 'GET', isArray: true, cache: false, url: rootURL + '/PeakSummaries/:id/DataFiles' },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // REPORT
    STNResource.factory('REPORT', ['$resource', function ($resource) {
        return $resource(rootURL + '/ReportingMetrics/:id',
            {}, {
                query: {},
                getReportByEvSt: { method: 'GET', isArray: true },
                getDailyReportTots: { method: 'GET', url: rootURL + '/ReportingMetrics/DailyReportTotals' },
                getMemberReports: { method: 'GET', isArray: true, url: rootURL + '/Members/:memberId/Reports' },
                getFilteredReports: { method: 'GET', isArray: true, url: rootURL + '/ReportingMetrics/FilteredReports' },
                getReportwithContacts: { method: 'GET', isArray: true, url: rootURL + '/ReportResource/FilteredReportModel' },
                getReportsCSV: { method: 'GET', url: rootURL + '/ReportingMetrics/FilteredReports.csv' },
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                addReportContact: { method: 'POST', cache: false, isArray: false, params: { ReportId: '@reportId', ContactTypeId: '@contactTypeId' }, url: rootURL + '/ReportingMetrics/:reportId/AddContactType/:contactTypeId' }, //contact entity in body 
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // ROLE
    STNResource.factory('ROLE', ['$resource', function ($resource) {
        return $resource(rootURL + '/Roles/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true }
            });
    }]);
    // SENSOR_BRAND
    STNResource.factory('SENSOR_BRAND', ['$resource', function ($resource) {
        return $resource(rootURL + '/SensorBrands/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // SENSOR_DEPLOYMENT --- no longer needed since SENSOR_TYPE returns as this relationship now
    //STNResource.factory('SENSOR_DEPLOYMENT', ['$resource', function ($resource) {
    //    return $resource(rootURL + '/SensorDeployments/:id',
    //        {}, {
    //            query: {},
    //            getAll: { method: 'GET', isArray: true },               
    //            update: { method: 'PUT', cache: false, isArray: false },
    //            save: { method: 'POST', cache: false, isArray: false },
    //            delete: { method: 'DELETE', cache: false, isArray: false }
    //        });
    //}]);

    // SENSOR_TYPE
    STNResource.factory('SENSOR_TYPE', ['$resource', function ($resource) {
        return $resource(rootURL + '/SensorTypes/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true }, //this returns sensortypes with list of deploymenttypes for each one
                getSensorDeploymentTypes: { method: 'GET', isArray: true, url: rootURL + '/SensorTypes/:id/DeploymentTypes' },
                addSensorDeploymentType: { method: 'POST', cache: false, isArray: true, params: { sensorTypeId: '@sensorTypeId', DeploymentTypeId: '@deploymentTypeId' }, url: rootURL + '/SensorTypes/:sensorTypeId/addDeploymentType' },//?DeploymentTypeId={deploymentTypeId}"
                removeSensorDeploymentType: { method: 'POST', isArray: false, params: { sensorTypeId: '@sensorTypeId', DeploymentTypeId: '@deploymentTypeId' }, url: rootURL + '/SensorTypes/:sensorTypeId/removeDeploymentType' },//?DeploymentTypeId={deploymentTypeId}"
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // SITE
    STNResource.factory('SITE', ['$resource', function ($resource) {
        return $resource(rootURL + '/Sites/:id',
            {}, {
                query: {},
                sensorScriptRunning: { method: 'GET', isArray: false, transformResponse: function (data) { return { value: angular.fromJson(data) } }, url: rootURL + '/Sites/:id/GetDataFileScript' },
                getProximitySites: { method: 'GET', isArray: true, url: rootURL + '/ByDistance' , params: { Latitude: '@latitude', Longitude: '@longitude', Buffer: '@buffer' } },
                getAll: { method: 'GET', isArray: true },
                getSearchedSite: { method: 'GET', isArray: false, url: rootURL + '/Sites/Search' }, //?bySiteNo={siteNo}&bySiteName={siteName}&bySiteId={siteId} (only going to populate 1 of these params
                getFilteredSites: { method: 'GET', isArray: true, url: rootURL + '/Sites/FilteredSites' }, //accepts optional parameters: Event={eventId}&State={stateNames}&SensorType={sensorTypeId}&NetworkName={networkNameId}&OPDefined={opDefined}&HWMOnly={hwmOnlySites}&&HWMSurveyed={surveyedHWMs}
                //landowner
                getSiteLandOwner: { method: 'GET', url: rootURL + '/Sites/:id/LandOwner' },
                //Site NetworkTypes
                getSiteNetworkTypes: { method: 'GET', isArray: true, url: rootURL + '/sites/:id/networkTypes' },
                postSiteNetworkType: { method: 'POST', cache: false, params: { siteId: '@siteId', NetworkTypeId: '@networkTypeId' }, isArray: true, url: rootURL + '/sites/:siteId/AddNetworkType' }, //?NetworkTypeId= {networkTypeId}
                deleteSiteNetworkType: { method: 'DELETE', cache: false, isArray: false, url: rootURL + '/sites/:siteId/removeNetworkType?NetworkTypeId=:networkTypeId' },
                //Site Network Names
                getSiteNetworkNames: { method: 'GET', isArray: true, url: rootURL + '/sites/:id/networkNames' },
                postSiteNetworkName: { method: 'POST', cache: false, params: { siteId: '@siteId', NetworkNameId: '@networkNameId' }, isArray: true, url: rootURL + '/sites/:siteId/AddNetworkName' }, //?NetworkNameId= {networkNameId}
                deleteSiteNetworkName: { method: 'DELETE', cache: false, isArray: false, url: rootURL + '/sites/:siteId/removeNetworkName?NetworkNameId=:networkNameId' },
                //Site Housings
                getSiteHousings: { method: 'GET', isArray: true, url: rootURL + '/sites/:id/SiteHousings' },
                //  postSiteHousing: {method: 'POST', cache: false, isArray:true, url: rootURL + '/site/:id/AddSiteSiteHousing'},
                //Site Parts
                getSiteOPs: { method: 'GET', isArray: true, url: rootURL + '/Sites/:id/ObjectivePoints' },
                getSiteSensors: { method: 'GET', isArray: true, url: rootURL + '/Sites/:id/SiteFullInstrumentList' }, //all instruments and their stats together
                getSiteHWMs: { method: 'GET', isArray: true, url: rootURL + '/Sites/:id/HWMs' },
                getSiteFiles: { method: 'GET', isArray: true, url: rootURL + '/Sites/:id/Files' },
                getSitePeaks: { method: 'GET', isArray: true, url: rootURL + '/Sites/:id/PeakSummaryView' },
                getPeaklessSites: { method: 'GET', isArray: true, url: rootURL + '/Events/:id/PeaklessSites' },
                //just the Site
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);

    // IsScriptRunning Service
    STNResource.factory('Site_Script', ['$cookies', '$rootScope', function ($cookies, $rootScope) {
        var isRunning;
        return {
            getIsScriptRunning: function () {
                return isRunning;
            },
            setIsScriptRunning: function (running) {
                isRunning = running;
                $rootScope.$broadcast('siteDFScriptRunning', isRunning);
            }
        };
    }]);
    // Site_Files
    STNResource.factory('Site_Files', ['$cookies', '$rootScope', function ($cookies, $rootScope) {
        var allSiteFiles = [];
        return {
            getAllSiteFiles: function () {
                return allSiteFiles;
            },
            setAllSiteFiles: function (sf) {
                allSiteFiles = sf;
                $rootScope.$broadcast('siteFilesUpdated', allSiteFiles);
            }
        };
    }]);
    // STATE
    STNResource.factory('STATE', ['$resource', function ($resource) {
        return $resource(rootURL + '/States/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // SITE_HOUSING
    STNResource.factory('SITE_HOUSING', ['$resource', function ($resource) {
        return $resource(rootURL + '/SiteHousings/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // STATUS_TYPE
    STNResource.factory('STATUS_TYPE', ['$resource', function ($resource) {
        return $resource(rootURL + '/StatusTypes/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // SOURCE
    STNResource.factory('SOURCE', ['$resource', function ($resource) {
        return $resource(rootURL + '/Sources/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // VERTICAL_COLL_METHOD
    STNResource.factory('VERTICAL_COLL_METHOD', ['$resource', function ($resource) {
        return $resource(rootURL + '/VerticalMethods/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // VERTICAL_DATUM
    STNResource.factory('VERTICAL_DATUM', ['$resource', function ($resource) {
        return $resource(rootURL + '/VerticalDatums/:id',
            {}, {
                query: {},
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT', cache: false, isArray: false },
                save: { method: 'POST', cache: false, isArray: false },
                delete: { method: 'DELETE', cache: false, isArray: false }
            });
    }]);
    // Login
    STNResource.factory('Login', ['$resource', function ($resource) {
        return $resource(rootURL + '/login',
            {}, {
                login: { method: 'GET', cache: false, isArray: false },
                getNewsFeed: { method: 'GET', url: rootURL + "/Confluence/STNNewsFeed" }
            });
    }]);
})();