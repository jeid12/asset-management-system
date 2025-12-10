"use client";

export default function UsersLoading() {
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
          width: "250px", 
          backgroundColor: "#e5e7eb", 
          borderRadius: "8px",
          marginBottom: "0.5rem",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
        }} />
        <div style={{ 
          height: "1.25rem", 
          width: "350px", 
          backgroundColor: "#e5e7eb", 
          borderRadius: "8px",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
        }} />
      </div>

      {/* Stats Cards Skeleton */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "1rem",
        marginBottom: "2rem"
      }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ 
            backgroundColor: "white", 
            padding: "1.5rem", 
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{ 
              height: "1rem", 
              width: "100px", 
              backgroundColor: "#e5e7eb", 
              borderRadius: "4px",
              marginBottom: "0.75rem",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
            }} />
            <div style={{ 
              height: "2rem", 
              width: "60px", 
              backgroundColor: "#e5e7eb", 
              borderRadius: "4px",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
            }} />
          </div>
        ))}
      </div>

      {/* Loading Message */}
      <div style={{ 
        textAlign: "center",
        padding: "3rem"
      }}>
        <div style={{ 
          width: "50px", 
          height: "50px", 
          border: "4px solid #f3f3f3", 
          borderTop: "4px solid #1e3a8a",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 20px"
        }} />
        <p style={{ color: "#666", fontSize: "1rem" }}>Loading users...</p>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
