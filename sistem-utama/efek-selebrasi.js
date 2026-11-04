/**
 * EventHub Pro - Pure Canvas Confetti Particle System
 */
(function(window) {
  'use strict';

  var canvas = null;
  var ctx = null;
  var particles = [];
  var animationFrameId = null;

  function initCanvas() {
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '999999';
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', resize);
    }
  }

  function resize() {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }

  var COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#10b981', '#14b8a6', '#f59e0b', '#3b82f6', '#e11d48'
  ];

  function Particle(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 8 + 5;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    var angle = Math.random() * Math.PI * 2;
    var speed = Math.random() * 12 + 4;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 6; // upward bias
    this.gravity = 0.35;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 12;
    this.drag = 0.96;
    this.alpha = 1;
    this.decay = Math.random() * 0.015 + 0.01;
    this.shape = Math.random() > 0.4 ? 'rect' : 'circle';
  }

  Particle.prototype.update = function() {
    this.vx *= this.drag;
    this.vy = this.vy * this.drag + this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    this.alpha -= this.decay;
    return this.alpha > 0;
  };

  Particle.prototype.draw = function(c) {
    c.save();
    c.globalAlpha = Math.max(0, this.alpha);
    c.translate(this.x, this.y);
    c.rotate((this.rotation * Math.PI) / 180);
    c.fillStyle = this.color;

    if (this.shape === 'rect') {
      c.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
    } else {
      c.beginPath();
      c.arc(0, 0, this.size / 2.5, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  };

  function renderLoop() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      if (!p.update()) {
        particles.splice(i, 1);
      } else {
        p.draw(ctx);
      }
    }

    if (particles.length > 0) {
      animationFrameId = requestAnimationFrame(renderLoop);
    } else {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
  }

  var Confetti = {
    burst: function(x, y, count) {
      initCanvas();
      x = x !== undefined ? x : window.innerWidth / 2;
      y = y !== undefined ? y : window.innerHeight * 0.45;
      count = count || 90;

      for (var i = 0; i < count; i++) {
        particles.push(new Particle(x, y));
      }

      if (!animationFrameId) {
        renderLoop();
      }
    },
    celebrate: function() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      this.burst(w * 0.3, h * 0.4, 70);
      setTimeout(function() {
        Confetti.burst(w * 0.7, h * 0.4, 70);
      }, 150);
      setTimeout(function() {
        Confetti.burst(w * 0.5, h * 0.35, 100);
      }, 350);
    }
  };

  window.EventConfetti = Confetti;
})(window);
