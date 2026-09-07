// Minimal Clock interface used by R3F 9.7, backed by Three r185's supported Timer.
export function createFiberTimer(Timer) {
  const timer = new Timer();
  return {
    autoStart: true,
    running: false,
    elapsedTime: 0,
    oldTime: 0,
    startTime: 0,
    start() {
      timer.reset();
      this.startTime = this.oldTime = performance.now();
      this.elapsedTime = 0;
      this.running = true;
    },
    stop() {
      this.getElapsedTime();
      this.running = false;
      this.autoStart = false;
    },
    getDelta() {
      if (this.autoStart && !this.running) {
        this.start();
        return 0;
      }
      if (!this.running) return 0;
      timer.update();
      const delta = timer.getDelta();
      this.oldTime = performance.now();
      this.elapsedTime += delta;
      return delta;
    },
    getElapsedTime() {
      this.getDelta();
      return this.elapsedTime;
    },
  };
}
