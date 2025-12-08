export default function NotFound() {
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "100vh",
      textAlign: "center",
      padding: "2rem"
    }}>
      <h1 style={{ fontSize: "4rem", fontWeight: "bold", color: "#1e3a8a" }}>404</h1>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Page Not Found</h2>
      <p style={{ color: "#6B7280", marginBottom: "2rem" }}>The page you are looking for does not exist.</p>
      <a href="/" style={{ 
        padding: "0.75rem 1.5rem", 
        backgroundColor: "#1e3a8a", 
        color: "white", 
        borderRadius: "8px",
        textDecoration: "none"
      }}>
        Go Home
      </a>
    </div>
  );
}
