"use client";
import { useState } from "react";
import axios from "axios";

export default function ForgotPasswordPage() {
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
      setTimeout(() => (window.location.href = "/login"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ 
        position: "relative",
        background: "linear-gradient(to bottom, #1e3a8a 0%, #1e3a8a 40%, #3b82f6 40%, #3b82f6 45%, #1e3a8a 45%, #1e3a8a 55%, #60a5fa 55%, #60a5fa 100%)",
        backgroundImage: "radial-gradient(circle at 85% 15%, #60a5fa 0%, #60a5fa 25%, transparent 25%), radial-gradient(circle at 85% 15%, #60a5fa 0%, #60a5fa 35%, transparent 35%)"
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-10"></div>
      
      {/* Forgot Password Form */}
      <div className="relative z-10 bg-white bg-opacity-95 p-8 rounded-lg border border-blue-200 shadow-xl w-[420px]">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-5">
          <div style={{ 
            backgroundColor: "white", 
            borderRadius: "16px", 
            padding: "0.75rem", 
            marginBottom: "1rem",
            width: "90px",
            height: "90px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(30, 58, 138, 0.2)"
          }}>
            <img 
              src="/images/logo.jpg" 
              alt="Rwanda TVET Board" 
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <h1 className="text-xl font-bold text-blue-900 tracking-wide mb-1">
            Rwanda TVET Board
          </h1>
          <p className="text-sm text-gray-600 font-medium">
            Asset Management System
          </p>
          <p className="text-xs text-gray-500 mt-1">rtb.gov.rw</p>
        </div>

        {/* Step 1: Enter Email */}
        {step === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded text-gray-700 focus:outline-none focus:border-blue-400"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-medium rounded shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        {/* Step 2: Enter OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Verification Code
              </label>
              <input
                type="text"
                placeholder="Enter code from email"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded text-gray-700 focus:outline-none focus:border-blue-400 text-center tracking-widest"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-medium rounded shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        )}

        {/* Step 3: Set New Password */}
        {step === "newpassword" && (
          <form onSubmit={handleSetNewPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded text-gray-700 focus:outline-none focus:border-blue-400 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {/* Password Strength Indicator */}
              <div className="mt-2 space-y-1">
                <div className={`text-xs ${passwordStrength.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                  ✓ At least 8 characters
                </div>
                <div className={`text-xs ${passwordStrength.hasUpper ? 'text-green-600' : 'text-gray-400'}`}>
                  ✓ One uppercase letter
                </div>
                <div className={`text-xs ${passwordStrength.hasLower ? 'text-green-600' : 'text-gray-400'}`}>
                  ✓ One lowercase letter
                </div>
                <div className={`text-xs ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                  ✓ One number
                </div>
                <div className={`text-xs ${passwordStrength.hasSpecial ? 'text-green-600' : 'text-gray-400'}`}>
                  ✓ One special character
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded text-gray-700 focus:outline-none focus:border-blue-400 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !passwordStrength.strength || newPassword !== confirmPassword}
              className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-medium rounded shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* Feedback Messages */}
        {message && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-green-700 text-sm font-medium text-center">{message}</p>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600 text-sm font-medium text-center">{error}</p>
          </div>
        )}

        {/* Footer Links */}
        <div className="flex justify-between text-sm text-blue-800 mt-6 font-medium">
          <a href="/login" className="hover:underline">
            Back to Login
          </a>
          <a href="#" className="hover:underline">
            Help Desk
          </a>
        </div>
      </div>
    </div>
  );
}
