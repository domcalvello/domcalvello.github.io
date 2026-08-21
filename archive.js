"use strict";

(() => {
  const source = window.PORTFOLIO;
  const imageAssets = window.IMAGE_ASSETS || {};
  const gallery = document.getElementById("archiveGrid");
  const count = document.getElementById("resultCount");
  const familySelect = document.getElementById("familySelect");
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  if (!source || !gallery || !count || !familySelect) return;

  const escapeHTML = (value = "") => value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[char]);
  const pad = (value) => String(value).padStart(2, "0");
  const getImageAsset = (path) => imageAssets[path] || {
    thumb: path,
    width: 1,
    height: 1,
    thumbWidth: 1,
    thumbHeight: 1,
  };

  const aiItems = source.archive.aiFamilies.flatMap((family) => {
    const start = Number.isInteger(family.start) ? family.start : 1;
    return Array.from({ length: family.count }, (_, offset) => {
      const number = start + offset;
      return {
        category: "ai",
        family: family.key,
        familyTitle: family.title,
        title: `${family.title} ${pad(number)}`,
        image: `images/${family.key}${number}.webp`,
      };
    });
  });

  const traditionalItems = source.archive.traditional.map((filename, index) => ({
    category: "traditional",
    family: "traditional",
    familyTitle: "Graphic Design",
    title: filename.replace(/\.(webp|jpg)$/i, "").replace(/[-_]/g, " "),
    image: `images/graphics/${filename}`,
    index,
  }));

  const webItems = source.featured.web.map((item) => ({
    ...item,
    category: "web",
    family: "web",
    familyTitle: "Web Project",
  }));

  const items = [...webItems, ...traditionalItems, ...aiItems];
  let filter = "all";
  let family = "all";
  let visibleItems = items;
  let thumbnailObserver = null;

  source.archive.aiFamilies.forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.key;
    option.textContent = `${entry.title} (${entry.count})`;
    familySelect.append(option);
  });

  const finishThumbnail = (image) => {
    const media = image.closest("button, .card-media");
    media?.classList.remove("is-loading");
    media?.classList.add("is-loaded");
  };

  const loadThumbnail = (image) => {
    const path = image.dataset.src;
    if (!path) return;
    image.addEventListener("load", () => finishThumbnail(image), { once: true });
    image.addEventListener("error", () => finishThumbnail(image), { once: true });
    image.src = path;
    image.removeAttribute("data-src");
    if (image.complete && image.naturalWidth) finishThumbnail(image);
  };

  const prepareThumbnails = () => {
    thumbnailObserver?.disconnect();
    thumbnailObserver = null;

    const images = [...gallery.querySelectorAll("img")];
    images.forEach((image) => {
      if (image.complete && image.naturalWidth) {
        finishThumbnail(image);
      } else if (!image.dataset.src) {
        image.addEventListener("load", () => finishThumbnail(image), { once: true });
        image.addEventListener("error", () => finishThumbnail(image), { once: true });
      }
    });

    const pending = images.filter((image) => image.dataset.src);
    if (!("IntersectionObserver" in window)) {
      pending.forEach(loadThumbnail);
      return;
    }

    thumbnailObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        loadThumbnail(entry.target);
        thumbnailObserver?.unobserve(entry.target);
      });
    }, { rootMargin: "600px 0px", threshold: 0.01 });

    pending.forEach((image) => thumbnailObserver.observe(image));
  };

  function render() {
    visibleItems = items.filter((item) => {
      const matchesFilter = filter === "all" || item.category === filter;
      const matchesFamily = family === "all" || item.family === family;
      return matchesFilter && matchesFamily;
    });

    gallery.innerHTML = visibleItems.map((item, index) => {
      const title = escapeHTML(item.title);
      const familyTitle = escapeHTML(item.familyTitle);
      const asset = getImageAsset(item.image);
      const eager = index < 8;
      const imageAttributes = eager
        ? `src="${escapeHTML(asset.thumb)}" loading="eager"`
        : `data-src="${escapeHTML(asset.thumb)}" loading="lazy"`;
      const media = item.category === "web"
        ? `<a class="card-media is-loading" href="${escapeHTML(item.href)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${title} live website">
            <img ${imageAttributes} alt="${title}" width="${asset.thumbWidth}" height="${asset.thumbHeight}" decoding="async" />
          </a>`
        : `<button class="archive-image-trigger is-loading" type="button" data-index="${index}" aria-label="Open ${title} in image viewer">
            <img ${imageAttributes} alt="${title}" width="${asset.thumbWidth}" height="${asset.thumbHeight}" decoding="async" />
          </button>`;
      return `
        <article class="archive-card${item.category === "web" ? " web-card" : ""}" data-category="${item.category}" data-family="${item.family}">
          ${media}
          <div class="archive-card-copy">
            <p>${familyTitle} / ${pad(index + 1)}</p>
            <h2>${title}</h2>
          </div>
        </article>`;
    }).join("");

    count.textContent = `${visibleItems.length} entries visible`;
    prepareThumbnails();
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filter = button.dataset.filter;
      filterButtons.forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
      if (filter !== "ai" && family !== "all") {
        family = "all";
        familySelect.value = "all";
      }
      render();
    });
  });

  familySelect.addEventListener("change", () => {
    family = familySelect.value;
    if (family !== "all") {
      filter = "ai";
      filterButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === "ai")));
    }
    render();
  });

  function initLightbox() {
    const dialog = document.getElementById("archiveLightbox");
    const image = document.getElementById("archiveLightboxImage");
    const title = document.getElementById("archiveLightboxTitle");
    const meta = document.getElementById("archiveLightboxMeta");
    if (!dialog || !image || !title || !meta) return;
    let index = 0;

    const renderImage = () => {
      const item = visibleItems[index];
      if (!item || item.category === "web") return;
      const asset = getImageAsset(item.image);
      image.width = asset.width;
      image.height = asset.height;
      image.src = item.image;
      image.alt = item.title;
      title.textContent = item.title;
      meta.textContent = `${item.familyTitle} / ${pad(index + 1)} of ${pad(visibleItems.length)}`;
    };

    gallery.addEventListener("click", (event) => {
      const trigger = event.target.closest(".archive-image-trigger");
      if (!trigger) return;
      index = Number(trigger.dataset.index);
      renderImage();
      dialog.showModal();
      document.body.classList.add("lightbox-open");
    });

    const move = (direction) => {
      if (!visibleItems.length) return;
      do {
        index = (index + direction + visibleItems.length) % visibleItems.length;
      } while (visibleItems[index]?.category === "web");
      renderImage();
    };

    dialog.querySelector(".lightbox-close").addEventListener("click", () => dialog.close());
    dialog.querySelector(".lightbox-prev").addEventListener("click", () => move(-1));
    dialog.querySelector(".lightbox-next").addEventListener("click", () => move(1));
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("lightbox-open");
      image.removeAttribute("src");
    });
  }

  render();
  initLightbox();
})();
