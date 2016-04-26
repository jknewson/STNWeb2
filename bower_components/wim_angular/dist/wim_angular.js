//------------------------------------------------------------------------------
//----- WiM Legend ------------------------------------------------------
//------------------------------------------------------------------------------
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
//-------1---------2---------3---------4---------5---------6---------7---------8
//       01234567890123456789012345678901234567890123456789012345678901234567890
//-------+---------+---------+---------+---------+---------+---------+---------+
// copyright:   2015 WiM - USGS
//    authors:  Jeremy K. Newson USGS Wisconsin Internet Mapping
//             
// 
//   purpose:  
//          
//discussion:
//  http://www.ng-newsletter.com/posts/directives.html
//      Restrict parameters
//          'A' - <span ng-sparkline></span>
//          'E' - <ng-sparkline > </ng-sparkline>
//          'C' - <span class="ng-sparkline" > </span>
//          'M' - <!--directive: ng - sparkline-- >
//Comments
//04/20/2016 jkn used http://pojo.sodhanalibrary.com/string.html to and added html to template
//01.11.2016 jkn - Created
//Import
var WiM;
(function (WiM) {
    var Directives;
    (function (Directives) {
        'use string';
        Directives.onLayerAdded = "onLayerAdded";
        Directives.onLayerChanged = "onLayerChanged";
        Directives.onLayerRemoved = "onLayerRemoved";
        var LegendLayerAddedEventArgs = (function (_super) {
            __extends(LegendLayerAddedEventArgs, _super);
            function LegendLayerAddedEventArgs(layername, ltype, style) {
                _super.call(this);
                this.LayerName = layername;
                this.layerType = ltype;
                this.style = style;
            }
            return LegendLayerAddedEventArgs;
        }(WiM.Event.EventArgs));
        Directives.LegendLayerAddedEventArgs = LegendLayerAddedEventArgs;
        var LegendLayerChangedEventArgs = (function (_super) {
            __extends(LegendLayerChangedEventArgs, _super);
            function LegendLayerChangedEventArgs(layername, propertyname, value) {
                _super.call(this);
                this.LayerName = layername;
                this.PropertyName = propertyname;
                this.Value = value;
            }
            return LegendLayerChangedEventArgs;
        }(WiM.Event.EventArgs));
        Directives.LegendLayerChangedEventArgs = LegendLayerChangedEventArgs;
        var LegendLayerRemovedEventArgs = (function (_super) {
            __extends(LegendLayerRemovedEventArgs, _super);
            function LegendLayerRemovedEventArgs(layername, ltype) {
                _super.call(this);
                this.LayerName = layername;
                this.layerType = ltype;
            }
            return LegendLayerRemovedEventArgs;
        }(WiM.Event.EventArgs));
        Directives.LegendLayerRemovedEventArgs = LegendLayerRemovedEventArgs;
        var wimLegendController = (function (_super) {
            __extends(wimLegendController, _super);
            function wimLegendController($scope, $http, leafletData, eventManager) {
                var _this = this;
                _super.call(this, $http, '');
                $scope.vm = this;
                this.eventManager = eventManager;
                //subscribe to Events
                this.eventManager.AddEvent(Directives.onLayerAdded);
                this.eventManager.AddEvent(Directives.onLayerChanged);
                this.eventManager.AddEvent(Directives.onLayerRemoved);
                this.eventManager.SubscribeToEvent(Directives.onLayerAdded, new WiM.Event.EventHandler(function (sender, e) {
                    _this.onLayerAdded(sender, e);
                }));
                this.eventManager.SubscribeToEvent(Directives.onLayerRemoved, new WiM.Event.EventHandler(function (sender, e) {
                    _this.onLayerRemoved(sender, e);
                }));
                this.leafletData = leafletData;
                this.init();
            }
            //Methods  
            //-+-+-+-+-+-+-+-+-+-+-+-
            wimLegendController.prototype.initOverlays = function (mlyr) {
                if (mlyr.type != "agsDynamic")
                    return;
                //getsublayers
                var url = mlyr.url + "/legend?f=pjson";
                var request = new Services.Helpers.RequestInfo(url, true);
                this.Execute(request).then(function (response) {
                    //console.log(response.data);
                    if (response.data.layers.length > 0) {
                        mlyr.isOpen = true;
                        mlyr.layerArray = response.data.layers;
                    }
                }, function (error) {
                });
            };
            wimLegendController.prototype.changeBaseLayer = function (key, evt) {
                var _this = this;
                this.baselayers.selectedlayerName = key.toString();
                this.leafletData.getMap().then(function (map) {
                    _this.leafletData.getLayers().then(function (maplayers) {
                        if (map.hasLayer(maplayers.baselayers[key])) {
                            return;
                        }
                        for (var mlayr in maplayers.baselayers) {
                            if (map.hasLayer(maplayers.baselayers[mlayr])) {
                                map.removeLayer(maplayers.baselayers[mlayr]);
                            } //end if
                        } //next
                        map.addLayer(maplayers.baselayers[key]);
                    });
                });
                evt.preventDefault();
            }; //end change baseLayer
            wimLegendController.prototype.toggleLayer = function (layerName, visibility) {
                var layer = this.applicationLayer.layergroup[layerName];
                layer.visible = (layer.visible) ? false : true;
                this.eventManager.RaiseEvent(Directives.onLayerChanged, this, new LegendLayerChangedEventArgs(layerName, "visible", layer.visible));
            };
            //Helper Methods
            wimLegendController.prototype.init = function () {
                var _this = this;
                this.overlays = {};
                this.baselayers = {};
                this.baselayers.isOpen = true;
                this.applicationLayer = {
                    selectedlayerName: "Application Layers",
                    isAvailable: false,
                    layergroup: {},
                    isOpen: false
                };
                this.leafletData.getMap().then(function (map) {
                    _this.leafletData.getLayers().then(function (maplayers) {
                        for (var key in maplayers.baselayers) {
                            if (map.hasLayer(maplayers.baselayers[key])) {
                                _this.baselayers.selectedlayerName = key.toString();
                                break;
                            } //end if
                        } //next
                    }); //end getLayers                                
                }); //end getMap 
            }; //end init
            wimLegendController.prototype.onLayerAdded = function (sender, e) {
                if (e.layerType != 'geojson')
                    return;
                //add to legend
                if (this.applicationLayer.layergroup.hasOwnProperty(e.LayerName))
                    return;
                this.applicationLayer.isAvailable = true;
                this.applicationLayer.layergroup[e.LayerName] = {
                    visible: true,
                    style: e.style
                };
            };
            wimLegendController.prototype.onLayerRemoved = function (sender, e) {
                if (e.layerType != 'geojson')
                    return;
                //remove
                if (this.applicationLayer.layergroup.hasOwnProperty(e.LayerName))
                    delete this.applicationLayer[e.LayerName];
            };
            //Constructor
            //-+-+-+-+-+-+-+-+-+-+-+-
            wimLegendController.$inject = ['$scope', '$http', 'leafletData', 'WiM.Event.EventManager'];
            return wimLegendController;
        }(Services.HTTPServiceBase)); //end wimLayerControlController class
        var wimLegend = (function () {
            function wimLegend() {
                //create isolated scope
                this.scope = {
                    icons: '=?',
                    autoHideOpacity: '=?',
                    showGroups: '=?',
                    title: '@',
                    baseTitle: '@',
                    overlaysTitle: '@'
                };
                this.restrict = 'E';
                this.require = '^leaflet';
                this.transclude = false;
                this.controller = wimLegendController;
                this.template = '<div ng-class="vm.layerControlExpanded ? \'angular-leaflet-control-layers-expanded\' : \'angular-leaflet-control-layers-collapsed\'" ng-click="vm.layerControlExpanded = true; $event.stopPropagation(); $event.preventDefault()" ng-init="vm.layerControlExpanded == false">' +
                    '    <div ng-show="vm.layerControlExpanded">' +
                    '        <button class="close-legend" ng-click="vm.layerControlExpanded = false; $event.stopPropagation();">Close Legend</button>' +
                    '        <div class="list-group">' +
                    '            <!-- baselayers -->' +
                    '            <a ng-class="!vm.baselayers.isOpen  ? \'wimLegend-list-group-item-active\': \'wimLegend-list-group-item\'" ng-click="vm.baselayers.isOpen=(vm.baselayers.isOpen) ? false : true;">' +
                    '                Base Maps' +
                    '                <i ng-class="!vm.baselayers.isOpen ? \'fa fa-chevron-up pull-right\': \'fa fa-chevron-down pull-right\'"></i>' +
                    '            </a> ' +
                    '            <div ng-hide="vm.baselayers.isOpen" class="wimLegend-list-group-body">' +
                    '                <div class="sitebar-item" ng-repeat="(key, layer) in vm.baselayers.layergroup">' +
                    '                    <input type="radio" id="baselayerRadio{{$id}}" ng-checked="$parent.vm.baselayers.selectedlayerName === key.toString()" ng-value="key.toString()" /><label for="baselayerRadio{{$id}}" ng-click="vm.changeBaseLayer(key, $event)">{{layer.name}}</label>' +
                    '                </div>' +
                    '            </div>  ' +
                    '            <!-- Application Layers -->' +
                    '            <div ng-if="vm.applicationLayer.isAvailable">' +
                    '                <div ng-class="vm.applicationLayer.isOpen  ? \'wimLegend-list-group-item-active\': \'wimLegend-list-group-item\'">' +
                    '                    <label> {{vm.applicationLayer.selectedlayerName}}</label>' +
                    '                    <i ng-class="vm.applicationLayer.isOpen ? \'fa fa-chevron-up pull-right\': \'fa fa-chevron-down pull-right\'" ng-click="vm.applicationLayer.isOpen=(vm.applicationLayer.isOpen) ? false : true;"></i>' +
                    '                </div>' +
                    '                <div ng-show="vm.applicationLayer.isOpen">' +
                    '                    <div ng-repeat="(key, lyr) in vm.applicationLayer.layergroup">' +
                    '                        <input type="checkbox" id="applicationLayer{{$id}}" ng-checked="lyr.visible" ng-value="lyr.visible" />                        ' +
                    '                        <label for="applicationLayer{{$id}}" ng-click="$parent.vm.toggleLayer(key.toString(), lyr.visible)"><img ng-src={{lyr.style.imagesrc}} />{{lyr.style.displayName}}</label>' +
                    '                    </div>' +
                    '                </div>' +
                    '            </div>' +
                    '            <!-- overlays --> ' +
                    '            <div ng-repeat="layer in vm.overlays.layergroup" ng-init="vm.initOverlays(layer)">' +
                    '                <div ng-if="!layer.layerParams.showOnSelector && layer.layerParams.showOnSelector !== false" ng-class="!layer.isOpen  ? \'wimLegend-list-group-item-active\': \'wimLegend-list-group-item\'">' +
                    '                    <input type="checkbox" id="checkbox{{$id}}" ng-checked="layer.visible" />' +
                    '                    <label for="checkbox{{$id}}" ng-if="!layer.layerParams.showOnSelector && layer.layerParams.showOnSelector !== false" ng-click="layer.visible = (layer.visible) ? false : true;">' +
                    '                        {{layer.name}}' +
                    '                    </label>' +
                    '                    <i ng-class="!layer.isOpen ? \'fa fa-chevron-up pull-right\': \'fa fa-chevron-down pull-right\'" ng-click="layer.isOpen=(layer.isOpen) ? false : true;"></i>' +
                    '                </div>' +
                    '                <div ng-hide="layer.isOpen">' +
                    '                    <div class="legendGroup" ng-if="layer.type == \'agsDynamic\'">' +
                    '                        <div ng-repeat="lyr in layer.layerArray ">' +
                    '                            <label>{{lyr.layerName}}</label>' +
                    '                            <div ng-repeat="leg in lyr.legend ">' +
                    '                                <img class="legendSwatch" alt="Embedded Image"' +
                    '                                     src="data:{{leg.contentType}};base64,{{leg.imageData}}" />' +
                    '                                <i>{{leg.label}}</i>' +
                    '                            </div>' +
                    '                        </div>' +
                    '                    </div>' +
                    '                </div>' +
                    '            </div>' +
                    '            ' +
                    '        </div>' +
                    '    </div>' +
                    '</div>';
                this.replace = true;
            }
            wimLegend.instance = function () {
                return new wimLegend;
            };
            wimLegend.prototype.link = function (scope, element, attributes, controller) {
                //this is where we can register listeners, set up watches, and add functionality. 
                // The result of this process is why the live data- binding exists between the scope and the DOM tree.
                var leafletScope = controller.getLeafletScope();
                var layers = leafletScope.layers;
                scope.vm.overlays.layergroup = layers.overlays;
                scope.vm.baselayers.layergroup = layers.baselayers;
                element.bind('click', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                });
                element.bind('mouseover', function (e) {
                    controller.getMap().then(function (map) {
                        map.dragging.disable();
                        map.doubleClickZoom.disable;
                        map.scrollWheelZoom.disable();
                    }); //end getMap   
                });
                element.bind('mouseout', function (e) {
                    controller.getMap().then(function (map) {
                        map.dragging.enable();
                        map.doubleClickZoom.enable();
                        map.scrollWheelZoom.enable();
                    }); //end getMap  
                });
            }; //end link
            return wimLegend;
        }()); //end UrlDirective
        angular.module('wim_angular')
            .directive('wimLegend', wimLegend.instance);
    })(Directives = WiM.Directives || (WiM.Directives = {}));
})(WiM || (WiM = {})); //end module 
//# sourceMappingURL=wimLegend.js.map
(function () {
    'use strict';
    angular
        .module('wim_angular', []);
})();
//# sourceMappingURL=directives.module.js.map
//------------------------------------------------------------------------------
//----- WiM About --------------------------------------------------------------
//------------------------------------------------------------------------------
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var WiM;
(function (WiM) {
    var Directives;
    (function (Directives) {
        'use string';
        var SupportTicketData = (function () {
            function SupportTicketData() {
            }
            return SupportTicketData;
        })();
        var GitHubIssueData = (function () {
            function GitHubIssueData() {
            }
            return GitHubIssueData;
        })();
        var wimAboutController = (function (_super) {
            __extends(wimAboutController, _super);
            function wimAboutController($scope, $http) {
                _super.call(this, $http, '');
                $scope.vm = this;
                this.gitHubIssues = new GitHubIssueData();
                this.SupportTicketData = new SupportTicketData();
                this.selectedAboutTabName = "about";
                this.selectedHelpTabName = "faq";
                this.aboutSelected = false;
                this.helpSelected = false;
                this.displayMessage;
                this.isValid = false;
            }
            wimAboutController.prototype.uploadFile = function (event) {
                this.SupportTicketData.attachments = event.target.files;
            };
            wimAboutController.prototype.submitTicket = function (isValid) {
                //console.log("ticket form validity: ", isValid);
                var _this = this;
                var url = 'https://streamstatshelp.zendesk.com/api/v2/tickets.json ';
                var data = angular.toJson({ "ticket": this.SupportTicketData });
                var user = 'marsmith@usgs.gov';
                var token = 'bCkA8dLeVkzs5mTPamt1g7zv8EMKUCuTRpPkW7Ez';
                var headers = {
                    "Authorization": "Basic " + btoa(user + '/token:' + token)
                };
                var request = new WiM.Services.Helpers.RequestInfo(url, true, WiM.Services.Helpers.methodType.POST, 'json', data, headers);
                this.Execute(request).then(function (response) {
                    alert("Your request has been submitted.  Your request will be addressed as soon as possible");
                    _this.SupportTicketData = new SupportTicketData();
                }, function (error) {
                }).finally(function () {
                });
            };
            wimAboutController.prototype.toggleHelpSelected = function () {
                if (this.helpSelected)
                    this.helpSelected = false;
                else
                    this.helpSelected = true;
            };
            wimAboutController.prototype.toggleAboutSelected = function () {
                if (this.aboutSelected)
                    this.aboutSelected = false;
                else
                    this.aboutSelected = true;
            };
            wimAboutController.prototype.selectAboutTab = function (tabname) {
                if (this.selectedAboutTabName == tabname)
                    return;
                this.selectedAboutTabName = tabname;
            };
            wimAboutController.prototype.selectHelpTab = function (tabname) {
                if (this.selectedHelpTabName == tabname)
                    return;
                this.selectedHelpTabName = tabname;
            };
            wimAboutController.$inject = ['$scope', '$http'];
            return wimAboutController;
        })(WiM.Services.HTTPServiceBase);
        var wimAbout = (function () {
            function wimAbout() {
                this.scope = true;
                this.restrict = 'E';
                this.controller = wimAboutController;
                this.templateUrl = 'Views/about/about.html';
            }
            wimAbout.instance = function () {
                return new wimAbout;
            };
            wimAbout.prototype.link = function (scope, element, attributes, controller) {
                //this is where we can register listeners, set up watches, and add functionality. 
                // The result of this process is why the live data- binding exists between the scope and the DOM tree.
            };
            return wimAbout;
        })();
        angular.module('wim_angular')
            .directive('wimAbout', wimAbout.instance);
    })(Directives = WiM.Directives || (WiM.Directives = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=wimAbout.js.map
//------------------------------------------------------------------------------
//----- WiM Legend ------------------------------------------------------
//------------------------------------------------------------------------------
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var WiM;
(function (WiM) {
    var Directives;
    (function (Directives) {
        'use string';
        Directives.onLayerAdded = "onLayerAdded";
        Directives.onLayerChanged = "onLayerChanged";
        Directives.onLayerRemoved = "onLayerRemoved";
        var LegendLayerAddedEventArgs = (function (_super) {
            __extends(LegendLayerAddedEventArgs, _super);
            function LegendLayerAddedEventArgs(layername, ltype, style) {
                _super.call(this);
                this.LayerName = layername;
                this.layerType = ltype;
                this.style = style;
            }
            return LegendLayerAddedEventArgs;
        })(WiM.Event.EventArgs);
        Directives.LegendLayerAddedEventArgs = LegendLayerAddedEventArgs;
        var LegendLayerChangedEventArgs = (function (_super) {
            __extends(LegendLayerChangedEventArgs, _super);
            function LegendLayerChangedEventArgs(layername, propertyname, value) {
                _super.call(this);
                this.LayerName = layername;
                this.PropertyName = propertyname;
                this.Value = value;
            }
            return LegendLayerChangedEventArgs;
        })(WiM.Event.EventArgs);
        Directives.LegendLayerChangedEventArgs = LegendLayerChangedEventArgs;
        var LegendLayerRemovedEventArgs = (function (_super) {
            __extends(LegendLayerRemovedEventArgs, _super);
            function LegendLayerRemovedEventArgs(layername, ltype) {
                _super.call(this);
                this.LayerName = layername;
                this.layerType = ltype;
            }
            return LegendLayerRemovedEventArgs;
        })(WiM.Event.EventArgs);
        Directives.LegendLayerRemovedEventArgs = LegendLayerRemovedEventArgs;
        var wimLegendController = (function (_super) {
            __extends(wimLegendController, _super);
            function wimLegendController($scope, $http, leafletData, eventManager) {
                var _this = this;
                _super.call(this, $http, '');
                $scope.vm = this;
                this.eventManager = eventManager;
                this.eventManager.AddEvent(Directives.onLayerAdded);
                this.eventManager.AddEvent(Directives.onLayerChanged);
                this.eventManager.AddEvent(Directives.onLayerRemoved);
                this.eventManager.SubscribeToEvent(Directives.onLayerAdded, new WiM.Event.EventHandler(function (sender, e) {
                    _this.onLayerAdded(sender, e);
                }));
                this.eventManager.SubscribeToEvent(Directives.onLayerRemoved, new WiM.Event.EventHandler(function (sender, e) {
                    _this.onLayerRemoved(sender, e);
                }));
                this.leafletData = leafletData;
                this.init();
            }
            wimLegendController.prototype.initOverlays = function (mlyr) {
                if (mlyr.type != "agsDynamic")
                    return;
                var url = mlyr.url + "/legend?f=pjson";
                var request = new WiM.Services.Helpers.RequestInfo(url, true);
                this.Execute(request).then(function (response) {
                    if (response.data.layers.length > 0) {
                        mlyr.isOpen = true;
                        mlyr.layerArray = response.data.layers;
                    }
                }, function (error) {
                });
            };
            wimLegendController.prototype.changeBaseLayer = function (key, evt) {
                var _this = this;
                this.baselayers.selectedlayerName = key.toString();
                this.leafletData.getMap().then(function (map) {
                    _this.leafletData.getLayers().then(function (maplayers) {
                        if (map.hasLayer(maplayers.baselayers[key])) {
                            return;
                        }
                        for (var mlayr in maplayers.baselayers) {
                            if (map.hasLayer(maplayers.baselayers[mlayr])) {
                                map.removeLayer(maplayers.baselayers[mlayr]);
                            }
                        }
                        map.addLayer(maplayers.baselayers[key]);
                    });
                });
                evt.preventDefault();
            };
            wimLegendController.prototype.toggleLayer = function (layerName, visibility) {
                var layer = this.applicationLayer.layergroup[layerName];
                layer.visible = (layer.visible) ? false : true;
                this.eventManager.RaiseEvent(Directives.onLayerChanged, this, new LegendLayerChangedEventArgs(layerName, "visible", layer.visible));
            };
            wimLegendController.prototype.init = function () {
                var _this = this;
                this.overlays = {};
                this.baselayers = {};
                this.baselayers.isOpen = true;
                this.applicationLayer = {
                    selectedlayerName: "Application Layers",
                    isAvailable: false,
                    layergroup: {},
                    isOpen: false
                };
                this.leafletData.getMap().then(function (map) {
                    _this.leafletData.getLayers().then(function (maplayers) {
                        for (var key in maplayers.baselayers) {
                            if (map.hasLayer(maplayers.baselayers[key])) {
                                _this.baselayers.selectedlayerName = key.toString();
                                break;
                            }
                        }
                    });
                });
            };
            wimLegendController.prototype.onLayerAdded = function (sender, e) {
                if (e.layerType != 'geojson')
                    return;
                if (this.applicationLayer.layergroup.hasOwnProperty(e.LayerName))
                    return;
                this.applicationLayer.isAvailable = true;
                this.applicationLayer.layergroup[e.LayerName] = {
                    visible: true,
                    style: e.style
                };
            };
            wimLegendController.prototype.onLayerRemoved = function (sender, e) {
                if (e.layerType != 'geojson')
                    return;
                if (this.applicationLayer.layergroup.hasOwnProperty(e.LayerName))
                    delete this.applicationLayer[e.LayerName];
            };
            wimLegendController.$inject = ['$scope', '$http', 'leafletData', 'WiM.Event.EventManager'];
            return wimLegendController;
        })(WiM.Services.HTTPServiceBase);
        var wimLegend = (function () {
            function wimLegend() {
                this.scope = {
                    icons: '=?',
                    autoHideOpacity: '=?',
                    showGroups: '=?',
                    title: '@',
                    baseTitle: '@',
                    overlaysTitle: '@',
                };
                this.restrict = 'E';
                this.require = '^leaflet';
                this.transclude = false;
                this.controller = wimLegendController;
                this.template = '<div ng-class="vm.layerControlExpanded ? \'angular-leaflet-control-layers-expanded\' : \'angular-leaflet-control-layers-collapsed\'" ng-click="vm.layerControlExpanded = true; $event.stopPropagation(); $event.preventDefault()" ng-init="vm.layerControlExpanded == false">' +
                    '    <div ng-show="vm.layerControlExpanded">' +
                    '        <button class="close-legend" ng-click="vm.layerControlExpanded = false; $event.stopPropagation();">Close Legend</button>' +
                    '        <div class="list-group">' +
                    '            <!-- baselayers -->' +
                    '            <a ng-class="!vm.baselayers.isOpen  ? \'list-group-item-active\': \'list-group-item\'" ng-click="vm.baselayers.isOpen=(vm.baselayers.isOpen) ? false : true;">' +
                    '                Base Maps' +
                    '                <i ng-class="!vm.baselayers.isOpen ? \'fa fa-chevron-up pull-right\': \'fa fa-chevron-down pull-right\'"></i>' +
                    '            </a> ' +
                    '            <div ng-hide="vm.baselayers.isOpen" class="list-group-body">' +
                    '                <div class="sitebar-item" ng-repeat="(key, layer) in vm.baselayers.layergroup">' +
                    '                    <input type="radio" id="baselayerRadio{{$id}}" ng-checked="$parent.vm.baselayers.selectedlayerName === key.toString()" ng-value="key.toString()" /><label for="baselayerRadio{{$id}}" ng-click="vm.changeBaseLayer(key, $event)">{{layer.name}}</label>' +
                    '                </div>' +
                    '            </div>  ' +
                    '            <!-- Application Layers -->' +
                    '            <div ng-if="vm.applicationLayer.isAvailable">' +
                    '                <div ng-class="vm.applicationLayer.isOpen  ? \'list-group-item-active\': \'list-group-item\'">' +
                    '                    <label> {{vm.applicationLayer.selectedlayerName}}</label>' +
                    '                    <i ng-class="vm.applicationLayer.isOpen ? \'fa fa-chevron-up pull-right\': \'fa fa-chevron-down pull-right\'" ng-click="vm.applicationLayer.isOpen=(vm.applicationLayer.isOpen) ? false : true;"></i>' +
                    '                </div>' +
                    '                <div ng-show="vm.applicationLayer.isOpen">' +
                    '                    <div ng-repeat="(key, lyr) in vm.applicationLayer.layergroup">' +
                    '                        <input type="checkbox" id="applicationLayer{{$id}}" ng-checked="lyr.visible" ng-value="lyr.visible" />                        ' +
                    '                        <label for="applicationLayer{{$id}}" ng-click="$parent.vm.toggleLayer(key.toString(), lyr.visible)"><img ng-src={{lyr.style.imagesrc}} />{{lyr.style.displayName}}</label>' +
                    '                    </div>' +
                    '                </div>' +
                    '            </div>' +
                    '            <!-- overlays --> ' +
                    '            <div ng-repeat="layer in vm.overlays.layergroup" ng-init="vm.initOverlays(layer)">' +
                    '                <div ng-if="!layer.layerParams.showOnSelector && layer.layerParams.showOnSelector !== false" ng-class="!layer.isOpen  ? \'list-group-item-active\': \'list-group-item\'">' +
                    '                    <input type="checkbox" id="checkbox{{$id}}" ng-checked="layer.visible" />' +
                    '                    <label for="checkbox{{$id}}" ng-if="!layer.layerParams.showOnSelector && layer.layerParams.showOnSelector !== false" ng-click="layer.visible = (layer.visible) ? false : true;">' +
                    '                        {{layer.name}}' +
                    '                    </label>' +
                    '                    <i ng-class="!layer.isOpen ? \'fa fa-chevron-up pull-right\': \'fa fa-chevron-down pull-right\'" ng-click="layer.isOpen=(layer.isOpen) ? false : true;"></i>' +
                    '                </div>' +
                    '                <div ng-hide="layer.isOpen">' +
                    '                    <div class="legendGroup" ng-if="layer.type == \'agsDynamic\'">' +
                    '                        <div ng-repeat="lyr in layer.layerArray ">' +
                    '                            <label>{{lyr.layerName}}</label>' +
                    '                            <div ng-repeat="leg in lyr.legend ">' +
                    '                                <img class="legendSwatch" alt="Embedded Image"' +
                    '                                     src="data:{{leg.contentType}};base64,{{leg.imageData}}" />' +
                    '                                <i>{{leg.label}}</i>' +
                    '                            </div>' +
                    '                        </div>' +
                    '                    </div>' +
                    '                </div>' +
                    '            </div>' +
                    '            ' +
                    '        </div>' +
                    '    </div>' +
                    '</div>';
                this.replace = true;
            }
            wimLegend.instance = function () {
                return new wimLegend;
            };
            wimLegend.prototype.link = function (scope, element, attributes, controller) {
                //this is where we can register listeners, set up watches, and add functionality. 
                // The result of this process is why the live data- binding exists between the scope and the DOM tree.
                var leafletScope = controller.getLeafletScope();
                var layers = leafletScope.layers;
                scope.vm.overlays.layergroup = layers.overlays;
                scope.vm.baselayers.layergroup = layers.baselayers;
                element.bind('click', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                });
                element.bind('mouseover', function (e) {
                    controller.getMap().then(function (map) {
                        map.dragging.disable();
                        map.doubleClickZoom.disable;
                        map.scrollWheelZoom.disable();
                    });
                });
                element.bind('mouseout', function (e) {
                    controller.getMap().then(function (map) {
                        map.dragging.enable();
                        map.doubleClickZoom.enable();
                        map.scrollWheelZoom.enable();
                    });
                });
            };
            return wimLegend;
        })();
        angular.module('wim_angular')
            .directive('wimLegend', wimLegend.instance);
    })(Directives = WiM.Directives || (WiM.Directives = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=wimLegend.js.map
var WiM;
(function (WiM) {
    var Event;
    (function (Event) {
        var Delegate = (function () {
            function Delegate() {
                this._eventHandlers = new Array();
            }
            Delegate.prototype.subscribe = function (eventHandler) {
                if (this._eventHandlers.indexOf(eventHandler) == -1) {
                    this._eventHandlers.push(eventHandler);
                }
            };
            Delegate.prototype.unsubscribe = function (eventHandler) {
                var i = this._eventHandlers.indexOf(eventHandler);
                if (i != -1) {
                    this._eventHandlers.splice(i, 1);
                }
            };
            Delegate.prototype.raise = function (sender, e) {
                for (var i = 0; i < this._eventHandlers.length; i++) {
                    this._eventHandlers[i].handle(sender, e);
                }
            };
            return Delegate;
        })();
        Event.Delegate = Delegate;
    })(Event = WiM.Event || (WiM.Event = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=Delegate.js.map
var WiM;
(function (WiM) {
    var Event;
    (function (Event) {
        var EventArgs = (function () {
            function EventArgs() {
            }
            Object.defineProperty(EventArgs, "Empty", {
                get: function () {
                    return new EventArgs();
                },
                enumerable: true,
                configurable: true
            });
            return EventArgs;
        })();
        Event.EventArgs = EventArgs;
    })(Event = WiM.Event || (WiM.Event = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=EventArgs.js.map
var WiM;
(function (WiM) {
    var Event;
    (function (Event) {
        var EventHandler = (function () {
            function EventHandler(handler) {
                this._handler = handler;
            }
            EventHandler.prototype.handle = function (sender, e) {
                this._handler(sender, e);
            };
            return EventHandler;
        })();
        Event.EventHandler = EventHandler;
    })(Event = WiM.Event || (WiM.Event = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=EventHandler.js.map
//------------------------------------------------------------------------------
//----- EventManager -----------------------------------------------------------
//------------------------------------------------------------------------------
var WiM;
(function (WiM) {
    var Event;
    (function (Event_1) {
        'use strict';
        var Event = (function () {
            function Event(delegate) {
                this._onChanged = delegate;
            }
            Object.defineProperty(Event.prototype, "onChanged", {
                get: function () {
                    return this._onChanged;
                },
                enumerable: true,
                configurable: true
            });
            return Event;
        })();
        var EventManager = (function () {
            function EventManager() {
                this._eventList = {};
            }
            EventManager.prototype.AddEvent = function (EventName) {
                if (!this._eventList.hasOwnProperty(EventName))
                    this._eventList[EventName] = new Event(new Event_1.Delegate());
            };
            EventManager.prototype.SubscribeToEvent = function (EventName, handler) {
                if (!this._eventList.hasOwnProperty(EventName)) {
                    this.AddEvent(EventName);
                }
                this._eventList[EventName].onChanged.subscribe(handler);
            };
            EventManager.prototype.RaiseEvent = function (EventName, sender, args) {
                if (sender === void 0) { sender = null; }
                if (args === void 0) { args = Event_1.EventArgs.Empty; }
                if (!this._eventList.hasOwnProperty(EventName))
                    return;
                this._eventList[EventName].onChanged.raise(sender, args);
            };
            EventManager.prototype.UnSubscribeToEvent = function (EventName, handler) {
                if (!this._eventList.hasOwnProperty(EventName))
                    return;
                this._eventList[EventName].onChanged.unsubscribe(handler);
            };
            return EventManager;
        })();
        factory.$inject = [];
        function factory() {
            return new EventManager();
        }
        angular.module('WiM.Event', [])
            .factory('WiM.Event.EventManager', factory);
    })(Event = WiM.Event || (WiM.Event = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=EventManager.js.map
if (!Array.prototype.group) {
    Array.prototype.group = function () {
        var propName = arguments[0];
        var groupings = {};
        this.forEach(function (item) {
            var itemVal = item[propName].toString();
            if (!groupings.hasOwnProperty(itemVal)) {
                groupings[itemVal] = [item];
            }
            else {
                groupings[itemVal].push(item);
            }
        });
        return groupings;
    };
}
//# sourceMappingURL=Array.js.map
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match;
        });
    };
}
//# sourceMappingURL=String.js.map
if (!Number.prototype.toUSGSvalue) {
    Number.prototype.toUSGSvalue = function () {
        var x = parseFloat(this);
        var precision;
        if ((x > 1000000) && (x < 10000000))
            precision = 10000;
        if ((x > 100000) && (x < 1000000))
            precision = 1000;
        if ((x > 10000) && (x < 100000))
            precision = 100;
        if ((x > 1000) && (x < 10000))
            precision = 10;
        if ((x > 100) && (x < 1000))
            precision = 1;
        if (x < 100)
            return Number(x.toFixed(3));
        return parseInt(((x + (precision * .5)) / precision).toString()) * precision;
    };
}
//# sourceMappingURL=SurveyRound.js.map
//------------------------------------------------------------------------------
//----- Table ---------------------------------------------------------------
//------------------------------------------------------------------------------
var WiM;
(function (WiM) {
    var Models;
    (function (Models) {
        var Citation = (function () {
            function Citation(title, author, imageSrc, url) {
                this.Title = title;
                this.Author = author;
                this.imgSrc = imageSrc;
                this.src = url;
            }
            Citation.FromJSON = function (obj) {
                var Title = obj.hasOwnProperty("title") ? obj["title"] : "--";
                var Author = obj.hasOwnProperty("author") ? obj["author"] : "";
                var imgSrc = obj.hasOwnProperty("imgeSrc") ? obj["imgeSrc"] : "";
                var src = obj.hasOwnProperty("src") ? obj["src"] : "";
                return new Citation(Title, Author, imgSrc, src);
            };
            return Citation;
        })();
    })(Models = WiM.Models || (WiM.Models = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=Citation.js.map
var WiM;
(function (WiM) {
    var Models;
    (function (Models) {
        var KeyValue = (function () {
            function KeyValue(k, v) {
                this.k = k;
                this.v = v;
                this.Key = k;
                this.Value = v;
            }
            return KeyValue;
        })();
    })(Models = WiM.Models || (WiM.Models = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=KeyValue.js.map
//------------------------------------------------------------------------------
//----- Table ---------------------------------------------------------------
//------------------------------------------------------------------------------
var WiM;
(function (WiM) {
    var Models;
    (function (Models) {
        var Parameter = (function () {
            function Parameter(n, v, c, d, u, limit) {
                this.name = n;
                this.value = v;
                this.code = c;
                this.unit = u;
                this.description = d;
                this.limits = limit;
            }
            Parameter.FromJSON = function (obj) {
                var name = obj.hasOwnProperty("name") ? obj["name"] : "---";
                var descr = obj.hasOwnProperty("description") ? obj["description"] : "---";
                var code = obj.hasOwnProperty("code") ? obj["code"] : "---";
                var unit = obj.hasOwnProperty("unit") ? obj["unit"] : "---";
                var value = obj.hasOwnProperty("value") ? obj["value"] : -999;
                var limit = obj.hasOwnProperty("limits") && obj["limits"] != null ? Limit.FromJSON(obj["limits"]) : null;
                return new Parameter(name, value, code, descr, unit, limit);
            };
            return Parameter;
        })();
        var Limit = (function () {
            function Limit(min, max) {
                this.min = min;
                this.max = max;
            }
            Limit.FromJSON = function (obj) {
                var min = obj.hasOwnProperty("min") ? obj["min"] : -999;
                var max = obj.hasOwnProperty("max") ? obj["max"] : -999;
                return new Limit(min, max);
            };
            return Limit;
        })();
    })(Models = WiM.Models || (WiM.Models = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=Parameter.js.map
//------------------------------------------------------------------------------
//----- Point ------------------------------------------------------------------
//------------------------------------------------------------------------------
///<reference path="../Extensions/String.ts" />
var WiM;
(function (WiM) {
    var Models;
    (function (Models) {
        var Point = (function () {
            function Point(lat, long, crs) {
                this.Latitude = lat;
                this.Longitude = long;
                this.crs = crs;
            }
            Point.prototype.ToEsriString = function () {
                return "{" + "x:{0},y:{1}".format(this.Longitude.toString(), this.Latitude.toString()) + "}";
            };
            Point.FromJson = function (json) {
                var lat = json.hasOwnProperty("Latitude") ? json["Latitude"] : -9999;
                var long = json.hasOwnProperty("Longitude") ? json["Longitude"] : -9999;
                var wkid = json.hasOwnProperty("wkid") ? json["wkid"] : "---";
                return new Point(lat, long, wkid);
            };
            return Point;
        })();
        Models.Point = Point;
    })(Models = WiM.Models || (WiM.Models = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=Point.js.map
//------------------------------------------------------------------------------
//----- AuthenticationBase -----------------------------------------------------
//------------------------------------------------------------------------------
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var WiM;
(function (WiM) {
    var Services;
    (function (Services) {
        'use strict';
        var AuthenticationServiceAgent = (function (_super) {
            __extends(AuthenticationServiceAgent, _super);
            function AuthenticationServiceAgent($http, $q, baseURL, u) {
                _super.call(this, $http, baseURL);
                this.User = u;
            }
            AuthenticationServiceAgent.prototype.SetBasicAuthentication = function (uri, password) {
                var request;
                request = new Services.Helpers.RequestInfo(uri);
                var authdata;
                try {
                    authdata = btoa(this.User.username + ":" + password);
                }
                catch (e) {
                    authdata = this.encode(this.User.username + ":" + password);
                }
                this.$http.defaults.headers.common['Authorization'] = 'Basic ' + authdata;
                return this.Execute(request)
                    .then(function (response) {
                });
            };
            AuthenticationServiceAgent.prototype.SetTokenAuthentication = function (uri, password) {
                var _this = this;
                try {
                    var request = new Services.Helpers.RequestInfo(uri);
                    return this.Execute(request)
                        .then(function (response) {
                        _this.$http.defaults.headers.common['Authorization'] = 'token ' + response.data;
                    });
                }
                catch (e) {
                }
            };
            AuthenticationServiceAgent.prototype.encode = function (input) {
                var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
                try {
                    var output = "";
                    var chr1 = NaN;
                    var chr2 = NaN;
                    var chr3 = NaN;
                    var enc1 = NaN;
                    var enc2 = NaN;
                    var enc3 = NaN;
                    var enc4 = NaN;
                    var i = 0;
                    do {
                        chr1 = input.charCodeAt(i++);
                        chr2 = input.charCodeAt(i++);
                        chr3 = input.charCodeAt(i++);
                        enc1 = chr1 >> 2;
                        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                        enc4 = chr3 & 63;
                        if (isNaN(chr2)) {
                            enc3 = enc4 = 64;
                        }
                        else if (isNaN(chr3)) {
                            enc4 = 64;
                        }
                        output = output +
                            keyStr.charAt(enc1) +
                            keyStr.charAt(enc2) +
                            keyStr.charAt(enc3) +
                            keyStr.charAt(enc4);
                        chr1 = chr2 = chr3 = NaN;
                        enc1 = enc2 = enc3 = enc4 = NaN;
                    } while (i < input.length);
                    return output;
                }
                catch (e) {
                }
            };
            return AuthenticationServiceAgent;
        })(Services.HTTPServiceBase);
        Services.AuthenticationServiceAgent = AuthenticationServiceAgent;
    })(Services = WiM.Services || (WiM.Services = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=AuthenticationServiceBase.js.map
//------------------------------------------------------------------------------
//----- HTTPServiceBase ---------------------------------------------------------------
//------------------------------------------------------------------------------
var WiM;
(function (WiM) {
    var Services;
    (function (Services) {
        'use strict';
        var HTTPServiceBase = (function () {
            function HTTPServiceBase(http, baseURL) {
                this.baseURL = baseURL;
                this.$http = http;
            }
            HTTPServiceBase.prototype.Execute = function (request) {
                request.url = request.includesBaseURL ? request.url : this.baseURL + request.url;
                return this.$http(request);
            };
            return HTTPServiceBase;
        })();
        Services.HTTPServiceBase = HTTPServiceBase;
    })(Services = WiM.Services || (WiM.Services = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=HTTPServiceBase.js.map
//http://txpub.usgs.gov/DSS/search_api/1.0/dataService/dataService.ashx/search?term=05454500&state=%25&topN=100&LATmin=-90&LATmax=90&LONmin=-180&LONmax=180&includeGNIS=true&includeState=true&includeUsgsSiteSW=true&includeUsgsSiteGW=true&includeUsgsSiteSP=false&includeUsgsSiteAT=false&includeUsgsSiteOT=false&includeZIPcodes=true&includeAREAcodes=true&useCommonGnisClasses=false
//------------------------------------------------------------------------------
//----- RegionService -----------------------------------------------------
//------------------------------------------------------------------------------
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var WiM;
(function (WiM) {
    var Services;
    (function (Services) {
        'use strict';
        Services.onSelectedAreaOfInterestChanged = "onSelectedAreaOfInterestChanged";
        var SearchAPIEventArgs = (function (_super) {
            __extends(SearchAPIEventArgs, _super);
            function SearchAPIEventArgs(aoi) {
                _super.call(this);
                this.selectedAreaOfInterest = aoi;
            }
            return SearchAPIEventArgs;
        })(WiM.Event.EventArgs);
        Services.SearchAPIEventArgs = SearchAPIEventArgs;
        var SearchLocation = (function () {
            function SearchLocation(nm, ct, st, lat, long) {
                this.Name = nm;
                this.Category = ct;
                this.State = st;
                this.Latitude = lat;
                this.Longitude = long;
                this.crs = "4326";
            }
            return SearchLocation;
        })();
        var SearchConfig = (function () {
            function SearchConfig() {
            }
            return SearchConfig;
        })();
        var SearchAPIService = (function (_super) {
            __extends(SearchAPIService, _super);
            function SearchAPIService($http, $q, eventManager) {
                _super.call(this, $http, configuration.baseurls['SearchAPI']);
                this.$q = $q;
                this.eventManager = eventManager;
                this.eventManager.AddEvent(Services.onSelectedAreaOfInterestChanged);
                this.init();
                this.loadSearchAPI();
            }
            SearchAPIService.prototype.loadSearchAPI = function () {
                var _this = this;
                var myScript = document.createElement('script');
                myScript.src = 'http://txpub.usgs.gov/DSS/search_api/1.1/api/search_api.min.js';
                myScript.onload = function () {
                    _this.setSearchAPI();
                };
                document.body.appendChild(myScript);
            };
            SearchAPIService.prototype.setSearchAPI = function () {
                var _this = this;
                search_api.on("load", function () {
                    //console.log('search api onload event');
                    search_api.setOpts({
                        "textboxPosition": "user-defined",
                        "theme": "user-defined",
                        "DbSearchIncludeUsgsSiteSW": true,
                        "DbSearchIncludeUsgsSiteGW": true,
                        "DbSearchIncludeUsgsSiteSP": true,
                        "DbSearchIncludeUsgsSiteAT": true,
                        "DbSearchIncludeUsgsSiteOT": true
                    });
                    search_api.on("before-search", function () {
                    });
                    search_api.on("location-found", function (lastLocationFound) {
                        _this.eventManager.RaiseEvent(Services.onSelectedAreaOfInterestChanged, _this, new SearchAPIEventArgs(new SearchLocation(lastLocationFound.name, lastLocationFound.category, lastLocationFound.state, lastLocationFound.y, lastLocationFound.x)));
                    });
                    search_api.on("no-result", function () {
                        alert("No location matching the entered text could be found.");
                    });
                    search_api.on("timeout", function () {
                        alert("The search operation timed out.");
                    });
                });
            };
            SearchAPIService.prototype.getLocations = function (searchTerm) {
                var _this = this;
                this.config.term = searchTerm;
                var request = new WiM.Services.Helpers.RequestInfo("/search");
                request.params = {
                    term: this.config.term,
                    state: this.config.state,
                    includeGNIS: this.config.includeGNIS,
                    useCommonGnisClasses: this.config.useCommonGnisClasses,
                    includeUsgsSiteSW: this.config.includeUsgsSiteSW,
                    includeUsgsSiteGW: this.config.includeUsgsSiteGW,
                    includeUsgsSiteSP: this.config.includeUsgsSiteSP,
                    includeUsgsSiteAT: this.config.includeUsgsSiteAT,
                    includeUsgsSiteOT: this.config.includeUsgsSiteOT,
                    includeZIPcodes: this.config.includeZIPcodes,
                    includeAREAcodes: this.config.includeAREAcodes,
                    includeState: this.config.includeState,
                    topN: this.config.topN,
                    debug: this.config.debug
                };
                return this.Execute(request).then(function (response) {
                    return response.data.map(function (item) {
                        return new SearchLocation(item.nm, item.ct, item.st, item.y, item.x);
                    });
                }, function (error) {
                    return _this.$q.reject(error.data);
                });
            };
            SearchAPIService.prototype.init = function () {
                this.config = new SearchConfig();
                this.config.includeGNIS = true;
                this.config.useCommonGnisClasses = true;
                this.config.includeUsgsSiteSW = true;
                this.config.includeUsgsSiteGW = true;
                this.config.includeUsgsSiteSP = true;
                this.config.includeUsgsSiteAT = true;
                this.config.includeUsgsSiteOT = true;
                this.config.includeZIPcodes = true;
                this.config.includeAREAcodes = true;
                this.config.includeState = true;
                this.config.topN = 100;
                this.config.debug = false;
                this.config.term = '';
                this.config.state = '';
            };
            return SearchAPIService;
        })(Services.HTTPServiceBase);
        factory.$inject = ['$http', '$q', 'WiM.Event.EventManager'];
        function factory($http, $q, eventManager) {
            return new SearchAPIService($http, $q, eventManager);
        }
        angular.module('WiM.Services')
            .factory('WiM.Services.SearchAPIService', factory);
    })(Services = WiM.Services || (WiM.Services = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=SearchAPIService.js.map
(function () {
    'use strict';
    angular
        .module('WiM.Services', []);
})();
//# sourceMappingURL=service.module.js.map
var WiM;
(function (WiM) {
    var Services;
    (function (Services) {
        'use strict';
        var StateWatcherService = (function () {
            function StateWatcherService($rootScope) {
                this.$rootScope = $rootScope;
                $rootScope.$on('$stateChangeStart', this.stateChangeStart);
                $rootScope.$on('$stateChangeSuccess', this.stateChangeSuccess);
                $rootScope.$on('$stateChangeError', this.stateChangeError);
                $rootScope.$on('$stateNotFound', this.stateNotFound);
            }
            StateWatcherService.prototype.stateChangeStart = function (event, toState, toParams, fromState, fromParams) {
            };
            StateWatcherService.prototype.stateChangeSuccess = function (event, toState, toParams, fromState, fromParams) {
            };
            StateWatcherService.prototype.stateChangeError = function (event, toState, toParams, fromState, fromParams, error) {
            };
            StateWatcherService.prototype.stateNotFound = function (event, unfoundState, toParams, fromState, fromParams) {
            };
            return StateWatcherService;
        })();
        factory.$inject = ['$rootScope'];
        function factory($rootScope) {
            return new StateWatcherService($rootScope);
        }
        angular.module('WiM.Services')
            .factory('WiM.Services.StateWatcherService', factory);
    })(Services = WiM.Services || (WiM.Services = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=StateWatcherService.js.map
var WiM;
(function (WiM) {
    var Services;
    (function (Services) {
        var Helpers;
        (function (Helpers) {
            var RequestInfo = (function () {
                function RequestInfo(ul, includesbaseurl, mthd, dtype, data, headers, tranform) {
                    if (includesbaseurl === void 0) { includesbaseurl = false; }
                    if (mthd === void 0) { mthd = methodType.GET; }
                    if (dtype === void 0) { dtype = "json"; }
                    if (data === void 0) { data = null; }
                    if (headers === void 0) { headers = null; }
                    if (tranform === void 0) { tranform = null; }
                    this.url = ul;
                    this.includesBaseURL = includesbaseurl;
                    this.method = methodType[mthd];
                    this.dataType = dtype;
                    this.transformRequest = tranform;
                    this.headers = headers;
                    this.data = data;
                }
                return RequestInfo;
            })();
            Helpers.RequestInfo = RequestInfo;
            (function (methodType) {
                methodType[methodType["GET"] = 0] = "GET";
                methodType[methodType["POST"] = 1] = "POST";
                methodType[methodType["PUT"] = 2] = "PUT";
                methodType[methodType["DELETE"] = 3] = "DELETE";
            })(Helpers.methodType || (Helpers.methodType = {}));
            var methodType = Helpers.methodType;
        })(Helpers = Services.Helpers || (Services.Helpers = {}));
    })(Services = WiM.Services || (WiM.Services = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=RequestInfo.js.map
var WiM;
(function (WiM) {
    var Services;
    (function (Services) {
        var Helpers;
        (function (Helpers) {
            function paramsTransform(data) {
                var str = [];
                for (var p in data)
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(data[p]));
                return str.join("&");
            }
            Helpers.paramsTransform = paramsTransform;
        })(Helpers = Services.Helpers || (Services.Helpers = {}));
    })(Services = WiM.Services || (WiM.Services = {}));
})(WiM || (WiM = {}));
//# sourceMappingURL=RequestTransform.js.map