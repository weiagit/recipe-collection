const state = {
  search: "",
  category: "All",
  recipes: [],
};

const recipeGrid = document.getElementById("recipeGrid");
const resultsCount = document.getElementById("resultsCount");
const searchInput = document.getElementById("searchInput");
const filterButtons = Array.from(document.querySelectorAll(".filter-chip"));

async function loadRecipes() {
  try {
    const response = await fetch("./data/recipes.json");
    if (!response.ok) throw new Error("Unable to load recipes");
    state.recipes = await response.json();
    renderRecipes();
  } catch (error) {
    recipeGrid.innerHTML = `<div class="empty-state">${error.message}</div>`;
    resultsCount.textContent = "Recipes could not be loaded.";
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
    return matchesSearch && matchesCategory;
  });

  resultsCount.textContent = `${filtered.length} recipe${filtered.length === 1 ? "" : "s"} found`;

  if (!filtered.length) {
    recipeGrid.innerHTML = '<div class="empty-state">No recipes match your search yet. Try a different word or filter.</div>';
    return;
  }

  recipeGrid.innerHTML = filtered
    .map(
      (recipe) => `
        <article class="recipe-card">
          <div class="meta-row">
            <span class="badge">${recipe.category}</span>
            <span>${recipe.time}</span>
          </div>
          <h3>${recipe.title}</h3>
          <p>${recipe.description}</p>
          <div class="tag-list">
            ${(recipe.tags || []).map((tag) => `<span>${tag}</span>`).join("")}
          </div>
          ${
            recipe.url
              ? `<a class="recipe-link" href="${recipe.url}" target="_blank" rel="noreferrer">View recipe →</a>`
              : `<p class="recipe-note">${recipe.text || "Recipe notes shared here."}</p>`
          }
        </article>
      `
    )
    .join("");
}

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value.trim();
  renderRecipes();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((chip) => chip.classList.remove("active"));
    button.classList.add("active");
    state.category = button.dataset.category;
    renderRecipes();
  });
});

loadRecipes();
