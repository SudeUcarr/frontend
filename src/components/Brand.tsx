import {useId} from 'react'
import {Link} from 'react-router-dom'
import './brand.css'

export function BrandMark() {
  const gradient = useId()
  return <span className="brand-emblem" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" focusable="false">
    <defs><linearGradient id={gradient} x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop stopColor="#4264F6"/><stop offset="1" stopColor="#6551DB"/></linearGradient></defs>
    <rect x="2" y="2" width="60" height="60" rx="18" fill={`url(#${gradient})`}/>
    <path d="M13 10H43C49 10 54 15 54 21" stroke="white" strokeOpacity=".17" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M16 19L21 17V47L16 49V19Z" fill="#A6B9FF"/>
    <rect x="21" y="16" width="6" height="33" rx="2" fill="#FFFEF6"/>
    <path d="M29 31L42 16L49 19L34 35L29 31Z" fill="#FFCF60"/>
    <path d="M29 32L48 47L41 51L29 40V32Z" fill="#FFFEF6"/>
    <path d="M29 32L34 35L29 40V32Z" fill="#DCE4FF"/>
    <path d="M44 10H51V17L47.5 15L44 17V10Z" fill="#FFCF60"/>
  </svg></span>
}

export function Brand() {
  return <Link className="brand brand-signature" to="/" aria-label="KampüsKit ana sayfa"><BrandMark/><span className="brand-wordmark"><span className="brand-name">Kampüs</span><span className="brand-kit">Kit</span></span></Link>
}
