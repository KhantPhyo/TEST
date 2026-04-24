(function () {
  if (window.__handGestureInstalled) return;
  window.__handGestureInstalled = true;

  const SCROLL_STEP = Math.max(200, Math.floor(window.innerHeight * 0.6));

  function findActiveVideo() {
    const videos = Array.from(document.querySelectorAll('video'));
    if (videos.length === 0) return null;

    let best = null;
    let bestScore = -1;
    for (const v of videos) {
      const rect = v.getBoundingClientRect();
      const visible =
        rect.width > 120 &&
        rect.height > 80 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth;
      if (!visible) continue;
      const area = rect.width * rect.height;
      const playing = !v.paused && !v.ended && v.readyState > 2;
      const score = area * (playing ? 2 : 1);
      if (score > bestScore) {
        bestScore = score;
        best = v;
      }
    }
    return best;
  }

  function adjustVolume(video, delta) {
    try {
      const v = Math.min(1, Math.max(0, (video.volume || 0) + delta));
      video.volume = v;
      if (v > 0 && video.muted) video.muted = false;
      flashOverlay(`\u{1F50A} ${Math.round(v * 100)}%`);
      return true;
    } catch (e) {
      return false;
    }
  }

  function seekVideo(video, deltaSec) {
    try {
      const dur = isFinite(video.duration) ? video.duration : null;
      let t = (video.currentTime || 0) + deltaSec;
      if (dur) t = Math.min(dur, Math.max(0, t));
      else t = Math.max(0, t);
      video.currentTime = t;
      const sign = deltaSec >= 0 ? '⏩' : '⏪';
      flashOverlay(`${sign} ${Math.abs(deltaSec)}s`);
      return true;
    } catch (e) {
      return false;
    }
  }

  function scrollBy(dy) {
    window.scrollBy({ top: dy, left: 0, behavior: 'smooth' });
    flashOverlay(dy < 0 ? '⬆️ Scroll up' : '⬇️ Scroll down');
  }

  let overlayEl = null;
  let overlayTimer = null;
  function flashOverlay(text) {
    if (!document.body) return;
    if (!overlayEl) {
      overlayEl = document.createElement('div');
      overlayEl.setAttribute('data-hg-overlay', '1');
      Object.assign(overlayEl.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: 'rgba(20, 20, 28, 0.85)',
        color: '#fff',
        padding: '10px 16px',
        borderRadius: '10px',
        fontSize: '14px',
        fontFamily: 'system-ui, sans-serif',
        zIndex: 2147483647,
        pointerEvents: 'none',
        boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
        opacity: '0',
        transition: 'opacity 150ms ease'
      });
      document.body.appendChild(overlayEl);
    }
    overlayEl.textContent = text;
    overlayEl.style.opacity = '1';
    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(() => {
      if (overlayEl) overlayEl.style.opacity = '0';
    }, 900);
  }

  function handleGesture(gesture) {
    const video = findActiveVideo();
    const inVideoMode = !!video;

    switch (gesture.type) {
      case 'SWIPE_UP':
        if (inVideoMode) {
          if (adjustVolume(video, 0.1)) return { handled: true, mode: 'video' };
        }
        scrollBy(-SCROLL_STEP);
        return { handled: true, mode: 'scroll' };

      case 'SWIPE_DOWN':
        if (inVideoMode) {
          if (adjustVolume(video, -0.1)) return { handled: true, mode: 'video' };
        }
        scrollBy(SCROLL_STEP);
        return { handled: true, mode: 'scroll' };

      case 'SWIPE_LEFT':
        if (inVideoMode) {
          if (seekVideo(video, -5)) return { handled: true, mode: 'video' };
        }
        // let background handle history navigation
        return { handled: false, mode: 'history' };

      case 'SWIPE_RIGHT':
        if (inVideoMode) {
          if (seekVideo(video, 5)) return { handled: true, mode: 'video' };
        }
        return { handled: false, mode: 'history' };

      default:
        return { handled: false };
    }
  }

  window.__handGestureHandle = handleGesture;
})();
