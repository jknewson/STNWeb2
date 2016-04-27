var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Models;
(function (Models) {
    var Scenario;
    (function (Scenario) {
        var FDCTM = (function (_super) {
            __extends(FDCTM, _super);
            function FDCTM(regionID, d, loadParameters) {
                if (loadParameters === void 0) { loadParameters = true; }
                _super.call(this, "FDCTM", ModelType.REGRESSION, d);
                this.RegionID = regionID;
                if (loadParameters)
                    this.GetParameters(configuration.appSettings['RegressionService'] + '/' + this.Model + '/def?state=' + this.RegionID);
            }
            FDCTM.prototype.GetReferenceStation = function (pnt) {
                var _this = this;
                var url = configuration.appSettings['KrigService'].format(this.RegionID, pnt.Longitude.toString(), pnt.Latitude.toString(), pnt.wkid);
                $.ajax({
                    type: "GET",
                    url: url,
                    processData: false,
                    dataType: "json",
                    success: function (s) { return _this.loadKriggedReferenceStationResults(s); },
                    error: function (e) { return _this.onError(e); },
                    complete: function (c) { return _this.onComplete(); }
                });
            };
            FDCTM.prototype.CanExecute = function () {
                var superOK = false;
                try {
                    superOK = _super.prototype.CanExecute.call(this);
                    if (!superOK)
                        throw new Error();
                    return true;
                }
                catch (e) {
                    return false;
                }
            };
            FDCTM.prototype.ToJson = function () {
                return ko.toJSON(this.Replacer());
            };
            FDCTM.FromJSON = function (obj) {
                var regionID = obj.hasOwnProperty("StateCode") ? obj["StateCode"] : "---";
                var descr = obj.hasOwnProperty("Description") ? obj["Description"] : "---";
                var fdctm = new FDCTM(regionID, descr, false);
                if (obj.hasOwnProperty("ExceedanceProbabilities"))
                    fdctm.LoadProbabilites(obj["ExceedanceProbabilities"]);
                if (obj.hasOwnProperty("StartDate"))
                    fdctm.StartDate(new Date(obj["StartDate"]));
                if (obj.hasOwnProperty("EndDate"))
                    fdctm.EndDate(new Date(obj["EndDate"]));
                if (obj.hasOwnProperty("Parameters"))
                    fdctm.LoadParameters(obj["Parameters"]);
                fdctm.EstimatedFlow = obj.hasOwnProperty("EstimatedFlow") ? TimeSeries.FromJSON(obj["EstimatedFlow"]) : null;
                fdctm.EstimatedStation = obj.hasOwnProperty("ReferanceGage") ? Station.FromJSON(obj["ReferanceGage"]) : null;
                return fdctm;
            };
            FDCTM.prototype.LoadExecuteResults = function (jsn) {
                _super.prototype.LoadExecuteResults.call(this, jsn);
                if (jsn.hasOwnProperty("ExceedanceProbabilities"))
                    this.LoadProbabilites(jsn["ExceedanceProbabilities"]);
                this.Notification(new Notification("Model finished...", null, null, ActionType.HIDE));
                this.ReportReady(true);
            };
            FDCTM.prototype.LoadProbabilites = function (obj) {
                this.ExceedanceProbabilities = [];
                for (var key in obj) {
                    var val = obj[key];
                    this.ExceedanceProbabilities.push(new KeyValue(key, val));
                }
            };
            FDCTM.prototype.loadKriggedReferenceStationResults = function (list) {
                if (this.ReferenceGageList.length != 0)
                    this.ReferenceGageList.removeAll();
                for (var i = 0; i < list.length; i++) {
                    var g = CorrelatedStation.FromJSON(list[i]);
                    this.ReferenceGageList.push(g);
                }
                this.SelectedReferenceGage(this.ReferenceGageList()[0]);
            };
            FDCTM.prototype.Replacer = function () {
                return {
                    "startdate": this.StartDate,
                    "enddate": this.EndDate,
                    "nwis_station_id": this.SelectedReferenceGage().StationID,
                    "parameters": this.Parameters
                };
            };
            return FDCTM;
        })(Scenario);
        Scenario.FDCTM = FDCTM;
    })(Scenario = Models.Scenario || (Models.Scenario = {}));
})(Models || (Models = {}));
//# sourceMappingURL=FDCTM.js.map