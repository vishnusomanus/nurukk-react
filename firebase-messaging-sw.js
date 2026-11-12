/* eslint-disable no-undef */
/**
 * Firebase background messaging service worker.
 * Config mirrors the web app (public client keys).
 */
importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyAo44UssjIYA1uJRYTHFvDml1UtrTx7-_c',
  authDomain: 'nurukku-firebase.firebaseapp.com',
  projectId: 'nurukku-firebase',
  storageBucket: 'nurukku-firebase.firebasestorage.app',
  messagingSenderId: '220647774409',
  appId: '1:220647774409:web:60d7ef32a56ee744dc5518',
  measurementId: 'G-85DCBMS7NY',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'nurukk'
  const body = payload.notification?.body || payload.data?.body || ''
  const options = {
    body,
    data: payload.data || {},
    icon: './app-icons/buyer.png',
  }
  self.registration.showNotification(title, options)
})
