import Map, {Marker} from 'react-map-gl';


const MapComponent = ({lat, long, hospitals} : any) => {
    return <Map 
        mapLib={import('mapbox-gl')}
        projection={{
            name: "globe"
        }}
        initialViewState={{
            longitude: long,
            latitude: lat,
            zoom: 15,
            pitch: 150
        }}
        style={{width: "100%", height: "100%"}}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX as string}
        mapStyle={"mapbox://styles/mapbox/streets-v9"}
    >   
        <Marker latitude={lat} longitude={long} color="red" />
    </Map>
};

export default MapComponent;