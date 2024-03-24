import React from 'react'
import logoImg from 'img/sl2.svg'
import intro from './../intro.module.scss'

export const Slide2 = () => {
  return (
    <div className={intro.slide}>
      <div className={intro.logo}>
        <img src={logoImg} alt='logo' />
      </div>
      <div className={intro.title}>
        <h3>Write it down!</h3>
        <span>
          It's highly recommended to write down your recovery phrase and store
          it in a safe place so you don't risk losing your funds.
        </span>
      </div>
    </div>
  )
}
