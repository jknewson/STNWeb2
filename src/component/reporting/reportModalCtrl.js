(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var ModalControllers = angular.module('ModalControllers');
    ModalControllers.controller('reportModalCtrl', ['$scope', '$uibModalInstance', 'report', 'submitPerson', 'contacts', reportModalCtrl]);
    function reportModalCtrl($scope, $uibModalInstance, report, submitPerson, contacts) {
            $scope.ReportView = {};
            $scope.ReportView.Report = report;
            $scope.ReportView.submitter = submitPerson;
            $scope.ReportView.deployStaff = contacts.filter(function (d) { return d.TYPE == "Deployed Staff"; });
            $scope.ReportView.generalStaff = contacts.filter(function (d) { return d.TYPE == "General"; });
            $scope.ReportView.inlandStaff = contacts.filter(function (d) { return d.TYPE == "Inland Flood"; });
            $scope.ReportView.coastStaff = contacts.filter(function (d) { return d.TYPE == "Coastal Flood"; });
            $scope.ReportView.waterStaff = contacts.filter(function (d) { return d.TYPE == "Water Quality"; });

            $scope.ok = function () {
                $uibModalInstance.dismiss('cancel');
            };
        }

})();