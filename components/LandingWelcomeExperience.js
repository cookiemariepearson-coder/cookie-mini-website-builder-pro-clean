import { useEffect, useState } from 'react';

// Keep one audio context alive for the page. Recreating and closing an AudioContext
// for every tap can be unreliable in some browsers and mobile devices.
let sharedAudioContext = null;
let sharedMasterGain = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  try {
    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new AudioContextClass();
      sharedMasterGain = sharedAudioContext.createGain();
      sharedMasterGain.gain.value = 0.68;
      sharedMasterGain.connect(sharedAudioContext.destination);
    }
    return sharedAudioContext;
  } catch {
    sharedAudioContext = null;
    sharedMasterGain = null;
    return null;
  }
}

function playNotes(notes = []) {
  const context = getAudioContext();
  if (!context || !sharedMasterGain) return Promise.resolve(false);

  // resume() is invoked immediately from the user's click handler to satisfy
  // browser autoplay policies, then notes are scheduled once the context runs.
  let resumeTask;
  try {
    resumeTask = context.state === 'suspended' ? context.resume() : Promise.resolve();
  } catch {
    return Promise.resolve(false);
  }

  return Promise.resolve(resumeTask).then(() => {
    if (context.state !== 'running') return false;
    const now = context.currentTime + 0.035;
    notes.forEach(({ frequency, delay = 0, duration = 0.24, volume = 0.18, type = 'triangle' }) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + delay;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(sharedMasterGain);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.05);
    });
    return true;
  }).catch(() => false);
}

async function pauseAudio() {
  try {
    if (sharedAudioContext?.state === 'running') await sharedAudioContext.suspend();
  } catch {}
}

const welcomeNotes = [
  { frequency: 523.25, delay: 0, duration: 0.26, volume: 0.19, type: 'triangle' },
  { frequency: 659.25, delay: 0.12, duration: 0.30, volume: 0.18, type: 'sine' },
  { frequency: 783.99, delay: 0.25, duration: 0.43, volume: 0.20, type: 'triangle' }
];
const clickNotes = [
  { frequency: 659.25, delay: 0, duration: 0.12, volume: 0.15, type: 'triangle' },
  { frequency: 880, delay: 0.07, duration: 0.14, volume: 0.14, type: 'sine' }
];

export default function LandingWelcomeExperience() {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundMessage, setSoundMessage] = useState('');

  useEffect(() => {
    if (!soundEnabled) return undefined;

    function playInterfaceSound(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('.landingSoundToggle')) return;
      const interactive = target.closest('.homepageTopStrip a, .homepageTopStrip button, .brandLanding a, .brandLanding button');
      if (interactive) void playNotes(clickNotes);
    }

    document.addEventListener('click', playInterfaceSound, true);
    return () => document.removeEventListener('click', playInterfaceSound, true);
  }, [soundEnabled]);

  async function toggleSound() {
    if (soundEnabled) {
      setSoundEnabled(false);
      setSoundMessage('Sound effects are off.');
      await pauseAudio();
      return;
    }

    setSoundMessage('Testing sound…');
    const played = await playNotes(welcomeNotes);
    if (played) {
      setSoundEnabled(true);
      setSoundMessage('Sound is on. Click a link or button to hear a chime.');
    } else {
      setSoundEnabled(false);
      setSoundMessage('Your browser could not start audio. Check site sound permissions and try again.');
    }
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
      {soundMessage && <span className="landingSoundStatus" role="status" aria-live="polite">{soundMessage}</span>}
    </div>
  );
}
