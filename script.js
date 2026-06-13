const state = {
  search: "",
  category: "All",
  tag: "",
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
  if (normalized.includes("quick") || normalized.includes("easy") || normalized.includes("fresh")) return "tag-chip--teal";
  if (normalized.includes("family") || normalized.includes("party") || normalized.includes("meal")) return "tag-chip--blue";
  if (normalized.includes("sweet") || normalized.includes("fruit") || normalized.includes("vegetarian")) return "tag-chip--green";
  if (normalized.includes("make") || normalized.includes("pantry") || normalized.includes("dip")) return "tag-chip--mint";
  if (normalized.includes("comfort") || normalized.includes("warm") || normalized.includes("cozy")) return "tag-chip--yellow";
  return "tag-chip--gray";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function buildCategoryFilters() {
  const categories = [...new Set(state.recipes.map((recipe) => recipe.category).filter(Boolean))].sort();

  filterGroup.innerHTML = [
    '<button class="filter-chip active" data-category="All">All</button>',
    ...categories.map(
      (category) => `<button class="filter-chip" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`
    ),
    '<button class="filter-chip" type="button" data-action="clear">Clear</button>',
  ].join("");

  filterButtons = Array.from(document.querySelectorAll(".filter-chip"));

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((chip) => chip.classList.remove("active"));
      button.classList.add("active");
      state.category = button.dataset.category;
      renderRecipes();
    });
  });

  const activeButton = filterButtons.find((button) => button.dataset.category === state.category);
  if (activeButton) {
    filterButtons.forEach((chip) => chip.classList.remove("active"));
    activeButton.classList.add("active");
  }
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
    button.className = `tag-chip ${getTagStyle(tag)}${state.tag === tag ? " active" : ""}`;
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
    const matchesCategory = state.category === "All" || recipe.category === state.category;
    const matchesTag = !state.tag || (recipe.tags || []).includes(state.tag);
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
      const description = escapeHtml(recipe.description || "A simple favorite to keep nearby.");
      const category = escapeHtml(recipe.category || "Other");
      const time = escapeHtml(recipe.time || "? min");
      const tags = (recipe.tags || [])
        .map((tag) => {
          const tagClass = getTagStyle(tag).replace("tag-chip", "tag-pill");
          const activeClass = state.tag === tag ? " active" : "";
          return `<button class="${tagClass}${activeClass}" type="button" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`;
        })
        .join("");
      const note = escapeHtml(recipe.text || "Recipe notes shared here.");

      return `
        <article class="recipe-card">
          <div class="meta-row">
            <span class="badge">${category}</span>
            <span>${time}</span>
          </div>
          <div class="tag-list">${tags}</div>
          <h3>${title}</h3>
          <p>${description}</p>
          ${
            recipe.url
              ? `<a class="recipe-link" href="${escapeHtml(recipe.url)}" target="_blank" rel="noreferrer">View recipe →</a>`
              : `<p class="recipe-note">${note}</p>`
          }
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
    state.category = "All";
    state.tag = "";
    searchInput.value = "";
    filterButtons.forEach((chip) => chip.classList.remove("active"));
    filterGroup.querySelector(".filter-chip")?.classList.add("active");
    renderTagFilters();
    renderRecipes();
    return;
  }

  const categoryButton = event.target.closest(".filter-chip");
  if (!categoryButton) return;

  filterButtons.forEach((chip) => chip.classList.remove("active"));
  categoryButton.classList.add("active");
  state.category = categoryButton.dataset.category;
  renderRecipes();
});

toolbar.addEventListener("click", (event) => {
  const button = event.target.closest(".tag-chip, .tag-pill");
  if (!button) return;

  const clickedTag = button.dataset.tag;
  state.tag = state.tag === clickedTag ? "" : clickedTag;
  renderTagFilters();
  renderRecipes();
});

loadRecipes();
