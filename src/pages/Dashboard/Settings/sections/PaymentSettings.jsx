import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../../config/api";
import razorpayLogo from "../../../../assets/payment_logos/razorpay-com-logo.png";

const WEBHOOK_URL = `${API_BASE_URL}/payments/razorpay/webhook`;

const PaymentSettings = () => {
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  const [keySecretConfigured, setKeySecretConfigured] = useState(false);
  const [webhookSecretConfigured, setWebhookSecretConfigured] =
    useState(false);

  const [connectionStatus, setConnectionStatus] =
    useState("not-connected");

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPaymentSettings();
  }, []);

  const loadPaymentSettings = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/settings/payment`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load payment settings.");
      }

      const data = await response.json();

      setKeyId(data.keyId || "");

      // Do not load saved secrets into the frontend.
      setKeySecret("");
      setWebhookSecret("");

      setKeySecretConfigured(Boolean(data.keySecretConfigured));
      setWebhookSecretConfigured(
        Boolean(data.webhookSecretConfigured)
      );

      setConnectionStatus(
        data.connectionStatus || "not-connected"
      );
    } catch (error) {
      console.error("Error loading payment settings:", error);

      setMessage(
        error.message || "Unable to load payment settings."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setMessage("");

    if (!keyId.trim()) {
      setConnectionStatus("not-connected");
      setMessage("Please enter the Razorpay Test Key ID.");
      return;
    }

    if (!keySecret.trim() && !keySecretConfigured) {
      setConnectionStatus("not-connected");
      setMessage("Please enter the Razorpay Test Key Secret.");
      return;
    }

    setConnectionStatus("testing");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/settings/payment/test`,
        {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            keyId: keyId.trim(),
            keySecret: keySecret.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setConnectionStatus("connected");
        setMessage(
          "Razorpay API test connection successful."
        );
        return;
      }

      setConnectionStatus("not-connected");

      setMessage(
        data.message ||
          "Connection failed. Please check your Razorpay credentials."
      );
    } catch (error) {
      console.error("Razorpay connection test error:", error);

      setConnectionStatus("not-connected");
      setMessage(
        "Network error while testing Razorpay connection."
      );
    }
  };

  const handleSaveSettings = async () => {
    setMessage("");
    setIsSaving(true);

    try {
      const token = localStorage.getItem("token");

      const paymentData = {
        keyId: keyId.trim(),
      };

      if (keySecret.trim()) {
        paymentData.keySecret = keySecret.trim();
      }

      if (webhookSecret.trim()) {
        paymentData.webhookSecret = webhookSecret.trim();
      }

      const response = await fetch(
        `${API_BASE_URL}/settings/payment`,
        {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save payment settings."
        );
      }

      setConnectionStatus(
        data.connectionStatus || "connected"
      );

      // Clear secrets after saving.
      setKeySecret("");
      setWebhookSecret("");

      setKeySecretConfigured(true);

      if (webhookSecret.trim()) {
        setWebhookSecretConfigured(true);
      }

      setMessage(
        "Razorpay credentials saved successfully."
      );
    } catch (error) {
      console.error("Save payment settings error:", error);

      setConnectionStatus("not-connected");

      setMessage(
        error.message || "Error saving payment settings."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL);

      setMessage("Webhook URL copied to clipboard.");
    } catch (error) {
      console.error("Clipboard error:", error);

      setMessage("Unable to copy webhook URL.");
    }
  };

  const getConnectionText = () => {
    if (connectionStatus === "testing") {
      return "Testing API...";
    }

    if (connectionStatus === "connected") {
      return "Connected";
    }

    return "Not Connected";
  };

  return (
    <div className="settings-section">
      <div className="settings-section-heading">
        <h2>Payment Gateway</h2>

        <p>
          Connect your own Razorpay payment gateway to accept
          instant UPI and card payments for direct bookings and
          Front Desk payments.
        </p>
      </div>

      <section className="payment-gateway-card">
        {/* Payment gateway header */}
        <header className="payment-gateway-header">
          <div className="payment-gateway-brand">
            <div className="razorpay-logo">
              <img
                src={razorpayLogo}
                alt="Razorpay"
                className="razorpay-logo-image"
              />
            </div>

            <div>
              <h3>Razorpay</h3>

              <p>
                Accept payments from direct bookings and Front
                Desk.
              </p>
            </div>
          </div>

          <span
            className={
              connectionStatus === "connected"
                ? "gateway-status connected"
                : "gateway-status"
            }
          >
            <span className="gateway-status-dot" />
            {getConnectionText()}
          </span>
        </header>

        {/* API credentials */}
        <div className="payment-card-section">
          <div className="payment-card-section-heading">
            <h3>Razorpay API Credentials</h3>

            <p>
              Enter the Test Mode credentials generated in your
              Razorpay Dashboard.
            </p>
          </div>

          <div className="settings-form-grid">
            {/* Key ID */}
            <div className="settings-field">
              <label>
                Key ID <span>*</span>
              </label>

              <input
                type="text"
                value={keyId}
                onChange={(event) => {
                  setKeyId(event.target.value);
                }}
                placeholder="rzp_test_xxxxxxxxxxxxx"
                autoComplete="off"
              />

              <small>Your Razorpay Test Mode Key ID.</small>
            </div>

            {/* Key Secret */}
            <div className="settings-field">
              <label>
                Key Secret <span>*</span>
              </label>

              <div className="secret-input">
                <input
                  type="password"
                  value={keySecret}
                  onChange={(event) => {
                    setKeySecret(event.target.value);
                  }}
                  placeholder={
                    keySecretConfigured
                      ? "••••••••••••••••••••"
                      : "Enter your Key Secret"
                  }
                  autoComplete="new-password"
                />
              </div>

              <small>
                {keySecretConfigured
                  ? "A Key Secret is already configured. Enter a new one only if you want to replace it."
                  : "Your Key Secret is stored securely on the StayOps backend."}
              </small>
            </div>
          </div>
        </div>

        {/* Webhook */}
        <div className="payment-card-section">
          <div className="payment-card-section-heading">
            <h3>Payment Webhook</h3>

            <p>
              Razorpay sends payment events to this StayOps
              endpoint.
            </p>
          </div>

          <div className="webhook-url-box">
            <div>
              <span className="webhook-label">
                StayOps Webhook Endpoint
              </span>

              <strong>{WEBHOOK_URL}</strong>
            </div>

            <button
              type="button"
              className="copy-button"
              onClick={handleCopyWebhookUrl}
            >
              Copy URL
            </button>
          </div>

          {/* Webhook secret */}
          <div className="settings-field webhook-secret-field">
            <label>Webhook Secret (Optional)</label>

            <div className="secret-input">
              <input
                type="password"
                value={webhookSecret}
                onChange={(event) => {
                  setWebhookSecret(event.target.value);
                }}
                placeholder={
                  webhookSecretConfigured
                    ? "••••••••••••••••••••"
                    : "Enter Razorpay webhook secret"
                }
                autoComplete="new-password"
              />
            </div>

            <small>
              {webhookSecretConfigured
                ? "A webhook secret is already configured. Enter a new one only if you want to replace it."
                : "Optional secret configured in your Razorpay Webhooks settings."}
            </small>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="settings-message">
            {message}
          </div>
        )}

        {/* Actions */}
        <footer className="payment-gateway-actions">
          <div className="payment-security-note">
            <span>🔒</span>

            <div>
              <strong>Multi-Tenant Host Security</strong>

              <p>
                Credentials are stored per account and isolated
                from other StayOps accounts.
              </p>
            </div>
          </div>

          <div className="payment-action-buttons">
            <button
              type="button"
              className="settings-secondary-button"
              onClick={handleTestConnection}
              disabled={
                isLoading ||
                isSaving ||
                connectionStatus === "testing"
              }
            >
              {connectionStatus === "testing"
                ? "Testing API..."
                : "Test Connection"}
            </button>

            <button
              type="button"
              className="settings-primary-button"
              onClick={handleSaveSettings}
              disabled={isLoading || isSaving}
            >
              {isSaving ? "Saving..." : "Save & Connect"}
            </button>
          </div>
        </footer>
      </section>

      {/* Help */}
      <section className="payment-help-card">
        <div className="payment-help-icon">?</div>

        <div>
          <h3>Where do I get these credentials?</h3>

          <p>
            Open Razorpay Dashboard → Account & Settings → API
            Keys → Generate Test Key.
          </p>
        </div>
      </section>
    </div>
  );
};

export default PaymentSettings;