function safeHTML(text) {
    if (!text) return "";
    return text.replace(/[&<>"']/g, m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    })[m]);
}

function clearElement(el) {
    if (el) el.innerHTML = "";
}

function setText(el, text) {
    if (el) el.textContent = text;
}

function byId(id) {
    return document.getElementById(id);
}

function toggleClass(el, className, condition) {
    if (!el) return;
    if (condition) el.classList.add(className);
    else el.classList.remove(className);
}

function smoothScrollTo(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}