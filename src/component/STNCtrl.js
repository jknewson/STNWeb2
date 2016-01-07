(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var SettingsControllers = angular.module('SettingsControllers',
      ['ngInputModified', 'ui.validate', 'angular.filter', 'xeditable', 'checklist-model', 'ngFileUpload']);

    var STNControllers = angular.module('STNControllers', []);
    var ModalControllers = angular.module('ModalControllers', []);

    //#region $ccokies variables
    /*
    * STNCreds, STNUsername, usersName, mID, usersRole, SessionEventID, SessionEventName, SessionTeaID, SessionTeamName
    */
    //#endregion $cookies variables

    //#region CONSTANTS
    var utcDateTime = function () {
        var getMonth = function (mo) {
            switch (mo) {
                case 'Jan':
                    return '01';
                    break;
                case 'Feb':
                    return '02';
                    break;
                case 'Mar':
                    return '03';
                    break;
                case 'Apr':
                    return '04';
                    break;
                case 'May':
                    return '05';
                    break;
                case 'Jun':
                    return '06';
                    break;
                case 'Jul':
                    return '07';
                    break;
                case 'Aug':
                    return '08';
                    break;
                case 'Sep':
                    return '09';
                    break;
                case 'Oct':
                    return '10';
                    break;
                case 'Nov':
                    return '11';
                    break;
                case 'Dec':
                    return '12';
                    break;
            }
    }
        var Time_Stamp = new Date().toUTCString();// "Wed, 09 Dec 2015 17:18:26 GMT" == change to standard time for storage
        var mo = Time_Stamp.substr(8, 3);
        var actualMo = getMonth(mo);
        var day = Time_Stamp.substr(5, 2);
        var year = Time_Stamp.substr(12, 4);
        var hr = Time_Stamp.substr(17,2);
        var standardHrs = hr > 12 ? '0'+(hr-12).toString() : hr.toString();
        var min = Time_Stamp.substr(20, 2);
        var sec = Time_Stamp.substr(23, 2);;
        var amPm = hr > 12 ? 'PM' : 'AM';
        var time_stampNEW = actualMo + '/' + day + '/' + year + ' ' + standardHrs + ':' + min + ':' + sec + ' ' + amPm; //12/09/2015 04:22:32PM
        return time_stampNEW;
    }
    //regular expression for a password requirement of at least 8 characters long and at least 3 of 4 character categories used (upper, lower, digit, special
    STNControllers.constant('RegExp', {
        PASSWORD: /^(((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]))|((?=.*[a-z])(?=.*[A-Z])(?=.*[!@@?#$%^&_:;-]))|((?=.*[a-z])(?=.*[0-9])(?=.*[!@@?#$%^&_:;-]))|((?=.*[A-Z])(?=.*[0-9])(?=.*[!@@?#$%^&_:;-]))).{8,}$/
    });
    //#endregion CONSTANTS


    //#endregion NAV Controller
    
})();