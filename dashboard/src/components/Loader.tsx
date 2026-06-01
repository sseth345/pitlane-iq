/**
 * PitLane IQ — Loader
 * Full-screen session initialization with SVG F1 car stroke animation + live log feed
 */

import { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

const LOG_STEPS = [
  '[OK] FastF1 cache initialized',
  '[OK] Session metadata loaded',
  '[..] Parsing lap telemetry...',
  '[OK] 57 laps · 20 drivers parsed',
  '[..] Running tyre degradation model...',
  '[OK] Deg model fitted (SOFT R²=0.94, MED R²=0.89)',
  '[..] Computing undercut threat scores...',
  '[OK] Strategy engine ready',
  '[..] Building replay frames...',
  '[OK] 57 frames built · 23 events detected',
  '[OK] PitLane IQ ready',
];

interface Props {
  progress?: number; // 0–100
  statusText?: string;
}

export default function Loader({ progress = 0, statusText = 'Initializing session...' }: Props) {
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const controls = useAnimation();

  // Animate log lines appearing progressively
  useEffect(() => {
    const totalSteps = LOG_STEPS.length;
    const idx = Math.floor((progress / 100) * totalSteps);
    setVisibleLogs(LOG_STEPS.slice(0, Math.max(1, idx)));
  }, [progress]);

  // Trigger SVG car stroke animation on mount
  useEffect(() => {
    controls.start({ pathLength: 1, opacity: 1, transition: { duration: 2.2, ease: 'easeInOut' } });
  }, [controls]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ background: 'linear-gradient(145deg, #070A0F 0%, #090C13 50%, #07090E 100%)' }}>

      {/* Header wordmark */}
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 18, color: '#FAFAFA', letterSpacing: '-0.02em' }}>
          Pit<span style={{ color: 'var(--cyan)' }}>Lane</span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 400, marginLeft: 2 }}> IQ</span>
        </span>
      </div>

      {/* SVG F1 Car silhouette — stroke draw animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <svg width="280" height="90" viewBox="0 0 280 90" fill="none"
          xmlns="http://www.w3.org/2000/svg">
          {/* Simplified geometric F1 car outline */}
          <motion.path
            d="M 20 55 L 10 55 L 10 48 L 18 45 L 25 30 L 40 22 L 80 18 L 120 15 L 160 16 
               L 190 20 L 210 28 L 228 32 L 240 38 L 255 42 L 262 50 L 255 55 L 235 56
               L 230 62 Q 220 72 205 72 Q 190 72 185 62 L 180 56 L 100 56 L 95 62 
               Q 85 72 70 72 Q 55 72 50 62 L 45 55 Z"
            stroke="var(--cyan)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={controls}
          />
          {/* Front wing */}
          <motion.path
            d="M 10 55 L 5 58 L 5 52 L 10 50"
            stroke="var(--cyan)"
            strokeWidth="1.5"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1, transition: { delay: 1.2, duration: 0.8, ease: 'easeOut' } }}
          />
          {/* Rear wing */}
          <motion.path
            d="M 255 42 L 262 35 L 262 50"
            stroke="var(--cyan)"
            strokeWidth="1.5"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1, transition: { delay: 1.5, duration: 0.8, ease: 'easeOut' } }}
          />
          {/* Cockpit */}
          <motion.path
            d="M 120 15 L 125 5 L 160 5 L 165 16"
            stroke="rgba(0,210,190,0.5)"
            strokeWidth="1.5"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1, transition: { delay: 0.8, duration: 1.0, ease: 'easeOut' } }}
          />
          {/* Wheels */}
          <motion.circle cx="70" cy="67" r="10" stroke="rgba(0,210,190,0.6)" strokeWidth="1.5" fill="none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, transition: { delay: 1.8, duration: 0.4, ease: 'backOut' } }}
          />
          <motion.circle cx="205" cy="67" r="10" stroke="rgba(0,210,190,0.6)" strokeWidth="1.5" fill="none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, transition: { delay: 1.9, duration: 0.4, ease: 'backOut' } }}
          />
          {/* Speed lines after car is drawn */}
          <motion.path
            d="M 270 48 L 280 48 M 272 44 L 280 44 M 270 52 L 280 52"
            stroke="var(--cyan)"
            strokeWidth="1"
            strokeLinecap="round"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: [0, 0.7, 0], x: [0, 8, 0], transition: { delay: 2.2, duration: 1.2, repeat: Infinity, repeatDelay: 0.3 } }}
          />
        </svg>
      </motion.div>

      {/* Status text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#FAFAFA', marginBottom: 16 }}
      >
        {statusText}
      </motion.p>

      {/* Progress bar */}
      <div style={{
        width: 320, height: 2, background: 'rgba(255,255,255,0.08)',
        borderRadius: 1, marginBottom: 20, overflow: 'hidden'
      }}>
        <motion.div
          style={{ height: '100%', background: 'var(--cyan)', borderRadius: 1, originX: 0 }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Live log feed */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        style={{
          width: 400,
          height: 110,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 2,
        }}
      >
        {visibleLogs.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: i === visibleLogs.length - 1 ? 1 : 0.35, x: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              color: line.startsWith('[OK]') ? 'var(--status-good)'
                   : line.startsWith('[..') ? 'var(--cyan)'
                   : 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            {line}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
