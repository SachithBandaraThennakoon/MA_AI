import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { token, logout } = useContext(AuthContext);

  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "15px",
      background: "#111",
      color: "white"
    }}>
      <div>
        <Link to="/" style={{ color: "white", marginRight: "15px" }}>
          Home
        </Link>

        {token && (
          <Link to="/training" style={{ color: "white" }}>
            Training
          </Link>
        )}
      </div>

      <div>
        {!token ? (
          <>
            <Link to="/login" style={{ color: "white", marginRight: "10px" }}>
              Login
            </Link>
            <Link to="/register" style={{ color: "white" }}>
              Register
            </Link>
          </>
        ) : (
          <button onClick={logout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}