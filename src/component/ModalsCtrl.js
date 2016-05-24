(function () {
    "use strict";

    var ModalControllers = angular.module('ModalControllers');

    //popup confirm box
    ModalControllers.controller('ConfirmModalCtrl', ['$scope', '$uibModalInstance', 'nameToRemove', 'what', 
        function ($scope, $uibModalInstance, nameToRemove, what) {
            //#region switch (long)
            switch (what) {
                case "Member":
                    $scope.nameToRmv = nameToRemove.fname + " " + nameToRemove.lname;
                    break;
                case "Event":
                    $scope.nameToRmv = nameToRemove.event_name;
                    break;
                case "Agency":
                    $scope.nameToRmv = nameToRemove.agency_name;
                    break;
                case "Contact Type":
                    $scope.nameToRmv = nameToRemove.type;
                    break;
                case "Deployment Priority":
                    $scope.nameToRmv = nameToRemove.priority_name;
                    break;
                case "Event Status":
                    $scope.nameToRmv = nameToRemove.status;
                    break;
                case "File Type":
                    $scope.nameToRmv = nameToRemove.filetype;
                    break;
                case "Horizontal Collection Method":
                    $scope.nameToRmv = nameToRemove.hcollect_method;
                    break;
                case "Horizontal Datum":
                    $scope.nameToRmv = nameToRemove.datum_name;
                    break;
                case "Housing Type":
                    $scope.nameToRmv = nameToRemove.type_name;
                    break;
                case "HWM Quality":
                    $scope.nameToRmv = nameToRemove.hwm_quality;
                    break;
                case "HWM Type":
                    $scope.nameToRmv = nameToRemove.hwm_type;
                    break;
                case "Instrument Collection Condition":
                    $scope.nameToRmv = nameToRemove.condition;
                    break;
                case "Marker":
                    $scope.nameToRmv = nameToRemove.marker1;
                    break;
                case "Network Name":
                    $scope.nameToRmv = nameToRemove.name;
                    break;
                case "Objective Point Quality":
                    $scope.nameToRmv = nameToRemove.quality;
                    break;
                case "Objective Point Type":
                    $scope.nameToRmv = nameToRemove.op_type;
                    break;
                case "Sensor Brand":
                    $scope.nameToRmv = nameToRemove.brand_name;
                    break;
                case "Deployment Type":
                    $scope.nameToRmv = nameToRemove.method;
                    break;
                case "Status Type":
                    $scope.nameToRmv = nameToRemove.status;
                    break;
                case "Sensor Type":
                    $scope.nameToRmv = nameToRemove.sensor;
                    break;
                case "Network Type":
                    $scope.nameToRmv = nameToRemove.network_type_name;
                    break;
                case "Vertical Collection Method":
                    $scope.nameToRmv = nameToRemove.vcollect_method;
                    break;
                case "Vertical Datum":
                    $scope.nameToRmv = nameToRemove.datum_abbreviation;
                    break;
                case "Objective Point":
                    $scope.nameToRmv = nameToRemove.name;
                    break;
                case "HWM":
                    var aDate = new Date(nameToRemove.flag_date);
                    var year = aDate.getFullYear();
                    var month = aDate.getMonth();
                    var day = ('0' + aDate.getDate()).slice(-2);
                    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    var dateWOtime = monthNames[month] + " " + day + ", " + year;
                
                    $scope.nameToRmv = "Flagged on: " + dateWOtime;
                    break;
                case "Sensor":
                    $scope.nameToRmv = nameToRemove.deploymentType;
                    break;
                case "File":
                    var f = nameToRemove.name !== undefined || nameToRemove.name !== null ? nameToRemove.name : nameToRemove.file_date;
                    f = f !== null || f !== undefined ? f : nameToRemove.file_id;
                    $scope.nameToRmv = f;
                    break;
                case "Peak":
                    $scope.nameToRmv = nameToRemove.peak_summary_id;
                    break;
            }
            //#endregion

            $scope.what = what;

            $scope.ok = function () {
                $uibModalInstance.close(nameToRemove);
            };

            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };
        }]);
}());