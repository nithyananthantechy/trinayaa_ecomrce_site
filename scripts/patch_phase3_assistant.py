import os

ASSISTANT_PATH = os.path.join(os.path.dirname(__file__), "..", "server", "customerAssistant.ts")

with open(ASSISTANT_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# Replace export async function processCustomerMessage(message: string) signature to accept contextUserId
old_sig = "export async function processCustomerMessage(message: string): Promise<AssistantResponse> {"
new_sig = "export async function processCustomerMessage(message: string, contextUserId?: string): Promise<AssistantResponse> {"

if old_sig in content:
    content = content.replace(old_sig, new_sig)

# Add FAQ sections before store policies
faq_enhancements = """
  // 1B. Authenticated User Order Check
  if (contextUserId && (lowerMsg === "my orders" || lowerMsg === "my order" || lowerMsg.includes("track my order") || lowerMsg.includes("check my order") || lowerMsg.includes("recent order")) && !orderMatch) {
    try {
      const userOrders = db.ordersRepo.listByCustomer(contextUserId);
      if (userOrders && userOrders.length > 0) {
        const latest = userOrders[0];
        const statusEmoji = latest.orderStatus === "Delivered" ? "🎉" : latest.orderStatus === "Shipped" ? "🚚" : "📦";
        const reply = `### ${statusEmoji} Your Latest Order: **${latest.orderNumber}**\\n\\n` +
          `• **Status:** \`${latest.orderStatus}\`\\n` +
          `• **Payment:** ${latest.paymentStatus === "PAID" ? "✅ Verified" : latest.paymentStatus}\\n` +
          `• **Order Total:** ₹${latest.total}\\n` +
          `• **Ordered On:** ${new Date(latest.createdAt).toLocaleDateString()}\\n` +
          (latest.trackingNumber ? `• **Tracking Number:** \`${latest.trackingNumber}\` via ${latest.carrier || "Blue Dart"}\\n\\n` : "\\n") +
          `You have **${userOrders.length}** total orders in your account. You can view full invoices and delivery snapshots anytime in your **Account > My Orders** portal!`;

        return {
          reply,
          products: [],
          orderInfo: {
            orderNumber: latest.orderNumber,
            orderStatus: latest.orderStatus,
            paymentStatus: latest.paymentStatus,
            total: latest.total,
            carrier: latest.carrier,
            trackingNumber: latest.trackingNumber,
            itemCount: 1,
            itemsSummary: `Order ${latest.orderNumber}`
          },
          quickPrompts: [
            "🚚 Pan-India delivery timelines",
            "🎫 Create a Support Ticket",
            "🌿 Explore all 162 catalog products"
          ],
          verified: true,
          modelUsed: "TRINAYAA Live Customer Database"
        };
      }
    } catch (e) {
      // Fallback
    }
  }

  // 1C. FAQ: Products Guidance (Raw powders, seeds vs herbs, botanical names)
  if (lowerMsg.includes("what are raw powders") || lowerMsg.includes("raw powder") || lowerMsg.includes("powder quality")) {
    const reply = `### 🌿 What Are TRINAYAA Raw Powders?\\n\\n` +
      `TRINAYAA raw botanical powders are **100% single-origin, pure herbal ingredients**:\\n\\n` +
      `• **Pure Plant Parts:** Sourced strictly from authenticated leaves, roots, barks, flowers, or seeds.\\n` +
      `• **Clean Traditional Processing:** Gently shade-dried and micro-milled to an ultra-fine 80–100 mesh texture to maximize bioavailability.\\n` +
      `• **Zero Fillers or Additives:** No artificial colors, preservatives, silicon dioxide, maltodextrin, or anti-caking agents.\\n` +
      `• **Fresh Aroma & Potency:** Retains natural phytoconstituents and signature herbal fragrance.\\n\\n` +
      `_Packaged in food-grade, moisture-barrier zip-lock standup kraft pouches for lasting freshness._`;

    return {
      reply,
      products: findMatchingProducts("powder", 3),
      quickPrompts: [
        "🌿 Difference between seeds, herbs, and powders?",
        "🔬 What does a botanical name mean?",
        "🍵 How do I choose a product?"
      ],
      verified: true,
      modelUsed: "TRINAYAA Botanical Knowledge Engine"
    };
  }

  if (lowerMsg.includes("difference") && (lowerMsg.includes("seed") || lowerMsg.includes("herb") || lowerMsg.includes("powder"))) {
    const reply = `### 🌿 Seeds vs. Herbs vs. Raw Powders\\n\\n` +
      `• **Whole Seeds:** Unprocessed botanical seeds (e.g. Flax Seeds, Black Cumin, Fenugreek) ideal for cooking, sprouting, or direct decoctions.\\n` +
      `• **Cut Herbs & Barks:** Whole sun-cured roots, leaves, and barks (e.g. Arjun bark, Licorice cuts) traditional for boiling kashayams and teas.\\n` +
      `• **Micro-Milled Powders:** Finely pulverised herbs designed for easy intake with warm water, milk, honey, or topical skin & hair masks.\\n\\n` +
      `_All three categories share the exact same 100% pure botanical origin with zero artificial processing._`;

    return {
      reply,
      products: findMatchingProducts("seeds", 3),
      quickPrompts: [
        "🌿 How do I choose a product for my needs?",
        "🍵 How to take botanical powders?",
        "🚚 Pan-India delivery details"
      ],
      verified: true,
      modelUsed: "TRINAYAA Botanical Knowledge Engine"
    };
  }

  if (lowerMsg.includes("botanical name") || lowerMsg.includes("scientific name") || lowerMsg.includes("latin name")) {
    const reply = `### 🔬 Understanding Botanical Names\\n\\n` +
      `Every TRINAYAA product displays its international Latin botanical binomial (e.g., *Withania somnifera* for Ashwagandha or *Moringa oleifera* for Drumstick leaf):\\n\\n` +
      `• **Guaranteed Species Accuracy:** Common regional names vary widely across Tamil Nadu and India; botanical names ensure you receive the exact, authentic medicinal plant.\\n` +
      `• **Pharmacopeia Verification:** Verified against classical Siddha and Ayurvedic Materia Medica standards.\\n` +
      `• **Zero Adulteration:** Guarantees no substitution with inferior related species.`;

    return {
      reply,
      products: findMatchingProducts("ashwagandha", 2),
      quickPrompts: [
        "🌿 What are raw powders?",
        "🍵 How to use Ashwagandha powder?",
        "📦 Explore all 162 catalog products"
      ],
      verified: true,
      modelUsed: "TRINAYAA Botanical Knowledge Engine"
    };
  }

  // 1D. FAQ: Account, Mobile OTP & Address Book
  if (lowerMsg.includes("account") || lowerMsg.includes("otp") || lowerMsg.includes("login") || lowerMsg.includes("register")) {
    const reply = `### 👤 TRINAYAA Customer Account & Mobile OTP\\n\\n` +
      `• **Instant Mobile OTP Access:** Enter your 10-digit Indian mobile number to receive a secure 6-digit OTP via SMS. No complicated passwords required!\\n` +
      `• **Email & Password Login:** You can also sign in or register with email and password anytime.\\n` +
      `• **Saved Address Book:** Save multiple delivery addresses (Home, Work, Other) and designate a Default address for fast 1-click checkout.\\n` +
      `• **Order Invoices & Tracking:** View complete past purchase history and live carrier tracking numbers.\\n` +
      `• **Wishlist & Helpdesk:** Manage saved products and track your customer support tickets directly from **/account**.\\n\\n` +
      `_Tap 'Account' in the top header to sign in or manage your details._`;

    return {
      reply,
      products: [],
      quickPrompts: [
        "📦 Track my order (e.g. TRN-10482)",
        "🎫 How to raise a support ticket?",
        "🚚 Shipping & delivery times"
      ],
      verified: true,
      modelUsed: "TRINAYAA Account Guidance"
    };
  }

  // 1E. FAQ: Support Tickets, Complaints & Helpdesk Escalation
  if (lowerMsg.includes("ticket") || lowerMsg.includes("complaint") || lowerMsg.includes("support") || lowerMsg.includes("helpdesk") || lowerMsg.includes("contact support") || lowerMsg.includes("human")) {
    const reply = `### 🎫 Customer Support & Issue Helpdesk\\n\\n` +
      `We are committed to 100% customer satisfaction. If you encounter any issue, you can raise an official support ticket:\\n\\n` +
      `• **How to Create a Ticket:** Head to **Account > Support Helpdesk** or submit your issue here.\\n` +
      `• **Supported Categories:** Order issues, Payment/UPI queries, Delivery delays, Product quality, Missing or damaged items, or Account assistance.\\n` +
      `• **Tracking Your Ticket:** Every ticket receives a unique tracking code (e.g. \`TRN-SUP-2026-00001\`). Our support administrators review and respond directly to your ticket thread.\\n` +
      `• **Customer Service Hours:** Monday – Saturday, 9:00 AM – 7:00 PM IST.\\n` +
      `• **Direct Support Email:** support@trinayaa.in | **Phone:** +91 98432 00111\\n\\n` +
      `_Would you like to raise a ticket right now? You can do so directly in your Account Helpdesk._`;

    return {
      reply,
      products: [],
      quickPrompts: [
        "🎫 Go to Account Helpdesk",
        "📦 Track my recent order",
        "💳 Payment issue troubleshooting"
      ],
      verified: true,
      modelUsed: "TRINAYAA Helpdesk Knowledge Engine"
    };
  }

  if (lowerMsg.includes("payment fail") || lowerMsg.includes("money deducted") || lowerMsg.includes("payment issue")) {
    const reply = `### ⚠️ Payment Troubleshooting & Guidance\\n\\n` +
      `If your payment was debited but the order shows pending, please don't worry:\\n\\n` +
      `• **Bank Reconciliation:** Bank UPI gateways sometimes take 10–15 minutes to reconcile with Razorpay.\\n` +
      `• **Auto-Refund Guarantee:** If an order was not created, your bank or UPI app will automatically reverse the amount within 24–48 banking hours.\\n` +
      `• **Instant Assistance:** You can raise a support ticket under category **'Payment issue'** with your UPI Transaction ID or Bank Reference Number for instant verification by our finance team.\\n\\n` +
      `_All transactions on TRINAYAA are 256-bit SSL encrypted and protected by Razorpay._`;

    return {
      reply,
      products: [],
      quickPrompts: [
        "🎫 Raise a Payment Issue Ticket",
        "💳 What payment methods are accepted?",
        "📦 Track my order (TRN-XXXXX)"
      ],
      verified: true,
      modelUsed: "TRINAYAA Payment Assistance"
    };
  }
"""

# Insert faq_enhancements before line 483: // 2. Check Store Policies
marker = "  // 2. Check Store Policies (Shipping, Returns, Payment, Quality)"
if marker in content and "1C. FAQ: Products Guidance" not in content:
    content = content.replace(marker, faq_enhancements + "\n" + marker)
    with open(ASSISTANT_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated server/customerAssistant.ts with comprehensive FAQs and order awareness")
else:
    print("FAQ enhancements already present or marker not found")
