var WiM;
(function (WiM) {
    var Models;
    (function (Models) {
        var Parameter = (function () {
            function Parameter(n, v, c, d, u, limit) {
                this.name = n;
                this.value = v;
                this.code = c;
                this.unit = u;
                this.description = d;
                this.limits = limit;
            }
            Parameter.FromJSON = function (obj) {
                var name = obj.hasOwnProperty("name") ? obj["name"] : "---";
                var descr = obj.hasOwnProperty("description") ? obj["description"] : "---";
                var code = obj.hasOwnProperty("code") ? obj["code"] : "---";
                var unit = obj.hasOwnProperty("unit") ? obj["unit"] : "---";
                var value = obj.hasOwnProperty("value") ? obj["value"] : -999;
                var limit = obj.hasOwnProperty("limits") && obj["limits"] != null ? Limit.FromJSON(obj["limits"]) : null;
                return new Parameter(name, value, code, descr, unit, limit);
            };
            return Parameter;
        })();
        var Limit = (function () {
            function Limit(min, max) {
                this.min = min;
                this.max = max;
            }
            Limit.FromJSON = function (obj) {
                var min = obj.hasOwnProperty("min") ? obj["min"] : -999;
                var max = obj.hasOwnProperty("max") ? obj["max"] : -999;
                return new Limit(min, max);
            };
            return Limit;
        })();
    })(Models = WiM.Models || (WiM.Models = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=Parameter.js.map