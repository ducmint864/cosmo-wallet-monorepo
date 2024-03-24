import React, { useState } from 'react'
import styles from './styles.module.scss'
import { Welcome } from './components/welcome/welcome'
import { Intro } from './components/intro/intro'
import { BackupCode } from './components/setup/backupCode/backupCode'
import { Toaster } from 'react-hot-toast'
import { PinCode } from './components/setup/pinCode/pinCode'

export const Register = ({ handleDone }) => {
  const [activePage, setActivePage] = useState('welcome')
  return (
    <div className={styles.root}>
      <Toaster position='bottom-center' reverseOrder={false} />
      <Welcome
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
      />
    </div>
  )
}
