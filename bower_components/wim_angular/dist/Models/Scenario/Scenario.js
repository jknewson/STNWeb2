var ModelType;
(function (ModelType) {
    ModelType[ModelType["UNDEFINED"] = 0] = "UNDEFINED";
    ModelType[ModelType["PRMS"] = 1] = "PRMS";
    ModelType[ModelType["REGRESSION"] = 2] = "REGRESSION";
    ModelType[ModelType["SIMILAR"] = 3] = "SIMILAR";
})(ModelType || (ModelType = {}));
var StreamStats;
(function (StreamStats) {
    var Models;
    (function (Models) {
        var Scenario;
        (function (Scenario_1) {
            var SimpleModel = (function () {
                function SimpleModel(m, mt, d) {
                    if (m === void 0) { m = ""; }
                    if (mt === void 0) { mt = ModelType.UNDEFINED; }
                    if (d === void 0) { d = ""; }
                    this.Model = m;
                    this.ModelType = mt;
                    this.Description = d;
                }
                SimpleModel.FromJSON = function (jsn) {
                    var model = jsn.hasOwnProperty("ModelType") ? jsn["ModelType"] : "";
                    var type = jsn.hasOwnProperty("ModelType") ? this.ModelTypeFromString(jsn["ModelType"]) : ModelType.UNDEFINED;
                    var description = jsn.hasOwnProperty("Description") ? jsn["Description"] : "";
                    return new Scenario(model, type, description);
                };
                SimpleModel.ModelTypeFromString = function (m) {
                    switch (m) {
                        case "PRMS":
                            return ModelType.PRMS;
                        case 'FDCTM':
                            return ModelType.REGRESSION;
                        case 'FLA':
                            return ModelType.SIMILAR;
                        default:
                            return ModelType.UNDEFINED;
                    }
                };
                return SimpleModel;
            })();
            Scenario_1.SimpleModel = SimpleModel;
            var Scenario = (function () {
                function Scenario(m, mt, d) {
                    if (m === void 0) { m = ""; }
                    if (mt === void 0) { mt = ModelType.UNDEFINED; }
                    if (d === void 0) { d = ""; }
                    this.ModelType = mt;
                    this.Description = d;
                    this.Model = m;
                    this.Parameters = [];
                    this.StartDate = this.addDay(new Date(), -1);
                    this.EndDate = this.addDay(new Date(), -1);
                    this.MinDateRange = new Date(1900, 1, 1);
                    this.MaxDateRange = this.addDay(new Date(), -1);
                    this.SelectedReferenceGage = new Models.Station("------");
                    this.ReferenceGageList = [];
                    this.HasRegions = false;
                }
                Scenario.prototype.SetReferenceGage = function (gage) {
                    this.SelectedReferenceGage(gage);
                };
                Scenario.prototype.LoadParameters = function (params) {
                    var _this = this;
                    if (this.Parameters.length > 0)
                        this.Parameters = [];
                    if (params != null) {
                        params.forEach(function (p) { return _this.Parameters.push(Parameter.FromJSON(p)); });
                    }
                };
                Scenario.prototype.GetNWISReferenceStation = function (RegionID) {
                    var _this = this;
                    var url = configuration.appSettings['NWISurl'].format(RegionID);
                    $.ajax({
                        type: "GET",
                        url: url,
                        processData: false,
                        dataType: "xml",
                        success: function (s) { return _this.loadReferenceStationResults(s); },
                        error: function (e) { return _this.onError(e); },
                        complete: function (c) { return _this.onComplete(); }
                    });
                };
                Scenario.prototype.GetReferenceStation = function (pnt) {
                    throw new Error('This method is abstract');
                };
                Scenario.prototype.ToJson = function () {
                    throw new Error('This method is abstract');
                };
                Scenario.prototype.CanExecute = function () {
                    var maxOK = false;
                    var minOK = false;
                    var startEndOK = false;
                    var refStationOK = false;
                    var paramsOK = false;
                    try {
                        maxOK = this.StartDate < this.MaxDateRange || this.EndDate < this.MaxDateRange;
                        minOK = this.StartDate > this.MinDateRange || this.EndDate > this.MinDateRange;
                        startEndOK = this.StartDate <= this.EndDate;
                        refStationOK = this.SelectedReferenceGage().StationID != "------" || this.SelectedReferenceGage().StationID != "";
                        paramsOK = this.Parameters.length > 0;
                        return maxOK && minOK && startEndOK && refStationOK && paramsOK;
                    }
                    catch (e) {
                        return false;
                    }
                };
                Scenario.prototype.UpdateParameter = function (p) {
                    var pCount = this.Parameters.length;
                    for (var i = 0; i < pCount; i++) {
                        if (this.Parameters[i].code.toLowerCase() === p['code'].toLowerCase()) {
                            this.Parameters[i].value = p['value'];
                            break;
                        }
                    }
                };
                Scenario.prototype.LoadExecuteResults = function (jsn) {
                    this.EstimatedFlow = jsn.hasOwnProperty("EstimatedFlow") ? TimeSeries.FromJSON(jsn["EstimatedFlow"]) : null;
                    this.EstimatedStation = jsn.hasOwnProperty("ReferanceGage") ? Models.Station.FromJSON(jsn["ReferanceGage"]) : null;
                };
                Scenario.prototype.GetParameters = function (URL) {
                    var _this = this;
                    $.ajax({
                        type: "GET",
                        url: URL,
                        dataType: "json",
                        success: function (m) { return _this.LoadParameters((m["Parameters"] != null) ? m["Parameters"] : m["Regions"][0].Parameters); },
                        async: false
                    });
                };
                Scenario.prototype.Execute = function () {
                    var _this = this;
                    if (!this.CanExecute())
                        return;
                    var url = configuration.appSettings['ScenarioService'].format(this.Model, this.RegionID);
                    var sd = this.StartDate;
                    var ed = this.EndDate;
                    $.ajax({
                        type: "POST",
                        url: url,
                        data: this.ToJson(),
                        contentType: "application/json",
                        processData: false,
                        dataType: "json",
                        success: function (s) { return _this.LoadExecuteResults(s); },
                        error: function (e) { return _this.onError(e); },
                        complete: function (c) { return _this.onComplete(); }
                    });
                };
                Scenario.prototype.onError = function (err) {
                    var errorMsg = "Error computing flow report";
                    errorMsg = err.hasOwnProperty("responseText") && err["responseText"] != "" ? err["responseText"] : errorMsg;
                };
                Scenario.prototype.onComplete = function () {
                    var cleanup = "";
                };
                Scenario.prototype.loadReferenceStationResults = function (xml) {
                    if (this.ReferenceGageList.length != 0)
                        this.ReferenceGageList.removeAll();
                    var single_sites = xml.getElementsByTagName("sites");
                    if (single_sites.length == 1) {
                        var markers = single_sites[0].getElementsByTagName("site");
                        if (markers.length == 0) {
                            return;
                        }
                        else {
                            var nmarkers = 0;
                            while (nmarkers < markers.length) {
                                nmarkers++;
                                if (markers[nmarkers]) {
                                    var siteno = markers[nmarkers].getAttribute("sno");
                                    var stat = new Models.Station(siteno);
                                    stat.StationID = siteno;
                                    stat.Name = markers[nmarkers].getAttribute("sna");
                                    stat.Latitude_DD = parseFloat(markers[nmarkers].getAttribute("lat"));
                                    stat.Longitude_DD = parseFloat(markers[nmarkers].getAttribute("lng"));
                                }
                                this.ReferenceGageList.push(stat);
                            }
                        }
                    }
                    this.SelectedReferenceGage(this.ReferenceGageList[0]);
                };
                Scenario.prototype.addDay = function (d, days) {
                    try {
                        var dayAsTime = 1000 * 60 * 60 * 24;
                        return new Date(d.getTime() + days * dayAsTime);
                    }
                    catch (e) {
                        return d;
                    }
                };
                Scenario.prototype.JSONReplacer = function (key, value) {
                    switch (key) {
                        case "ReferenceGage":
                            key = "nwis_station_id";
                            return value;
                        case "MinDateRange":
                        case "MaxDateRange":
                        case "Model":
                        case "ModelType":
                        case "Description":
                        case "RegionID":
                            return undefined;
                        default:
                            return value;
                    }
                };
                return Scenario;
            })();
            Scenario_1.Scenario = Scenario;
        })(Scenario = Models.Scenario || (Models.Scenario = {}));
    })(Models = StreamStats.Models || (StreamStats.Models = {}));
})(StreamStats || (StreamStats = {}));
//# sourceMappingURL=Scenario.js.map