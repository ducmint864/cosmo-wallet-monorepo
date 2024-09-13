import React, { useEffect, useRef, useState } from 'react'
import authentication from './authentication.module.scss'

export const SignUp = ({ setPage, handleSubmit, errMsg }) => {
  const usernameRef = useRef()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')

  useEffect(() => {
    usernameRef.current.focus()
  }, [])
  return (
    <section>
      <div className={authentication.title}>
        <h1>Sign Up</h1>
      </div>
      <p
        className={errMsg ? authentication.errmsg : authentication.offscreen}
        aria-live='assertive'
      >
        {errMsg}
      </p>
      <form
        onSubmit={(e) => {
          if (pwd === confirmPwd) {
            handleSubmit(e, username, email, pwd)
          }
        }}
      >
        <label htmlFor='username'>Username:</label>
        <input
          type='text'
          id='username'
          ref={usernameRef}
          autoComplete='off'
          onChange={(e) => setUsername(e.target.value)}
          value={username}
          required
        />

        <label htmlFor='email'>Email:</label>
        <input
          type='email'
          id='email'
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

        <label htmlFor='confirm-password'>Confirm Password:</label>
        <input
          type='password'
          id='confirm-password'
          onChange={(e) => setConfirmPwd(e.target.value)}
          value={confirmPwd}
          min={6}
          required
        />
        <p
          className={
            pwd && pwd !== confirmPwd
              ? authentication.errmsg
              : authentication.offscreen
          }
          aria-live='assertive'
        >
          Password not match!
        </p>
        <button>Sign Up</button>
      </form>
      <div className={authentication.footer}>
        <div className={authentication.title}>
          <h4>Already registered?</h4>
        </div>
        <div className={authentication.buttons}>
          <button
            className={authentication.button}
            onClick={() => setPage('signIn')}
          >
            Sign In
          </button>
        </div>
      </div>
    </section>
  )
}
