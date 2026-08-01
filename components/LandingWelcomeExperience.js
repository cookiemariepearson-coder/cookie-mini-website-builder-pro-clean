'use client';

import { useEffect } from 'react';

export default function LandingWelcomeExperience() {
  useEffect(() => {
    let played = false;
    let timer;

    async function playWelcome() {
      if (played) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      try {
        if (context.state === 'suspended') await context.resume();
        if (context.state !== 'running') throw new Error('Sound requires a visitor interaction.');
        played = true;
        const notes = [392, 523.25, 659.25, 783.99, 1046.5];
        notes.forEach((frequency, index) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = index % 2 ? 'sine' : 'triangle';
          oscillator.frequency.value = frequency;
          const start = context.currentTime + index * .17;
          gain.gain.setValueAtTime(.0001, start);
          gain.gain.exponentialRampToValueAtTime(.045, start + .035);
          gain.gain.exponentialRampToValueAtTime(.0001, start + .55);
          oscillator.connect(gain).connect(context.destination);
          oscillator.start(start);
          oscillator.stop(start + .58);
        });
        setTimeout(() => context.close(), 1800);
        window.removeEventListener('pointerdown', playWelcome);
        window.removeEventListener('keydown', playWelcome);
      } catch {
        context.close();
      }
    }

    timer = window.setTimeout(playWelcome, 2800);
    window.addEventListener('pointerdown', playWelcome, { once: true });
    window.addEventListener('keydown', playWelcome, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', playWelcome);
      window.removeEventListener('keydown', playWelcome);
    };
  }, []);

  return <div className="landingWelcomeExperience" aria-hidden="true">
    <span className="welcomeSpark sparkOne" aria-hidden="true">✦</span>
    <span className="welcomeSpark sparkTwo" aria-hidden="true">✦</span>
    <span className="welcomeSpark sparkThree" aria-hidden="true">●</span>
    <span className="welcomeSpark sparkFour" aria-hidden="true">✦</span>
    <span className="welcomeSpark sparkFive" aria-hidden="true">●</span>
    <span className="welcomeGlow" aria-hidden="true"></span>
  </div>;
}
