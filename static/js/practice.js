let practiceData = null;
let practiceAudio = new Audio();
let recognition = null;
let userTranscript = "";

window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SR) {
    recognition = new SR();
    recognition.lang = "ar-SA";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
}
if (recognition) {
    recognition.onspeechstart = _startFailsafeTimer;
    recognition.onsoundstart = _startFailsafeTimer;
    recognition.onsoundend = _startFailsafeTimer;
    recognition.onspeechend = _startFailsafeTimer;
}

function initPracticePage() {
    const root = document.getElementById("practice-page");
    if (!root) return;

    const loadBtn = document.getElementById("loadPracticeAyahBtn");
    const playRefBtn = document.getElementById("playReferenceBtn");
    const startBtn = document.getElementById("startRecBtn");
    const stopBtn = document.getElementById("stopRecBtn");
    const checkBtn = document.getElementById("checkRecitationBtn");

    if (loadBtn) loadBtn.addEventListener("click", loadPracticeAyah);
    if (playRefBtn) playRefBtn.addEventListener("click", playReferenceAyah);
    if (startBtn) startBtn.addEventListener("click", startRecording);
    if (stopBtn) stopBtn.addEventListener("click", stopRecording);
    if (checkBtn) checkBtn.addEventListener("click", checkRecitation);

    if (!recognition) {
        setPracticeStatus("Speech recognition not supported.");
        return;
    }

    let collected = "";

    recognition.onstart = () => {
        collected = "";
        userTranscript = "";

        const transcriptEl = document.getElementById("practiceTranscript");
        if (transcriptEl) transcriptEl.textContent = "";

        setPracticeStatus("Recording...");
    };

    recognition.onresult = (event) => {
        let text = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            if (res.isFinal) {
                userTranscript += " " + res[0].transcript;
            } else {
                text += " " + res[0].transcript;
            }
        }
        collected = text.trim();
    };

    recognition.onerror = () => {
        setPracticeStatus("Recognition error.");
    };

    recognition.onend = () => {};

    window._saveTranscript = () => {
        userTranscript = (userTranscript + " " + collected).trim();
    };
}

function startSpeechRecognition() {
    if (!recognition) return;
    try { recognition.abort(); } catch (e) {}
    setTimeout(() => {
        try { recognition.start(); } catch (e) {}
    }, 200);
}

function stopSpeechRecognition() {
    if (!recognition) return;
    try { recognition.stop(); } catch (e) {}
}

function loadPracticeAyah() {
    const surahEl = document.getElementById("practiceSurahSelect");
    const reciterEl = document.getElementById("practiceReciterSelect");
    const ayahInput = document.getElementById("practiceAyahInput");

    if (!surahEl || !reciterEl || !ayahInput) return;

    const surah = surahEl.value;
    const reciter = reciterEl.value;
    const ayahNum = parseInt(ayahInput.value || "1", 10);

    fetch("/get_surah", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ surah, reciter_id: reciter })
    })
    .then(res => res.json())
    .then(data => {
        practiceData = data;

        const idx = Math.max(0, Math.min(ayahNum - 1, data.surah.length - 1));
        const ayah = data.surah[idx];

        const arabicEl = document.getElementById("practiceArabic");
        const englishEl = document.getElementById("practiceEnglish");
        const transcriptEl = document.getElementById("practiceTranscript");
        const resultEl = document.getElementById("practiceResult");
        const scoreEl = document.getElementById("practiceScore");
        const phraseEl = document.getElementById("practicePhrase");

        if (arabicEl && ayah.words) {
            let html = "";
            ayah.words.forEach((w, i) => {
                html += `
    <span class="clickable-word"
          data-index="${i}"
          data-start="${w.start_time}"
          data-end="${w.end_time}"
          data-audio="${w.timing_audio}">
        ${w.text}
    </span>
`;
            });
            arabicEl.innerHTML = html;
            attachWordAudioHandlers();
        } else if (arabicEl) {
            arabicEl.textContent = ayah.arabic || "";
        }

        if (englishEl) englishEl.textContent = ayah.english || "";

        practiceAudio.src = ayah.audio || "";

        setPracticeStatus(`Loaded Surah ${parseInt(surah, 10) + 1}, Ayah ${ayah.number}.`);

        if (transcriptEl) transcriptEl.textContent = "";
        if (resultEl) resultEl.textContent = "";
        if (scoreEl) scoreEl.textContent = "Score: --%";
        if (phraseEl) phraseEl.textContent = "";

        userTranscript = "";
        recordedBlob = null;
    });
}

function attachWordAudioHandlers() {
    const words = document.querySelectorAll(".clickable-word");

    words.forEach(word => {
        word.addEventListener("click", () => {
            const index = parseInt(word.dataset.index, 10);
            playWordByTimestamp(index);
        });
    });
}

function playWordByTimestamp(index) {
    const words = document.querySelectorAll(".clickable-word");
    const el = words[index];
    if (!el) return;

    const start = parseFloat(el.dataset.start);
    const end = parseFloat(el.dataset.end);
    const audioSrc = el.dataset.audio;

    if (!audioSrc || isNaN(start) || isNaN(end)) return;

    practiceAudio.src = audioSrc;

    practiceAudio.oncanplay = () => {
        practiceAudio.currentTime = start;
        practiceAudio.play();

        setTimeout(() => {
            practiceAudio.pause();
        }, (end - start) * 1000);
    };

    practiceAudio.load();
}

function playReferenceAyah() {
    if (practiceAudio.src) practiceAudio.play();
}

async function checkRecitation() {
    if (!practiceData) {
        setPracticeStatus("Load an ayah first.");
        return;
    }

    if (!userTranscript || userTranscript.trim().length < 2) {
        if (!recordedBlob) {
            setPracticeStatus("No transcript detected.");
            return;
        }

        setPracticeStatus("Using Whisper fallback...");

        const whisperText = await whisperFallback(recordedBlob);

        if (!whisperText) {
            setPracticeStatus("Whisper could not transcribe.");
            return;
        }

        userTranscript = whisperText;
    }

    const surahEl = document.getElementById("practiceSurahSelect");
    const ayahInput = document.getElementById("practiceAyahInput");

    const surah = parseInt(surahEl.value, 10);
    const ayahNum = parseInt(ayahInput.value, 10);
    const idx = ayahNum - 1;

    const ayah = practiceData.surah[idx];
    if (!ayah) return;

    const resultEl = document.getElementById("practiceResult");
    const scoreEl = document.getElementById("practiceScore");
    const phraseEl = document.getElementById("practicePhrase");

    const { feedback, score, phrase } = scoreRecitation(ayah.arabic, userTranscript);

    if (resultEl) resultEl.innerHTML = feedback;
    if (scoreEl) scoreEl.textContent = `Score: ${score}%`;
    if (phraseEl) phraseEl.textContent = phrase;

    setPracticeStatus("Recitation checked.");
}

function setPracticeStatus(msg) {
    const el = document.getElementById("practiceStatus");
    if (el) el.textContent = msg;
}