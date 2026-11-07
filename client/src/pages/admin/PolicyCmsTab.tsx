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

export default function PolicyCmsTab() {
  const [selectedSlug, setSelectedSlug] = useState<string>("shipping");
  const [mode, setMode] = useState<"edit" | "preview">("edit");

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
      setContent(currentPolicy.content || "");
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
    updatePolicyMutation.mutate({
      slug: selectedSlug,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      content,
      isPublished,
      lastUpdated: lastUpdated.trim() || undefined,
    });
  };

  // Helper to insert markdown/HTML formatting at cursor
  const insertFormatting = (tagStart: string, tagEnd: string) => {
    const textarea = document.getElementById("policy-editor-textarea") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || "Text";
    const replacement = `${tagStart}${selectedText}${tagEnd}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    // Reset selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagStart.length, start + tagStart.length + selectedText.length);
    }, 10);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#DEDFD5] rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#AE6A2B] uppercase tracking-wider">Store Governance</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Phase 8 Policy CMS
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#123D28] mt-1">Website Policies & Legal CMS</h2>
          <p className="text-xs text-[#6C7167] mt-1">
            Manage your store's customer-facing policies dynamically without modifying source code. All published policies render directly to storefront visitors.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              refetch();
              toast.info("Refreshed policy data");
            }}
            className="text-xs text-[#6C7167] hover:text-[#123D28] flex items-center gap-1.5 py-2 px-3 border border-[#DEDFD5] rounded-lg bg-white"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <a
            href={`/policies/${selectedSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#123D28] font-bold flex items-center gap-1.5 py-2 px-3.5 bg-[#FAF8F2] hover:bg-[#EFECE4] border border-[#DEDFD5] rounded-lg transition-colors"
          >
            <span>View Live Page</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Policy Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {POLICY_METADATA.map((meta) => {
          const doc = policies.find((p) => p.slug === meta.slug);
          const isSelected = selectedSlug === meta.slug;
          const Icon = meta.icon;

          return (
            <button
              key={meta.slug}
              type="button"
              onClick={() => {
                setSelectedSlug(meta.slug);
                setMode("edit");
              }}
              className={`p-4 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? "bg-[#123D28] text-white border-[#123D28] shadow-md"
                  : "bg-white text-[#123D28] border-[#DEDFD5] hover:border-[#123D28]/40 shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    isSelected ? "bg-white/10 text-white" : "bg-[#FBF8F0] text-[#123D28]"
                  }`}
                >
                  <Icon size={18} />
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
                  {doc?.isPublished ? "Published" : "Draft / Hidden"}
                </span>
              </div>

              <div className={`font-serif text-sm font-bold ${isSelected ? "text-white" : "text-[#123D28]"}`}>
                {meta.label}
              </div>
              <p
                className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${
                  isSelected ? "text-white/80" : "text-[#6C7167]"
                }`}
              >
                {meta.description}
              </p>
              <div
                className={`text-[10px] font-mono mt-2 pt-2 border-t ${
                  isSelected ? "border-white/15 text-white/60" : "border-[#EFECE4] text-[#8C9286]"
                }`}
              >
                Last Updated: {doc?.lastUpdated || "Draft"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Policy Editor Container */}
      <div className="bg-white border border-[#DEDFD5] rounded-xl shadow-xs overflow-hidden">
        {/* Editor Sub-Header */}
        <div className="p-4 sm:p-5 border-b border-[#DEDFD5] flex items-center justify-between flex-wrap gap-4 bg-[#FAF8F2]">
          <div className="flex items-center gap-3">
            <div className="flex border border-[#DEDFD5] rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setMode("edit")}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                  mode === "edit" ? "bg-[#123D28] text-white" : "text-[#6C7167] hover:text-[#123D28]"
                }`}
              >
                Edit Policy
              </button>
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  mode === "preview" ? "bg-[#123D28] text-white" : "text-[#6C7167] hover:text-[#123D28]"
                }`}
              >
                <Eye size={13} />
                <span>Live Preview</span>
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

            {/* Quick Format Toolbar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#123D28]">Policy Document Content</label>
                <span className="text-[10px] text-[#6C7167]">Safe HTML &amp; Markdown tags supported</span>
              </div>

              <div className="flex items-center gap-1 p-2 bg-[#F6F5EE] border border-[#DEDFD5] rounded-t-lg flex-wrap text-xs">
                <button
                  type="button"
                  title="Section Heading (H2)"
                  onClick={() => insertFormatting("<h2>", "</h2>\n")}
                  className="p-1.5 rounded hover:bg-white text-[#123D28] font-bold border border-transparent hover:border-[#DEDFD5]"
                >
                  <Heading2 size={15} />
                </button>
                <button
                  type="button"
                  title="Sub-Section (H3)"
                  onClick={() => insertFormatting("<h3>", "</h3>\n")}
                  className="p-1.5 rounded hover:bg-white text-[#123D28] font-bold border border-transparent hover:border-[#DEDFD5]"
                >
                  <Heading3 size={15} />
                </button>
                <div className="h-4 w-px bg-[#DEDFD5] mx-1"></div>
                <button
                  type="button"
                  title="Paragraph"
                  onClick={() => insertFormatting("<p>", "</p>\n")}
                  className="p-1.5 rounded hover:bg-white text-[#123D28] border border-transparent hover:border-[#DEDFD5] text-[11px] font-mono px-2"
                >
                  &lt;p&gt;
                </button>
                <button
                  type="button"
                  title="Bold"
                  onClick={() => insertFormatting("<strong>", "</strong>")}
                  className="p-1.5 rounded hover:bg-white text-[#123D28] border border-transparent hover:border-[#DEDFD5]"
                >
                  <Bold size={15} />
                </button>
                <button
                  type="button"
                  title="Italic"
                  onClick={() => insertFormatting("<em>", "</em>")}
                  className="p-1.5 rounded hover:bg-white text-[#123D28] border border-transparent hover:border-[#DEDFD5]"
                >
                  <Italic size={15} />
                </button>
                <div className="h-4 w-px bg-[#DEDFD5] mx-1"></div>
                <button
                  type="button"
                  title="Bullet List"
                  onClick={() => insertFormatting("<ul>\n  <li>", "</li>\n</ul>\n")}
                  className="p-1.5 rounded hover:bg-white text-[#123D28] border border-transparent hover:border-[#DEDFD5]"
                >
                  <List size={15} />
                </button>
                <button
                  type="button"
                  title="Numbered List"
                  onClick={() => insertFormatting("<ol>\n  <li>", "</li>\n</ol>\n")}
                  className="p-1.5 rounded hover:bg-white text-[#123D28] border border-transparent hover:border-[#DEDFD5]"
                >
                  <ListOrdered size={15} />
                </button>
                <button
                  type="button"
                  title="Insert Link"
                  onClick={() => insertFormatting('<a href="https://trinayaa.in">', "</a>")}
                  className="p-1.5 rounded hover:bg-white text-[#123D28] border border-transparent hover:border-[#DEDFD5]"
                >
                  <LinkIcon size={15} />
                </button>
              </div>

              <textarea
                id="policy-editor-textarea"
                rows={16}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write policy content using standard headings, paragraphs, and list items..."
                className="w-full p-4 border border-[#DEDFD5] rounded-b-lg text-xs font-mono bg-white focus:outline-none focus:border-[#123D28] leading-relaxed"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#EFECE4]">
              <span className="text-xs text-[#6C7167]">
                Changes are automatically sanitized on save to prevent malicious script injection.
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
              dangerouslySetInnerHTML={{ __html: content || "<p>No content entered yet.</p>" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
