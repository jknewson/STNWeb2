(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';
    var STNControllers = angular.module('STNControllers');
    //#region DIRECTIVES
    //print test
    STNControllers.directive('print', ['$compile', function ($compile) {
        return {
            restrict: 'AEC',
            link: function (scope, el, attrs) {
                if (attrs.nopopup) {
                    el.bind('click', function () {
                        window.print();
                    });
                } else {
                    el.bind('click', function () {
                        var html = document.getElementById(attrs.print);
                        var links = document.getElementsByTagName('link');
                        var stylesheets = "";
                        for (var i = 0; i < links.length; i++) {
                            stylesheets = stylesheets + links[i].outerHTML;
                        }
                        var printarea = window.open('', '', '');
                        printarea.document.write('<html><head><title></title>');
                        printarea.document.write(stylesheets);
                        printarea.document.write('<style>label {font-weight: 600;} *{font-size: medium;}</style></head><body>');
                        printarea.document.write('<h2>Short Term Network Modeling</h2>');
                        printarea.document.write(html.innerHTML);
                        printarea.document.write('</body></html>');
                        printarea.print();
                        printarea.close();

                    });
                }
            }
        };
    }]);

    //This directive allows us to pass a function in on an enter key to do what we want.
    STNControllers.directive('ngEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.ngEnter);
                    });
                    event.preventDefault();
                }
            });
        };
    });

    //focus on the first element of the page
    STNControllers.directive('numericOnly', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, modelCtrl) {

                modelCtrl.$parsers.push(function (inputValue) {
                    var transformedInput = inputValue ? inputValue.replace(/[^\d.-]/g, '') : null;

                    if (transformedInput != inputValue) {
                        modelCtrl.$setViewValue(transformedInput);
                        modelCtrl.$render();
                    }

                    return transformedInput;
                });
            }
        };
    });

    // format the ng-model date as date on initial load
    STNControllers.directive('datepickerPopup', function () {
        return {
            restrict: 'EAC',
            require: 'ngModel',
            link: function (scope, element, attr, controller) {
                //remove the default formatter from the input directive to prevent conflict
                controller.$formatters.shift();
            }
        };
    });

    STNControllers.directive('focus', function () {
        return function (scope, element, attributes) {
            element[0].focus();
        };
    });

    STNControllers.directive('backButton', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.bind('click', goBack);

                function goBack() {
                    history.back();
                    scope.$apply();
                }
            }
        };
    });

    //validate password
    STNControllers.directive('passwordValidate', ['RegExp', function (regex) {
        return {
            require: 'ngModel',
            link: function (scope, elm, attrs, ctrl) {
                elm.unbind('keydown').unbind('change');
                elm.bind('blur', function (viewValue) {
                    scope.$apply(function () {
                        if ((regex.PASSWORD).test(viewValue.target.value)) {
                            //it is valid
                            ctrl.$setValidity("passwordValidate", true);
                            return viewValue;
                        } else {
                            //it is invalid, return undefined - no model update
                            ctrl.$setValidity("passwordValidate", false);
                            return undefined;
                        }
                    });
                });
            }
        };
    }]);

    STNControllers.directive('sameAs', function ($parse) {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function (scope, elm, attrs, ctrl) {
                elm.unbind('keydown').unbind('change');
                elm.bind('blur', function (viewValue) {
                    scope.$watch(function () {
                        return $parse(attrs.sameAs)(scope) === ctrl.$modelValue;
                    }, function (currentValue) {
                        ctrl.$setValidity('passwordMismatch', currentValue);
                    });
                });
            }
        };
    });

    //make textarea height equal to content inside it (no scrollbars) http://stackoverflow.com/questions/17772260/textarea-auto-height
    STNControllers.directive('elastic', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function ($scope, element) {
                $scope.initialHeight = $scope.initialHeight || element[0].style.height;
                var resize = function () {
                    element[0].style.height = $scope.initialHeight;
                    element[0].style.height = "" + element[0].scrollHeight + "px";
                };
                element.on("input change", resize);
                $timeout(resize, 0);
            }
        };
    }]);

    STNControllers.directive('myInputMask', function () {
        return {
            restrict: 'AC',
            link: function (scope, el, attrs) {
                el.inputmask(scope.$eval(attrs.myInputMask));
                el.on('change', function () {
                    scope.$eval(attrs.ngModel + "='" + el.val() + "'");
                    // or scope[attrs.ngModel] = el.val() if your expression doesn't contain dot.
                });
            }
        };
    });

    //bind file upload file to a model scope var
    STNControllers.directive('fileModel', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var model = $parse(attrs.fileModel);
                var modelSetter = model.assign;

                element.bind('change', function () {
                    scope.$apply(function () {
                        modelSetter(scope, element[0].files[0]);
                    });
                });
            }
        };
    }]);

    //STNControllers.directive('datetimez', function () {
    //    //http://tarruda.github.io/bootstrap-datetimepicker/#api  -- can't get it working right now
    //    return {
    //        restrict: 'A',
    //        require: 'ngModel',
    //        link: function (scope, element, attrs, ngModelCtrl) {
    //            element.datetimepicker({
    //                dateFormat: 'dd/MM/yyyy hh:mm:ss',
    //                language: 'pt-BR'
    //            }).on('changeDate', function (e) {
    //                ngModelCtrl.$setViewValue(e.date);
    //                scope.$apply();
    //            });
    //        }
    //    };
    //});
    //#endregion DIRECTIVES
})();