window._ytFigureQueue = [];
window._ytFigures = [];

window.onYouTubeIframeAPIReady = function () {
  window._ytFigureQueue.forEach((fig) => fig.initPlayer());
  window._ytFigureQueue = [];
};

class Figure {
  constructor(yt_link, start, end, index) {
    this.yt_link = yt_link;
    this.start = start;
    this.end = end;
    this.callback_play;
    this.videoId = this.extractVideoID(yt_link);

    this.player = null;
    this.ytReady = false;
    this.isLoaded = false;

    this.playerId = `yt-player-${index}`;

    this.container = this.create_figure_container(index);
    this.img = this.create_image(index);
    this.button = this.create_play_button();
    this.active = true;
    this.playerDiv = document.createElement("div");
    this.playerDiv.id = this.playerId;

    Object.assign(this.playerDiv.style, {
      position: "absolute",
      width: "200px",
      height: "200px",
      opacity: "0",
      pointerEvents: "none",
    });

    this.container.appendChild(this.img);
    this.container.appendChild(this.button);
    this.container.appendChild(this.playerDiv);

    window._ytFigures.push(this);

    if (typeof YT !== "undefined" && typeof YT.Player === "function") {
      this.initPlayer();
    } else {
      window._ytFigureQueue.push(this);
    }
  }

  getLength() {
    return this.end - this.start;
  }

  initPlayer() {
    if (!document.body.contains(this.playerDiv)) {
      setTimeout(() => this.initPlayer(), 50);
      return;
    }
    if (this.player) return;
    console.log(document.getElementById(this.playerId));
    console.log(document.body.contains(document.getElementById(this.playerId)));
    this.player = new YT.Player(this.playerId, {
      height: "200",
      width: "200",
      videoId: this.videoId,
      playerVars: {
        controls: 0,
        disablekb: 1,
        playsinline: 1,
        autoplay: 0,
      },
      events: {
        onReady: (event) => {
          console.log("YT Ready:", this.playerId);
          this.ytReady = true;
          this.player.seekTo(this.start, false);
          this.player.pauseVideo();
        },

        onStateChange: (event) => {
          if (event.data === YT.PlayerState.PLAYING && !this.isLoaded) {
            this.isLoaded = true;
          }
        },

        onError: (e) => {
          console.error("YT Error:", e);
        },
      },
    });
  }

  create_play_button() {
    const button = document.createElement("button");
    button.className = "play-button";
    button.textContent = "Play";

    button.addEventListener("click", (e) => {
      e.stopPropagation();

      if (!this.ytReady || !this.player) return;
      const state = this.player.getPlayerState();

      if (state !== YT.PlayerState.PLAYING) {
        this.callback_play();
        button.textContent = "Pause";
      } else {
        this.player.pauseVideo();
        button.textContent = "Play";
      }
      this.play();
    });

    return button;
  }

  reset_border() {
    this.img.classList.remove("played");
    this.button.textContent = "Play";
  }

  play(forceSeek = false, bounce = true) {
    if (bounce) {
      this.img.classList.add("played");
    }
    const state = this.player.getPlayerState();

    // On iPhone, re-triggering seekTo(currentTime) can sometimes
    // "reset" the audio focus so the Web Audio API can layer on top.
    if (state !== YT.PlayerState.PLAYING || forceSeek) {
      this.player.seekTo(this.start, true);
      this.player.playVideo();
      this.stopTimer();
    }
  }

  stopTimer() {
    if (this.stopInterval) clearInterval(this.stopInterval);

    this.stopInterval = setInterval(() => {
      if (!this.player) return;

      const current = this.player.getCurrentTime();

      if (current >= this.end) {
        this.player.pauseVideo();
        this.button.textContent = "Play";

        clearInterval(this.stopInterval);
      }
    }, 100);
  }

  extractVideoID(url) {
    const reg =
      /(?:youtube\.com\/.*v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?\/]+)/;

    const match = url.match(reg);

    let videoId = match ? match[1] : url;

    videoId = videoId.split("?")[0];

    return videoId;
  }

  deactivate() {
    this.active = false;
    this.reset_border();
    if (this.button) {
      this.button.disabled = true;
      this.button.style.backgroundColor = "#d3d3d3";
      this.button.style.color = "grey";
      this.button.style.border = "1px solid #bfbfbf";
      this.button.style.backgroundImage = "none";
      this.button.style.webkitAppearance = "none";
      this.button.style.appearance = "none";
    }

    if (this.img) {
      this.img.style.filter = "grayscale(100%)";
    }
  }

  get_container() {
    return this.container;
  }

  create_image(i) {
    const img = document.createElement("img");

    img.className = "figure-img";
    img.src = `Icons/${i + 1}.jpeg`;
    img.alt = `Figure ${i + 1}`;
    img.draggable = false;
    return img;
  }

  create_figure_container(i) {
    const container = document.createElement("div");

    container.className = "audio-figure";
    container.dataset.index = i;

    return container;
  }
}
