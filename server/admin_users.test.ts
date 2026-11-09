import { describe, expect, it } from "vitest";
import * as db from "./db";

describe("Admin User Creation & Access Management", () => {
  const testEmail = `new_admin_${Date.now()}@trinayaa.test`;
  let createdAdminId = "";

  it("ensures customer accounts like nithyananthan.cmd@gmail.com are CUSTOMER", () => {
    const user = db.usersRepo.getByEmail("nithyananthan.cmd@gmail.com");
    expect(user).toBeDefined();
    expect(user.role).toBe("CUSTOMER");
  });

  it("lists existing administrators", () => {
    const admins = db.usersRepo.listAdmins();
    expect(admins.length).toBeGreaterThan(0);
    const roles = admins.map((a) => a.role);
    expect(roles.every((r) => r === "ADMIN" || r === "SUPER_ADMIN")).toBe(true);
  });

  it("creates a new store administrator with secure password hash", () => {
    const admin = db.usersRepo.createAdminUser({
      name: "Operational Admin Raman",
      email: testEmail,
      password: "SecureAdminPass2026!",
      role: "ADMIN",
      phone: "+91 98432 12345",
    });

    expect(admin).toBeDefined();
    expect(admin.id).toMatch(/^usr_admin_/);
    expect(admin.email).toBe(testEmail);
    expect(admin.role).toBe("ADMIN");
    expect(admin.status).toBe("ACTIVE");
    createdAdminId = admin.id;

    // Verify password verification works
    const fullUser = db.usersRepo.getByEmail(testEmail);
    expect(fullUser).toBeDefined();
    expect(db.verifyPassword("SecureAdminPass2026!", fullUser.passwordHash)).toBe(true);
    expect(db.verifyPassword("WrongPassword", fullUser.passwordHash)).toBe(false);
  });

  it("prevents creating duplicate admin with identical email", () => {
    expect(() => {
      db.usersRepo.createAdminUser({
        name: "Duplicate Raman",
        email: testEmail,
        password: "AnotherPassword123!",
        role: "ADMIN",
      });
    }).toThrow(/already exists/);
  });

  it("updates administrator role, status, and credentials", () => {
    // 1. Promote to SUPER_ADMIN
    const promoted = db.usersRepo.updateAdminUser(createdAdminId, {
      role: "SUPER_ADMIN",
      name: "Super Admin Raman",
    });
    expect(promoted.role).toBe("SUPER_ADMIN");
    expect(promoted.name).toBe("Super Admin Raman");

    // 2. Suspend administrator
    const suspended = db.usersRepo.updateAdminUser(createdAdminId, {
      status: "SUSPENDED",
    });
    expect(suspended.status).toBe("SUSPENDED");

    // 3. Reset password
    db.usersRepo.updateAdminUser(createdAdminId, {
      newPassword: "UpdatedSecretPassword2026!",
    });
    const fullUser = db.usersRepo.getByEmail(testEmail);
    expect(db.verifyPassword("UpdatedSecretPassword2026!", fullUser.passwordHash)).toBe(true);
  });

  it("deletes the created test administrator", () => {
    const success = db.usersRepo.deleteAdminUser(createdAdminId);
    expect(success).toBe(true);

    const deleted = db.usersRepo.getById(createdAdminId);
    expect(deleted).toBeUndefined();
  });
});
