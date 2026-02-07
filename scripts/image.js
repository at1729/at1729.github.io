const fs = require("fs/promises");
const path = require("path");
const matter = require("gray-matter");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const ITEMS_DIR = path.join(ROOT, "items");
const IMAGES_DIR = path.join(ROOT, "images");
const OUTPUT_DIR = path.join(ROOT, "src", "assets", "generated", "thumbs");

const THUMB_WIDTH = 480;

function slugify(value = "") {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function listMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

function isLikelyImageHeader(buffer) {
  if (!buffer || buffer.length < 12) return false;
  const hex = buffer.subarray(0, 4).toString("hex");
  if (hex.startsWith("ffd8ff")) return true; // JPEG
  if (hex === "89504e47") return true; // PNG
  if (buffer.subarray(0, 4).toString("ascii") === "GIF8") return true; // GIF
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return true; // WEBP
  }
  return false;
}

async function readHeader(filePath, length = 16) {
  const handle = await fs.open(filePath, "r");
  try {
    const { buffer } = await handle.read({
      buffer: Buffer.alloc(length),
      position: 0,
      length,
    });
    return buffer;
  } finally {
    await handle.close();
  }
}

function applyFormat(pipeline, ext) {
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return pipeline.jpeg({ quality: 80, mozjpeg: true });
    case ".png":
      return pipeline.png({ compressionLevel: 9 });
    case ".webp":
      return pipeline.webp({ quality: 80 });
    default:
      return pipeline;
  }
}

async function generateThumbnails() {
  const itemFiles = await listMarkdownFiles(ITEMS_DIR);
  let processed = 0;
  let generated = 0;
  let skipped = 0;

  for (const itemFile of itemFiles) {
    const raw = await fs.readFile(itemFile, "utf8");
    const { data } = matter(raw);
    const images = Array.isArray(data.images) ? data.images : [];
    const categorySlug = slugify(data.category || "");
    const itemSlug = path.basename(itemFile, path.extname(itemFile));

    if (!categorySlug || images.length === 0) {
      continue;
    }

    for (const imageName of images) {
      processed += 1;
      const sourcePath = path.join(IMAGES_DIR, categorySlug, itemSlug, imageName);
      const outputPath = path.join(OUTPUT_DIR, categorySlug, itemSlug, imageName);

      let sourceStat;
      try {
        sourceStat = await fs.stat(sourcePath);
      } catch (error) {
        console.warn(`[thumbs] Missing source image: ${sourcePath}`);
        skipped += 1;
        continue;
      }

      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      try {
        const outputStat = await fs.stat(outputPath);
        if (outputStat.mtimeMs >= sourceStat.mtimeMs) {
          skipped += 1;
          continue;
        }
      } catch (error) {
        // output missing, proceed
      }

      const header = await readHeader(sourcePath);
      if (!isLikelyImageHeader(header)) {
        console.warn(`[thumbs] Non-image placeholder detected, skipping: ${sourcePath}`);
        skipped += 1;
        continue;
      }

      const ext = path.extname(imageName).toLowerCase();
      const pipeline = sharp(sourcePath).resize({
        width: THUMB_WIDTH,
        withoutEnlargement: true,
      });

      await applyFormat(pipeline, ext).toFile(outputPath);
      generated += 1;
    }
  }

  console.log(
    `[thumbs] Processed ${processed} image references, generated ${generated}, skipped ${skipped}.`
  );
}

generateThumbnails().catch((error) => {
  console.error("[thumbs] Failed to generate thumbnails.");
  console.error(error);
  process.exitCode = 1;
});
