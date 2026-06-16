"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Phone, Send, RotateCcw } from "lucide-react";
import Image from "next/image";
import Img1 from "../../img/Img1.png";
import Img2 from "../../img/Img2.png";
import Img3 from "../../img/img3.png";
import "./chat-iframe.css";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type LeadStep = "inactive" | "name" | "email" | "phone" | "date" | "room" | "confirming";

export default function ChatIframe() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom reset confirmation modal state
  
  // Custom reset confirmation modal state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Conversational Lead Capture State
  const [leadStep, setLeadStep] = useState<LeadStep>("inactive");
  const [leadData, setLeadData] = useState({
    firstName: "",
    email: "",
    phone: "",
    checkinDate: "",
    roomPreference: "",
  });

  // Conversational Complaint Escalation State
  type ComplaintStep = "inactive" | "name" | "room" | "contact" | "details" | "confirming";
  const [complaintStep, setComplaintStep] = useState<ComplaintStep>("inactive");
  const [complaintData, setComplaintData] = useState({
    guestName: "",
    roomNumber: "",
    contactInfo: "",
    summary: "",
    description: "",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [sessionId, setSessionId] = useState("");
  const isSendingRef = useRef(false);

  // 1. Initialize Session and Load Cache
  useEffect(() => {
    // Check preview parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") === "true") {
      setIsOpen(true);
    }

    // Generate unique session ID if not exists
    let activeSessionId = sessionStorage.getItem("elara_session_id");
    if (!activeSessionId) {
      activeSessionId = "session_" + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("elara_session_id", activeSessionId);
    }
    setSessionId(activeSessionId);

    // Load messages from session storage
    const cachedMessages = sessionStorage.getItem(`elara_messages_${activeSessionId}`);
    if (cachedMessages) {
      setMessages(JSON.parse(cachedMessages));
    } else {
      // Default initial welcome message
      const welcomeMessage: Message = {
        role: "assistant",
        content: "Hi there! 👋 Planning a stay at Comfort Inn Shelby? I'm Elara, your virtual concierge. I can answer questions and help you get the best rate — day or night.",
      };
      setMessages([welcomeMessage]);
      sessionStorage.setItem(`elara_messages_${activeSessionId}`, JSON.stringify([welcomeMessage]));
    }

    // Restore lead step state if browser was refreshed
    const cachedLeadStep = sessionStorage.getItem(`elara_lead_step_${activeSessionId}`);
    if (cachedLeadStep) {
      setLeadStep(cachedLeadStep as LeadStep);
    }
    const cachedLeadData = sessionStorage.getItem(`elara_lead_data_${activeSessionId}`);
    if (cachedLeadData) {
      setLeadData(JSON.parse(cachedLeadData));
    }

    // Restore complaint step state if browser was refreshed
    const cachedComplaintStep = sessionStorage.getItem(`elara_complaint_step_${activeSessionId}`);
    if (cachedComplaintStep) {
      setComplaintStep(cachedComplaintStep as ComplaintStep);
    }
    const cachedComplaintData = sessionStorage.getItem(`elara_complaint_data_${activeSessionId}`);
    if (cachedComplaintData) {
      setComplaintData(JSON.parse(cachedComplaintData));
    }
  }, []);

  // 3. Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // 4. Save messages to session helper
  const saveMessages = (updatedMessages: Message[]) => {
    setMessages(updatedMessages);
    if (sessionId) {
      sessionStorage.setItem(`elara_messages_${sessionId}`, JSON.stringify(updatedMessages));
    }
  };

  // Safe helper to append messages without race conditions on state updates
  const appendMessages = (newMsgs: Message[]) => {
    setMessages((prev) => {
      const updated = [...prev, ...newMsgs];
      const activeSessionId = sessionStorage.getItem("elara_session_id") || sessionId;
      if (activeSessionId) {
        sessionStorage.setItem(`elara_messages_${activeSessionId}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // 5. Post toggle event to parent page
  const toggleChat = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      const activeSessionId = sessionStorage.getItem("elara_session_id") || sessionId;
      if (activeSessionId) {
        sessionStorage.setItem(`elara_greeted_${activeSessionId}`, "true");
      }
    }
    window.parent.postMessage({ type: "ELARA_TOGGLE", isOpen: nextState }, "*");
  };

  // Listen for parent events (like page resize or open trigger)
  useEffect(() => {
    const handleParentMessage = (event: MessageEvent) => {
      if (event.data) {
        if (event.data.type === "ELARA_PARENT_RESIZE") {
          // Parent tells us the viewport was resized
        } else if (event.data.type === "ELARA_OPEN") {
          setIsOpen(true);
          window.parent.postMessage({ type: "ELARA_TOGGLE", isOpen: true }, "*");
        }
      }
    };
    window.addEventListener("message", handleParentMessage);
    return () => window.removeEventListener("message", handleParentMessage);
  }, []);

  // 6. Conversational state progress helper
  const handleLeadCaptureFlow = async (text: string) => {
    if (!text.trim() || isLoading || isSendingRef.current) return;

    isSendingRef.current = true;
    const userMsg: Message = { role: "user", content: text };
    const currentHistory = [...messages];
    appendMessages([userMsg]);

    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId,
          history: currentHistory.slice(-10),
          leadStep,
          leadData
        })
      });

      if (!res.ok) {
        throw new Error("Chat API failed during lead capture");
      }

      const data = await res.json();
      
      // Update data
      const updatedData = { ...leadData };
      if (data.leadValid && data.extractedValue) {
        if (leadStep === "name") {
          updatedData.firstName = data.extractedValue;
        } else if (leadStep === "email") {
          updatedData.email = data.extractedValue;
        } else if (leadStep === "phone") {
          updatedData.phone = data.extractedValue;
        } else if (leadStep === "date") {
          updatedData.checkinDate = data.extractedValue;
        } else if (leadStep === "room") {
          updatedData.roomPreference = data.extractedValue;
        }
        setLeadData(updatedData);
      }

      const assistantMsg: Message = {
        role: "assistant",
        content: data.response
      };
      
      appendMessages([assistantMsg]);

      const nextStep = data.nextStep as LeadStep;

      if (nextStep === "confirming") {
        setLeadStep("confirming");
        sessionStorage.setItem(`elara_lead_step_${sessionId}`, "confirming");
        
        // Trigger Submit to /api/lead
        try {
          const leadRes = await fetch("/api/lead", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              firstName: updatedData.firstName,
              email: updatedData.email,
              phone: updatedData.phone,
              checkinDate: updatedData.checkinDate,
              roomPreference: updatedData.roomPreference,
              sourcePage: "Elara Widget"
            })
          });

          if (leadRes.ok) {
            const finalConfirmation = `All set, ${updatedData.firstName}! I've logged your preferences. You will receive an email with your direct booking link and rate details within 15 minutes.\n\nIn the meantime, here is your direct booking link: **[Book Comfort Inn Shelby Direct](https://www.comfortshelby.com/click-reservation)**`;
            appendMessages([{ role: "assistant", content: finalConfirmation }]);
          } else {
            throw new Error("Failed to save lead");
          }
        } catch (e) {
          appendMessages([{ role: "assistant", content: `Thank you, ${updatedData.firstName}! I've recorded your email (${updatedData.email}) and preferences. Our reservation desk will reach out to you directly, or you can book instantly here: **[Direct Booking Link](https://www.comfortshelby.com/click-reservation)**.` }]);
        } finally {
          setIsLoading(false);
          isSendingRef.current = false;
          setLeadStep("inactive");
          sessionStorage.removeItem(`elara_lead_step_${sessionId}`);
          sessionStorage.removeItem(`elara_lead_data_${sessionId}`);
        }
      } else {
        setLeadStep(nextStep);
        sessionStorage.setItem(`elara_lead_step_${sessionId}`, nextStep);
        sessionStorage.setItem(`elara_lead_data_${sessionId}`, JSON.stringify(updatedData));
        setIsLoading(false);
        isSendingRef.current = false;
      }
    } catch (e) {
      console.error(e);
      appendMessages([{ role: "assistant", content: "I'm having a brief moment — please call us at 704-482-5666 for immediate help." }]);
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  // Conversational complaint escalation helper
  const handleComplaintFlow = async (text: string) => {
    if (!text.trim() || isLoading || isSendingRef.current) return;

    isSendingRef.current = true;
    const userMsg: Message = { role: "user", content: text };
    const currentHistory = [...messages];
    appendMessages([userMsg]);

    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId,
          history: currentHistory.slice(-10),
          complaintStep,
          complaintData
        })
      });

      if (!res.ok) {
        throw new Error("Chat API failed during complaint capture");
      }

      const data = await res.json();

      const updatedData = { ...complaintData };
      if (data.complaintValid && data.extractedValue) {
        if (complaintStep === "name") {
          updatedData.guestName = data.extractedValue;
        } else if (complaintStep === "room") {
          updatedData.roomNumber = data.extractedValue;
        } else if (complaintStep === "contact") {
          updatedData.contactInfo = data.extractedValue;
        } else if (complaintStep === "details") {
          updatedData.description = data.extractedValue;
        }
        setComplaintData(updatedData);
      }

      const assistantMsg: Message = {
        role: "assistant",
        content: data.response
      };

      appendMessages([assistantMsg]);

      const nextStep = data.nextComplaintStep as ComplaintStep;

      if (nextStep === "confirming") {
        setComplaintStep("confirming");
        sessionStorage.setItem(`elara_complaint_step_${sessionId}`, "confirming");

        // Submit complete complaint to /api/complaint
        try {
          const complaintRes = await fetch("/api/complaint", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              guestName: updatedData.guestName,
              roomNumber: updatedData.roomNumber,
              contactInfo: updatedData.contactInfo,
              description: updatedData.description,
              summary: updatedData.summary
            })
          });

          if (complaintRes.ok) {
            const finalConfirmation = `Thank you, ${updatedData.guestName}! I have successfully logged your complaint (Room ${updatedData.roomNumber || "N/A"}). Our front desk and hotel operations manager have been alerted. We will look into this immediately.`;
            appendMessages([{ role: "assistant", content: finalConfirmation }]);
          } else {
            throw new Error("Failed to save complaint");
          }
        } catch (e) {
          appendMessages([{ role: "assistant", content: `Thank you, ${updatedData.guestName}! I've recorded your complaint details. Our operations team will follow up directly.` }]);
        } finally {
          setIsLoading(false);
          isSendingRef.current = false;
          setComplaintStep("inactive");
          sessionStorage.removeItem(`elara_complaint_step_${sessionId}`);
          sessionStorage.removeItem(`elara_complaint_data_${sessionId}`);
        }
      } else {
        setComplaintStep(nextStep);
        sessionStorage.setItem(`elara_complaint_step_${sessionId}`, nextStep);
        sessionStorage.setItem(`elara_complaint_data_${sessionId}`, JSON.stringify(updatedData));
        setIsLoading(false);
        isSendingRef.current = false;
      }

    } catch (e) {
      console.error(e);
      appendMessages([{ role: "assistant", content: "I'm having a brief moment — please call us at 704-482-5666 for immediate help." }]);
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  // 7. Handle sending text messages to API
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading || isSendingRef.current) return;

    isSendingRef.current = true;
    setInputValue("");

    // If in the conversational lead capture flow
    if (leadStep !== "inactive" && leadStep !== "confirming") {
      isSendingRef.current = false;
      handleLeadCaptureFlow(text);
      return;
    }

    // If in the conversational complaint flow
    if (complaintStep !== "inactive" && complaintStep !== "confirming") {
      isSendingRef.current = false;
      handleComplaintFlow(text);
      return;
    }

    const userMsg: Message = { role: "user", content: text };
    const currentHistory = [...messages];
    appendMessages([userMsg]);

    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId,
          history: currentHistory.slice(-10) // Send last 10 messages for context
        })
      });

      if (!res.ok) {
        throw new Error("API failed");
      }

      const data = await res.json();
      
      const assistantMsg: Message = {
        role: "assistant",
        content: data.response
      };
      
      appendMessages([assistantMsg]);

      // If booking intent was detected and we haven't already captured a lead, prompt them
      if (data.intent === "BOOKING_INTENT" && leadStep === "inactive") {
        const inviteMessage: Message = {
          role: "assistant",
          content: "Would you like me to send you the best rate for your dates? I just need a couple of details — it takes less than a minute. What is your first name?"
        };
        // Trigger lead capture invitation after a short delay
        setTimeout(() => {
          setLeadStep("name");
          const activeSessionId = sessionStorage.getItem("elara_session_id") || sessionId;
          if (activeSessionId) {
            sessionStorage.setItem(`elara_lead_step_${activeSessionId}`, "name");
          }
          appendMessages([inviteMessage]);
        }, 1000);
      }

      // If complaint intent was detected and we are not in the complaint flow, initialize it
      if (data.intent === "COMPLAINT_ESCALATED" && data.nextComplaintStep === "name" && complaintStep === "inactive") {
        const initialComplaintData = {
          guestName: "",
          roomNumber: "",
          contactInfo: "",
          summary: text, // Use the user's initial complaint message as the summary
          description: ""
        };
        setComplaintData(initialComplaintData);
        setComplaintStep("name");
        const activeSessionId = sessionStorage.getItem("elara_session_id") || sessionId;
        if (activeSessionId) {
          sessionStorage.setItem(`elara_complaint_step_${activeSessionId}`, "name");
          sessionStorage.setItem(`elara_complaint_data_${activeSessionId}`, JSON.stringify(initialComplaintData));
        }
      }

    } catch (e) {
      console.error(e);
      appendMessages([
        {
          role: "assistant",
          content: "I'm having a brief moment — please call us at 704-482-5666 for immediate help."
        }
      ]);
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  // 8. Chip interaction
  const handleChipClick = (label: string, query: string) => {
    if (label === "💰 Book Now") {
      if (leadStep === "inactive") {
        setLeadStep("name");
        const activeSessionId = sessionStorage.getItem("elara_session_id") || sessionId;
        if (activeSessionId) {
          sessionStorage.setItem(`elara_lead_step_${activeSessionId}`, "name");
        }
        const inviteMessage: Message = {
          role: "assistant",
          content: "I would be happy to help check the best rates for your stay! Let's get a few details. What is your first name?",
        };
        appendMessages([inviteMessage]);
      }
    } else if (label === "📞 Call Us") {
      window.open("tel:704-482-5666");
    } else {
      handleSendMessage(query);
    }
  };

  // 9. Input keystrokes
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  // 10. Simple markdown link parser
  const renderMessageContent = (content: string) => {
    // Escape standard tags, then swap bold **text** and markdown links
    let formatted = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold tags
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Markdown Links: [text](url) -> <a target="_blank" href="url">text</a>
    formatted = formatted.replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link" style="color: #c5a880; font-weight: 600; text-decoration: underline;">$1</a>'
    );

    // Newlines
    formatted = formatted.replace(/\n/g, "<br />");

    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  // Reset chat handlers
  const resetChat = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setShowResetConfirm(false);
    sessionStorage.removeItem(`elara_messages_${sessionId}`);
    sessionStorage.removeItem(`elara_lead_step_${sessionId}`);
    sessionStorage.removeItem(`elara_lead_data_${sessionId}`);
    sessionStorage.removeItem(`elara_complaint_step_${sessionId}`);
    sessionStorage.removeItem(`elara_complaint_data_${sessionId}`);
    setLeadStep("inactive");
    setLeadData({
      firstName: "",
      email: "",
      phone: "",
      checkinDate: "",
      roomPreference: "",
    });
    setComplaintStep("inactive");
    setComplaintData({
      guestName: "",
      roomNumber: "",
      contactInfo: "",
      summary: "",
      description: "",
    });
    const welcome: Message = {
      role: "assistant",
      content: "Hi there! 👋 Planning a stay at Comfort Inn Shelby? I'm Elara, your virtual concierge. I can answer questions and help you get the best rate — day or night.",
    };
    setMessages([welcome]);
    if (sessionId) {
      sessionStorage.setItem(`elara_messages_${sessionId}`, JSON.stringify([welcome]));
    }
  };

  // Render launcher only if closed
  if (!isOpen) {
    return (
      <div className="widget-wrapper">
        <div className="launcher-container">
          <button className="character-launcher" onClick={toggleChat} aria-label="Open chat concierge">
            <span className="character-speech-bubble">Hello! How may I assist you today?</span>
            <Image src={Img1} alt="Concierge Character" className="char-frame frame-1" />
            <Image src={Img2} alt="Concierge Character" className="char-frame frame-2" />
            <Image src={Img3} alt="Concierge Character" className="char-frame frame-3" />
          </button>
        </div>
      </div>
    );
  }

  // Render full chat window
  return (
    <div className="widget-wrapper">
      <div className="chat-panel">
        
        {/* Header */}
        <header className="chat-header">
          <div className="header-info">
            <div className="header-title-row">
              <h1 className="header-title">Comfort Inn Shelby</h1>
              <span className="header-pulse-dot" />
            </div>
            <span className="header-subtitle">Concierge Desk • Online</span>
          </div>
          <div className="header-actions">
            <a href="tel:704-482-5666" className="call-btn" title="Call Front Desk 704-482-5666">
              <Phone size={13} />
              <span>Call</span>
            </a>
            <button className="close-btn" onClick={toggleChat} aria-label="Close chat concierge">
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Lead Capture Banner (active) */}
        {leadStep !== "inactive" && leadStep !== "confirming" && (
          <div className="lead-form-banner">
            <span>📝 Rate Inquiry Form ({leadStep.toUpperCase()})</span>
            <span className="lead-form-reset" onClick={() => {
              setLeadStep("inactive");
              sessionStorage.removeItem(`elara_lead_step_${sessionId}`);
              saveMessages([...messages, { role: "assistant", content: "Cancelled form. How else can I assist you today?" }]);
            }}>
              Cancel
            </span>
          </div>
        )}

        {/* Complaint Capture Banner (active) */}
        {complaintStep !== "inactive" && complaintStep !== "confirming" && (
          <div className="lead-form-banner" style={{ background: "rgba(239,68,68,0.15)", borderBottom: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
            <span>⚠️ Logging Support Ticket ({complaintStep.toUpperCase()})</span>
            <span className="lead-form-reset" style={{ color: "#fca5a5" }} onClick={() => {
              setComplaintStep("inactive");
              sessionStorage.removeItem(`elara_complaint_step_${sessionId}`);
              saveMessages([...messages, { role: "assistant", content: "Support ticket cancelled. How else can I assist you?" }]);
            }}>
              Cancel
            </span>
          </div>
        )}

        {/* Message Thread */}
        <main className="chat-messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`message-bubble ${
                msg.role === "user" ? "message-user" : "message-assistant"
              }`}
            >
              {renderMessageContent(msg.content)}
            </div>
          ))}

          {/* Typing Bouncing Dots */}
          {isLoading && (
            <div className="typing-bubble">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Quick Reply Scroll Bar */}
        {leadStep !== "confirming" && complaintStep !== "confirming" && (
          <div className="quick-replies-container">
            {leadStep === "room" ? (
              // Specialized Room choice chips
              <>
                <button className="quick-reply-chip" onClick={() => handleLeadCaptureFlow("1 King Bed, Nonsmoking")}>🛏️ King Bed</button>
                <button className="quick-reply-chip" onClick={() => handleLeadCaptureFlow("2 Queen Beds, Nonsmoking")}>🛏️ 2 Queens</button>
                <button className="quick-reply-chip" onClick={() => handleLeadCaptureFlow("1 King Bed, Accessible")}>♿ Accessible King</button>
              </>
            ) : complaintStep === "room" ? (
              // Specialized Complaint Room choice chips
              <>
                <button className="quick-reply-chip" onClick={() => handleComplaintFlow("None / N/A")}>❌ No Room / N/A</button>
              </>
            ) : complaintStep !== "inactive" ? (
              // Hide general chips during other complaint steps
              null
            ) : (
              // Standard general chips
              <>
                <button className="quick-reply-chip" onClick={() => handleChipClick("💰 Book Now", "")}>💰 Book Now</button>
                <button className="quick-reply-chip" onClick={() => handleChipClick("🛏️ View Rooms", "What rooms do you have?")}>🛏️ Rooms</button>
                <button className="quick-reply-chip" onClick={() => handleChipClick("🍳 Breakfast Info", "What is served for breakfast?")}>🍳 Breakfast</button>
                <button className="quick-reply-chip" onClick={() => handleChipClick("📍 Location & Parking", "What is your address and is parking free?")}>📍 Location</button>
                <button className="quick-reply-chip" onClick={() => handleChipClick("📞 Call Us", "")}>📞 Call Us</button>
                <button className="quick-reply-chip" onClick={resetChat} style={{ color: "#94a3b8" }} title="Reset Conversation">
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Message Input Footer */}
        <footer className="chat-footer">
          <textarea
            ref={inputRef}
            className="chat-input"
            rows={1}
            value={inputValue}
            placeholder={
              leadStep === "email" ? "Enter your email address..." :
              leadStep === "phone" ? "Enter your phone number..." :
              leadStep === "name" ? "Enter your first name..." :
              leadStep === "date" ? "Enter check-in date..." :
              complaintStep === "name" ? "Enter your name..." :
              complaintStep === "room" ? "Enter your room number or N/A..." :
              complaintStep === "contact" ? "Enter phone number or email..." :
              complaintStep === "details" ? "Describe the issue in more detail..." :
              "Type a message..."
            }
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || leadStep === "confirming" || complaintStep === "confirming"}
          />
          <button
            className="send-button"
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isLoading || leadStep === "confirming" || complaintStep === "confirming"}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </footer>

        {showResetConfirm && (
          <div className="confirm-modal-overlay">
            <div className="confirm-modal">
              <h2 className="confirm-modal-title">Reset Conversation?</h2>
              <p className="confirm-modal-message">This will clear your current chat history and form progress. This action cannot be undone.</p>
              <div className="confirm-modal-actions">
                <button className="confirm-btn-cancel" onClick={() => setShowResetConfirm(false)}>
                  Cancel
                </button>
                <button className="confirm-btn-confirm" onClick={confirmReset}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
