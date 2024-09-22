import ReactMapGL, { Marker, Popup, Source, Layer } from 'react-map-gl';
import { useEffect, useMemo, useState } from 'react';
import { FeatureCollection } from "geojson"
import { Card, Typography, Box, CardContent, Divider,Button, CardActions } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CancelIcon from '@mui/icons-material/Cancel';

const COLUMNS = ["Specialist Visit", "Generic drug", "Primary care visit to treat an injury or illness", "Emergency room services", "Urgent care centers or facilities", "Mental behavioral health inpatient services", "Mental behavioral health outpatient servicces"]

const FloatingComponent = ({hospital, onClick} : any) => {
    return <Card sx={{ position: "absolute", height: "800px", "width": "400px", "left": "10%", top: "10%", fontSize: "50px" }}>
        <CardContent>

            <Typography variant='h4'>{hospital.name}</Typography>
            <Box sx={{ justifyContent: "flex-start", flexDirection: "row" }}>
                <Typography variant='h2' sx={{ color: "green", alignItems: "center", display: "flex", justifyContent: "center" }}>{hospital.row[4]}<AttachMoneyIcon /></Typography>
            </Box>
            <Typography>With {hospital.row[3]}</Typography>
            <Divider></Divider>
            <Typography variant="h5">Benefits:</Typography>
            <CardContent sx={{display: "flex", justifyContent: "space-evenly"}}>
                <Box sx={{ width: "50%" }}><CheckBoxIcon /><Typography>Has:</Typography>
                    {hospital.row.map((benefit: any, index: number) => {
                        if (index < 5 || index > 12) return;
                        if (benefit)
                            return <p>
                                <Typography sx={{ textAlign:"center" }} key={index}>{COLUMNS[index-5]}</Typography>
                            </p>
                    })}
                </Box>
                <Box sx={{ width: "50%" }}><CancelIcon /><Typography>Does not have:</Typography>
                    {hospital.row.map((benefit: any, index: number) => {
                        if (index < 5 || index > 12) return;
                        if (!benefit)
                            return <p>
                                <Typography sx={{ textAlign:"center" }}  key={index}>{COLUMNS[index-5]}</Typography>
                            </p>
                    })}
                </Box>
                </CardContent>
                <Divider></Divider>
                <CardActions>
                    <Button onClick={onClick}>Close</Button>
                </CardActions>
        </CardContent>
    </Card>
}

const MapComponent = ({lat, long, hospitals, radiusInKm} : any) => {

    const [showFloat, setShowFloat] = useState(false)
    const [viewing, setViewing] = useState<any>(null)

    function getDistance(lat1: number,lon1: number,lat2: number,lon2: number) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2-lat1);  // deg2rad below
        var dLon = deg2rad(lon2-lon1); 
        var a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2)
            ; 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c; // Distance in km
     
        return d;
    }
        
    function deg2rad(deg: number) {
        return deg * (Math.PI/180)
    }

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

    const layerStyle: mapboxgl.Layer = {
        id: "polygon",
        type: "fill", // "fill" is a valid layer type
        source: "polygon", // Source should match the "id" of the source
        layout: {}, // Empty layout is fine
        paint: {
            "fill-color": "blue",
            "fill-opacity": 0.6
        }
    };
    

    const render = useMemo(() => {
        return hospitals.map((hospital: any, index: number) => {
            if (getDistance(lat, long, hospital.latitude, hospital.longitude) > radiusInKm) return
            return <>
                <Popup key={index} latitude={hospital.latitude} anchor='bottom' longitude={hospital.longitude}>
                    <div style={{ color: "black" }}>
                        <Card onClick={(_) => {
                            console.log(hospital)
                            showFloat && setShowFloat(false)
                            setShowFloat(true)
                            setViewing(hospital)
                        }}>
                            <CardContent>
                                <Typography>{hospital.name}</Typography>
                                <Box sx={{ justifyContent: "flex-start", flexDirection: "row" }}>
                                    <Typography variant='h6' sx={{ color: "green", fontSize: "18px", alignItems: "center", display: "flex", justifyContent: "center" }}>{hospital.row[4]}<AttachMoneyIcon /></Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </div>
                </Popup>
            </> 
        })
    }, [hospitals, radiusInKm])

    useEffect(() => {
        console.log(hospitals)
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
        mapStyle={"mapbox://styles/mapbox/streets-v9"}
    >    
        { showFloat && viewing && <FloatingComponent hospital={viewing} onClick={() => setShowFloat(false)} />}
        <Marker latitude={lat} longitude={long} color="red" />
        {render}
        <Source type="geojson" data={geojson as FeatureCollection}>
            <Layer {...layerStyle} />
        </Source>
    </ReactMapGL>
};

export default MapComponent;