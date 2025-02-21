'use client'
import React from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'

const HomePage = () => {
    const router = useRouter()
    const handleLogout = () => {
        console.log('logout')
        Cookies.remove('auth_token')
        Cookies.remove('refresh_token')
        Cookies.remove('user')
        router.push('/auth/login')
    }
  return (
    <div>
        <button>Logout</button>
    </div>
  )
}

export default HomePage