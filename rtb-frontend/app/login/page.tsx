"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/app/utils/api";

export default function LoginPage() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Verification states
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [otpSentAt, setOtpSentAt] = useState<number | null>(null);
  const [otpExpirySeconds] = useState(5 * 60); // 5 minutes
  const [countdown, setCountdown] = useState<number>(0);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let timer: number | null = null;
    if (otpSentAt) {
      const update = () => {
        const elapsed = Math.floor((Date.now() - otpSentAt) / 1000);
        const remaining = Math.max(0, otpExpirySeconds - elapsed);
        setCountdown(remaining);
        if (remaining <= 0 && timer) {
          clearInterval(timer as number);
          timer = null;
        }
      };
      update();
      timer = window.setInterval(update, 1000);
    }
    return () => {
      if (timer) clearInterval(timer as number);
    };
  }, [otpSentAt, otpExpirySeconds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/auth/login", { emailOrUsername, password });
      // Backend sends OTP on successful credential verification
      if (res.status === 200) {
        setShowVerification(true);
        setOtpSentAt(Date.now());
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError("");
    if (verificationCode.trim().length < 4) {
      setError("Please enter the OTP code");
      return;
    }

    if (countdown <= 0) {
      setError("OTP expired. Please resend the code.");
      return;
    }

    try {
      setVerifying(true);
      const res = await apiClient.post("/auth/verify-otp", { emailOrUsername, otp: verificationCode });
      if (res.status === 200) {
        const token = res.data.token;
        if (token) {
          // store token in localStorage as a best practice for this app
          localStorage.setItem("token", token);
        }
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResending(true);
    try {
      // Call the dedicated resend-otp endpoint
      const res = await apiClient.post("/auth/resend-otp", { emailOrUsername, password });
      if (res.status === 200) {
        setOtpSentAt(Date.now());
        setVerificationCode(""); // Clear the old code
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    setVerificationCode(raw);
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
      {/* Login Card */}
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
            Rwanda TVET Board
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#6B7280", margin: "0 0 0.25rem", fontWeight: "500" }}>
            Asset Management System
          </p>
          <p style={{ fontSize: "0.8rem", color: "#9CA3AF", margin: 0 }}>rtb.gov.rw</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label
              htmlFor="emailOrUsername"
              style={{
                display: "block",
                fontSize: "0.9rem",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "0.5rem",
              }}
            >
              Email or Username
            </label>
            <input
              id="emailOrUsername"
              type="text"
              placeholder="Enter your email or username"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
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
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: "0.9rem",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "0.5rem",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div
              style={{
                padding: "0.75rem 1rem",
                backgroundColor: "#FEE2E2",
                border: "1px solid #FCA5A5",
                borderRadius: "8px",
                color: "#DC2626",
                fontSize: "0.875rem",
                fontWeight: "500",
              }}
            >
              {error}
            </div>
          )}

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
            {loading ? "Checking credentials..." : "Log In"}
          </button>
        </form>

        {/* Links */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "1.5rem",
            fontSize: "0.875rem",
          }}
        >
          <a
            href="/forgot-password"
            style={{ color: "#1e3a8a", fontWeight: "500", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            Forgot password?
          </a>
          <a
            href="#"
            style={{ color: "#1e3a8a", fontWeight: "500", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            Help Desk
          </a>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showVerification && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "2rem",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 25px 80px rgba(0, 0, 0, 0.4)",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e3a8a", marginBottom: "0.5rem" }}>
              Verify your identity
            </h2>
            <p style={{ fontSize: "0.9rem", color: "#6B7280", marginBottom: "1.5rem" }}>
              A one-time code was sent to the email associated with your account. Enter it below to complete sign in.
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="otpCode"
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                One-time code
              </label>
              <input
                id="otpCode"
                type="text"
                value={verificationCode}
                onChange={handleCodeChange}
                placeholder="Enter code"
                inputMode="numeric"
                style={{
                  width: "100%",
                  padding: "1rem",
                  border: "2px solid #E5E7EB",
                  borderRadius: "8px",
                  textAlign: "center",
                  fontSize: "1.25rem",
                  letterSpacing: "0.5rem",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
                onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "0.75rem",
                  fontSize: "0.875rem",
                }}
              >
                <span style={{ color: "#6B7280" }}>
                  Expires in:{" "}
                  <strong style={{ color: "#1e3a8a" }}>
                    {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
                  </strong>
                </span>
                <button
                  onClick={handleResend}
                  disabled={resending}
                  style={{
                    color: "#1e3a8a",
                    fontWeight: "600",
                    background: "none",
                    border: "none",
                    cursor: resending ? "not-allowed" : "pointer",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => !resending && (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => !resending && (e.currentTarget.style.textDecoration = "none")}
                >
                  {resending ? "Resending..." : "Resend code"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={() => setShowVerification(false)}
                style={{
                  flex: 1,
                  padding: "0.875rem",
                  backgroundColor: "#F3F4F6",
                  color: "#374151",
                  fontWeight: "600",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E5E7EB")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyCode}
                disabled={verifying}
                style={{
                  flex: 1,
                  padding: "0.875rem",
                  backgroundColor: verifying ? "#9CA3AF" : "#1e3a8a",
                  color: "white",
                  fontWeight: "600",
                  borderRadius: "8px",
                  border: "none",
                  cursor: verifying ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => !verifying && (e.currentTarget.style.backgroundColor = "#1e40af")}
                onMouseLeave={(e) => !verifying && (e.currentTarget.style.backgroundColor = "#1e3a8a")}
              >
                {verifying ? "Verifying..." : "Verify & Sign in"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
