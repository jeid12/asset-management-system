"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
// Importing all necessary icons
import { FaLaptop, FaChartBar, FaUserCheck, FaExchangeAlt, FaBriefcaseMedical, FaGraduationCap, FaChartLine } from 'react-icons/fa';

// --- Feature Data (Core Asset Management System features) ---
const features = [
  {
    icon: <FaLaptop className="text-3xl text-orange-500" />,
    title: "Asset Tracking",
    description: "Track the real-time location and status of all physical assets (laptops, machinery) across TVET schools.",
  },
  {
    icon: <FaChartBar className="text-3xl text-orange-500" />,
    title: "Real-Time Reporting",
    description: "Generate instant reports on asset utilization, depreciation, and maintenance history for quick auditing.",
  },
  {
    icon: <FaUserCheck className="text-3xl text-orange-500" />,
    title: "Custodian Management",
    description: "Assign assets to specific custodians and schools, ensuring accountability and easy verification.",
  },
  {
    icon: <FaExchangeAlt className="text-3xl text-orange-500" />,
    title: "Transfer & Disposal",
    description: "Streamlined process for inter-school asset transfers and automated workflows for asset disposal approvals.",
  },
  {
    icon: <FaBriefcaseMedical className="text-3xl text-orange-500" />,
    title: "Maintenance Scheduling",
    description: "Schedule, track, and log all maintenance and repair activities, extending the life of crucial equipment.",
  },
  {
    icon: <FaGraduationCap className="text-3xl text-orange-500" />,
    title: "Inventory Audits",
    description: "Simplify periodic inventory audits with digital verification tools and historical data logs.",
  },
];
// ---------------------------------------------------------


export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">

      {/* Header (GET STARTED button -> /login and rounded-lg) */}
      <header className="w-full py-4 bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 md:px-10">
          
          {/* Logo Section */}
          <div className="flex items-center gap-4">
              <FaChartLine className="text-3xl text-orange-500" /> 
              <div className="flex items-end">
                <span className="text-blue-900 font-extrabold text-xl">RTB</span>
                <span className="text-orange-500 font-extrabold text-xl ml-1">AssetMS</span>
              </div>
          </div>
          
          {/* Header Button: "GET STARTED" -> /login */}
          <Link href="/login">
            <button
              className="bg-blue-600 text-black px-5 py-2.5 rounded-lg text-base font-semibold shadow-lg hover:bg-blue-700 transition duration-300" 
            >
              GET STARTED
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section (Dark blue background) */}
      <section className="bg-blue-900 text-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-12">
          
          {/* Left side: Text + CTA */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 space-y-6 md:max-w-xl"
          >
            <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight">
              Welcome to <br className="hidden sm:block"/> <span className="text-orange-400">RTB Asset Management System</span>
            </h1>
            <p className="text-xl sm:text-2xl font-semibold text-gray-300">
              Transforming Asset Management in Rwanda
            </p>
            <p className="text-lg text-gray-300">
              Rwanda’s trusted platform for efficient **digital asset management**, centralizing tracking, maintenance, and allocation of IT equipment across TVET institutions nationwide.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-start pt-6">
              
              {/* Primary Button: LOGIN (rounded-xl) */}
              <Link href="/login" className="w-full sm:w-auto">
                <button
                  style={{ backgroundColor: '#f97316' }} // Primary Orange Color
                  className="w-full sm:w-auto px-10 py-3 rounded-xl text-lg font-semibold shadow-xl hover:bg-orange-600 transition duration-300 text-white transform hover:scale-[1.02]" 
                >
                  LOGIN <span className="ml-2 font-bold">→</span>
                </button>
              </Link>
              
              {/* Secondary Button: CONTACT SUPPORT (rounded-xl) */}
              <button
                className="w-full sm:w-auto px-8 py-3 rounded-xl text-lg font-semibold border-2 border-blue-600 text-white bg-blue-900 hover:bg-blue-600 hover:text-white transition duration-300" 
              >
                Contact Support
              </button>
            </div>
          </motion.div>

          {/* Right side: Illustration (Ensure you have /assets-illustration.png in your public folder) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 flex justify-center md:max-w-xl mt-10 md:mt-0" 
          >
            <div className="w-full max-w-lg aspect-[1.2/1]">
              <Image
                src="/assets-illustration.png" 
                alt="Asset Management Illustration"
                width={600}
                height={500}
                className="object-contain w-full h-full"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section (Light Background) */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold text-blue-900 leading-tight mb-4">
              Smart Management, Less Downtime
            </h2>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto">
              The RTB Asset Management System **simplifies tracking**, making it easier to plan, manage, and ultimately **improve technical training** quality across all TVET institutions.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "Live Dashboards", 
                icon: <FaChartBar className="text-4xl text-blue-600" />, 
                tagline: "Up-to-Date Decisions",
                description: "Real-time visualization of asset status, depreciation, and allocation to ensure quick, data-driven planning.",
              },
              { 
                title: "Digital Inventory", 
                icon: <FaLaptop className="text-4xl text-blue-600" />, 
                tagline: "Zero Paperwork",
                description: "All records are stored securely in a central digital hub, eliminating manual spreadsheets and reducing errors.",
              },
              { 
                title: "Verified Accountability", 
                icon: <FaUserCheck className="text-4xl text-blue-600" />, 
                tagline: "Optimized Utilization",
                description: "Clear audit trails linking every asset to a specific custodian, promoting ownership and minimizing loss or misuse.",
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
                className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition duration-500 flex flex-col items-center text-center border-t-4 border-orange-500"
              >
                <div className="bg-blue-50 p-4 rounded-full mb-6">
                  {item.icon}
                </div>
                <p className="text-sm font-semibold text-orange-600 uppercase tracking-widest mb-2">{item.tagline}</p>
                <h3 className="text-2xl font-bold text-blue-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section (Core Asset Management) */}
      <section className="py-12 bg-white"> 
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-bold text-center text-blue-900 mb-8"
          >
            Core Asset Management Features
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition duration-300"
              >
                <div className="bg-orange-100 w-12 h-12 flex items-center justify-center rounded-lg mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full px-4 sm:px-6 md:px-10 py-3 text-center text-gray-600 text-sm bg-gray-100 border-t border-gray-200">
        © {new Date().getFullYear()} Rwanda TVET Board — All Rights Reserved |{" "}
        <a
          href="https://rtb.gov.rw"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-900 font-medium hover:underline"
        >
          rtb.gov.rw
        </a>
      </footer>
    </div>
  );
}