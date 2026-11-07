with open('server/db.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add sanitize import at top
old_import = 'import { notificationsService, type OrderNotificationEvent } from "./notifications.ts";'
new_import = 'import { notificationsService, type OrderNotificationEvent } from "./notifications.ts";\nimport { generateWhatsAppLink, isValidSocialUrl } from "./sanitize";'
assert old_import in content, "old_import not found"
content = content.replace(old_import, new_import, 1)

# 2. Add PolicyDocument, SocialLinksConfig, policiesRepo and socialLinksRepo at bottom
phase8_repos = '''

// ==========================================
// 22. WEBSITE POLICIES CMS REPOSITORY (PHASE 8)
// ==========================================
export interface PolicyDocument {
  slug: string;
  title: string;
  subtitle?: string;
  content: string;
  isPublished: boolean;
  lastUpdated: string;
}

export const policiesRepo = {
  getPolicy(slug: string): PolicyDocument | null {
    const cleanSlug = slug.toLowerCase().trim();
    const key = `policy_content_${cleanSlug}`;
    const raw = siteContentRepo.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PolicyDocument;
    } catch {
      return null;
    }
  },

  getAllPolicies(): PolicyDocument[] {
    const slugs = ["shipping", "returns", "privacy", "terms"];
    return slugs.map((slug) => {
      const doc = this.getPolicy(slug);
      if (doc) return doc;
      return {
        slug,
        title:
          slug === "shipping"
            ? "Shipping & Delivery Policy"
            : slug === "returns"
            ? "Return & Refund Policy"
            : slug === "privacy"
            ? "Privacy Policy"
            : "Terms & Conditions",
        subtitle: "",
        content: "<p>Policy draft under review by TRINAYAA administration.</p>",
        isPublished: false,
        lastUpdated: "Draft",
      };
    });
  },

  updatePolicy(data: {
    slug: string;
    title: string;
    subtitle?: string;
    content: string;
    isPublished: boolean;
    lastUpdated?: string;
    actor?: string;
  }): PolicyDocument {
    const cleanSlug = data.slug.toLowerCase().trim();
    const validSlugs = ["shipping", "returns", "privacy", "terms"];
    if (!validSlugs.includes(cleanSlug)) {
      throw new Error(`Invalid policy slug "${data.slug}". Must be one of: ${validSlugs.join(", ")}`);
    }

    if (!data.title || !data.title.trim()) {
      throw new Error("Policy title cannot be empty.");
    }

    const key = `policy_content_${cleanSlug}`;
    const updatedDate =
      data.lastUpdated && data.lastUpdated.trim()
        ? data.lastUpdated.trim()
        : new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const doc: PolicyDocument = {
      slug: cleanSlug,
      title: data.title.trim(),
      subtitle: data.subtitle?.trim() || "",
      content: data.content,
      isPublished: Boolean(data.isPublished),
      lastUpdated: updatedDate,
    };

    siteContentRepo.set(key, JSON.stringify(doc));

    auditLogsRepo.log(
      data.actor || "Admin",
      "POLICY_UPDATED",
      `Updated policy "${doc.title}" (${cleanSlug}): published=${doc.isPublished}`
    );

    return doc;
  },
};

// ==========================================
// 23. SOCIAL MEDIA & WHATSAPP LINKS REPOSITORY (PHASE 8)
// ==========================================
export interface SocialLinksConfig {
  instagram: string;
  facebook: string;
  whatsappPhone: string;
  whatsappMessage: string;
  whatsappUrl: string;
}

export const socialLinksRepo = {
  getConfig(): SocialLinksConfig {
    const instagram = siteContentRepo.get("social_instagram") || "";
    const facebook = siteContentRepo.get("social_facebook") || "";
    const whatsappPhone = siteContentRepo.get("social_whatsapp_phone") || "";
    const whatsappMessage = siteContentRepo.get("social_whatsapp_message") || "";
    const whatsappUrl = generateWhatsAppLink(whatsappPhone, whatsappMessage);

    return {
      instagram,
      facebook,
      whatsappPhone,
      whatsappMessage,
      whatsappUrl,
    };
  },

  updateConfig(data: {
    instagram?: string;
    facebook?: string;
    whatsappPhone?: string;
    whatsappMessage?: string;
    actor?: string;
  }): SocialLinksConfig {
    if (data.instagram !== undefined) {
      const val = data.instagram.trim();
      if (val && !isValidSocialUrl(val, "instagram")) {
        throw new Error("Invalid Instagram URL. Must be a valid HTTPS URL pointing to instagram.com.");
      }
      siteContentRepo.set("social_instagram", val);
    }

    if (data.facebook !== undefined) {
      const val = data.facebook.trim();
      if (val && !isValidSocialUrl(val, "facebook")) {
        throw new Error("Invalid Facebook URL. Must be a valid HTTPS URL pointing to facebook.com.");
      }
      siteContentRepo.set("social_facebook", val);
    }

    if (data.whatsappPhone !== undefined) {
      const val = data.whatsappPhone.trim();
      if (val) {
        const clean = val.replace(/[^0-9]/g, "");
        if (clean.length < 10 || clean.length > 15) {
          throw new Error("Invalid WhatsApp phone number. Please enter a valid 10-digit Indian phone number or international number.");
        }
      }
      siteContentRepo.set("social_whatsapp_phone", val);
    }

    if (data.whatsappMessage !== undefined) {
      siteContentRepo.set("social_whatsapp_message", data.whatsappMessage.trim());
    }

    auditLogsRepo.log(
      data.actor || "Admin",
      "SOCIAL_LINKS_UPDATED",
      `Updated social media links & WhatsApp configuration`
    );

    return this.getConfig();
  },
};
'''

content += phase8_repos

with open('server/db.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully patched server/db.ts for Phase 8!")
