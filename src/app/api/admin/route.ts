import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signJwt, verifyJwt } from "@/lib/jwt";

const SECRET = process.env.JWT_SECRET || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

// Helper to check token from cookies
function checkAuthentication(req: NextRequest): boolean {
  const token = req.cookies.get("elara_admin_token")?.value;
  if (!token) return false;
  const decoded = verifyJwt(token, SECRET);
  return !!decoded && decoded.email === ADMIN_EMAIL;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    // Public actions
    if (action === "check-auth") {
      const isAuth = checkAuthentication(req);
      return NextResponse.json({ authenticated: isAuth });
    }

    // Protected actions
    if (!checkAuthentication(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (action === "stats") {
      // 1. Retention Policy Auto-Delete
      try {
        const cutoffTranscripts = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        await prisma.conversation.deleteMany({
          where: { startedAt: { lt: cutoffTranscripts } }
        });

        const cutoffLeads = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
        await prisma.lead.deleteMany({
          where: { createdAt: { lt: cutoffLeads } }
        });
      } catch (err) {
        console.error("Automated retention cleanup failed:", err);
      }

      const totalConversations = await prisma.conversation.count();
      const leadsCaptured = await prisma.lead.count();
      const complaintsEscalated = await prisma.complaint.count();

      // Calculate most common intent from the conversation logs
      const conversations = await prisma.conversation.findMany({
        select: { intentLog: true }
      });

      const intentCounts: Record<string, number> = {};
      conversations.forEach((conv) => {
        try {
          const intents = JSON.parse(conv.intentLog || "[]");
          intents.forEach((intent: string) => {
            // Exclude operational markers
            if (intent !== "BOOKING_ABANDONED") {
              intentCounts[intent] = (intentCounts[intent] || 0) + 1;
            }
          });
        } catch {}
      });

      let topIntent = "None";
      let topCount = 0;
      Object.entries(intentCounts).forEach(([intent, count]) => {
        if (count > topCount) {
          topIntent = intent;
          topCount = count;
        }
      });

      // Prepare intent data for the admin chart
      const intentChartData = Object.entries(intentCounts).map(([name, value]) => ({
        name: name.replace("_", " "),
        value
      })).sort((a, b) => b.value - a.value);

      return NextResponse.json({
        totalConversations,
        leadsCaptured,
        complaintsEscalated,
        topIntent,
        intentChartData
      });
    }

    if (action === "leads") {
      const search = searchParams.get("search") || "";
      const sort = searchParams.get("sort") || "createdAt";
      const order = searchParams.get("order") || "desc";

      const leads = await prisma.lead.findMany({
        where: {
          OR: [
            { firstName: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } }
          ]
        },
        orderBy: {
          [sort]: order
        }
      });

      return NextResponse.json(leads);
    }

    if (action === "conversations") {
      const search = searchParams.get("search") || "";
      const conversations = await prisma.conversation.findMany({
        include: {
          messages: {
            orderBy: { timestamp: "asc" }
          }
        },
        orderBy: {
          startedAt: "desc"
        }
      });

      // filter client-side since intentLog is String
      const filtered = conversations.filter(conv => {
        if (!search) return true;
        // Search by session ID, language, intent log, or message content
        return (
          conv.sessionId.toLowerCase().includes(search.toLowerCase()) ||
          conv.language.toLowerCase().includes(search.toLowerCase()) ||
          conv.intentLog.toLowerCase().includes(search.toLowerCase()) ||
          conv.messages.some(m => m.content.toLowerCase().includes(search.toLowerCase()))
        );
      });

      return NextResponse.json(filtered);
    }

    if (action === "kb") {
      const kbItems = await prisma.kbItem.findMany({
        orderBy: { category: "asc" }
      });
      return NextResponse.json(kbItems);
    }

    if (action === "complaints") {
      const complaints = await prisma.complaint.findMany({
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json(complaints);
    }

    if (action === "conversation-messages") {
      const sessionId = searchParams.get("sessionId") || "";
      const messages = await prisma.message.findMany({
        where: { sessionId },
        orderBy: { timestamp: "asc" }
      });
      return NextResponse.json(messages);
    }

    if (action === "export-leads") {
      const leads = await prisma.lead.findMany({
        orderBy: { createdAt: "desc" }
      });

      // Generate CSV string
      const headers = "Name,Email,Phone,Check-in Date,Room Preference,Source,Captured At\n";
      const rows = leads.map(l => {
        const cleanName = l.firstName.replace(/"/g, '""');
        const cleanEmail = l.email.replace(/"/g, '""');
        const cleanPhone = l.phone.replace(/"/g, '""');
        const checkin = l.checkinDate || "";
        const room = l.roomPreference || "";
        const source = l.sourcePage || "";
        const date = l.createdAt.toISOString();
        return `"${cleanName}","${cleanEmail}","${cleanPhone}","${checkin}","${room}","${source}","${date}"`;
      }).join("\n");

      const csvContent = headers + rows;

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="leads_export.csv"'
        }
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error in GET /api/admin:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    // Login logic
    if (action === "login") {
      const { email, password } = await req.json();

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const token = signJwt({ email }, SECRET, 24); // 24 hours expiry
        
        const response = NextResponse.json({ success: true });
        
        // Set cookie
        response.cookies.set("elara_admin_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 // 24 hours
        });

        return response;
      }

      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Logout logic
    if (action === "logout") {
      const response = NextResponse.json({ success: true });
      response.cookies.set("elara_admin_token", "", {
        path: "/",
        maxAge: 0
      });
      return response;
    }

    // Protected actions
    if (!checkAuthentication(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update Knowledge Base item
    if (action === "kb-update") {
      const { id, value } = await req.json();

      if (!id || value === undefined) {
        return NextResponse.json({ error: "Missing id or value" }, { status: 400 });
      }

      const updated = await prisma.kbItem.update({
        where: { id },
        data: {
          value,
          updatedBy: "admin"
        }
      });

      return NextResponse.json({ success: true, item: updated });
    }

    if (action === "complaint-resolve") {
      const { id, status } = await req.json();
      if (!id || !status) {
        return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
      }
      const updated = await prisma.complaint.update({
        where: { id },
        data: { status }
      });
      return NextResponse.json({ success: true, complaint: updated });
    }

    if (action === "complaints-delete-resolved") {
      const deleted = await prisma.complaint.deleteMany({
        where: { status: "resolved" }
      });
      return NextResponse.json({ success: true, count: deleted.count });
    }

    if (action === "lead-delete") {
      const { id } = await req.json();
      if (!id) {
        return NextResponse.json({ error: "Missing lead id" }, { status: 400 });
      }
      await prisma.lead.delete({
        where: { id }
      });
      return NextResponse.json({ success: true });
    }

    if (action === "transcript-delete") {
      const { sessionId } = await req.json();
      if (!sessionId) {
        return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
      }
      await prisma.conversation.delete({
        where: { sessionId }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error in POST /api/admin:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
