(function () {
    "use strict"; 
    var ModalControllers = angular.module('ModalControllers');
 
    //get new Date().toUTCString() with standard time instead of military (optional - pass in a date to have be utc)
    var utcDateTime = function (d) {
        var getMonth = function (mo) {
            switch (mo) {
                case 'Jan':
                    return '01';
                case 'Feb':
                    return '02';
                case 'Mar':
                    return '03';
                case 'Apr':
                    return '04';
                case 'May':
                    return '05';
                case 'Jun':
                    return '06';
                case 'Jul':
                    return '07';
                case 'Aug':
                    return '08';
                case 'Sep':
                    return '09';
                case 'Oct':
                    return '10';
                case 'Nov':
                    return '11';
                case 'Dec':
                    return '12';
            }
        };
        var Time_Stamp = d != undefined ? new Date(d).toUTCString() : new Date().toUTCString();// "Wed, 09 Dec 2015 17:18:26 GMT" == change to standard time for storage
        var mo = Time_Stamp.substr(8, 3);
        var actualMo = getMonth(mo);
        var day = Time_Stamp.substr(5, 2);
        var year = Time_Stamp.substr(12, 4);
        var hr = Time_Stamp.substr(17, 2);
        var standardHrs = hr > 12 ? '0' + (hr - 12).toString() : hr.toString();
        var min = Time_Stamp.substr(20, 2);
        var sec = Time_Stamp.substr(23, 2);
        var amPm = hr > 12 ? 'PM' : 'AM';
        var time_stampNEW = actualMo + '/' + day + '/' + year + ' ' + standardHrs + ':' + min + ':' + sec + ' ' + amPm; //12/09/2015 04:22:32PM
        return new Date(time_stampNEW);
    };

    //popup confirm box
    ModalControllers.controller('ConfirmModalCtrl', ['$scope', '$uibModalInstance', 'nameToRemove', 'what', ConfirmModalCtrl]);
    function ConfirmModalCtrl($scope, $uibModalInstance, nameToRemove, what) {
        //#region switch (long)
        switch (what) {
            case "Member":
                $scope.nameToRmv = nameToRemove.FNAME + " " + nameToRemove.LNAME;
                break;
            case "Event":
                $scope.nameToRmv = nameToRemove.EVENT_NAME;
                break;
            case "Agency":
                $scope.nameToRmv = nameToRemove.AGENCY_NAME;
                break;
            case "Contact Type":
                $scope.nameToRmv = nameToRemove.TYPE;
                break;
            case "Deployment Priority":
                $scope.nameToRmv = nameToRemove.PRIORITY_NAME;
                break;
            case "Event Status":
                $scope.nameToRmv = nameToRemove.STATUS;
                break;
            case "File Type":
                $scope.nameToRmv = nameToRemove.FILETYPE;
                break;
            case "Horizontal Collection Method":
                $scope.nameToRmv = nameToRemove.HCOLLECT_METHOD;
                break;
            case "Horizontal Datum":
                $scope.nameToRmv = nameToRemove.DATUM_NAME;
                break;
            case "Housing Type":
                $scope.nameToRmv = nameToRemove.TYPE_NAME;
                break;
            case "HWM Quality":
                $scope.nameToRmv = nameToRemove.HWM_QUALITY;
                break;
            case "HWM Type":
                $scope.nameToRmv = nameToRemove.HWM_TYPE;
                break;
            case "Instrument Collection Condition":
                $scope.nameToRmv = nameToRemove.CONDITION;
                break;
            case "Marker":
                $scope.nameToRmv = nameToRemove.MARKER1;
                break;
            case "Network Name":
                $scope.nameToRmv = nameToRemove.NAME;
                break;
            case "Objective Point Quality":
                $scope.nameToRmv = nameToRemove.QUALITY;
                break;
            case "Objective Point Type":
                $scope.nameToRmv = nameToRemove.OP_TYPE;
                break;
            case "Sensor Brand":
                $scope.nameToRmv = nameToRemove.BRAND_NAME;
                break;
            case "Deployment Type":
                $scope.nameToRmv = nameToRemove.METHOD;
                break;
            case "Status Type":
                $scope.nameToRmv = nameToRemove.STATUS;
                break;
            case "Sensor Type":
                $scope.nameToRmv = nameToRemove.SENSOR;
                break;
            case "Network Type":
                $scope.nameToRmv = nameToRemove.NETWORK_TYPE_NAME;
                break;
            case "Vertical Collection Method":
                $scope.nameToRmv = nameToRemove.VCOLLECT_METHOD;
                break;
            case "Vertical Datum":
                $scope.nameToRmv = nameToRemove.DATUM_ABBREVIATION;
                break;
            case "Objective Point":
                $scope.nameToRmv = nameToRemove.NAME;
                break;
            case "HWM":
                var aDate = new Date(nameToRemove.FLAG_DATE);
                var year = aDate.getFullYear();
                var month = aDate.getMonth();
                var day = ('0' + aDate.getDate()).slice(-2);
                var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                var dateWOtime = monthNames[month] + " " + day + ", " + year;
                
                $scope.nameToRmv = "Flagged on: " + dateWOtime;
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
    } 
}());