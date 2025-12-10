"use client";

export default function Loading() {
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column",
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "100vh",
      backgroundColor: "#f8f9fa"
    }}>
      <div style={{ textAlign: "center" }}>
        {/* Logo */}
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "16px", 
          padding: "1rem", 
          marginBottom: "2rem",
          width: "100px",
          height: "100px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(30, 58, 138, 0.15)"
        }}>
          <img 
            src="/images/logo.jpg" 
            alt="Rwanda TVET Board" 
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>

        {/* Spinner */}
        <div style={{ 
          width: "60px", 
          height: "60px", 
          border: "5px solid #e5e7eb", 
          borderTop: "5px solid #1e3a8a",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 1.5rem"
        }} />
        
        {/* Loading Text */}
        <p style={{ 
          color: "#1e3a8a", 
          fontSize: "1.1rem",
          fontWeight: "600",
          marginBottom: "0.5rem"
        }}>
          Rwanda TVET Board
        </p>
        <p style={{ 
          color: "#6b7280", 
          fontSize: "0.9rem"
        }}>
          Loading Asset Management System...
        </p>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
