let mediaRecorder = null;
let audioChunks = [];
let recordedBlob = null;

let _recogBuffer = "";
let _recogFinal = "";
let _recogActive = false;
let _recogTimeout = null;

function startRecording() {
    if (!recognition) return;

    const startBtn = document.getElementById("startRecBtn");
    const stopBtn = document.getElementById("stopRecBtn");
    const transcriptEl = document.getElementById("practiceTranscript");

    if (transcriptEl) transcriptEl.textContent = "";
    userTranscript = "";
    _recogBuffer = "";
    _recogFinal = "";
    _recogActive = true;

    if (startBtn) {
        startBtn.classList.remove("mic-off");
        startBtn.classList.add("mic-on");
        startBtn.disabled = true;
    }

    if (stopBtn) {
        stopBtn.classList.remove("stop-off");
        stopBtn.classList.add("stop-on");
        stopBtn.disabled = false;
    }

    setPracticeStatus("Starting microphone...");

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

        mediaRecorder.onstop = () => {
            recordedBlob = new Blob(audioChunks, { type: "audio/webm" });
        };

        mediaRecorder.start();
    });

    startSpeechRecognition();
}

function stopRecording() {
    if (!recognition) return;

    _recogActive = false;
    stopSpeechRecognition();
    clearTimeout(_recogTimeout);

    if (mediaRecorder) mediaRecorder.stop();

    const startBtn = document.getElementById("startRecBtn");
    const stopBtn = document.getElementById("stopRecBtn");
    const transcriptEl = document.getElementById("practiceTranscript");

    userTranscript = (_recogFinal + " " + _recogBuffer).trim();

    if (transcriptEl) transcriptEl.textContent = userTranscript;

    if (startBtn) {
        startBtn.classList.remove("mic-on");
        startBtn.classList.add("mic-off");
        startBtn.disabled = false;
    }

    if (stopBtn) {
        stopBtn.classList.remove("stop-on");
        stopBtn.classList.add("stop-off");
        stopBtn.disabled = true;
    }

    setPracticeStatus("Recording finished.");
}

function _startFailsafeTimer() {
    clearTimeout(_recogTimeout);
    _recogTimeout = setTimeout(() => {
        if (_recogActive) {
            stopSpeechRecognition();
            startSpeechRecognition();
        }
    }, 4000);
}