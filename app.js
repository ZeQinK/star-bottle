/* 
   Star Bottle - Premium Interaction Script 
   Core Logic, State Management, Particle Canvas, and Animations
*/

// ==================== SEED / DEFAULT DATA ====================
const DEFAULT_NOTES = [
  {
    id: "seed-1",
    text: "My favorite place in the entire world is next to you. You are my safe haven, my peace, and my greatest adventure. I love you so much! ❤️",
    shape: "card",
    color: "#ffccd5", // Soft Pink
    pattern: "hearts",
    emojiTheme: "hearts",
    createdAt: Date.now() - 50000
  },
  {
    id: "seed-2",
    text: "Just a gentle reminder that you are doing incredibly well. Don't stress too much, my handsome boy. I am always right here, cheering you on! ✨🌸",
    shape: "scalloped",
    color: "#e2e2ff", // Lilac
    pattern: "dotted",
    emojiTheme: "flowers",
    createdAt: Date.now() - 40000
  },
  {
    id: "seed-3",
    text: "Can't wait for our next cozy date night! Coffee, chocolate cookies, cozy movie marathon, and endless warm cuddles. You + Me = Perfection. ☕🍪🧸",
    shape: "scroll",
    color: "#ffead2", // Warm Peach
    pattern: "grid",
    emojiTheme: "cafe",
    createdAt: Date.now() - 30000
  },
  {
    id: "seed-4",
    text: "You make my heart skip a beat every single time you smile or hold my hand. I love you to the moon and back, through every galaxy! 🌌🌙✨",
    shape: "heart",
    color: "#d8f3dc", // Mint Green
    pattern: "stripes",
    emojiTheme: "space",
    createdAt: Date.now() - 20000
  },
  {
    id: "seed-5",
    text: "Thank you for always being my rock, listening to my silly stories, and loving me for exactly who I am. You make my life a beautiful dream. 🧸🐾💕",
    shape: "scalloped",
    color: "#fefae0", // Lemon Custard
    pattern: "plain",
    emojiTheme: "cats",
    createdAt: Date.now() - 10000
  }
];

const EMOJI_DECORATIONS = {
  hearts: { top: "💖 ✨ 💖", bottom: "💖 ✨ 💖" },
  flowers: { top: "🌸 🍃 🌸", bottom: "🌸 🍃 🌸" },
  space: { top: "🌌 🌙 🌌", bottom: "🌌 🌙 🌌" },
  cafe: { top: "☕ 🍪 ☕", bottom: "☕ 🍪 ☕" },
  cats: { top: "🧸 🐾 🧸", bottom: "🧸 🐾 🧸" }
};

const PASTEL_COLORS = [
  { value: "#ffccd5", name: "Soft Pink" },
  { value: "#e2e2ff", name: "Lilac Violet" },
  { value: "#ffead2", name: "Warm Peach" },
  { value: "#d8f3dc", name: "Mint Green" },
  { value: "#fefae0", name: "Custard Yellow" },
  { value: "#f3c4fb", name: "Sweet Lavender" }
];

// ==================== APP STATE ====================
let notes = [];
let readLimitState = {
  date: "",
  openedIds: []
};
let isNightMode = false;
let activeSelectedColor = PASTEL_COLORS[0].value;

// ==================== BOTTLE ID / URL ROUTING ====================
// Generates a fun random bottle name like "cozy-rose-4821"
const BOTTLE_ADJECTIVES = ["cozy", "sweet", "magic", "starry", "dreamy", "golden", "velvet", "lunar", "rosy"];
const BOTTLE_NOUNS      = ["rose", "moon", "star", "heart", "wish", "dream", "cloud", "spark", "dawn"];

function generateBottleId() {
  const adj  = BOTTLE_ADJECTIVES[Math.floor(Math.random() * BOTTLE_ADJECTIVES.length)];
  const noun = BOTTLE_NOUNS[Math.floor(Math.random() * BOTTLE_NOUNS.length)];
  const num  = Math.floor(1000 + Math.random() * 9000);
  return `${adj}-${noun}-${num}`;
}

function getBottleId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("bottle") || null;
}

function setBottleId(id) {
  const url = new URL(window.location.href);
  url.searchParams.set("bottle", id);
  window.history.replaceState({}, "", url.toString());
}

function getShareableUrl() {
  const id  = getBottleId();
  const url = new URL(window.location.href);
  url.searchParams.set("bottle", id);
  // Strip any extra params, keep clean
  return `${url.origin}${url.pathname}?bottle=${id}`;
}

// Determine if we are running on Vercel (i.e. cloud API available)
function isCloudAvailable() {
  // When hosted on Vercel the origin will NOT be file:// or localhost
  const { protocol, hostname } = window.location;
  if (protocol === "file:") return false;
  if (hostname === "localhost" || hostname === "127.0.0.1") return false;
  return true;
}

let cloudSyncEnabled = false; // updated after first successful API call

// Star Bottle SVG Polygon Bounding Coordinates (to clip stars within the star shape outline)
const BOTTLE_STAR_POLYGON = [
  [200, 130], // Top peak
  [230, 200], 
  [305, 200], // Right peak
  [245, 250], 
  [270, 325], // Bottom right peak
  [200, 280], // Inner bottom dip
  [130, 325], // Bottom left peak
  [155, 250], 
  [95, 200],  // Left peak
  [170, 200]
];

// ==================== DOM ELEMENTS ====================
const themeToggleBtn = document.getElementById("theme-toggle");
const themeStatusEl = document.getElementById("theme-status");
const bottleGlowEl = document.getElementById("bottle-glow");
const starBottleSvg = document.getElementById("star-bottle-svg");
const starsContainerG = document.getElementById("stars-container-g");
const counterStarsEl = document.getElementById("counter-stars");

// Modals
const passcodeModal = document.getElementById("passcode-modal");
const passcodeIn = document.getElementById("passcode-input");
const passcodeError = document.getElementById("passcode-error");
const passcodeSubmitBtn = document.getElementById("passcode-submit-btn");
const secretKeyBtn = document.getElementById("secret-key-btn");
const closePasscodeBtn = document.getElementById("close-passcode-btn");

const noteReaderModal = document.getElementById("note-reader-modal");
const activeNotePaper = document.getElementById("active-note-paper");
const noteDisplayText = document.getElementById("note-display-text");
const noteDecorTop = document.getElementById("note-decor-top");
const noteDecorBottom = document.getElementById("note-decor-bottom");
const closeReaderBtn = document.getElementById("close-reader-btn");
const readerOkBtn = document.getElementById("reader-ok-btn");
const readerSparkleCanvas = document.getElementById("reader-sparkle-canvas");

const limitModal = document.getElementById("limit-modal");
const limitCloseBtn = document.getElementById("limit-close-btn");

const writerDeskModal = document.getElementById("writer-desk-modal");
const closeWriterBtn = document.getElementById("close-writer-btn");
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// Writing Form & Previews
const noteForm = document.getElementById("note-form");
const noteContentIn = document.getElementById("note-content");
const colorPickerContainer = document.getElementById("color-picker-container");
const paperShapeSel = document.getElementById("paper-shape");
const paperPatternSel = document.getElementById("paper-pattern");
const emojiThemeSel = document.getElementById("emoji-theme");
const saveNoteBtn = document.getElementById("save-note-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const editNoteIdIn = document.getElementById("edit-note-id");

// Preview Elements
const previewNotePaper = document.getElementById("preview-note-paper");
const previewDisplayText = document.getElementById("preview-display-text");
const previewDecorTop = document.getElementById("preview-decor-top");
const previewDecorBottom = document.getElementById("preview-decor-bottom");

// Manage Tab
const starTotalCountEl = document.getElementById("star-total-count");
const notesListContainer = document.getElementById("notes-list-container");
const devResetBtn = document.getElementById("dev-reset-btn");

// Canvas
const particleCanvas = document.getElementById("particle-canvas");

// ==================== THEME MANAGEMENT ====================
function initTheme() {
  const currentHour = new Date().getHours();
  // Glow from 6:00 PM (18) to 7:00 AM (7)
  const isNightTime = currentHour >= 18 || currentHour < 7;
  setTheme(isNightTime);
}

function setTheme(night) {
  isNightMode = night;
  if (isNightMode) {
    document.body.classList.add("night-mode");
    themeToggleBtn.querySelector(".theme-icon").textContent = "🌙";
    themeStatusEl.textContent = "It's magical night... 🌌✨";
    startParticles();
  } else {
    document.body.classList.remove("night-mode");
    themeToggleBtn.querySelector(".theme-icon").textContent = "☀️";
    themeStatusEl.textContent = "It's cozy daytime... 🧸";
    stopParticles();
  }
}

// Dev Theme Switch Override
themeToggleBtn.addEventListener("click", () => {
  setTheme(!isNightMode);
});

// ==================== STATE MANAGEMENT ====================

// localStorage key helpers — scoped per bottle so different bottles don't bleed
function lsNotesKey()  { return `star_bottle_notes__${getBottleId()}`; }
function lsLimitKey()  { return `star_bottle_limit__${getBottleId()}`; }

async function loadState() {
  // 1 — Ensure a bottle ID exists in the URL
  let bottleId = getBottleId();
  if (!bottleId) {
    // Check if there's a legacy local bottle to migrate
    const legacyNotes = localStorage.getItem("star_bottle_notes");
    bottleId = generateBottleId();
    setBottleId(bottleId);
    if (legacyNotes) {
      // Migrate legacy notes to the new scoped key
      localStorage.setItem(lsNotesKey(), legacyNotes);
      localStorage.removeItem("star_bottle_notes");
    }
  }

  // 2 — Try to load notes from cloud, fall back to localStorage
  if (isCloudAvailable()) {
    await loadFromCloud();
  } else {
    loadFromLocal();
    setCloudStatus("local", "Local mode (not deployed)");
  }

  // 3 — Load read limit (always local — per device/person)
  const savedLimit = localStorage.getItem(lsLimitKey());
  if (savedLimit) {
    readLimitState = JSON.parse(savedLimit);
  } else {
    readLimitState = { date: getTodayString(), openedIds: [] };
  }

  const todayStr = getTodayString();
  if (readLimitState.date !== todayStr) {
    readLimitState.date = todayStr;
    readLimitState.openedIds = [];
    saveLimitState();
  }

  updateUI();
  updateLinkTab();
}

function loadFromLocal() {
  const saved = localStorage.getItem(lsNotesKey());
  if (saved) {
    notes = JSON.parse(saved);
  } else {
    notes = [...DEFAULT_NOTES];
    localStorage.setItem(lsNotesKey(), JSON.stringify(notes));
  }
}

async function loadFromCloud() {
  setCloudStatus("connecting", "Connecting to cloud...");
  try {
    const bottleId = getBottleId();
    const res = await fetch(`/api/notes?bottle=${encodeURIComponent(bottleId)}`);
    const data = await res.json();

    if (
      data.code === "KV_NOT_CONFIGURED" ||
      data.code === "EDGE_CONFIG_NOT_CONFIGURED" ||
      data.code === "VERCEL_TOKEN_MISSING"
    ) {
      // Cloud not yet configured — fall back gracefully to local storage
      loadFromLocal();
      setCloudStatus("local", "Cloud not configured — using local storage", true);
      return;
    }

    if (!res.ok) throw new Error(data.error || "Unknown API error");

    cloudSyncEnabled = true;

    if (data.notes && data.notes.length > 0) {
      notes = data.notes;
      // Mirror to local as cache
      localStorage.setItem(lsNotesKey(), JSON.stringify(notes));
    } else {
      // Cloud is empty — seed with local (if any) or defaults
      const localCache = localStorage.getItem(lsNotesKey());
      notes = localCache ? JSON.parse(localCache) : [...DEFAULT_NOTES];
      // Push up to cloud immediately
      await pushToCloud();
    }

    setCloudStatus("connected", "✅ Cloud synced — sharing is live!");
  } catch (err) {
    console.warn("Cloud load failed, falling back to local:", err);
    loadFromLocal();
    setCloudStatus("error", "Cloud unavailable — using local storage");
  }
}

async function pushToCloud() {
  if (!cloudSyncEnabled) return;
  try {
    const bottleId = getBottleId();
    await fetch(`/api/notes?bottle=${encodeURIComponent(bottleId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes })
    });
  } catch (err) {
    console.warn("Cloud push failed:", err);
  }
}

async function saveNotesState() {
  // Always persist locally as cache
  localStorage.setItem(lsNotesKey(), JSON.stringify(notes));
  // Also push to cloud if available
  await pushToCloud();
  updateUI();
}

function saveLimitState() {
  localStorage.setItem(lsLimitKey(), JSON.stringify(readLimitState));
  updateLimitUI();
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ==================== CLOUD STATUS UI ====================
function setCloudStatus(state, label, showSetup = false) {
  const dot   = document.getElementById("cloud-dot");
  const lbl   = document.getElementById("cloud-label");
  const syncDesc  = document.getElementById("sync-status-desc");
  const syncIcon  = document.getElementById("sync-status-icon");
  const setupSteps = document.getElementById("setup-steps");

  // Map states
  const stateMap = {
    connected:   { cls: "connected", icon: "✅" },
    local:       { cls: "local",     icon: "💾" },
    error:       { cls: "error",     icon: "⚠️" },
    connecting:  { cls: "",          icon: "☁️" }
  };
  const cfg = stateMap[state] || stateMap.connecting;

  if (dot) { dot.className = `cloud-dot ${cfg.cls}`; }
  if (lbl) { lbl.textContent = label; }
  if (syncDesc) { syncDesc.textContent = label; }
  if (syncIcon) { syncIcon.textContent = cfg.icon; }
  if (setupSteps) { setupSteps.style.display = showSetup ? "block" : "none"; }
}

// ==================== LINK TAB UI ====================
function updateLinkTab() {
  const bottleId = getBottleId();
  const shareableUrl = getShareableUrl();

  const idDisplay   = document.getElementById("bottle-id-display");
  const linkDisplay = document.getElementById("shareable-link-display");

  if (idDisplay)   idDisplay.textContent   = bottleId || "";
  if (linkDisplay) linkDisplay.value       = shareableUrl;
}

// ==================== UI RENDERING ====================
function updateUI() {
  renderBottleStars();
  updateLimitUI();
  renderManageList();
  
  // Update totals
  starTotalCountEl.textContent = notes.length;
  
  const mainStarCountEl = document.getElementById("main-star-count");
  if (mainStarCountEl) {
    mainStarCountEl.textContent = notes.length;
  }
}

function updateLimitUI() {
  const readCount = readLimitState.openedIds.length;
  const starsArr = counterStarsEl.querySelectorAll(".mini-star");
  
  starsArr.forEach((star, idx) => {
    if (idx < readCount) {
      star.className = "mini-star filled";
      star.textContent = "★";
    } else {
      star.className = "mini-star empty";
      star.textContent = "☆";
    }
  });
}

// Point-in-Polygon validation to keep stars strictly within the star bottle body outline
function isPointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
                      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Generates points beautifully inside the star bottle shape
function generateStarCoordinates(index, total) {
  // Bounding box of the star polygon
  const minX = 115, maxX = 285;
  const minY = 145, maxY = 305;
  
  let x, y;
  let attempts = 0;
  
  // Seed random placement based on index for stability, but keep it organic
  const hashRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  while (attempts < 100) {
    x = minX + hashRandom(index * 12 + attempts) * (maxX - minX);
    y = minY + hashRandom(index * 45 + attempts) * (maxY - minY);
    
    // Check if point fits within bottle star shape
    if (isPointInPolygon(x, y, BOTTLE_STAR_POLYGON)) {
      // Further buffer outline check so stars don't clip borders
      const borderBuffer = 12;
      let safeCount = 0;
      if (isPointInPolygon(x + borderBuffer, y, BOTTLE_STAR_POLYGON)) safeCount++;
      if (isPointInPolygon(x - borderBuffer, y, BOTTLE_STAR_POLYGON)) safeCount++;
      if (isPointInPolygon(x, y + borderBuffer, y, BOTTLE_STAR_POLYGON)) safeCount++;
      if (isPointInPolygon(x, y - borderBuffer, y, BOTTLE_STAR_POLYGON)) safeCount++;
      
      if (safeCount >= 3) {
        break;
      }
    }
    attempts++;
  }
  return { x, y };
}

// Render dynamic stars inside bottle SVG
function renderBottleStars() {
  starsContainerG.innerHTML = "";
  
  notes.forEach((note, index) => {
    const { x, y } = generateStarCoordinates(index, notes.length);
    const starG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    // Add animations & random rotation
    const angle = Math.floor(Math.sin(index) * 25);
    const scale = 0.85 + (Math.sin(index * 3) * 0.15); // Random scale between 0.7 and 1.0
    
    starG.setAttribute("class", "bottle-star");
    starG.setAttribute("transform", `translate(${x}, ${y}) rotate(${angle}) scale(${scale})`);
    
    // Create decorative SVG star polygon
    const starPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    // Standard 5-point star path centered on (0,0)
    starPath.setAttribute("d", "M 0,-10 L 3,-3 L 10,-3 L 5,2 L 7,9 L 0,5 L -7,9 L -5,2 L -10,-3 L -3,-3 Z");
    starPath.setAttribute("fill", note.color || "#ffccd5");
    starPath.setAttribute("stroke", "rgba(0,0,0,0.1)");
    starPath.setAttribute("stroke-width", "0.5");
    
    // Inner star sparkle highlights
    const starHighlight = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    starHighlight.setAttribute("cx", "-2");
    starHighlight.setAttribute("cy", "-2");
    starHighlight.setAttribute("r", "1.5");
    starHighlight.setAttribute("fill", "rgba(255,255,255,0.7)");

    starG.appendChild(starPath);
    starG.appendChild(starHighlight);
    
    // Click action inside bottle also reads a star
    starG.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerOpenStar();
    });

    // Gentle CSS drifting delay
    starG.style.animation = `float-gentle ${3 + (index % 4)}s infinite ease-in-out`;
    starG.style.animationDelay = `${index * 0.4}s`;

    starsContainerG.appendChild(starG);
  });
}

// Render administrative stars list under Writer's Desk
function renderManageList() {
  notesListContainer.innerHTML = "";
  
  if (notes.length === 0) {
    notesListContainer.innerHTML = `<p style="text-align: center; color: var(--text-secondary); margin-top: 30px; font-size: 0.85rem;">The bottle is empty. Fold some beautiful stars first! 💖</p>`;
    return;
  }
  
  notes.forEach((note) => {
    const row = document.createElement("div");
    row.className = "note-item-row";
    
    row.innerHTML = `
      <div class="note-item-meta">
        <span class="note-item-star-indicator" style="background-color: ${note.color};"></span>
        <span class="note-item-text">${escapeHTML(note.text)}</span>
      </div>
      <div class="note-item-actions">
        <button class="mini-icon-btn edit-btn" title="Edit Note">✏️</button>
        <button class="mini-icon-btn delete-btn" title="Burn Star">🔥</button>
      </div>
    `;
    
    // Bind buttons
    row.querySelector(".edit-btn").addEventListener("click", () => startEditNote(note));
    row.querySelector(".delete-btn").addEventListener("click", () => deleteNote(note.id));
    
    notesListContainer.appendChild(row);
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// ==================== BOYFRIEND NOTE READING LOGIC ====================
starBottleSvg.addEventListener("click", triggerOpenStar);

function triggerOpenStar() {
  // Validate daily read limit
  const readCount = readLimitState.openedIds.length;
  if (readCount >= 3) {
    openModal(limitModal);
    return;
  }

  if (notes.length === 0) {
    alert("The bottle is currently empty. Open the secret desk in the corner to fold some star notes! 💖");
    return;
  }

  // Play premium shake animation
  starBottleSvg.classList.add("bottle-shake");
  setTimeout(() => {
    starBottleSvg.classList.remove("bottle-shake");
    revealRandomStar();
  }, 600);
}

function revealRandomStar() {
  // Choose a random note. Let's make sure we try to pick notes not read *today* yet, if possible
  const unreadToday = notes.filter(n => !readLimitState.openedIds.includes(n.id));
  let chosenNote;
  
  if (unreadToday.length > 0) {
    chosenNote = unreadToday[Math.floor(Math.random() * unreadToday.length)];
  } else {
    // If all read today (e.g. limit reset or editing), pick any random note
    chosenNote = notes[Math.floor(Math.random() * notes.length)];
  }

  // Save read status
  readLimitState.openedIds.push(chosenNote.id);
  saveLimitState();

  // Populate reader paper card
  populateNotePaper(activeNotePaper, noteDisplayText, noteDecorTop, noteDecorBottom, chosenNote);

  // Trigger reader modal
  openModal(noteReaderModal);
  
  // Pop beautiful sparkles inside modal
  triggerSparkles();
}

function populateNotePaper(paperEl, textEl, topEl, bottomEl, note) {
  // Shapes
  paperEl.className = "note-paper"; // Reset
  paperEl.classList.add(`shape-${note.shape || "card"}`);
  
  // Patterns
  paperEl.classList.add(`pattern-${note.pattern || "plain"}`);
  
  // Color variables
  paperEl.style.setProperty("--paper-color", note.color || "#ffccd5");
  paperEl.style.color = getContrastColor(note.color || "#ffccd5");

  // Contents
  textEl.textContent = note.text;
  
  // Emojis border
  const decors = EMOJI_DECORATIONS[note.emojiTheme || "hearts"];
  topEl.textContent = decors.top;
  bottomEl.textContent = decors.bottom;
}

// Quick helper to determine contrast text color (dark vs soft white) on pastel notes
function getContrastColor(hexColor) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Standard brightness formula
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 150) ? '#3e312f' : '#ffffff';
}

// ==================== WRITER'S DESK FORM & PREVIEWS ====================
function initWriterForm() {
  // Render Pastel color dots picker
  colorPickerContainer.innerHTML = "";
  
  PASTEL_COLORS.forEach((color, index) => {
    const dot = document.createElement("div");
    dot.className = "color-dot";
    dot.style.backgroundColor = color.value;
    dot.title = color.name;
    
    if (index === 0) {
      dot.classList.add("active");
      activeSelectedColor = color.value;
    }
    
    dot.addEventListener("click", () => {
      document.querySelectorAll(".color-dot").forEach(d => d.classList.remove("active"));
      dot.classList.add("active");
      activeSelectedColor = color.value;
      updateLivePreview();
    });
    
    colorPickerContainer.appendChild(dot);
  });

  // Bind live updates
  noteContentIn.addEventListener("input", updateLivePreview);
  paperShapeSel.addEventListener("change", updateLivePreview);
  paperPatternSel.addEventListener("change", updateLivePreview);
  emojiThemeSel.addEventListener("change", updateLivePreview);
  
  updateLivePreview();
}

function updateLivePreview() {
  const mockNote = {
    text: noteContentIn.value || "Your romantic note text will look like this... Fold it into a beautiful star! ✨🌸",
    shape: paperShapeSel.value,
    color: activeSelectedColor,
    pattern: paperPatternSel.value,
    emojiTheme: emojiThemeSel.value
  };
  
  populateNotePaper(previewNotePaper, previewDisplayText, previewDecorTop, previewDecorBottom, mockNote);
}

// Save or Edit submit action
noteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const id = editNoteIdIn.value;
  const content = noteContentIn.value.trim();
  
  if (!content) return;
  
  const noteData = {
    id: id || "note-" + Date.now(),
    text: content,
    shape: paperShapeSel.value,
    color: activeSelectedColor,
    pattern: paperPatternSel.value,
    emojiTheme: emojiThemeSel.value,
    createdAt: Date.now()
  };

  if (id) {
    // Edit existing note
    const idx = notes.findIndex(n => n.id === id);
    if (idx !== -1) {
      notes[idx] = noteData;
    }
  } else {
    // Add new note
    notes.push(noteData);
  }

  await saveNotesState();
  
  // Reset form
  resetWriterForm();
  
  // Alert confirmation
  alert(id ? "Star refolded successfully! 🌟" : "Your star note is folded and added to the bottle! 🌟💖");
});

function startEditNote(note) {
  // Fill form
  editNoteIdIn.value = note.id;
  noteContentIn.value = note.text;
  paperShapeSel.value = note.shape;
  paperPatternSel.value = note.pattern;
  emojiThemeSel.value = note.emojiTheme;
  
  // Set color dot active
  activeSelectedColor = note.color;
  document.querySelectorAll(".color-dot").forEach(dot => {
    if (dot.style.backgroundColor === rgbToHex(note.color)) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });

  saveNoteBtn.textContent = "Refold Star ✏️🌟";
  cancelEditBtn.style.display = "block";
  
  // Swtich tab to write tab
  switchTab("tab-write");
  updateLivePreview();
}

function cancelEdit() {
  resetWriterForm();
}
cancelEditBtn.addEventListener("click", cancelEdit);

function resetWriterForm() {
  editNoteIdIn.value = "";
  noteForm.reset();
  saveNoteBtn.textContent = "Fold into Star 🌟";
  cancelEditBtn.style.display = "none";
  
  // Reset active color
  activeSelectedColor = PASTEL_COLORS[0].value;
  document.querySelectorAll(".color-dot").forEach((dot, idx) => {
    if (idx === 0) dot.classList.add("active");
    else dot.classList.remove("active");
  });
  
  updateLivePreview();
}

async function deleteNote(id) {
  if (confirm("Are you sure you want to burn this star note? It will disappear from the bottle forever! 🔥")) {
    notes = notes.filter(n => n.id !== id);
    await saveNotesState();
  }
}

// Convert rgb format to standard HEX code
function rgbToHex(rgb) {
  if (rgb.startsWith("#")) return rgb;
  const rgbArr = rgb.replace(/[^\d,]/g, '').split(',');
  const r = parseInt(rgbArr[0], 10);
  const g = parseInt(rgbArr[1], 10);
  const b = parseInt(rgbArr[2], 10);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// ==================== TABS CONTROLS ====================
tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const tabId = btn.getAttribute("data-tab");
    switchTab(tabId);
  });
});

function switchTab(tabId) {
  tabBtns.forEach(b => b.classList.remove("active"));
  tabContents.forEach(c => c.classList.remove("active"));
  
  document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add("active");
  document.getElementById(tabId).classList.add("active");
}

// ==================== MODALS BEHAVIOR ====================
function openModal(modal) {
  modal.classList.add("active");
}

function closeModal(modal) {
  modal.classList.remove("active");
}

// Secret desk passcode check
secretKeyBtn.addEventListener("click", () => {
  passcodeIn.value = "";
  passcodeError.style.display = "none";
  openModal(passcodeModal);
});

closePasscodeBtn.addEventListener("click", () => closeModal(passcodeModal));

passcodeSubmitBtn.addEventListener("click", validatePasscode);
passcodeIn.addEventListener("keypress", (e) => {
  if (e.key === 'Enter') validatePasscode();
});

function validatePasscode() {
  const code = passcodeIn.value.trim().toLowerCase();
  // Passcode defined: 'iloveyou'
  if (code === "iloveyou") {
    closeModal(passcodeModal);
    openModal(writerDeskModal);
    resetWriterForm();
  } else {
    passcodeError.style.display = "block";
    passcodeIn.value = "";
    // Shake passcode box
    passcodeModal.querySelector(".modal-content").classList.add("bottle-shake");
    setTimeout(() => {
      passcodeModal.querySelector(".modal-content").classList.remove("bottle-shake");
    }, 600);
  }
}

// Close events
closeWriterBtn.addEventListener("click", () => closeModal(writerDeskModal));
closeReaderBtn.addEventListener("click", () => closeModal(noteReaderModal));
readerOkBtn.addEventListener("click", () => closeModal(noteReaderModal));
limitCloseBtn.addEventListener("click", () => closeModal(limitModal));

// Developer reset button
devResetBtn.addEventListener("click", () => {
  readLimitState.openedIds = [];
  saveLimitState();
  alert("Daily read limit reset! Read as many stars as you want for testing! ✨");
});

// ==================== SHARE / LINK TAB LOGIC ====================

// Share Bottle button (header) — copies link to clipboard
const shareBottleBtn = document.getElementById("share-bottle-btn");
if (shareBottleBtn) {
  shareBottleBtn.addEventListener("click", () => {
    copyShareLink(shareBottleBtn);
  });
}

// Copy link button inside Writer's Desk Bottle Link tab
const copyLinkBtn = document.getElementById("copy-link-btn");
if (copyLinkBtn) {
  copyLinkBtn.addEventListener("click", () => {
    copyShareLink(copyLinkBtn);
  });
}

function copyShareLink(triggerEl) {
  const url = getShareableUrl();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      showCopiedFeedback(triggerEl);
    }).catch(() => fallbackCopy(url, triggerEl));
  } else {
    fallbackCopy(url, triggerEl);
  }
}

function fallbackCopy(text, triggerEl) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "fixed";
  el.style.opacity  = "0";
  document.body.appendChild(el);
  el.focus();
  el.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(el);
  showCopiedFeedback(triggerEl);
}

function showCopiedFeedback(el) {
  const original = el.innerHTML;
  el.innerHTML = "Copied! 💚";
  el.classList.add("copied");
  setTimeout(() => {
    el.innerHTML = original;
    el.classList.remove("copied");
  }, 2200);
}

// Apply custom bottle name
const applyCustomNameBtn = document.getElementById("apply-custom-name-btn");
const customNameInput    = document.getElementById("custom-bottle-name-input");
const customNameHint     = document.getElementById("custom-name-hint");

if (applyCustomNameBtn && customNameInput) {
  applyCustomNameBtn.addEventListener("click", async () => {
    const raw = customNameInput.value.trim().toLowerCase();
    if (!raw) {
      showNameHint("Please enter a bottle name! 💕", "error");
      return;
    }
    // Validate: only letters, numbers, dashes
    if (!/^[a-z0-9-]+$/.test(raw)) {
      showNameHint("Only lowercase letters, numbers and dashes allowed!", "error");
      return;
    }
    if (raw.length < 3) {
      showNameHint("Name must be at least 3 characters!", "error");
      return;
    }

    // Save current notes to old bottle before switching
    await pushToCloud();

    // Switch to new bottle ID
    setBottleId(raw);
    // Cloud sync: try to load notes from new bottle
    // (if empty on cloud, we'll push our current notes)
    if (isCloudAvailable()) {
      cloudSyncEnabled = true;
      await loadFromCloud();
    } else {
      // Local only: copy notes under new key
      localStorage.setItem(lsNotesKey(), JSON.stringify(notes));
    }

    updateUI();
    updateLinkTab();
    customNameInput.value = "";
    showNameHint(`Bottle renamed to "${raw}"! Share the link below 🌟`, "success");
  });
}

function showNameHint(msg, type) {
  if (!customNameHint) return;
  customNameHint.textContent = msg;
  customNameHint.className = `custom-name-hint ${type}`;
  clearTimeout(customNameHint._timer);
  customNameHint._timer = setTimeout(() => {
    customNameHint.textContent = "";
    customNameHint.className   = "custom-name-hint";
  }, 4000);
}

// ==================== BACKGROUND NIGHT CANVAS ====================
let particleId = null;
let stars = [];

function startParticles() {
  if (particleId) return;
  
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  
  // Seed initial particles
  stars = [];
  const numStars = Math.floor(window.innerWidth * window.innerHeight / 8000);
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * particleCanvas.width,
      y: Math.random() * particleCanvas.height,
      radius: Math.random() * 1.8 + 0.3,
      opacity: Math.random(),
      blinkSpeed: 0.01 + Math.random() * 0.02,
      risingSpeed: 0.05 + Math.random() * 0.15
    });
  }
  
  loopParticles();
}

function stopParticles() {
  if (particleId) {
    cancelAnimationFrame(particleId);
    particleId = null;
  }
  window.removeEventListener("resize", resizeCanvas);
}

function resizeCanvas() {
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
}

function loopParticles() {
  const ctx = particleCanvas.getContext("2d");
  ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  
  stars.forEach(star => {
    // Blink starlight opacity
    star.opacity += star.blinkSpeed;
    if (star.opacity > 1 || star.opacity < 0) {
      star.blinkSpeed = -star.blinkSpeed;
    }
    
    // Float upwards gently
    star.y -= star.risingSpeed;
    if (star.y < 0) {
      star.y = particleCanvas.height;
      star.x = Math.random() * particleCanvas.width;
    }
    
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, star.opacity)})`;
    ctx.shadowBlur = isNightMode ? 6 : 0;
    ctx.shadowColor = "#ffffff";
    ctx.fill();
  });
  
  particleId = requestAnimationFrame(loopParticles);
}

// ==================== MODAL SPARKLING CANVAS EFFECT ====================
let sparkleFrameId = null;
let sparklesList = [];

function triggerSparkles() {
  const canvas = readerSparkleCanvas;
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  
  const ctx = canvas.getContext("2d");
  
  sparklesList = [];
  if (sparkleFrameId) cancelAnimationFrame(sparkleFrameId);
  
  // Generate 45 sparkly stars bursting from center
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  const colors = ["#ffccd5", "#ffb703", "#80ffdb", "#ffc6ff", "#e2e2ff", "#ffffff"];
  
  for (let i = 0; i < 45; i++) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = 2 + Math.random() * 5;
    sparklesList.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      radius: Math.random() * 2 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: 0.015 + Math.random() * 0.02
    });
  }
  
  loopSparkles(canvas, ctx);
}

function loopSparkles(canvas, ctx) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  let active = false;
  
  sparklesList.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.04; // Gentle gravity pull
    p.alpha -= p.decay;
    
    if (p.alpha > 0) {
      active = true;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      // Draw standard diamond cross sparkle
      ctx.fillStyle = p.color;
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });
  
  if (active) {
    sparkleFrameId = requestAnimationFrame(() => loopSparkles(canvas, ctx));
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sparkleFrameId = null;
  }
}

// ==================== APP INITIALIZATION ====================
window.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  await loadState();
  initWriterForm();

  // Periodically check time to switch modes (every minute)
  setInterval(initTheme, 60000);
});
