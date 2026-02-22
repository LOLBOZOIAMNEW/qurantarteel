async function whisperFallback(blob) {
    const formData = new FormData();
    formData.append("audio", blob, "recitation.webm");

    try {
        const res = await fetch("/whisper_fallback", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        return data.text || "";
    } catch (err) {
        console.error("Whisper fallback error:", err);
        return "";
    }
}