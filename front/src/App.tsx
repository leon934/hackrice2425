import { useState, useRef } from 'react'
import './App.css'
import { extractFromInput } from './model'
import axios from 'axios';

type Message = {
  content: string
  userType: 'user' | 'bot'
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const [lastExtracted, setLastExtracted] = useState("")
  const [thinking, setThinking] = useState<boolean>(false)

  const handleSend = () => {
    if (!inputRef.current || !inputRef.current.value) return

    const message : Message = {
      content: inputRef.current?.value,
      userType: 'user'
    }
    setMessages(prev => [...prev, message])
    setThinking(true);
    extractFromInput(inputRef.current.value, lastExtracted)
      .then((res) => {
        const message : Message = {
          content: res.response,
          userType: 'bot'
        }
        setMessages(prev => [...prev, message])
        setLastExtracted(JSON.stringify(res))
        setThinking(false);
      })
  }

  const queryAPI = async (data: any) => {
    axios.post('http://localhost:5000/api', data) // add the endpoint later
      .then((res) => {
        console.log(res.data)
      })

  }

  return (
    <>
      <div>
        <h1>Chatbot</h1>
        <div className="chat-container">
          {messages.map((message, index) => (
            <div
              key={index}
              className={"message " + message.userType}
            >
              {message.content}
            </div>
          ))}
          { thinking && <div className='dots'>Thinking...</div>}
        </div>
        <div>
          <input
            type="text"
            className="inputBox"
            placeholder="Type a message..."
            ref={inputRef}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSend()
                inputRef.current!.value = ''
              }
            }}
          />
          <button className="" onClick={() => {
            handleSend()
            inputRef.current!.value = ''
          }}>Send</button>
        </div>
      </div>
    </>
  )
}

export default App
