var WiM;
(function (WiM) {
    var Models;
    (function (Models) {
        var Citation = (function () {
            function Citation(title, author, imageSrc, url) {
                this.Title = title;
                this.Author = author;
                this.imgSrc = imageSrc;
                this.src = url;
            }
            Citation.FromJSON = function (obj) {
                var Title = obj.hasOwnProperty("title") ? obj["title"] : "--";
                var Author = obj.hasOwnProperty("author") ? obj["author"] : "";
                var imgSrc = obj.hasOwnProperty("imgeSrc") ? obj["imgeSrc"] : "";
                var src = obj.hasOwnProperty("src") ? obj["src"] : "";
                return new Citation(Title, Author, imgSrc, src);
            };
            return Citation;
        })();
    })(Models = WiM.Models || (WiM.Models = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=Citation.js.map