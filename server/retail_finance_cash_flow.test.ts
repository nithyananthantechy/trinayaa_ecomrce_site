import { describe, it, expect, beforeAll } from "vitest";
import { retailBranchesRepo, retailExpensesRepo } from "./db";

describe("Retail Finance & Cash Flow Integration Tests", () => {
  let branchId: string;
  const currentMonthYear = new Date().toISOString().slice(0, 7); // e.g. "2026-11"
  const todayStr = new Date().toISOString().slice(0, 10); // e.g. "2026-11-28"

  beforeAll(() => {
    const branches = retailBranchesRepo.getAll();
    if (branches.length > 0) {
      branchId = branches[0].id;
    } else {
      const created = retailBranchesRepo.create({
        code: "TEST_HQ",
        name: "Test Central Branch",
        address: "123 Test Road",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638001",
        phone: "+91 9876543210",
      });
      branchId = created.id;
    }
  });

  it("1. Admin allocates monthly amount and updates retail_branch_allowances", () => {
    const allowance = retailExpensesRepo.setMonthlyAllowance({
      branchId,
      monthYear: currentMonthYear,
      allocatedAmount: 45000,
      allocatedBy: "Super Admin",
      notes: "Approved November petty cash quota for store operations & refreshments",
    });

    expect(allowance).toBeDefined();
    expect(allowance.branch_id).toBe(branchId);
    expect(allowance.month_year).toBe(currentMonthYear);
    expect(allowance.allocated_amount).toBe(45000);
    expect(allowance.allocated_by).toBe("Super Admin");
    expect(allowance.notes).toContain("November petty cash quota");

    // Verify retrieval
    const fetched = retailExpensesRepo.getMonthlyAllowance(branchId, currentMonthYear);
    expect(fetched).not.toBeNull();
    expect(fetched?.allocated_amount).toBe(45000);
  });

  it("2. Retail portal gets finance summary reflecting admin-allocated quota", () => {
    const summary = retailExpensesRepo.getFinanceSummary(branchId, currentMonthYear);

    expect(summary).toBeDefined();
    expect(summary.monthlyAllowance).toBe(45000);
    expect(summary.allowanceDetails).toBeDefined();
    expect(summary.allowanceDetails?.allocatedBy).toBe("Super Admin");
    expect(summary.allowanceDetails?.notes).toContain("November petty cash quota");
    expect(summary.remainingAllowance).toBeLessThanOrEqual(45000);
  });

  it("3. Retail member records daily, weekly, and monthly expenses", () => {
    // Add today's expense: Tea & Refreshments
    const exp1 = retailExpensesRepo.addExpense({
      branchId,
      amount: 250,
      category: "Tea & Refreshments",
      description: "Morning tea and biscuits for store staff and visitors",
      paymentMode: "CASH",
      recordedBy: "Staff Member",
      expenseDate: todayStr,
    });
    expect(exp1.id).toBeDefined();
    expect(exp1.amount).toBe(250);

    // Add another expense for today: Stationery & Billing Rolls
    const exp2 = retailExpensesRepo.addExpense({
      branchId,
      amount: 450,
      category: "Stationery & Billing Rolls",
      description: "POS Thermal paper rolls box",
      paymentMode: "UPI",
      recordedBy: "Store Manager",
      expenseDate: todayStr,
    });
    expect(exp2.id).toBeDefined();
    expect(exp2.amount).toBe(450);

    // Verify Finance Summary updates immediately
    const updatedSummary = retailExpensesRepo.getFinanceSummary(branchId, currentMonthYear);
    expect(updatedSummary.todayExpenses).toBeGreaterThanOrEqual(700);
    expect(updatedSummary.weekExpenses).toBeGreaterThanOrEqual(700);
    expect(updatedSummary.totalExpenses).toBeGreaterThanOrEqual(700);
    expect(updatedSummary.remainingAllowance).toBe(45000 - updatedSummary.totalExpenses);
  });

  it("4. Filter expenses by period (today, week, month, all)", () => {
    const todayExpenses = retailExpensesRepo.listExpenses(branchId, { period: "today" });
    expect(todayExpenses.length).toBeGreaterThanOrEqual(2);
    for (const exp of todayExpenses) {
      expect(exp.expense_date).toBe(todayStr);
    }

    const weekExpenses = retailExpensesRepo.listExpenses(branchId, { period: "week" });
    expect(weekExpenses.length).toBeGreaterThanOrEqual(todayExpenses.length);

    const monthExpenses = retailExpensesRepo.listExpenses(branchId, { period: "month" });
    expect(monthExpenses.length).toBeGreaterThanOrEqual(weekExpenses.length);

    const allExpenses = retailExpensesRepo.listExpenses(branchId, { period: "all" });
    expect(allExpenses.length).toBeGreaterThanOrEqual(monthExpenses.length);
  });

  it("5. Admin sees central overview and all branch expenses under OPERATIONS - Retail & Branches", () => {
    const adminOverview = retailExpensesRepo.getAdminFinanceOverview({ monthYear: currentMonthYear });

    expect(adminOverview).toBeDefined();
    expect(adminOverview.totalAllocatedQuota).toBeGreaterThanOrEqual(45000);
    expect(adminOverview.totalSpend).toBeGreaterThanOrEqual(700);
    expect(adminOverview.todaySpend).toBeGreaterThanOrEqual(700);
    expect(adminOverview.weekSpend).toBeGreaterThanOrEqual(700);
    expect(adminOverview.remainingQuota).toBe(adminOverview.totalAllocatedQuota - adminOverview.totalSpend);

    // Verify branch summaries
    const currentBranchSummary = adminOverview.branchSummaries.find((b) => b.branchId === branchId);
    expect(currentBranchSummary).toBeDefined();
    expect(currentBranchSummary?.allocatedQuota).toBe(45000);
    expect(currentBranchSummary?.monthlySpend).toBeGreaterThanOrEqual(700);

    // Verify category distribution
    expect(adminOverview.categoryDistribution.length).toBeGreaterThanOrEqual(2);
    const teaCat = adminOverview.categoryDistribution.find((c) => c.category === "Tea & Refreshments");
    expect(teaCat).toBeDefined();
    expect(teaCat?.total).toBeGreaterThanOrEqual(250);

    // Verify Admin Central Ledger
    const allBranchExpenses = retailExpensesRepo.listAllBranchExpenses({
      monthYear: currentMonthYear,
      period: "month",
    });
    expect(allBranchExpenses.length).toBeGreaterThanOrEqual(2);
    expect(allBranchExpenses[0].branch_name).toBeDefined();
  });

  it("6. Admin updates monthly allowance with new amount without creating duplicate records", () => {
    const updated = retailExpensesRepo.setMonthlyAllowance({
      branchId,
      monthYear: currentMonthYear,
      allocatedAmount: 60000,
      allocatedBy: "Finance Director",
      notes: "Increased budget for holiday season promotions and extra staff",
    });

    expect(updated.allocated_amount).toBe(60000);
    expect(updated.allocated_by).toBe("Finance Director");

    const summary = retailExpensesRepo.getFinanceSummary(branchId, currentMonthYear);
    expect(summary.monthlyAllowance).toBe(60000);
    expect(summary.remainingAllowance).toBe(60000 - summary.totalExpenses);
  });
});
