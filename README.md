# Recipe Journal

A polished recipe blog that is simple to maintain, easy to browse, and free to host on GitHub Pages.

## What it does

- Shows recipes as a simple blog-style collection.
- Supports instant search and category filtering.
- Lets you add a new recipe by linking to a website in [data/recipes.json](data/recipes.json).
- Works well on phones, tablets, and desktops without any backend.

## Add a recipe

Open [data/recipes.json](data/recipes.json) and add one more object like this:

```json
{
  "title": "Your recipe title",
  "description": "A short description",
  "category": "Dinner",
  "time": "25 min",
  "tags": ["quick", "family"],
  "url": "https://example.com/your-recipe"
}
```

A recipe can also be added without a URL by using the `text` field instead.

## Run locally

From this folder, start a simple local server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish to GitHub Pages

1. Push this folder to a GitHub repository.
2. Open the repository settings.
3. Go to Pages and choose Deploy from a branch.
4. Select the main branch and the root folder, then save.

The site will be available at a GitHub Pages URL for the repository.

## Shared use

Because the content lives in a plain JSON file, multiple people can contribute by editing the same repository and sharing the same published page.
