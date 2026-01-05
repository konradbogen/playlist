class Figure {
  constructor(audioSrc, index) {
    this.container = this.create_figure_container(index);
    this.img = this.create_image(index);
    this.audio = this.create_audio(audioSrc);
    this.button = this.create_play_button(this.audio);
    this.container.appendChild(this.img);
    this.container.appendChild(this.button);
  }

  get_container() {
    return this.container;
  }

  create_play_button(audio) {
    const button = document.createElement("button");
    button.className = "play-button";
    button.textContent = "Play";

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      if (audio.paused) {
        audio.play();
        button.textContent = "Pause";
        audio.addEventListener("ended", () => (button.textContent = "Play"));
      } else {
        audio.pause();
        button.textContent = "Play";
      }
    });
    return button;
  }

  deactivate() {
    if (this.button) {
      this.button.disabled = true;
    }
    if (this.img) {
      this.img.style.filter = "grayscale(100%)";
    }
    if (this.container) {
      this.container.style.backgroundColor = "grey";
    }
  }

  create_audio(audioSrc) {
    const baseHost = window.location.hostname;
    const isProd =
      baseHost === "konradbogen.com" || baseHost === "www.konradbogen.com";
    const needsPrefix = !isProd && !/^(https?:|\/\/|file:|\/)/.test(audioSrc);
    const audio = new Audio(
      needsPrefix ? "/play_content/" + audioSrc : "/play/" + audioSrc
    );
    audio.preload = "auto";
    return audio;
  }

  create_image(i) {
    const img = document.createElement("img");
    img.className = "figure-img";
    img.src = `Icons/${i + 1}.jpeg`;
    img.alt = `Figure ${i + 1}`;
    return img;
  }

  create_figure_container(i) {
    const container = document.createElement("div");
    container.className = "audio-figure";
    container.dataset.index = i;
    return container;
  }
}
