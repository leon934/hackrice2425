import ReactMapGL, {Marker, Popup, Source, Layer} from 'react-map-gl';
import { useMemo } from 'react';
import { FeatureCollection } from "geojson"

const MapComponent = ({lat, long, hospitals, radiusInKm} : any) => {

    const geojson = useMemo(() => {
        const points = 64
        var coords = {
            latitude: lat,
            longitude: long
        };
    
        var km = radiusInKm;
    
        var ret = [];
        var distanceX = km/(111.320*Math.cos(coords.latitude*Math.PI/180));
        var distanceY = km/110.574;
    
        var theta, x, y;
        for(var i=0; i<points; i++) {
            theta = (i/points)*(2*Math.PI);
            x = distanceX*Math.cos(theta);
            y = distanceY*Math.sin(theta);
    
            ret.push([coords.longitude+x, coords.latitude+y]);
        }
        ret.push(ret[0]);
        return {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [ret]
                }
            }]
        };
    }, [radiusInKm])

    const layerStyle = {
        "id": "polygon",
        "type": "fill",
        "source": "polygon",
        "layout": {},
        "paint": {
            "fill-color": "blue",
            "fill-opacity": 0.6
        }
      };

    const render = useMemo(() => {
        console.log(hospitals)
        return hospitals.map((hospital: any, index: number) => <Popup key={index} latitude={hospital.latitude} longitude={hospital.longitude} anchor="bottom" style={{ color: "black" }} closeOnClick={false}><h5>{hospital.name}</h5></Popup>)
    }, [hospitals])


    
    return <ReactMapGL
        mapLib={import('mapbox-gl')}
        initialViewState={{
            longitude: long,
            latitude: lat,
            zoom: 10,
            pitch: 150
        }}
        style={{width: "100%", height: "100%"}}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX as string}
        mapStyle={"mapbox://styles/mapbox/streets-v11"}
    >    
        <Source type="geojson" data={geojson as FeatureCollection}>
            <Layer {...layerStyle} />
        </Source>
        <Marker latitude={lat} longitude={long} color="red" />
         
        {render}
    </ReactMapGL>
};

export default MapComponent;