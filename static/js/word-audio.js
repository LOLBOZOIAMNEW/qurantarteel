/************************************************************
 * WORD‑BY‑WORD AUDIO HANDLERS (FAST AYAH‑LEVEL PLAYBACK)
 ************************************************************/
let activeWordAudio = null;

function attachWordAudioHandlers() {
    const words = document.querySelectorAll(".clickable-word");
    if (!words.length) return;

    words.forEach(word => {
        word.addEventListener("click", () => {
            const url = word.dataset.audio;
            if (!url || url === "null" || url === "") return;

            // Stop previous audio instantly
            if (activeWordAudio) {
                activeWordAudio.pause();
                activeWordAudio.currentTime = 0;
            }

            // Remove highlight from all words
            document.querySelectorAll(".clickable-word")
                .forEach(w => w.classList.remove("word-playing"));

            // Highlight clicked word
            word.classList.add("word-playing");

            // Reuse one audio object for speed
            activeWordAudio = new Audio();
            activeWordAudio.src = url;
            activeWordAudio.currentTime = 0; // always start from beginning
            activeWordAudio.play();

            activeWordAudio.onended = () => {
                word.classList.remove("word-playing");
            };
        });
    });
}