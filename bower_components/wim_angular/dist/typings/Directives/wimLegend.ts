//------------------------------------------------------------------------------
//----- WiM Legend ------------------------------------------------------
//------------------------------------------------------------------------------

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
module WiM.Directives {
    'use string';
    interface IwimLegendControllerScope extends ng.IScope {
        vm: IwimLegendController;
    }
    export interface IwimLegendController {
        overlays: IwimLegendLayerGroup;
        baselayers: IwimLegendLayerGroup;
        
    }
    export interface IwimLegendLayerGroup {
        selectedlayerName: string;
        isAvailable: boolean;
        layergroup: any;
        isOpen: boolean;

    }

    interface IwimLegendAttributes extends ng.IAttributes {
        //must use camelcase
        stopEvents: string;
    }

    export var onLayerAdded: string = "onLayerAdded";
    export var onLayerChanged: string = "onLayerChanged";
    export var onLayerRemoved: string = "onLayerRemoved";

    export class LegendLayerAddedEventArgs extends WiM.Event.EventArgs {
        //properties
        public LayerName: string;
        public layerType: String;
        public style: any;

        constructor(layername:string, ltype:string, style:any) {
            super();
            this.LayerName = layername;
            this.layerType = ltype;
            this.style = style;
        }
    }
    export class LegendLayerChangedEventArgs extends WiM.Event.EventArgs {
        //properties
        public LayerName: string;
        public PropertyName: String;
        public Value: any;

        constructor(layername: string, propertyname: string, value:any) {
            super();
            this.LayerName = layername;
            this.PropertyName = propertyname;
            this.Value = value;
        }
    }
    export class LegendLayerRemovedEventArgs extends WiM.Event.EventArgs {
        //properties
        public LayerName: string;
        public layerType: String;

        constructor(layername: string, ltype: string) {
            super();
            this.LayerName = layername;
            this.layerType = ltype;
        }
    }
    class wimLegendController extends WiM.Services.HTTPServiceBase implements IwimLegendController {
        //Properties
        //-+-+-+-+-+-+-+-+-+-+-+-
        private safeApply: any;
        private isDefined: any;
        private leafletHelpers: any;
        private leafletData: any;
        public overlays: IwimLegendLayerGroup;
        public baselayers: IwimLegendLayerGroup;
        public applicationLayer: IwimLegendLayerGroup;
        public eventManager: WiM.Event.IEventManager;


        //Constructor
        //-+-+-+-+-+-+-+-+-+-+-+-
        static $inject = ['$scope', '$http', 'leafletData', 'WiM.Event.EventManager'];
        constructor($scope: IwimLegendControllerScope, $http: ng.IHttpService, leafletData: any, eventManager: WiM.Event.IEventManager)  {
            super($http, '');
            $scope.vm = this;
            this.eventManager = eventManager;
            //subscribe to Events
            this.eventManager.AddEvent <LegendLayerAddedEventArgs>(onLayerAdded);
            this.eventManager.AddEvent<LegendLayerChangedEventArgs>(onLayerChanged);
            this.eventManager.AddEvent<LegendLayerRemovedEventArgs>(onLayerRemoved);

            this.eventManager.SubscribeToEvent(onLayerAdded, new WiM.Event.EventHandler<LegendLayerAddedEventArgs>((sender: any, e: LegendLayerAddedEventArgs) => {
                this.onLayerAdded(sender, e);
            }));

            this.eventManager.SubscribeToEvent(onLayerRemoved, new WiM.Event.EventHandler<LegendLayerRemovedEventArgs>((sender: any, e: LegendLayerRemovedEventArgs) => {
                this.onLayerRemoved(sender, e);
            }));

            this.leafletData = leafletData;
            this.init(); 
        }  
        
        //Methods  
        //-+-+-+-+-+-+-+-+-+-+-+-
        public initOverlays(mlyr: any): void  {
            if (mlyr.type == "agsDynamic") {
                // if (mlyr.type != "agsDynamic")
                //     return;
                var url = mlyr.url + "/legend?f=pjson";
                var request = new WiM.Services.Helpers.RequestInfo(url, true);
                this.Execute(request).then((response: any) => {
                    if (response.data.layers.length > 0) {
                        mlyr.isOpen = true;
                        mlyr.layerArray = [];
                        if (mlyr.layerOptions.layers) {
                            var visibleLayers = mlyr.layerOptions.layers;
                            for (var i = 0; i < visibleLayers.length; i++) {
                                for (var j = 0; j < response.data.layers.length; j++) {
                                    if (visibleLayers[i] == response.data.layers[j].layerId) {
                                        mlyr.layerArray.push(response.data.layers[j]);
                                    }//end if
                                }//next
                            }//next
                        } else {
                            mlyr.layerArray = response.data.layers;
                        }//end if
                    }//end if
                }, function (error) {
                });
            }

            if (mlyr.type == "agsFeature") {
                var url = mlyr.url.slice(0, -2) + "/legend?f=pjson";
                var layerId =  mlyr.url.substr(mlyr.url.length - 1);
                var request = new WiM.Services.Helpers.RequestInfo(url, true);
                this.Execute(request).then((response:any)=> {
                    if (response.data.layers.length > 0) {
                        mlyr.isOpen = true;
                        mlyr.layerArray = [];
                        for (var k = 0; k < response.data.layers.length; k++) {
                            if (layerId == response.data.layers[k].layerId) {
                                mlyr.layerArray.push(response.data.layers[k]);
                            }
                        }

                    }
                }, function (error) {
                });
            }
        }
        
        public changeBaseLayer(key: any, evt: any): void
        {
            this.baselayers.selectedlayerName = key.toString();
            this.leafletData.getMap().then((map: any) => {
                this.leafletData.getLayers().then((maplayers: any) => {
                    if (map.hasLayer(maplayers.baselayers[key])) { return; }

                    for (var mlayr in maplayers.baselayers) {
                        if (map.hasLayer(maplayers.baselayers[mlayr])) {
                            map.removeLayer(maplayers.baselayers[mlayr]);
                        }//end if
                    }//next

                    map.addLayer(maplayers.baselayers[key]);
                });
            });            
            evt.preventDefault();
            
        }//end change baseLayer

        public toggleLayer(layerName: string, visibility: boolean): void {
            var layer = this.applicationLayer.layergroup[layerName];
            layer.visible = (layer.visible) ? false : true;
            this.eventManager.RaiseEvent(onLayerChanged, this, new LegendLayerChangedEventArgs(layerName, "visible", layer.visible));
        }
        //Helper Methods
        private init(): void  {
            this.overlays = <IwimLegendLayerGroup>{};
            this.baselayers = <IwimLegendLayerGroup>{};
            this.baselayers.isOpen = true;

            this.applicationLayer = <IwimLegendLayerGroup>{
                selectedlayerName: "Application Layers",
                isAvailable:false,
                layergroup: {},
                isOpen: false
            };


            this.leafletData.getMap().then((map: any) => {
                this.leafletData.getLayers().then((maplayers: any) => {
                    for (var key in maplayers.baselayers) {
                        if (map.hasLayer(maplayers.baselayers[key])) {
                            this.baselayers.selectedlayerName = key.toString();
                            break;
                        }//end if
                    }//next
                });//end getLayers                                
            });//end getMap 

        }//end init

        private onLayerAdded(sender: any, e: LegendLayerAddedEventArgs): void  {
            if (e.layerType != 'geojson') return; 
            //add to legend
            if (this.applicationLayer.layergroup.hasOwnProperty(e.LayerName)) return;
            this.applicationLayer.isAvailable = true;
            this.applicationLayer.layergroup[e.LayerName] = {
                visible: true,
                style: e.style
            }         
        }
        private onLayerRemoved(sender: any, e: LegendLayerRemovedEventArgs): void {
            if (e.layerType != 'geojson') return; 
            //remove
            if (this.applicationLayer.layergroup.hasOwnProperty(e.LayerName))
                delete this.applicationLayer[e.LayerName];
        }

    }//end wimLayerControlController class

    class wimLegend implements ng.IDirective {
        static instance(): ng.IDirective {
            return new wimLegend;
        }
        //create isolated scope
        scope = {
            icons: '=?',
            autoHideOpacity: '=?', // Hide other opacity controls when one is activated.
            showGroups: '=?', // Hide other opacity controls when one is activated.
            title: '@',
            baseTitle: '@',
            overlaysTitle: '@',
        }
        restrict = 'E';
        require = '^leaflet';
        transclude= false;
        controller = wimLegendController;
        template = '<div ng-class="vm.layerControlExpanded ? \'angular-leaflet-control-layers-expanded\' : \'angular-leaflet-control-layers-collapsed\'" ng-click="vm.layerControlExpanded = true; $event.stopPropagation(); $event.preventDefault()" ng-init="vm.layerControlExpanded == false">' +
        '    <div ng-show="vm.layerControlExpanded">' +
        '        <button class="close-legend" ng-click="vm.layerControlExpanded = false; $event.stopPropagation();">Close Legend</button>' +
        '        <div class="list-group">' +
        '            <!-- baselayers -->' +
        '            <div ng-class="!vm.baselayers.isOpen  ? \' list-group-item-active wimLegend-list-group-item-active\': \'list-group-item wimLegend-list-group-item\'" ng-click="vm.baselayers.isOpen=(vm.baselayers.isOpen) ? false : true;">' +
        '                <label>Base Maps</label>' +
        '                <i ng-class="!vm.baselayers.isOpen ? \'fa fa-chevron-up pull-right\': \'fa fa-chevron-down pull-right\'"></i>' +
        '            </div> ' +
        '            <div ng-hide="vm.baselayers.isOpen" class="list-group-body wimLegend-list-group-body">' +
        '                <div class="sitebar-item" ng-repeat="(key, layer) in vm.baselayers.layergroup">' +
        '                    <input type="radio" id="baselayerRadio{{$id}}" ng-checked="$parent.vm.baselayers.selectedlayerName === key.toString()" ng-value="key.toString()" /><label for="baselayerRadio{{$id}}" ng-click="vm.changeBaseLayer(key, $event)">{{layer.name}}</label>' +
        '                </div>' +
        '            </div>  ' +
        '            <!-- Application Layers -->' +
        '            <div ng-if="vm.applicationLayer.isAvailable">' +
        '                <div ng-class="vm.applicationLayer.isOpen  ? \'list-group-item wimLegend-list-group-item-active\': \'list-group-item wimLegend-list-group-item\'">' +
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
        '                <div ng-if="!layer.layerParams.showOnSelector && layer.layerParams.showOnSelector !== false" ng-class="!layer.isOpen  ? \'list-group-item-active wimLegend-list-group-item-active\': \'list-group-item wimLegend-list-group-item\'">' +
        '                    <input type="checkbox" id="checkbox{{$id}}" ng-checked="layer.visible" />' +
        '                    <label for="checkbox{{$id}}" ng-if="!layer.layerParams.showOnSelector && layer.layerParams.showOnSelector !== false" ng-click="layer.visible = (layer.visible) ? false : true;">' +
        '                        {{layer.name}}' +
        '                    </label>' +
        '                    <i ng-class="!layer.isOpen ? \'fa fa-chevron-up pull-right\': \'fa fa-chevron-down pull-right\'" ng-click="layer.isOpen=(layer.isOpen) ? false : true;"></i>' +
        '                </div>' +
        '                <div ng-hide="layer.isOpen">' +
        '                    <div class="legendGroup" ng-if="layer.type == \'agsDynamic\' || layer.type == \'agsFeature\'">' +
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

        replace = true;

        link(scope: ng.IScope, element: ng.IAugmentedJQuery, attributes: IwimLegendAttributes, controller: any): void {
            //this is where we can register listeners, set up watches, and add functionality. 
            // The result of this process is why the live data- binding exists between the scope and the DOM tree.
            
            var leafletScope = controller.getLeafletScope();
            var layers = leafletScope.layers;
            (<any>scope).vm.overlays.layergroup = layers.overlays;
            (<any>scope).vm.baselayers.layergroup = layers.baselayers;

            element.bind('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
            });

            element.bind('mouseover', (e) => {
               controller.getMap().then((map: any) => {
                   map.dragging.disable();  
                   map.doubleClickZoom.disable
                   map.scrollWheelZoom.disable();                            
                });//end getMap   
            });
            element.bind('mouseout', (e) => {
                controller.getMap().then((map: any) => {
                    map.dragging.enable();
                    map.doubleClickZoom.enable();
                    map.scrollWheelZoom.enable();
                });//end getMap  
            });


        }//end link

    }//end UrlDirective

    angular.module('wim_angular')
        .directive('wimLegend', wimLegend.instance);
}//end module 