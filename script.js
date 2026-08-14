"use strict";

(() => {
  const data = window.PORTFOLIO;
  if (!data) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.getElementById("siteHeader");
  const hero = document.querySelector(".hero-sequence");
  const archive = document.getElementById("selected-work");
  const recovery = document.getElementById("resume");
  const recoveryConsole = document.getElementById("recoveryConsole");
  const carouselRoot = document.getElementById("featuredCarousels");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const activeCarousels = [];
  let recoveryControl = null;

  const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));

  const pad = (value) => String(value).padStart(2, "0");

  const escapeHTML = (value = "") =>
    value.replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    })[char]);

  function initMenu() {
    if (!menuToggle || !mobileMenu) return;

    const closeMenu = (restoreFocus = false) => {
      const shouldRestoreFocus =
        restoreFocus &&
        mobileMenu.contains(document.activeElement);

      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      mobileMenu.classList.remove("open");
      mobileMenu.inert = true;
      mobileMenu.hidden = true;
      document.body.classList.remove("menu-open");

      if (shouldRestoreFocus) {
        menuToggle.focus();
      }
    };

    closeMenu();

    const settleMenu = () => {
      if (!mobileMenu.classList.contains("open")) {
        mobileMenu.hidden = true;
      }
    };

    requestAnimationFrame(settleMenu);
    setTimeout(settleMenu, 0);

    menuToggle.addEventListener("click", () => {
      const opening =
        menuToggle.getAttribute("aria-expanded") !== "true";

      mobileMenu.hidden = false;

      menuToggle.setAttribute(
        "aria-expanded",
        String(opening)
      );

      menuToggle.setAttribute(
        "aria-label",
        opening ? "Close navigation" : "Open navigation"
      );

      mobileMenu.classList.toggle("open", opening);
      mobileMenu.inert = !opening;

      if (!opening) {
        mobileMenu.hidden = true;
      }

      document.body.classList.toggle("menu-open", opening);
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeMenu());
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu(true);
      }
    });

    const desktopMenu =
      window.matchMedia("(min-width: 1001px)");

    const closeAfterResize = (event) => {
      if (event.matches) {
        closeMenu();
      }
    };

    desktopMenu.addEventListener?.(
      "change",
      closeAfterResize
    );
  }

  function initHeroSequence() {
    if (!hero || !header) return;

    const mobileCorruption = window.matchMedia("(max-width: 767px)");
    const heroStatusText = hero.querySelector(".hero-kicker > span");
    let corruptionComplete = false;
    let ticking = false;

    const setCorruptionComplete = (nextState) => {
      if (nextState === corruptionComplete) return;
      corruptionComplete = nextState;
      hero.classList.toggle("is-corruption-complete", nextState);
      if (heroStatusText) {
        heroStatusText.textContent = nextState
          ? "STATUS: HACKED"
          : "STATUS: ONLINE";
      }
    };

    const update = () => {
      const rect = hero.getBoundingClientRect();
      const total = Math.max(
        1,
        rect.height - window.innerHeight
      );

      const progress = reducedMotion.matches
        ? clamp(-rect.top / Math.max(1, total * 0.65))
        : clamp(-rect.top / total);

      document.documentElement.style.setProperty(
        "--corruption",
        progress.toFixed(4)
      );

      const corruptionExitThreshold = 0.92;
      const corruptionEnterThreshold = 0.985;
      const shouldCompleteCorruption =
        mobileCorruption.matches &&
        progress >= (
          corruptionComplete
            ? corruptionExitThreshold
            : corruptionEnterThreshold
        );

      setCorruptionComplete(shouldCompleteCorruption);

      if (recoveryConsole) {
        const consoleProgress = recoveryControl
          ? recoveryControl.getScrollProgress()
          : 0;

        document.documentElement.style.setProperty(
          "--recovery-progress",
          consoleProgress.toFixed(4)
        );

        recoveryControl?.syncFromScroll(
          consoleProgress
        );
      }

      const archiveRect =
        archive?.getBoundingClientRect();

      const recoveryRect =
        recovery?.getBoundingClientRect();

      const recoveryHasStarted =
        recoveryRect &&
        recoveryRect.top <= window.innerHeight;

      const nearDocumentEnd =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 4;

      const inRecovery =
        recoveryHasStarted || nearDocumentEnd;

      const inArchive =
        archiveRect &&
        archiveRect.top <= window.innerHeight * 0.45 &&
        !inRecovery;

      const transitionHasTurnedDark =
        progress > 0.58 && !inRecovery;

      header.classList.toggle(
        "archive-mode",
        Boolean(inArchive || transitionHasTurnedDark)
      );

      header.classList.toggle(
        "recovery-mode",
        Boolean(inRecovery)
      );

      ticking = false;
    };

    const requestUpdate = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    addEventListener(
      "scroll",
      requestUpdate,
      { passive: true }
    );

    addEventListener(
      "resize",
      requestUpdate,
      { passive: true }
    );

    addEventListener(
      "hashchange",
      requestUpdate
    );

    reducedMotion.addEventListener?.(
      "change",
      requestUpdate
    );

    mobileCorruption.addEventListener?.(
      "change",
      requestUpdate
    );

    update();
  }

  function initRecoveryControl() {
    const panel = document.getElementById("restorePanel");
    const track = document.getElementById("restoreTrack");
    const handle = document.getElementById("restoreHandle");
    const integrity = document.getElementById("restoreIntegrity");
    const label = document.getElementById("restoreLabel");
    const help = document.getElementById("restoreHelp");
    const consoleAnchor = document.getElementById("recoveryConsoleAnchor");
    const recoveryModeTarget = document.getElementById("recoveryModeTitle");
    const recoveryTransition = recoveryModeTarget?.closest(".recovery-transition");
    if (
      !panel ||
      !track ||
      !handle ||
      !integrity ||
      !label ||
      !help ||
      !consoleAnchor ||
      !recoveryModeTarget ||
      !recoveryTransition ||
      !recoveryConsole ||
      !recovery
    ) return null;

    const AUTO_SCROLL_DURATION = 2000;
    const defaultHelp = help.textContent;
    const interruptKeys = new Set([
      "ArrowUp",
      "ArrowDown",
      "PageUp",
      "PageDown",
      "Home",
      "End",
      " ",
    ]);
    const sliderControlKeys = new Set([
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
    ]);
    let sliderProgress = 0;
    let pointerId = null;
    let dragBounds = null;
    let dragOffset = 0;
    let renderFrame = 0;
    let pendingProgress = null;
    let autoFrame = 0;
    let autoScrolling = false;
    let completed = false;
    let previousScrollBehavior = "";
    let expectedAutoY = null;
    let scrollCheckFrame = 0;

    const getRecoveryDestination = () => {
      const maximumY = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const headerClearance = header.offsetHeight;
      const transitionTop =
        window.scrollY + recoveryTransition.getBoundingClientRect().top;
      const targetCenter =
        transitionTop +
        recoveryModeTarget.offsetTop +
        recoveryModeTarget.offsetHeight / 2;
      const availableViewport = Math.max(
        1,
        window.innerHeight - headerClearance
      );
      const visibleViewportCenter =
        headerClearance + availableViewport / 2;

      return clamp(
        targetCenter - visibleViewportCenter,
        0,
        maximumY
      );
    };

    const getScrollProgress = () => {
      const anchorTop =
        window.scrollY + consoleAnchor.getBoundingClientRect().top;
      const availableViewport = Math.max(
        1,
        window.innerHeight - header.offsetHeight
      );
      const start =
        anchorTop -
        header.offsetHeight -
        availableViewport * 0.28;
      const end = Math.max(start + 1, getRecoveryDestination());
      return clamp((window.scrollY - start) / (end - start));
    };

    const renderSlider = (value) => {
      sliderProgress = clamp(value);
      const percentage = Math.round(sliderProgress * 100);
      const travel = Math.max(0, track.clientWidth - handle.offsetWidth - 12);
      document.documentElement.style.setProperty("--restore-fill", `${sliderProgress * 100}%`);
      document.documentElement.style.setProperty("--restore-x", `${sliderProgress * travel}px`);
      handle.setAttribute("aria-valuenow", String(percentage));
      integrity.textContent = `SYSTEM INTEGRITY: ${percentage}%`;
    };

    const queueSlider = (value) => {
      pendingProgress = clamp(value);
      if (renderFrame) return;
      renderFrame = requestAnimationFrame(() => {
        renderFrame = 0;
        if (pendingProgress === null) return;
        const next = pendingProgress;
        pendingProgress = null;
        renderSlider(next);
      });
    };

    const restoreAvailableState = () => {
      completed = false;
      panel.classList.remove("is-running", "is-complete");
      handle.removeAttribute("aria-disabled");
      label.textContent = "SLIDE TO RECOVER";
      help.textContent = defaultHelp;
    };

    const markComplete = () => {
      completed = true;
      panel.classList.remove("is-running");
      panel.classList.add("is-complete");
      handle.setAttribute("aria-disabled", "true");
      renderSlider(1);
      document.documentElement.style.setProperty("--recovery-progress", "1");
      integrity.textContent = "SYSTEM INTEGRITY: 100%";
      label.textContent = "RECOVERY COMPLETE";
      help.textContent = "DOM:CLOUD restored";
    };

    const cancelAutoRecovery = () => {
      if (!autoScrolling) return;
      autoScrolling = false;
      cancelAnimationFrame(autoFrame);
      autoFrame = 0;
      expectedAutoY = null;
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
      restoreAvailableState();
      const progress = getScrollProgress();
      document.documentElement.style.setProperty(
        "--recovery-progress",
        progress.toFixed(4)
      );
      renderSlider(progress);
    };

    const startAutoRecovery = () => {
      if (autoScrolling || completed) return;
      autoScrolling = true;
      panel.classList.add("is-running");
      handle.setAttribute("aria-disabled", "true");
      label.textContent = "RECOVERY SEQUENCE RUNNING";
      help.textContent = "Scanning and rebuilding DOM:CLOUD";

      const initialProgress = getScrollProgress();
      document.documentElement.style.setProperty(
        "--recovery-progress",
        initialProgress.toFixed(4)
      );
      renderSlider(initialProgress);

      const startY = window.scrollY;
      const targetY = getRecoveryDestination();
      const startTime = performance.now();
      previousScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";

      if (reducedMotion.matches || targetY <= startY + 1) {
        expectedAutoY = targetY;
        window.scrollTo(0, targetY);
        autoScrolling = false;
        expectedAutoY = null;
        document.documentElement.style.scrollBehavior = previousScrollBehavior;
        markComplete();
        return;
      }

      const advance = (time) => {
        if (!autoScrolling) return;
        const elapsed = clamp((time - startTime) / AUTO_SCROLL_DURATION);
        expectedAutoY = startY + (targetY - startY) * elapsed;
        window.scrollTo(0, expectedAutoY);
        if (elapsed < 1) {
          autoFrame = requestAnimationFrame(advance);
          return;
        }
        autoScrolling = false;
        autoFrame = 0;
        expectedAutoY = null;
        document.documentElement.style.scrollBehavior = previousScrollBehavior;
        window.scrollTo(0, targetY);
        markComplete();
      };

      autoFrame = requestAnimationFrame(advance);
    };

    const pointerProgress = (clientX) => {
      if (!dragBounds) return sliderProgress;
      const travel = Math.max(1, dragBounds.width - handle.offsetWidth - 12);
      return clamp((clientX - dragBounds.left - 6 - dragOffset) / travel);
    };

    const endDrag = (event, commit) => {
      if (pointerId === null || (event && event.pointerId !== pointerId)) return;
      if (renderFrame) {
        cancelAnimationFrame(renderFrame);
        renderFrame = 0;
      }
      if (pendingProgress !== null) {
        renderSlider(pendingProgress);
        pendingProgress = null;
      }
      const completedDrag = commit && sliderProgress >= 0.995;
      if (handle.hasPointerCapture?.(pointerId)) {
        handle.releasePointerCapture(pointerId);
      }
      pointerId = null;
      dragBounds = null;
      document.body.classList.remove("restore-dragging");
      if (completedDrag) {
        renderSlider(1);
        startAutoRecovery();
      }
    };

    handle.addEventListener("pointerdown", (event) => {
      if (completed || autoScrolling || pointerId !== null) return;
      pointerId = event.pointerId;
      dragBounds = track.getBoundingClientRect();
      dragOffset = event.clientX - handle.getBoundingClientRect().left;
      handle.setPointerCapture?.(pointerId);
      document.body.classList.add("restore-dragging");
      event.preventDefault();
    });

    const moveDrag = (event) => {
      if (event.pointerId !== pointerId) return;
      queueSlider(pointerProgress(event.clientX));
      event.preventDefault();
    };

    window.addEventListener("pointermove", moveDrag, { passive: false });
    window.addEventListener("pointerup", (event) => endDrag(event, true));
    window.addEventListener("pointercancel", (event) => endDrag(event, false));
    window.addEventListener("resize", () => {
      if (pointerId !== null) {
        endDrag(null, false);
      }
    }, { passive: true });

    handle.addEventListener("keydown", (event) => {
      if (completed || autoScrolling) return;
      const currentProgress = pendingProgress ?? sliderProgress;
      let next = null;
      if (event.key === "ArrowLeft") next = currentProgress - 0.02;
      if (event.key === "ArrowRight") next = currentProgress + 0.02;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = 1;
      if (next === null) return;
      event.preventDefault();
      if (next >= 1) {
        if (renderFrame) {
          cancelAnimationFrame(renderFrame);
          renderFrame = 0;
        }
        pendingProgress = null;
        renderSlider(1);
        startAutoRecovery();
        return;
      }
      queueSlider(next);
    });

    const interruptAutoRecovery = (event) => {
      if (
        !autoScrolling ||
        (
          event?.type === "keydown" &&
          event.target === handle &&
          sliderControlKeys.has(event.key)
        )
      ) return;
      cancelAutoRecovery();
    };

    window.addEventListener("wheel", interruptAutoRecovery, { passive: true });
    window.addEventListener("touchstart", interruptAutoRecovery, { passive: true });
    window.addEventListener("touchmove", interruptAutoRecovery, { passive: true });
    window.addEventListener("pointerdown", interruptAutoRecovery, { passive: true });
    window.addEventListener("keydown", (event) => {
      if (interruptKeys.has(event.key)) interruptAutoRecovery(event);
    });
    window.addEventListener("scroll", () => {
      if (!autoScrolling || expectedAutoY === null || scrollCheckFrame) return;
      scrollCheckFrame = requestAnimationFrame(() => {
        scrollCheckFrame = 0;
        if (
          autoScrolling &&
          expectedAutoY !== null &&
          Math.abs(window.scrollY - expectedAutoY) > 48
        ) {
          cancelAutoRecovery();
        }
      });
    }, { passive: true });

    renderSlider(0);
    return {
      getScrollProgress,
      syncFromScroll(progress) {
        if (pointerId !== null) return;
        renderSlider(progress);
        if (autoScrolling) return;
        if (progress >= 0.999) {
          if (!completed) markComplete();
        } else if (completed) {
          restoreAvailableState();
        }
      },
    };
  }

  function renderFeaturedCarousels() {
    if (!carouselRoot) return;

    const categories = [
      {
        key: "web",
        label: "Web",
        eyebrow: "HTML / CSS / JS",
      },
      {
        key: "graphic",
        label: "Graphic",
        eyebrow: "Photoshop / AI",
      },
      {
        key: "video",
        label: "Video",
        eyebrow: "Moving Image / Editing",
      },
      {
        key: "audio",
        label: "Audio",
        eyebrow:
          "Ableton Live Suite / Serum / Ozone",
      },
    ];

    carouselRoot.innerHTML = categories
      .map(({ key, label, eyebrow }) => {
        const items = data.featured[key];

        return `
          <section
            class="portfolio-carousel"
            id="${key}"
            role="region"
            aria-labelledby="${key}Heading"
            aria-roledescription="carousel"
            data-category="${key}"
          >
            <header class="carousel-heading">
              <div>
                <p class="eyebrow">
                  ${escapeHTML(eyebrow)}
                </p>

                <h2 id="${key}Heading">
                  ${escapeHTML(label)}
                </h2>
              </div>

              <img
                class="section-corrupt-logo"
                src="images/domcloud_logo_corrupted.webp"
                alt=""
                width="2390"
                height="1350"
                loading="lazy"
                decoding="async"
              />

              <span
                class="carousel-heading-status status-indicator"
              >
                <span>Status: Hacked</span>
                <i aria-hidden="true"></i>
              </span>
            </header>

            <div class="carousel-shell">
              <div class="carousel-viewport">
                <div
                  class="carousel-track"
                  tabindex="0"
                  aria-label="${escapeHTML(label)} projects"
                >
                  ${items
                    .map((item, index) =>
                      renderSlide(
                        key,
                        item,
                        index,
                        items.length
                      )
                    )
                    .join("")}
                </div>
              </div>

              <button
                class="carousel-arrow carousel-prev"
                type="button"
                aria-label="Previous ${escapeHTML(label)} project"
              >
                ←
              </button>

              <button
                class="carousel-arrow carousel-next"
                type="button"
                aria-label="Next ${escapeHTML(label)} project"
              >
                →
              </button>

              <div class="carousel-status">
                <span
                  class="carousel-counter"
                  aria-live="polite"
                >
                  <b>01</b> / ${pad(items.length)}
                </span>

                <div
                  class="carousel-progress"
                  aria-hidden="true"
                >
                  <span></span>
                </div>
              </div>
            </div>
          </section>
        `;
      })
      .join("");

    carouselRoot
      .querySelectorAll(".portfolio-carousel")
      .forEach((element) => {
        activeCarousels.push(
          new Carousel(element)
        );
      });

    initMediaPreviews();
  }

  function renderSlide(
    category,
    item,
    index,
    total
  ) {
    const title = escapeHTML(item.title);

    const subtitle = escapeHTML(
      item.subtitle || "Selected work"
    );

    const technique = escapeHTML(
      item.technique ||
      item.type ||
      item.service ||
      "Selected work"
    );

    let media = "";

    if (
      category === "web" ||
      category === "graphic"
    ) {
      media = `
        <button
          class="slide-media image-trigger"
          type="button"
          style="--slide-bg: url('${escapeHTML(item.image)}')"
          data-image="${escapeHTML(item.image)}"
          data-title="${title}"
          data-meta="${technique}"
          aria-label="Open ${title} in image viewer"
        >
          <img
            src="${escapeHTML(item.image)}"
            alt="${title}"
            loading="lazy"
            decoding="async"
          />
        </button>
      `;
    } else if (category === "video") {
      const background = item.thumb
        ? ` style="background-image:url('${escapeHTML(item.thumb)}')"`
        : "";

      const thumbClass =
        item.thumb ? " has-thumb" : "";

      media = `
        <div class="slide-media video-media">
          <button
            class="media-preview${thumbClass}"
            type="button"
            data-embed="${escapeHTML(item.embed)}"
            data-service="${escapeHTML(item.service)}"
            data-ratio="${escapeHTML(item.ratio)}"
            aria-label="Load ${title} ${escapeHTML(item.service)} player"
            ${background}
          >
            <span class="media-preview-copy">
              <small class="media-service">
                ${escapeHTML(item.service)}
              </small>

              <strong>${title}</strong>

              <i
                class="play-symbol"
                aria-hidden="true"
              >
                ▶
              </i>

              <small>Load player</small>
            </span>
          </button>
        </div>
      `;
    } else if (category === "audio") {
      const bars = Array.from(
        { length: 18 },
        (_, barIndex) =>
          `<i style="--i:${(barIndex * 7) % 12}"></i>`
      ).join("");

      media = `
        <div class="slide-media audio-media">
          <button
            class="audio-preview"
            type="button"
            style="--audio-accent:${escapeHTML(item.accent)}"
            data-soundcloud="${escapeHTML(item.soundcloud)}"
            aria-label="Load ${title} SoundCloud player"
          >
            <span class="audio-preview-copy">
              <small>SoundCloud archive</small>

              <strong>${title}</strong>

              <span
                class="audio-wave"
                aria-hidden="true"
              >
                ${bars}
              </span>

              <small>Load player</small>
            </span>
          </button>
        </div>
      `;
    }

    const externalLink = item.href
      ? `
        <a
          href="${escapeHTML(item.href)}"
          target="_blank"
          rel="noopener"
        >
          Open project ↗
        </a>
      `
      : item.soundcloud
        ? `
          <a
            href="${escapeHTML(item.soundcloud)}"
            target="_blank"
            rel="noopener"
          >
            Open SoundCloud ↗
          </a>
        `
        : "";

    return `
      <article
        class="carousel-slide${index === 0 ? " is-active" : ""}"
        role="group"
        aria-label="Slide ${index + 1} of ${total}"
        data-index="${index}"
      >
        ${media}

        <div class="slide-caption">
          <div>
            <p>
              ${technique} / ${subtitle}
            </p>

            <h3>${title}</h3>
          </div>

          ${externalLink}
        </div>
      </article>
    `;
  }

  class Carousel {
    constructor(element) {
      this.element = element;

      this.track =
        element.querySelector(".carousel-track");

      this.shell =
        element.querySelector(".carousel-shell");

      this.slides = [
        ...element.querySelectorAll(
          ".carousel-slide"
        ),
      ];

      this.prev =
        element.querySelector(".carousel-prev");

      this.next =
        element.querySelector(".carousel-next");

      this.counter =
        element.querySelector(".carousel-counter");

      this.progress =
        element.querySelector(
          ".carousel-progress span"
        );

      this.index = 0;
      this.scrollTimer = 0;
      this.glitchTimer = 0;
      this.glitchToken = 0;

      this.prev.addEventListener(
        "click",
        () => this.goTo(this.index - 1, true)
      );

      this.next.addEventListener(
        "click",
        () => this.goTo(this.index + 1, true)
      );

      this.track.addEventListener(
        "keydown",
        (event) => this.onKeydown(event)
      );

      this.track.addEventListener(
        "scroll",
        () => this.onScroll(),
        { passive: true }
      );

      this.update(false);
    }

    onKeydown(event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.goTo(this.index - 1, true);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        this.goTo(this.index + 1, true);
      } else if (event.key === "Home") {
        event.preventDefault();
        this.goTo(0, true);
      } else if (event.key === "End") {
        event.preventDefault();

        this.goTo(
          this.slides.length - 1,
          true
        );
      }
    }

    onScroll() {
      clearTimeout(this.scrollTimer);

      this.scrollTimer = setTimeout(() => {
        const trackCenter =
          this.track.scrollLeft +
          this.track.clientWidth / 2;

        let nearest = 0;
        let distance = Infinity;

        this.slides.forEach(
          (slide, index) => {
            const center =
              slide.offsetLeft +
              slide.offsetWidth / 2;

            const currentDistance =
              Math.abs(center - trackCenter);

            if (currentDistance < distance) {
              nearest = index;
              distance = currentDistance;
            }
          }
        );

        if (nearest !== this.index) {
          this.index = nearest;
          this.update(false);
        }
      }, 80);
    }

    goTo(index, deliberate = false) {
      const nextIndex = clamp(
        index,
        0,
        this.slides.length - 1
      );

      if (
        nextIndex === this.index &&
        deliberate
      ) {
        return;
      }

      this.index = nextIndex;

      this.slides[this.index].scrollIntoView({
        behavior: reducedMotion.matches
          ? "auto"
          : "smooth",
        block: "nearest",
        inline: "center",
      });

      this.update(deliberate);
    }

    update(deliberate) {
      this.slides.forEach((slide, index) => {
        slide.classList.toggle(
          "is-active",
          index === this.index
        );
      });

      this.prev.disabled =
        this.index === 0;

      this.next.disabled =
        this.index ===
        this.slides.length - 1;

      this.counter.innerHTML = `
        <b>${pad(this.index + 1)}</b>
        / ${pad(this.slides.length)}
      `;

      const progress =
        this.slides.length === 1
          ? 100
          : (
              this.index /
              (this.slides.length - 1)
            ) * 100;

      this.progress.style.setProperty(
        "--progress",
        `${progress}%`
      );

      if (
        deliberate &&
        !reducedMotion.matches
      ) {
        const token = ++this.glitchToken;

        clearTimeout(this.glitchTimer);

        this.shell.classList.remove(
          "glitch-burst"
        );

        void this.shell.offsetWidth;

        this.shell.classList.add(
          "glitch-burst"
        );

        this.glitchTimer = setTimeout(() => {
          if (token === this.glitchToken) {
            this.shell.classList.remove(
              "glitch-burst"
            );
          }
        }, 260);
      }
    }
  }

  function initMediaPreviews() {
    const videoButtons = [
      ...document.querySelectorAll(
        ".media-preview"
      ),
    ];

    const audioButtons = [
      ...document.querySelectorAll(
        ".audio-preview"
      ),
    ];

    videoButtons.forEach((button) => {
      button.addEventListener(
        "click",
        () => loadVideo(button),
        { once: true }
      );
    });

    audioButtons.forEach((button) => {
      button.addEventListener(
        "click",
        () => loadSoundCloud(button),
        { once: true }
      );
    });

    /*
     * Automatically load the first Instagram
     * player found in the video carousel.
     */
    const firstInstagram =
      videoButtons.find((button) =>
        button.dataset.service
          ?.toLowerCase()
          .includes("instagram")
      );

    if (firstInstagram) {
      loadVideo(firstInstagram, true);
    }

    /*
     * Automatically load the first
     * SoundCloud player.
     */
    if (audioButtons[0]) {
      loadSoundCloud(
        audioButtons[0],
        true
      );
    }
  }

  function loadVideo(
    button,
    eager = false
  ) {
    if (!button?.isConnected) return;

    const embed = button.dataset.embed;

    if (!embed) return;

    const ratio =
      button.dataset.ratio === "portrait"
        ? "portrait-frame"
        : "landscape-frame";

    const title =
      button
        .getAttribute("aria-label")
        ?.replace(/^Load /, "") ||
      "Embedded video";

    const frame =
      document.createElement("iframe");

    frame.className = ratio;
    frame.src = embed;
    frame.title = title;

    frame.loading =
      eager ? "eager" : "lazy";

    frame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

    frame.allowFullscreen = true;

    button.replaceWith(frame);
  }

  function loadSoundCloud(
    button,
    eager = false
  ) {
    if (!button?.isConnected) return;

    const profile =
      button.dataset.soundcloud;

    if (!profile) return;

    const frame =
      document.createElement("iframe");

    const params =
      new URLSearchParams({
        url: profile,

        color:
          button.style.getPropertyValue(
            "--audio-accent"
          ) || "#ff3434",

        auto_play: "false",
        hide_related: "false",
        show_comments: "false",
        show_user: "true",
        show_reposts: "false",
        show_teaser: "true",
        visual: "true",
      });

    frame.src =
      `https://w.soundcloud.com/player/?${params.toString()}`;

    frame.title =
      `${
        button.querySelector("strong")
          ?.textContent || "SoundCloud"
      } player`;

    frame.loading =
      eager ? "eager" : "lazy";

    frame.allow = "autoplay";
    frame.scrolling = "no";

    button.replaceWith(frame);
  }

  function initSectionObserver() {
    const links = [
      ...document.querySelectorAll(
        ".archive-tabs a, .desktop-nav a"
      ),
    ];

    const sections = [
      "selected-work",
      "web",
      "graphic",
      "video",
      "audio",
      "resume",
    ]
      .map((id) =>
        document.getElementById(id)
      )
      .filter(Boolean);

    if (!sections.length) return;

    const observer =
      new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter(
              (entry) =>
                entry.isIntersecting
            )
            .sort(
              (a, b) =>
                b.intersectionRatio -
                a.intersectionRatio
            )[0];

          if (!visible) return;

          const id = visible.target.id;

          links.forEach((link) => {
            link.classList.toggle(
              "active",
              link.getAttribute("href") ===
                `#${id}`
            );
          });
        },
        {
          rootMargin:
            "-30% 0px -55%",
          threshold: [
            0.01,
            0.2,
            0.5,
          ],
        }
      );

    sections.forEach((section) => {
      observer.observe(section);
    });
  }

  function initLightbox() {
    const dialog =
      document.getElementById("lightbox");

    const image =
      document.getElementById(
        "lightboxImage"
      );

    const title =
      document.getElementById(
        "lightboxTitle"
      );

    const meta =
      document.getElementById(
        "lightboxMeta"
      );

    if (
      !dialog ||
      !image ||
      !title ||
      !meta
    ) {
      return;
    }

    let triggers = [];
    let index = 0;

    const open = (trigger) => {
      triggers = [
        ...document.querySelectorAll(
          ".image-trigger"
        ),
      ];

      index = Math.max(
        0,
        triggers.indexOf(trigger)
      );

      render();
      dialog.showModal();

      document.body.classList.add(
        "lightbox-open"
      );
    };

    const render = () => {
      const trigger = triggers[index];

      if (!trigger) return;

      image.src =
        trigger.dataset.image;

      image.alt =
        trigger.dataset.title;

      title.textContent =
        trigger.dataset.title;

      meta.textContent =
        `${trigger.dataset.meta} / ` +
        `${pad(index + 1)} of ` +
        `${pad(triggers.length)}`;
    };

    document.addEventListener(
      "click",
      (event) => {
        const trigger =
          event.target.closest(
            ".image-trigger"
          );

        if (trigger) {
          open(trigger);
        }
      }
    );

    dialog
      .querySelector(
        ".lightbox-close"
      )
      .addEventListener(
        "click",
        () => dialog.close()
      );

    dialog
      .querySelector(
        ".lightbox-prev"
      )
      .addEventListener(
        "click",
        () => {
          index =
            (
              index -
              1 +
              triggers.length
            ) % triggers.length;

          render();
        }
      );

    dialog
      .querySelector(
        ".lightbox-next"
      )
      .addEventListener(
        "click",
        () => {
          index =
            (index + 1) %
            triggers.length;

          render();
        }
      );

    dialog.addEventListener(
      "click",
      (event) => {
        if (event.target === dialog) {
          dialog.close();
        }
      }
    );

    dialog.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "ArrowLeft") {
          index =
            (
              index -
              1 +
              triggers.length
            ) % triggers.length;

          render();
        } else if (
          event.key === "ArrowRight"
        ) {
          index =
            (index + 1) %
            triggers.length;

          render();
        }
      }
    );

    dialog.addEventListener(
      "close",
      () => {
        document.body.classList.remove(
          "lightbox-open"
        );

        image.removeAttribute("src");
      }
    );
  }

  initMenu();
  recoveryControl = initRecoveryControl();
  initHeroSequence();
  renderFeaturedCarousels();
  initSectionObserver();
  initLightbox();

  const settleLocation = () => {
    const targetId =
      decodeURIComponent(
        location.hash.slice(1)
      );

    const target =
      targetId &&
      document.getElementById(targetId);

    if (target) {
      target.scrollIntoView({
        block: "start",
      });
    }
  };

  requestAnimationFrame(() => {
    if (
      mobileMenu &&
      !mobileMenu.classList.contains("open")
    ) {
      mobileMenu.hidden = true;
    }

    settleLocation();

    window.dispatchEvent(
      new Event("scroll")
    );
  });

  setTimeout(() => {
    if (
      mobileMenu &&
      !mobileMenu.classList.contains("open")
    ) {
      mobileMenu.hidden = true;
    }

    settleLocation();

    window.dispatchEvent(
      new Event("scroll")
    );
  }, 500);
})();
