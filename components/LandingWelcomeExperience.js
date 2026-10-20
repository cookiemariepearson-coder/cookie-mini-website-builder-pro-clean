'use client';

import { useEffect, useState } from 'react';

function playNotes(notes = []) {
  if (typeof window === 'undefined') return false;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return false;

  let context;
  try {
    // Create and resume the audio context directly from the user's click gesture.
    context = new AudioContextClass();
    const scheduleNotes = () => {
      if (context.state !== 'running') {
        context.close().catch(() => {});
        return;
      }
      const now = context.currentTime + 0.015;
      notes.forEach(({ frequency, delay = 0, duration = 0.22, volume = 0.07, type = 'sine' }) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = now + delay;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.035);
      });
      const finalNoteMs = Math.max(0, ...notes.map(note => (note.delay || 0) + (note.duration || 0.22) + 0.1)) * 1000;
      window.setTimeout(() => context?.close().catch(() => {}), finalNoteMs + 180);
    };

    if (context.state === 'suspended') {
      context.resume().then(scheduleNotes).catch(() => { try { context?.close(); } catch {} });
    } else {
      scheduleNotes();
    }
    return true;
  } catch {
    try { context?.close(); } catch {}
    return false;
  }
}

const welcomeNotes = [
  { frequency: 523.25, delay: 0, duration: 0.28, volume: 0.085, type: 'triangle' },
  { frequency: 659.25, delay: 0.12, duration: 0.30, volume: 0.08, type: 'sine' },
  { frequency: 783.99, delay: 0.24, duration: 0.38, volume: 0.09, type: 'triangle' }
];
const clickNotes = [
  { frequency: 659.25, delay: 0, duration: 0.09, volume: 0.045, type: 'sine' },
  { frequency: 880, delay: 0.035, duration: 0.10, volume: 0.012, type: 'sine' }
];

export default function LandingWelcomeExperience() {
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    if (!soundEnabled) return undefined;

    function playInterfaceSound(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('.landingSoundToggle')) return;
      const interactive = target.closest('.brandLanding a, .brandLanding button');
      if (interactive) playNotes(clickNotes);
    }

    document.addEventListener('click', playInterfaceSound, true);
    return () => document.removeEventListener('click', playInterfaceSound, true);
  }, [soundEnabled]);

  function toggleSound() {
    if (soundEnabled) {
      setSoundEnabled(false);
      return;
    }
    // Browsers allow audio after a direct user gesture; never autoplay sound.
    playNotes(welcomeNotes);
    setSoundEnabled(true);
  }

  return (
    <div className="landingWelcomeExperience">
      <div className="landingWelcomeDecor" aria-hidden="true">
        <span className="welcomeSpark sparkOne">✦</span>
        <span className="welcomeSpark sparkTwo">✦</span>
        <span className="welcomeSpark sparkThree">●</span>
        <span className="welcomeSpark sparkFour">✦</span>
        <span className="welcomeSpark sparkFive">●</span>
        <span className="welcomeGlow" />
      </div>
      <button
        type="button"
        className="landingSoundToggle"
        aria-pressed={soundEnabled}
        onClick={toggleSound}
        aria-label={soundEnabled ? 'Turn off landing-page sound effects' : 'Turn on landing-page sound effects'}
      >
        <span aria-hidden="true">{soundEnabled ? '♫' : '♪'}</span>
        Sound effects: {soundEnabled ? 'On' : 'Off'}
      </button>
      <span className="landingMotionNote">Subtle sparkle mode</span>
    </div>
  );
}
