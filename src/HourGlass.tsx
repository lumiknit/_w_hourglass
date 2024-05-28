import {
  Accessor,
  batch,
  Component,
  createSignal,
  For,
  Setter,
} from "solid-js";

type HourGlassProps = {
  n: number;
  backgroundColor?: string;
  offColor?: string;
  onColor?: string;
};

class State {
  n: number;
  board: boolean[];

  gx: number = 0;
  gy: number = 0;
  neckProb: number = 0.5;

  top: Accessor<boolean[]>;
  setTop: Setter<boolean[]>;
  bottom: Accessor<boolean[]>;
  setBottom: Setter<boolean[]>;

  constructor(n: number) {
    this.n = n;
    this.board = Array(2 * n * n).fill(false);

    for (let i = 0; i < 2 * n * n; i++) {
      this.board[i] = i < n * n * 0.9;
    }

    [this.top, this.setTop] = createSignal(this.board.slice(0, n * n));
    [this.bottom, this.setBottom] = createSignal(this.board.slice(n * n));
  }

  pos2idx(x: number, y: number): number | undefined {
    if (0 <= x && x < this.n && 0 <= y && y < this.n) {
      return this.n * this.n + x + this.n * y;
    } else if (-this.n <= x && x < 0 && -this.n <= y && y < 0) {
      return x + this.n + this.n * (y + this.n);
    }
  }

  idx2pos(idx: number): [number, number] | undefined {
    if (0 <= idx && idx < this.n * this.n) {
      return [(idx % this.n) - this.n, Math.floor(idx / this.n) - this.n];
    } else if (this.n * this.n <= idx && idx < 2 * this.n * this.n) {
      const i = idx - this.n * this.n;
      return [i % this.n, Math.floor(i / this.n)];
    }
  }

  get(x: number, y: number): boolean | undefined {
    const idx = this.pos2idx(x, y);
    if (idx !== undefined) {
      return this.board[idx];
    }
  }

  getIdx(idx: number): boolean | undefined {
    return this.board[idx];
  }

  set(x: number, y: number, value: boolean): void {
    const idx = this.pos2idx(x, y);
    if (idx !== undefined) {
      this.board[idx] = value;
    }
  }

  setGravity(gx: number, gy: number): void {
    this.gx = gx;
    this.gy = gy;
  }

  step() {
    // Find bottom
    const bx = this.gx >= 0 ? this.n - 1 : -this.n;
    const by = this.gy >= 0 ? this.n - 1 : -this.n;
    const dx = this.gx >= 0 ? -1 : 1;
    const dy = this.gy >= 0 ? -1 : 1;

    const gl = Math.sqrt(this.gx * this.gx + this.gy * this.gy);
    const gx = this.gx / gl;
    const gy = this.gy / gl;

    const possiblePoints: [number, number, number][] = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) {
          continue;
        }
        // Check distance from gx, gy
        const d = (i - gx) * (i - gx) + (j - gy) * (j - gy);
        if (d < 1) {
          possiblePoints.push([i, j, d]);
        }
      }
    }
    // Sort by distance
    possiblePoints.sort((a, b) => {
      if (Math.abs(a[2] - b[2]) > 1e-3) return a[2] - b[2];
      else return Math.random() - 0.5;
    });

    let changed = false;

    for (let x = bx; -this.n <= x && x < this.n; x += dx) {
      for (let y = by; -this.n <= y && y < this.n; y += dy) {
        const i = this.pos2idx(x, y);
        if (i === undefined || this.board[i] === false) {
          continue;
        }
        // Check if the gravity direction is possible
        for (let [nx, ny, _] of possiblePoints) {
          const n = this.pos2idx(x + nx, y + ny);
          if (n !== undefined && this.board[n] === false) {
            if (
              x * 2 + nx === -1 &&
              y * 2 + ny === -1 &&
              Math.random() < this.neckProb
            ) {
              continue;
            }
            this.board[n] = true;
            this.board[i] = false;
            changed = true;
            break;
          }
        }
      }
    }

    if (changed) {
      batch(() => {
        this.setTop(this.board.slice(0, this.n * this.n));
        this.setBottom(this.board.slice(this.n * this.n));
      });
    }
  }
}

export const HourGlass: Component<HourGlassProps> = (props) => {
  const cellW = 100 / props.n;
  const cellH = 100 / props.n;

  const state = new State(props.n);

  setInterval(() => {
    state.step();
  }, 20);

  window.addEventListener("devicemotion", (e) => {
    const g = e.accelerationIncludingGravity;
    if (g === null || g.x === null || g.y === null) {
      state.setGravity(1, 1);
      return;
    }
    let gx = g.y;
    let gy = g.x;
    // Rotate 45
    const angle = (-3 * Math.PI) / 4;
    const x = gx * Math.cos(angle) - gy * Math.sin(angle);
    const y = gx * Math.sin(angle) + gy * Math.cos(angle);
    state.setGravity(x, y);
  });

  return (
    <div
      class="hourglass"
      style={{
        "background-color": props.backgroundColor || "black",
      }}
    >
      <div class="hourglass-inner">
        <div class="hourglass-room">
          <For each={state.top()}>
            {(b) => (
              <div
                class="hourglass-cell hourglass-top"
                style={{
                  width: `${cellW}%`,
                  height: `${cellH}%`,
                }}
              >
                <div
                  class="hourglass-dot"
                  style={{
                    "background-color": b ? props.onColor : props.offColor,
                  }}
                ></div>
              </div>
            )}
          </For>
        </div>
        <div class="hourglass-room hourglass-bottom">
          <For each={state.bottom()}>
            {(b) => (
              <div
                class="hourglass-cell"
                style={{
                  width: `${cellW}%`,
                  height: `${cellH}%`,
                }}
              >
                <div
                  class="hourglass-dot"
                  style={{
                    "background-color": b ? props.onColor : props.offColor,
                  }}
                ></div>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};
