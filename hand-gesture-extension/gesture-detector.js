/* global */
(function (global) {
  const HISTORY_SIZE = 16;
  const MIN_SPEED = 0.08;          // normalized coords / second
  const MIN_TRAVEL = 0.18;         // fraction of frame across window
  const DIRECTION_RATIO = 1.6;     // dominant axis must beat other by this factor
  const COOLDOWN_MS = 900;

  class GestureDetector {
    constructor(opts = {}) {
      this.history = [];
      this.lastGestureAt = 0;
      this.onGesture = opts.onGesture || (() => {});
      this.lastSeenAt = 0;
    }

    reset() {
      this.history = [];
    }

    /**
     * landmarks: array of 21 {x,y,z} in normalized coords (0..1), already
     * mirrored so that rightward motion of the user's hand = increasing x.
     */
    pushFrame(landmarks, now = Date.now()) {
      if (!landmarks || landmarks.length < 21) {
        // If we lose the hand for >300ms, reset trajectory.
        if (now - this.lastSeenAt > 300) this.reset();
        return;
      }
      this.lastSeenAt = now;

      // Track the wrist (landmark 0) for stable motion.
      const wrist = landmarks[0];
      this.history.push({ x: wrist.x, y: wrist.y, t: now });
      if (this.history.length > HISTORY_SIZE) this.history.shift();

      if (now - this.lastGestureAt < COOLDOWN_MS) return;
      if (this.history.length < 6) return;

      const first = this.history[0];
      const last = this.history[this.history.length - 1];
      const dt = Math.max(1, last.t - first.t);
      const dx = last.x - first.x;
      const dy = last.y - first.y;
      const speed = Math.hypot(dx, dy) / dt * 1000;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (speed < MIN_SPEED) return;
      if (Math.max(absX, absY) < MIN_TRAVEL) return;

      let type = null;
      if (absX > absY * DIRECTION_RATIO) {
        type = dx > 0 ? 'SWIPE_RIGHT' : 'SWIPE_LEFT';
      } else if (absY > absX * DIRECTION_RATIO) {
        type = dy > 0 ? 'SWIPE_DOWN' : 'SWIPE_UP';
      } else {
        return; // diagonal — ignore to reduce false positives
      }

      this.lastGestureAt = now;
      this.reset();
      this.onGesture({ type, dx, dy, at: now });
    }
  }

  global.GestureDetector = GestureDetector;
})(self);
