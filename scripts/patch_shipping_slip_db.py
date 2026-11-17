with open('server/db.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = """    return [headers.join(","), ...rows].join("\\n");
  }
};"""

replacement = """    return [headers.join(","), ...rows].join("\\n");
  },

  getShippingSlip(orderIdentifier: string) {
    const db = getDatabase();
    const order = (db.prepare("SELECT * FROM orders WHERE id = ? OR orderNumber = ?").get(orderIdentifier, orderIdentifier) || null) as any;
    if (!order) return null;
    const enriched = this.enrichOrder(order);

    let parsedAddress = enriched.shippingAddress;
    if (typeof parsedAddress === "string") {
      try {
        parsedAddress = JSON.parse(parsedAddress);
      } catch {
        parsedAddress = { street: parsedAddress, city: "", state: "Tamil Nadu", pinCode: "" };
      }
    }

    const addressLines = [
      parsedAddress?.recipientName ? `Attn: ${parsedAddress.recipientName}` : null,
      parsedAddress?.addressLine1 || parsedAddress?.street,
      parsedAddress?.addressLine2,
      parsedAddress?.landmark ? `Landmark: ${parsedAddress.landmark}` : null,
      parsedAddress?.district,
      parsedAddress?.city,
      parsedAddress?.state ? `${parsedAddress.state} - ${parsedAddress?.pinCode || ""}` : parsedAddress?.pinCode,
    ].filter(Boolean);

    return {
      orderId: enriched.id,
      orderNumber: enriched.orderNumber,
      createdAt: enriched.createdAt,
      orderDate: new Date(enriched.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      customerName: enriched.customerName,
      customerPhone: enriched.customerPhone,
      customerEmail: enriched.customerEmail,
      shippingAddress: parsedAddress,
      formattedAddress: addressLines.join(", "),
      items: (enriched.items || []).map((it: any) => ({
        id: it.id,
        productId: it.productId,
        productNameEn: it.productNameEn || it.name,
        productNameTa: it.productNameTa || "",
        sku: it.sku || `TRN-${it.productId?.replace(/\\D/g, "") || "ITEM"}`,
        packSize: it.packSize || "100g",
        price: it.price || it.unitPrice,
        quantity: it.quantity,
        subtotal: (it.price || it.unitPrice) * it.quantity,
      })),
      subtotal: enriched.subtotal,
      shippingFee: enriched.shippingFee || 0,
      discountAmount: enriched.discountAmount || 0,
      total: enriched.total,
      paymentMethod: enriched.paymentMethod,
      paymentStatus: enriched.paymentStatus,
      orderStatus: enriched.orderStatus,
      trackingNumber: enriched.trackingNumber || null,
      carrier: enriched.carrier || null,
    };
  }
};"""

assert target in content, "Could not find target in server/db.ts"
content = content.replace(target, replacement, 1)

with open('server/db.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Added ordersRepo.getShippingSlip to server/db.ts")
