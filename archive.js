"use strict";

(() => {
  const source = window.PORTFOLIO;
  const gallery = document.getElementById("archiveGrid");
  const count = document.getElementById("resultCount");
  const familySelect = document.getElementById("familySelect");
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  if (!source || !gallery || !count || !familySelect) return;

  const escapeHTML = (value = "") => value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[char]);
  const pad = (value) => String(value).padStart(2, "0");

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

  source.archive.aiFamilies.forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.key;
    option.textContent = `${entry.title} (${entry.count})`;
    familySelect.append(option);
  });

  function render() {
    visibleItems = items.filter((item) => {
      const matchesFilter = filter === "all" || item.category === filter;
      const matchesFamily = family === "all" || item.family === family;
      return matchesFilter && matchesFamily;
    });

    gallery.innerHTML = visibleItems.map((item, index) => {
      const title = escapeHTML(item.title);
      const familyTitle = escapeHTML(item.familyTitle);
      const media = item.category === "web"
        ? `<a class="card-media" href="${escapeHTML(item.href)}" target="_blank" rel="noopener" aria-label="Open ${title} repository">
            <img src="${escapeHTML(item.image)}" alt="${title}" loading="lazy" decoding="async" />
          </a>`
        : `<button class="archive-image-trigger" type="button" data-index="${index}" aria-label="Open ${title} in image viewer">
            <img src="${escapeHTML(item.image)}" alt="${title}" loading="lazy" decoding="async" />
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
