import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper to trigger the n8n webhook
async function triggerN8nWebhook(payload: any) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    console.warn("N8N_WEBHOOK_URL is not set.");
    return;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-elara-secret": process.env.JWT_SECRET || ""
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`n8n Webhook returned status ${res.status}`);
    }
  } catch (e) {
    console.error("Failed to send webhook to n8n:", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, guestName, roomNumber, contactInfo, description, summary } = body;

    if (!guestName || !roomNumber || !description || !summary) {
      return NextResponse.json({ error: "Missing required fields: guestName, roomNumber, description, summary" }, { status: 400 });
    }

    // 1. Save Complaint to DB
    const complaint = await prisma.complaint.create({
      data: {
        sessionId,
        guestName,
        roomNumber,
        contactInfo: contactInfo || null,
        description,
        summary: summary || "",
        createdAt: new Date(),
        status: "pending"
      }
    });

    // 2. Update Conversation state if sessionId exists
    if (sessionId) {
      const conversation = await prisma.conversation.findUnique({
        where: { sessionId }
      });

      if (conversation) {
        const currentIntents = JSON.parse(conversation.intentLog || "[]");
        if (!currentIntents.includes("COMPLAINT_ESCALATED")) {
          currentIntents.push("COMPLAINT_ESCALATED");
        }

        await prisma.conversation.update({
          where: { sessionId },
          data: {
            complaintFlagged: true,
            intentLog: JSON.stringify(currentIntents)
          }
        });
      }
    }

    // 3. Trigger n8n webhook with COMPLAINT_ESCALATED event
    await triggerN8nWebhook({
      event_type: "COMPLAINT_ESCALATED",
      session_id: sessionId || "none",
      timestamp: new Date().toISOString(),
      guest: {
        name: guestName,
        room: roomNumber,
        contact: contactInfo || "Not provided"
      },
      complaint_summary: summary,
      complaint_details: description
    });

    return NextResponse.json({ success: true, complaintId: complaint.id });

  } catch (error: any) {
    console.error("Error in POST /api/complaint:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
