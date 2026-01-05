/**
 * @fileoverview Minimal audio memory/matching game.
 *
 * Builds a shuffled board of audio clip paths from predefined folder groups,
 * renders clickable items, handles selection and matching logic, and provides
 * visual/audio feedback for correct/incorrect matches. Level is chosen via
 * the "level" URL parameter (1–10).
 *
 * Key functions:
 * - get_sources(folders): produce shuffled "<folder>/<number>.mp3" entries.
 * - renderBoard(sources): create the interactive board and attach handlers.
 * - check_compatibility(sources): compare selected items' folders and trigger feedback.
 * - loadCurrentLevel(): read level from URL and initialize the board.
 */
const folders = [
  ["Ital1", "Flugmodus", "Afro", "Lucky"],
  ["Mayer", "Season", "LetItBe", "Invention"],
  ["Flugmodus2", "Flugmodus3", "Flugmodus4", "Poldi"],
  ["Eb7/DrumBass", "Eb7/Flute", "Eb7/Piano", "Eb7/Mallet"],
  ["Lucky4/1", "Lucky4/2", "Lucky4/3", "Lucky4/4"],
  ["WireLevel/Chaka", "WireLevel/Kanye", "WireLevel/Bowly", "WireLevel/Dua"],
  ["wr2", "christmas", "Beauty", "Poldi"],
  ["Metronome/A", "Metronome/B", "Metronome/C", "Metronome/D"],
  ["Mars/ToMars", "Analysis", "Coldplay", "Afro"],
  ["wr2", "christmas", "Beauty", "KommSys"],
];
const numbers = ["1", "2", "3", "4"];
const board = document.getElementById("audio-board");

let figures = [];
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
function loadCurrentLevel() {
  currentLevel = getLevelFromURL();
  const current_folders = folders[currentLevel - 1];
  randomizedSources = get_sources(current_folders);
  renderBoard(randomizedSources);
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
  const level = parseInt(params.get("level"));
  if (level <= 10 && level >= 1) {
    return level;
  }
  return 1;
}

/**
 * Generate and return a shuffled list of MP3 source paths by combining each folder with entries
 * from a global `numbers` array.
 *
 * @param {string[]} folders - Array of folder path strings.
 * @returns {string[]} Shuffled array of "<folder>/<number>.mp3" source paths.
 */
function get_sources(folders) {
  const sources = [];
  folders.forEach((folder) => {
    numbers.forEach((num) => {
      sources.push(`${folder}/${num}.mp3`);
    });
  });
  return shuffle(sources);
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
function renderBoard(sources) {
  board.innerHTML = "";
  selectedIndices = [];
  matchedPairs = 0;

  sources.forEach((audioSrc, i) => {
    var figure = new Figure(audioSrc, i);
    var container = figure.get_container();
    container.addEventListener("click", function () {
      if (container.classList.contains("selected")) {
        container.classList.remove("selected");
        selectedIndices = selectedIndices.filter((idx) => idx !== i);
      } else if (selectedIndices.length < 2) {
        container.classList.add("selected");
        selectedIndices.push(i);
        check_compatibility(randomizedSources);
      }
    });
    board.appendChild(container);
  });
}

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
 * When exactly two items are selected, compares their folders (via
 * get_selected_folders), flashes success if they match or error if not,
 * then resets the selection.
 *
 * @param {any} sources - Data source used to resolve the selected folders.
 * @returns {void}
 */
function check_compatibility(sources) {
  if (selectedIndices.length === 2) {
    const { folder1, folder2 } = get_selected_folders(sources);
    if (folder1 === folder2) {
      flash_correct();
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
function get_selected_folders(sources) {
  const [i1, i2] = selectedIndices;
  const src1 = sources[i1];
  const src2 = sources[i2];
  const parts1 = src1.split("/");
  const folder1 = parts1.length > 1 ? parts1[parts1.length - 2] : parts1[0];
  const parts2 = src2.split("/");
  const folder2 = parts2.length > 1 ? parts2[parts2.length - 2] : parts2[0];
  return { folder1, folder2 };
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
