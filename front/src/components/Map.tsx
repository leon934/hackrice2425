import Map, {Marker} from 'react-map-gl';
import { useEffect, useRef } from 'react';

const MapComponent = ({lat, long, hospitals} : any) => {

    const mapRef = useRef(null);

    useEffect(() => {
        // Redraw map when component is mounted

    }, [hospitals]);

    return <Map 
        mapLib={import('mapbox-gl')}
        initialViewState={{
            longitude: long,
            latitude: lat,
            zoom: 15,
            pitch: 150
        }}
        style={{width: "100%", height: "100%"}}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX as string}
        mapStyle={"mapbox://styles/mapbox/streets-v9"}
        ref={mapRef}
    >   
        <Marker latitude={lat} longitude={long} color="red" />
        {hospitals.map((hospital: any) => <Marker latitude={hospital.latitude} longitude={hospital.longitude} color="blue" />)}
    </Map>
};

export default MapComponent;