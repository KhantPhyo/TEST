/* global */
(function (global) {
  const HISTORY_SIZE   = 16;
  const MIN_SPEED      = 0.08;     // normalized coords / second
  const MIN_TRAVEL     = 0.18;     // fraction of frame width/height
  const DIRECTION_RATIO = 1.6;     // dominant axis must beat the other by this factor
  const COOLDOWN_MS    = 900;

  // Fingertip and PIP landmark indices (index / middle / ring / pinky)
  const TIPS = [8, 12, 16, 20];
  const PIPS = [6, 10, 14, 18];

  // Fist: all four fingertips curl below their PIP joints, wrist nearly still
  const FIST_HOLD_MS   = 350;
  const MAX_FIST_SPEED = 0.025;   // coords / second

  // Snap: thumb tip (4) + middle-finger tip (12) pinch then rapid release
  const SNAP_PINCH_DIST = 0.07;
  const SNAP_OPEN_DIST  = 0.14;
  const SNAP_MAX_MS     = 280;

  class GestureDetector {
    constructor(opts = {}) {
      this.history        = [];
      this.lastGestureAt  = 0;
      this.onGesture      = opts.onGesture || (() => {});
      this.lastSeenAt     = 0;
      this._fistStartAt   = 0;
      this._fistFired     = false;
      this._snapState     = 'idle'; // 'idle' | 'pinched'
      this._snapPinchedAt = 0;
    }

    reset() {
      this.history      = [];
      this._fistStartAt = 0;
      this._fistFired   = false;
    }

    /**
     * landmarks: array of 21 {x,y,z} in normalized coords (0..1), already
     * mirrored so that rightward motion of the user's hand = increasing x.
     */
    pushFrame(landmarks, now = Date.now()) {
      if (!landmarks || landmarks.length < 21) {
        if (now - this.lastSeenAt > 300) this.reset();
        return;
      }
      this.lastSeenAt = now;

      const wrist = landmarks[0];
      this.history.push({ x: wrist.x, y: wrist.y, t: now });
      if (this.history.length > HISTORY_SIZE) this.history.shift();

      // ── Swipe detection ─────────────────────────────────────────────────
      if (now - this.lastGestureAt >= COOLDOWN_MS && this.history.length >= 6) {
        const first = this.history[0];
        const last  = this.history[this.history.length - 1];
        const dt    = Math.max(1, last.t - first.t);
        const dx    = last.x - first.x;
        const dy    = last.y - first.y;
        const speed = Math.hypot(dx, dy) / dt * 1000;
        const absX  = Math.abs(dx);
        const absY  = Math.abs(dy);

        if (speed >= MIN_SPEED && Math.max(absX, absY) >= MIN_TRAVEL) {
          let type = null;
          if (absX > absY * DIRECTION_RATIO) {
            type = dx > 0 ? 'SWIPE_RIGHT' : 'SWIPE_LEFT';
          } else if (absY > absX * DIRECTION_RATIO) {
            type = dy > 0 ? 'SWIPE_DOWN' : 'SWIPE_UP';
          }
          if (type) {
            this.lastGestureAt = now;
            this.reset();
            this.onGesture({ type, dx, dy, at: now });
            return;
          }
        }
      }

      // ── Fist detection ───────────────────────────────────────────────────
      // y increases downward; curled fingertips drop below their PIP joints.
      const isFist = TIPS.every((tip, i) => landmarks[tip].y > landmarks[PIPS[i]].y);
      const recent = this.history.slice(-5);
      let wristSpeed = 0;
      if (recent.length >= 2) {
        const f = recent[0], l = recent[recent.length - 1];
        wristSpeed = Math.hypot(l.x - f.x, l.y - f.y) / Math.max(1, l.t - f.t) * 1000;
      }

      if (isFist && wristSpeed < MAX_FIST_SPEED) {
        if (!this._fistStartAt) this._fistStartAt = now;
        if (!this._fistFired &&
            now - this._fistStartAt >= FIST_HOLD_MS &&
            now - this.lastGestureAt >= COOLDOWN_MS) {
          this.lastGestureAt = now;
          this._fistFired    = true;
          this.onGesture({ type: 'FIST', at: now });
        }
      } else {
        this._fistStartAt = 0;
        this._fistFired   = false;
      }

      // ── Snap detection ───────────────────────────────────────────────────
      // Thumb tip (4) and middle-finger tip (12) come together then quickly part.
      const snapDist = Math.hypot(
        landmarks[4].x - landmarks[12].x,
        landmarks[4].y - landmarks[12].y
      );

      if (this._snapState === 'idle') {
        if (snapDist < SNAP_PINCH_DIST) {
          this._snapState     = 'pinched';
          this._snapPinchedAt = now;
        }
      } else {
        if (snapDist > SNAP_OPEN_DIST) {
          if (now - this._snapPinchedAt <= SNAP_MAX_MS &&
              now - this.lastGestureAt  >= COOLDOWN_MS) {
            this.lastGestureAt = now;
            this.onGesture({ type: 'SNAP', at: now });
          }
          this._snapState = 'idle';
        } else if (now - this._snapPinchedAt > SNAP_MAX_MS) {
          // pinch held too long — not a snap
          this._snapState = 'idle';
        }
      }
    }
  }

  global.GestureDetector = GestureDetector;
})(self);
