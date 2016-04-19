var WiM;
(function (WiM) {
    var Models;
    (function (Models) {
        var Point = (function () {
            function Point(lat, long, crs) {
                this.Latitude = lat;
                this.Longitude = long;
                this.crs = crs;
            }
            Point.prototype.ToEsriString = function () {
                return "{" + "x:{0},y:{1}".format(this.Longitude.toString(), this.Latitude.toString()) + "}";
            };
            Point.FromJson = function (json) {
                var lat = json.hasOwnProperty("Latitude") ? json["Latitude"] : -9999;
                var long = json.hasOwnProperty("Longitude") ? json["Longitude"] : -9999;
                var wkid = json.hasOwnProperty("wkid") ? json["wkid"] : "---";
                return new Point(lat, long, wkid);
            };
            return Point;
        })();
        Models.Point = Point;
    })(Models = WiM.Models || (WiM.Models = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=Point.js.map