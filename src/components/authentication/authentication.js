import React, { useEffect, useState } from 'react'
import styles from '../../styles.module.scss'
import authentication from './authentication.module.scss'
import logoImg from 'img/logo.png'
import { SignIn } from './signIn'
import { SignUp } from './signUp'

export const Authentication = ({
  isActive,
  setActivePage,
  isSignIn,
  errMsg,
  handleSignIn,
  handleSignUp
}) => {
  const [page, setPage] = useState('signIn')

  useEffect(() => {
    if (isSignIn) {
      setActivePage('welcome')
    }
  }, [isSignIn])

  return (
    <div
      className={`${styles.component} ${authentication.authentication} ${
        isActive && styles.activePage
      }`}
    >
      <div className={authentication.logo}>
        <img src={logoImg} alt='logo' />
      </div>
      {page === 'signIn' ? (
        <SignIn setPage={setPage} handleSubmit={handleSignIn} errMsg={errMsg} />
      ) : (
        <SignUp setPage={setPage} handleSubmit={handleSignUp} errMsg={errMsg} />
      )}
    </div>
  )
}
