if (!Array.prototype.group) {
    Array.prototype.group = function () {
        var propName = arguments[0];
        var groupings = {};
        this.forEach(function (item) {
            var itemVal = item[propName].toString();
            if (!groupings.hasOwnProperty(itemVal)) {
                groupings[itemVal] = [item];
            }
            else {
                groupings[itemVal].push(item);
            }
        });
        return groupings;
    };
}
//# sourceMappingURL=Array.js.map