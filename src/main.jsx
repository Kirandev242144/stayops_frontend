import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import 'react-toastify/dist/ReactToastify.css'
import './styles/shopify-toast.css'
import { ToastContainer } from 'react-toastify'
import App from './App.jsx'
import Lenis from "lenis"
// GSAP
import gsap from "gsap"

// Lenis
const lenis = new Lenis({
  duration: 1.2,
  smoothWheel: true,
})

gsap.ticker.add((time) => {
  lenis.raf(time * 1000)
})

gsap.ticker.lagSmoothing(0)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={3500}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  </StrictMode>,
)

