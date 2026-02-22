function initQuranPage() {
    const surahSelect = document.getElementById("surahSelect");
    const reciterSelect = document.getElementById("reciterSelect");
    const playSurahBtn = document.getElementById("playSurahBtn");

    if (surahSelect) surahSelect.addEventListener("change", loadSurah);
    if (reciterSelect) reciterSelect.addEventListener("change", loadSurah);
    if (playSurahBtn) playSurahBtn.addEventListener("click", playSurahFromStart);

    loadSurah();
}

function loadSurah() {
    const surahSelect = document.getElementById("surahSelect");
    const reciterSelect = document.getElementById("reciterSelect");

    if (!surahSelect || !reciterSelect) return;

    fetch("/get_surah", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            surah: surahSelect.value,
            reciter_id: reciterSelect.value
        })
    })
    .then(res => res.json())
    .then(data => {
        currentSurah = data;
        currentAyahIndex = 0;
        renderSurah();
    });
}

function renderSurah() {
    const container = document.getElementById("surahDisplay");
    if (!container || !currentSurah.surah) return;

    container.innerHTML = "";

    if (currentSurah.bismillah) {
        container.innerHTML += `<div class="bismillah-banner">${currentSurah.bismillah}</div>`;
    }

    currentSurah.surah.forEach((ayah, index) => {
        const arabic = ayah.arabic || "";
        const english = ayah.english || "";

        container.innerHTML += `
            <div class="ayah" id="ayah-${ayah.id}">
                <div class="number">Ayah ${ayah.number}</div>
                <div class="arabic">${arabic}</div>
                <div class="english">${english}</div>
                <button class="play-ayah-btn" data-index="${index}">▶ Play Ayah</button>
            </div>
        `;
    });

    attachAyahPlayButtons();
}

function attachAyahPlayButtons() {
    document.querySelectorAll(".play-ayah-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const index = parseInt(btn.getAttribute("data-index"), 10);
            playAyah(index);
        });
    });
}

function playSurahFromStart() {
    if (!currentSurah || !currentSurah.surah) return;
    playAyah(0);
}

function playAyah(index) {
    if (!currentSurah || !currentSurah.surah) return;

    const ayah = currentSurah.surah[index];
    if (!ayah || !ayah.audio) return;

    currentAyahIndex = index;
    audioPlayer.src = ayah.audio;
    audioPlayer.play();

    const btn = document.getElementById("playPauseBtn");
    if (btn) btn.textContent = "⏸";

    highlightAyah(index);
}

function highlightAyah(index) {
    document.querySelectorAll(".ayah").forEach(a => a.classList.remove("playing"));

    const ayah = currentSurah.surah[index];
    if (!ayah) return;

    const el = document.getElementById(`ayah-${ayah.id}`);
    if (el) {
        el.classList.add("playing");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}