import React from 'react'
import styles from '../../styles.module.scss'
import intro from './intro.module.scss'
import { Slide1 } from './slide/slide1'
import Stories from 'react-insta-stories'
import { Slide2 } from './slide/slide2'
import { Slide3 } from './slide/slide3'

export const Intro = ({ isActive, setActivePage }) => {
  const slides = [
    {
      content: () => <Slide1 />
    },
    {
      content: () => <Slide2 />
    },
    {
      content: () => <Slide3 setActivePage={setActivePage} />
    }
  ]
  return (
    <div
      className={`${styles.component} ${intro.intro} ${
        isActive && styles.activePage
      }`}
    >
      <div className={intro.close} onClick={() => setActivePage('welcome')}>
        X
      </div>
      {isActive && (
        <Stories
          defaultInterval={3000}
          width={'100%'}
          height={'100%'}
          stories={slides}
          preventDefault={false}
        />
      )}
    </div>
  )
}
