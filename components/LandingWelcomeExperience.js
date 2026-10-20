'use client';

import { useState } from 'react';

export default function LandingWelcomeExperience() {
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState('A little sparkle for your next big idea.');

  async function playWelcomeSound() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      setMessage('Your browser does not support the welcome sound, but the sparkle animation is still here.');
      return;
    }

    let context;
    try {
      context = new AudioContext();
      if (context.state === 'suspended') await context.resume();
      if (context.state !== 'running') throw new Error('Sound is unavailable until the browser allows it.');

      setPlaying(true);
      setMessage('Welcome in — let’s build something beautiful!');
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = index % 2 ? 'sine' : 'triangle';
        oscillator.frequency.value = frequency;
        const start = context.currentTime + index * 0.13;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.032, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.34);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.36);
      });
      window.setTimeout(() => setPlaying(false), 900);
      window.setTimeout(() => context.close(), 1400);
    } catch {
      setPlaying(false);
      setMessage('The welcome sound could not play in this browser. Your page still works normally.');
      try { await context?.close(); } catch {}
    }
  }

  return (
    <div className="landingWelcomeExperience">
      <div className="welcomeSparkField" aria-hidden="true">
        <span className="welcomeSpark sparkOne">✦</span>
        <span className="welcomeSpark sparkTwo">✧</span>
        <span className="welcomeSpark sparkThree">✦</span>
        <span className="welcomeSpark sparkFour">●</span>
        <span className="welcomeSpark sparkFive">✧</span>
        <span className="welcomeGlow" />
      </div>
      <div className="welcomeExperienceCopy">
        <span className="welcomeExperienceKicker">A warmer welcome</span>
        <p aria-live="polite">{message}</p>
        <button type="button" className="welcomeSoundButton" onClick={playWelcomeSound} disabled={playing}>
          {playing ? 'Playing welcome sound…' : 'Play welcome sound ♪'}
        </button>
        <small>Sound is optional and plays only when you press the button.</small>
      </div>
    </div>
  );
}
