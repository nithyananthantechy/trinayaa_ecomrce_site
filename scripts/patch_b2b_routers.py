import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('server/routers.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add isDuplicateEnquiry helper
marker1 = 'import { processCustomerQuery } from "./customerAssistant";'
insert1 = '''import { processCustomerQuery } from "./customerAssistant";

// In-memory duplicate submission cache for B2B enquiries (60s cooldown)
const recentEnquiriesStore = new Map<string, number>();
function isDuplicateEnquiry(key: string, cooldownMs = 60000): boolean {
  const now = Date.now();
  for (const [k, ts] of recentEnquiriesStore.entries()) {
    if (now - ts > cooldownMs * 2) recentEnquiriesStore.delete(k);
  }
  const last = recentEnquiriesStore.get(key);
  if (last && now - last < cooldownMs) {
    return true;
  }
  recentEnquiriesStore.set(key, now);
  return false;
}
'''

if insert1.strip() not in content:
    content = content.replace(marker1, insert1)
    print("Added isDuplicateEnquiry helper.")

# 2. Add public enquiries router before admin: router({
marker2 = '// ==========================================\n  // ADMIN CONTROL PANEL ROUTER\n  // =========================================='
if marker2 not in content:
    marker2 = '// ==========================================\r\n  // ADMIN CONTROL PANEL ROUTER\r\n  // =========================================='

insert2 = '''  // ==========================================
  // B2B BULK & WHOLESALE ENQUIRIES ROUTER
  // ==========================================
  enquiries: router({
    getProductOptions: publicProcedure.query(async () => {
      const products = db.productsRepo.getAll();
      return products.map((p) => ({
        id: p.id,
        sku: p.sku,
        nameEn: p.nameEn,
        nameTa: p.nameTa,
        category: p.category,
      }));
    }),

    submit: publicProcedure
      .input(
        z.object({
          contactName: z.string().trim().min(2, "Contact name must be at least 2 characters").max(100),
          companyName: z.string().trim().min(2, "Business or company name is required").max(150),
          email: z.string().trim().email("Please enter a valid business email address"),
          phone: z
            .string()
            .trim()
            .min(8, "Phone number must be at least 8 digits")
            .max(20, "Phone number is too long")
            .regex(/^[0-9+()-\\s]{8,20}$/, "Invalid phone number format"),
          buyerType: z.enum([
            "Retailer",
            "Wholesaler",
            "Distributor",
            "Manufacturer",
            "Ayurvedic Clinic",
            "Other",
          ]),
          deliveryCity: z.string().trim().min(2, "Delivery city is required").max(100),
          deliveryState: z.string().trim().min(2, "Delivery state is required").max(100),
          requirements: z.string().trim().max(2000).optional(),
          gstNumber: z
            .string()
            .trim()
            .optional()
            .refine(
              (val) => !val || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(val),
              { message: "Please provide a valid 15-character GSTIN or leave blank" }
            ),
          items: z
            .array(
              z.object({
                productId: z.string().optional(),
                sku: z.string().min(1, "Product SKU is required"),
                productName: z.string().min(1, "Product name is required"),
                quantity: z.number().positive("Quantity must be greater than zero"),
                unit: z.string().default("kg"),
                targetPrice: z.number().positive().optional(),
              })
            )
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const clientKey = `enq_${input.email.toLowerCase()}_${input.phone}`;
        const limitCheck = checkRateLimit(clientKey, 5, 10 * 60 * 1000);
        if (!limitCheck.allowed) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many enquiries submitted recently. Please wait a few minutes before submitting another request.",
          });
        }

        const duplicateKey = `${input.email.toLowerCase()}_${input.phone}_${input.companyName.toLowerCase()}`;
        if (isDuplicateEnquiry(duplicateKey, 60000)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A quotation enquiry with these details was submitted just a moment ago. Our sales team is already reviewing it.",
          });
        }

        const enquiry = db.businessEnquiriesRepo.create({
          contactName: input.contactName,
          companyName: input.companyName,
          email: input.email,
          phone: input.phone,
          buyerType: input.buyerType,
          deliveryCity: input.deliveryCity,
          deliveryState: input.deliveryState,
          requirements: input.requirements,
          gstNumber: input.gstNumber,
          items: input.items,
        });

        return {
          success: true,
          enquiryNumber: enquiry.enquiryNumber,
          id: enquiry.id,
          message: `Your bulk enquiry (${enquiry.enquiryNumber}) has been received. Our team will contact you shortly.`,
        };
      }),
  }),

  ''' + marker2

if "enquiries: router({" not in content:
    content = content.replace(marker2, insert2)
    print("Added public enquiries router.")

# 3. Add admin enquiries router inside admin: router({
admin_marker = 'aiImage: router({'
admin_insert = '''enquiries: router({
      list: adminProcedure
        .input(
          z.object({
            search: z.string().optional(),
            status: z.string().optional(),
            limit: z.number().optional().default(50),
            offset: z.number().optional().default(0),
          })
        )
        .query(async ({ input }) => {
          return db.businessEnquiriesRepo.list(input);
        }),

      getById: adminProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
          const enq = db.businessEnquiriesRepo.getById(input.id);
          if (!enq) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Enquiry not found" });
          }
          return enq;
        }),

      updateStatus: adminProcedure
        .input(
          z.object({
            id: z.string(),
            status: z.enum(["NEW", "CONTACTED", "QUOTATION_SENT", "NEGOTIATION", "CONVERTED", "CLOSED"]),
            internalNotes: z.string().optional(),
            assignedTo: z.string().optional(),
          })
        )
        .mutation(async ({ input }) => {
          return db.businessEnquiriesRepo.updateStatus(input.id, input.status, input.internalNotes, input.assignedTo);
        }),

      exportCsv: adminProcedure.query(async () => {
        return db.businessEnquiriesRepo.exportCsv();
      }),
    }),

    aiImage: router({'''

if "enquiries: router({" in content and "adminProcedure" in content and "exportCsv: adminProcedure" not in content:
    content = content.replace(admin_marker, admin_insert)
    print("Added admin enquiries router.")

with open('server/routers.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("server/routers.ts patched successfully.")
