(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';
    var STNControllers = angular.module('STNControllers');

    //try this one Monday:::
    //http://www.ng-newsletter.com/posts/d3-on-angular.html
    STNControllers.directive('barsChart', ['$parse', function ($parse) {
        var directiveDefinitionObject = {
            //We restrict its use to an element as usually  <bars-chart> is semantically more understandable
            restrict: 'E',
            //this is important, we don't want to overwrite our directive declaration in the HTML mark-up
            replace: false,
            scope: {
                data: '=elevationData'
            },
            link: function (scope, element, attrs) {
                //converting all data passed thru into an array
                var data = attrs.elevationData.split(',');
                //in D3, any selection[0] contains the group selection[0][0] is the DOM node but we won't need that this time
                var chart = d3.select(element[0]);
                //to our original directive markup bars-chart we add a div with out chart stling and bind each data entry to the chart
                chart.append("div").attr("class", "chart")
                    .selectAll('div')
                    .data(scope.data).enter().append("div")
                    .transition().ease("elastic")
                    .style("width", function (d) { return d + "%"; })
                    .text(function (d) { return d + "%"; });
                //a little of magic: setting it's width based on the data value (d) and text all with a smooth transition
                scope.$watch('data', function (newValue, oldValue) {
                    scope.data = newValue;
                });
            }
        };
        return directiveDefinitionObject;
    }]);
    STNControllers.directive('siteSearch', function () {
        return {
            restrict: 'E',
            scope: {
                model: '=ngModel',
                searchBy: '=', //required
                searchTerm: '='
            },
            replace: true,
            template: '<div class="searchnav">' +
            '<div class="searchby"><b>Search By:</b>' +
            '<div class="searchbyoption"><input type="radio" name="SearchBy" ng-model="searchBy.val" value="bySiteId" />ID</div>' +
            '<div class="searchbyoption"><input type="radio" name="SearchBy" ng-model="searchBy.val" value="bySiteNo" />Number</div>' +
            '<div class="searchbyoption"><input type="radio" name="SearchBy" ng-model="searchBy.val" value="bySiteName" />Name</div></div>' +
            '<div class="search-input"><input ng-focus="goSearch" type="text" ng-model="searchTerm" ng-enter="IndexSearchSites()" placeholder="Search Sites..." />' +
            '<button type="button" class="borderLess" ng-click="IndexSearchSites()">Search <i class="ion-search"></i></button></div></div>',

            controller: [
                '$scope', '$state', '$http', 'SITE', '$uibModal',
                function ($scope, $state, $http, SITE, $uibModal) {
                    $scope.searchTerm = '';
                    $scope.searchBy = { val: 'bySiteNo' };
                    $scope.placeholder = '...';
                    $scope.IndexSearchSites = function () {
                        if ($scope.searchTerm !== "") {
                            $http.defaults.headers.common.Accept = 'application/json';
                            switch ($scope.searchBy.val) {
                                case 'bySiteNo':
                                    SITE.getSearchedSite({ bySiteNo: $scope.searchTerm }, function success(resp) {
                                        siteSearchResponse(resp);
                                    }, function error(errorResponse) {
                                        siteSearchResponse(errorResponse);
                                    });
                                    break;
                                case 'bySiteId':
                                    SITE.getSearchedSite({ bySiteId: $scope.searchTerm }, function (resp) {
                                        siteSearchResponse(resp);
                                    }, function (errorResponse) {
                                        siteSearchResponse(errorResponse);
                                    });
                                    break;
                                case 'bySiteName':
                                    SITE.getSearchedSite({ bySiteName: $scope.searchTerm }, function (resp) {
                                        siteSearchResponse(resp);
                                    }, function (errorResponse) {
                                        siteSearchResponse(errorResponse);
                                    });
                                    break;
                            }
                        }
                    };
                    var siteSearchResponse = function (s) {
                        if (s.status !== undefined) {
                            //errorstatus show modal with error message 'no site found'
                            var errorModal = $uibModal.open({
                                template: '<div class="modal-header"><h3 class="modal-title">Error</h3></div>' +
                                '<div class="modal-body"><p>No site found. For more site search options, go to the Sites navigation tab to search for sites.</p></div>' +
                                '<div class="modal-footer"><button type="button" class="btn btn-primary" ng-click="ok()">OK</button></div>',
                                controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                    $scope.ok = function () {
                                        $uibModalInstance.close();
                                    };
                                }],
                                size: 'sm'

                            });
                            errorModal.result.then(function () {
                                $scope.searchTerm = '';
                                $scope.searchBy = { val: 'bySiteNo' };
                            });

                        } else {
                            //reset search and go to the site dash
                            $scope.searchTerm = '';
                            $scope.searchBy = { val: 'bySiteNo' };
                            $state.go('site.dashboard', { id: s.site_id });
                        }
                    };
                }
            ]
        };
    });

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

    STNControllers.directive('sameAs', ['$parse', function ($parse) {
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
    }]);

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

    //used on event name to make sure no special characters
    STNControllers.directive('inputRestrictor', [
        function () {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (scope, element, attr, ngModelCtrl) {
                    var pattern = /[^a-zA-Z0-9- _]/g;

                    function fromUser(text) {
                        if (!text)
                            return text;

                        var transformedInput = text.replace(pattern, '');
                        if (transformedInput !== text) {
                            ngModelCtrl.$setViewValue(transformedInput);
                            ngModelCtrl.$render();
                        }
                        return transformedInput;
                    }
                    ngModelCtrl.$parsers.push(fromUser);
                }
            };
        }
    ]);

    STNControllers.directive('labelLimitLength', function () {
        return {
            restrict: "A",
            link: function (scope, elem, attrs) {
                var limit = parseInt(attrs.labelLimitLength);
                angular.element(elem).on("keypress", function (e) {
                    if (this.value.length == limit) e.preventDefault();
                });
            }
        };
    });

    // Directive for generic chart, pass in chart options
    STNControllers.directive('hcChart', function () {
        return {
            restrict: 'E',
            template: '<div></div>',
            scope: {
                options: '='
            },
            link: function (scope, element) {
                Highcharts.chart(element[0], scope.options);
            }

        };
    });
    /* STNControllers.directive('hcChart', function () {
        return {
            restrict: 'E',
            template: '<div></div>',
            scope: {
                options: '='
            },
            link: function (scope, element, attrs) {
                Highcharts.chart(element[0], scope.options);
                attrs.chart = new Highcharts(element[0], {
                    chart: {
                        type: 'line',
                        zoomType: 'x',
                        panning: true,
                        panKey: 'shift'
                    },
                    boostThreshold: 2000,
                    title: {
                        text: 'Chopper Results'
                    },
                    subtitle: {
                        text: 'Click and drag to zoom in. Hold down shift key to pan.'
                    }
                });
                // Highcharts.chart(element[0], scope.options);
                scope.$watch(function () {
                    return attrs.series;
                }, function () {
                    attrs.chart.series.setData($parse(attrs.series)(scope).data);
                });
            }
        };
    });*/
})();
