import { useState } from 'react'
import {createBrowserRouter,RouterProvider} from 'react-router-dom'
import './App.css'
import Lobby from './pages/Lobby'
import Room from './pages/Room'

function App() {
  const [count, setCount] = useState(0)

  const router = new createBrowserRouter([{
    path: "/",
    element: <Lobby/>,
  },
  {
    path: "/room/:roomId",
    element: <Room/>,
  }
])

  return (
    <>
    <RouterProvider router={router} />
    </>
  )
}

export default App
