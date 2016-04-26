//------------------------------------------------------------------------------
//----- StudyArea --------------------------------------------------------------
//------------------------------------------------------------------------------
//-------1---------2---------3---------4---------5---------6---------7---------8
//       01234567890123456789012345678901234567890123456789012345678901234567890
//-------+---------+---------+---------+---------+---------+---------+---------+
// copyright:   2014 WiM - USGS
//    authors:  Jeremy K. Newson USGS Wisconsin Internet Mapping
//             
// 
//   purpose:  Represents the StudyArea
//          
//discussion:
//
//Comments
//08.14.2014 jkn - Created
//Imports"
///<reference path="../Parameter.ts"/>
///<reference path="../Point.ts"/>
// Class
var StreamStats;
(function (StreamStats) {
    var Models;
    (function (Models) {
        var StudyArea;
        (function (StudyArea_1) {
            var StudyArea = (function () {
                // Constructor
                function StudyArea(point, regionID) {
                    this.Pourpoint = point;
                    this.RegionID = regionID;
                    this.Description = '';
                    this.DownloadURL = '';
                    this.Basin = null;
                    this.basinDelineated = false;
                    this.OnDelineationComplete = false;
                    this.StudyParameters = [];
                }
                StudyArea.prototype.AddStudyModel = function (s) {
                    //select the model
                    //this.Description(s().Description + " for location: ("+this.Pourpoint.Longitude+", " +this.Pourpoint.Latitude+")");
                    this.SelectedModel = s;
                    this.SelectedModel.GetReferenceStation(this.Pourpoint);
                    this.GetStudyParameters();
                };
                StudyArea.prototype.GetStudyParameters = function () {
                    var _this = this;
                    if (this.Basin == null) {
                        //this.OnNotification(new Notification("Please manually configure model parameters."));
                        return;
                    }
                    //this.OnNotification(new Notification("Calculating model parameters.... Please wait.",null,null,ActionType.SHOW));
                    var url = configuration.appSettings['SSbasinChar']
                        .format(this.RegionID, this.WorkspaceID, $.map(this.SelectedModel().Parameters(), function (obj) { return obj.code; }).join(';'));
                    $.ajax({
                        type: "GET",
                        url: url,
                        dataType: "json",
                        success: function (s) { return _this.loadStudyParamResults(s); },
                        error: function (e) { return _this.LoadError(e); },
                        complete: function (c) { return _this.LoadParametersComplete(); }
                    });
                };
                //Public Methods
                StudyArea.prototype.GetStudyBoundary = function () {
                    var _this = this;
                    this.OnNotification(new Notification("Delineating study boundaries.... Please wait", NotificationType.ALERT, 3, ActionType.SHOW));
                    var url = configuration.appSettings['SSwatershed']
                        .format(this.RegionID, this.Pourpoint.Longitude.toString(), this.Pourpoint.Latitude.toString(), this.Pourpoint.wkid.toString(), false);
                    $.ajax({
                        type: "GET",
                        url: url,
                        dataType: "json",
                        success: function (s) { return _this.loadStudyResults(s); },
                        error: function (e) { return _this.LoadError(e); },
                        complete: function (c) { return _this.LoadBoundaryComplete(); }
                    });
                };
                //Helper Methods
                StudyArea.prototype.loadStudyResults = function (obj) {
                    //parse through results       
                    this.OnNotification(new Notification("Delineation success..."));
                    //set export url
                    this.Basin = obj.hasOwnProperty("delineatedbasin") ? obj["delineatedbasin"].features[0] : null;
                    this.WorkspaceID = obj.hasOwnProperty("workspaceID") ? obj["workspaceID"] : null;
                    this.DownloadURL = "http://ssdev.cr.usgs.gov/streamstatsService/download?item=" + this.WorkspaceID;
                    if (this.Basin != null)
                        this.basinDelineated = true;
                };
                StudyArea.prototype.loadStudyParamResults = function (obj) {
                    var _this = this;
                    var msg;
                    var params;
                    //parse through results       
                    this.OnNotification(new Notification("Parameter request success... loading parameters"));
                    msg = obj.hasOwnProperty("messages") ? obj["messages"] : "";
                    this.OnNotification(new Notification(msg));
                    params = obj.hasOwnProperty("parameters") ? obj["parameters"] : [];
                    //populate params
                    params.forEach(function (x) { return _this.updateStudyParameter(x); });
                    LocalStorageOp.LocalStorage(StorageType.APPEND, "nss.study.Parameters", this.StudyParameters);
                    this.OnNotification(new Notification("Refine calculated parameters or continue on to 'Build a Flow Report'..."));
                };
                StudyArea.prototype.LoadError = function (err) {
                    console.log("error", err);
                    this.OnNotification(new Notification("There was an error in the study area process. Please retry or manually enter parameters", NotificationType.ERROR));
                    //this.OnDelineationComplete(true);
                };
                StudyArea.prototype.LoadBoundaryComplete = function () {
                    //regardless of success or fail do this stuff
                    console.log("Study Request complete");
                    this.OnNotification(new Notification("Request complete", null, null, ActionType.HIDE));
                    this.OnDelineationComplete(true);
                    //save to localstorage:
                    LocalStorageOp.LocalStorage(StorageType.SET, "nss.study", this.Replacer());
                    //deactivate map panel
                    $('#map').css('cursor', 'hand');
                    //$('#loadingSpinner').hide();
                };
                StudyArea.prototype.LoadParametersComplete = function () {
                    //regardless of success or fail do this stuff
                    console.log("Study Request complete");
                    this.OnNotification(new Notification("Parameters request completed", null, null, ActionType.HIDE));
                    this.OnDelineationComplete(true);
                };
                StudyArea.prototype.updateStudyParameter = function (p) {
                    var okToAdd = true;
                    if (!p.hasOwnProperty("name") || !p.hasOwnProperty("value"))
                        return;
                    //check if it already exists in the list if so replace it.
                    var spCount = this.StudyParameters.length;
                    for (var i = 0; i < spCount; i++) {
                        if (this.StudyParameters[i].name.toLowerCase() === p['name'].toLowerCase()) {
                            this.StudyParameters[i].value(p['value']);
                            okToAdd = false;
                            break;
                        } //endif
                    } //next n
                    //include as study property
                    if (okToAdd)
                        this.StudyParameters.push(new Parameter(p["name"], p["value"], p["code"], p["description"], "", null));
                    this.SelectedModel().UpdateParameter(p);
                };
                StudyArea.prototype.Replacer = function () {
                    return {
                        "Pourpoint": this.Pourpoint,
                        "Description": this.Description(),
                        "RegionID": this.RegionID,
                        "Parameters": this.StudyParameters,
                        "WorkspaceID": this.WorkspaceID,
                        "DownloadURL": this.DownloadURL,
                        "Basin": this.Basin
                    };
                };
                return StudyArea;
            }()); //end class
        })(StudyArea = Models.StudyArea || (Models.StudyArea = {}));
    })(Models = StreamStats.Models || (StreamStats.Models = {}));
})(StreamStats || (StreamStats = {})); //end module
//# sourceMappingURL=StudyArea.js.map