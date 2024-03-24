import React from 'react'
import logoImg from 'img/logo.png'
import styles from '../../styles.module.scss'
import welcome from './welcome.module.scss'

export const Welcome = ({ isActive, setActivePage }) => {
  return (
    <div
      className={`${styles.component} ${welcome.welcome} ${
        isActive && styles.activePage
      }`}
    >
      <div className={welcome.top}>
        <div className={welcome.logo}>
          <img src={logoImg} alt='logo' />
        </div>
        <div className={welcome.title}>
          <h3>Chào mừng</h3>
        </div>
        <div className={welcome.buttons}>
          <button
            className={welcome.button}
            onClick={() => setActivePage('intro')}
          >
            Tạo ví mới
          </button>
          <button className={welcome.button}>Nhập ví</button>
        </div>
      </div>
      <div className={welcome.bottom}>
        <div className={welcome.title}>
          <h4>Tiếp tục với</h4>
        </div>
        <div className={welcome.buttons}>
          <button className={welcome.button}>Sổ cái</button>
          <button className={welcome.button}>Keystone</button>
        </div>
      </div>
    </div>
  )
}
