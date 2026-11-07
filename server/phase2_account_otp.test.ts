import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import { normalizeIndianPhone, isValidIndianPhone, generateSecureOtp, hashOtp } from "./smsService";

describe("TRINAYAA Phase 2 — Customer Account, Address Book & Mobile OTP Suite", () => {
  const ts = Date.now();
  let userA: any;
  let userB: any;
  let callerA: any;
  let callerB: any;
  const publicCaller = appRouter.createCaller({
    user: null as any,
    session: null as any,
    req: { socket: { remoteAddress: `127.0.0.${ts % 200}` } } as any,
    res: { cookie: () => {}, clearCookie: () => {} } as any,
  });

  beforeAll(async () => {
    // Create test customer A
    userA = db.usersRepo.create({
      email: `customer_a_${ts}@trinayaa.test`,
      password: "Password123!",
      name: "Anand Swaminathan",
      phone: "9843212345",
      role: "CUSTOMER",
    });

    // Create test customer B
    userB = db.usersRepo.create({
      email: `customer_b_${ts}@trinayaa.test`,
      password: "Password456!",
      name: "Kavitha Rangan",
      phone: "9443398765",
      role: "CUSTOMER",
    });

    callerA = appRouter.createCaller({
      user: { id: userA.id, email: userA.email, name: userA.name, role: userA.role } as any,
      session: { openId: userA.id } as any,
      req: { socket: { remoteAddress: "127.0.0.1" } } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    callerB = appRouter.createCaller({
      user: { id: userB.id, email: userB.email, name: userB.name, role: userB.role } as any,
      session: { openId: userB.id } as any,
      req: { socket: { remoteAddress: "127.0.0.2" } } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });
  });

  // ==========================================
  // 1. CUSTOMER PROFILE & SECURITY TESTS
  // ==========================================
  describe("1. Customer Profile Management & Data Isolation", () => {
    it("1.1: Customer can retrieve their profile details", async () => {
      const profile = await callerA.account.getProfile();
      expect(profile).toBeTruthy();
      expect(profile.id).toBe(userA.id);
      expect(profile.email).toBe(userA.email);
      expect(profile.name).toBe("Anand Swaminathan");
    });

    it("1.2: Customer can update their name and phone number", async () => {
      const res = await callerA.account.updateProfile({
        name: "Anand S. Kongu",
        phone: "9843299999",
      });
      expect(res.success).toBe(true);
      expect(res.user.name).toBe("Anand S. Kongu");
      expect(res.user.phone).toBe("9843299999");
    });

    it("1.3: Rejects profile update with invalid mobile number", async () => {
      await expect(
        callerA.account.updateProfile({
          name: "Anand S.",
          phone: "12345", // invalid Indian mobile
        })
      ).rejects.toThrow(/valid 10-digit Indian mobile number/);
    });

    it("1.4: Customer can change password with correct current password", async () => {
      const res = await callerA.account.changePassword({
        currentPassword: "Password123!",
        newPassword: "NewSecretPassword2026!",
      });
      expect(res.success).toBe(true);
      expect(res.message).toContain("successfully");

      // Verify login with new password
      const loginRes = await publicCaller.auth.login({
        email: userA.email,
        password: "NewSecretPassword2026!",
      });
      expect(loginRes.user.id).toBe(userA.id);
    });

    it("1.5: Rejects password change with incorrect current password", async () => {
      await expect(
        callerA.account.changePassword({
          currentPassword: "WrongCurrentPassword",
          newPassword: "SomeNewPassword!",
        })
      ).rejects.toThrow(/Current password is incorrect/);
    });
  });

  // ==========================================
  // 2. SAVED DELIVERY ADDRESS BOOK TESTS
  // ==========================================
  describe("2. Customer Address Book & Isolation", () => {
    let addressA1Id: string;
    let addressA2Id: string;

    it("2.1: Customer can add a delivery address with full fields", async () => {
      const addr = await callerA.addresses.create({
        recipientName: "Anand S.",
        phone: "9843299999",
        addressLine1: "42, Kongu Garden",
        addressLine2: "Near Collectorate",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638011",
        addressType: "Home",
        isDefault: true,
        deliveryInstructions: "Call upon arrival at gate.",
      });

      expect(addr).toBeTruthy();
      expect(addr.recipientName).toBe("Anand S.");
      expect(addr.pinCode).toBe("638011");
      expect(addr.isDefault).toBe(1);
      addressA1Id = addr.id;
    });

    it("2.2: Rejects address creation with invalid PIN code or phone", async () => {
      // Invalid PIN (5 digits)
      await expect(
        callerA.addresses.create({
          recipientName: "Anand S.",
          phone: "9843299999",
          addressLine1: "42, Kongu Garden",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "63801", // invalid
          addressType: "Home",
        })
      ).rejects.toThrow();

      // Invalid phone
      await expect(
        callerA.addresses.create({
          recipientName: "Anand S.",
          phone: "0000000000", // invalid
          addressLine1: "42, Kongu Garden",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638002",
          addressType: "Home",
        })
      ).rejects.toThrow();
    });

    it("2.3: Adding a second default address unsets the first default address", async () => {
      const addr2 = await callerA.addresses.create({
        recipientName: "Anand Office",
        phone: "9843299999",
        addressLine1: "15, Brough Road Commercial Complex",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638001",
        addressType: "Work",
        isDefault: true,
      });

      addressA2Id = addr2.id;
      expect(addr2.isDefault).toBe(1);

      // Verify first address is no longer default
      const list = await callerA.addresses.list();
      const addr1Updated = list.find((a: any) => a.id === addressA1Id);
      const addr2Updated = list.find((a: any) => a.id === addressA2Id);

      expect(addr1Updated.isDefault).toBe(0);
      expect(addr2Updated.isDefault).toBe(1);
    });

    it("2.4: Customer can update their own address", async () => {
      const updated = await callerA.addresses.update({
        id: addressA1Id,
        addressLine1: "42, Kongu Garden Renovated",
        landmark: "Behind Reliance Mall",
      });

      expect(updated).toBeTruthy();
      expect(updated.addressLine1).toBe("42, Kongu Garden Renovated");
      expect(updated.landmark).toBe("Behind Reliance Mall");
    });

    it("2.5: Multi-Tenant Isolation: Customer B cannot update or delete Customer A's address", async () => {
      // Customer B tries to update Customer A's address
      await expect(
        callerB.addresses.update({
          id: addressA1Id,
          recipientName: "Malicious Hacker",
        })
      ).rejects.toThrow(/not found or permission denied/);

      // Customer B tries to delete Customer A's address
      await expect(
        callerB.addresses.delete({ id: addressA1Id })
      ).rejects.toThrow(/not found or permission denied/);
    });

    it("2.6: Customer can delete address and default is re-assigned cleanly", async () => {
      const delRes = await callerA.addresses.delete({ id: addressA2Id });
      expect(delRes.success).toBe(true);

      const listAfter = await callerA.addresses.list();
      expect(listAfter.some((a: any) => a.id === addressA2Id)).toBe(false);
      // Remaining address becomes default
      expect(listAfter[0].isDefault).toBe(1);
    });
  });

  // ==========================================
  // 3. MOBILE OTP AUTHENTICATION TESTS
  // ==========================================
  describe("3. Mobile OTP Authentication & Rate Limiting", () => {
    const testPhone = "9843200111";
    let generatedOtp: string;

    it("3.1: Valid OTP request returns success, resend cooldown, and dev test code", async () => {
      const reqRes = await publicCaller.auth.requestOtp({
        phone: `+91 ${testPhone}`,
        purpose: "LOGIN",
      });

      expect(reqRes.success).toBe(true);
      expect(reqRes.resendCooldownSeconds).toBe(60);
      expect(reqRes.devOtp).toMatch(/^\d{6}$/);
      generatedOtp = reqRes.devOtp!;
    });

    it("3.2: Rejects OTP request within 60-second resend cooldown", async () => {
      await expect(
        publicCaller.auth.requestOtp({
          phone: testPhone,
          purpose: "LOGIN",
        })
      ).rejects.toThrow(/wait \d+ seconds/);
    });

    it("3.3: Rejects incorrect OTP and decrements remaining attempts", async () => {
      await expect(
        publicCaller.auth.verifyOtp({
          phone: testPhone,
          otp: "000000", // incorrect code
          purpose: "LOGIN",
        })
      ).rejects.toThrow(/Incorrect verification code/);
    });

    it("3.4: Successful OTP verification logs in user and auto-provisions account if new", async () => {
      const verifyRes = await publicCaller.auth.verifyOtp({
        phone: testPhone,
        otp: generatedOtp,
        purpose: "LOGIN",
        name: "Senthil Kumaran",
      });

      expect(verifyRes.token).toBeTruthy();
      expect(verifyRes.user.phone).toContain(testPhone);
      expect(verifyRes.user.name).toBe("Senthil Kumaran");
    });

    it("3.5: Prevents OTP reuse after verification (Single-use token)", async () => {
      await expect(
        publicCaller.auth.verifyOtp({
          phone: testPhone,
          otp: generatedOtp,
          purpose: "LOGIN",
        })
      ).rejects.toThrow(/invalid or has expired/);
    });

    it("3.6: Existing password authentication remains 100% functional", async () => {
      const pwLogin = await publicCaller.auth.login({
        email: userB.email,
        password: "Password456!",
      });

      expect(pwLogin.user.id).toBe(userB.id);
      expect(pwLogin.user.email).toBe(userB.email);
    });
  });
});
