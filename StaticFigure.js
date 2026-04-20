window._ytFigureQueue = [];
window._ytFigures = [];

window.onYouTubeIframeAPIReady = function () {
  window._ytFigureQueue.forEach((fig) => fig.initPlayer());
  window._ytFigureQueue = [];
};

class StaticFigure extends Figure {
  constructor(yt_link, start, end, index) {
    super(index);
    this.yt_link = yt_link;
    this.start = start;
    this.end = end;
    if (this.yt_link) {
      this.videoId = this.extractVideoID(yt_link);
    }

    this.player = null;
    this.ytReady = false;
    this.isLoaded = false;

    this.playerId = `yt-player-${index}`;

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

  play(forceSeek = false, bounce = true) {
    if (bounce) {
      this.img.classList.add("played");
    }
    if (!this.ytReady || !this.player) return;
    const state = this.player.getPlayerState();

    if (state !== YT.PlayerState.PLAYING) {
      this.callback_play();
      button.textContent = "Pause";
    } else {
      this.pause();
    }

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
}
