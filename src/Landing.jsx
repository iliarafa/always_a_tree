import { useState } from 'react'
import styles from './Landing.module.css'

export function Landing({ onEnter }) {
  const [leaving, setLeaving] = useState(false)

  function handleClick() {
    setLeaving(true)
    setTimeout(onEnter, 900)
  }

  return (
    <div
      className={`${styles.landing} ${leaving ? styles.leaving : ''}`}
      onClick={handleClick}
    >
      <div className={styles.inkBleed} />
      <h1 className={styles.title}>Always a tree.</h1>
      <div className={styles.inkBleedBottom} />
    </div>
  )
}
