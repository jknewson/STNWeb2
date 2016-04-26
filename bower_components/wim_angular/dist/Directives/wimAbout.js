var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var WiM;
(function (WiM) {
    var Directives;
    (function (Directives) {
        'use string';
        var SupportTicketData = (function () {
            function SupportTicketData() {
            }
            return SupportTicketData;
        })();
        var GitHubIssueData = (function () {
            function GitHubIssueData() {
            }
            return GitHubIssueData;
        })();
        var wimAboutController = (function (_super) {
            __extends(wimAboutController, _super);
            function wimAboutController($scope, $http) {
                _super.call(this, $http, '');
                $scope.vm = this;
                this.gitHubIssues = new GitHubIssueData();
                this.SupportTicketData = new SupportTicketData();
                this.selectedAboutTabName = "about";
                this.selectedHelpTabName = "faq";
                this.aboutSelected = false;
                this.helpSelected = false;
                this.displayMessage;
                this.isValid = false;
            }
            wimAboutController.prototype.uploadFile = function (event) {
                this.SupportTicketData.attachments = event.target.files;
            };
            wimAboutController.prototype.submitTicket = function (isValid) {
                var _this = this;
                var url = 'https://streamstatshelp.zendesk.com/api/v2/tickets.json ';
                var data = angular.toJson({ "ticket": this.SupportTicketData });
                var user = 'marsmith@usgs.gov';
                var token = 'bCkA8dLeVkzs5mTPamt1g7zv8EMKUCuTRpPkW7Ez';
                var headers = {
                    "Authorization": "Basic " + btoa(user + '/token:' + token)
                };
                var request = new WiM.Services.Helpers.RequestInfo(url, true, WiM.Services.Helpers.methodType.POST, 'json', data, headers);
                this.Execute(request).then(function (response) {
                    alert("Your request has been submitted.  Your request will be addressed as soon as possible");
                    _this.SupportTicketData = new SupportTicketData();
                }, function (error) {
                }).finally(function () {
                });
            };
            wimAboutController.prototype.toggleHelpSelected = function () {
                if (this.helpSelected)
                    this.helpSelected = false;
                else
                    this.helpSelected = true;
            };
            wimAboutController.prototype.toggleAboutSelected = function () {
                if (this.aboutSelected)
                    this.aboutSelected = false;
                else
                    this.aboutSelected = true;
            };
            wimAboutController.prototype.selectAboutTab = function (tabname) {
                if (this.selectedAboutTabName == tabname)
                    return;
                this.selectedAboutTabName = tabname;
            };
            wimAboutController.prototype.selectHelpTab = function (tabname) {
                if (this.selectedHelpTabName == tabname)
                    return;
                this.selectedHelpTabName = tabname;
            };
            wimAboutController.$inject = ['$scope', '$http'];
            return wimAboutController;
        })(WiM.Services.HTTPServiceBase);
        var wimAbout = (function () {
            function wimAbout() {
                this.scope = true;
                this.restrict = 'E';
                this.controller = wimAboutController;
                this.templateUrl = 'Views/about/about.html';
            }
            wimAbout.instance = function () {
                return new wimAbout;
            };
            wimAbout.prototype.link = function (scope, element, attributes, controller) {
            };
            return wimAbout;
        })();
        angular.module('wim_angular')
            .directive('wimAbout', wimAbout.instance);
    })(Directives = WiM.Directives || (WiM.Directives = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=wimAbout.js.map