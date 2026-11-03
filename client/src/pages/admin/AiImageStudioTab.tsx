import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Sparkles,
  Download,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Sliders,
  Key,
  Layers,
  Wand2,
  ChevronDown,
  Info,
  ExternalLink,
} from "lucide-react";

const PRESETS = [
  {
    label: "🌿 Kraft Standup Pouch",
    prompt:
      "Authentic TRINAYAA standup kraft paper pouch, botanical leaf emblem printed in forest green, raw dried organic herbs in wooden bowl beside pouch, soft natural morning daylight, photorealistic commercial product packaging photography, 8k",
  },
  {
    label: "🫙 Glass Apothecary Jar",
    prompt:
      "Minimalist transparent glass apothecary jar with natural wooden cork lid, filled with golden organic botanical seeds, soft rustic wooden table, cinematic depth of field, warm ambient lighting, luxury wellness brand",
  },
  {
    label: "🥣 Herbal Powder & Mortar",
    prompt:
      "Finely milled pure organic herbal powder spilling gracefully from an ancient granite stone mortar and pestle, fresh green botanical leaves scattered around, clean earthy backdrop, high-texture macro shot",
  },
  {
    label: "🌾 Fresh Farm Harvest",
    prompt:
      "Single-origin raw botanical roots freshly harvested in organic Tamil Nadu farm, traditional woven bamboo basket, morning golden hour sunlight, authentic agricultural wellness",
  },
];

const MODELS = [
  {
    id: "black-forest-labs/FLUX.1-schnell",
    name: "FLUX.1 Schnell (Recommended)",
    desc: "State-of-the-art fast open-weight model by Black Forest Labs. Exceptional text and packaging realism.",
  },
  {
    id: "stabilityai/stable-diffusion-xl-base-1.0",
    name: "Stable Diffusion XL (SDXL)",
    desc: "High-resolution botanical illustration and rich atmospheric lighting.",
  },
  {
    id: "runwayml/stable-diffusion-v1-5",
    name: "Stable Diffusion 1.5",
    desc: "Classic lightweight generation model.",
  },
];

const DEFAULT_HF_TOKEN = "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";

export default function AiImageStudioTab() {
  const [prompt, setPrompt] = useState(PRESETS[0].prompt);
  const [model, setModel] = useState("black-forest-labs/FLUX.1-schnell");
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "3:4" | "16:9">("1:1");
  const [hfToken, setHfToken] = useState(() => localStorage.getItem("trinayaa_hf_token") || DEFAULT_HF_TOKEN);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [history, setHistory] = useState<Array<{ url: string; prompt: string; model: string }>>([]);

  // Fetch products for assignment dropdown
  const { data: productsData } = trpc.admin.products.list.useQuery({ limit: 162 });
  const products = productsData?.items || [];

  // Generate Image Mutation
  const generateMutation = trpc.admin.aiImage.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl);
      setHistory((prev) => [{ url: data.imageUrl, prompt: data.prompt, model: data.model }, ...prev]);
      toast.success("Image generated successfully!", {
        description: `Generated via ${data.provider}`,
      });
    },
    onError: (err) => {
      toast.error("Generation failed", {
        description: err.message || "Failed to generate image. Please try again.",
      });
    },
  });

  // Assign to Product Mutation
  const assignMutation = trpc.admin.aiImage.assignToProduct.useMutation({
    onSuccess: (data) => {
      toast.success("Product image updated!", {
        description: `Assigned to ${data.product.name} (${data.product.sku})`,
      });
    },
    onError: (err) => {
      toast.error("Assignment failed", {
        description: err.message || "Failed to update product image.",
      });
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error("Please enter a prompt describing the product image.");
      return;
    }
    if (hfToken) {
      try {
        localStorage.setItem("trinayaa_hf_token", hfToken);
      } catch (e) {}
    }
    generateMutation.mutate({
      prompt,
      model,
      aspectRatio,
      hfToken: hfToken.trim() || undefined,
    });
  };

  const handleAssign = () => {
    if (!selectedProductId || !generatedImage) {
      toast.error("Please select a product from the list.");
      return;
    }
    assignMutation.mutate({
      productId: selectedProductId,
      imageUrl: generatedImage,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#123D28] to-[#1E573B] text-white p-6 rounded-2xl shadow-sm border border-[#123D28]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#AE6A2B] text-white">
              <Sparkles size={12} /> AI Product Studio
            </span>
            <span className="text-xs text-[#E5DECF]/80">Hugging Face & FLUX Inference</span>
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-tight">Generate Commercial Product Visuals</h2>
          <p className="text-xs text-[#E5DECF] max-w-xl mt-1 leading-relaxed">
            Create photorealistic herbal packaging, rustic apothecary jars, and raw botanical harvest photography for your catalogue without expensive studio shoots.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowTokenInput(!showTokenInput)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 transition-colors border border-white/20 text-[#FBF8F0]"
        >
          <Key size={14} className="text-[#E8BF83]" /> {hfToken ? "✓ HF Token Active" : "Configure HF Token"}
        </button>
      </div>

      {/* Hugging Face Token Modal / Drawer */}
      {showTokenInput && (
        <div className="bg-[#FFFDF8] border border-[#AE6A2B]/30 p-4 rounded-xl shadow-xs text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#123D28] flex items-center gap-1.5">
              <Key size={14} className="text-[#AE6A2B]" /> Hugging Face Inference Token (Optional)
            </span>
            <a
              href="https://huggingface.co/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#AE6A2B] hover:underline flex items-center gap-1 font-semibold"
            >
              Get Free HF Token <ExternalLink size={12} />
            </a>
          </div>
          <p className="text-[#6C7167]">
            If left blank, TRINAYAA uses the high-speed serverless FLUX model automatically. Providing your token enables private Hugging Face endpoints and higher rate limits.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={hfToken}
              onChange={(e) => setHfToken(e.target.value)}
              placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="flex-1 px-3 py-2 border border-[#DEDFD5] rounded-md bg-white font-mono text-xs focus:outline-none focus:border-[#123D28]"
            />
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem("trinayaa_hf_token", hfToken);
                  toast.success("Hugging Face token saved locally");
                  setShowTokenInput(false);
                } catch (e) {}
              }}
              className="dark-button text-xs px-4"
            >
              Save Token
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Column Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Generation Controls */}
        <form onSubmit={handleGenerate} className="lg:col-span-7 bg-[#FFFDF8] border border-[#DEDFD5] p-6 rounded-2xl shadow-xs space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#123D28] uppercase tracking-wider flex items-center gap-1.5">
                <Wand2 size={14} className="text-[#AE6A2B]" /> Image Prompt
              </label>
              <span className="text-[11px] text-[#6C7167]">{prompt.length} characters</span>
            </div>
            <textarea
              required
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the product, packaging type, background, textures, and lighting..."
              className="w-full p-3 bg-white border border-[#DEDFD5] rounded-xl text-xs text-[#1A2C20] focus:outline-none focus:border-[#123D28] leading-relaxed shadow-inner"
            />
          </div>

          {/* Prompt Presets */}
          <div>
            <span className="block text-[11px] font-bold text-[#6C7167] uppercase tracking-wider mb-2">
              Botanical Studio Presets (Click to Load)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPrompt(p.prompt)}
                  className="text-left p-2.5 rounded-lg border border-[#DEDFD5] bg-[#FBF8F0]/60 hover:bg-[#F3EAD8]/70 hover:border-[#AE6A2B] transition-all text-xs font-semibold text-[#123D28]"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-bold text-[#123D28] uppercase tracking-wider mb-2">
              Inference Model
            </label>
            <div className="space-y-2">
              {MODELS.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    model === m.id
                      ? "bg-[#123D28]/5 border-[#123D28] ring-1 ring-[#123D28]"
                      : "bg-white border-[#DEDFD5] hover:border-[#6C7167]"
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    value={m.id}
                    checked={model === m.id}
                    onChange={(e) => setModel(e.target.value)}
                    className="mt-0.5 text-[#123D28] focus:ring-[#123D28]"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-[#123D28] block">{m.name}</span>
                    <span className="text-[#6C7167] text-[11px] leading-tight block mt-0.5">{m.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-xs font-bold text-[#123D28] uppercase tracking-wider mb-2">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "1:1", label: "Square (1:1)", desc: "Product Catalog" },
                  { id: "3:4", label: "Portrait (3:4)", desc: "Detail Showcase" },
                  { id: "16:9", label: "Landscape (16:9)", desc: "Hero Banner" },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setAspectRatio(r.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    aspectRatio === r.id
                      ? "bg-[#123D28] text-white border-[#123D28] shadow-xs"
                      : "bg-white border-[#DEDFD5] text-[#1A2C20] hover:bg-[#FBF8F0]"
                  }`}
                >
                  <span className="block text-xs font-bold">{r.label}</span>
                  <span className={`block text-[10px] mt-0.5 ${aspectRatio === r.id ? "text-[#E5DECF]" : "text-[#6C7167]"}`}>
                    {r.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="submit"
            disabled={generateMutation.isPending}
            style={{ backgroundColor: "#123D28", color: "#FFFFFF" }}
            className="w-full py-4 px-6 rounded-xl font-bold text-sm uppercase tracking-wider text-white shadow-lg hover:shadow-xl hover:!bg-[#0E3020] active:scale-[0.99] flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 cursor-pointer border-none"
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw size={18} className="animate-spin text-[#E8BF83]" /> Generating Photorealistic Visual...
              </>
            ) : (
              <>
                <Sparkles size={18} className="text-[#E8BF83]" /> Generate Product Visual
              </>
            )}
          </button>
        </form>

        {/* Right Column: Preview & Assign to Catalog */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-6 rounded-2xl shadow-xs space-y-4">
            <h3 className="font-serif text-base font-bold text-[#123D28] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon size={18} className="text-[#AE6A2B]" /> Studio Output
              </span>
              {generatedImage && (
                <a
                  href={generatedImage}
                  download="trinayaa_ai_product.jpg"
                  className="text-xs text-[#AE6A2B] hover:underline inline-flex items-center gap-1 font-bold"
                >
                  <Download size={14} /> Download HD
                </a>
              )}
            </h3>

            {/* Image Canvas Box */}
            <div className="aspect-square w-full rounded-xl overflow-hidden border border-[#DEDFD5] bg-[#FBF8F0] flex items-center justify-center relative group shadow-inner">
              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated Botanical Product"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                />
              ) : (
                <div className="text-center p-6 text-[#6C7167]">
                  <Wand2 size={40} className="mx-auto text-[#AE6A2B]/40 mb-3" />
                  <p className="text-xs font-semibold text-[#123D28]">No Visual Generated Yet</p>
                  <p className="text-[11px] text-[#6C7167] mt-1 max-w-xs">
                    Select a preset or enter your custom packaging prompt and click Generate to produce commercial images.
                  </p>
                </div>
              )}
            </div>

            {/* Assign to Product Controls */}
            {generatedImage && (
              <div className="p-4 rounded-xl border border-[#DEDFD5] bg-[#FBF8F0]/70 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#123D28] uppercase tracking-wider mb-1">
                    Assign Image to Store Product
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#DEDFD5] rounded-lg text-xs font-medium text-[#1A2C20] focus:outline-none focus:border-[#123D28]"
                  >
                    <option value="">-- Choose a Product ({products.length} available) --</option>
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.sku} — {prod.name} ({prod.category})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={!selectedProductId || assignMutation.isPending}
                  style={{ backgroundColor: "#722D2E", color: "#FFFFFF" }}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-md hover:!bg-[#5C2324] active:scale-[0.99] flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer border-none"
                >
                  {assignMutation.isPending ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Updating Product Image...
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Set as Live Product Image
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Session History */}
          {history.length > 1 && (
            <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-4 rounded-2xl shadow-xs">
              <h4 className="text-xs font-bold text-[#123D28] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Layers size={14} className="text-[#AE6A2B]" /> Session Generations ({history.length})
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setGeneratedImage(item.url)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      generatedImage === item.url ? "border-[#123D28] ring-2 ring-[#123D28]/30" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={item.url} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

