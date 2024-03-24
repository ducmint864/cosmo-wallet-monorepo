import React, { useEffect, useState } from 'react'
import * as Icon from 'react-icons/fi'

import styles from '../../../styles.module.scss'
import pinCode from './pinCode.module.scss'

import toast from 'react-hot-toast'

const keyboards = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0']

export const PinCode = ({ isActive, setActivePage, handleDone }) => {
  const [isShowConfirm, setIsShowConfirm] = useState(false)
  const [pin, setPin] = useState('')
  const [confirmCode, setConfirmCode] = useState('')

  const handleSetPin = (value) => {
    if (pin.length < 6) {
      setPin((pin) => pin + value)
    }
  }

  const handleDelPin = () => {
    setPin((pin) => pin.slice(0, -1))
  }

  const handleSetConfirmCode = (value) => {
    if (confirmCode.length < 6) {
      setConfirmCode((confirmCode) => confirmCode + value)
    }
  }

  const handleDelConfirmCode = () => {
    setConfirmCode((confirmCode) => confirmCode.slice(0, -1))
  }

  useEffect(() => {
    if (pin.length > 5) {
      setIsShowConfirm(true)
    }
  }, [pin])

  useEffect(() => {
    if (confirmCode.length > 5) {
      if (confirmCode === pin) {
        toast.success(
          <span>
            <b>Tạo ví thành công</b>
          </span>,
          {
            duration: 2000,
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff'
            }
          }
        )
        handleDone()
      } else {
        toast.error(
          <span>
            <b>Oops, thử lại đi!</b>
            <br />
            Mật mã không khớp.
          </span>,
          {
            duration: 2000,
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff'
            }
          }
        )

        setIsShowConfirm(false)
        setPin('')
        setConfirmCode('')
      }
    }
  }, [confirmCode])

  return (
    <div
      className={`${styles.component} ${pinCode.pinCode} ${
        isActive && styles.activePage
      }`}
    >
      <div className={pinCode.page}>
        <div className={pinCode.top}>
          <div
            className={pinCode.close}
            onClick={() => setActivePage('welcome')}
          >
            X
          </div>
          <div className={pinCode.title}>
            <h3>{!isShowConfirm ? 'Nhập mật mã mới' : 'Xác nhận mật mã'}</h3>
          </div>
        </div>
        {!isShowConfirm ? (
          <div className={pinCode.body}>
            <div className={pinCode.code}>
              {Array.apply(null, { length: 6 }).map((e, i) => (
                <span
                  key={i}
                  className={
                    pin.length > i ? pinCode.codeHasValue : pinCode.codeEmpty
                  }
                ></span>
              ))}
            </div>
            <div className={pinCode.keyboard}>
              {keyboards.map((value, i) => (
                <button
                  key={i}
                  className={
                    value ? pinCode.keyboardButton : pinCode.buttonDisabled
                  }
                  onClick={() => handleSetPin(value)}
                  disabled={!value}
                >
                  {value}
                </button>
              ))}
              <button
                className={pinCode.keyboardButton}
                onClick={() => handleDelPin()}
              >
                <Icon.FiDelete color='white' size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className={pinCode.body}>
            <div className={pinCode.code}>
              {Array.apply(null, { length: 6 }).map((e, i) => (
                <span
                  key={i}
                  className={
                    confirmCode.length > i
                      ? pinCode.codeHasValue
                      : pinCode.codeEmpty
                  }
                ></span>
              ))}
            </div>
            <div className={pinCode.keyboard}>
              {keyboards.map((value, i) => (
                <button
                  key={i}
                  className={
                    value ? pinCode.keyboardButton : pinCode.buttonDisabled
                  }
                  onClick={() => handleSetConfirmCode(value)}
                  disabled={!value}
                >
                  {value}
                </button>
              ))}
              <button
                className={pinCode.keyboardButton}
                onClick={() => handleDelConfirmCode()}
              >
                <Icon.FiDelete color='white' size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
