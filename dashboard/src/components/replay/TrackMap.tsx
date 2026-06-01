export function TrackMap() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, background: 'var(--bg-panel)' }}>
      <h2 className="t-label" style={{ marginBottom: 16 }}>Live Track Map</h2>
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Placeholder generic track SVG */}
        <svg viewBox="0 0 400 250" width="100%" height="100%" style={{ opacity: 0.3 }}>
          <path 
            d="M 50,125 C 50,50 150,50 200,125 C 250,200 350,200 350,125 C 350,50 250,50 200,125 C 150,200 50,200 50,125 Z" 
            fill="none" 
            stroke="var(--txt-primary)" 
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
          <span className="t-label-xs">TRACK RENDER ENGAGED</span>
        </div>
      </div>
    </div>
  );
}
