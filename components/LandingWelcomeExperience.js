'use client';

import { useState } from 'react';

export default function LandingWelcomeExperience() {
  const [playing, setPlaying] = useState(false);

  function playWelcome() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const notes = [523.25, 659.25, 783.99];
    setPlaying(true);
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, context.currentTime + index * .14);
      gain.gain.exponentialRampToValueAtTime(.12, context.currentTime + index * .14 + .02);
      gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + index * .14 + .32);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(context.currentTime + index * .14);
      oscillator.stop(context.currentTime + index * .14 + .34);
    });
    setTimeout(() => {
      setPlaying(false);
      context.close();
    }, 850);
  }

  return <div className="landingWelcomeExperience">
    <button type="button" className={playing ? 'playing' : ''} onClick={playWelcome} aria-label="Play welcome sound">
      <span aria-hidden="true">{playing ? '♪' : '🔊'}</span> {playing ? 'Welcome!' : 'Play Welcome Sound'}
    </button>
    <span className="welcomeSpark sparkOne" aria-hidden="true">✦</span>
    <span className="welcomeSpark sparkTwo" aria-hidden="true">✦</span>
    <span className="welcomeSpark sparkThree" aria-hidden="true">●</span>
  </div>;
}
