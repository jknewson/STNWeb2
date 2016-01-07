(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var ModalControllers = angular.module('ModalControllers');
//popup confirm box
    ModalControllers.controller('ConfirmReportModalCtrl', ['$scope', '$uibModalInstance', ConfirmReportModalCtrl]);
    function ConfirmReportModalCtrl($scope, $uibModalInstance) {

        $scope.ok = function () {
            $uibModalInstance.close();
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }

})();