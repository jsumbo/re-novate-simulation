'use client'

import { useEffect } from 'react'

export function ClearServiceWorker() {
  useEffect(() => {
    // Clear any cached service workers on mount
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister()
          console.log('Unregistered service worker:', registration.scope)
        })
      })
    }
  }, [])

  return null
}

