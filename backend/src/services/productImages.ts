import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const DATA_IMAGE_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)$/;
const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads", "products");

function isLocalProductImage(url: string): boolean {
  return url.startsWith("/uploads/products/");
}

function validateImageSource(url: string): void {
  if (DATA_IMAGE_PATTERN.test(url)) return;
  if (/^https?:\/\//i.test(url) || isLocalProductImage(url)) return;
  throw new Error("INVALID_IMAGE");
}

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

async function saveDataImage(productId: string, source: string, order: number): Promise<string> {
  const match = source.match(DATA_IMAGE_PATTERN);
  if (!match) return source;

  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  await mkdir(UPLOADS_ROOT, { recursive: true });
  const fileName = `${productId}-${order}-${randomUUID()}.${extensionForMime(match[1])}`;
  await writeFile(path.join(UPLOADS_ROOT, fileName), buffer, { flag: "wx" });
  return `/uploads/products/${fileName}`;
}

export async function prepareProductImages(
  productId: string,
  imageUrls: string[],
): Promise<string[]> {
  if (!Array.isArray(imageUrls) || imageUrls.length > MAX_IMAGES) {
    throw new Error("TOO_MANY_IMAGES");
  }

  const savedUrls: string[] = [];
  try {
    for (const [index, imageUrl] of imageUrls.entries()) {
      if (typeof imageUrl !== "string" || !imageUrl.trim()) {
        throw new Error("INVALID_IMAGE");
      }
      const normalizedUrl = imageUrl.trim();
      validateImageSource(normalizedUrl);
      savedUrls.push(await saveDataImage(productId, normalizedUrl, index));
    }
    return savedUrls;
  } catch (error) {
    await deleteProductImages(savedUrls);
    throw error;
  }
}

export async function deleteProductImages(imageUrls: string[]): Promise<void> {
  await Promise.all(
    imageUrls
      .filter(isLocalProductImage)
      .map(async (imageUrl) => {
        const fileName = path.basename(imageUrl);
        if (!fileName || fileName === "." || fileName === "..") return;
        try {
          await unlink(path.join(UPLOADS_ROOT, fileName));
        } catch (error: unknown) {
          const code = (error as { code?: string })?.code;
          if (code !== "ENOENT") throw error;
        }
      }),
  );
}

export const PRODUCT_IMAGE_LIMITS = {
  maxImages: MAX_IMAGES,
  maxBytes: MAX_IMAGE_BYTES,
};
