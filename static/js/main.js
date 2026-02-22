let currentSurah = null;
let currentAyahIndex = 0;

let userSettings = {
    theme: "dark",
    reciter: 2,
    font_size: "normal",
    word_by_word: true,
    translation: true
};

async function loadSettings() {
    try {
        const res = await fetch("/get_settings");
        const data = await res.json();
        userSettings = data;

        applyTheme();
        applyFontSize();
        applyWordToggle();
        applyTranslationToggle();
        applySettingsUI();
    } catch (err) {
        console.error("Failed to load settings:", err);
    }
}

async function saveSettings() {
    try {
        await fetch("/save_settings", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(userSettings)
        });
    } catch (err) {
        console.error("Failed to save settings:", err);
    }
}

function applySettingsUI() {
    const themeToggle = document.getElementById("themeToggle");
    const reciterSelect = document.getElementById("settingsReciter");
    const fontToggle = document.getElementById("fontToggle");
    const wordToggle = document.getElementById("wordToggle");
    const translationToggle = document.getElementById("translationToggle");

    if (themeToggle) themeToggle.checked = (userSettings.theme === "light");
    if (reciterSelect) reciterSelect.value = userSettings.reciter;
    if (fontToggle) fontToggle.checked = (userSettings.font_size === "large");
    if (wordToggle) wordToggle.checked = userSettings.word_by_word;
    if (translationToggle) translationToggle.checked = userSettings.translation;
}

function applyTheme() {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(userSettings.theme);
}

function toggleTheme() {
    userSettings.theme = (userSettings.theme === "dark") ? "light" : "dark";
    applyTheme();
    saveSettings();
}

function applyFontSize() {
    document.body.classList.toggle("large-arabic", userSettings.font_size === "large");
}

function toggleFontSize() {
    userSettings.font_size = userSettings.font_size === "normal" ? "large" : "normal";
    applyFontSize();
    saveSettings();
}

function applyWordToggle() {
    document.body.classList.toggle("hide-words", !userSettings.word_by_word);
}

function toggleWords() {
    userSettings.word_by_word = !userSettings.word_by_word;
    applyWordToggle();
    saveSettings();
}

function applyTranslationToggle() {
    document.body.classList.toggle("hide-translation", !userSettings.translation);
}

function toggleTranslation() {
    userSettings.translation = !userSettings.translation;
    applyTranslationToggle();
    saveSettings();
}

function saveReciterPreference() {
    const select = document.getElementById("settingsReciter");
    if (!select) return;

    userSettings.reciter = parseInt(select.value);
    saveSettings();
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadSettings();

    if (document.getElementById("quran-page")) {
        initQuranPage();
    }

    if (document.getElementById("practice-page")) {
        initPracticePage();
    }
});