var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
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
                this.templateUrl = 'component/Views/Legend/legend.html';
                this.replace = true;
            }
            wimLegend.instance = function () {
                return new wimLegend;
            };
            wimLegend.prototype.link = function (scope, element, attributes, controller) {
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