"use client";

export default function DevicesLoading() {
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
          width: "200px", 
          backgroundColor: "#e5e7eb", 
          borderRadius: "8px",
          marginBottom: "0.5rem",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
        }} />
        <div style={{ 
          height: "1.25rem", 
          width: "300px", 
          backgroundColor: "#e5e7eb", 
          borderRadius: "8px",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
        }} />
      </div>

      {/* Stats Cards Skeleton */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
        gap: "1rem",
        marginBottom: "2rem"
      }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ 
            backgroundColor: "white", 
            padding: "1.5rem", 
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{ 
              height: "1rem", 
              width: "120px", 
              backgroundColor: "#e5e7eb", 
              borderRadius: "4px",
              marginBottom: "1rem",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
            }} />
            <div style={{ 
              height: "2.5rem", 
              width: "80px", 
              backgroundColor: "#e5e7eb", 
              borderRadius: "4px",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
            }} />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{ padding: "1.5rem" }}>
          <div style={{ 
            height: "2rem", 
            width: "150px", 
            backgroundColor: "#e5e7eb", 
            borderRadius: "4px",
            marginBottom: "1rem",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
          }} />
        </div>
        <div style={{ padding: "1.5rem", borderTop: "1px solid #e5e7eb" }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ 
              display: "flex", 
              gap: "1rem", 
              padding: "1rem 0",
              borderBottom: "1px solid #f3f4f6"
            }}>
              <div style={{ 
                height: "1rem", 
                flex: 1, 
                backgroundColor: "#e5e7eb", 
                borderRadius: "4px",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
              }} />
              <div style={{ 
                height: "1rem", 
                flex: 1, 
                backgroundColor: "#e5e7eb", 
                borderRadius: "4px",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
              }} />
              <div style={{ 
                height: "1rem", 
                flex: 1, 
                backgroundColor: "#e5e7eb", 
                borderRadius: "4px",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
              }} />
            </div>
          ))}
        </div>
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
      `}</style>
    </div>
  );
}
