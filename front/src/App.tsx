import { useState, useEffect } from 'react'
import './App.css'
import { extractFromInput } from './model'
import axios from 'axios';
import MapComponent from './components/Map'
import { Box, Button, Input } from "@mui/joy"
import SendIcon from '@mui/icons-material/Send';
import {Slider} from '@mui/material';

type Message = {
  content: string
  userType: 'user' | 'bot'
  data?: any
}

type Location = {
  lat: number,
  long: number
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState<string>("")
  const [lastExtracted, setLastExtracted] = useState("")
  const [thinking, setThinking] = useState<boolean>(false)
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [zipCode, setZipCode] = useState<string>("")
  const [hospitals, setHospitals] = useState<any[]>([])
  const [radius, setRadius] = useState<number>(5)
  const [_, setPredicted] = useState<number>(0)

  const startButton = document.getElementById('startButton');
  const outputDiv = document.getElementById('output');

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      setUserLocation({ lat: position.coords.latitude, long: position.coords.longitude })
      axios.get(`https://api.mapbox.com/search/geocode/v6/reverse?longitude=${position.coords.longitude}&latitude=${position.coords.latitude}&access_token=${import.meta.env.VITE_MAPBOX}`).then((res) => {
        setZipCode(res.data.features[0].properties.context.postcode.name)
      })
    });

  }, [])

  const handleSend = () => {

    if (!input) return
    const message: Message = {
      content: input,
      userType: 'user'
    }

    setMessages(prev => [...prev, message])
    setInput("")
    setThinking(true);

    extractFromInput(input, messages.map((m) => m.content), lastExtracted)
      .then((res) => {
        const message: Message = {
          content: res.response,
          userType: 'bot'
        }
        setMessages(prev => [...prev, message])
        setLastExtracted(JSON.stringify(res))

        if (res.valid) {
          queryAPI({ ...res.extracted, zipCode }).then((_) => setThinking(false));
          return;
        }

        setThinking(false);
      })

  }

  const queryAPI = async (data: any) => {
    axios.post('http://localhost:5000/api/insuranceRequest', data)
      .then((res) => {
        setPredicted(res.data["predicted_price"])
        Promise.all(res.data["data"].map(async (hospital: any) => {
          const response = await axios.get(`https://api.mapbox.com/search/geocode/v6/forward?q=${hospital[13]}&access_token=${import.meta.env.VITE_MAPBOX as string}`)

          console.log(response.data)

          return { "latitude": response.data.features[0].properties.coordinates.latitude, "longitude": response.data.features[0].properties.coordinates.longitude, "row": hospital, "name": hospital[13] }
        })).then((res) => {
          console.log(res)
          setHospitals(res)
        })
      })
  }

  return (
    <div style={{ display: "flex", overflow: "hidden" }}>
      <div style={{ width: "75vw", height: "100vh" }}>{userLocation && hospitals && <MapComponent radiusInKm={radius} lat={userLocation.lat} long={userLocation.long} hospitals={hospitals} />}</div>
      <div style={{ width: "25vw", height: "100vh" }}>
        <h1>MedSure</h1>
        <div className="chat-container">
          {messages.map((message, index) => {
            return <div
              key={index}
              className={"message " + message.userType}
            >
              {message.content}
            </div>
          })}
          {thinking && <div className='dots'>Thinking...</div>}
        </div>
        <Box
          sx={{ display: "flex", width: "100%", justifyContent: "center" }}
          onKeyDown={(e) => {
            if (thinking) return
            if (e.key === 'Enter') {
              handleSend()
            }
          }}
        >
          <Input
            endDecorator={<Button disabled={thinking} onClick={() => {
              handleSend()
            }}><SendIcon /></Button>}
            sx={{
              width: "80%",
            }}
            variant='plain'
            size="lg"
            value={input}
            placeholder="Type a message..."
            onChange={(e) => {
              setInput(e.target.value)
            }}
          />
        </Box>
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <div style={{ width: "60%", display: "flex", flexDirection: "column" }}>
            <h2>Radius</h2>
              <Slider value={radius} step={0.0001} min={2} max={45} onChange={(_, val) => {
                setRadius(val as number)
                console.log(val)
              }}></Slider>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
