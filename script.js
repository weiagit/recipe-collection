const state = {
  search: "",
  category: "",
  tags: [],
  recipes: [],
};

const recipeGrid = document.getElementById("recipeGrid");
const resultsCount = document.getElementById("resultsCount");
const searchInput = document.getElementById("searchInput");
const filterGroup = document.querySelector(".filter-group");
const toolbar = document.querySelector(".toolbar");
let filterButtons = [];

function getTagStyle(tag) {
  const normalized = String(tag).toLowerCase();
  const hash = normalized.split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 5, 0);
  return ["tag-chip--teal", "tag-chip--blue", "tag-chip--green", "tag-chip--mint", "tag-chip--yellow"][hash];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveRecipeUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^(?:https?:|mailto:|data:|\/\/)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    const pageBase = window.location.pathname.replace(/\/[^/]*$/, "/");
    return `${window.location.origin}${pageBase}${trimmed.slice(1)}`;
  }

  return trimmed;
}

async function loadRecipes() {
  try {
    const response = await fetch("./data/recipes.json");
    if (!response.ok) throw new Error("Unable to load recipes");
    state.recipes = await response.json();
    buildCategoryFilters();
    renderTagFilters();
    renderRecipes();
  } catch (error) {
    recipeGrid.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    resultsCount.textContent = "Recipes could not be loaded.";
  }
}

function syncCategoryButtonState() {
  filterButtons = Array.from(document.querySelectorAll(".filter-chip"));
  filterButtons.forEach((chip) => {
    const isAllButton = chip.dataset.category === "All";
    const isSelected = chip.dataset.category !== "All" && state.category === chip.dataset.category;
    chip.classList.toggle("active", isAllButton ? !state.category : isSelected);
  });
}

function toggleCategoryFilter(category) {
  if (category === "All" || state.category === category) {
    state.category = "";
  } else {
    state.category = category;
  }

  syncCategoryButtonState();
  renderRecipes();
}

function pressClearButton() {
  const clearButton = filterGroup.querySelector("[data-action='clear']");
  if (!clearButton) return;
  clearButton.classList.add("is-pressed");
  window.setTimeout(() => clearButton.classList.remove("is-pressed"), 160);
}

function buildCategoryFilters() {
  const categories = [...new Set(state.recipes.map((recipe) => recipe.category).filter(Boolean))].sort();

  filterGroup.innerHTML = [
    '<button class="filter-chip active" data-category="All">All</button>',
    ...categories.map(
      (category) => `<button class="filter-chip" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`
    ),
    '<button class="filter-chip clear-button" type="button" data-action="clear">Clear</button>',
  ].join("");

  filterButtons = Array.from(document.querySelectorAll(".filter-chip"));
  syncCategoryButtonState();
}

function renderTagFilters() {
  const tags = [...new Set(state.recipes.flatMap((recipe) => recipe.tags || []))].sort();

  const existingGroup = document.querySelector(".tag-group");
  if (existingGroup) {
    existingGroup.remove();
  }

  const tagGroup = document.createElement("div");
  tagGroup.className = "tag-group";
  tagGroup.setAttribute("aria-label", "Recipe tags");

  tags.forEach((tag) => {
    const button = document.createElement("button");
    button.className = `tag-chip ${getTagStyle(tag)}${state.tags.includes(tag) ? " active" : ""}`;
    button.type = "button";
    button.dataset.tag = tag;
    button.textContent = tag;
    tagGroup.appendChild(button);
  });

  toolbar.insertBefore(tagGroup, filterGroup.nextSibling);
}

function renderRecipes() {
  const filtered = state.recipes.filter((recipe) => {
    const searchText = [
      recipe.title,
      recipe.description,
      recipe.category,
      recipe.text || "",
      ...(recipe.tags || []),
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchText.includes(state.search.toLowerCase());
    const matchesCategory = !state.category || state.category === recipe.category;
    const matchesTag = !state.tags.length || state.tags.every((selectedTag) => (recipe.tags || []).includes(selectedTag));
    return matchesSearch && matchesCategory && matchesTag;
  });

  resultsCount.textContent = `${filtered.length} recipe${filtered.length === 1 ? "" : "s"} found`;

  if (!filtered.length) {
    recipeGrid.innerHTML = '<div class="empty-state">No recipes match your search yet. Try a different word or filter.</div>';
    return;
  }

  recipeGrid.innerHTML = filtered
    .map((recipe) => {
      const title = escapeHtml(recipe.title || "Untitled recipe");
      const description = escapeHtml(recipe.description || "").trim();
      const descriptionMarkup = description ? `<p>${description}</p>` : "";
      const category = escapeHtml(recipe.category || "Other");
      const categoryClass = state.category === recipe.category ? " active" : "";
      const timeValue = String(recipe.time || "").trim();
      const timeMarkup = timeValue ? `<span>${escapeHtml(timeValue)}</span>` : "";
      const imageUrl = resolveRecipeUrl(recipe.image || recipe.imageUrl || "");
      const escapedImageUrl = escapeHtml(imageUrl);
      const imageMarkup = imageUrl
        ? `<img class="recipe-image" src="${escapedImageUrl}" alt="${title}" loading="lazy" />`
        : "";
      const noteText = String(recipe.text || "").trim();
      const hasText = Boolean(noteText);
      const linkUrl = resolveRecipeUrl(recipe.url || "");
      const actionMarkup = linkUrl
        ? `<a class="recipe-link" href="${escapeHtml(linkUrl)}" target="_blank" rel="noreferrer">View recipe →</a>`
        : "";
      const noteButtonMarkup = hasText
        ? `<button class="recipe-toggle" type="button" data-action="toggle-note">View recipe</button>`
        : "";
      const noteMarkup = hasText
        ? `<div class="recipe-note-panel"><div class="recipe-note-content">${escapeHtml(noteText).replace(/\n/g, "<br>")}</div></div>`
        : "";
      const maxVisibleTags = 5;
      const tagsArray = recipe.tags || [];
      const tagButtons = tagsArray
        .map((tag, index) => {
          const tagClass = getTagStyle(tag).replace("tag-chip", "tag-pill");
          const activeClass = state.tags.includes(tag) ? " active" : "";
          const hiddenClass = index >= maxVisibleTags ? " tag-hidden" : "";
          return `<button class="tag-pill ${tagClass}${activeClass}${hiddenClass}" type="button" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`;
        })
        .join("");
      const overflowCount = Math.max(0, tagsArray.length - maxVisibleTags);
      const overflowButton = overflowCount
        ? `<button class="tag-more" type="button" data-action="toggle-tags" data-overflow-count="${overflowCount}">+${overflowCount} more</button>`
        : "";

      return `
        <article class="recipe-card">
          <div class="meta-row">
            <button class="badge category-badge${categoryClass}" type="button" data-category="${escapeHtml(recipe.category || "Other")}">${category}</button>
            ${timeMarkup}
          </div>
          ${imageMarkup ? `<div class="recipe-media">${imageMarkup}</div>` : ""}
          <h3>${title}</h3>
          ${descriptionMarkup}
          <div class="tag-list">${tagButtons}${overflowButton}</div>
          ${actionMarkup || noteButtonMarkup ? `<div class="recipe-actions">${actionMarkup}${noteButtonMarkup}</div>` : ""}
          ${noteMarkup}
        </article>
      `;
    })
    .join("");
}

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value.trim();
  renderRecipes();
});

filterGroup.addEventListener("click", (event) => {
  const clearButton = event.target.closest("[data-action='clear']");
  if (clearButton) {
    state.search = "";
    state.category = "";
    state.tags = [];
    searchInput.value = "";
    syncCategoryButtonState();
    pressClearButton();
    renderTagFilters();
    renderRecipes();
    return;
  }

  const categoryButton = event.target.closest(".filter-chip");
  if (!categoryButton || categoryButton.dataset.action === "clear") return;

  toggleCategoryFilter(categoryButton.dataset.category);
});

recipeGrid.addEventListener("click", (event) => {
  const categoryButton = event.target.closest(".category-badge");
  if (categoryButton) {
    toggleCategoryFilter(categoryButton.dataset.category);
    return;
  }

  const toggleButton = event.target.closest(".recipe-toggle");
  if (toggleButton) {
    const card = toggleButton.closest(".recipe-card");
    if (!card) return;
    const isOpen = card.classList.toggle("is-open");
    toggleButton.textContent = isOpen ? "Hide recipe" : "View recipe";
    toggleButton.setAttribute("aria-expanded", String(isOpen));
    return;
  }

  const overflowButton = event.target.closest(".tag-more");
  if (overflowButton) {
    const card = overflowButton.closest(".recipe-card");
    if (!card) return;
    const isExpanded = card.classList.toggle("tags-expanded");
    const overflowCount = overflowButton.dataset.overflowCount;
    overflowButton.textContent = isExpanded ? "Show less" : `+${overflowCount} more`;
    return;
  }

  const tagButton = event.target.closest(".tag-pill");
  if (!tagButton) return;

  const clickedTag = tagButton.dataset.tag;
  state.tags = state.tags.includes(clickedTag)
    ? state.tags.filter((tag) => tag !== clickedTag)
    : [...state.tags, clickedTag];
  renderTagFilters();
  renderRecipes();
});

toolbar.addEventListener("click", (event) => {
  const button = event.target.closest(".tag-chip");
  if (!button) return;

  const clickedTag = button.dataset.tag;
  state.tags = state.tags.includes(clickedTag)
    ? state.tags.filter((tag) => tag !== clickedTag)
    : [...state.tags, clickedTag];
  renderTagFilters();
  renderRecipes();
});

loadRecipes();
