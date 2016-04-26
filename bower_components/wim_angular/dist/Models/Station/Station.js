//------------------------------------------------------------------------------
//----- Station ---------------------------------------------------------------
//------------------------------------------------------------------------------
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
//-------1---------2---------3---------4---------5---------6---------7---------8
//       01234567890123456789012345678901234567890123456789012345678901234567890
//-------+---------+---------+---------+---------+---------+---------+---------+
// copyright:   2014 WiM - USGS
//    authors:  Jeremy K. Newson USGS Wisconsin Internet Mapping
//             
// 
//   purpose:  Represents the FDCTM model
//          
//discussion:
//
//Comments
//09.14.2014 jkn - Created
//Imports"
///<reference path="../TimeSeries/Timeseries.ts"/>
// Class
var StreamStats;
(function (StreamStats) {
    var Models;
    (function (Models) {
        var Station;
        (function (Station_1) {
            var Station = (function () {
                // Constructor
                function Station(id) {
                    this.StationID = id;
                    this.URL = "http://waterdata.usgs.gov/nwis/inventory?agency_code=USGS&site_no=" + id;
                }
                Station.FromJSON = function (jsn) {
                    var rg = new Station("");
                    rg.StationID = jsn.hasOwnProperty("StationID") ? jsn["StationID"] : null;
                    rg.Name = jsn.hasOwnProperty("Name") ? jsn["Name"] : null;
                    rg.DrainageArea_sqMI = jsn.hasOwnProperty("DrainageArea_sqMI") ? jsn["DrainageArea_sqMI"] : null;
                    rg.Latitude_DD = jsn.hasOwnProperty("Latitude_DD") ? jsn["Latitude_DD"] : null;
                    rg.Longitude_DD = jsn.hasOwnProperty("Longitude_DD") ? jsn["Longitude_DD"] : null;
                    rg.URL = jsn.hasOwnProperty("URL") ? jsn["URL"] : null;
                    rg.Discharge = jsn.hasOwnProperty("Discharge") ? TimeSeries.FromJSON(jsn["Discharge"]) : null;
                    return rg;
                };
                return Station;
            }());
            Station_1.Station = Station;
            var CorrelatedStation = (function (_super) {
                __extends(CorrelatedStation, _super);
                // Constructor
                function CorrelatedStation(id) {
                    _super.call(this, id);
                }
                CorrelatedStation.FromJSON = function (jsn) {
                    var rg = new CorrelatedStation("");
                    rg.StationID = jsn.hasOwnProperty("ID") ? jsn["ID"] : null;
                    rg.Name = jsn.hasOwnProperty("Name") ? jsn["Name"] : null;
                    rg.DrainageArea_sqMI = jsn.hasOwnProperty("DrainageArea") ? jsn["DrainageArea"] : null;
                    rg.Correlation = jsn.hasOwnProperty("Correlation") ? jsn["Correlation"] : null;
                    return rg;
                };
                return CorrelatedStation;
            }(Station));
            Station_1.CorrelatedStation = CorrelatedStation;
        })(Station = Models.Station || (Models.Station = {}));
    })(Models = StreamStats.Models || (StreamStats.Models = {}));
})(StreamStats || (StreamStats = {})); //end module
//# sourceMappingURL=Station.js.map