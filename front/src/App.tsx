import { useState, useRef, useEffect } from 'react'
import './App.css'
import { extractFromInput } from './model'
import axios from 'axios';
import MapComponent from './components/Map'
import SearchBarComponent from './components/SearchBar'
import { Box, Button, Input } from "@mui/joy"
import { v4 } from 'uuid'

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
  const [rendering, setRendering] = useState<boolean>(true)

  useEffect(() => {
    console.log(import.meta.env)
    navigator.geolocation.getCurrentPosition((position) => {
      setUserLocation({ lat: position.coords.latitude, long: position.coords.longitude })
      axios.get(`https://api.mapbox.com/search/geocode/v6/reverse?longitude=${position.coords.longitude}&latitude=${position.coords.latitude}&access_token=${import.meta.env.VITE_MAPBOX}`).then((res) => {
        setZipCode(res.data.features[0].properties.context.postcode.name)
        axios.get(`https://api.mapbox.com/search/searchbox/v1/suggest?q=hospital&proximity=${position.coords.longitude},${position.coords.latitude}&limit=10&session_token=${v4()}&access_token=` + import.meta.env.VITE_MAPBOX).then((res) => {
          setRendering(true)
          Promise.all(res.data.suggestions.map(async (suggestion: any) => {
            if (!suggestion.context) return
            const geoloc = await axios.get(`https://api.mapbox.com/search/geocode/v6/forward?q=${suggestion.context["full_address"]}&access_token=${import.meta.env.VITE_MAPBOX}`)
            return {...geoloc.data.features[0].properties.coordinates, name: suggestion.name}
          })).then((res) => {
            setHospitals(res)
            setRendering(false)
          })
        })
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
        console.log(res.data)
      })

  }

  return (
    <div style={{ display: "flex", overflow: "hidden" }}>
      <div style={{ width: "75vw", height: "100vh" }}>{userLocation && !rendering && <MapComponent lat={userLocation.lat} long={userLocation.long} hospitals={hospitals} />}</div>
      <div> <SearchBarComponent /></div>
      <div style={{ width: "25vw", height: "100vh" }}>
        <h1>Insurance</h1>
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
            if (e.key === 'Enter') {
              handleSend()
            }
          }}
        >
          <Input
            endDecorator={<Button onClick={() => {
              handleSend()
            }}>Send</Button>}
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
      </div>
    </div>
  )
}

export default App
