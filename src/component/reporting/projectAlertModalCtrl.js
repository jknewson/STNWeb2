(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var ModalControllers = angular.module('ModalControllers');
    ModalControllers.controller('ProjAlertModalCtrl', ['$scope', '$uibModalInstance', 'ProjAlert', 
        function ProjAlertModalCtrl($scope, $uibModalInstance, ProjAlert) {
            $scope.ProjAlertParts = ProjAlert;
            $scope.ok = function () {
                $uibModalInstance.dismiss('cancel');
            };
        }]);

})();