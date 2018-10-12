// Based off http://codepen.io/petamoriken/pen/JGWQOE/?editors=001
"use strict";

import {AudioPlayer} from "./play_audio.js"
import {PlayerCanvas} from "./draw.js"

// AudioContext
const ctx = new (window.AudioContext || window.webkitAudioContext)();
ctx.suspend();

let currentAudioPlayer = new AudioPlayer(null, ctx);
let progressBar = document.getElementById('songProgress');

let myPlayerCanvas = (() => {
  let player    = document.getElementById('player');
  let fixed     = document.getElementById('playerFixed');
  let fixedMenu = document.getElementById('playerFixedMenu');
  let menu      = document.getElementById('playerMenu');
  return new PlayerCanvas(player, fixed, menu, fixedMenu, progressBar);
})();
myPlayerCanvas.getTime = currentAudioPlayer.getCurrentTime;
myPlayerCanvas.audioSeek = currentAudioPlayer.seek;
myPlayerCanvas.drawContinuously();

// Pxtone initialize
window.DECODER_URL = (window.DECODER_URL || "./pxtnDecoder.js");
const pxtone = new Pxtone();
pxtone.decoder = new Worker(window.DECODER_URL);

// set decodePxtoneData to AudioContext
ctx.decodePxtoneStream = pxtone.decodePxtoneStream.bind(pxtone, ctx);

// DOM
const playBtn         = document.querySelector(".playerButton");
const stopBtn         = document.querySelector(".stopButton");
const volumeSlider    = document.querySelector("#volumeSlider");
const volumeIndicator = document.querySelector("#volumeIndicator");
const zoomSelect      = document.querySelector("#zoomSelect");
const keyZoomSelect   = document.querySelector("#keyZoomSelect");
const snapSelect      = document.querySelector("#snapSelect");
const scaleSelect     = document.querySelector("#scaleSelect");
const [pxtnName, pxtnTitle, pxtnComment] = [
  document.querySelector("output .name"),
  document.querySelector("output .title"),
  document.querySelector("output .comment")
];

// http://qiita.com/noriaki/items/4bfef8d7cf85dc1035b3
const escapeHTML = (() => {
  const escapeMap = {
    "&": "&amp;",
    "'": "&#39;",
    '"': "&quot;",
    "<": "&lt;",
    ">": "&gt;"
  };

  function callback(char) {
    return escapeMap[char];
  }

  return (str) => {
    return str.replace(/[&"'<>]/g, callback);
  };
})();

let loadingFile = false;
function updateButtonDisplay() {
  if (!loadingFile) stopBtn.classList.remove("disabled");
  else stopBtn.classList.add("disabled");

  if (currentAudioPlayer.isSuspended()) {
    playBtn.classList.remove("pause");
    playBtn.classList.add("play");
  } else {
    playBtn.classList.remove("play");
    playBtn.classList.add("pause");
  }

  if (loadingFile) playBtn.classList.add("disabled");
  else playBtn.classList.remove("disabled");
}

async function resumeAudio() { await currentAudioPlayer.resume(); updateButtonDisplay(); }
async function pauseAudio()  { await currentAudioPlayer.pause();  updateButtonDisplay(); }
async function stopAudio()   { await currentAudioPlayer.stop();   updateButtonDisplay(); }
async function seekAudio(s)  { await currentAudioPlayer.seek(s);  updateButtonDisplay(); }

// button
const playerStateChange = async () => {
  if (playBtn.classList.contains("disabled")) return;
  playBtn.classList.add("disabled");
  if (currentAudioPlayer.isSuspended()) await resumeAudio();
  else await pauseAudio();
  playBtn.classList.remove("disabled");
};
playBtn.addEventListener("click", playerStateChange);

const playerStop = async () => {
  if (stopBtn.classList.contains("disabled")) return;
  stopBtn.classList.add("disabled");
  if (currentAudioPlayer.isStarted()) await stopAudio();
  stopBtn.classList.remove("disabled");
  updateButtonDisplay();
}
stopBtn.addEventListener("click", playerStop);

// progress
const progressClick = (e) => {
  var progressValue = e.offsetX * progressBar.max / progressBar.offsetWidth;
  return seekAudio(progressValue);
};
progressBar.addEventListener("click", progressClick);

// volume slider
const updateVolume = (_e) => {
  currentAudioPlayer.setVolume(volumeSlider.value);
  volumeIndicator.innerHTML = Math.floor(volumeSlider.value * 100) + "%";
}
volumeSlider.addEventListener("input", updateVolume);

// display: zoom and snap and scale
const updateZoom = (_e) => myPlayerCanvas.setZoom(zoomSelect.value);
zoomSelect.addEventListener("input", updateZoom);
zoomSelect.addEventListener("change", updateZoom);
updateZoom(null);

const updateKeyZoom = (_e) => myPlayerCanvas.setKeyZoom(keyZoomSelect.value);
keyZoomSelect.addEventListener("input", updateKeyZoom);
keyZoomSelect.addEventListener("change", updateKeyZoom);
updateKeyZoom(null);

const updateDark = (_e) => myPlayerCanvas.setDark(darkSelect.checked);
darkSelect.addEventListener("input", updateDark);
darkSelect.addEventListener("change", updateDark);
updateDark(null);

const updateSnap = (_e) => myPlayerCanvas.setSnap(snapSelect.value);
snapSelect.addEventListener("input", updateSnap);
snapSelect.addEventListener("change", updateSnap);
updateSnap(null);

const updateScale = (_e) => myPlayerCanvas.setScale(scaleSelect.checked ? 2 : 1);
scaleSelect.addEventListener("input", updateScale);
updateScale(null);

// input Pxtone Collage file
// file is ArrayBuffer
export let loadFile = async function (file, filename) {
  pxtnName.innerHTML = filename;
  pxtnTitle.innerHTML = "&nbsp;";
  pxtnComment.innerHTML = "&nbsp;";

  loadingFile = true;
  await currentAudioPlayer.release();
  updateButtonDisplay();

  let {stream, master, units, evels, data} = await ctx.decodePxtoneStream(file);

  pxtnTitle.innerHTML = escapeHTML(data.title) || "no name";
  pxtnComment.innerHTML = escapeHTML(data.comment).replace(/[\n\r]/g, "<br>") || "no comment";

  currentAudioPlayer = new AudioPlayer(stream, ctx);
  updateVolume(null);

  myPlayerCanvas.getTime = currentAudioPlayer.getCurrentTime;
  myPlayerCanvas.audioSeek = currentAudioPlayer.seek;
  myPlayerCanvas.isStarted = currentAudioPlayer.isStarted;
  myPlayerCanvas.setData(units, evels, master);
  loadingFile = false;
  updateButtonDisplay();
}