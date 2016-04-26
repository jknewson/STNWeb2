/// <reference path="../TimeSeries/TimeSeries.d.ts" />
declare module StreamStats.Models.Station {
    class Station {
        StationID: string;
        Name: string;
        DrainageArea_sqMI: number;
        Latitude_DD: number;
        Longitude_DD: number;
        Discharge: StreamStats.Models.TimeSeries;
        URL: string;
        constructor(id: string);
        static FromJSON(jsn: Object): Station;
    }
    class CorrelatedStation extends Station {
        Correlation: number;
        constructor(id: string);
        static FromJSON(jsn: Object): CorrelatedStation;
    }
}
