import "dotenv/config";
import pkgClient from "@prisma/client";
const { PrismaClient } = pkgClient;

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db"
});
const prisma = new PrismaClient({ adapter });

const seedItems = [
  // Hotel Identity
  {
    category: "hotel_identity",
    key: "hotel_name",
    value: "Comfort Inn Shelby",
  },
  {
    category: "hotel_identity",
    key: "hotel_brand",
    value: "Comfort Inn® (a Choice Hotels International property)",
  },
  {
    category: "hotel_identity",
    key: "address",
    value: "2012 East Marion Street, Shelby, NC 28150",
  },
  {
    category: "hotel_identity",
    key: "phone",
    value: "704-482-5666",
  },
  {
    category: "hotel_identity",
    key: "website",
    value: "https://www.comfortshelby.com",
  },
  {
    category: "hotel_identity",
    key: "awards",
    value: "Gold Award 2023 winning hotel",
  },

  // Operating Info
  {
    category: "operating_info",
    key: "checkin_time",
    value: "3:00 PM",
  },
  {
    category: "operating_info",
    key: "checkout_time",
    value: "11:00 AM",
  },
  {
    category: "operating_info",
    key: "pet_policy",
    value: "Pets are not allowed. Service animals are accepted at no charge.",
  },
  {
    category: "operating_info",
    key: "parking_policy",
    value: "Free outdoor parking. Bus and truck parking is available on-site.",
  },
  {
    category: "operating_info",
    key: "smoking_policy",
    value: "100% smoke-free property.",
  },
  {
    category: "operating_info",
    key: "checkin_requirements",
    value: "Credit card + matching photo ID required at check-in. Minimum age to check in is 18.",
  },
  {
    category: "operating_info",
    key: "deposit_info",
    value: "Incidental deposit: $250 USD at check-in (refundable upon room inspection).",
  },

  // Renovations (Current as of May 2026)
  {
    category: "renovations",
    key: "pool_status",
    value: "temporarily closed for renovations",
  },
  {
    category: "renovations",
    key: "gym_status",
    value: "temporarily closed for renovations",
  },
  {
    category: "renovations",
    key: "elevator_status",
    value: "currently unavailable (no elevator, 2 stories, rooms on 2nd floor accessible by stairs only)",
  },
  {
    category: "renovations",
    key: "ev_charging_status",
    value: "currently unavailable",
  },
  {
    category: "renovations",
    key: "notice",
    value: "Our outdoor pool, fitness center, elevator, and EV charging station are temporarily unavailable while we undergo renovations. The rest of the hotel is fully open and we would love to welcome you! (Please let us know if you require a first-floor room due to the elevator closure).",
  },

  // Rooms
  {
    category: "rooms",
    key: "types",
    value: "We offer 4 types of non-smoking rooms:\n- 1 King Bed, Nonsmoking, Accessible (ADA compliant, visual fire alarm, available with accessible tub or roll-in shower, max 3 guests)\n- 1 King Bed, Nonsmoking (max 3 guests)\n- 2 Queen Beds, Nonsmoking (max 4 guests)",
  },
  {
    category: "rooms",
    key: "amenities",
    value: "All rooms include: Free Wi-Fi, 42\" HDTV with HBO, coffeemaker, microwave, refrigerator, hair dryer, iron & ironing board, desk with ergonomic chair, A/C & heat, AM/FM clock radio, private bathroom, and wake-up service.",
  },

  // Amenities
  {
    category: "hotel_amenities",
    key: "breakfast",
    value: "Complimentary hot breakfast served daily, featuring fresh waffles, scrambled eggs, sausages, oatmeal, fresh fruit, yogurt, and coffee.",
  },
  {
    category: "hotel_amenities",
    key: "coffee",
    value: "Complimentary coffee is available in the lobby throughout the day.",
  },
  {
    category: "hotel_amenities",
    key: "newspaper",
    value: "Free weekday newspaper is available in the lobby.",
  },
  {
    category: "hotel_amenities",
    key: "business_center",
    value: "Self-service business center equipped with computer, printer, copier, and fax services.",
  },
  {
    category: "hotel_amenities",
    key: "general_features",
    value: "2 stories, interior corridors, government/FEMA travelers welcome.",
  },

  // Meeting Space
  {
    category: "meeting_space",
    key: "info",
    value: "We do not have a dedicated meeting room, but our breakfast dining area can be reserved for meetings and events after 11:00 AM.",
  },

  // Booking & Deals
  {
    category: "booking_links",
    key: "direct_booking",
    value: "https://www.comfortshelby.com/click-reservation",
  },
  {
    category: "booking_links",
    key: "special_offers",
    value: "https://www.comfortshelby.com/offers",
  },
  {
    category: "booking_links",
    key: "loyalty_program",
    value: "Choice Privileges loyalty program points can be earned and redeemed on direct bookings.",
  },

  // Location & Attractions
  {
    category: "location",
    key: "directions",
    value: "Located at 2012 East Marion Street, Shelby, NC 28150. Approximately 1 hour east of Charlotte, NC, easily accessible via US Highway 74.",
  },
  {
    category: "location",
    key: "attractions",
    value: "Nearby attractions include:\n- Cleveland Mall (adjacent to the hotel)\n- John Henry Moss Lake (boating and fishing)\n- Cleveland Golf Club, Woodbridge Golf Course, and Royster Memorial Golf Course (all within 5 miles)\n- Kings Mountain Historical Museum\n- Gardner-Webb University (in Boiling Springs, NC)\n- Wing Haven Gardens & Bird Sanctuary\n- Historic Latta Plantation",
  },

  // Nearby Dining
  {
    category: "dining",
    key: "restaurants",
    value: "Walking distance or short drive:\n- Denny's\n- Golden Corral\n- Fatz Southern Kitchen\n- Red Bridges Barbecue Lodge (famous local NC-style barbecue)",
  },
];

async function main() {
  console.log("Seeding Comfort Inn Shelby KB items...");
  
  for (const item of seedItems) {
    await prisma.kbItem.upsert({
      where: { key: item.key },
      update: { category: item.category, value: item.value },
      create: { category: item.category, key: item.key, value: item.value },
    });
  }
  
  console.log(`Successfully seeded ${seedItems.length} knowledge base items.`);
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
