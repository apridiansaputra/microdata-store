'use client'

import Header from './Header'
import Menu from './Menu'
import { useState, useEffect } from 'react'

export default function Navbar() {
      const [showMenu, setShowMenu] = useState(true)
      const [lastScrollY, setLastScrollY] = useState(0)

      useEffect(() => {
        const handleScroll = () => {
          const currentScrollY = window.scrollY
          
          if (currentScrollY > lastScrollY && currentScrollY > 50) {
            setShowMenu(false)
          } else {
            setShowMenu(true)
          }
          
          setLastScrollY(currentScrollY)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        
        return () => window.removeEventListener('scroll', handleScroll)
      }, [lastScrollY])

      return (
        <div className='fixed top-0 left-0 right-0 z-50 shadow-sm shadow-gray-100 border-b border-gray-200 transition-all duration-300 ease-in-out bg-white py-5'>
          <Header />
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showMenu ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <Menu />
          </div>
        </div>
      )
}
   
