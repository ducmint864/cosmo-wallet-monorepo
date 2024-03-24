import React, { useEffect, useState } from 'react'
import * as Icon from 'react-icons/fi'
import Checkbox from 'react-custom-checkbox'

import styles from '../../../styles.module.scss'
import backupCode from './backupCode.module.scss'
import { copy, randomInteger } from '../../../function'

import toast from 'react-hot-toast'

const arr = [
  'cat1',
  'cat2',
  'cat3',
  'cat4',
  'cat5',
  'cat6',
  'cat7',
  'cat8',
  'cat9',
  'cat10',
  'cat11',
  'cat12'
]

export const BackupCode = ({ isActive, setActivePage }) => {
  const [isCheckCode, setIsCheckCode] = useState(false)
  const [isShowCode, setIsShowCode] = useState(false)

  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [randomIndex, setRandomIndex] = useState(0)
  const [listAnswers, setListAnswers] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState()
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    setRandomIndex(randomInteger(1, 12))
    setIsDone(false)
    setCorrectAnswers(0)
  }, [isCheckCode, isActive])

  useEffect(() => {
    let listIndex = [randomIndex]
    let list = [arr[randomIndex - 1]]

    while (list.length < 6) {
      let newIndex = randomInteger(1, 12, listIndex)
      list.splice(((list.length + 1) * Math.random()) | 0, 0, arr[newIndex - 1])
      listIndex.push(newIndex)
    }

    setListAnswers(list)
  }, [randomIndex])

  useEffect(() => {
    if (selectedAnswer) {
      if (selectedAnswer === arr[randomIndex - 1]) {
        if (correctAnswers < 1) {
          toast.success(
            <span>
              <b>Đúng</b>
              <br />
              Chỉ cần một từ nữa và tất cả đã sẳn sàng.
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
          setCorrectAnswers(1)
        } else {
          setCorrectAnswers((correctAnswers) => correctAnswers + 1)
        }
      } else {
        toast.error(
          <span>
            <b>Oops, thử lại đi!</b>
            <br />
            Bạn có thể muốn quay lại và đảm bảo rằng bạn đã viết ra cụm từ khôi
            phục một cách chính xác.
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
        if (correctAnswers < 0) {
          setCorrectAnswers(-2)
        } else {
          setCorrectAnswers(-1)
        }
      }
    }
  }, [selectedAnswer])

  useEffect(() => {
    if (correctAnswers > 1) {
      setIsDone(true)
      toast.success(
        <span>
          <b>Tất cả đã được sắp xếp</b>
          <br />
          Hãy chắc chắn giữ cụm từ khôi phục của bạn an toàn và không chia sẽ nó
          với bất kỳ ai!.
        </span>,
        {
          duration: 2000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
            marginBottom: '50px',
          }
        }
      )
    } else if (correctAnswers < -1) {
      setIsCheckCode(false)
      setCorrectAnswers(0)
    }

    if (correctAnswers < 2) {
      setTimeout(() => {
        setSelectedAnswer()
        setRandomIndex(randomInteger(1, 12))
      }, 500)
    }
  }, [correctAnswers])
  return (
    <div
      className={`${styles.component} ${backupCode.backupCode} ${
        isActive && styles.activePage
      }`}
    >
      {isCheckCode ? (
        <div className={backupCode.page2}>
          <div className={backupCode.top}>
            <div
              className={backupCode.close}
              onClick={() => setIsCheckCode(false)}
            >
              X
            </div>
            <div className={backupCode.title}>
              <h3>Xác nhận cụm từ khôi phục</h3>
            </div>
          </div>
          <div className={backupCode.body}>
            <div className={backupCode.bodyTitle}>
              Từ số {randomIndex} trong cụm từ khôi phục của bạn là gì?
            </div>
            <div className={backupCode.bodyList}>
              {listAnswers.map((value, i) => (
                <div key={i} className={backupCode.bodyItem}>
                  <label className={backupCode.label} htmlFor={'bCode' + i}>
                    {value}
                  </label>
                  <Checkbox
                    id={'bCode' + i}
                    checked={selectedAnswer === value}
                    icon={
                      <div
                        style={{
                          display: 'flex',
                          flex: 1,
                          backgroundColor: '#ed5c18',
                          alignSelf: 'stretch'
                        }}
                      >
                        <Icon.FiCheck color='white' size={20} />
                      </div>
                    }
                    borderColor='#ed5c18'
                    borderRadius={20}
                    style={{ overflow: 'hidden' }}
                    size={20}
                    onChange={(e) => setSelectedAnswer(value)}
                    disabled={selectedAnswer}
                  />
                </div>
              ))}
            </div>
          </div>
          {isDone && (
            <div className={backupCode.bottom}>
              <button
                className={backupCode.button}
                disabled={!isDone}
                onClick={() => setActivePage('pinCode')}
              >
                Tiếp tục
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={backupCode.page1}>
          <div className={backupCode.top}>
            <div
              className={backupCode.close}
              onClick={() => setActivePage('welcome')}
            >
              X
            </div>
            <div className={backupCode.title}>
              <h3>Cụm từ khôi phục của bạn</h3>
            </div>
          </div>
          <div
            className={`${backupCode.body} ${
              !isShowCode && backupCode.bodyHide
            }`}
          >
            {isShowCode ? (
              <React.Fragment>
                <div className={backupCode.list}>
                  <div className={backupCode.listLeft}>
                    {arr.slice(0, 6).map((e, i) => (
                      <div key={i} className={backupCode.item}>
                        <span>{i + 1}</span>
                        {e}
                      </div>
                    ))}
                  </div>
                  <div className={backupCode.listRight}>
                    {arr.slice(6).map((e, i) => (
                      <div key={i} className={backupCode.item}>
                        <span>{i + 7}</span>
                        {e}
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className={backupCode.bodyBottom}
                  onClick={() => copy(arr)}
                >
                  Sao chép
                </div>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <div className={backupCode.hideTitle}>
                  <h3>Hãy viết cụm từ đó ra!</h3>
                  Không có cách nào để khôi phục ví của bạn nếu bạn mất cụm từ
                  khôi phục. Hãy chắc chắn để lưu trữ nó ở một nơi an toàn
                </div>
                <button onClick={() => setIsShowCode(true)}>Hiển thị</button>
              </React.Fragment>
            )}
          </div>
          <div className={backupCode.bottom}>
            <button
              className={`${backupCode.button} ${
                !isShowCode && backupCode.buttonDisable
              }`}
              disabled={!isShowCode}
              onClick={() => setIsCheckCode(true)}
            >
              Tiếp tục
            </button>
            <button
              className={backupCode.button2}
              onClick={() => setActivePage('pinCode')}
            >
              Bỏ qua ngay bây giờ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
