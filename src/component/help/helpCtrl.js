(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');
    //#region HELP Controller
    STNControllers.controller('helpCtrl', ['$scope', helpCtrl]);
    function helpCtrl($scope) {
        $scope.helpInfo = {};
        $scope.helpInfo.fact = "Some really interesting help will be here.";
    }
    //#endregion HELP Controller

})();