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
let filterButtons = [];

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
        .map((tag, index) => {
          const tagClass = `tag-pill tag-pill--${index % 6}`;
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

recipeGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".tag-pill");
  if (!button) return;

  const clickedTag = button.dataset.tag;
  state.tag = state.tag === clickedTag ? "" : clickedTag;
  renderRecipes();
});

loadRecipes();
