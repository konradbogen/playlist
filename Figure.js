class Figure {
  /**
   * Represents an audio figure composed of an image, an audio element and a play/pause button.
   *
   * @class Figure
   * @param {string} audioSrc - Path or URL to the audio source.
   * @param {number} index - Zero-based index used to select the image and identify the container.
   */
  constructor(audioSrc, index) {
    this.container = this.create_figure_container(index);
    this.img = this.create_image(index);
    this.audio = this.create_audio(audioSrc);
    this.button = this.create_play_button(this.audio);
    this.container.appendChild(this.img);
    this.container.appendChild(this.button);
  }

  get_container() {
    /**
     * Get the root container element for this figure.
     *
     * @returns {HTMLDivElement} The figure container element.
     */

    return this.container;
  }

  create_play_button(audio) {
    /**
     * Create a play/pause button wired to the provided audio element.
     *
     * @param {HTMLAudioElement} audio - The audio element to control.
     * @returns {HTMLButtonElement} The created play/pause button element.
     */
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
    /**
     * Deactivate the figure: disable the button, gray out the image and change container background.
     *
     * @returns {void}
     */

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
    /**
     * Create and configure an HTMLAudioElement for the given source, handling environment-aware path prefixing.
     *
     * @param {string} audioSrc - Audio file path or URL.
     * @returns {HTMLAudioElement} A preloaded audio element.
     */

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
    /**
     * Create an img element for the figure using the provided index to choose the image and alt text.
     *
     * @param {number} i - Zero-based index to select the image file and alt text.
     * @returns {HTMLImageElement} The created image element.
     */
    const img = document.createElement("img");
    img.className = "figure-img";
    img.src = `Icons/${i + 1}.jpeg`;
    img.alt = `Figure ${i + 1}`;
    return img;
  }

  create_figure_container(i) {
    /**
     * Create the figure container element and set its dataset index.
     *
     * @param {number} i - Zero-based index to assign to the container's data-index.
     * @returns {HTMLDivElement} The created container element.
     */
    const container = document.createElement("div");
    container.className = "audio-figure";
    container.dataset.index = i;
    return container;
  }
}
