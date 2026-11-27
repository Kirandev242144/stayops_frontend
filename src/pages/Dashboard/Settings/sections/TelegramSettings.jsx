import React, { useState, useEffect } from "react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiCopy,
  FiExternalLink,
  FiBell,
  FiTrash2,
  FiRefreshCw,
  FiSend,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiShield,
  FiInfo,
} from "react-icons/fi";
import { SiTelegram } from "react-icons/si";
import { toast } from "react-toastify";
import { fetchProperties } from "../../Reservations/propertyApi";
import {
  fetchTelegramStatus,
  connectTelegramBot,
  disconnectTelegramBot,
  sendTelegramTestAlert,
  updateTelegramPreferences,
} from "../telegramApi";
import "./TelegramSettings.css";

const TelegramSettings = () => {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Connection form state
  const [botToken, setBotToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alerts & testing
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualChatId, setManualChatId] = useState("");
  const [isSavingChatId, setIsSavingChatId] = useState(false);

  // Mini App Storefront URL
  const [customWebAppUrl, setCustomWebAppUrl] = useState("");
  const [isSavingUrl, setIsSavingUrl] = useState(false);

  // Disconnect Confirmation Modal
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // Load properties on mount
  useEffect(() => {
    loadPropertiesList();
  }, []);

  // When selected property changes, load its Telegram status
  useEffect(() => {
    if (selectedPropertyId) {
      loadBotStatus(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const loadPropertiesList = async () => {
    try {
      const list = await fetchProperties();
      setProperties(list || []);
      if (list && list.length > 0) {
        setSelectedPropertyId(String(list[0].id));
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error loading properties:", err);
      toast.error("Failed to load properties list.");
      setIsLoading(false);
    }
  };

  const loadBotStatus = async (propId) => {
    setIsLoading(true);
    try {
      const data = await fetchTelegramStatus(propId);
      setStatus(data);
      if (data?.ownerChatId) {
        setManualChatId(String(data.ownerChatId));
      } else {
        setManualChatId("");
      }
      setCustomWebAppUrl(data?.webAppUrl || "");
    } catch (err) {
      console.error("Error fetching Telegram status:", err);
      setStatus({ connected: false });
    } finally {
      setIsLoading(false);
    }
  };

  const validateUrl = (url) => {
    if (!url) return true;
    const trimmed = url.trim();
    return trimmed.startsWith("https://") || trimmed.startsWith("http://localhost");
  };

  const handleSaveWebAppUrl = async (e) => {
    if (e) e.preventDefault();
    const trimmed = customWebAppUrl.trim();

    if (trimmed && !validateUrl(trimmed)) {
      toast.error("Security requirement: Telegram Mini App URLs must use HTTPS (e.g. https://your-domain.com)");
      return;
    }

    setIsSavingUrl(true);
    try {
      const updated = await updateTelegramPreferences(selectedPropertyId, {
        webAppUrl: trimmed,
      });
      setStatus(updated);
      toast.success("Telegram Mini App Menu Button updated successfully!");
    } catch (err) {
      toast.error("Failed to update Web App URL: " + (err.message || "Unknown error"));
    } finally {
      setIsSavingUrl(false);
    }
  };

  const handleSaveChatId = async (e) => {
    if (e) e.preventDefault();
    if (!manualChatId.trim()) {
      toast.error("Please enter your numeric Telegram Chat ID.");
      return;
    }
    const cleanId = manualChatId.trim().replace(/[^0-9-]/g, "");
    if (!cleanId || isNaN(Number(cleanId))) {
      toast.error("Invalid Chat ID format. Must be a valid numeric integer.");
      return;
    }

    setIsSavingChatId(true);
    try {
      const updated = await updateTelegramPreferences(selectedPropertyId, {
        ownerChatId: Number(cleanId),
      });
      setStatus(updated);
      toast.success("Owner Telegram Chat ID saved successfully!");
    } catch (err) {
      toast.error("Failed to save Chat ID: " + (err.message || "Unknown error"));
    } finally {
      setIsSavingChatId(false);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    const token = botToken.trim();
    if (!token) {
      toast.error("Please enter your Telegram Bot API Token.");
      return;
    }

    // Basic format check
    if (!token.startsWith("demo_") && !token.startsWith("test_") && !/^\d+:[A-Za-z0-9_-]{30,}$/.test(token)) {
      toast.warn("Warning: Token does not match typical Telegram Bot token format (e.g., 123456789:AA...).");
    }

    setIsSubmitting(true);
    try {
      const updatedStatus = await connectTelegramBot(selectedPropertyId, token);
      setStatus(updatedStatus);
      setBotToken(""); // Immediately clear raw token from component memory
      toast.success("Telegram Bot connected successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to connect bot.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDisconnect = async () => {
    setShowDisconnectModal(false);
    setIsSubmitting(true);
    try {
      await disconnectTelegramBot(selectedPropertyId);
      setStatus({ connected: false });
      toast.info("Telegram Bot disconnected.");
    } catch (err) {
      toast.error(err.message || "Failed to disconnect bot.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePreference = async (key) => {
    if (!status) return;
    const newPrefs = {
      notifyNewBooking: key === "notifyNewBooking" ? !status.notifyNewBooking : status.notifyNewBooking,
      notifyCancellation: key === "notifyCancellation" ? !status.notifyCancellation : status.notifyCancellation,
      notifyDailyRoster: key === "notifyDailyRoster" ? !status.notifyDailyRoster : status.notifyDailyRoster,
    };

    try {
      const updated = await updateTelegramPreferences(selectedPropertyId, newPrefs);
      setStatus(updated);
      toast.success("Preferences updated.");
    } catch (err) {
      toast.error("Failed to update preferences.");
    }
  };

  const handleSendTestAlert = async () => {
    setIsSendingTest(true);
    try {
      await sendTelegramTestAlert(selectedPropertyId);
      toast.success("Test notification sent! Check your Telegram chat.");
    } catch (err) {
      toast.error(err.message || "Failed to send test alert.");
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleCopyGuestLink = () => {
    if (!status?.guestBookingLink) return;
    navigator.clipboard.writeText(status.guestBookingLink);
    setCopied(true);
    toast.success("Guest booking link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const currentProperty = properties.find((p) => String(p.id) === String(selectedPropertyId));

  return (
    <div className="telegram-settings-container">
      {/* Property Selector Bar */}
      {properties.length > 1 && (
        <div className="tg-prop-selector-card">
          <label htmlFor="tg-property-select">Configuring Property:</label>
          <select
            id="tg-property-select"
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
          >
            {properties.map((prop) => (
              <option key={prop.id} value={prop.id}>
                {prop.name} ({prop.city || "StayOps"})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Header Banner */}
      <div className="tg-header-banner">
        <div className="tg-header-icon-wrap">
          <SiTelegram size={32} color="#0088CC" />
        </div>
        <div className="tg-header-info">
          <h2>Telegram Bot API & Mini App Integration</h2>
          <p>
            Connect your property’s branded Telegram bot. Guests can explore rooms and book instantly
            via the embedded Telegram Mini App, while owners receive free, real-time push alerts.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="tg-loading-state">
          <FiRefreshCw size={24} className="tg-spinner" />
          <p>Loading Telegram integration details...</p>
        </div>
      ) : status?.connected ? (
        /* ================= CONNECTED BOT VIEW ================= */
        <div className="tg-connected-layout">
          {/* Active Bot Identity Card */}
          <div className="tg-card tg-bot-card">
            <div className="tg-card-header">
              <div className="tg-badge-connected">
                <span className="tg-badge-dot"></span>
                Bot Active & Healthy
              </div>
              <button
                type="button"
                className="tg-btn-danger-outline"
                onClick={() => setShowDisconnectModal(true)}
                disabled={isSubmitting}
              >
                <FiTrash2 size={14} />
                Disconnect Bot
              </button>
            </div>

            <div className="tg-bot-identity">
              <div className="tg-bot-avatar">
                <SiTelegram size={32} color="#FFFFFF" />
              </div>
              <div className="tg-bot-details">
                <h3>{status.botName || currentProperty?.name || "StayOps Bot"}</h3>
                <p className="tg-bot-handle">@{status.botUsername}</p>
                <div className="tg-pill-group">
                  <a
                    href={status.botLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tg-link-pill"
                  >
                    <FiExternalLink size={13} />
                    Open Bot in Telegram
                  </a>
                  
                </div>
              </div>
            </div>

            {/* Direct Guest Booking Link */}
            <div className="tg-link-box">
              <label>Direct Guest Booking Link (Telegram Mini App)</label>
              <div className="tg-copy-input-group">
                <input
                  type="text"
                  readOnly
                  value={status.guestBookingLink || status.botLink}
                />
                <button
                  type="button"
                  className="tg-copy-btn"
                  onClick={handleCopyGuestLink}
                >
                  {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
                  {copied ? "Copied" : "Copy Link"}
                </button>
              </div>
              <span className="tg-help-text">
                Share this link on your Instagram bio, WhatsApp, or Google Business profile. When guests tap it, your StayOps storefront opens directly inside Telegram with zero app downloads required.
              </span>
            </div>

            {/* Storefront Web App URL Override (for tunnels/custom domains) */}
            <div className="tg-link-box tg-webapp-url-box">
              <div className="tg-url-header">
                <label>Storefront Web App URL (Telegram Mini App URL)</label>
                <span className="tg-secure-badge">
                  <FiShield size={12} /> HTTPS Required
                </span>
              </div>
              <div className="tg-copy-input-group">
                <input
                  type="url"
                  placeholder="e.g. https://stayops.in or https://your-tunnel.trycloudflare.com"
                  value={customWebAppUrl}
                  onChange={(e) => setCustomWebAppUrl(e.target.value)}
                />
                <button
                  type="button"
                  className="tg-btn-primary"
                  onClick={handleSaveWebAppUrl}
                  disabled={isSavingUrl}
                  style={{ border: "none" }}
                >
                  {isSavingUrl ? "Updating..." : "Update Menu Button"}
                </button>
              </div>
              <span className="tg-help-text">
                Telegram requires an <b>HTTPS</b> URL for the chat menu button Web App. Leave blank to default to your standard StayOps domain.
              </span>
            </div>
          </div>

          {/* Owner Real-Time Alerts Card */}
          <div className="tg-card tg-alerts-card">
            <div className="tg-alerts-header">
              <div className="tg-section-icon">
                <FiBell size={18} color="#0D9488" />
              </div>
              <div>
                <h4>Owner Real-Time Push Alerts</h4>
                <p>Instant notifications delivered directly to your Telegram personal chat for bookings and operations.</p>
              </div>
            </div>

            {status.ownerLinked ? (
              <div className="tg-owner-linked-banner">
                <div className="tg-owner-linked-left">
                  <FiCheckCircle size={20} color="#10B981" />
                  <div>
                    <strong>Owner Account Linked!</strong>
                    <span>Receiving instant notifications at Chat ID: <code>{status.ownerChatId}</code></span>
                  </div>
                </div>
                <button
                  type="button"
                  className="tg-btn-secondary"
                  onClick={handleSendTestAlert}
                  disabled={isSendingTest}
                >
                  <FiSend size={13} />
                  {isSendingTest ? "Sending..." : "Send Test Alert"}
                </button>
              </div>
            ) : (
              <div className="tg-owner-unlinked-banner">
                <div className="tg-unlinked-info">
                  <FiAlertCircle size={20} color="#F59E0B" />
                  <div>
                    <strong>Link Your Personal Telegram for Alerts</strong>
                    <span>
                      Tap the button below and click <b>Start</b> in Telegram so the bot knows where to send your booking notifications.
                    </span>
                  </div>
                </div>
                <a
                  href={status.ownerLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tg-btn-primary"
                >
                  <FiExternalLink size={14} />
                  Link Telegram for Alerts
                </a>
              </div>
            )}

            {/* Manual Chat ID Input / Direct Setup */}
            <div className="tg-manual-chat-box">
              <label>Telegram Owner Chat ID {status.ownerLinked && status.ownerChatId ? `(Active: ${status.ownerChatId})` : "(Direct Setup)"}</label>
              <div className="tg-manual-input-group">
                <input
                  type="text"
                  placeholder="e.g. 589412345"
                  value={manualChatId}
                  onChange={(e) => setManualChatId(e.target.value)}
                />
                <button
                  type="button"
                  className="tg-btn-primary"
                  onClick={handleSaveChatId}
                  disabled={isSavingChatId}
                >
                  {isSavingChatId ? "Saving..." : "Save Chat ID"}
                </button>
              </div>
              <span className="tg-help-text">
                💡 <b>How to find your numeric Chat ID:</b> In Telegram, message{" "}
                <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer">
                  @userinfobot
                </a>{" "}
                or{" "}
                <a href="https://t.me/raw_data_bot" target="_blank" rel="noreferrer">
                  @raw_data_bot
                </a>
                , and paste the numeric ID shown into this field.
              </span>
            </div>

            {/* Notification Preference Toggles */}
            <div className="tg-toggles-list">
              <div
                className="tg-toggle-row"
                onClick={() => handleTogglePreference("notifyNewBooking")}
              >
                <div className="tg-toggle-info">
                  <strong>New Booking Notifications</strong>
                  <span>Instant alert with guest name, room, dates, and payment amount.</span>
                </div>
                <input
                  type="checkbox"
                  checked={status.notifyNewBooking}
                  onChange={() => {}}
                  className="tg-checkbox"
                />
              </div>

              <div
                className="tg-toggle-row"
                onClick={() => handleTogglePreference("notifyCancellation")}
              >
                <div className="tg-toggle-info">
                  <strong>Cancellation Notices</strong>
                  <span>Alert when reservations are cancelled or modified.</span>
                </div>
                <input
                  type="checkbox"
                  checked={status.notifyCancellation}
                  onChange={() => {}}
                  className="tg-checkbox"
                />
              </div>

              <div
                className="tg-toggle-row"
                onClick={() => handleTogglePreference("notifyDailyRoster")}
              >
                <div className="tg-toggle-info">
                  <strong>Daily Check-in & Housekeeping Roster</strong>
                  <span>Morning summary of expected arrivals, departures, and room tasks.</span>
                </div>
                <input
                  type="checkbox"
                  checked={status.notifyDailyRoster}
                  onChange={() => {}}
                  className="tg-checkbox"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= SETUP / NOT CONNECTED VIEW ================= */
        <div className="tg-setup-layout">
          {/* 4-Step Visual Guide */}
          <div className="tg-guide-container">
            <h3 className="tg-guide-title">How to Set Up in 2 Minutes</h3>

            <div className="tg-steps-grid">
              {/* Step 1 */}
              <div className="tg-step-card">
                <div className="tg-step-num">1</div>
                <h4>Open @BotFather</h4>
                <p>
                  Open Telegram and search for <b>@BotFather</b> (Telegram's official bot creation manager).
                </p>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tg-step-btn"
                >
                  <FiExternalLink size={13} />
                  Open @BotFather
                </a>
              </div>

              {/* Step 2 */}
              <div className="tg-step-card">
                <div className="tg-step-num">2</div>
                <h4>Send /newbot</h4>
                <p>
                  Type <code>/newbot</code>. Enter a friendly display name (e.g., <i>{currentProperty?.name || "Nature Villa"}</i>) and a username ending in <code>bot</code> (e.g. <i>NatureVilla_Bot</i>).
                </p>
              </div>

              {/* Step 3 */}
              <div className="tg-step-card">
                <div className="tg-step-num">3</div>
                <h4>Copy API Token</h4>
                <p>
                  BotFather will reply with an HTTP API token looking like:
                  <br />
                  <code>784920192:AAH9K_8XvL...</code>
                </p>
              </div>

              {/* Step 4 */}
              <div className="tg-step-card">
                <div className="tg-step-num">4</div>
                <h4>Paste & Connect</h4>
                <p>
                  Paste the token below. StayOps encrypts your token with AES-256 and configures your Telegram Mini App automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Connect Form */}
          <div className="tg-card tg-connect-card">
            <h3>Connect Telegram Bot</h3>
            <p>
              Enter the HTTP API token for <b>{currentProperty?.name || "your property"}</b>.
            </p>

            <form onSubmit={handleConnect} className="tg-form">
              <div className="tg-field-group">
                <label htmlFor="bot-token-input">Telegram Bot API Token *</label>
                <div className="tg-password-input-wrap">
                  <input
                    id="bot-token-input"
                    type={showToken ? "text" : "password"}
                    placeholder="e.g. 784920192:AAH9K_8XvLgE4m6P9q..."
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    autoComplete="off"
                    required
                  />
                  <button
                    type="button"
                    className="tg-toggle-pwd-btn"
                    onClick={() => setShowToken(!showToken)}
                    aria-label={showToken ? "Hide token" : "Show token"}
                  >
                    {showToken ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                <div className="tg-security-note">
                  <FiShield size={13} color="#059669" />
                  <span>Your token is encrypted securely using AES-256 before storing in the database.</span>
                </div>
              </div>

              <button
                type="submit"
                className="tg-btn-connect"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FiRefreshCw size={15} className="tg-spinner" />
                    Connecting & Configuring Mini App...
                  </>
                ) : (
                  <>
                    <SiTelegram size={16} />
                    Connect Telegram Bot
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="tg-modal-overlay">
          <div className="tg-modal-card">
            <div className="tg-modal-icon-wrap">
              <FiAlertCircle size={28} color="#DC2626" />
            </div>
            <h3>Disconnect Telegram Bot?</h3>
            <p>
              Are you sure you want to disconnect <b>@{status?.botUsername}</b>?
              <br />
              Guests will no longer be able to browse or book via Telegram, and owner push alerts will be stopped.
            </p>
            <div className="tg-modal-actions">
              <button
                type="button"
                className="tg-modal-btn-cancel"
                onClick={() => setShowDisconnectModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tg-modal-btn-confirm"
                onClick={confirmDisconnect}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Disconnecting..." : "Yes, Disconnect Bot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramSettings;
