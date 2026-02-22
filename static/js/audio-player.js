let audioPlayer = new Audio();
let currentAyahIndex = 0;
let autoPlayEnabled = true;

const playPauseBtn = document.getElementById("playPauseBtn");
const prevAyahBtn = document.getElementById("prevAyahBtn");
const nextAyahBtn = document.getElementById("nextAyahBtn");
const autoPlayToggle = document.getElementById("autoPlayToggle");
const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");

if (playPauseBtn) playPauseBtn.addEventListener("click", togglePlay);
if (prevAyahBtn) prevAyahBtn.addEventListener("click", prevAyah);
if (nextAyahBtn) nextAyahBtn.addEventListener("click", nextAyah);
if (autoPlayToggle) autoPlayToggle.addEventListener("click", toggleAutoPlay);
if (progressBar) progressBar.addEventListener("click", seek);

function togglePlay() {
    if (!audioPlayer.src) return;

    if (audioPlayer.paused) {
        audioPlayer.play();
        playPauseBtn.textContent = "⏸";
    } else {
        audioPlayer.pause();
        playPauseBtn.textContent = "▶";
    }
}

function toggleAutoPlay() {
    autoPlayEnabled = !autoPlayEnabled;
    autoPlayToggle.textContent = autoPlayEnabled ? "Auto‑Play: ON" : "Auto‑Play: OFF";
}

function nextAyah() {
    if (!currentSurah || !currentSurah.surah) return;
    if (currentAyahIndex + 1 < currentSurah.surah.length) {
        playAyah(currentAyahIndex + 1);
    }
}

function prevAyah() {
    if (!currentSurah || !currentSurah.surah) return;
    if (currentAyahIndex > 0) {
        playAyah(currentAyahIndex - 1);
    }
}

audioPlayer.ontimeupdate = function () {
    if (!audioPlayer.duration) return;

    const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;

    if (progressFill) progressFill.style.width = percent + "%";
    if (currentTimeEl) currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    if (durationEl) durationEl.textContent = formatTime(audioPlayer.duration);
};

audioPlayer.onended = function () {
    if (autoPlayEnabled) {
        nextAyah();
    } else {
        if (playPauseBtn) playPauseBtn.textContent = "▶";
    }
};

function seek(event) {
    if (!audioPlayer.duration) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    audioPlayer.currentTime = percent * audioPlayer.duration;
}

function formatTime(sec) {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}