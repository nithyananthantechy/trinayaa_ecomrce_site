import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  LifeBuoy,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  MessageSquare,
  Send,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  X,
  History,
  Phone,
  Mail,
  Tag,
} from "lucide-react";

export default function SupportHelpdeskTab() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");

  // Data queries
  const { data: metrics, refetch: refetchMetrics } = trpc.tickets.adminMetrics.useQuery();
  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = trpc.tickets.adminList.useQuery({
    status: statusFilter,
    priority: priorityFilter,
    category: categoryFilter,
    search: searchTerm,
  });

  const {
    data: ticketDetail,
    isLoading: detailLoading,
    refetch: refetchDetail,
  } = trpc.tickets.adminGet.useQuery(
    { ticketId: selectedTicketId! },
    { enabled: Boolean(selectedTicketId) }
  );

  // Mutations
  const replyMutation = trpc.tickets.adminReply.useMutation({
    onSuccess: () => {
      toast.success("Reply dispatched to customer");
      setAdminReplyText("");
      refetchDetail();
      refetchTickets();
      refetchMetrics();
    },
    onError: (err) => toast.error(err.message || "Failed to send reply"),
  });

  const updateStatusMutation = trpc.tickets.adminUpdateStatus.useMutation({
    onSuccess: (updated) => {
      toast.success(`Ticket marked as ${updated?.status}`);
      refetchDetail();
      refetchTickets();
      refetchMetrics();
    },
    onError: (err) => toast.error(err.message || "Failed to update status"),
  });

  const updatePriorityMutation = trpc.tickets.adminUpdatePriority.useMutation({
    onSuccess: () => {
      toast.success("Priority updated");
      refetchDetail();
      refetchTickets();
      refetchMetrics();
    },
    onError: (err) => toast.error(err.message || "Failed to update priority"),
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedTicketId) return;
    replyMutation.mutate({
      ticketId: selectedTicketId,
      message: adminReplyText.trim(),
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Metrics Header Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border rounded-lg p-3 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Tickets</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{metrics?.total ?? 0}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 shadow-sm">
          <div className="text-xs font-medium text-emerald-800 uppercase tracking-wider">Open Tickets</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{metrics?.open ?? 0}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm">
          <div className="text-xs font-medium text-blue-800 uppercase tracking-wider">In Progress</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{metrics?.inProgress ?? 0}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 shadow-sm">
          <div className="text-xs font-medium text-amber-800 uppercase tracking-wider">Waiting Customer</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{metrics?.waiting ?? 0}</div>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 shadow-sm">
          <div className="text-xs font-medium text-rose-800 uppercase tracking-wider">Urgent Attention</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{metrics?.urgent ?? 0}</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="text-xs font-medium text-slate-600 uppercase tracking-wider">Avg Resolution</div>
          <div className="text-2xl font-bold text-slate-700 mt-1">
            {metrics?.avgResolutionHours ?? 0}
            <span className="text-xs font-normal text-slate-500 ml-1">hrs</span>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="bg-white border rounded-lg p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search ticket #, customer, order..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Waiting for Customer">Waiting for Customer</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-sm border rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          >
            <option value="ALL">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-sm border rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          >
            <option value="ALL">All Categories</option>
            <option value="Order issue">Order Issue</option>
            <option value="Payment issue">Payment Issue</option>
            <option value="Delivery issue">Delivery Issue</option>
            <option value="Product quality">Product Quality</option>
            <option value="Missing or damaged product">Missing/Damaged</option>
            <option value="Return or refund enquiry">Return/Refund</option>
            <option value="Account/login problem">Account/Login</option>
            <option value="General enquiry">General Enquiry</option>
          </select>
        </div>

        <button
          onClick={() => {
            refetchTickets();
            refetchMetrics();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-emerald-800 border rounded-md hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* 3. Tickets Table */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b">
              <tr>
                <th className="py-3 px-4">Ticket #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ticketsLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading helpdesk tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No support tickets match the selected filters.
                  </td>
                </tr>
              ) : (
                tickets.map((t: any) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                      selectedTicketId === t.id ? "bg-emerald-50/50" : ""
                    }`}
                    onClick={() => setSelectedTicketId(t.id)}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-900">
                      {t.ticket_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{t.customer_name}</div>
                      <div className="text-xs text-slate-400">{t.customer_phone || t.customer_email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-800 font-medium">
                      {t.subject}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold ${
                          t.priority === "Urgent"
                            ? "bg-rose-100 text-rose-700"
                            : t.priority === "High"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          t.status === "Open"
                            ? "bg-emerald-100 text-emerald-800"
                            : t.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : t.status === "Waiting for Customer"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicketId(t.id);
                        }}
                        className="text-xs px-2.5 py-1 bg-emerald-800 text-white rounded hover:bg-emerald-900 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Ticket Detail Modal / Drawer */}
      {selectedTicketId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-emerald-900 text-lg">
                    {ticketDetail?.ticket.ticket_number}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      ticketDetail?.ticket.priority === "Urgent"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {ticketDetail?.ticket.priority}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                    {ticketDetail?.ticket.status}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-800 mt-1">
                  {ticketDetail?.ticket.subject}
                </div>
              </div>
              <button
                onClick={() => setSelectedTicketId(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="p-3 bg-white border-b flex flex-wrap gap-2 items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-500">Status:</span>
                <select
                  value={ticketDetail?.ticket.status}
                  onChange={(e) =>
                    updateStatusMutation.mutate({
                      ticketId: selectedTicketId,
                      status: e.target.value as any,
                    })
                  }
                  className="border rounded px-2 py-1 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting for Customer">Waiting for Customer</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>

                <span className="font-medium text-slate-500 ml-2">Priority:</span>
                <select
                  value={ticketDetail?.ticket.priority}
                  onChange={(e) =>
                    updatePriorityMutation.mutate({
                      ticketId: selectedTicketId,
                      priority: e.target.value as any,
                    })
                  }
                  className="border rounded px-2 py-1 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="text-slate-400">
                Created: {ticketDetail && new Date(ticketDetail.ticket.created_at).toLocaleString()}
              </div>
            </div>

            {/* Customer Details Strip */}
            <div className="p-3 bg-emerald-50/50 border-b flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <User size={14} className="text-emerald-800" />
                <span className="font-semibold text-slate-800">
                  {ticketDetail?.ticket.customer_name}
                </span>
                <span>•</span>
                <span>{ticketDetail?.ticket.customer_email}</span>
                {ticketDetail?.ticket.customer_phone && (
                  <>
                    <span>•</span>
                    <span>{ticketDetail?.ticket.customer_phone}</span>
                  </>
                )}
              </div>
              {ticketDetail?.ticket.order_number && (
                <div className="font-mono text-emerald-900 font-semibold bg-white px-2 py-0.5 border rounded">
                  Order: {ticketDetail.ticket.order_number}
                </div>
              )}
            </div>

            {/* Conversation History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {detailLoading ? (
                <div className="text-center text-slate-400 py-10">Loading conversation thread...</div>
              ) : ticketDetail?.messages.map((m: any) => {
                const isAdmin = m.sender_type === "ADMIN";
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 px-1">
                      <span className="font-semibold text-slate-700">{m.sender_name}</span>
                      <span>({m.sender_type})</span>
                      <span>•</span>
                      <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-lg p-3 text-sm shadow-sm whitespace-pre-wrap ${
                        isAdmin
                          ? "bg-emerald-800 text-white rounded-br-none"
                          : "bg-white text-slate-800 border rounded-bl-none"
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Admin Reply Input Box */}
            <form onSubmit={handleSendReply} className="p-3 bg-white border-t flex gap-2">
              <textarea
                rows={2}
                placeholder="Type response to customer..."
                value={adminReplyText}
                onChange={(e) => setAdminReplyText(e.target.value)}
                className="flex-1 p-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-700 resize-none"
              />
              <button
                type="submit"
                disabled={replyMutation.isPending || !adminReplyText.trim()}
                className="px-4 bg-emerald-800 text-white rounded-md font-medium text-sm flex items-center gap-1.5 hover:bg-emerald-900 disabled:opacity-50 transition-colors"
              >
                <Send size={15} /> Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
