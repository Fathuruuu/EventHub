/**
 * EventHub Pro - Web Audio API Sound Synthesizer
 * Pure procedural audio without external file dependencies
 */
(function(window) {
  'use strict';

  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  var isMuted = false;

  function getContext() {
    if (!ctx && AudioContext) {
      ctx = new AudioContext();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(function() {});
    }
    return ctx;
  }

  var Sound = {
    setMuted: function(muted) {
      isMuted = !!muted;
    },
    isMuted: function() {
      return isMuted;
    },

    /**
     * Dual-tone harmonic chime for successful scan, payment, or completion
     */
    playSuccess: function() {
      if (isMuted) return;
      var c = getContext();
      if (!c) return;

      var now = c.currentTime;

      // Note 1: E5 (659.25 Hz)
      var osc1 = c.createOscillator();
      var gain1 = c.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.25, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(c.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: B5 (987.77 Hz)
      var osc2 = c.createOscillator();
      var gain2 = c.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.1);
      gain2.gain.setValueAtTime(0.001, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.3, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(c.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.55);
    },

    /**
     * Low warning buzz for rejected/already used ticket or validation error
     */
    playError: function() {
      if (isMuted) return;
      var c = getContext();
      if (!c) return;

      var now = c.currentTime;

      // Buzz 1: 180 Hz Sawtooth
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.28);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    },

    /**
     * Warning chime for tickets belonging to another event
     */
    playWarning: function() {
      if (isMuted) return;
      var c = getContext();
      if (!c) return;

      var now = c.currentTime;
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(370, now + 0.15);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    },

    /**
     * Soft click feedback for buttons
     */
    playClick: function() {
      if (isMuted) return;
      var c = getContext();
      if (!c) return;

      var now = c.currentTime;
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    },

    /**
     * Festive celebratory arpeggio for ticket checkout
     */
    playFanfare: function() {
      if (isMuted) return;
      var c = getContext();
      if (!c) return;

      var notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      var now = c.currentTime;

      notes.forEach(function(freq, index) {
        var start = now + (index * 0.08);
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    }
  };

  window.EventAudio = Sound;
})(window);
