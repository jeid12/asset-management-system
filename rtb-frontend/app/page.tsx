"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { MDBBtn } from "mdb-react-ui-kit";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="flex justify-between items-center px-12 md:px-20 lg:px-32 py-5 bg-white/95 backdrop-blur-md shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div style={{ 
            backgroundColor: "white", 
            borderRadius: "12px", 
            padding: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(30, 58, 138, 0.2)",
            width: "70px",
            height: "70px"
          }}>
            <img 
              src="/images/logo.jpg" 
              alt="Rwanda TVET Board" 
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e3a8a", margin: 0, letterSpacing: "0.02em" }}>
              Rwanda TVET Board
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: 0 }}>Asset Management System</p>
            <p style={{ fontSize: "0.75rem", color: "#9CA3AF", margin: 0, fontStyle: "italic" }}>rtb.gov.rw</p>
          </div>
        </div>
        <Link href="/login">
          <MDBBtn color="primary" size="lg">Sign In</MDBBtn>
        </Link>
      </header>

      {/* Main Section */}
      <main className="flex flex-col md:flex-row items-center justify-between flex-grow px-12 md:px-20 lg:px-32 py-24 gap-16 max-w-7xl mx-auto w-full">
        {/* Text Section */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="md:max-w-xl lg:max-w-2xl space-y-8 pr-8"
        >
          <h2 className="text-3xl font-bold tracking-wide text-blue-900">
            Welcome to Rwanda TVET Board Asset Management System
          </h2>
          <h2 className="text-5xl md:text-6xl font-extrabold leading-tight">
            Manage Your Assets <br />
            <span className="text-blue-600">
              Efficiently and Securely
            </span>
          </h2>
          <p className="text-xl text-zinc-600 max-w-2xl leading-relaxed">
            The Rwanda TVET Board Asset Management System helps track laptops, projectors, and
            other digital devices across TVET schools. Get real-time data, reports,
            and streamlined management.
          </p>
          <div className="flex gap-4 pt-4">
            <Link href="/login">
              <MDBBtn color="primary" size="lg" className="px-8 py-3">
                Get Started
              </MDBBtn>
            </Link>
            <MDBBtn color="light" size="lg" className="px-8 py-3">
              Learn More
            </MDBBtn>
          </div>
        </motion.div>

        {/* Illustration */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="md:w-1/2 flex justify-center pl-8"
        >
          <div className="w-full max-w-lg aspect-square bg-white rounded-3xl p-12 shadow-2xl flex items-center justify-center">
            <Image
              src="/assets-illustration.png"
              alt="Asset Management Illustration"
              width={400}
              height={400}
              className="object-contain"
            />
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="px-12 md:px-20 lg:px-32 py-6 text-center text-base text-zinc-600 border-t border-zinc-200 bg-white">
        © {new Date().getFullYear()} Rwanda TVET Board (RTB) — All Rights Reserved |{" "}
        <a href="https://rtb.gov.rw" target="_blank" rel="noopener noreferrer" className="text-blue-900 font-semibold hover:underline">
          rtb.gov.rw
        </a>
      </footer>
    </div>
  );
}
