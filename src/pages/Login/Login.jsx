import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { ValidateLogin } from "./validate";
import "./Login.css";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../config/api";
import { extractSubdomainOrSlug } from "../Storefront/storefrontApi";
import { authenticateStaffLogin } from "../Dashboard/Team/teamApi";
import LoginShowcase from "./components/LoginShowcase";
import logo from "../../assets/logo/stayops-logo.png";

function Login() {
  // ==========================
  // STATE
  // ==========================

  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();


  // ==========================
  // LOGIN
  // ==========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --------------------------
    // Validate form
    // --------------------------

    const validationErrors = ValidateLogin(email);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error(
        validationErrors.email || "Please enter a valid email or mobile number."
      );
      return;
    }

    // --------------------------
    // Start loading
    // --------------------------

    setLoading(true);

    try {
      console.log("Attempting login...");

      // --------------------------
      // 1. Check Staff Auth (Mobile + Password)
      // --------------------------
      try {
        const staff = await authenticateStaffLogin(email, password);
        if (staff) {
          localStorage.setItem("token", `staff-token-${staff.id}`);
          localStorage.setItem(
            "user",
            JSON.stringify({
              id: staff.id,
              name: staff.name,
              mobileNumber: staff.mobileNumber,
              role: staff.role,
              assignedProperties: staff.assignedProperties,
              permissions: staff.permissions
            })
          );

          toast.success(`Welcome ${staff.name}! (${staff.role})`);

          const isCaretakerRole =
            staff.role?.toLowerCase().includes("caretaker") ||
            staff.role === "Housekeeper" ||
            staff.role === "Cook/Chef";

          if (isCaretakerRole) {
            navigate("/caretaker");
          } else {
            navigate("/dashboard");
          }
          return;
        }
      } catch (staffErr) {
        if (staffErr.message && staffErr.message.includes("inactive")) {
          toast.error(staffErr.message);
          return;
        }
      }

      // --------------------------
      // 2. Call Spring Boot backend auth
      // --------------------------

      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email,
            password: password,
            subdomain: extractSubdomainOrSlug(),
          }),
        }
      );

      console.log("Login response status:", response.status);

      // --------------------------
      // Read response
      // --------------------------

      const text = await response.text();

      console.log("Login response:", text);

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      // --------------------------
      // Login failed
      // --------------------------

      if (!response.ok) {
        toast.error(
          data?.message ||
          data?.error ||
          "Invalid email/mobile number or password."
        );

        return;
      }

      // --------------------------
      // Get JWT token
      // --------------------------

      let token = null;

      // If backend returns:
      //
      // {
      //    "token": "eyJ..."
      // }

      if (typeof data === "object" && data !== null) {
        token = data.token;
      }

      // If backend directly returns:
      //
      // "eyJ..."

      if (!token && typeof data === "string") {
        token = data;
      }

      // --------------------------
      // No token
      // --------------------------

      if (!token) {
        console.error(
          "Login succeeded but JWT token was not found.",
          data
        );

        toast.error(
          "Login succeeded, but no authentication token was returned."
        );

        return;
      }

      // --------------------------
      // Save JWT
      // --------------------------

      localStorage.setItem(
        "token",
        token
      );

      console.log(
        "JWT saved successfully."
      );


      // --------------------------
      // Save user if returned
      // --------------------------

      if (
        typeof data === "object" &&
        data !== null
      ) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: data.userId,
            name: data.name,
            email: data.email,
          })
        );
      }


      // --------------------------
      // Login successful
      // --------------------------

      toast.success("Login successful!");


      // --------------------------
      // Go to Dashboard
      // --------------------------

      navigate("/dashboard");

    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      toast.error(
        "Unable to connect to the server."
      );

    } finally {

      setLoading(false);

    }
  };


  // ==========================
  // JSX
  // ==========================

  return (
    <div className="login-page">

      {/* ================= LEFT PANEL ================= */}

      <div className="login-left">

        <div className="login-left-content">

          <h1>
            See your business more clearly.
          </h1>

          <p>
            Bring occupancy, revenue, reservations, and channel performance into one view.
          </p>

        </div>

        <div className="login-visual-wrap">
          <LoginShowcase />
        </div>

      </div>


      {/* ================= RIGHT PANEL ================= */}

      <div className="login-right">

        {/* ================= LOGO ================= */}

        <div className="logo-bar">

          <img
            src={logo}
            alt="StayOps Logo"
          />

        </div>


        {/* ================= CONTENT ================= */}

        <div className="login-content">

          <div className="login-container">

            {/* ================= BADGE ================= */}

            <div className="login-badge">

              <span className="badge-dot"></span>

              Secure Login

            </div>


            {/* ================= HEADER ================= */}

            <div className="login-header">

              <h2>
                Login
              </h2>

              <p>
                Don't have an account?
                <Link to="/signup">
                  {" "}Get Started
                </Link>
              </p>

            </div>


            {/* ================= FORM ================= */}

            <form
              className="login-form"
              onSubmit={handleSubmit}
            >

              {/* ================= EMAIL / MOBILE ================= */}

              <div className="form-group">

                <label htmlFor="email">
                  Mobile Number or Email
                </label>

                <input
                  id="email"
                  type="text"
                  placeholder="Enter 10-digit mobile number or email"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  enterKeyHint="next"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);

                    if (errors.email) {
                      setErrors({});
                    }
                  }}
                  required
                />

              </div>


              {/* ================= PASSWORD ================= */}

              <div className="form-group">

                <label htmlFor="password">
                  Password
                </label>

                <div className="password-wrapper">

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    enterKeyHint="go"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (prev) => !prev
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    {showPassword ? (
                      <FiEyeOff />
                    ) : (
                      <FiEye />
                    )}

                  </button>

                </div>

              </div>


              {/* ================= FORGOT PASSWORD ================= */}

              <div className="login-options">

                <Link
                  to="/forgot-password"
                  className="forgot-password"
                >
                  Forgot Password?
                </Link>

              </div>


              {/* ================= LOGIN BUTTON ================= */}

              <button
                className="login-btn"
                type="submit"
                disabled={loading}
              >

                {loading
                  ? "Logging in..."
                  : "Login"
                }

              </button>

            </form>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;