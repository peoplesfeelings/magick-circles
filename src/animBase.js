/*
AnimModule: Base class for animation modules
Animator: Manages multiple animation modules and updates them each frame
*/

export class AnimModule {
  constructor(animator) {
    this.animator = animator;
    animator.add(this);
  }
  update(time, dt) {}
  destroy() { this.animator.remove(this); }
}

export class Animator {
  constructor() {
    this.modules = new Set();
    this.lastTime = 0;
  }

  add(module) {
    this.modules.add(module);
  }

  remove(module) {
    this.modules.delete(module);
  }

  start() {
    const loop = (time) => {
      const dt = time - this.lastTime;
      this.lastTime = time;

      for (const m of this.modules) {
        m.update(time, dt);
      }

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
}
