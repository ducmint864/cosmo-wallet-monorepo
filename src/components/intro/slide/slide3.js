import React from 'react'
import logoImg from 'img/sl3.svg'
import intro from './../intro.module.scss'

export const Slide3 = ({ setActivePage }) => {
  return (
    <div className={intro.slide}>
      <div className={intro.logo}>
        <img src={logoImg} alt='logo' />
      </div>
      <div className={intro.title}>
        <h3>Never share your recovery phrase with anyone!</h3>
        <span>
          Anyone who has it can access your funds from anywhere. Keep it secure!
        </span>
      </div>
      <button className={intro.button} onClick={() => setActivePage('backup')}>
        Tiếp tục
      </button>
    </div>
  )
}
