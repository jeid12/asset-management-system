"use client";

export default function DashboardLoading() {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "400px",
      backgroundColor: "#f8f9fa"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ 
          width: "50px", 
          height: "50px", 
          border: "4px solid #f3f3f3", 
          borderTop: "4px solid #1e3a8a",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 20px"
        }} />
        <p style={{ color: "#666", fontSize: "1rem" }}>Loading...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
