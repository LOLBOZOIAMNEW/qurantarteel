const letterNames = {
    "ا": ["alif", "alef"],
    "ل": ["lam", "laam"],
    "م": ["mim", "meem"],
    "ن": ["noon", "nun"],
    "ه": ["ha", "haa"],
    "ط": ["ta", "taa"],
    "س": ["seen", "sin"],
    "ي": ["ya", "yaa"],
    "ك": ["kaf", "kaaf"],
    "ع": ["ain", "ayn"],
    "ص": ["sad", "saad"],
    "ق": ["qaf", "qaaf"],
    "ر": ["ra", "raa"],
    "ح": ["ha", "haa"],
    "د": ["dal", "daal"],
    "ذ": ["thal", "zaal"],
    "ز": ["zay", "zai"],
    "و": ["waw", "waaw"],
    "ب": ["ba", "baa"],
    "ت": ["ta", "taa"],
    "ث": ["tha", "thaa"],
    "ج": ["jeem", "jim"],
    "خ": ["kha", "khaa"],
    "ض": ["dad", "daad"],
    "ظ": ["za", "zaa", "dha", "dhaa"],
    "غ": ["ghain", "ghayn"],
    "ف": ["fa", "faa"],
    "ش": ["sheen", "shin"]
};

const spokenLetterWords = {
    "ألف": "alif",
    "الف": "alif",
    "الِف": "alif",
    "لام": "lam",
    "ل": "lam",
    "لـ": "lam",
    "لَ": "lam",
    "لْ": "lam",
    "ميم": "mim",
    "مِيم": "mim"
};

function normalizeArabicJS(text) {
    if (!text) return "";
    return text
        .replace(/[^\u0600-\u06FF\s]/g, "")
        .replace(/[\u064B-\u065F\u0670]/g, "")
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي")
        .trim();
}

function isMuqattaat(text) {
    const clean = normalizeArabicJS(text).replace(/\s+/g, "");
    if (!clean) return false;
    return [...clean].every(ch => letterNames[ch]);
}

function convertSpokenWordsToLetterNames(text) {
    const words = text.split(/\s+/);
    const converted = [];

    words.forEach(w => {
        const clean = w.replace(/[^\u0600-\u06FF]/g, "");
        if (spokenLetterWords[clean]) {
            converted.push(spokenLetterWords[clean]);
        }
    });

    return converted.join(" ");
}

function normalizeArabicPhrase(text) {
    return text
        .replace(/[^\w\s]/g, "")
        .replace(/[ًٌٍَُِّْٰ]/g, "")
        .replace(/أ|إ|آ/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي")
        .trim();
}

function phraseSimilarity(a, b) {
    a = a.trim();
    b = b.trim();
    if (!a || !b) return 0;

    let longer = a.length > b.length ? a : b;
    let shorter = a.length > b.length ? b : a;

    let same = 0;
    for (let i = 0; i < shorter.length; i++) {
        if (shorter[i] === longer[i]) same++;
    }

    return same / longer.length;
}

function findBestPhraseMatch(ayahText, userSpeech) {
    const words = ayahText.split(" ");
    const normSpeech = normalizeArabicPhrase(userSpeech);

    let best = "";
    let bestScore = 0;

    for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j <= words.length; j++) {
            const phrase = words.slice(i, j).join(" ");
            const score = phraseSimilarity(
                normalizeArabicPhrase(phrase),
                normSpeech
            );

            if (score > bestScore) {
                bestScore = score;
                best = phrase;
            }
        }
    }

    return bestScore > 0.55 ? best : null;
}

function levenshtein(a, b) {
    if (!a || !b) return 999;

    const m = [];
    for (let i = 0; i <= b.length; i++) m[i] = [i];
    for (let j = 0; j <= a.length; j++) m[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            m[i][j] = Math.min(
                m[i - 1][j] + 1,
                m[i][j - 1] + 1,
                m[i - 1][j - 1] + (a[j - 1] === b[i - 1] ? 0 : 1)
            );
        }
    }

    return m[b.length][a.length];
}

function wordSimilarity(a, b) {
    const dist = levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length);
    return 1 - dist / maxLen;
}

function compareWords(refWords, userWords) {
    const results = [];
    let score = 0;

    const maxLen = Math.max(refWords.length, userWords.length);

    for (let i = 0; i < maxLen; i++) {
        const ref = refWords[i];
        const usr = userWords[i];

        if (!ref && usr) {
            results.push({ word: usr, class: "extra-word" });
            continue;
        }

        if (ref && !usr) {
            results.push({ word: ref, class: "wrong-word" });
            continue;
        }

        const sim = wordSimilarity(ref, usr);

        if (sim >= 0.85) {
            results.push({ word: ref, class: "correct-word" });
            score += 1;
        } else if (sim >= 0.60) {
            results.push({ word: ref, class: "close-word" });
            score += 0.6;
        } else {
            results.push({ word: ref, class: "wrong-word" });
        }
    }

    const finalScore = Math.round((score / refWords.length) * 100);
    return { results, finalScore };
}

function scoreRecitation(refText, userSpeech) {
    const refNorm = normalizeArabicJS(refText);

    let userRaw = userSpeech.toLowerCase();
    const converted = convertSpokenWordsToLetterNames(userRaw);
    if (converted.length > 0) userRaw = converted;

    if (isMuqattaat(refNorm)) {
        const letters = [...refNorm.replace(/\s+/g, "")];
        let correct = 0;

        letters.forEach(letter => {
            const names = letterNames[letter];
            if (names && names.some(n => userRaw.includes(n))) correct++;
        });

        const ratio = letters.length ? correct / letters.length : 0;
        const score = Math.round(ratio * 100);

        return {
            feedback: ratio >= 0.7
                ? "Correct recitation of the letter names."
                : "Incorrect letter-name recitation.",
            score: score,
            phrase: ""
        };
    }

    const phraseMatch = findBestPhraseMatch(refText, userRaw);

    const normUser = normalizeArabicJS(userRaw);
    const refWords = refNorm.split(/\s+/).filter(Boolean);
    const userWords = normUser.split(/\s+/).filter(Boolean);

    const { results, finalScore } = compareWords(refWords, userWords);

    let html = "";
    results.forEach(item => {
        html += `<span class="${item.class}">${item.word}</span> `;
    });

    return {
        feedback: html,
        score: finalScore,
        phrase: phraseMatch || ""
    };
}