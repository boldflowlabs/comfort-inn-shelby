"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BookOpen,
  Eye,
  LogOut,
  Search,
  Download,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Lock,
  Check,
  Clock
} from "lucide-react";
import "./admin.css";

interface Message {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  timestamp: string;
  intentDetected: string | null;
}

interface Conversation {
  id: string;
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  language: string;
  leadCaptured: boolean;
  complaintFlagged: boolean;
  intentLog: string;
  messages: Message[];
}

interface Lead {
  id: string;
  sessionId: string | null;
  firstName: string;
  email: string;
  phone: string;
  checkinDate: string | null;
  roomPreference: string | null;
  sourcePage: string | null;
  createdAt: string;
}

interface KbItem {
  id: string;
  category: string;
  key: string;
  value: string;
  updatedBy: string | null;
  updatedAt: string;
}

interface Stats {
  totalConversations: number;
  leadsCaptured: number;
  complaintsEscalated: number;
  topIntent: string;
  intentChartData: { name: string; value: number }[];
}

interface Complaint {
  id: string;
  sessionId: string | null;
  guestName: string;
  roomNumber: string;
  contactInfo: string | null;
  description: string;
  summary: string;
  createdAt: string;
  status: string;
}

type TabType = "overview" | "leads" | "conversations" | "kb" | "preview" | "complaints";

export default function ElaraAdminDashboard() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [kbItems, setKbItems] = useState<KbItem[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [leadsSearch, setLeadsSearch] = useState("");
  const [conversationsSearch, setConversationsSearch] = useState("");
  const [kbSearch, setKbSearch] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Complaint Transcript state
  const [activeComplaintSessionId, setActiveComplaintSessionId] = useState<string | null>(null);
  const [complaintMessages, setComplaintMessages] = useState<Message[]>([]);
  const [isLoadingComplaintMessages, setIsLoadingComplaintMessages] = useState(false);

  // Edit Knowledge Base state
  const [kbEditValues, setKbEditValues] = useState<Record<string, string>>({});
  const [savingKbId, setSavingKbId] = useState<string | null>(null);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);

  // Live preview refresh trigger
  const [previewKey, setPreviewKey] = useState(0);

  // Loading states for data fetching
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Custom dialog notifications
  interface AdminNotification {
    type: "confirm" | "alert";
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    statusType?: "success" | "error" | "info";
  }
  const [notification, setNotification] = useState<AdminNotification | null>(null);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setNotification({
      type: "confirm",
      title,
      message,
      onConfirm: () => {
        setNotification(null);
        onConfirm();
      },
      onCancel: () => setNotification(null),
      statusType: "info"
    });
  };

  const triggerAlert = (message: string, statusType: "success" | "error" | "info" = "info") => {
    setNotification({
      type: "alert",
      title: statusType === "success" ? "Success" : statusType === "error" ? "Error" : "Notice",
      message,
      statusType,
      onConfirm: () => setNotification(null)
    });
  };

  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 1. Initial Authentication Check
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin?action=check-auth");
        if (res.ok) {
          const data = await res.json();
          setAuthenticated(!!data.authenticated);
        } else {
          setAuthenticated(false);
        }
      } catch (e) {
        console.error("Auth check failed:", e);
        setAuthenticated(false);
      } finally {
        setIsLoadingAuth(false);
      }
    }
    checkAuth();
  }, []);

  // 2. Load tab data helper
  const loadTabData = async (tab: TabType) => {
    setIsLoadingData(true);
    try {
      if (tab === "overview") {
        const res = await fetch("/api/admin?action=stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } else if (tab === "leads") {
        const res = await fetch(`/api/admin?action=leads&search=${encodeURIComponent(leadsSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setLeads(data);
        }
      } else if (tab === "conversations") {
        const res = await fetch(`/api/admin?action=conversations&search=${encodeURIComponent(conversationsSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        }
      } else if (tab === "kb" || tab === "preview") {
        const res = await fetch("/api/admin?action=kb");
        if (res.ok) {
          const data = await res.json();
          setKbItems(data);
        }
      } else if (tab === "complaints") {
        const res = await fetch("/api/admin?action=complaints");
        if (res.ok) {
          const data = await res.json();
          setComplaints(data);
        }
      }
    } catch (e) {
      console.error(`Error loading data for tab ${tab}:`, e);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Load data when authenticated or tab changes
  useEffect(() => {
    if (authenticated) {
      loadTabData(activeTab);
    }
  }, [authenticated, activeTab]);

  // Trigger search actions manually or via effects
  useEffect(() => {
    if (authenticated && activeTab === "leads") {
      const delayDebounce = setTimeout(() => {
        loadTabData("leads");
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [leadsSearch]);

  useEffect(() => {
    if (authenticated && activeTab === "conversations") {
      const delayDebounce = setTimeout(() => {
        loadTabData("conversations");
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [conversationsSearch]);

  // 3. Login submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsSubmittingLogin(true);
    setLoginError("");

    try {
      const res = await fetch("/api/admin?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        setAuthenticated(true);
      } else {
        const data = await res.json();
        setLoginError(data.error || "Invalid login credentials.");
      }
    } catch (e) {
      setLoginError("Network error. Please try again.");
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // 4. Logout submit
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/admin?action=logout", { method: "POST" });
      if (res.ok) {
        setAuthenticated(false);
        // Reset local states
        setStats(null);
        setLeads([]);
        setConversations([]);
        setKbItems([]);
      }
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  // 5. Update KB Item
  const handleKbSave = async (id: string) => {
    const value = kbEditValues[id];
    if (value === undefined) return;

    setSavingKbId(id);
    setSaveSuccessId(null);

    try {
      const res = await fetch("/api/admin?action=kb-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, value })
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state
        setKbItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, value, updatedAt: new Date().toISOString() } : item))
        );
        setSaveSuccessId(id);
        setTimeout(() => setSaveSuccessId(null), 2500);

        // Reload preview frame
        setPreviewKey((prev) => prev + 1);
      } else {
        triggerAlert("Failed to save knowledge base item.", "error");
      }
    } catch (e) {
      triggerAlert("Network error saving knowledge base item.", "error");
    } finally {
      setSavingKbId(null);
    }
  };

  // 6. Toggle resolve status of a complaint
  const handleResolveComplaint = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "resolved" ? "pending" : "resolved";
    try {
      const res = await fetch("/api/admin?action=complaint-resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus })
      });

      if (res.ok) {
        setComplaints((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
        );
      } else {
        triggerAlert("Failed to update complaint status.", "error");
      }
    } catch (e) {
      triggerAlert("Network error updating complaint status.", "error");
    }
  };

  // Delete all resolved complaints
  const handleDeleteResolvedComplaints = () => {
    triggerConfirm(
      "Purge Resolved Complaints",
      "Are you sure you want to delete all resolved complaints? This action cannot be undone.",
      async () => {
        try {
          const res = await fetch("/api/admin?action=complaints-delete-resolved", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          });
          if (res.ok) {
            const data = await res.json();
            triggerAlert(`Successfully deleted ${data.count} resolved complaints.`, "success");
            loadTabData("complaints");
          } else {
            triggerAlert("Failed to delete resolved complaints.", "error");
          }
        } catch (e) {
          triggerAlert("Network error. Failed to delete resolved complaints.", "error");
        }
      }
    );
  };

  // View transcript for a complaint
  const handleViewComplaintTranscript = async (sessionId: string | null) => {
    if (!sessionId) {
      triggerAlert("No chat session associated with this complaint.", "error");
      return;
    }
    setActiveComplaintSessionId(sessionId);
    setIsLoadingComplaintMessages(true);
    setComplaintMessages([]);
    try {
      const res = await fetch(`/api/admin?action=conversation-messages&sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setComplaintMessages(data);
      } else {
        triggerAlert("Failed to load chat transcript.", "error");
      }
    } catch (e) {
      triggerAlert("Error loading chat transcript.", "error");
    } finally {
      setIsLoadingComplaintMessages(false);
    }
  };

  // Delete a lead by ID
  const handleDeleteLead = (id: string) => {
    triggerConfirm(
      "Delete Booking Lead",
      "Are you sure you want to delete this lead? This action cannot be undone.",
      async () => {
        try {
          const res = await fetch("/api/admin?action=lead-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id })
          });
          if (res.ok) {
            setLeads((prev) => prev.filter((lead) => lead.id !== id));
            loadTabData("overview");
            triggerAlert("Lead successfully deleted.", "success");
          } else {
            triggerAlert("Failed to delete lead.", "error");
          }
        } catch (e) {
          triggerAlert("Network error. Failed to delete lead.", "error");
        }
      }
    );
  };

  // Delete a transcript by sessionId
  const handleDeleteTranscript = (sessionId: string) => {
    triggerConfirm(
      "Delete Chat Transcript",
      "Are you sure you want to delete this transcript? This will delete all chat messages in this session and cannot be undone.",
      async () => {
        try {
          const res = await fetch("/api/admin?action=transcript-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId })
          });
          if (res.ok) {
            setConversations((prev) => prev.filter((c) => c.sessionId !== sessionId));
            if (selectedConversation?.sessionId === sessionId) {
              setSelectedConversation(null);
            }
            loadTabData("overview");
            triggerAlert("Transcript successfully deleted.", "success");
          } else {
            triggerAlert("Failed to delete transcript.", "error");
          }
        } catch (e) {
          triggerAlert("Network error. Failed to delete transcript.", "error");
        }
      }
    );
  };

  // 5.5. Scan for abandoned bookings (test override)
  const [isScanning, setIsScanning] = useState(false);
  const handleScanAbandonment = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/event?action=scan_abandonment&test=true", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        triggerAlert(data.message || "Successfully scanned and processed abandoned bookings.", "success");
        loadTabData(activeTab);
      } else {
        const err = await res.json();
        triggerAlert(err.error || "Failed to scan for abandoned bookings.", "error");
      }
    } catch (e) {
      console.error(e);
      triggerAlert("An error occurred while running the scan.", "error");
    } finally {
      setIsScanning(false);
    }
  };

  // 6. Export leads to CSV
  const handleExportLeads = () => {
    window.open("/api/admin?action=export-leads", "_blank");
  };

  // Loading state during auth check
  if (isLoadingAuth) {
    return (
      <div className="auth-container">
        <div style={{ textAlign: "center", color: "#f1f5f9" }}>
          <RefreshCw className="auth-logo" style={{ animation: "spin 2s linear infinite" }} size={40} />
          <p style={{ marginTop: 12, fontFamily: "var(--font-display)", fontWeight: 600 }}>Loading Elara Admin...</p>
        </div>
      </div>
    );
  }

  // Login view if not authenticated
  if (!authenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <Lock size={44} />
          </div>
          <h1 className="auth-title">Comfort Inn Shelby</h1>
          <p className="auth-subtitle">Elara Operations Console</p>

          {loginError && <div className="error-banner" style={{ marginBottom: 20 }}>{loginError}</div>}

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Admin Email</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="owner@comfortshelby.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Console Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="auth-btn" type="submit" disabled={isSubmittingLogin}>
              {isSubmittingLogin ? "Authenticating..." : "Access Console"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Helper to format date
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  // Helper to render Intent Tags
  const renderIntentTags = (intentLogJson: string) => {
    try {
      const intents: string[] = JSON.parse(intentLogJson || "[]");
      if (intents.length === 0) return <span className="tag-intent faq">FAQ / General</span>;

      return intents.map((intent, idx) => {
        const clean = intent.replace(/_INTENT/g, "").replace(/_/g, " ");
        let cls = "faq";
        if (intent.includes("BOOKING")) cls = "booking";
        if (intent.includes("COMPLAINT") || intent.includes("ESCALATED")) cls = "complaint";

        return (
          <span key={idx} className={`tag-intent ${cls}`}>
            {clean}
          </span>
        );
      });
    } catch {
      return <span className="tag-intent faq">FAQ</span>;
    }
  };

  return (
    <div className="admin-wrapper">
      <div className="dashboard-layout">
        
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo" style={{ color: "var(--gold-500)" }}>
              <Lock size={24} />
            </div>
            <div>
              <h2 className="sidebar-title">Comfort Inn</h2>
              <span className="sidebar-subtitle">Elara Dashboard</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("overview");
                setSelectedConversation(null);
              }}
            >
              <LayoutDashboard size={18} />
              <span>Overview</span>
            </button>
            <button
              className={`nav-item ${activeTab === "leads" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("leads");
                setSelectedConversation(null);
              }}
            >
              <Users size={18} />
              <span>Leads Captured</span>
            </button>
            <button
              className={`nav-item ${activeTab === "conversations" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("conversations");
                setSelectedConversation(null);
              }}
            >
              <MessageSquare size={18} />
              <span>Transcripts</span>
            </button>
            <button
              className={`nav-item ${activeTab === "kb" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("kb");
                setSelectedConversation(null);
              }}
            >
              <BookOpen size={18} />
              <span>Knowledge Base</span>
            </button>
            <button
              className={`nav-item ${activeTab === "preview" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("preview");
                setSelectedConversation(null);
              }}
            >
              <Eye size={18} />
              <span>Live Preview</span>
            </button>
            <button
              className={`nav-item ${activeTab === "complaints" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("complaints");
                setSelectedConversation(null);
              }}
            >
              <AlertTriangle size={18} style={{ color: activeTab === "complaints" ? "#fca5a5" : "inherit" }} />
              <span>Complaints Desk</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          
          {/* Header */}
          <div className="content-header">
            <div>
              <h1 className="page-title">
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "leads" && "Rate Lead Desk"}
                {activeTab === "conversations" && "Chat Transcript Logs"}
                {activeTab === "kb" && "Knowledge Base Directory"}
                {activeTab === "preview" && "Real-Time Widget Preview"}
                {activeTab === "complaints" && "Complaints Desk"}
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: 4 }}>
                Comfort Inn Shelby NC • Operational Control Console
              </p>
            </div>
            
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button
                className="btn-primary"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--navy-800)", color: "#ffffff" }}
                onClick={() => loadTabData(activeTab)}
                disabled={isLoadingData}
                title="Refresh tab data"
              >
                <RefreshCw size={14} className={isLoadingData ? "spin" : ""} style={{ animation: isLoadingData ? "spin 1s linear infinite" : "none" }} />
                <span>Sync</span>
              </button>

              {activeTab === "leads" && (
                <button className="btn-primary" onClick={handleExportLeads}>
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              )}

              {activeTab === "conversations" && (
                <button
                  className="btn-primary"
                  style={{ background: "rgba(212, 175, 55, 0.15)", border: "1px solid rgba(212, 175, 55, 0.3)", color: "var(--gold-300)" }}
                  onClick={handleScanAbandonment}
                  disabled={isScanning}
                  title="Scan for abandoned bookings immediately (test mode)"
                >
                  <RefreshCw size={14} className={isScanning ? "spin" : ""} style={{ animation: isScanning ? "spin 1s linear infinite" : "none" }} />
                  <span>Scan Abandonment</span>
                </button>
              )}

              {activeTab === "complaints" && (
                <button
                  className="btn-primary"
                  style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5" }}
                  onClick={handleDeleteResolvedComplaints}
                >
                  <AlertTriangle size={14} />
                  <span>Purge Resolved</span>
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && stats && (
            <div className="tab-pane-content" style={{ animation: "fadeIn 0.3s ease" }}>
              {/* Metric stats cards grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <MessageSquare size={22} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Total Conversations</span>
                    <span className="stat-value">{stats.totalConversations}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: "rgba(212,175,55,0.15)", color: "var(--gold-400)" }}>
                    <Users size={22} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Leads Captured</span>
                    <span className="stat-value">{stats.leadsCaptured}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}>
                    <AlertTriangle size={22} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Complaints Flagged</span>
                    <span className="stat-value">{stats.complaintsEscalated}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: "rgba(34,197,94,0.15)", color: "#86efac" }}>
                    <TrendingUp size={22} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Common Intent</span>
                    <span className="stat-value" style={{ fontSize: "1.1rem", textTransform: "capitalize" }}>
                      {stats.topIntent.replace(/_INTENT/g, "").replace(/_/g, " ").toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Panel split layout */}
              <div className="panel-grid">
                <div className="dashboard-panel">
                  <h3 className="panel-title">Customer Intent Frequency</h3>
                  {stats.intentChartData && stats.intentChartData.length > 0 ? (
                    <div className="bar-chart-container">
                      {stats.intentChartData.map((item, idx) => {
                        const total = stats.intentChartData.reduce((acc, curr) => acc + curr.value, 0);
                        const pct = total > 0 ? (item.value / total) * 100 : 0;

                        return (
                          <div className="chart-bar-row" key={idx}>
                            <div className="chart-bar-labels">
                              <span className="chart-bar-name" style={{ textTransform: "capitalize" }}>
                                {item.name.toLowerCase()}
                              </span>
                              <span className="chart-bar-value">
                                {item.value} inquiries ({Math.round(pct)}%)
                              </span>
                            </div>
                            <div className="chart-bar-bg">
                              <div className="chart-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                      No intent analytics logged in the database yet. Test the widget to generate statistics!
                    </div>
                  )}
                </div>

                <div className="dashboard-panel">
                  <h3 className="panel-title">Console Actions</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                      Make adjustments to the hotel guidelines, active renovations, and pool status, then click on the **Live Preview** tab to test it instantly.
                    </p>
                    <button
                      className="btn-primary"
                      onClick={() => setActiveTab("preview")}
                      style={{ justifyContent: "center", padding: 12, marginTop: 12 }}
                    >
                      <Eye size={16} />
                      <span>Launch Sandbox Preview</span>
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => setActiveTab("kb")}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid var(--navy-800)",
                        color: "#ffffff",
                        justifyContent: "center",
                        padding: 12
                      }}
                    >
                      <BookOpen size={16} />
                      <span>Manage Knowledge Base</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LEADS TABLE */}
          {activeTab === "leads" && (
            <div className="tab-pane-content" style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ position: "relative", width: "100%", maxWidth: 320 }}>
                  <Search
                    size={16}
                    style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                  />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by name, email..."
                    value={leadsSearch}
                    onChange={(e) => setLeadsSearch(e.target.value)}
                    style={{ paddingLeft: 36, maxWidth: "none" }}
                  />
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Showing {leads.length} captured booking leads
                </div>
              </div>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Check-in</th>
                      <th>Room Preference</th>
                      <th>Channel Source</th>
                      <th>Captured Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length > 0 ? (
                      leads.map((lead) => (
                        <tr key={lead.id}>
                          <td style={{ fontWeight: 700, color: "#ffffff" }}>{lead.firstName}</td>
                          <td>{lead.email}</td>
                          <td>{lead.phone}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Clock size={12} style={{ color: "var(--gold-400)" }} />
                              <span>{lead.checkinDate || "Not Specified"}</span>
                            </div>
                          </td>
                          <td>{lead.roomPreference || "None"}</td>
                          <td>
                            <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>
                              {lead.sourcePage || "Direct Widget"}
                            </span>
                          </td>
                          <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                            {formatDate(lead.createdAt)}
                          </td>
                          <td>
                            <button
                              className="kb-save-btn"
                              style={{ 
                                padding: "4px 10px", 
                                fontSize: "0.75rem", 
                                background: "rgba(239, 68, 68, 0.15)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                color: "#fca5a5"
                              }}
                              onClick={() => handleDeleteLead(lead.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>
                          No leads matched your search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CONVERSATION LOGS / TRANSCRIPTS */}
          {activeTab === "conversations" && (
            <div className="tab-pane-content" style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ marginBottom: 20, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ position: "relative", width: "100%", maxWidth: 320 }}>
                  <Search
                    size={16}
                    style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                  />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by session, content, intent..."
                    value={conversationsSearch}
                    onChange={(e) => setConversationsSearch(e.target.value)}
                    style={{ paddingLeft: 36, maxWidth: "none" }}
                  />
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Showing {conversations.length} total sessions
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: selectedConversation ? "1.2fr 1fr" : "1fr", gap: 24, transition: "grid-template-columns 0.3s" }}>
                
                {/* List Table */}
                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Session ID</th>
                        <th>Started At</th>
                        <th>Language</th>
                        <th>Intents Detected</th>
                        <th>Leads / Complaints</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conversations.length > 0 ? (
                        conversations.map((conv) => (
                          <tr
                            key={conv.id}
                            style={{
                              cursor: "pointer",
                              background: selectedConversation?.sessionId === conv.sessionId ? "rgba(212,175,55,0.06)" : "transparent"
                            }}
                            onClick={() => setSelectedConversation(conv)}
                          >
                            <td style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "var(--gold-300)" }}>
                              {conv.sessionId.substring(0, 15)}...
                            </td>
                            <td style={{ fontSize: "0.82rem" }}>{formatDate(conv.startedAt)}</td>
                            <td style={{ textTransform: "uppercase", fontSize: "0.8rem", fontWeight: "bold" }}>
                              {conv.language}
                            </td>
                            <td>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {renderIntentTags(conv.intentLog)}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: 6 }}>
                                {conv.leadCaptured && (
                                  <span style={{ fontSize: "0.7rem", background: "rgba(34,197,94,0.15)", color: "#86efac", padding: "1px 6px", borderRadius: 4, fontWeight: "bold", border: "1px solid rgba(34,197,94,0.3)" }}>
                                    LEAD
                                  </span>
                                )}
                                {conv.complaintFlagged && (
                                  <span style={{ fontSize: "0.7rem", background: "rgba(239,68,68,0.15)", color: "#fca5a5", padding: "1px 6px", borderRadius: 4, fontWeight: "bold", border: "1px solid rgba(239,68,68,0.3)" }}>
                                    COMPLAINT
                                  </span>
                                )}
                                {!conv.leadCaptured && !conv.complaintFlagged && (
                                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>-</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button
                                  className="kb-save-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedConversation(conv);
                                  }}
                                  style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                                >
                                  View Chat
                                </button>
                                <button
                                  className="kb-save-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTranscript(conv.sessionId);
                                  }}
                                  style={{ 
                                    padding: "4px 8px", 
                                    fontSize: "0.75rem", 
                                    background: "rgba(239, 68, 68, 0.15)",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    color: "#fca5a5"
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>
                            No conversations match the search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Detailed Transcript Side Drawer */}
                {selectedConversation && (
                  <div className="transcript-drawer" style={{ margin: 0, height: "fit-content", animation: "fadeIn 0.25s ease" }}>
                    <div className="drawer-header">
                      <div>
                        <h4 style={{ color: "#ffffff", fontWeight: 700, fontSize: "1rem" }}>
                          Transcript Detail
                        </h4>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                          Session: {selectedConversation.sessionId}
                        </span>
                      </div>
                      <button
                        className="close-btn"
                        onClick={() => setSelectedConversation(null)}
                        style={{ color: "var(--text-muted)" }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                      <span className="kb-category-tag" style={{ background: "rgba(255,255,255,0.06)", color: "#ffffff" }}>
                        Lang: {selectedConversation.language.toUpperCase()}
                      </span>
                      {selectedConversation.leadCaptured && (
                        <span className="kb-category-tag" style={{ background: "rgba(34,197,94,0.15)", color: "#86efac" }}>
                          ✓ Lead Saved
                        </span>
                      )}
                      {selectedConversation.complaintFlagged && (
                        <span className="kb-category-tag" style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}>
                          ⚠ Complaint Escalated
                        </span>
                      )}
                    </div>

                    <div className="transcript-message-list" style={{ minHeight: 300, maxHeight: 450 }}>
                      {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                        selectedConversation.messages.map((msg, i) => (
                          <div
                            key={msg.id || i}
                            className={`msg-row ${msg.role === "user" ? "user" : "assistant"}`}
                          >
                            <div style={{ fontSize: "0.88rem", lineHeight: 1.4, wordBreak: "break-word" }}>
                              {msg.content}
                            </div>
                            <div className="msg-meta">
                              <span>{msg.role === "user" ? "User" : "Elara"}</span>
                              <span>{formatDate(msg.timestamp)}</span>
                            </div>
                            {msg.intentDetected && (
                              <div style={{ fontSize: "0.62rem", background: "rgba(0,0,0,0.2)", padding: "1px 4px", borderRadius: 2, alignSelf: "flex-start", marginTop: 4, color: "var(--gold-300)", fontWeight: "bold" }}>
                                Intent: {msg.intentDetected}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                          No messages logged in this session.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: KNOWLEDGE BASE CRUD */}
          {activeTab === "kb" && (
            <div className="tab-pane-content" style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ position: "relative", width: "100%", maxWidth: 320 }}>
                  <Search
                    size={16}
                    style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                  />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Filter by policy name, category or content..."
                    value={kbSearch}
                    onChange={(e) => setKbSearch(e.target.value)}
                    style={{ paddingLeft: 36, maxWidth: "none" }}
                  />
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Showing {kbItems.filter(item => 
                    item.key.toLowerCase().includes(kbSearch.toLowerCase()) || 
                    item.category.toLowerCase().includes(kbSearch.toLowerCase()) || 
                    item.value.toLowerCase().includes(kbSearch.toLowerCase())
                  ).length} records
                </div>
              </div>

              <div className="kb-grid">
                {kbItems.length > 0 ? (
                  kbItems
                    .filter((item) =>
                      item.key.toLowerCase().includes(kbSearch.toLowerCase()) ||
                      item.category.toLowerCase().includes(kbSearch.toLowerCase()) ||
                      item.value.toLowerCase().includes(kbSearch.toLowerCase())
                    )
                    .map((item) => (
                      <div className="kb-card" key={item.id}>
                        <div className="kb-card-header">
                          <span className="kb-key-name">
                            {item.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                          <span className="kb-category-tag">{item.category}</span>
                        </div>
                        
                        <textarea
                          className="kb-editor-textarea"
                          value={kbEditValues[item.id] !== undefined ? kbEditValues[item.id] : item.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            setKbEditValues((prev) => ({ ...prev, [item.id]: val }));
                          }}
                        />

                        <div className="kb-save-row">
                          <span className="kb-timestamp">
                            Last synced: {formatDate(item.updatedAt)} {item.updatedBy ? `by ${item.updatedBy}` : ""}
                          </span>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {saveSuccessId === item.id && (
                              <span style={{ fontSize: "0.8rem", color: "#86efac", display: "flex", alignItems: "center", gap: 4 }}>
                                <Check size={14} />
                                <span>Saved to DB!</span>
                              </span>
                            )}
                            <button
                              className={`kb-save-btn ${savingKbId === item.id ? "saving" : ""}`}
                              onClick={() => handleKbSave(item.id)}
                              disabled={savingKbId === item.id || kbEditValues[item.id] === undefined || kbEditValues[item.id] === item.value}
                            >
                              {savingKbId === item.id ? "Syncing..." : "Save Policy"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                    No policy documents found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: LIVE SANDBOX PREVIEW */}
          {activeTab === "preview" && (
            <div className="tab-pane-content" style={{ animation: "fadeIn 0.3s ease" }}>
              <div className="preview-split">
                
                {/* Policy Quick Editor (Left Side) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div className="dashboard-panel" style={{ margin: 0, height: "100%" }}>
                    <h3 className="panel-title">Active Sandbox Policy Adjuster</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.4 }}>
                      Modify key hotel details (e.g., set renovation details, pool status, or rate reminders) below, click **Save**, and Elara will immediately use the updated parameters in the live sandbox chat panel.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 20, overflowY: "auto", maxHeight: "calc(100vh - 280px)", paddingRight: 10 }}>
                      {kbItems
                        .filter((item) => ["renovation_notices", "pool_policy", "breakfast_details", "rates_pricing"].includes(item.key) || item.category === "renovations")
                        .map((item) => (
                          <div
                            key={item.id}
                            style={{
                              background: "rgba(255,255,255,0.02)",
                              border: "1px solid var(--navy-800)",
                              borderRadius: "var(--radius-md)",
                              padding: 16
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                              <span style={{ fontWeight: "bold", fontSize: "0.88rem", color: "var(--gold-300)", textTransform: "capitalize" }}>
                                {item.key.replace(/_/g, " ")}
                              </span>
                              <span className="kb-category-tag" style={{ fontSize: "0.68rem" }}>{item.category}</span>
                            </div>
                            
                            <textarea
                              className="kb-editor-textarea"
                              style={{ minHeight: 90, fontSize: "0.85rem", background: "rgba(0,0,0,0.3)", marginBottom: 8 }}
                              value={kbEditValues[item.id] !== undefined ? kbEditValues[item.id] : item.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                setKbEditValues((prev) => ({ ...prev, [item.id]: val }));
                              }}
                            />
                            
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                Last edit: {formatDate(item.updatedAt)}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {saveSuccessId === item.id && (
                                  <span style={{ fontSize: "0.75rem", color: "#86efac" }}>✓ Saved</span>
                                )}
                                <button
                                  className="kb-save-btn"
                                  style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                                  onClick={() => handleKbSave(item.id)}
                                  disabled={savingKbId === item.id || kbEditValues[item.id] === undefined || kbEditValues[item.id] === item.value}
                                >
                                  {savingKbId === item.id ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Sandbox Widget (Right Side) */}
                <div className="preview-frame-container" style={{ minHeight: 650 }}>
                  <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: "bold", color: "#ffffff", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                      <span>Elara Live Preview Box</span>
                    </span>
                    <button
                      className="kb-save-btn"
                      style={{ padding: "3px 8px", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 4 }}
                      onClick={() => setPreviewKey(prev => prev + 1)}
                      title="Reload Iframe"
                    >
                      <RefreshCw size={10} />
                      <span>Reload Widget</span>
                    </button>
                  </div>
                  
                  {/* Smartphone silhouette mockup frame */}
                  <div className="preview-device-frame">
                    <div className="preview-device-notch" />
                    <iframe
                      ref={iframeRef}
                      src={`/chat-iframe?preview=true&k=${previewKey}`}
                      style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                      title="Elara Widget Preview"
                    />
                  </div>
                  
                  <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 12, textAlign: "center", lineHeight: 1.4 }}>
                    Note: To test the floating action, open the widget by clicking its trigger bubble, or reload the iframe to see the proactive greeting (fires after 8s of inactivity on first load).
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB 6: COMPLAINTS DESK */}
          {activeTab === "complaints" && (
            <div className="tab-pane-content" style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                  Track, monitor, and resolve guest support tickets and complaints in real-time.
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Showing {complaints.length} operations desk tickets
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: activeComplaintSessionId ? "1.2fr 1fr" : "1fr", gap: 24, transition: "grid-template-columns 0.3s" }}>
                
                {/* List Table */}
                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Guest Name</th>
                        <th>Room #</th>
                        <th>Contact Info</th>
                        <th>Issue Summary</th>
                        <th>Detailed Description</th>
                        <th>Received Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.length > 0 ? (
                        complaints.map((c) => (
                          <tr key={c.id} style={{
                            background: activeComplaintSessionId === c.sessionId ? "rgba(212,175,55,0.06)" : "transparent"
                          }}>
                            <td style={{ fontWeight: 700, color: "#ffffff" }}>{c.guestName}</td>
                            <td>
                              <span style={{ fontSize: "0.82rem", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>
                                {c.roomNumber || "N/A"}
                              </span>
                            </td>
                            <td>{c.contactInfo || "Not Provided"}</td>
                            <td style={{ maxWidth: 200, whiteSpace: "normal", wordBreak: "break-word", fontSize: "0.88rem", fontWeight: 600, color: "var(--gold-300)" }}>
                              {c.summary || "N/A"}
                            </td>
                            <td style={{ maxWidth: 300, whiteSpace: "normal", wordBreak: "break-word", fontSize: "0.85rem", color: "#d1d5db", lineHeight: 1.4 }}>
                              {c.description || "N/A"}
                            </td>
                            <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                              {formatDate(c.createdAt)}
                            </td>
                            <td>
                              <span className={`tag-intent ${c.status === "resolved" ? "booking" : "complaint"}`}>
                                {c.status.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button
                                  className="kb-save-btn"
                                  style={{ 
                                    padding: "4px 10px", 
                                    fontSize: "0.75rem", 
                                    background: c.status === "resolved" ? "rgba(255,255,255,0.05)" : "var(--gold-500)", 
                                    border: c.status === "resolved" ? "1px solid var(--navy-800)" : "none",
                                    color: c.status === "resolved" ? "#94a3b8" : "#000000"
                                  }}
                                  onClick={() => handleResolveComplaint(c.id, c.status)}
                                >
                                  {c.status === "resolved" ? "Mark Pending" : "Mark Resolved"}
                                </button>
                                
                                {c.sessionId && (
                                  <button
                                    className="kb-save-btn"
                                    style={{
                                      padding: "4px 10px",
                                      fontSize: "0.75rem",
                                      background: "rgba(255,255,255,0.05)",
                                      border: "1px solid var(--navy-800)",
                                      color: "#ffffff"
                                    }}
                                    onClick={() => handleViewComplaintTranscript(c.sessionId)}
                                  >
                                    Chat Log
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>
                            No complaints logged.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Complaint Chat Transcript Side Drawer */}
                {activeComplaintSessionId && (
                  <div className="transcript-drawer" style={{ margin: 0, height: "fit-content", animation: "fadeIn 0.25s ease" }}>
                    <div className="drawer-header">
                      <div>
                        <h4 style={{ color: "#ffffff", fontWeight: 700, fontSize: "1rem" }}>
                          Complaint Chat Transcript
                        </h4>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                          Session: {activeComplaintSessionId}
                        </span>
                      </div>
                      <button
                        className="close-btn"
                        onClick={() => setActiveComplaintSessionId(null)}
                        style={{ color: "var(--text-muted)" }}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="transcript-message-list" style={{ minHeight: 300, maxHeight: 450, marginTop: 16 }}>
                      {isLoadingComplaintMessages ? (
                        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                          <RefreshCw className="spin" style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} size={24} />
                          <p style={{ marginTop: 8 }}>Loading transcript...</p>
                        </div>
                      ) : complaintMessages.length > 0 ? (
                        complaintMessages.map((msg, i) => (
                          <div
                            key={msg.id || i}
                            className={`msg-row ${msg.role === "user" ? "user" : "assistant"}`}
                          >
                            <div style={{ fontSize: "0.88rem", lineHeight: 1.4, wordBreak: "break-word" }}>
                              {msg.content}
                            </div>
                            <div className="msg-meta">
                              <span>{msg.role === "user" ? "User" : "Elara"}</span>
                              <span>{formatDate(msg.timestamp)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                          No messages logged in this session.
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </main>
      </div>

      {notification && (
        <div className="admin-confirm-overlay">
          <div className={`admin-confirm-modal ${notification.statusType || ""}`}>
            <div className="admin-confirm-header">
              {notification.type === "confirm" ? (
                <AlertTriangle className="admin-confirm-icon warning" size={24} />
              ) : notification.statusType === "success" ? (
                <Check className="admin-confirm-icon success" size={24} />
              ) : (
                <AlertTriangle className="admin-confirm-icon error" size={24} />
              )}
              <h3 className="admin-confirm-title">{notification.title}</h3>
            </div>
            <p className="admin-confirm-message">{notification.message}</p>
            <div className="admin-confirm-actions">
              {notification.type === "confirm" ? (
                <>
                  <button className="admin-btn-cancel" onClick={notification.onCancel}>
                    Cancel
                  </button>
                  <button className="admin-btn-confirm" onClick={notification.onConfirm}>
                    Continue
                  </button>
                </>
              ) : (
                <button className="admin-btn-confirm" onClick={notification.onConfirm}>
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
