async function whisperFallback(blob) {
    const form = new FormData();
    form.append("audio", blob, "recitation.webm");

    try {
        const res = await fetch("/whisper_transcribe", {
            method: "POST",
            body: form
        });

        const data = await res.json();
        return data.text || "";
    } catch (err) {
        console.error("Whisper error:", err);
        return "";
    }
}