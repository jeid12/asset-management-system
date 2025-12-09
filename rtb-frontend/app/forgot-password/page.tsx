"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "newpassword">("email");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      strength: minLength && hasUpper && hasLower && hasNumber && hasSpecial
    };
  };

  const passwordStrength = checkPasswordStrength(newPassword);

  // Step 1: Send OTP to email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
      setMessage("Password reset link sent to your email. Please check your inbox.");
      setStep("otp");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axios.post("http://localhost:5000/api/auth/verify-reset-otp", {
        email,
        otp,
      });
      setMessage("OTP verified successfully! Now set your new password.");
      setStep("newpassword");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set new password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!passwordStrength.strength) {
      setError("Password does not meet requirements");
      setLoading(false);
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      setMessage("Password reset successful! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #1e3a8a 0%, #3b82f6 100%)",
        padding: "2rem 1rem",
      }}
    >
      {/* Reset Password Card */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "2.5rem",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Logo and Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "0.75rem",
              marginBottom: "1rem",
              width: "90px",
              height: "90px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(30, 58, 138, 0.2)",
            }}
          >
            <img
              src="/images/logo.jpg"
              alt="Rwanda TVET Board"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1e3a8a", margin: "0 0 0.5rem" }}>
            Reset Password
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#6B7280", margin: "0 0 0.25rem", fontWeight: "500" }}>
            Rwanda TVET Board
          </p>
          <p style={{ fontSize: "0.8rem", color: "#9CA3AF", margin: 0 }}>Asset Management System</p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "2rem" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: step === "email" ? "#1e3a8a" : step === "otp" || step === "newpassword" ? "#3b82f6" : "#d1d5db",
            }}
          />
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: step === "otp" ? "#1e3a8a" : step === "newpassword" ? "#3b82f6" : "#d1d5db",
            }}
          />
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: step === "newpassword" ? "#1e3a8a" : "#d1d5db",
            }}
          />
        </div>

        {/* Step 1: Enter Email */}
        {step === "email" && (
          <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
              <p style={{ fontSize: "0.9rem", color: "#6B7280", lineHeight: "1.5" }}>
                Enter your email address and we'll send you a verification code to reset your password.
              </p>
            </div>
            <div>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.875rem 1rem",
                  backgroundColor: "#F9FAFB",
                  border: "2px solid #E5E7EB",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  color: "#1F2937",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
                onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                required
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "1rem",
                backgroundColor: loading ? "#9CA3AF" : "#1e3a8a",
                color: "white",
                fontWeight: "600",
                fontSize: "1rem",
                borderRadius: "8px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(30, 58, 138, 0.3)",
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = "#1e40af")}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = "#1e3a8a")}
            >
              {loading ? "Sending code..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {/* Step 2: Enter OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
              <p style={{ fontSize: "0.9rem", color: "#6B7280", lineHeight: "1.5" }}>
                We've sent a 6-digit code to <strong style={{ color: "#1e3a8a" }}>{email}</strong>. 
                Enter it below to continue.
              </p>
            </div>
            <div>
              <label
                htmlFor="otp"
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                inputMode="numeric"
                style={{
                  width: "100%",
                  padding: "1rem",
                  backgroundColor: "#F9FAFB",
                  border: "2px solid #E5E7EB",
                  borderRadius: "8px",
                  fontSize: "1.5rem",
                  color: "#1F2937",
                  textAlign: "center",
                  letterSpacing: "0.5rem",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
                onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "1rem",
                backgroundColor: loading ? "#9CA3AF" : "#1e3a8a",
                color: "white",
                fontWeight: "600",
                fontSize: "1rem",
                borderRadius: "8px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(30, 58, 138, 0.3)",
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = "#1e40af")}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = "#1e3a8a")}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <button
              type="button"
              onClick={() => setStep("email")}
              style={{
                width: "100%",
                padding: "0.875rem",
                backgroundColor: "#F3F4F6",
                color: "#374151",
                fontWeight: "600",
                fontSize: "0.9rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E5E7EB")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
            >
              Use Different Email
            </button>
          </form>
        )}

        {/* Step 3: Set New Password */}
        {step === "newpassword" && (
          <form onSubmit={handleSetNewPassword} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
              <p style={{ fontSize: "0.9rem", color: "#6B7280", lineHeight: "1.5" }}>
                Create a strong password for your account. Make sure it meets all requirements below.
              </p>
            </div>
            
            <div>
              <label
                htmlFor="newPassword"
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.875rem 3rem 0.875rem 1rem",
                    backgroundColor: "#F9FAFB",
                    border: "2px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "0.95rem",
                    color: "#1F2937",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#6B7280",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              
              {/* Password Strength Indicators */}
              {newPassword && (
                <div style={{ marginTop: "0.75rem", padding: "0.75rem", backgroundColor: "#F9FAFB", borderRadius: "6px" }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                    Password Requirements:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ color: passwordStrength.minLength ? "#10b981" : "#9CA3AF", fontSize: "0.75rem" }}>
                        {passwordStrength.minLength ? "✓" : "○"}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: passwordStrength.minLength ? "#10b981" : "#6B7280" }}>
                        At least 8 characters
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ color: passwordStrength.hasUpper ? "#10b981" : "#9CA3AF", fontSize: "0.75rem" }}>
                        {passwordStrength.hasUpper ? "✓" : "○"}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: passwordStrength.hasUpper ? "#10b981" : "#6B7280" }}>
                        One uppercase letter
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ color: passwordStrength.hasLower ? "#10b981" : "#9CA3AF", fontSize: "0.75rem" }}>
                        {passwordStrength.hasLower ? "✓" : "○"}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: passwordStrength.hasLower ? "#10b981" : "#6B7280" }}>
                        One lowercase letter
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ color: passwordStrength.hasNumber ? "#10b981" : "#9CA3AF", fontSize: "0.75rem" }}>
                        {passwordStrength.hasNumber ? "✓" : "○"}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: passwordStrength.hasNumber ? "#10b981" : "#6B7280" }}>
                        One number
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ color: passwordStrength.hasSpecial ? "#10b981" : "#9CA3AF", fontSize: "0.75rem" }}>
                        {passwordStrength.hasSpecial ? "✓" : "○"}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: passwordStrength.hasSpecial ? "#10b981" : "#6B7280" }}>
                        One special character (!@#$%^&*)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Confirm New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.875rem 3rem 0.875rem 1rem",
                    backgroundColor: "#F9FAFB",
                    border: `2px solid ${confirmPassword && newPassword !== confirmPassword ? "#EF4444" : "#E5E7EB"}`,
                    borderRadius: "8px",
                    fontSize: "0.95rem",
                    color: "#1F2937",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    if (!(confirmPassword && newPassword !== confirmPassword)) {
                      e.target.style.borderColor = "#3B82F6";
                    }
                  }}
                  onBlur={(e) => {
                    if (!(confirmPassword && newPassword !== confirmPassword)) {
                      e.target.style.borderColor = "#E5E7EB";
                    }
                  }}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#6B7280",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p style={{ fontSize: "0.75rem", color: "#EF4444", marginTop: "0.5rem" }}>
                  Passwords do not match
                </p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "0.5rem" }}>
                  ✓ Passwords match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordStrength.strength || newPassword !== confirmPassword}
              style={{
                width: "100%",
                padding: "1rem",
                backgroundColor: loading || !passwordStrength.strength || newPassword !== confirmPassword ? "#9CA3AF" : "#1e3a8a",
                color: "white",
                fontWeight: "600",
                fontSize: "1rem",
                borderRadius: "8px",
                border: "none",
                cursor: loading || !passwordStrength.strength || newPassword !== confirmPassword ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(30, 58, 138, 0.3)",
              }}
              onMouseEnter={(e) => {
                if (!(loading || !passwordStrength.strength || newPassword !== confirmPassword)) {
                  e.currentTarget.style.backgroundColor = "#1e40af";
                }
              }}
              onMouseLeave={(e) => {
                if (!(loading || !passwordStrength.strength || newPassword !== confirmPassword)) {
                  e.currentTarget.style.backgroundColor = "#1e3a8a";
                }
              }}
            >
              {loading ? "Resetting password..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* Feedback Messages */}
        {message && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "0.875rem 1rem",
              backgroundColor: "#D1FAE5",
              border: "1px solid #6EE7B7",
              borderRadius: "8px",
            }}
          >
            <p style={{ color: "#065F46", fontSize: "0.875rem", fontWeight: "500", textAlign: "center", margin: 0 }}>
              {message}
            </p>
          </div>
        )}
        {error && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "0.875rem 1rem",
              backgroundColor: "#FEE2E2",
              border: "1px solid #FCA5A5",
              borderRadius: "8px",
            }}
          >
            <p style={{ color: "#DC2626", fontSize: "0.875rem", fontWeight: "500", textAlign: "center", margin: 0 }}>
              {error}
            </p>
          </div>
        )}

        {/* Footer Links */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "1.5rem",
            fontSize: "0.875rem",
          }}
        >
          <Link
            href="/login"
            style={{ color: "#1e3a8a", fontWeight: "500", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            Back to Login
          </Link>
          <Link
            href="#"
            style={{ color: "#1e3a8a", fontWeight: "500", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            Help Desk
          </Link>
        </div>
      </div>
    </div>
  );
}
