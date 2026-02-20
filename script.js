(function () {
  'use strict';

  var releaseDateEl = document.getElementById('release-time');
  var daysEl = document.getElementById('days');
  var hoursEl = document.getElementById('hours');
  var minutesEl = document.getElementById('minutes');
  var secondsEl = document.getElementById('seconds');

  // ตี 3 พรุ่งนี้ (3:00 AM tomorrow, local time)
  function getReleaseTime() {
    var now = new Date();
    var tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 3, 0, 0, 0);
    return tomorrow;
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function updateReleaseLabel() {
    var t = getReleaseTime();
    var dateStr = t.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    releaseDateEl.textContent = 'Release: ' + dateStr + ' at 3:00 AM';
  }

  function tick() {
    var now = new Date();
    var release = getReleaseTime();
    var diff = release.getTime() - now.getTime();

    if (diff <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      if (releaseDateEl) releaseDateEl.textContent = 'We\'re live!';
      return;
    }

    var sec = Math.floor(diff / 1000);
    var min = Math.floor(sec / 60);
    sec = sec % 60;
    var hr = Math.floor(min / 60);
    min = min % 60;
    var day = Math.floor(hr / 24);
    hr = hr % 24;

    daysEl.textContent = pad(day);
    hoursEl.textContent = pad(hr);
    minutesEl.textContent = pad(min);
    secondsEl.textContent = pad(sec);
  }

  updateReleaseLabel();
  tick();
  setInterval(tick, 1000);

  // เสียงลั้นๆ + จอแจม แล้วค่อยเข้าเกม
  var btnGame = document.getElementById('btn-game');
  var jamScreen = document.getElementById('jam-screen');
  var gameUrl = btnGame ? btnGame.getAttribute('data-game-url') : '';

  var audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {}
    }
    return audioCtx;
  }

  function resumeAudio() {
    var ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function playDingSound() {
    var ctx = getAudioContext();
    if (!ctx) return;
    try {
      var playTone = function (freq, startTime, duration) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      playTone(880, 0, 0.12);
      playTone(1100, 0.14, 0.14);
    } catch (e) {}
  }

  function scheduleLoadingBeeps() {
    var ctx = getAudioContext();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') ctx.resume();
      var now = ctx.currentTime;
      var startAt = now + 0.4;
      var intervalSec = 0.38;
      var beepDur = 0.2;
      var i = 0;
      while (startAt + i * intervalSec < now + JAM_DURATION_MS / 1000) {
        var t = startAt + i * intervalSec;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 520;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.35, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + beepDur);
        osc.start(t);
        osc.stop(t + beepDur);
        i++;
      }
    } catch (e) {}
  }

  var jamFill = document.getElementById('jam-error-fill');
  var jamPercent = document.getElementById('jam-error-percent');
  var JAM_DURATION_MS = 2200;

  if (btnGame && jamScreen && gameUrl) {
    btnGame.addEventListener('click', function (e) {
      e.preventDefault();
      resumeAudio();
      playDingSound();
      scheduleLoadingBeeps();
      jamScreen.classList.add('is-active');
      jamScreen.setAttribute('aria-hidden', 'false');
      if (jamFill) jamFill.style.width = '0%';
      if (jamPercent) jamPercent.textContent = '0%';

      var start = Date.now();
      var timer = setInterval(function () {
        var elapsed = Date.now() - start;
        var pct = Math.min(100, Math.floor((elapsed / JAM_DURATION_MS) * 100));
        if (jamFill) jamFill.style.width = pct + '%';
        if (jamPercent) jamPercent.textContent = pct + '%';
        if (elapsed >= JAM_DURATION_MS) {
          clearInterval(timer);
          window.open(gameUrl, '_blank', 'noopener,noreferrer');
          jamScreen.classList.remove('is-active');
          jamScreen.setAttribute('aria-hidden', 'true');
        }
      }, 50);
    });
  }
})();
