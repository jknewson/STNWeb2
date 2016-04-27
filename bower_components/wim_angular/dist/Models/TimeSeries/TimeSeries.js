var WiM;
(function (WiM) {
    var Models;
    (function (Models) {
        var TimeSeries;
        (function (TimeSeries_1) {
            var TimeSeries = (function () {
                function TimeSeries() {
                }
                TimeSeries.FromJSON = function (jsn) {
                    var ts = new TimeSeries();
                    ts.Name = jsn.hasOwnProperty("Name") ? jsn["Name"] : null;
                    ts.SeriesID = jsn.hasOwnProperty("SeriesID") ? jsn["SeriesID"] : null;
                    ts.SeriesDescription = jsn.hasOwnProperty("SeriesDescription") ? jsn["SeriesDescription"] : null;
                    ts.ValueMax = jsn.hasOwnProperty("ValueMax") ? jsn["ValueMax"] : null;
                    ts.ValueMin = jsn.hasOwnProperty("ValueMin") ? jsn["ValueMin"] : null;
                    ts.StartDate = jsn.hasOwnProperty("StartDate") ? new Date(jsn["StartDate"]) : null;
                    ts.EndDate = jsn.hasOwnProperty("EndDate") ? new Date(jsn["EndDate"]) : null;
                    ts.ValueUnits = jsn.hasOwnProperty("ValueUnits") ? jsn["ValueUnits"] : null;
                    var obs = jsn.hasOwnProperty("Observations") ? jsn["Observations"] : null;
                    if (obs != null) {
                        ts.Observations = [];
                        obs.forEach(function (p) { return ts.Observations.push(TimeSeriesObservation.FromJSON(p)); });
                    }
                    return ts;
                };
                return TimeSeries;
            })();
            var TimeSeriesObservation = (function () {
                function TimeSeriesObservation(d, v, c) {
                    this.Date = d;
                    this.Value = v;
                    this.Code = c;
                }
                TimeSeriesObservation.FromJSON = function (jsn) {
                    var date = jsn.hasOwnProperty("Date") ? new Date(jsn["Date"]) : null;
                    var value = jsn.hasOwnProperty("Value") ? jsn["Value"] : -9999;
                    var dc = jsn.hasOwnProperty("DataCode") ? jsn["DataCode"] : null;
                    return new TimeSeriesObservation(date, value, dc);
                };
                return TimeSeriesObservation;
            })();
        })(TimeSeries = Models.TimeSeries || (Models.TimeSeries = {}));
    })(Models = WiM.Models || (WiM.Models = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=TimeSeries.js.map