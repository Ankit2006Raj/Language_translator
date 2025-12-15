import { languages } from "./languages.js";
import {
  translationMemory,
  batchTranslator,
  languageDetector,
  alternativesGenerator,
  pronunciationGenerator,
  qualityScorer,
  translationComparator
} from "./advanced-features.js";

// DOM Elements
const dropdowns = document.querySelectorAll(".dropdown-container"),
  inputLanguageDropdown = document.querySelector("#input-language"),
  outputLanguageDropdown = document.querySelector("#output-language"),
  inputTextElem = document.querySelector("#input-text"),
  outputTextElem = document.querySelector("#output-text"),
  swapBtn = document.querySelector(".swap-position"),
  darkModeCheckbox = document.getElementById("dark-mode-btn"),
  voiceInputBtn = document.getElementById("voice-input-btn"),
  voiceOutputBtn = document.getElementById("voice-output-btn"),
  uploadDocument = document.querySelector("#upload-document"),
  uploadTitle = document.querySelector("#upload-title"),
  downloadBtn = document.querySelector("#download-btn"),
  copyBtn = document.getElementById("copy-btn"),
  favoriteBtn = document.getElementById("favorite-btn"),
  shareBtn = document.getElementById("share-btn"),
  clearInputBtn = document.getElementById("clear-input-btn"),
  historyToggleBtn = document.getElementById("history-toggle-btn"),
  historyPanel = document.getElementById("history-panel"),
  historyList = document.getElementById("history-list"),
  favoritesList = document.getElementById("favorites-list"),
  clearHistoryBtn = document.getElementById("clear-history"),
  historySearch = document.getElementById("history-search"),
  historyFilter = document.getElementById("history-filter"),
  historySort = document.getElementById("history-sort"),
  fullscreenBtn = document.getElementById("fullscreen-btn"),
  shortcutsBtn = document.getElementById("shortcuts-btn"),
  shortcutsModal = document.getElementById("shortcuts-modal"),
  toast = document.getElementById("toast"),
  loadingSpinner = document.getElementById("loading-spinner"),
  offlineIndicator = document.getElementById("offline-indicator"),
  charCount = document.getElementById("char-count"),
  wordCount = document.getElementById("word-count"),
  sentenceCount = document.getElementById("sentence-count"),
  historyCountBadge = document.getElementById("history-count"),
  recentLangList = document.getElementById("recent-lang-list"),
  memoryBtn = document.getElementById("memory-btn"),
  batchBtn = document.getElementById("batch-btn"),
  comparisonBtn = document.getElementById("comparison-btn"),
  alternativesBtn = document.getElementById("alternatives-btn"),
  memoryModal = document.getElementById("memory-modal"),
  batchModal = document.getElementById("batch-modal"),
  alternativesModal = document.getElementById("alternatives-modal"),
  comparisonModal = document.getElementById("comparison-modal"),
  translationInfo = document.getElementById("translation-info"),
  confidenceFill = document.getElementById("confidence-fill"),
  confidenceText = document.getElementById("confidence-text"),
  qualityStars = document.getElementById("quality-stars"),
  contextSelector = document.getElementById("context-selector"),
  pronunciationGuide = document.getElementById("pronunciation-guide"),
  pronunciationText = document.getElementById("pronunciation-text"),
  exportFormat = document.getElementById("export-format");

// State Management
let history = JSON.parse(localStorage.getItem("history")) || [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let recentLanguages = JSON.parse(localStorage.getItem("recentLanguages")) || [];
let currentTranslation = null;
let translationTimeout = null;
let rateLimitCount = 0;
let rateLimitResetTime = Date.now();

// Constants
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const TRANSLATION_DEBOUNCE = 800;

// Initialize App
function init() {
  populateDropdowns();
  loadDarkMode();
  loadRecentLanguages();
  renderHistory();
  renderFavorites();
  updateHistoryCount();
  setupEventListeners();
  checkOnlineStatus();
  registerServiceWorker();
}

// Populate Language Dropdowns with Search
function populateDropdowns() {
  dropdowns.forEach(dropdown => {
    const ul = dropdown.querySelector("ul");
    const searchInput = ul.querySelector(".lang-search");

    function renderLanguages(filter = "") {
      const items = ul.querySelectorAll(".option");
      items.forEach(item => item.remove());

      const filtered = languages.filter(lang =>
        lang.name.toLowerCase().includes(filter.toLowerCase()) ||
        lang.native.toLowerCase().includes(filter.toLowerCase()) ||
        lang.code.toLowerCase().includes(filter.toLowerCase())
      );

      filtered.forEach(opt => {
        const li = document.createElement("li");
        li.textContent = `${opt.name} (${opt.native})`;
        li.dataset.value = opt.code;
        li.classList.add("option");
        li.setAttribute("role", "option");

        if (localStorage.getItem(dropdown.id) === opt.code) {
          li.classList.add("active");
          dropdown.querySelector(".selected").textContent = li.textContent;
          dropdown.querySelector(".selected").dataset.value = opt.code;
        }
        ul.appendChild(li);
      });
    }

    renderLanguages();

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        renderLanguages(e.target.value);
      });
      searchInput.addEventListener("click", (e) => e.stopPropagation());
    }
  });
}

// Setup All Event Listeners
function setupEventListeners() {
  // Dropdown interactions
  dropdowns.forEach(drop => {
    const toggle = drop.querySelector(".dropdown-toggle");
    toggle.addEventListener("click", () => {
      dropdowns.forEach(d => { if (d !== drop) d.classList.remove("active"); });
      drop.classList.toggle("active");
      toggle.setAttribute("aria-expanded", drop.classList.contains("active"));
    });

    drop.addEventListener("click", (e) => {
      if (e.target.classList.contains("option")) {
        selectLanguage(drop, e.target);
      }
    });
  });

  document.addEventListener("click", e => {
    dropdowns.forEach(drop => {
      if (!drop.contains(e.target)) {
        drop.classList.remove("active");
        drop.querySelector(".dropdown-toggle").setAttribute("aria-expanded", "false");
      }
    });
  });

  // Translation
  inputTextElem.addEventListener("input", handleInputChange);

  // Actions
  swapBtn.addEventListener("click", swapLanguages);
  swapBtn.addEventListener("keypress", (e) => {
    if (e.key === "Enter" || e.key === " ") swapLanguages();
  });

  copyBtn.addEventListener("click", copyTranslation);
  favoriteBtn.addEventListener("click", toggleFavorite);
  shareBtn.addEventListener("click", shareTranslation);
  clearInputBtn.addEventListener("click", clearInput);

  // Voice
  voiceInputBtn.addEventListener("click", startVoiceInput);
  voiceOutputBtn.addEventListener("click", speakOutput);

  // File operations
  uploadDocument.addEventListener("change", handleFileUpload);
  downloadBtn.addEventListener("click", downloadTranslation);

  // History & Favorites
  historyToggleBtn.addEventListener("click", toggleHistoryPanel);
  document.querySelector(".panel-close").addEventListener("click", () => {
    historyPanel.classList.remove("active");
  });
  clearHistoryBtn.addEventListener("click", clearHistory);
  historySearch.addEventListener("input", filterHistory);
  historyFilter.addEventListener("change", filterHistory);
  historySort.addEventListener("change", filterHistory);

  // Tabs
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Dark mode
  darkModeCheckbox.addEventListener("change", toggleDarkMode);

  // Fullscreen
  fullscreenBtn.addEventListener("click", toggleFullscreen);

  // Shortcuts
  shortcutsBtn.addEventListener("click", () => showModal(shortcutsModal));

  // Advanced Features
  memoryBtn.addEventListener("click", openMemoryModal);
  batchBtn.addEventListener("click", openBatchModal);
  comparisonBtn.addEventListener("click", openComparisonModal);
  alternativesBtn.addEventListener("click", showAlternatives);
  contextSelector.addEventListener("change", handleContextChange);

  // Modal close buttons
  document.querySelectorAll(".modal-close").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const modal = e.target.closest(".modal");
      hideModal(modal);
    });
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeyboardShortcuts);

  // Online/Offline
  window.addEventListener("online", checkOnlineStatus);
  window.addEventListener("offline", checkOnlineStatus);
}

// Language Selection
function selectLanguage(dropdown, option) {
  dropdown.querySelectorAll(".option").forEach(o => o.classList.remove("active"));
  option.classList.add("active");
  const sel = dropdown.querySelector(".selected");
  sel.textContent = option.textContent;
  sel.dataset.value = option.dataset.value;
  localStorage.setItem(dropdown.id, option.dataset.value);
  dropdown.classList.remove("active");

  addToRecentLanguages(option.dataset.value, option.textContent);
  translate();
}

// Input Change Handler
function handleInputChange() {
  updateTextStats();

  clearTimeout(translationTimeout);
  translationTimeout = setTimeout(() => {
    translate();
  }, TRANSLATION_DEBOUNCE);
}

// Update Text Statistics
function updateTextStats() {
  const text = inputTextElem.value;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim()).length : 0;

  charCount.textContent = chars;
  wordCount.textContent = words;
  sentenceCount.textContent = sentences;

  if (chars > 5000) {
    inputTextElem.value = text.slice(0, 5000);
    showToast("Maximum 5000 characters allowed", "warning");
  }
}

// Translation Function with Rate Limiting
async function translate() {
  const text = inputTextElem.value.trim();
  if (!text) {
    outputTextElem.value = "";
    return;
  }

  // Rate limiting check
  if (!checkRateLimit()) {
    showToast("Too many requests. Please wait a moment.", "error");
    return;
  }

  const sl = inputLanguageDropdown.querySelector(".selected").dataset.value;
  const tl = outputLanguageDropdown.querySelector(".selected").dataset.value;

  try {
    showLoading(true);
    outputTextElem.value = "";

    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`
    );

    if (!res.ok) throw new Error("Translation failed");

    const json = await res.json();
    const output = json[0].map(a => a[0]).join("");
    outputTextElem.value = output;

    currentTranslation = {
      input: text,
      output: output,
      sourceLang: sl,
      targetLang: tl,
      sourceText: inputLanguageDropdown.querySelector(".selected").textContent,
      targetText: outputLanguageDropdown.querySelector(".selected").textContent,
      timestamp: new Date().toISOString()
    };

    // Add to translation memory
    translationMemory.addToMemory(text, output, sl, tl);

    // Show quality indicators
    showQualityIndicators(text, output, sl, tl);

    // Show pronunciation
    showPronunciation(output, tl);

    // Detect language confidence if auto-detect
    if (sl === "auto") {
      await showLanguageConfidence(text);
    }

    addToHistory(currentTranslation);

  } catch (err) {
    console.error("Translation error:", err);
    outputTextElem.value = "";
    showToast("Translation failed. Please try again.", "error");
    showRetryOption();
  } finally {
    showLoading(false);
  }
}

// Rate Limiting
function checkRateLimit() {
  const now = Date.now();
  if (now - rateLimitResetTime > RATE_LIMIT_WINDOW) {
    rateLimitCount = 0;
    rateLimitResetTime = now;
  }

  if (rateLimitCount >= RATE_LIMIT_MAX) {
    return false;
  }

  rateLimitCount++;
  return true;
}

// Show Loading State
function showLoading(show) {
  loadingSpinner.style.display = show ? "flex" : "none";
}

// Show Retry Option
function showRetryOption() {
  const retryBtn = document.createElement("button");
  retryBtn.textContent = "Retry";
  retryBtn.className = "retry-btn";
  retryBtn.onclick = () => {
    retryBtn.remove();
    translate();
  };
  outputTextElem.parentElement.appendChild(retryBtn);
  setTimeout(() => retryBtn.remove(), 5000);
}

// Copy Translation
async function copyTranslation() {
  const text = outputTextElem.value;
  if (!text) {
    showToast("Nothing to copy", "warning");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.querySelector("ion-icon").setAttribute("name", "checkmark-outline");
    showToast("Copied to clipboard!", "success");
    setTimeout(() => {
      copyBtn.querySelector("ion-icon").setAttribute("name", "copy-outline");
    }, 2000);
  } catch (err) {
    showToast("Failed to copy", "error");
  }
}

// Toggle Favorite
function toggleFavorite() {
  if (!currentTranslation) {
    showToast("No translation to save", "warning");
    return;
  }

  const icon = favoriteBtn.querySelector("ion-icon");
  const isFavorited = icon.getAttribute("name") === "heart";

  if (isFavorited) {
    favorites = favorites.filter(f =>
      f.input !== currentTranslation.input ||
      f.output !== currentTranslation.output
    );
    icon.setAttribute("name", "heart-outline");
    showToast("Removed from favorites", "info");
  } else {
    favorites.push({ ...currentTranslation, id: Date.now() });
    icon.setAttribute("name", "heart");
    showToast("Added to favorites!", "success");
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderFavorites();
}

// Share Translation
async function shareTranslation() {
  const text = outputTextElem.value;
  if (!text) {
    showToast("Nothing to share", "warning");
    return;
  }

  const shareData = {
    title: "Translation",
    text: `Original: ${inputTextElem.value}\n\nTranslation: ${text}`
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      showToast("Shared successfully!", "success");
    } catch (err) {
      if (err.name !== "AbortError") {
        copyTranslation();
      }
    }
  } else {
    copyTranslation();
  }
}

// Clear Input
function clearInput() {
  inputTextElem.value = "";
  outputTextElem.value = "";
  updateTextStats();
  inputTextElem.focus();
}

// Swap Languages
function swapLanguages() {
  const inputVal = inputLanguageDropdown.querySelector(".selected").dataset.value;
  const outputVal = outputLanguageDropdown.querySelector(".selected").dataset.value;
  const inputText = inputLanguageDropdown.querySelector(".selected").textContent;
  const outputText = outputLanguageDropdown.querySelector(".selected").textContent;

  if (inputVal === "auto") {
    showToast("Cannot swap with auto-detect", "warning");
    return;
  }

  inputLanguageDropdown.querySelector(".selected").dataset.value = outputVal;
  inputLanguageDropdown.querySelector(".selected").textContent = outputText;
  outputLanguageDropdown.querySelector(".selected").dataset.value = inputVal;
  outputLanguageDropdown.querySelector(".selected").textContent = inputText;

  localStorage.setItem("input-language", outputVal);
  localStorage.setItem("output-language", inputVal);

  const temp = inputTextElem.value;
  inputTextElem.value = outputTextElem.value;
  outputTextElem.value = temp;

  translate();
  showToast("Languages swapped!", "success");
}

// Voice Input
function startVoiceInput() {
  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    showToast("Voice input not supported", "error");
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  const lang = inputLanguageDropdown.querySelector(".selected").dataset.value;

  recognition.lang = lang === "auto" ? "en-US" : lang;
  recognition.continuous = false;
  recognition.interimResults = false;

  voiceInputBtn.classList.add("listening");
  voiceInputBtn.querySelector("ion-icon").setAttribute("name", "mic");

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    inputTextElem.value += (inputTextElem.value ? " " : "") + transcript;
    handleInputChange();
    showToast("Voice captured!", "success");
  };

  recognition.onerror = (e) => {
    showToast(`Voice error: ${e.error}`, "error");
  };

  recognition.onend = () => {
    voiceInputBtn.classList.remove("listening");
    voiceInputBtn.querySelector("ion-icon").setAttribute("name", "mic-outline");
  };

  recognition.start();
  showToast("Listening...", "info");
}

// Speak Output
function speakOutput() {
  const text = outputTextElem.value;
  if (!text) {
    showToast("Nothing to read", "warning");
    return;
  }

  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
    voiceOutputBtn.querySelector("ion-icon").setAttribute("name", "volume-high-outline");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const lang = outputLanguageDropdown.querySelector(".selected").dataset.value;
  utterance.lang = lang;
  utterance.rate = 0.9;
  utterance.pitch = 1;

  voiceOutputBtn.querySelector("ion-icon").setAttribute("name", "stop-outline");

  utterance.onend = () => {
    voiceOutputBtn.querySelector("ion-icon").setAttribute("name", "volume-high-outline");
  };

  speechSynthesis.speak(utterance);
  showToast("Reading aloud...", "info");
}

// File Upload with PDF/DOCX Support
async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  uploadTitle.textContent = file.name;

  try {
    let text = "";

    if (file.type === "text/plain") {
      text = await file.text();
    } else if (file.type === "application/pdf") {
      showToast("PDF support requires additional library", "warning");
      return;
    } else if (file.type.includes("word")) {
      showToast("DOCX support requires additional library", "warning");
      return;
    } else {
      showToast("Unsupported file type. Use .txt files.", "error");
      return;
    }

    inputTextElem.value = text;
    handleInputChange();
    showToast("File loaded successfully!", "success");
  } catch (err) {
    showToast("Failed to read file", "error");
  }
}

// Download Translation
function downloadTranslation() {
  const text = outputTextElem.value;
  if (!text) {
    showToast("Nothing to download", "warning");
    return;
  }

  const lang = outputLanguageDropdown.querySelector(".selected").dataset.value;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `translation-${lang}-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Downloaded!", "success");
}

// History Management
function addToHistory(translation) {
  history.unshift(translation);
  if (history.length > 100) history = history.slice(0, 100);
  localStorage.setItem("history", JSON.stringify(history));
  renderHistory();
  updateHistoryCount();
}

function renderHistory() {
  historyList.innerHTML = "";
  const filtered = getFilteredHistory();

  if (filtered.length === 0) {
    historyList.innerHTML = '<li class="empty-state">No history yet</li>';
    return;
  }

  filtered.forEach((item, index) => {
    const li = createHistoryItem(item, index, false);
    historyList.appendChild(li);
  });
}

function getFilteredHistory() {
  let filtered = [...history];

  const searchTerm = historySearch.value.toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(item =>
      item.input.toLowerCase().includes(searchTerm) ||
      item.output.toLowerCase().includes(searchTerm)
    );
  }

  const filterLang = historyFilter.value;
  if (filterLang !== "all") {
    filtered = filtered.filter(item =>
      item.sourceLang === filterLang || item.targetLang === filterLang
    );
  }

  const sortOrder = historySort.value;
  if (sortOrder === "oldest") {
    filtered.reverse();
  }

  return filtered;
}

function createHistoryItem(item, index, isFavorite) {
  const li = document.createElement("li");
  li.className = "history-item";
  li.innerHTML = `
    <div class="history-content">
      <div class="history-langs">
        <span class="lang-badge">${item.sourceText?.split("(")[0].trim() || item.sourceLang}</span>
        <ion-icon name="arrow-forward-outline"></ion-icon>
        <span class="lang-badge">${item.targetText?.split("(")[0].trim() || item.targetLang}</span>
      </div>
      <div class="history-text">
        <p class="history-input">${truncate(item.input, 50)}</p>
        <p class="history-output">${truncate(item.output, 50)}</p>
      </div>
      <div class="history-time">${formatTime(item.timestamp)}</div>
    </div>
    <div class="history-actions">
      <button class="history-action-btn" onclick="window.restoreTranslation(${index}, ${isFavorite})" title="Restore">
        <ion-icon name="refresh-outline"></ion-icon>
      </button>
      <button class="history-action-btn" onclick="window.deleteHistoryItem(${index}, ${isFavorite})" title="Delete">
        <ion-icon name="trash-outline"></ion-icon>
      </button>
    </div>
  `;
  return li;
}

function renderFavorites() {
  favoritesList.innerHTML = "";
  const emptyState = document.getElementById("favorites-empty");

  if (favorites.length === 0) {
    emptyState.style.display = "flex";
    return;
  }

  emptyState.style.display = "none";
  favorites.forEach((item, index) => {
    const li = createHistoryItem(item, index, true);
    favoritesList.appendChild(li);
  });
}

window.restoreTranslation = function (index, isFavorite) {
  const item = isFavorite ? favorites[index] : history[index];
  inputTextElem.value = item.input;
  outputTextElem.value = item.output;

  inputLanguageDropdown.querySelector(".selected").dataset.value = item.sourceLang;
  inputLanguageDropdown.querySelector(".selected").textContent = item.sourceText;
  outputLanguageDropdown.querySelector(".selected").dataset.value = item.targetLang;
  outputLanguageDropdown.querySelector(".selected").textContent = item.targetText;

  updateTextStats();
  showToast("Translation restored!", "success");
  historyPanel.classList.remove("active");
};

window.deleteHistoryItem = function (index, isFavorite) {
  if (isFavorite) {
    favorites.splice(index, 1);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    renderFavorites();
  } else {
    history.splice(index, 1);
    localStorage.setItem("history", JSON.stringify(history));
    renderHistory();
    updateHistoryCount();
  }
  showToast("Deleted!", "success");
};

function clearHistory() {
  if (!confirm("Clear all history?")) return;
  history = [];
  localStorage.setItem("history", JSON.stringify(history));
  renderHistory();
  updateHistoryCount();
  showToast("History cleared!", "success");
}

function filterHistory() {
  renderHistory();
}

function updateHistoryCount() {
  historyCountBadge.textContent = history.length;
}

// Recent Languages
function addToRecentLanguages(code, text) {
  const existing = recentLanguages.findIndex(l => l.code === code);
  if (existing !== -1) {
    recentLanguages.splice(existing, 1);
  }
  recentLanguages.unshift({ code, text });
  recentLanguages = recentLanguages.slice(0, 5);
  localStorage.setItem("recentLanguages", JSON.stringify(recentLanguages));
  loadRecentLanguages();
}

function loadRecentLanguages() {
  recentLangList.innerHTML = "";
  recentLanguages.forEach(lang => {
    const btn = document.createElement("button");
    btn.className = "recent-lang-btn";
    btn.textContent = lang.text.split("(")[0].trim();
    btn.onclick = () => {
      outputLanguageDropdown.querySelector(".selected").dataset.value = lang.code;
      outputLanguageDropdown.querySelector(".selected").textContent = lang.text;
      translate();
    };
    recentLangList.appendChild(btn);
  });
}

// Panel & Modal Management
function toggleHistoryPanel() {
  historyPanel.classList.toggle("active");
}

function switchTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  document.querySelectorAll(".tab-content").forEach(content => {
    content.classList.toggle("active", content.id === `${tabName}-tab`);
  });
}

function showModal(modal) {
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

function hideModal(modal) {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

// Dark Mode
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", darkModeCheckbox.checked);
}

function loadDarkMode() {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
    darkModeCheckbox.checked = true;
  }
}

// Fullscreen
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    fullscreenBtn.querySelector("ion-icon").setAttribute("name", "contract-outline");
  } else {
    document.exitFullscreen();
    fullscreenBtn.querySelector("ion-icon").setAttribute("name", "expand-outline");
  }
}

// Keyboard Shortcuts
function handleKeyboardShortcuts(e) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case "enter":
        e.preventDefault();
        translate();
        break;
      case "s":
        e.preventDefault();
        swapLanguages();
        break;
      case "c":
        if (document.activeElement !== inputTextElem) {
          e.preventDefault();
          copyTranslation();
        }
        break;
      case "d":
        e.preventDefault();
        downloadTranslation();
        break;
      case "h":
        e.preventDefault();
        toggleHistoryPanel();
        break;
      case "f":
        e.preventDefault();
        toggleFullscreen();
        break;
      case "/":
        e.preventDefault();
        showModal(shortcutsModal);
        break;
    }
  } else if (e.key === "Escape") {
    hideModal(shortcutsModal);
    historyPanel.classList.remove("active");
  }
}

// Toast Notifications
function showToast(message, type = "info") {
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Online/Offline Status
function checkOnlineStatus() {
  if (navigator.onLine) {
    offlineIndicator.style.display = "none";
  } else {
    offlineIndicator.style.display = "flex";
  }
}

// Service Worker Registration
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(err => {
      console.log("Service Worker registration failed:", err);
    });
  }
}

// Utility Functions
function truncate(str, length) {
  return str.length > length ? str.substring(0, length) + "..." : str;
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

// Populate filter dropdown with languages
function populateFilterDropdown() {
  const uniqueLangs = [...new Set(history.map(h => h.sourceLang).concat(history.map(h => h.targetLang)))];
  uniqueLangs.forEach(code => {
    const lang = languages.find(l => l.code === code);
    if (lang) {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = lang.name;
      historyFilter.appendChild(option);
    }
  });
}

// Advanced Features Functions

// Quality Indicators
function showQualityIndicators(original, translation, sourceLang, targetLang) {
  const score = qualityScorer.scoreTranslation(original, translation, sourceLang, targetLang);
  const stars = qualityScorer.getStars(score);

  confidenceFill.style.width = `${score}%`;
  confidenceText.textContent = `${score}%`;

  qualityStars.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const star = document.createElement('ion-icon');
    star.setAttribute('name', i < stars ? 'star' : 'star-outline');
    qualityStars.appendChild(star);
  }

  translationInfo.style.display = 'block';
}

// Pronunciation Guide
function showPronunciation(text, language) {
  const pronunciation = pronunciationGenerator.generatePronunciation(text, language);
  pronunciationText.textContent = pronunciation;
  pronunciationGuide.style.display = 'block';
}

// Language Detection Confidence
async function showLanguageConfidence(text) {
  const detection = await languageDetector.detectLanguage(text);
  confidenceFill.style.width = `${detection.confidence}%`;
  confidenceText.textContent = `${detection.confidence}% (${detection.languageName})`;
  translationInfo.style.display = 'block';
}

// Context Change Handler
async function handleContextChange() {
  const context = contextSelector.value;
  showToast(`Context changed to: ${context}`, "info");
  // Re-translate with context (in production, pass context to API)
  if (inputTextElem.value) {
    translate();
  }
}

// Translation Memory Modal
function openMemoryModal() {
  renderMemoryList();
  renderGlossaryList();
  showModal(memoryModal);

  // Setup memory tab switching
  document.querySelectorAll(".memory-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".memory-tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".memory-tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`${btn.dataset.tab}-content`).classList.add("active");
    });
  });

  // Add glossary entry
  document.getElementById("add-glossary-btn").addEventListener("click", () => {
    const term = document.getElementById("glossary-term").value;
    const translation = document.getElementById("glossary-translation").value;
    const sl = inputLanguageDropdown.querySelector(".selected").dataset.value;
    const tl = outputLanguageDropdown.querySelector(".selected").dataset.value;

    if (term && translation) {
      translationMemory.addToGlossary(term, translation, sl, tl);
      renderGlossaryList();
      document.getElementById("glossary-term").value = "";
      document.getElementById("glossary-translation").value = "";
      showToast("Added to glossary!", "success");
    }
  });
}

function renderMemoryList() {
  const memoryList = document.getElementById("memory-list");
  memoryList.innerHTML = "";

  const memories = translationMemory.memory.slice(0, 50);

  if (memories.length === 0) {
    memoryList.innerHTML = '<li class="empty-state">No translation memory yet</li>';
    return;
  }

  memories.forEach(mem => {
    const li = document.createElement("li");
    li.className = "memory-item";
    li.innerHTML = `
      <div class="memory-content">
        <p class="memory-source">${truncate(mem.source, 60)}</p>
        <p class="memory-target">${truncate(mem.target, 60)}</p>
        <div class="memory-meta">
          <span>Used ${mem.frequency}x</span>
          <span>${formatTime(mem.lastUsed)}</span>
        </div>
      </div>
      <button class="memory-use-btn" onclick="window.useMemory('${mem.source.replace(/'/g, "\\'")}', '${mem.target.replace(/'/g, "\\'")}')">
        <ion-icon name="arrow-forward-outline"></ion-icon>
      </button>
    `;
    memoryList.appendChild(li);
  });
}

function renderGlossaryList() {
  const glossaryList = document.getElementById("glossary-list");
  glossaryList.innerHTML = "";

  const glossary = translationMemory.glossary;

  if (glossary.length === 0) {
    glossaryList.innerHTML = '<li class="empty-state">No glossary entries yet</li>';
    return;
  }

  glossary.forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = "memory-item";
    li.innerHTML = `
      <div class="memory-content">
        <p class="memory-source"><strong>${entry.term}</strong></p>
        <p class="memory-target">${entry.translation}</p>
      </div>
      <button class="memory-delete-btn" onclick="window.deleteGlossary(${index})">
        <ion-icon name="trash-outline"></ion-icon>
      </button>
    `;
    glossaryList.appendChild(li);
  });
}

window.useMemory = function (source, target) {
  inputTextElem.value = source;
  outputTextElem.value = target;
  hideModal(memoryModal);
  showToast("Memory restored!", "success");
};

window.deleteGlossary = function (index) {
  translationMemory.glossary.splice(index, 1);
  translationMemory.save();
  renderGlossaryList();
  showToast("Deleted from glossary", "success");
};

// Batch Translation Modal
function openBatchModal() {
  showModal(batchModal);

  document.getElementById("start-batch-btn").addEventListener("click", async () => {
    const batchInput = document.getElementById("batch-input").value;
    const texts = batchInput.split('\n').filter(t => t.trim());

    if (texts.length === 0) {
      showToast("Please enter texts to translate", "warning");
      return;
    }

    const sl = inputLanguageDropdown.querySelector(".selected").dataset.value;
    const tl = outputLanguageDropdown.querySelector(".selected").dataset.value;

    batchTranslator.addToQueue(texts, sl, tl);

    const progressBar = document.querySelector(".progress-fill");
    const progressText = document.querySelector(".progress-text");
    const batchResults = document.getElementById("batch-results");

    document.getElementById("batch-progress").style.display = "block";
    batchResults.innerHTML = "";

    await batchTranslator.processQueue(
      (current, total) => {
        const percent = (current / total) * 100;
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${current} / ${total}`;
      },
      (results) => {
        results.forEach(result => {
          const li = document.createElement("li");
          li.className = `batch-result-item ${result.status}`;
          li.innerHTML = `
            <div class="batch-original">${truncate(result.text, 50)}</div>
            <div class="batch-translation">${result.result || 'Failed'}</div>
            <div class="batch-status">${result.status}</div>
          `;
          batchResults.appendChild(li);
        });
        showToast("Batch translation completed!", "success");
      }
    );
  });

  document.getElementById("export-batch-btn").addEventListener("click", () => {
    const format = exportFormat.value;
    const data = batchTranslator.exportResults(format);

    const blob = new Blob([data], {
      type: format === 'json' ? 'application/json' : 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch-translation.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Batch results exported!", "success");
  });
}

// Alternatives Modal
async function showAlternatives() {
  const text = inputTextElem.value.trim();
  if (!text) {
    showToast("Enter text first", "warning");
    return;
  }

  const sl = inputLanguageDropdown.querySelector(".selected").dataset.value;
  const tl = outputLanguageDropdown.querySelector(".selected").dataset.value;

  showModal(alternativesModal);

  const alternativesList = document.getElementById("alternatives-list");
  alternativesList.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><span>Generating alternatives...</span></div>';

  const alternatives = await alternativesGenerator.generateAlternatives(text, sl, tl);

  alternativesList.innerHTML = "";
  alternatives.forEach((alt, index) => {
    const div = document.createElement("div");
    div.className = "alternative-item";
    div.innerHTML = `
      <div class="alternative-header">
        <span class="alternative-method">${alt.method}</span>
        <span class="alternative-confidence">${alt.confidence}%</span>
      </div>
      <div class="alternative-text">${alt.text}</div>
      <button class="alternative-use-btn" onclick="window.useAlternative('${alt.text.replace(/'/g, "\\'")}')">
        Use This
      </button>
    `;
    alternativesList.appendChild(div);
  });
}

window.useAlternative = function (text) {
  outputTextElem.value = text;
  hideModal(alternativesModal);
  showToast("Alternative selected!", "success");
};

// Comparison Modal
async function openComparisonModal() {
  const text = inputTextElem.value.trim();
  if (!text) {
    showToast("Enter text first", "warning");
    return;
  }

  const sl = inputLanguageDropdown.querySelector(".selected").dataset.value;
  const tl = outputLanguageDropdown.querySelector(".selected").dataset.value;

  showModal(comparisonModal);

  const comparisonGrid = document.getElementById("comparison-grid");
  comparisonGrid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><span>Comparing translations...</span></div>';

  const comparisons = await translationComparator.compareTranslations(text, sl, tl);

  comparisonGrid.innerHTML = "";
  comparisons.forEach(comp => {
    const div = document.createElement("div");
    div.className = "comparison-item";
    div.innerHTML = `
      <div class="comparison-header">
        <h3>${comp.engine}</h3>
        <span class="comparison-confidence">${comp.confidence}%</span>
      </div>
      <div class="comparison-text">${comp.translation}</div>
      <button class="comparison-use-btn" onclick="window.useComparison('${comp.translation.replace(/'/g, "\\'")}')">
        Use This
      </button>
    `;
    comparisonGrid.appendChild(div);
  });
}

window.useComparison = function (text) {
  outputTextElem.value = text;
  hideModal(comparisonModal);
  showToast("Translation selected!", "success");
};

// Enhanced Download with Multiple Formats
const originalDownload = downloadTranslation;
downloadTranslation = function () {
  const text = outputTextElem.value;
  if (!text) {
    showToast("Nothing to download", "warning");
    return;
  }

  const format = exportFormat.value;
  const lang = outputLanguageDropdown.querySelector(".selected").dataset.value;
  let content, mimeType, extension;

  switch (format) {
    case 'json':
      content = JSON.stringify({
        original: inputTextElem.value,
        translation: text,
        sourceLang: inputLanguageDropdown.querySelector(".selected").dataset.value,
        targetLang: lang,
        timestamp: new Date().toISOString()
      }, null, 2);
      mimeType = 'application/json';
      extension = 'json';
      break;
    case 'csv':
      content = `"Original","Translation"\n"${inputTextElem.value.replace(/"/g, '""')}","${text.replace(/"/g, '""')}"`;
      mimeType = 'text/csv';
      extension = 'csv';
      break;
    case 'xlsx':
      content = `Original\tTranslation\n${inputTextElem.value}\t${text}`;
      mimeType = 'application/vnd.ms-excel';
      extension = 'xlsx';
      break;
    default:
      content = text;
      mimeType = 'text/plain';
      extension = 'txt';
  }

  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `translation-${lang}-${Date.now()}.${extension}`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Downloaded!", "success");
};

// Initialize on load
init();
populateFilterDropdown();
