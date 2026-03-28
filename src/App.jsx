import { useState } from 'react'
import { Tree } from './Tree'
import { Landing } from './Landing'
import './index.css'

export default function App() {
  const [entered, setEntered] = useState(false)

  return (
    <>
      {entered && <Tree />}
      {!entered && <Landing onEnter={() => setEntered(true)} />}
    </>
  )
}
