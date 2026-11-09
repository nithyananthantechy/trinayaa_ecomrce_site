import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  FileText,
  Save,
  Eye,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Truck,
  RotateCcw,
  ExternalLink,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Code,
  Type,
} from "lucide-react";

interface PolicyDoc {
  slug: string;
  title: string;
  subtitle?: string;
  content: string;
  isPublished: boolean;
  lastUpdated: string;
}

const POLICY_METADATA = [
  {
    slug: "shipping",
    label: "Shipping & Delivery",
    icon: Truck,
    description: "Pan-India dispatch timelines, courier partners, tracking, and delivery charges.",
  },
  {
    slug: "returns",
    label: "Return & Refund",
    icon: RotateCcw,
    description: "7-day replacement guarantee, return conditions, and payment reversals.",
  },
  {
    slug: "privacy",
    label: "Privacy Policy",
    icon: ShieldCheck,
    description: "Data protection, Razorpay PCI-DSS encryption, and customer privacy commitments.",
  },
  {
    slug: "terms",
    label: "Terms & Conditions",
    icon: FileText,
    description: "Store terms of service, botanical dietary disclaimers, and governing jurisdiction.",
  },
];

// =========================================================================
// SMART POLICY FORMATTER: Eliminates HTML tags for non-technical clients
// =========================================================================
export function htmlToNaturalText(html: string): string {
  if (!html) return "";
  let text = html;
  // Convert standard HTML tags to natural text/markdown
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n");
  text = text.replace(/<\/?(?:ul|ol)[^>]*>/gi, "\n");
  text = text.replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi, "**$1**");
  text = text.replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gi, "*$1*");
  text = text.replace(/<a\s+[^>]*href=["'](.*?)["'][^>]*>(.*?)<\/a>/gi, "[$2]($1)");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  // Strip any remaining unknown HTML tags
  text = text.replace(/<[^>]+>/g, "");
  // Normalize triple newlines to double newlines
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

export function naturalTextToHtml(rawText: string): string {
  if (!rawText) return "";
  const trimmed = rawText.trim();
  
  // If the user already wrote pure raw HTML with tags, preserve it
  if (/<(?:h[1-6]|p|ul|ol|li|div)\b/i.test(trimmed)) {
    return trimmed;
  }

  const lines = trimmed.split("\n");
  const htmlBlocks: string[] = [];
  let inList = false;
  let listType: "ul" | "ol" = "ul";
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      let content = currentParagraphLines.join(" ").trim();
      if (content) {
        // Inline formatting: bold, italic, links
        content = content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        content = content.replace(/\*(.+?)\*/g, "<em>$1</em>");
        content = content.replace(/\[(.+?)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        htmlBlocks.push(`<p>${content}</p>`);
      }
      currentParagraphLines = [];
    }
  };

  const flushList = () => {
    if (inList) {
      htmlBlocks.push(`</${listType}>`);
      inList = false;
    }
  };

  for (const line of lines) {
    const s = line.trim();
    if (!s) {
      flushParagraph();
      flushList();
      continue;
    }

    // 1. Check Section Heading (H2): "## Title" or numbered title like "1. Title" / "Section 1: Title"
    const isExplicitH2 = /^##\s+(.+)$/.exec(s);
    const isNumberedHeading = /^(?:SECTION\s+\d+:?|\d+\.)\s+([A-Z][A-Za-z0-9\s—–,-]{2,60})$/.exec(s);
    if (isExplicitH2 || (isNumberedHeading && s.length < 65)) {
      flushParagraph();
      flushList();
      const titleText = isExplicitH2 ? isExplicitH2[1].trim() : s;
      htmlBlocks.push(`<h2>${titleText}</h2>`);
      continue;
    }

    // 2. Check Sub-heading (H3): "### Title"
    const isExplicitH3 = /^###\s+(.+)$/.exec(s);
    if (isExplicitH3) {
      flushParagraph();
      flushList();
      htmlBlocks.push(`<h3>${isExplicitH3[1].trim()}</h3>`);
      continue;
    }

    // 3. Check Bullet Item: • or - or *
    const bulletMatch = /^[•\-\*]\s+(.+)$/.exec(s);
    if (bulletMatch) {
      flushParagraph();
      if (!inList || listType !== "ul") {
        flushList();
        htmlBlocks.push("<ul>");
        inList = true;
        listType = "ul";
      }
      let itemText = bulletMatch[1].trim();
      itemText = itemText.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      itemText = itemText.replace(/\*(.+?)\*/g, "<em>$1</em>");
      itemText = itemText.replace(/\[(.+?)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      htmlBlocks.push(`  <li>${itemText}</li>`);
      continue;
    }

    // 4. Check Numbered Item: "1. Item" inside an active numbered sequence
    const numMatch = /^\d+[\.\)]\s+(.+)$/.exec(s);
    if (numMatch && (inList || s.length > 55)) {
      flushParagraph();
      if (!inList || listType !== "ol") {
        flushList();
        htmlBlocks.push("<ol>");
        inList = true;
        listType = "ol";
      }
      let itemText = numMatch[1].trim();
      itemText = itemText.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      itemText = itemText.replace(/\*(.+?)\*/g, "<em>$1</em>");
      itemText = itemText.replace(/\[(.+?)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      htmlBlocks.push(`  <li>${itemText}</li>`);
      continue;
    }

    // 5. Standard paragraph text line
    flushList();
    currentParagraphLines.push(s);
  }

  flushParagraph();
  flushList();
  return htmlBlocks.join("\n");
}

export default function PolicyCmsTab() {
  const [selectedSlug, setSelectedSlug] = useState<string>("shipping");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [editorSyntaxMode, setEditorSyntaxMode] = useState<"natural" | "html">("natural");

  // Form states
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  // Queries
  const {
    data: policies = [],
    isLoading,
    refetch,
  } = trpc.admin.policies.getAll.useQuery();

  // Find currently selected policy
  const currentPolicy = policies.find((p) => p.slug === selectedSlug);

  useEffect(() => {
    if (currentPolicy) {
      setTitle(currentPolicy.title || "");
      setSubtitle(currentPolicy.subtitle || "");
      const rawContent = currentPolicy.content || "";
      // If client editor is in natural mode, automatically convert database HTML into friendly natural text!
      setContent(editorSyntaxMode === "natural" ? htmlToNaturalText(rawContent) : rawContent);
      setIsPublished(Boolean(currentPolicy.isPublished));
      setLastUpdated(currentPolicy.lastUpdated || "");
    }
  }, [currentPolicy, selectedSlug]);

  // Mutations
  const updatePolicyMutation = trpc.admin.policies.update.useMutation({
    onSuccess: (updated) => {
      toast.success(`Policy "${updated.title}" updated successfully!`);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update policy");
    },
  });

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      toast.error("Policy title cannot be empty.");
      return;
    }

    // Automatically convert client's natural text to structured HTML if in natural mode!
    const finalHtml = editorSyntaxMode === "natural" ? naturalTextToHtml(content) : content;

    updatePolicyMutation.mutate({
      slug: selectedSlug,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      content: finalHtml,
      isPublished,
      lastUpdated: lastUpdated.trim() || undefined,
    });
  };

  // Helper to insert natural formatting at cursor without HTML tags
  const insertNaturalFormatting = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("policy-editor-textarea") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || "Section Heading";
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 10);
  };

  // Switch between Natural Text mode and Raw HTML mode
  const toggleSyntaxMode = (newMode: "natural" | "html") => {
    if (newMode === editorSyntaxMode) return;
    if (newMode === "html") {
      // Convert current text to HTML
      setContent(naturalTextToHtml(content));
    } else {
      // Convert HTML back to friendly natural text
      setContent(htmlToNaturalText(content));
    }
    setEditorSyntaxMode(newMode);
  };

  // Live preview HTML content
  const previewHtml = editorSyntaxMode === "natural" ? naturalTextToHtml(content) : content;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#DEDFD5] rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#AE6A2B] uppercase tracking-wider">Store Governance</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={11} /> Auto-Tagging Enabled
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#123D28] mt-1">Website Policies &amp; Legal CMS</h2>
          <p className="text-xs text-[#6C7167] mt-1">
            Manage your store's customer-facing policies easily in plain text. Headings, paragraphs, and lists are automatically formatted into proper HTML tags.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <a
            href={`/policies/${selectedSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 text-xs font-semibold text-[#123D28] bg-[#F6F5EE] hover:bg-[#EAE8DE] border border-[#DEDFD5] rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink size={14} />
            <span>View Live Page</span>
          </a>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2 text-[#123D28] hover:bg-[#F6F5EE] border border-[#DEDFD5] rounded-lg transition-colors"
            title="Refresh policies"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Policy Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {POLICY_METADATA.map((meta) => {
          const doc = policies.find((p) => p.slug === meta.slug);
          const isSelected = selectedSlug === meta.slug;
          const Icon = meta.icon;

          return (
            <button
              key={meta.slug}
              type="button"
              onClick={() => setSelectedSlug(meta.slug)}
              className={`p-4 rounded-xl text-left transition-all border ${
                isSelected
                  ? "bg-[#123D28] text-white border-[#123D28] shadow-md ring-2 ring-[#123D28]/20"
                  : "bg-white hover:bg-[#FAF8F2] text-[#123D28] border-[#DEDFD5] shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isSelected ? "bg-white/15 text-white" : "bg-[#F6F5EE] text-[#123D28]"
                  }`}
                >
                  <Icon size={16} />
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    doc?.isPublished
                      ? isSelected
                        ? "bg-emerald-400/20 text-emerald-200 border border-emerald-400/30"
                        : "bg-emerald-100 text-emerald-800"
                      : isSelected
                      ? "bg-amber-400/20 text-amber-200 border border-amber-400/30"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {doc?.isPublished ? "Published" : "Draft"}
                </span>
              </div>
              <h3 className="font-serif font-bold text-sm tracking-tight">{meta.label}</h3>
              <p
                className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${
                  isSelected ? "text-white/75" : "text-[#6C7167]"
                }`}
              >
                {meta.description}
              </p>
              <div
                className={`mt-3 pt-2 border-t flex items-center justify-between text-[10px] ${
                  isSelected ? "border-white/10 text-white/60" : "border-[#EFECE4] text-[#8E8B82]"
                }`}
              >
                <span>Last Updated: {doc?.lastUpdated || "Nov 2026"}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Editor & Preview Workspace */}
      <div className="bg-white border border-[#DEDFD5] rounded-xl shadow-xs overflow-hidden">
        {/* Workspace Sub-Header */}
        <div className="px-6 py-3.5 border-b border-[#EFECE4] bg-[#FAF8F2] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#EAE8DE] p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setMode("edit")}
                className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  mode === "edit" ? "bg-white text-[#123D28] shadow-xs" : "text-[#6C7167] hover:text-[#123D28]"
                }`}
              >
                <FileText size={13} /> Edit Policy
              </button>
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  mode === "preview" ? "bg-white text-[#123D28] shadow-xs" : "text-[#6C7167] hover:text-[#123D28]"
                }`}
              >
                <Eye size={13} /> Live Preview
              </button>
            </div>
            <div className="text-xs text-[#6C7167] hidden sm:block">
              Slug: <span className="font-mono font-bold text-[#123D28]">/policies/{selectedSlug}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#123D28]">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded border-[#DEDFD5] text-[#123D28] focus:ring-[#123D28]"
              />
              <span>Published on Storefront</span>
            </label>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={updatePolicyMutation.isPending}
              className="px-4 py-2 bg-[#123D28] hover:bg-[#1A4D33] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Save size={14} />
              <span>{updatePolicyMutation.isPending ? "Saving..." : "Save Policy"}</span>
            </button>
          </div>
        </div>

        {/* Editor Body */}
        {mode === "edit" ? (
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#123D28] mb-1">Policy Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Shipping & Delivery Policy"
                  className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg text-xs bg-[#FAF8F2] focus:bg-white focus:outline-none focus:border-[#123D28] font-bold text-[#123D28]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#123D28] mb-1">Last Updated Display Label</label>
                <input
                  type="text"
                  value={lastUpdated}
                  onChange={(e) => setLastUpdated(e.target.value)}
                  placeholder="e.g. November 2026"
                  className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg text-xs bg-[#FAF8F2] focus:bg-white focus:outline-none focus:border-[#123D28]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#123D28] mb-1">Subtitle / Summary Banner</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Brief 1-line customer summary displayed beneath the title"
                className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg text-xs bg-[#FAF8F2] focus:bg-white focus:outline-none focus:border-[#123D28]"
              />
            </div>

            {/* Smart Auto-Tagging Notice Banner */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-700 shrink-0" />
                <span>
                  <strong>Client-Friendly Editor:</strong> Write naturally in plain text with line breaks. Proper HTML tags (headings, paragraphs, lists) are automatically generated upon saving!
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-3">
                <button
                  type="button"
                  onClick={() => toggleSyntaxMode("natural")}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                    editorSyntaxMode === "natural"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  <Type size={11} className="inline mr-1" /> Plain Text
                </button>
                <button
                  type="button"
                  onClick={() => toggleSyntaxMode("html")}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                    editorSyntaxMode === "html"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  <Code size={11} className="inline mr-1" /> Raw HTML
                </button>
              </div>
            </div>

            {/* Quick Format Toolbar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#123D28]">Policy Document Content</label>
                <span className="text-[10px] text-[#6C7167]">
                  {editorSyntaxMode === "natural" ? "Natural text · Auto-tagged on save" : "Direct HTML Mode"}
                </span>
              </div>

              <div className="flex items-center gap-1 p-2 bg-[#F6F5EE] border border-[#DEDFD5] rounded-t-lg flex-wrap text-xs">
                <button
                  type="button"
                  title="Main Section (## Heading)"
                  onClick={() => insertNaturalFormatting("\n\n## ", "\n")}
                  className="px-2 py-1 rounded hover:bg-white text-[#123D28] font-bold border border-transparent hover:border-[#DEDFD5] flex items-center gap-1 text-[11px]"
                >
                  <Heading2 size={14} /> Section Title
                </button>
                <button
                  type="button"
                  title="Sub-Section (### Subheading)"
                  onClick={() => insertNaturalFormatting("\n\n### ", "\n")}
                  className="px-2 py-1 rounded hover:bg-white text-[#123D28] font-bold border border-transparent hover:border-[#DEDFD5] flex items-center gap-1 text-[11px]"
                >
                  <Heading3 size={14} /> Sub-Section
                </button>
                <div className="h-4 w-px bg-[#DEDFD5] mx-1"></div>
                <button
                  type="button"
                  title="Bold (**text**)"
                  onClick={() => insertNaturalFormatting("**", "**")}
                  className="p-1.5 rounded hover:bg-white text-[#123D28] font-bold border border-transparent hover:border-[#DEDFD5]"
                >
                  <Bold size={14} />
                </button>
                <button
                  type="button"
                  title="Italic (*text*)"
                  onClick={() => insertNaturalFormatting("*", "*")}
                  className="p-1.5 rounded hover:bg-white text-[#123D28] border border-transparent hover:border-[#DEDFD5]"
                >
                  <Italic size={14} />
                </button>
                <div className="h-4 w-px bg-[#DEDFD5] mx-1"></div>
                <button
                  type="button"
                  title="Bullet List (• Item)"
                  onClick={() => insertNaturalFormatting("\n• ", "\n")}
                  className="p-1.5 rounded hover:bg-white text-[#123D28] border border-transparent hover:border-[#DEDFD5]"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  title="Numbered List (1. Item)"
                  onClick={() => insertNaturalFormatting("\n1. ", "\n")}
                  className="p-1.5 rounded hover:bg-white text-[#123D28] border border-transparent hover:border-[#DEDFD5]"
                >
                  <ListOrdered size={14} />
                </button>
                <button
                  type="button"
                  title="Insert Link ([Text](URL))"
                  onClick={() => insertNaturalFormatting("[TRINAYAA Helpdesk](https://trinayaa.in)")}
                  className="p-1.5 rounded hover:bg-white text-[#123D28] border border-transparent hover:border-[#DEDFD5]"
                >
                  <LinkIcon size={14} />
                </button>
              </div>

              <textarea
                id="policy-editor-textarea"
                rows={16}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write policy content naturally here...

Example:
## 1. Fast Dispatch
All items dispatched within 24-48 hours. Express delivery across Tamil Nadu in 2-3 business days and Pan-India in 4-6 business days.

## 2. Courier Partners
We partner with India's most trusted logistics networks:
• Blue Dart Express
• Delhivery
• India Post Speed Post

## 3. Damaged Deliveries
If you receive a package with outer tamper or transit damage, simply inform us within 48 hours for immediate replacement."
                className={`w-full p-4 border border-[#DEDFD5] rounded-b-lg text-xs leading-relaxed bg-white focus:outline-none focus:border-[#123D28] ${
                  editorSyntaxMode === "natural" ? "font-sans text-gray-800" : "font-mono text-gray-900"
                }`}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#EFECE4]">
              <span className="text-xs text-[#6C7167]">
                Changes are automatically formatted with proper HTML tags and sanitized on save.
              </span>
              <button
                type="submit"
                disabled={updatePolicyMutation.isPending}
                className="px-6 py-2 bg-[#123D28] hover:bg-[#1A4D33] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Save size={14} />
                <span>{updatePolicyMutation.isPending ? "Saving..." : "Save Policy Changes"}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Live Storefront Preview */
          <div className="p-8 max-w-4xl mx-auto space-y-8 bg-[#FAF8F2]">
            <div className="border-b border-[#E5DECF] pb-6">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-[#123D28] bg-[#EAE3D2] px-3 py-1 rounded-full mb-3">
                <ShieldCheck size={14} /> Official Store Policy · Live Preview
              </span>
              <h1 className="text-3xl font-serif font-bold text-[#123D28] mb-2">{title || "Policy Title"}</h1>
              {subtitle && <p className="text-sm text-[#4A5568] max-w-2xl">{subtitle}</p>}
              <span className="text-xs text-[#718096] block mt-3 font-mono">
                Last Updated: {lastUpdated || "November 2026"} · TRINAYAA ENTERPRISES
              </span>
            </div>

            {!isPublished && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span>
                  <strong>Draft Notice:</strong> This policy is currently marked as unpublished. Storefront visitors will see a standard update notice until published.
                </span>
              </div>
            )}

            <div
              className="bg-white p-6 sm:p-8 rounded-xl border border-[#E5DECF] shadow-xs space-y-4 text-xs text-[#374151] leading-relaxed [&>h2]:font-serif [&>h2]:text-base [&>h2]:font-bold [&>h2]:text-[#123D28] [&>h2]:mt-6 [&>h2]:mb-2 [&>h3]:font-serif [&>h3]:font-bold [&>h3]:text-[#123D28] [&>h3]:mt-4 [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1.5 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1.5 [&>a]:text-[#AE6A2B] [&>a]:underline"
              dangerouslySetInnerHTML={{ __html: previewHtml || "<p>No content entered yet.</p>" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
