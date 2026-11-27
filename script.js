/* ==========================================================================
   A Little Universe Called Ahana — Interactive Logic
   Pure Vanilla JavaScript (zero tracking, zero external API keys)
   ========================================================================== */

(() => {
  'use strict';

  const TOTAL_SCREENS = 6;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LETTER_TEXT = `Dear Ahana,

Happy Birthday! ✨

It's funny how some friendships begin in the most unexpected ways.

We started as two strangers, and somewhere between random conversations, silly jokes, music, and all those little discussions, you became a friend.

I hope this new year of your life brings you countless reasons to smile.

May you travel to the places you've always dreamed of, meet wonderful people, discover beautiful things, and never lose that curiosity that makes you want to explore the entire world.

May you always find peace in difficult moments, courage when things feel uncertain, and happiness in the smallest things.

And most importantly, never stop being your wonderfully unpredictable self.

Thank you for being a part of some random yet memorable conversations.

Happy Birthday once again, Ahana.

Keep smiling, keep exploring, and keep collecting beautiful memories.

— Your friend, Babaji 😄`;

  // DOM References
  const screens = Array.from(document.querySelectorAll('.screen'));
  const progressDots = Array.from(document.querySelectorAll('.progress-dot'));
  const progressLabel = document.getElementById('progress-label');
  const enterBtn = document.getElementById('enter-btn');
  const replayBtn = document.getElementById('replay-btn');
  const musicToggleBtn = document.getElementById('music-toggle');
  const musicLabel = document.getElementById('music-label');
  const bgMusic = document.getElementById('bg-music');

  // Screen 2 & 3 interactive elements
  const memoryNodes = Array.from(document.querySelectorAll('.memory-node'));
  const traitCards = Array.from(document.querySelectorAll('.trait-card'));

  // Screen 4 (11:11 Wish) elements
  const wishingStarBtn = document.getElementById('wishing-star-btn');
  const starTapLabel = document.getElementById('star-tap-label');
  const sparkleBurst = document.getElementById('sparkle-burst');
  const wishFloatingMsg = document.getElementById('wish-floating-msg');
  const wishCounter = document.getElementById('wish-counter');

  // Screen 5 (World Map) elements
  const mapPins = Array.from(document.querySelectorAll('.map-pin'));
  const mapReadoutTag = document.getElementById('map-readout-tag');
  const mapReadoutMsg = document.getElementById('map-readout-msg');

  // Screen 6 (Final Letter) elements
  const letterBody = document.getElementById('letter-body');
  const typingCursor = document.getElementById('typing-cursor');
  const skipTypingBtn = document.getElementById('skip-typing-btn');
  const letterAfter = document.getElementById('letter-after');
  const anotherWishBtn = document.getElementById('another-wish-btn');

  // Application State
  let currentScreen = 1;
  const visitedScreens = new Set([1]);
  let wishCount = 0;
  let letterTimer = null;
  let letterTyped = false;

  // Optional Telegram WebApp initialization (no-op in normal browser)
  if (window.Telegram && window.Telegram.WebApp) {
    try {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    } catch (_) {
      // Ignore if Telegram SDK is unavailable
    }
  }

  /* ------------------------------------------------------------------------
     Screen Navigation
     ------------------------------------------------------------------------ */
  function goToScreen(targetNum) {
    const nextNum = Math.max(1, Math.min(TOTAL_SCREENS, Number(targetNum)));
    if (!nextNum || nextNum === currentScreen) return;

    const currentEl = document.getElementById(`screen-${currentScreen}`);
    const nextEl = document.getElementById(`screen-${nextNum}`);
    if (!currentEl || !nextEl) return;

    currentEl.classList.remove('is-active');
    currentEl.hidden = true;

    nextEl.hidden = false;
    // Force reflow so opacity/transform transition triggers cleanly
    void nextEl.offsetWidth;
    nextEl.classList.add('is-active');

    currentScreen = nextNum;
    visitedScreens.add(nextNum);
    updateProgressHUD();

    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });

    if (nextNum === 6 && !letterTyped) {
      startLetterTyping();
    }
  }

  function updateProgressHUD() {
    progressLabel.textContent = `${currentScreen} / ${TOTAL_SCREENS}`;
    replayBtn.hidden = currentScreen === 1;

    progressDots.forEach((dot) => {
      const step = Number(dot.dataset.target);
      dot.classList.toggle('is-active', step === currentScreen);
      dot.classList.toggle('is-visited', visitedScreens.has(step) && step !== currentScreen);
    });
  }

  enterBtn.addEventListener('click', () => goToScreen(2));

  document.querySelectorAll('[data-next]').forEach((btn) => {
    btn.addEventListener('click', () => goToScreen(Number(btn.dataset.next)));
  });

  document.querySelectorAll('[data-prev]').forEach((btn) => {
    btn.addEventListener('click', () => goToScreen(Number(btn.dataset.prev)));
  });

  progressDots.forEach((dot) => {
    dot.addEventListener('click', () => goToScreen(Number(dot.dataset.target)));
  });

  replayBtn.addEventListener('click', () => {
    resetInteractiveStates();
    goToScreen(1);
  });

  function resetInteractiveStates() {
    memoryNodes.forEach((node) => {
      node.classList.remove('is-open');
      node.setAttribute('aria-expanded', 'false');
    });
    traitCards.forEach((card) => {
      card.classList.remove('is-open');
      card.setAttribute('aria-expanded', 'false');
    });
    resetWishState();
    letterTyped = false;
    if (letterTimer) {
      clearTimeout(letterTimer);
      letterTimer = null;
    }
    letterBody.textContent = '';
    typingCursor.classList.remove('is-done');
    skipTypingBtn.hidden = false;
    letterAfter.classList.remove('is-visible');
  }

  /* ------------------------------------------------------------------------
     Screen 2 & Screen 3: Memory Bubbles & Trait Cards
     ------------------------------------------------------------------------ */
  memoryNodes.forEach((node) => {
    node.addEventListener('click', () => {
      const willOpen = !node.classList.contains('is-open');
      node.classList.toggle('is-open', willOpen);
      node.setAttribute('aria-expanded', String(willOpen));
    });
  });

  traitCards.forEach((card) => {
    card.addEventListener('click', () => {
      const willOpen = !card.classList.contains('is-open');
      card.classList.toggle('is-open', willOpen);
      card.setAttribute('aria-expanded', String(willOpen));
    });
  });

  /* ------------------------------------------------------------------------
     Screen 4: The 11:11 Wish
     ------------------------------------------------------------------------ */
  function spawnSparkles() {
    if (prefersReducedMotion) return;
    sparkleBurst.innerHTML = '';
    const count = 16;
    for (let i = 0; i < count; i += 1) {
      const dot = document.createElement('span');
      dot.className = 'sparkle-particle';
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
      const dist = 48 + Math.random() * 44;
      dot.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
      dot.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
      dot.style.background = i % 3 === 0 ? '#f4b6c2' : i % 2 === 0 ? '#c4b5fd' : '#fde68a';
      sparkleBurst.appendChild(dot);
    }
  }

  function resetWishState() {
    wishingStarBtn.classList.remove('is-wished');
    starTapLabel.textContent = 'Tap the star';
    wishFloatingMsg.classList.remove('is-visible');
    wishFloatingMsg.textContent = '';
    wishCounter.textContent = '';
    sparkleBurst.innerHTML = '';
  }

  wishingStarBtn.addEventListener('click', () => {
    wishCount += 1;
    wishingStarBtn.classList.remove('is-wished');
    void wishingStarBtn.offsetWidth;
    wishingStarBtn.classList.add('is-wished');

    spawnSparkles();

    wishFloatingMsg.textContent = 'May the universe surprise you with beautiful things.';
    wishFloatingMsg.classList.add('is-visible');
    starTapLabel.textContent = 'Make another wish';
    wishCounter.textContent =
      wishCount === 1
        ? '1 wish sent into the quiet sky ✨'
        : `${wishCount} wishes sent into the quiet sky ✨`;
  });

  anotherWishBtn.addEventListener('click', () => {
    wishingStarBtn.classList.remove('is-wished');
    starTapLabel.textContent = 'Tap the star';
    wishFloatingMsg.classList.remove('is-visible');
    goToScreen(4);
  });

  /* ------------------------------------------------------------------------
     Screen 5: Interactive World Map
     ------------------------------------------------------------------------ */
  mapPins.forEach((pin) => {
    pin.addEventListener('click', () => {
      mapPins.forEach((p) => p.classList.remove('is-active'));
      pin.classList.add('is-active');
      mapReadoutTag.textContent = pin.dataset.place || 'Somewhere out there';
      mapReadoutMsg.textContent = pin.dataset.msg || '';
    });
  });

  /* ------------------------------------------------------------------------
     Screen 6: Final Letter Typing Animation
     ------------------------------------------------------------------------ */
  function finishLetterImmediately() {
    if (letterTimer) {
      clearTimeout(letterTimer);
      letterTimer = null;
    }
    letterBody.textContent = LETTER_TEXT;
    typingCursor.classList.add('is-done');
    skipTypingBtn.hidden = true;
    letterAfter.classList.add('is-visible');
    letterTyped = true;
  }

  function startLetterTyping() {
    if (prefersReducedMotion) {
      finishLetterImmediately();
      return;
    }

    letterBody.textContent = '';
    typingCursor.classList.remove('is-done');
    skipTypingBtn.hidden = false;
    letterAfter.classList.remove('is-visible');

    let idx = 0;
    function step() {
      if (idx >= LETTER_TEXT.length) {
        finishLetterImmediately();
        return;
      }
      const ch = LETTER_TEXT[idx];
      letterBody.textContent += ch;
      idx += 1;

      let delay = 18;
      if (ch === '\n') delay = 90;
      else if (ch === '.' || ch === '!' || ch === '?') delay = 110;
      else if (ch === ',') delay = 55;

      letterTimer = setTimeout(step, delay);
    }

    step();
  }

  skipTypingBtn.addEventListener('click', finishLetterImmediately);

  /* ------------------------------------------------------------------------
     Background Music Toggle (Optional MP3 + Gentle Web Audio Chime Fallback)
     ------------------------------------------------------------------------ */
  let isPlayingMusic = false;
  let audioCtx = null;
  let chimeInterval = null;
  let useSynthFallback = false;

  const CHIME_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C major pentatonic

  function playSoftChimeNote() {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    const freq = CHIME_NOTES[Math.floor(Math.random() * CHIME_NOTES.length)];
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 3.3);
  }

  function startSynthFallback() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    playSoftChimeNote();
    if (!chimeInterval) {
      chimeInterval = setInterval(playSoftChimeNote, 2400);
    }
  }

  function stopMusic() {
    bgMusic.pause();
    if (chimeInterval) {
      clearInterval(chimeInterval);
      chimeInterval = null;
    }
    if (audioCtx && audioCtx.state === 'running') {
      audioCtx.suspend().catch(() => {});
    }
    isPlayingMusic = false;
    musicToggleBtn.setAttribute('aria-pressed', 'false');
    musicLabel.textContent = 'Music: Off';
  }

  function startMusic() {
    isPlayingMusic = true;
    musicToggleBtn.setAttribute('aria-pressed', 'true');
    musicLabel.textContent = 'Music: On';

    if (useSynthFallback) {
      startSynthFallback();
      return;
    }

    bgMusic.volume = 0.45;
    const playPromise = bgMusic.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Optional MP3 not present or blocked — use soft Web Audio chimes
        useSynthFallback = true;
        if (isPlayingMusic) {
          startSynthFallback();
        }
      });
    }
  }

  musicToggleBtn.addEventListener('click', () => {
    if (isPlayingMusic) {
      stopMusic();
    } else {
      startMusic();
    }
  });

  /* ------------------------------------------------------------------------
     Animated Starfield Background
     ------------------------------------------------------------------------ */
  function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let stars = [];
    let shootingStar = null;
    let animId = null;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const starCount = Math.min(130, Math.max(55, Math.floor((width * height) / 9500)));
      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.45 + 0.35,
        alpha: Math.random() * 0.65 + 0.25,
        twinkleSpeed: Math.random() * 0.018 + 0.004,
        phase: Math.random() * Math.PI * 2,
        driftY: -(Math.random() * 0.08 + 0.02),
        tint: Math.random() > 0.82 ? '#fde68a' : Math.random() > 0.65 ? '#c4b5fd' : '#ffffff',
      }));
    }

    function drawFrame() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i += 1) {
        const s = stars[i];
        if (!prefersReducedMotion) {
          s.phase += s.twinkleSpeed;
          s.y += s.driftY;
          if (s.y < -4) {
            s.y = height + 4;
            s.x = Math.random() * width;
          }
        }
        const opacity = s.alpha * (0.65 + 0.35 * Math.sin(s.phase));
        ctx.globalAlpha = opacity;
        ctx.fillStyle = s.tint;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        if (!shootingStar && Math.random() < 0.004) {
          shootingStar = {
            x: Math.random() * width * 0.7,
            y: Math.random() * height * 0.35,
            vx: 5.5,
            vy: 2.3,
            life: 1,
          };
        }

        if (shootingStar) {
          ctx.globalAlpha = shootingStar.life * 0.75;
          ctx.strokeStyle = '#fde68a';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(shootingStar.x, shootingStar.y);
          ctx.lineTo(shootingStar.x - shootingStar.vx * 5, shootingStar.y - shootingStar.vy * 5);
          ctx.stroke();

          shootingStar.x += shootingStar.vx;
          shootingStar.y += shootingStar.vy;
          shootingStar.life -= 0.028;
          if (shootingStar.life <= 0) {
            shootingStar = null;
          }
        }
      }

      ctx.globalAlpha = 1;
      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(drawFrame);
      }
    }

    resize();
    drawFrame();
    window.addEventListener('resize', () => {
      if (animId) cancelAnimationFrame(animId);
      resize();
      drawFrame();
    });
  }

  initStarfield();
  updateProgressHUD();
})();
