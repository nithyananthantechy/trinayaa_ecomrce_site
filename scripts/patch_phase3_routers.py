import os

ROUTERS_PATH = os.path.join(os.path.dirname(__file__), "..", "server", "routers.ts")

with open(ROUTERS_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports for telegram support ticket notifications
if "notifySupportTicketCreated" not in content:
    content = "import { notifySupportTicketCreated, notifySupportTicketReply } from './telegram';\n" + content

# Update assistant.chat to pass ctx.user?.id
old_assistant_chat = """      .mutation(async ({ input }) => {
        return processCustomerQuery(input.message);
      }),"""
new_assistant_chat = """      .mutation(async ({ input, ctx }) => {
        return processCustomerQuery(input.message, ctx.user?.id ? String(ctx.user.id) : undefined);
      }),"""

if old_assistant_chat in content:
    content = content.replace(old_assistant_chat, new_assistant_chat)

new_routers = """
  // ==========================================
  // 15. SUPPORT TICKETS & HELPDESK (PHASE 3)
  // ==========================================
  tickets: router({
    create: protectedProcedure
      .input(
        z.object({
          category: z.string().min(2),
          subject: z.string().min(3).max(200),
          description: z.string().min(10).max(2000),
          priority: z.enum(["Low", "Normal", "High", "Urgent"]).default("Normal"),
          orderId: z.string().optional(),
          orderNumber: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const customerId = String(ctx.user.id);
        const ticket = db.ticketsRepo.create({
          customerId,
          customerName: ctx.user.name || "Valued Customer",
          customerEmail: ctx.user.email || "support@trinayaa.in",
          customerPhone: ctx.user.phone || null,
          category: input.category,
          subject: input.subject,
          description: input.description,
          priority: input.priority,
          orderId: input.orderId,
          orderNumber: input.orderNumber,
        });

        // Async dispatch alert to authorized Telegram admins
        notifySupportTicketCreated({
          ticketNumber: ticket.ticket_number,
          category: ticket.category,
          priority: ticket.priority,
          subject: ticket.subject,
          customerName: ticket.customer_name,
        }).catch((err) => console.error("[Ticket Telegram Alert Failed]:", err));

        return ticket;
      }),

    myTickets: protectedProcedure.query(async ({ ctx }) => {
      return db.ticketsRepo.listByCustomer(String(ctx.user.id));
    }),

    getTicket: protectedProcedure
      .input(z.object({ ticketId: z.string() }))
      .query(async ({ ctx, input }) => {
        const customerId = String(ctx.user.id);
        const ticket = db.ticketsRepo.getById(input.ticketId, customerId);
        if (!ticket) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Support ticket not found" });
        }
        const messages = db.ticketsRepo.getMessages(input.ticketId, customerId) || [];
        return { ticket, messages };
      }),

    reply: protectedProcedure
      .input(
        z.object({
          ticketId: z.string(),
          message: z.string().min(1).max(2000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const customerId = String(ctx.user.id);
        const ticket = db.ticketsRepo.getById(input.ticketId, customerId);
        if (!ticket) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Support ticket not found or access denied" });
        }

        const msg = db.ticketsRepo.addMessage({
          ticketId: input.ticketId,
          senderType: "CUSTOMER",
          senderId: customerId,
          senderName: ctx.user.name || "Customer",
          message: input.message,
        });

        notifySupportTicketReply({
          ticketNumber: ticket.ticket_number,
          subject: ticket.subject,
          senderType: "CUSTOMER",
          senderName: ctx.user.name || "Customer",
          message: input.message,
        }).catch((err) => console.error("[Ticket Reply Telegram Alert Failed]:", err));

        return msg;
      }),

    // Admin endpoints
    adminList: adminProcedure
      .input(
        z.object({
          status: z.string().optional(),
          priority: z.string().optional(),
          category: z.string().optional(),
          search: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return db.ticketsRepo.listAll(input || {});
      }),

    adminGet: adminProcedure
      .input(z.object({ ticketId: z.string() }))
      .query(async ({ input }) => {
        const ticket = db.ticketsRepo.getById(input.ticketId);
        if (!ticket) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
        }
        const messages = db.ticketsRepo.getMessages(input.ticketId) || [];
        const auditLogs = db.ticketsRepo.getAuditLogs(input.ticketId) || [];
        return { ticket, messages, auditLogs };
      }),

    adminReply: adminProcedure
      .input(
        z.object({
          ticketId: z.string(),
          message: z.string().min(1).max(2000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const ticket = db.ticketsRepo.getById(input.ticketId);
        if (!ticket) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
        }

        const adminName = ctx.user.name || "TRINAYAA Support";
        const msg = db.ticketsRepo.addMessage({
          ticketId: input.ticketId,
          senderType: "ADMIN",
          senderId: String(ctx.user.id),
          senderName: adminName,
          message: input.message,
        });

        return msg;
      }),

    adminUpdateStatus: adminProcedure
      .input(
        z.object({
          ticketId: z.string(),
          status: z.enum(["Open", "In Progress", "Waiting for Customer", "Resolved", "Closed"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const adminName = ctx.user.name || "Administrator";
        return db.ticketsRepo.updateStatus(input.ticketId, input.status, adminName, input.notes);
      }),

    adminUpdatePriority: adminProcedure
      .input(
        z.object({
          ticketId: z.string(),
          priority: z.enum(["Low", "Normal", "High", "Urgent"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const adminName = ctx.user.name || "Administrator";
        return db.ticketsRepo.updatePriority(input.ticketId, input.priority, adminName);
      }),

    adminAssign: adminProcedure
      .input(
        z.object({
          ticketId: z.string(),
          adminId: z.string(),
          adminName: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const performedBy = ctx.user.name || "Administrator";
        return db.ticketsRepo.assignAdmin(input.ticketId, input.adminId, input.adminName, performedBy);
      }),

    adminMetrics: adminProcedure.query(async () => {
      return db.ticketsRepo.getMetrics();
    }),
  }),

  // ==========================================
  // 16. CUSTOMER FEEDBACK (PHASE 3)
  // ==========================================
  feedback: router({
    submit: publicProcedure
      .input(
        z.object({
          customerName: z.string().min(2),
          customerEmail: z.string().email(),
          customerPhone: z.string().optional(),
          category: z.string().min(2),
          rating: z.number().int().min(1).max(5),
          title: z.string().min(3).max(200),
          message: z.string().min(5).max(2000),
          orderId: z.string().optional(),
          orderNumber: z.string().optional(),
          productId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const customerId = ctx.user?.id ? String(ctx.user.id) : null;
        return db.feedbackRepo.create({
          ...input,
          customerId,
        });
      }),

    myFeedback: protectedProcedure.query(async ({ ctx }) => {
      return db.feedbackRepo.listByCustomer(String(ctx.user.id));
    }),

    adminList: adminProcedure
      .input(
        z.object({
          category: z.string().optional(),
          rating: z.number().optional(),
          status: z.string().optional(),
          search: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return db.feedbackRepo.listAll(input || {});
      }),

    adminRespond: adminProcedure
      .input(
        z.object({
          id: z.string(),
          response: z.string().min(1).max(2000),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return db.feedbackRepo.respond(input.id, input.response, input.notes);
      }),
  }),

  // ==========================================
  // 17. PRODUCT REVIEWS (PHASE 3)
  // ==========================================
  reviews: router({
    submit: protectedProcedure
      .input(
        z.object({
          productId: z.string(),
          rating: z.number().int().min(1).max(5),
          title: z.string().min(3).max(200),
          review: z.string().min(5).max(2000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const customerId = String(ctx.user.id);
        const customerName = ctx.user.name || "Customer";
        return db.reviewsRepo.create({
          productId: input.productId,
          customerId,
          customerName,
          rating: input.rating,
          title: input.title,
          review: input.review,
        });
      }),

    productReviews: publicProcedure
      .input(z.object({ productId: z.string() }))
      .query(async ({ input }) => {
        return db.reviewsRepo.listByProduct(input.productId);
      }),

    myReviews: protectedProcedure.query(async ({ ctx }) => {
      return db.reviewsRepo.listByCustomer(String(ctx.user.id));
    }),

    adminList: adminProcedure
      .input(
        z.object({
          status: z.string().optional(),
          productId: z.string().optional(),
          search: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return db.reviewsRepo.listAll(input || {});
      }),

    adminModerate: adminProcedure
      .input(
        z.object({
          id: z.string(),
          status: z.enum(["APPROVED", "REJECTED"]),
          adminNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return db.reviewsRepo.moderate(input.id, input.status, input.adminNotes);
      }),
  }),

  // ==========================================
  // 18. WISHLIST & SAVE FOR LATER (PHASE 3)
  // ==========================================
  wishlist: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.wishlistRepo.list(String(ctx.user.id));
    }),

    getIds: protectedProcedure.query(async ({ ctx }) => {
      return db.wishlistRepo.getUserWishlistIds(String(ctx.user.id));
    }),

    toggle: protectedProcedure
      .input(z.object({ productId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return db.wishlistRepo.toggle(String(ctx.user.id), input.productId);
      }),

    add: protectedProcedure
      .input(z.object({ productId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return db.wishlistRepo.add(String(ctx.user.id), input.productId);
      }),

    remove: protectedProcedure
      .input(z.object({ productId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return db.wishlistRepo.remove(String(ctx.user.id), input.productId);
      }),

    moveToCart: protectedProcedure
      .input(
        z.object({
          productId: z.string(),
          packSize: z.string().default("100g"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.wishlistRepo.moveToCart(String(ctx.user.id), input.productId, input.packSize);
      }),

    saveForLater: protectedProcedure
      .input(
        z.object({
          productId: z.string(),
          cartItemId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.wishlistRepo.saveForLater(String(ctx.user.id), input.productId, input.cartItemId);
      }),
  }),
"""

# Insert new routers right before final closing });
idx = content.rfind("});\n\nexport type AppRouter")
if idx == -1:
    idx = content.rfind("});\nexport type AppRouter")

if idx != -1 and "tickets: router({" not in content:
    content = content[:idx] + new_routers + content[idx:]
    with open(ROUTERS_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added Phase 3 routers (tickets, feedback, reviews, wishlist) to server/routers.ts")
else:
    print("Routers already added or closing tag not found")
