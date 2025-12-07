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
      className="flex items-center justify-center min-h-screen"
      style={{
        position: "relative",
        background: "linear-gradient(180deg,#1e3a8a 0%,#3b82f6 100%)",
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-10"></div>

      <div className="relative z-10 bg-white bg-opacity-95 p-8 rounded-lg border border-blue-200 shadow-xl w-full max-w-md mx-4">
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-900 tracking-wide mb-1">AMS</h1>
          <p className="text-sm text-gray-600">Asset Management System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email or Username</label>
            <input
              type="text"
              placeholder="you@example.com or username"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded shadow-sm transition-colors disabled:opacity-60"
          >
            {loading ? "Checking credentials..." : "Log In"}
          </button>
        </form>

        {error && <p className="text-red-600 text-center mt-4 text-sm font-medium">{error}</p>}

        <div className="flex justify-between text-sm text-blue-800 mt-6 font-medium">
          <a href="/forgot-password" className="hover:underline">Forgot password?</a>
          <a href="#" className="hover:underline">Help Desk</a>
        </div>
      </div>

      {showVerification && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-semibold mb-2 text-blue-900">Verify your identity</h2>
            <p className="text-sm text-gray-600 mb-4">A one-time code was sent to the email associated with your account. Enter it below to complete sign in.</p>

            <div className="mb-4">
              <label className="block mb-2 font-medium text-gray-700">One-time code</label>
              <input
                type="text"
                value={verificationCode}
                onChange={handleCodeChange}
                placeholder="Enter code"
                inputMode="numeric"
                className="w-full px-4 py-3 border rounded text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-gray-500">Expires in: <strong className="text-blue-800">{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}</strong></span>
                <button onClick={handleResend} disabled={resending} className="text-blue-800 hover:underline">
                  {resending ? "Resending..." : "Resend code"}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowVerification(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
              <button onClick={handleVerifyCode} disabled={verifying} className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800">
                {verifying ? "Verifying..." : "Verify & Sign in"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
