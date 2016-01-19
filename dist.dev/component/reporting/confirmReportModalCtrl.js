(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var ModalControllers = angular.module('ModalControllers');
//popup confirm box
    ModalControllers.controller('confirmReportModalCtrl', ['$scope', '$uibModalInstance', confirmReportModalCtrl]);
    function confirmReportModalCtrl($scope, $uibModalInstance) {

        $scope.ok = function () {
            $uibModalInstance.close();
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }

})();