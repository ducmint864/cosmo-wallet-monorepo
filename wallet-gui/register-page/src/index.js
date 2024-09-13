import React, { useEffect, useState } from 'react'
import styles from './styles.module.scss'
// import { Welcome } from './components/welcome/welcome'
// import { Intro } from './components/intro/intro'
// import { BackupCode } from './components/setup/backupCode/backupCode'
import { Toaster } from 'react-hot-toast'
// import { PinCode } from './components/setup/pinCode/pinCode'
import { Authentication } from './components/authentication/authentication'

export const Register = ({
  // eslint-disable-next-line
  handleDone,
  isSignIn,
  errMsg,
  handleSignIn = () => {},
  handleSignUp = () => {}
}) => {
  const [activePage, setActivePage] = useState(
    isSignIn ? 'welcome' : 'authentication'
  )

  useEffect(() => {
    if (!isSignIn) {
      setActivePage('authentication')
    }
  }, [isSignIn])

  return (
    <div className={styles.root}>
      <Toaster position='bottom-center' reverseOrder={false} />
      <Authentication
        isActive={activePage === 'authentication'}
        setActivePage={setActivePage}
        isSignIn={isSignIn}
        errMsg={errMsg}
        handleSignIn={handleSignIn}
        handleSignUp={handleSignUp}
      />
      {/* <Welcome
        isActive={activePage === 'welcome'}
        setActivePage={setActivePage}
      />
      <Intro isActive={activePage === 'intro'} setActivePage={setActivePage} />
      <BackupCode
        isActive={activePage === 'backup'}
        setActivePage={setActivePage}
      />
      <PinCode
        isActive={activePage === 'pinCode'}
        setActivePage={setActivePage}
        handleDone={handleDone}
      /> */}
    </div>
  )
}
