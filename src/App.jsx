import { useState } from 'react'
import { Tree } from './Tree'
import { Landing } from './Landing'
import { defaultVisuals } from './weather'
import './index.css'

const visuals = defaultVisuals()

export default function App() {
  const [entered, setEntered] = useState(false)

  return (
    <>
      {entered && <Tree />}
      {!entered && <Landing onEnter={() => setEntered(true)} bg={visuals.bg} ink={visuals.ink} />}
    </>
  )
}
