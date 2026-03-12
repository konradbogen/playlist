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
let selectedIndices = [];
let randomizedSources = [];
let matchedPairs = 0;
let currentLevel = 1;

/**
 * Load the current level from the URL, select the matching folder set,
 * generate randomized sources for that level, and render the board.
 * Side effects: sets global currentLevel and randomizedSources, and calls renderBoard.
 * @returns {void}
 */
async function loadCurrentLevel() {
  currentLevel = getLevelFromURL();

  const response = await fetch(
    `../leveleditor/php/storage.php?action=get_level&id=${currentLevel}`,
  );

  const data = await response.json();

  randomizedSources = shuffle(data);
  renderBoard(randomizedSources);
}

/**
 * Creates a start overlay to unlock audio/video on iOS.
 */
function createStartButton() {
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.95)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: "1000",
  });

  const btn = document.createElement("button");
  btn.textContent = "Start Game";
  btn.style.padding = "20px 40px";
  btn.style.fontSize = "24px";

  btn.onclick = () => {
    // Prime every figure
    figures.forEach((fig) => {
      if (fig.player && fig.ytReady) {
        fig.player.mute();
        fig.player.playVideo();
        fig.player.pauseVideo();
        fig.player.unMute();
      }
    });
    overlay.remove();
  };

  overlay.appendChild(btn);
  document.body.appendChild(overlay);
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
  let figures = {};
  board.innerHTML = "";
  selectedIndices = [];
  matchedPairs = 0;

  rows.forEach((row, i) => {
    const figure = new Figure(row.youtube_link, row.start_sec, row.end_sec, i);
    figures[i] = figure; // Store in the global object

    const container = figure.get_container();
    board.appendChild(container);
    container.addEventListener("click", function () {
      if (container.classList.contains("selected")) {
        container.classList.remove("selected");
        selectedIndices = selectedIndices.filter((idx) => idx !== i);
      } else if (selectedIndices.length < 2) {
        container.classList.add("selected");
        selectedIndices.push(i);
        check_compatibility(rows);
      }
    });
  });

  // Show the overlay after the board is rendered
  createStartButton();
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

/**
 * Check compatibility between two selected items and provide feedback.
 *
 * When exactly two items are selected, compares their folders, flashes success if they match or error if not,
 * then resets the selection.
 *
 * @param {any} sources - Data source used to resolve the selected folders.
 * @returns {void}
 */
function check_compatibility(rows) {
  if (selectedIndices.length === 2) {
    const { group1, group2 } = get_selected_groups(rows);

    if (group1 === group2) {
      flash_correct();

      figures[selectedIndices[0]].deactivate();
      figures[selectedIndices[1]].deactivate();
      figures[selectedIndices[0]].play();
    } else {
      flash_wrong();
    }

    reset_selection();
  }
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
 * Reset selection state after a short delay.
 *
 * Schedules a 1 second timeout to:
 *  - clear the document body's background,
 *  - reset the global `selectedIndices` array,
 *  - remove the "selected" CSS class from any elements matching ".audio-figure.selected".
 *
 * This function performs DOM mutations and mutates a global/module variable.
 *
 * @function reset_selection
 * @returns {void} No value returned.
 */
function reset_selection() {
  const body = document.body;
  setTimeout(() => {
    body.style.background = "";
    selectedIndices = [];
    document.querySelectorAll(".audio-figure.selected").forEach((el) => {
      el.classList.remove("selected");
    });
  }, 1000);
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
  const body = document.body;
  body.style.background = "#c8f7c5";
  const audioYes = new Audio("Sounds/yes.mp3");
  audioYes.play();
}

loadCurrentLevel();
