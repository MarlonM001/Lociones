export function TruckIcon({ className }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M2.5 15.5V6.8a1 1 0 0 1 1-1h8.3v9.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.8 9.3h3.6l3.1 3v3.2h-6.7V9.3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <circle cx="6.6" cy="16.4" r="1.6" fill="currentColor" />
      <circle cx="15.6" cy="16.4" r="1.6" fill="currentColor" />
      <path d="M2.5 12.4h2.6M9 12.4h2.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
