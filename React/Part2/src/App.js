import React, { useState } from 'react'
import './index.css'

const App = () => {
  const [count, setCount] = useState(0)
  const [dark, setDark] = useState(false)
  const [align, setAlign] = useState('right')


  // Create construcors
  const decrease = () => {
    setCount(count - 1)
  }

  const increase = () => {
    setCount(count + 1)
  }

  const toggleDark = () => {
    setDark(!dark)
  }

  const onButtonClick = () => {
    alert("hello!")
  }

  const blockStyles = {
    background: dark ? 'black' : 'white',
    height: '175px',
    width: '225px',
    //position: 'absolute',
    top: '20%',
    left: '20%',
    //transform: 'translate(-50%,-50%)'
  }

  const handleChange = (event) => {
    setAlign(event.target.value);
    console.log(("Setting alignment to " + event.target.value))
    //console.log(align)
  };

  const dynamicAlignment = {
    textAlign: align,
// For some reason this one doesen't work in the bottom part
  }

  return (
    <div className="App">
      <h1 style={dynamicAlignment}>Welcome to Point Park</h1>
      <button onClick={onButtonClick}>Say Hi</button>
      <button onClick={decrease}>Minus 1</button>
      <button onClick={increase}>Add 1</button>
      <button onClick={toggleDark}>Toggle Dark</button>
      <span>Dark mode is {dark ? "on" : "off"} </span>
      <div style={blockStyles}> The count is: <div style={{ fontSize: '35px' }}>{count}</div></div>
      <br></br>
      <div>
        Heading Alignment:
        <select value={align} onChange={handleChange}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>

  )
}

export default App;
