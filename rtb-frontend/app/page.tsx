"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { MDBBtn } from "mdb-react-ui-kit";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 bg-white/90 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-3">
          <div style={{ 
            backgroundColor: "#1e3a8a", 
            borderRadius: "16px", 
            padding: "0.85rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "0 4px 12px rgba(30, 58, 138, 0.2)"
          }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "white", letterSpacing: "0.05em" }}>RTB</div>
            <div style={{ fontSize: "0.5rem", color: "#93C5FD", marginTop: "0.15rem", fontWeight: "600" }}>TVET BOARD</div>
          </div>
          <div>
            <h1 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#1e3a8a", margin: 0, letterSpacing: "0.02em" }}>
              Rwanda TVET Board
            </h1>
            <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0 }}>Asset Management System</p>
            <p style={{ fontSize: "0.65rem", color: "#9CA3AF", margin: 0, fontStyle: "italic" }}>rtb.gov.rw</p>
          </div>
        </div>
        <Link href="/login">
          <MDBBtn color="primary">Login</MDBBtn>
        </Link>
      </header>

      {/* Main Section */}
      <main className="flex flex-col md:flex-row items-center justify-between flex-grow px-10 md:px-20 lg:px-32 py-20 gap-10">
        {/* Text Section */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="md:max-w-md lg:max-w-lg space-y-8"

        >
                    <h2 className="text-2xl font-bold tracking-wide">
             Welcome to Rwanda TVET Board Asset Management System
          </h2>
          <h2 className="text-4xl md:text-6xl font-extrabold leading-snug">
            Manage Your Assets <br />
            <span className="text-blue-600">
              Efficiently and Securely
            </span>
          </h2>
          <p className="text-lg text-zinc-600 max-w-lg">
            The Rwanda TVET Board Asset Management System helps track laptops, projectors, and
            other digital devices across TVET schools. Get real-time data, reports,
            and streamlined management.
          </p>
          <Link href="/login">
            <MDBBtn color="primary" size="lg">
              Get Started
            </MDBBtn>
          </Link>
        </motion.div>

        {/* Illustration */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="md:w-1/2 flex justify-center"
        >
<Image
  src="/assets-illustration.png"
  alt="Test Image"
  width={300}
  height={200}
/>

        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-zinc-500 border-t border-zinc-200">
        © {new Date().getFullYear()} Rwanda TVET Board (RTB) — All Rights Reserved | rtb.gov.rw
      </footer>
    </div>
  );
}
