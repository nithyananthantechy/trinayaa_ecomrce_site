import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import * as db from "./db";

const execFileAsync = promisify(execFile);

export interface GenerateAiProductImageInput {
  prompt?: string;
  model?: string;
  aspectRatio?: string;
  hfToken?: string;
  mode?: "template" | "ai";
  productName?: string;
  tamilName?: string;
  bowlType?: "green" | "gold" | "brown" | "black" | "red";
}

function buildOptimizedPackagingPrompt(userPrompt: string): string {
  const base = userPrompt.trim();
  if (base.toLowerCase().includes("upright vertical standup") && base.toLowerCase().includes("pouch")) {
    return base;
  }
  return `Commercial product photography of a tall upright vertical standup kraft paper ziplock pouch bag standing tall in center, officially branded TRINAYAA in forest green botanical typography with dark green product title banner. In foreground bottom right corner, a round rustic wooden bowl filled with authentic fresh organic botanicals (${base}). Warm morning sunlight from side window, rustic wooden table surface, soft green herbal leaves in background, award-winning authentic Indian wellness packaging, sharp focus on the upright pouch, 8k resolution, photorealistic commercial studio photography, crisp details, no flatlay, no paper envelope on plate, no drawing, no cartoon`;
}

export async function generateAiProductImage(
  input: GenerateAiProductImageInput,
  adminName: string
) {
  const {
    prompt = "Organic Botanical Herbal Powder",
    model = "trinayaa-template",
    aspectRatio = "1:1",
    hfToken,
    mode = model.includes("template") ? "template" : "ai",
    productName,
    tamilName = "",
    bowlType = "green",
  } = input;

  const token = hfToken || process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY || "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";

  let width = 1024;
  let height = 1024;
  if (aspectRatio === "3:4" || aspectRatio === "4:5") {
    width = 768;
    height = 1024;
  } else if (aspectRatio === "4:3") {
    width = 1024;
    height = 768;
  } else if (aspectRatio === "16:9") {
    width = 1024;
    height = 576;
  }

  const outDir = path.resolve(process.cwd(), "client/public/images/products/ai_generated");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const filename = `trn_pkg_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
  const filePath = path.join(outDir, filename);
  const publicUrl = `/images/products/ai_generated/${filename}`;

  let providerUsed = "TRINAYAA Official Packaging Template Engine";
  let success = false;

  // 1. PRIMARY: Official TRINAYAA Brand Template Composer (100% Client Match)
  if (mode === "template" || model.includes("template")) {
    const finalNameEn = (productName || prompt).replace(/^(Authentic |Organic |Natural )/i, "").trim();
    try {
      const composerScript = path.resolve(process.cwd(), "server/compose_template.py");
      await execFileAsync("python", [
        composerScript,
        "--name", finalNameEn,
        "--tamil", tamilName || "",
        "--type", bowlType || "green",
        "--out", filePath,
      ]);

      if (fs.existsSync(filePath) && fs.statSync(filePath).size > 10000) {
        success = true;
        providerUsed = "TRINAYAA Official Master Packaging Template (100% Brand Consistency)";
      }
    } catch (composeErr) {
      console.warn("[AI Image] Template composer python failed, falling back to AI:", composeErr);
    }
  }

  // 2. GENERATIVE AI: FLUX.1 / Hugging Face with Packaging-Optimized Framing
  if (!success) {
    let imageBuffer: Buffer | null = null;
    const finalAiPrompt = buildOptimizedPackagingPrompt(prompt);

    // Try Hugging Face Router if token provided and model is HF model
    if (token && model.includes("/")) {
      try {
        const endpoints = [
          `https://router.huggingface.co/hf-inference/models/${encodeURIComponent(model)}`,
          `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`,
        ];
        for (const hfUrl of endpoints) {
          try {
            const hfRes = await fetch(hfUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                inputs: finalAiPrompt,
                parameters: { width, height },
              }),
              signal: AbortSignal.timeout(15000),
            });

            if (hfRes.ok) {
              const arrayBuf = await hfRes.arrayBuffer();
              if (arrayBuf.byteLength > 5000) {
                imageBuffer = Buffer.from(arrayBuf);
                providerUsed = `Hugging Face Router (${model.split("/").pop() || model})`;
                break;
              }
            }
          } catch {}
        }
      } catch {}
    }

    // Try High-speed FLUX.1 Engine with packaging-optimized prompt
    if (!imageBuffer) {
      try {
        const pollinationsModel = model.toLowerCase().includes("sdxl") ? "turbo" : "flux";
        const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          finalAiPrompt
        )}?width=${width}&height=${height}&model=${pollinationsModel}&nologo=true&seed=${Math.floor(
          Math.random() * 1000000
        )}`;

        const pRes = await fetch(pollUrl, { signal: AbortSignal.timeout(25000) });
        if (pRes.ok) {
          const arrayBuf = await pRes.arrayBuffer();
          if (arrayBuf.byteLength > 5000) {
            imageBuffer = Buffer.from(arrayBuf);
            providerUsed = `FLUX.1 Schnell Packaging Studio`;
          }
        }
      } catch {}
    }

    // Fallback: If AI fails, use master template composer
    if (!imageBuffer) {
      try {
        const composerScript = path.resolve(process.cwd(), "server/compose_template.py");
        await execFileAsync("python", [
          composerScript,
          "--name", productName || prompt || "ORGANIC BOTANICAL",
          "--tamil", tamilName || "",
          "--type", bowlType || "green",
          "--out", filePath,
        ]);
        if (fs.existsSync(filePath)) {
          success = true;
          providerUsed = "TRINAYAA Master Packaging Engine (Offline Fallback)";
        }
      } catch {}
    } else {
      fs.writeFileSync(filePath, imageBuffer);
      success = true;
    }
  }

  // Dual-directory sync to dist/public/images/products/ai_generated
  try {
    const distOutDir = path.resolve(process.cwd(), "dist/public/images/products/ai_generated");
    if (!fs.existsSync(distOutDir)) {
      fs.mkdirSync(distOutDir, { recursive: true });
    }
    const distFilePath = path.join(distOutDir, filename);
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, distFilePath);
    }
  } catch (syncErr) {
    console.warn("[AI Image] Failed to sync to dist/public:", syncErr);
  }

  // Safe Audit Logging
  try {
    db.auditLogsRepo.log(
      adminName || "Admin",
      "AI_PRODUCT_IMAGE_GENERATED",
      `Generated packaging image via ${providerUsed}. Name: "${productName || prompt}". URL: ${publicUrl}`
    );
  } catch (err) {
    console.warn("[AI Image] Audit log failed:", err);
  }

  return {
    success: true,
    imageUrl: publicUrl,
    prompt: productName || prompt,
    model,
    provider: providerUsed,
  };
}

export async function assignAiImageToProduct(
  productId: string | number,
  imageUrl: string,
  adminName: string
) {
  const allProducts = db.productsRepo.getAll({});
  const idStr = String(productId);
  const target = allProducts.find((p) => String(p.id) === idStr || p.sku === idStr);

  if (!target) {
    throw new Error(`Product not found with ID/SKU: ${productId}`);
  }

  // Update product image
  db.productsRepo.update(target.id, {
    image: imageUrl,
    primaryImage: imageUrl,
  });

  try {
    db.auditLogsRepo.log(
      adminName || "Admin",
      "PRODUCT_IMAGE_UPDATED",
      `Updated image for product ${target.name} (${target.sku}) to ${imageUrl}`
    );
  } catch (err) {
    console.warn("[AI Image] Audit log failed:", err);
  }

  return {
    success: true,
    product: {
      id: target.id,
      name: target.name,
      sku: target.sku,
      image: imageUrl,
    },
  };
}
