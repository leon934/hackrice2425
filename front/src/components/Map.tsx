import ReactMapGL, {Marker, Popup} from 'react-map-gl';
import React, { useMemo } from 'react';

const MapComponent = ({lat, long, hospitals} : any) => {
    

    const render = useMemo(() => {
        console.log(hospitals)
        return hospitals.map((hospital: any, index: number) => <Popup key={index} latitude={hospital.latitude} longitude={hospital.longitude} anchor="bottom" style={{ color: "black" }} closeOnClick={false}><h5>{hospital.name}</h5></Popup>)
    }, [hospitals])


    return <ReactMapGL
        mapLib={import('mapbox-gl')}
        initialViewState={{
            longitude: long,
            latitude: lat,
            zoom: 15,
            pitch: 150
        }}
        style={{width: "100%", height: "100%"}}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX as string}
        mapStyle={"mapbox://styles/mapbox/streets-v11"}
    >    
        {render}
        <Marker latitude={lat} longitude={long} color="red" />
    </ReactMapGL>
};

export default MapComponent;