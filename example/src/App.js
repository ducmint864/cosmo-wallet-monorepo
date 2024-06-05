import React from 'react'

import { Register } from 'thasa-register-page'
import 'thasa-register-page/dist/index.css'

const handleDone = () => {
  // alert('done')
}
const handleSignIn = () => {
  // alert('done')
}
const handleSignUp = () => {
  // alert('done')
}

const App = () => {
  return (
    <Register
      handleDone={handleDone}
      isSignIn={false}
      errMsg=''
      handleSignIn={handleSignIn}
      handleSignUp={handleSignUp}
    />
  )
}

export default App
