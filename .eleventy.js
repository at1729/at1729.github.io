function slugify(value = "") {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

module.exports = function (eleventyConfig) {
  const pathPrefix = process.env.ELEVENTY_PATH_PREFIX || "/";
  eleventyConfig.ignores.add("README.md");
  eleventyConfig.addFilter("slug", slugify);
  eleventyConfig.addFilter("toArray", (value) => (Array.isArray(value) ? value : []));
  eleventyConfig.addFilter("absoluteUrl", (url = "", base = "") => {
    if (!url) return "";
    try {
      return new URL(url, base).toString();
    } catch (error) {
      return url;
    }
  });

  eleventyConfig.addCollection("items", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("./items/**/*.md")
      .sort((a, b) => a.data.title.localeCompare(b.data.title))
  );

  eleventyConfig.addCollection("categories", (collectionApi) => {
    const categoriesMap = new Map();

    collectionApi.getFilteredByGlob("./items/**/*.md").forEach((item) => {
      const categoryName = item.data.category;
      if (!categoryName) {
        return;
      }

      const categorySlug = slugify(categoryName);
      if (!categoriesMap.has(categorySlug)) {
        categoriesMap.set(categorySlug, {
          name: categoryName,
          slug: categorySlug,
          items: [],
        });
      }

      categoriesMap.get(categorySlug).items.push(item);
    });

    return Array.from(categoriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  });

  eleventyConfig.addCollection("sitemap", (collectionApi) =>
    collectionApi
      .getAll()
      .filter((item) => item.url && item.outputPath && item.outputPath.endsWith(".html"))
      .filter((item) => !item.url.startsWith("/assets/"))
  );

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ images: "images" });
  eleventyConfig.addWatchTarget("./items/");
  eleventyConfig.addWatchTarget("./images/");

  return {
    pathPrefix,
    dir: {
      input: ".",
      includes: "src/_includes",
      output: "dist",
      data: "src/_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
};
