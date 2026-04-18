/**
 * @fileoverview Minimal audio memory/matching game.
 *
 * Builds a shuffled board of audio clip paths from predefined folder groups,
 * renders clickable items, handles selection and matching logic, and provides
 * visual/audio feedback for correct/incorrect matches. Level is chosen via
 * the "level" URL parameter (1–10).
 *
 * Key functions:
 * - renderBoard(sources): create the interactive board and attach handlers.
 * - check_compatibility(sources): compare selected items' folders and trigger feedback.
 * - loadCurrentLevel(): read level from URL and initialize the board.
 */

const board = document.getElementById("audio-board");

let figures = new Map();
let allowMovement = true;
let selectedElements = [];
let selectedIndices = [];
let randomizedSources = [];
let matchedPairs = 0;
let GRID_COLUMNS = 4;
let gameId = -1;
let currentLevel = 1;
let moveNumber = 0;
let nPlayers = 2;
let isBoardgame = 0;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let yeahBuffer;
let actionCounter = [];
/**
 * Load the current level from the URL, select the matching folder set,
 * generate randomized sources for that level, and render the board.
 * Side effects: sets global currentLevel and randomizedSources, and calls renderBoard.
 * @returns {void}
 */
async function loadCurrentLevel() {
  const response = await fetch(
    `../leveleditor/php/storage.php?action=get_level&id=${currentLevel}`,
  );

  const data = await response.json();

  randomizedSources = shuffle(data);
  actionCounter["play"] = 0;
  actionCounter["swap"] = 0;
  actionCounter["correctMatch"] = 0;
  actionCounter["wrongMatch"] = 0;
  renderBoard(randomizedSources);
}

async function logAction(action) {
  let wrongMatches = actionCounter["wrongMatch"];
  let rightMatches = actionCounter["rightMatch"];
  let listenMoves = actionCounter["play"];
  let swapFigures = actionCounter["swap"];
  let setup = "abcdefghijklmnop";
  if (action == "play") {
    moveNumber += 1;
    const response = await fetch(
      `../leveleditor/php/storage.php?action=logMove&gameId=${gameId}&moveNumber=${moveNumber}&moveType="play"&matchCorrect=-1`,
    );
  } else if (action == "swap") {
    moveNumber += 1;
    const response = await fetch(
      `../leveleditor/php/storage.php?action=logMove&gameId=${gameId}&moveNumber=${moveNumber}&moveType="swap"&matchCorrect=-1`,
    );
  } else if (action == "correctMatch") {
    moveNumber += 1;
    const response = await fetch(
      `../leveleditor/php/storage.php?action=logMove&gameId=${gameId}&moveNumber=${moveNumber}&moveType="match"&matchCorrect=1`,
    );
  } else if (action == "wrongMatch") {
    moveNumber += 1;
    const response = await fetch(
      `../leveleditor/php/storage.php?action=logMove&gameId=${gameId}&moveNumber=${moveNumber}&moveType="match"&matchCorrect=0`,
    );
  } else if (action == "startGame") {
    //function startGame (level, nPlayers, playTime, isBoardgame, initalSetup)
    const response = await fetch(
      `../leveleditor/php/storage.php?action=startGame&levelId=${currentLevel}&nPlayers=${nPlayers}&isBoardgame=${isBoardgame}&initialSetup=${setup}`,
    );
    const json = await response.json();
    console.log("startGame response:", json);
    gameId = json.gameId;
    console.log("gameId:", gameId);
  } else if (action == "finishGame") {
    //function finishGame (gameId, totalMoves, finalSetup, wrongMatches, rightMatches, listenMoves, swapFigures)
    const response = await fetch(
      `../leveleditor/php/storage.php?action=finishGame&gameId=${gameId}&totalMoves=${moveNumber + 1}&finalSetup=${setup}&wrongMatches=${wrongMatches}&rightMatches=${rightMatches}&listenMoves=${listenMoves}&swapFigures=${swapFigures}`,
    );
  }
  actionCounter[action] += 1;
  console.log(actionCounter);
}
/**
 * Creates a start overlay to unlock audio/video on iOS.
 */
function createStartButton() {
  const overlay = document.createElement("div");
  overlay.className = "overlay";

  // 1. Add Logo
  const logo = document.createElement("img");
  logo.src = "logo.png"; // Ensure this path is correct
  logo.alt = "Game Logo";
  logo.className = "logoImg";
  Object.assign(logo.style, {
    maxHeight: "50%",
    maxWidth: "90%", // Prevents logo from overflowing on small phones
  });

  const btnOnline = document.createElement("button");
  btnOnline.textContent = "START GAME";
  btnOnline.className = "menuButton";
  btnOnline.id = "startButton";
  btnOnline.style.backgroundColor = "#d60d0d";
  // 2. Add Button
  const btn = document.createElement("button");
  btn.textContent = "BOARD GAME VERSION";
  btn.className = "menuButton";
  btn.style.backgroundColor = "#ed8300";

  const btnLevel = document.createElement("button");
  btnLevel.textContent = "MAKE LEVEL";
  btnLevel.className = "menuButton";
  btnLevel.style.backgroundColor = "#f2c500";

  // 3. iPhone "Active" state feedback
  btn.ontouchstart = () => (btn.style.backgroundColor = "#0051a8");
  btn.ontouchend = () => (btn.style.backgroundColor = "#007AFF");

  btn.onclick = () => {
    allowMovement = false;
    isBoardgame = 1;
    overlay.remove();
    showSelectionDiv();
  };

  btnOnline.onclick = () => {
    allowMovement = true;
    isBoardgame = 0;
    overlay.remove();
    showSelectionDiv();
  };

  btnLevel.onclick = () => {
    window.location.href = "https://konradbogen.com/leveleditor";
  };

  overlay.appendChild(logo);
  overlay.appendChild(btnOnline);

  overlay.appendChild(btn);
  overlay.appendChild(btnLevel);

  document.body.appendChild(overlay);
}

function showEndScreen() {
  logAction("finishGame");

  const overlay = document.createElement("div");
  overlay.className = "overlay";

  // 1. Add Logo
  const logo = document.createElement("img");
  logo.src = "logo.png"; // Ensure this path is correct
  logo.alt = "Game Logo";
  logo.className = "logoImg";
  Object.assign(logo.style, {
    maxHeight: "30%",
    maxWidth: "90%", // Prevents logo from overflowing on small phones
  });

  const actionLogDiv = document.createElement("div");
  actionLogDiv.className = "action-log";
  actionLogDiv.style.margin = "20px auto";
  actionLogDiv.style.maxWidth = "90%";
  actionLogDiv.style.background = "#fff";
  actionLogDiv.style.borderRadius = "8px";
  actionLogDiv.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
  actionLogDiv.style.padding = "16px";
  actionLogDiv.style.fontFamily = "monospace";
  actionLogDiv.style.fontSize = "28px";
  actionLogDiv.style.textAlign = "left";

  let logHtml = "";
  let score = actionCounter["correctMatch"] * 100;
  score = score - actionCounter["play"] * 5;
  score = score - actionCounter["wrongMatch"] * 10;
  score = score - actionCounter["swap"];
  logHtml += `<div style="font-size:64px;text-align:center;line-height:1.1;">🏆</div>`;
  logHtml += `<h1 style="color:gold;text-align:center;">Score: ${score}</h1>`;
  for (const [key, value] of Object.entries(actionCounter)) {
    let text = "";
    if (key == "play") {
      text = `You have pressed play ${value} times.`;
    } else if (key == "swap") {
      text = `You have swapped ${value} times.`;
    } else if (key == "wrongMatch") {
      text = `You have matched incorrectly ${value} times.`;
    } else if (key == "correctMatch") {
      text = `You have matched sucessfully ${value} times.`;
    }
    logHtml += `${text}<br>`;
  }
  actionLogDiv.innerHTML = logHtml;

  overlay.appendChild(logo);
  overlay.appendChild(actionLogDiv);

  document.body.appendChild(overlay);
}

function showSelectionDiv() {
  if (window.location.search.includes("level")) {
    currentLevel = getLevelFromURL();
    loadCurrentLevel();
    primeYouTube();
    return;
  }
  const overlay = document.createElement("div");
  overlay.className = "overlay";

  const logo = document.createElement("img");
  logo.src = "logo.png"; // Ensure this path is correct
  logo.alt = "Game Logo";
  Object.assign(logo.style, {
    maxHeight: "30%",
    maxWidth: "90%", // Prevents logo from overflowing on small phones
  });

  overlay.appendChild(logo);
  const title = document.createElement("div");
  title.className = "rainbow";
  title.textContent = "Select Your Level";
  title.style.fontSize = "3rem";
  title.style.fontWeight = "bold";
  title.style.textAlign = "center";
  title.style.margin = "32px 0 24px 0";
  overlay.appendChild(title);
  const levels = [];
  levels[0] = {
    name: "Beatles",
    id: 36,
    img: "https://i8.amplience.net/i/naras/the-beatles_MI0003995354-MN0000754032",
  };
  levels[1] = {
    name: "Coldplay",
    id: 35,
    img: "https://www.merkur.de/assets/images/34/846/34846412-die-band-coldplay-um-saenger-chris-martin-re-b7a.jpg",
  };

  for (i = 0; i < levels.length; i++) {
    let level = levels[i];
    const levelDiv = document.createElement("div");
    levelDiv.className = "levelDiv";
    levelDiv.style.backgroundImage = `url('${level.img}')`;
    levelDiv.style.backgroundSize = "cover";
    levelDiv.style.backgroundPosition = "center";
    levelDiv.textContent = level.name;
    levelDiv.addEventListener("click", function () {
      currentLevel = level.id;
      loadCurrentLevel();
      primeYouTube();
      overlay.style.transition = "opacity 0.5s ease";
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 500);
      logAction("startGame");
    });
    overlay.appendChild(levelDiv);
  }

  document.body.appendChild(overlay);
}

function primeYouTube() {
  const figuresList = Object.values(figures);

  figuresList.forEach((fig) => {
    if (fig.player && fig.ytReady) {
      fig.player.mute();
      fig.player.playVideo();
      setTimeout(() => {
        fig.player.pauseVideo();
        fig.player.unMute();
      }, 100);
    }
  });
}

/**
 * Get the "level" query parameter from the current page URL.
 *
 * Reads window.location.search, parses the "level" parameter as an integer,
 * and returns it if it is an integer between 1 and 10 (inclusive).
 * Returns 1 when the parameter is missing, not a valid integer, or out of range.
 *
 * @returns {number} An integer in the range 1..10 representing the level (defaults to 1).
 */
function getLevelFromURL() {
  const params = new URLSearchParams(window.location.search);
  const levelParam = params.get("level");
  let level = 1;
  if (levelParam !== null) {
    level = parseInt(levelParam, 10);
    if (Number.isNaN(level)) level = 0;
  }
  return level;
}

function isOrthogonal(idx1, idx2) {
  if (!allowMovement) {
    return true;
  }
  const row1 = Math.floor(idx1 / GRID_COLUMNS);
  const col1 = idx1 % GRID_COLUMNS;
  const row2 = Math.floor(idx2 / GRID_COLUMNS);
  const col2 = idx2 % GRID_COLUMNS;

  const rowDiff = Math.abs(row1 - row2);
  const colDiff = Math.abs(col1 - col2);

  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

function highlightValidNeighbors(originIdx, hideDisactive = true) {
  if (!allowMovement) {
    return;
  }
  for (j = 0; j < figures.size; j++) {
    let figure = figures.get(j);
    let el = figure.container;
    let i = figure.container.getAttribute("data-index");
    if (i != originIdx) {
      if (
        !isOrthogonal(originIdx, i) ||
        (figure.active == false && hideDisactive)
      ) {
        el.style.opacity = "0.3";
        el.style.pointerEvents = "none";
      } else if (isOrthogonal(originIdx, i)) {
        el.style.opacity = "1";
        el.style.pointerEvents = "auto";
      }
    }
  }
}

function resetVisuals() {
  document.querySelectorAll(".audio-figure").forEach((el) => {
    el.style.opacity = "1";
    el.style.pointerEvents = "auto";
  });
}

function isMovable(index) {
  let moveLeft = false;
  let moveTop = false;
  let moveRight = false;
  let moveDown = false;
  if (index % 4 != 0) {
    moveLeft = figures[index - 1].active;
  }
  if (index > 3) {
    moveTop = figures[index - 4].active;
  }
  if (index % 4 != 3) {
    moveRight = figures[index + 1].active;
  }
  if (index < 12) {
    moveDown = figures[index + 4].active;
  }
  return moveLeft || moveTop || moveRight || moveDown;
}

/**
 * Render the game board from a list of audio sources.
 *
 * Clears the current board, resets selection state, creates a Figure for each source,
 * attaches click handlers that toggle selection and trigger compatibility checks,
 * and appends each figure's container to the global `board` element.
 *
 * @param {string[]} sources - Array of audio source URLs or identifiers to display.
 * @returns {void}
 *
 * @sideffects Updates globals: `board.innerHTML`, `selectedIndices`, `matchedPairs`.
 * @see Figure#get_container
 * @see check_compatibility
 */
function renderBoard(rows) {
  // Change let figures = new Map(); to an object if you use index keys
  board.innerHTML = "";
  selectedIndices = [];
  matchedPairs = 0;

  rows.forEach((row, i) => {
    const figure = new Figure(row.youtube_link, row.start_sec, row.end_sec, i);
    figure.callback_play = () => {
      logAction("play");
      for (const fig of figures.values()) {
        fig.reset_border();
      }
    };
    figures.set(i, figure);

    const container = figure.get_container();
    container.figureInstance = figure;
    container.dataset.groupId = row.group_id;
    if (allowMovement) {
      container.setAttribute("draggable", "true");
      addDragAndDropHandlers(container);
    }

    board.appendChild(container);

    container.addEventListener("click", function () {
      const currentNodes = Array.from(board.children);
      const currentIdx = currentNodes.indexOf(container);

      if (container.classList.contains("selected")) {
        container.classList.remove("selected");
        selectedElements = [];
        resetVisuals();
      } else if (selectedElements.length < 2) {
        if (selectedElements.length === 0) {
          container.classList.add("selected");
          selectedElements.push(container); // Element speichern
          highlightValidNeighbors(currentIdx);
        } else {
          const firstIdx = currentNodes.indexOf(selectedElements[0]);
          if (isOrthogonal(firstIdx, currentIdx)) {
            container.classList.add("selected");
            selectedElements.push(container);
            check_compatibility(); // Keine 'rows' mehr nötig
            resetVisuals();
          }
        }
      }
    });
  });

  // Show the overlay after the board is rendered
}

// Move this OUTSIDE renderBoard to the global scope
window.onYouTubeIframeAPIReady = function () {
  Object.values(figures).forEach((f) => f.onYTReady());
};

/**
 * Randomly shuffles an array in place using the Fisher–Yates algorithm.
 *
 * @param {Array<any>} array - The array to shuffle.
 * @returns {Array<any>} The same array, shuffled.
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

let draggedElement = null;

function addDragAndDropHandlers(el) {
  el.addEventListener("dragstart", (e) => {
    draggedElement = el;
    const currentNodes = Array.from(board.children);
    const idx = currentNodes.indexOf(el);
    highlightValidNeighbors(idx, false);

    e.dataTransfer.effectAllowed = "move";
  });

  el.addEventListener("dragover", (e) => {
    e.preventDefault(); // Erlaubt das Droppen auf dieses Element
    e.dataTransfer.dropEffect = "move";
    return false;
  });

  el.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const targetFigure = el.closest(".audio-figure");
    const currentNodes = Array.from(board.children);

    const draggedIdx = currentNodes.indexOf(draggedElement);
    const targetIdx = currentNodes.indexOf(targetFigure);

    console.log("Tausche Index", draggedIdx, "mit", targetIdx);

    if (
      draggedIdx !== -1 &&
      targetIdx !== -1 &&
      isOrthogonal(draggedIdx, targetIdx)
    ) {
      swapElements(draggedElement, targetFigure);
    }

    resetVisuals();
    return false;
  });

  el.addEventListener("dragend", () => {
    resetVisuals();
    draggedElement = null;
  });

  // --- IPHONE / TOUCH LOGIK ---
  el.addEventListener(
    "touchstart",
    (e) => {
      draggedElement = el;
      const allNodes = Array.from(board.children);
      const idx = allNodes.indexOf(el);

      highlightValidNeighbors(idx, false);
      el.style.zIndex = "1000";
    },
    { passive: true },
  );

  el.addEventListener("touchend", (e) => {
    el.style.zIndex = "";
    const touch = e.changedTouches[0];

    el.style.pointerEvents = "none";
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetFigure = target?.closest(".audio-figure");
    el.style.pointerEvents = "auto";

    if (targetFigure && targetFigure !== el) {
      const currentNodes = Array.from(board.children);
      const draggedIdx = currentNodes.indexOf(el);
      const targetIdx = currentNodes.indexOf(targetFigure);

      if (isOrthogonal(draggedIdx, targetIdx)) {
        swapElements(el, targetFigure);
      }
    }
    resetVisuals();
    draggedElement = null;
  });
}

/**
 * Hilfsfunktion zum Tauschen zweier Elemente im DOM
 */
function swapElements(node1, node2) {
  if (!allowMovement) {
    return;
  }
  logAction("swap");
  const parent = node1.parentNode;
  let c = node2.getAttribute("data-index");
  node2.setAttribute("data-index", node1.getAttribute("data-index"));
  node1.setAttribute("data-index", c);
  // 1. FIRST: Positionen für die Animation speichern
  const rect1 = node1.getBoundingClientRect();
  const rect2 = node2.getBoundingClientRect();

  // 2. ECHTER TAUSCH: Mit einem Platzhalter (Placeholder)
  // Das verhindert, dass das Grid "nachrutscht"
  const sibling = node1.nextSibling === node2 ? node1 : node1.nextSibling;
  node2.replaceWith(node1);
  if (sibling) {
    parent.insertBefore(node2, sibling);
  } else {
    parent.appendChild(node2);
  }

  // 3. LAST: Neue Positionen nach dem Tausch ermitteln
  const newRect1 = node1.getBoundingClientRect();
  const newRect2 = node2.getBoundingClientRect();

  // 4. INVERT & PLAY: Die Animation (FLIP)
  const duration = 300;
  const easing = "cubic-bezier(0.4, 0, 0.2, 1)";

  const deltaX1 = rect1.left - newRect1.left;
  const deltaY1 = rect1.top - newRect1.top;
  const deltaX2 = rect2.left - newRect2.left;
  const deltaY2 = rect2.top - newRect2.top;

  node1.animate(
    [
      { transform: `translate(${deltaX1}px, ${deltaY1}px)` },
      { transform: "translate(0, 0)" },
    ],
    { duration, easing },
  );

  node2.animate(
    [
      { transform: `translate(${deltaX2}px, ${deltaY2}px)` },
      { transform: "translate(0, 0)" },
    ],
    { duration, easing },
  );
}
/**
 * Automatically play the game by matching pairs with the same groupId.
 * Iterates through elements and triggers matching at 1 second intervals.
 */
function autoplayGame() {
  const allFigures = Array.from(figures.values());

  // Group figures by their groupId
  const groups = {};
  allFigures.forEach((fig) => {
    const groupId = fig.container.dataset.groupId;
    if (!groups[groupId]) {
      groups[groupId] = [];
    }
    groups[groupId].push(fig);
  });

  // Filter groups that have at least 2 active figures
  const matchableGroups = Object.values(groups).filter(
    (group) => group.filter((fig) => fig.active).length >= 2,
  );

  let delay = 500; // Initial delay before starting

  matchableGroups.forEach((group, groupIndex) => {
    const activeFigs = group.filter((fig) => fig.active);

    // Process each pair in this group
    for (let i = 0; i < activeFigs.length - 1; i += 2) {
      const fig1 = activeFigs[i];
      const fig2 = activeFigs[i + 1];

      setTimeout(() => {
        // Select first element
        const el1 = fig1.container;
        el1.classList.add("selected");
        selectedElements.push(el1);

        // After a short delay, select the second element to trigger match
        setTimeout(() => {
          const el2 = fig2.container;
          el2.classList.add("selected");
          selectedElements.push(el2);

          // Trigger the compatibility check
          check_compatibility();
        }, 500);
      }, delay);

      delay += 8000; // 1 second interval between each match
    }
  });
}
/**
 * Check compatibility between two selected items and provide feedback.
 *
 * When exactly two items are selected, compares their folders, flashes success if they match or error if not,
 * then resets the selection.
 *
 * @param {any} sources - Data source used to resolve the selected folders.
 * @returns {void}
 */
function check_compatibility() {
  if (selectedElements.length === 2) {
    const el1 = selectedElements[0];
    const el2 = selectedElements[1];

    const group1 = el1.dataset.groupId;
    const group2 = el2.dataset.groupId;

    const fig1 = el1.figureInstance;
    const fig2 = el2.figureInstance;

    if (group1 === group2) {
      flash_correct();
      fig1.deactivate();
      fig2.deactivate();
      matchedPairs++;

      // Hier wurde selectedElements bereits in flash_correct verarbeitet
    } else {
      flash_wrong();
      reset_selection(2000);
    }
  }

  let allMatched = checkForAllMatched();
  let staticBoard = false;
  let end = allMatched || staticBoard;
  if (end) {
    showEndScreen();
  }
}

function checkForMovable() {
  for (i = 0; i < figures.size; i++) {
    if (isMovable(figures[i])) {
      return false;
    }
  }
  return true;
}

function checkForAllMatched() {
  for (i = 0; i < figures.size; i++) {
    if (figures.get(i).active === true) {
      return false;
    }
  }
  return true;
}

/**
 * Reset selection state.
 */
function reset_selection(length) {
  setTimeout(() => {
    document.body.style.background = "";
    // Entferne Klasse von allen selektierten Elementen
    selectedElements.forEach((el) => el.classList.remove("selected"));
    selectedElements = [];
    resetVisuals();
  }, length);
}

/**
 * Returns the folder names for two selected source paths.
 *
 * Given an array of source path strings, this function reads two indices from
 * the outer-scope `selectedIndices` (expected to be an array like [i1, i2]) and
 * returns the corresponding folder names. For each selected source, the folder
 * is the second-to-last path segment when the path contains "/" separators,
 * otherwise the entire source string is returned.
 *
 * @param {string[]} sources - Array of source path strings (segments separated by "/").
 * @returns {{folder1: string, folder2: string}} An object containing the resolved folder names.
 * @throws {TypeError} If `selectedIndices` is not defined as an array of two numeric indices
 *                     or if an index is out of range for the provided `sources`.
 */
function get_selected_groups(rows) {
  const [i1, i2] = selectedIndices;

  return {
    group1: rows[i1].group_id,
    group2: rows[i2].group_id,
  };
}

/**
 * Flash the UI to indicate a wrong match.
 *
 * Changes the document body's background to a light red color and plays a negative feedback sound
 * to provide immediate visual and audio feedback for an incorrect user action.
 *
 * @function flash_wrong
 * @returns {void}
 */
function flash_wrong() {
  logAction("wrongMatch");
  const body = document.body;
  body.style.background = "#f7c5c5";
  const audioNo = new Audio("Sounds/no.mp3");
  audioNo.play();
}

/**
 * Flash the UI to indicate a right matchs.
 *
 * Changes the document body's background to a light green color and plays a positive feedback sound
 * to provide immediate visual and audio feedback for an correct user action.
 *
 * @function flash_wrong
 * @returns {void}
 */
function flash_correct() {
  logAction("correctMatch");
  const body = document.body;
  body.style.background = "#7dffa0";

  // Wir nutzen das erste gewählte Element für Audio/Animation
  if (selectedElements.length > 0) {
    const fig = selectedElements[0].figureInstance;

    audioCtx.resume().then(() => {
      const source = audioCtx.createBufferSource();
      source.buffer = yeahBuffer;
      source.connect(audioCtx.destination);

      // Trigger das Video/Audio der Figure
      fig.play(true, false);

      // Falls die globale animate-Funktion existiert
      if (typeof animate === "function") {
        animate(fig.getLength() * 1000);
      }

      source.start(0);
    });

    // Match-Logik: Aufräumen nach der Spielzeit
    const delay = fig.getLength() * 1000;
    reset_selection(delay);
  }
}

function initYeahSound() {
  fetch("Sounds/yes.mp3")
    .then((res) => res.arrayBuffer())
    .then((data) => audioCtx.decodeAudioData(data))
    .then((buffer) => {
      yeahBuffer = buffer;
    });
}

initYeahSound();
createStartButton();
