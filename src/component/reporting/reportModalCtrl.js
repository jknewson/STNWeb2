(function () {
    'use strict';

    var ModalControllers = angular.module('ModalControllers');
    ModalControllers.controller('reportModalCtrl', ['$scope', '$uibModalInstance', 'report', 'submitPerson', 'contacts', 
        function ($scope, $uibModalInstance, report, submitPerson, contacts) {
            $scope.ReportView = {};
            $scope.ReportView.Report = report;
            $scope.ReportView.submitter = submitPerson;
            $scope.ReportView.deployStaff = contacts.filter(function (d) { return d.type == "Deployed Staff"; })[0];
            $scope.ReportView.generalStaff = contacts.filter(function (d) { return d.type == "General"; })[0];
            $scope.ReportView.inlandStaff = contacts.filter(function (d) { return d.type == "Inland Flood"; })[0];
            $scope.ReportView.coastStaff = contacts.filter(function (d) { return d.type == "Coastal Flood"; })[0];
            $scope.ReportView.waterStaff = contacts.filter(function (d) { return d.type == "Water Quality"; })[0];
            $scope.print = function () {
                window.print();
            };
            $scope.ok = function () {
                $uibModalInstance.dismiss('cancel');
            };
        }]);
})();