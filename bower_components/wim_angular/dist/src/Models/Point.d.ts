/// <reference path="../Extensions/String.d.ts" />
declare module WiM.Models {
    interface IPoint {
        Latitude: number;
        Longitude: number;
        crs: string;
    }
    class Point implements IPoint {
        Latitude: number;
        Longitude: number;
        crs: string;
        constructor(lat: number, long: number, crs: string);
        ToEsriString(): string;
        static FromJson(json: Object): Point;
    }
}
