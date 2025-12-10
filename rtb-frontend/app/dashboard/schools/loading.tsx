"use client";

export default function SchoolsLoading() {
  return (
    <div style={{ 
      padding: "2rem",
      maxWidth: "1400px",
      margin: "0 auto"
    }}>
      {/* Header Skeleton */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ 
          height: "2.5rem", 
          width: "220px", 
          backgroundColor: "#e5e7eb", 
          borderRadius: "8px",
          marginBottom: "0.5rem",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
        }} />
        <div style={{ 
          height: "1.25rem", 
          width: "320px", 
          backgroundColor: "#e5e7eb", 
          borderRadius: "8px",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
        }} />
      </div>

      {/* Loading Spinner */}
      <div style={{ 
        textAlign: "center",
        padding: "4rem"
      }}>
        <div style={{ 
          width: "60px", 
          height: "60px", 
          border: "5px solid #f3f3f3", 
          borderTop: "5px solid #1e3a8a",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 20px"
        }} />
        <p style={{ color: "#666", fontSize: "1.1rem", fontWeight: "500" }}>Loading schools...</p>
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
