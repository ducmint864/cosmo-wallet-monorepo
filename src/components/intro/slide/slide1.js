import React from 'react'
import logoImg from 'img/sl1.svg'
import intro from './../intro.module.scss'

export const Slide1 = () => {
  return (
    <div className={intro.slide}>
      <div className={intro.logo}>
        <img src={logoImg} alt='logo' />
      </div>
      <div className={intro.title}>
        <h3>Your recovery phrase is a backup key for your wallet.</h3>
        <span>
          You'll be able to log in to your wallet with a passcode, but if you
          will need your recovery phrase to access it.
        </span>
      </div>
    </div>
  )
}
