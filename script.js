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

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function get_sources(folders) {
  const sources = [];
  folders.forEach((folder) => {
    numbers.forEach((num) => {
      sources.push(`${folder}/${num}.mp3`);
    });
  });
  return shuffle(sources);
}
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

function flash_wrong() {
  const body = document.body;
  body.style.background = "#f7c5c5";
  const audioNo = new Audio("Sounds/no.mp3");
  audioNo.play();
}

function flash_correct() {
  const body = document.body;
  body.style.background = "#c8f7c5";
  const audioYes = new Audio("Sounds/yes.mp3");
  audioYes.play();
}

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

function getLevelFromURL() {
  const params = new URLSearchParams(window.location.search);
  const level = parseInt(params.get("level"));
  if (level <= 10 && level >= 1) {
    return level;
  }
  return 1;
}

function loadCurrentLevel() {
  currentLevel = getLevelFromURL();
  const current_folders = folders[currentLevel - 1];
  randomizedSources = get_sources(current_folders);
  renderBoard(randomizedSources);
}

loadCurrentLevel();
