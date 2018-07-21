"use strict";

const canvas = document.getElementById('player');
const ctx = canvas.getContext('2d');

let Player = function () {
  this.startTime = null;
  this.audioCtx = null;
  this.evels = { unitNum: 0, evels: []};
  this.master = null;
  this.measureWidth = 192;
}

function drawUnitNote(ctx, x, y, w) {
  ctx.fillRect(x, y-1, w, 2);
  ctx.fillRect(x, y-2, Math.max(w-1, 0), 4);
  ctx.fillRect(x, y-3, Math.max(Math.min(2, w), 0), 6);
  ctx.fillRect(x, y-5, 1, 10);
}

function middleSnap(x) { return Math.floor(x) + 0.5; }

Player.prototype.draw = function () {
  // - back -
  ctx.save();
  // global transform
  ctx.fillStyle = "#000010";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let shiftX = canvas.width/2;
  ctx.translate(shiftX, 0);
  ctx.scale(2, 2);

  // time offset
  let currentTime = this.audioCtx.currentTime - this.startTime;
  let currentBeat = currentTime * this.master.beatTempo / 60;
  let currentClock = currentBeat * this.master.beatClock;
  let playX = middleSnap(currentBeat / this.master.beatNum) * this.measureWidth;

  ctx.translate(-playX, 0);

  let canvasOffsetX = playX - shiftX;

  // - rulers -
  let start; // so that only the rulers in the scroll view are drawn
  // beat
  ctx.fillStyle = "#808080";
  let beatWidth = this.measureWidth / this.master.beatNum;
  start = Math.floor(canvasOffsetX / beatWidth);
  for (let i = 0; i < canvas.width / beatWidth + 1; ++i)
    ctx.fillRect((i + start) * beatWidth, 0, 1, canvas.height);

  // measure
  ctx.fillStyle = "#F0F0F0";
  start = Math.floor(canvasOffsetX / this.measureWidth);
  for (let i = 0; i < canvas.width / this.measureWidth + 1; ++i)
    ctx.fillRect((i + start) * this.measureWidth, 0, 1, canvas.height);

  // - unit rows -
  start = canvasOffsetX;
  ctx.fillStyle = "#400070";
  for (let i = 0; i < this.evels.unitNum; ++i) {
    ctx.fillRect(start, i*16 + 1, canvas.width, 15);
  }

  // notes
  ctx.fillStyle = "#F08000";
  // TODO: use interval tree to get the relevant notes to render
  let clockPerPx = this.master.beatClock * this.master.beatNum / this.measureWidth;
  for (let e of this.evels.evels) {
    if (e.kind != "ON")
      continue;
    let w = e.value / clockPerPx;
    if (e.clock <= currentClock && e.clock + e.value > currentClock) {
      ctx.save();
      ctx.fillStyle = "#FFF000";
    }
    drawUnitNote(ctx, e.clock / clockPerPx, e.unit_no * 16 + 8, w);
    if (e.clock <= currentClock && e.clock + e.value > currentClock) ctx.restore();
    // unit_no, value, clock
  }

  ctx.restore();
  ctx.restore();
}

Player.prototype.drawContinuously = function () {
  let k = this;
  function f(now) {
    k.draw();
    window.requestAnimationFrame(f);
  }
  f(performance.now());
}

export var MyPlayer = new Player();
