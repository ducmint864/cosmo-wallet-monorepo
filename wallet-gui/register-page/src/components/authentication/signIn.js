import React, { useEffect, useRef, useState } from 'react'
import authentication from './authentication.module.scss'

export const SignIn = ({ setPage, handleSubmit, errMsg }) => {
  const emailRef = useRef()

  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')

  useEffect(() => {
    emailRef.current.focus()
  }, [])
  return (
    <section>
      <div className={authentication.title}>
        <h1>Sign In</h1>
      </div>
      <p
        className={errMsg ? authentication.errmsg : authentication.offscreen}
        aria-live='assertive'
      >
        {errMsg}
      </p>
      <form onSubmit={(e) => handleSubmit(e, email, pwd)}>
        <label htmlFor='email'>Email:</label>
        <input
          type='email'
          id='email'
          ref={emailRef}
          autoComplete='off'
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          required
        />

        <label htmlFor='password'>Password:</label>
        <input
          type='password'
          id='password'
          onChange={(e) => setPwd(e.target.value)}
          value={pwd}
          required
        />
        <button>Sign In</button>
      </form>
      <div className={authentication.footer}>
        <div className={authentication.title}>
          <h4>Need an Account?</h4>
        </div>
        <div className={authentication.buttons}>
          <button
            className={authentication.button}
            onClick={() => setPage('signUp')}
          >
            Sign Up
          </button>
        </div>
      </div>
    </section>
  )
}
