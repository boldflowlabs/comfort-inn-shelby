import "dotenv/config";
import { prisma } from "../src/lib/db";

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

  // TV Channels
  {
    category: "hotel_amenities",
    key: "tv_channels",
    value: `Here is the list of available TV channels:
4 Spectrum News Charlotte
6 ABC - WSOC
7 CBS - WBTV
8 CBS 2
10 FOX - WJZY
12 NBC - WCNC
13 NBC 2
14 CW - WCCB
16 PBS - WUNC 2
17 PBS Kids (Root) - WUNC 3
36 ION
37 My TV - WCCB 3
38 My TV - WUYT
41 Telemundo
43 UNIVISION (HD) - UNIV
51 FOX SPORTS SOUTH
58 USA NETWORK
59 A&E
60 TNT
61 TBS
62 AMC
63 DISCOVERY
64 HISTORY
65 FX
66 BBC AMERICA
67 SYFY
68 Tru TV
69 COMEDY CENTRAL
70 PARAMOUNT (SPIKE TV)
71 VH1
72 MTV
73 TV LAND
74 FREEFORM
75 HALLMARK CHANNEL
76 NATIONAL GEOGRAPHIC
77 ANIMAL PLANET
78 SCIENCE
79 AHC - AMERICAN HEROES CHANNEL
80 HGTV
81 FOOD NETWORK
82 TRAVEL CHANNEL
83 TLC
84 BRAVO
85 E!
86 LIFETIME
87 OWN
88 BET
90 CNN
91 FOX NEWS
92 MSNBC
93 HLN
94 CNBC
95 FOX BUSINESS NETWORK
96 BLOOMBERG
97 WEATHER CHANNEL
98 C-SPAN
99 DISNEY CHANNEL
100 BOOMERANG
101 DISNEY JR
102 UNIVERSAL KIDS (FORMERLY SPROUT)
103 NICK JR
104 NICKELODEON
105 CARTOON NETWORK
106 DISCOVERY FAMILY
107 CMT
108 GREAT AMERICAN COUNTRY
109 ESPN
110 ESPN2
112 NBC SPORTS NETWORK
113 SEC NETWORK
114 FOX SPORTS 1
115 FOX SPORTS 2
116 VELOCITY (MOTORTREND)
117 TCM (TURNER CLASSIC MOVIES)
121 UNIMAS (NATIONAL FEED)
123 FXX
124 MTV2
125 MTV CLASSIC ROCK
126 UP (UPLIFTING CHANNEL)
127 NATIONAL GEO WILD
128 SMITHSONIAN
129 VICELAND
130 FYI
131 DESTINATION AMERICA
132 INVESTIGATION DISCOVERY
133 EL REY
134 COOKING CHANNEL
135 OXYGEN
136 WE TV
137 POP (FORMERLY TVGN)
138 GAME SHOW NETWORK
139 LOGO TV
140 DISCOVERY LIFE (WAS FIT & HEALTH)
141 BET HER
142 TV ONE
143 BBC WORLD NEWS
144 NICKTOONS
145 TEENNICK
146 DISNEY XD
147 MTV LIVE
148 REVOLT
149 FUSE
150 INSP (INSPIRATION)
151 SUNDANCE
153 TBN
154 LIFETIME MOVIE NETWORK
155 INDEPENDENT FILM CHANNEL
156 HALLMARK MOVIES & MYSTERIES
157 BET SOUL
158 PAC-12 NATIONAL
160 FOX MOVIE CHANNEL
161 IMPACT
162 DIY
163 MTV U
164 NEWSMAX
165 BIG TEN NATIONAL
166 ATLANTIC COAST CONFERENCE
175 BEIN SPORTS
177 CBS SPORTS NETWORK
187 ESPN DEPORTES
189 ESPN NEWS
190 ESPNU
191 FOX DEPORTES
196 GOLF CHANNEL
197 MLB NETWORK
198 NBA TV
200 NFL NETWORK
201 NFL REDZONE
202 NHL NETWORK
204 OUTDOOR CHANNEL
211 SEC2
212 TENNIS CHANNEL
214 TUDN (IN 2 PACKAGES)
215 WILLOW
250 HBO
251 HBO 2
252 HBO SIGNATURE
253 HBO COMEDY
254 HBO FAMILY
255 HBO LATINO
256 HBO ZONE`,
  },

  // Comprehensive Overview
  {
    category: "general_info",
    key: "comprehensive_overview",
    value: `COMFORT INN SHELBY NC
For Comfort Inn Shelby NC
Hotel Overview
Comfort Inn Shelby NC offers comfortable accommodations, friendly hospitality, complimentary breakfast, free Wi-Fi, EV charging, seasonal outdoor pool access, and convenient access to local dining, shopping, and attractions in Shelby, North Carolina.
Our hospitality philosophy is simple:
“A Home Away From Home.”
We strive to provide a welcoming, relaxing, and comfortable experience for every guest visiting Shelby, North Carolina.
The hotel welcomes:
Families, Business travelers, Sports teams, Road trip travelers, Group travelers, Vacation travelers

CONTACT INFORMATION
Hotel Address: 2012 East Marion Street, Shelby, NC 28150
Hotel Phone Number: (704) 482-5666
Website: https://www.comfortshelby.com

CHECK-IN & CHECK-OUT
Check-In Time: 3:00 PM
Check-Out Time: 11:00 AM
Early check-in and late check-out may be available depending on occupancy and housekeeping schedules.

BREAKFAST INFORMATION
Complimentary hot breakfast is served daily from 6:00 AM to 9:30 AM.
Breakfast may include: Waffles, Eggs, Sausage, Oatmeal, Yogurt, Fruit, Cereals, Coffee, Juice

HOTEL AMENITIES
The hotel offers:
Complimentary hot breakfast, Free high-speed Wi-Fi, Seasonal outdoor pool, Fitness center, Elevator access, Business-friendly amenities, Guest laundry, Vending machines, Ice machines, EV charging stations, Outdoor gazebo seating area, Outdoor barbecue grill, Daily housekeeping, Free parking, 24-hour front desk.
Guest room amenities may include: Microwave, Refrigerator, Coffee maker, Flat-screen TV, Work desk, Hair dryer, Iron and ironing board, Air conditioning.

EV CHARGING
The hotel offers Level 2 EV charging stations near the front gazebo area. Features: Card payments accepted, Convenient overnight charging for guests.

GAZEBO & OUTDOOR AREA
Guests can enjoy: Outdoor seating area, Gazebo gathering space, Barbecue grill access. Perfect for relaxing, socializing, and family-friendly gatherings.

GUEST LAUNDRY
Guest laundry facilities are available onsite. Features: Washer and dryer access, Card payments accepted, Convenient for extended stays.

VENDING MACHINES & ICE MACHINES
Vending machines are available onsite and accept card payments. Snacks and beverages are available 24/7.
Ice machines are available on both floors for guest convenience.

SEASONAL OUTDOOR POOL
The hotel features a seasonal outdoor swimming pool.
Pool season: Typically opens around Memorial Day in May. Availability may vary depending on weather conditions.

PARKING INFORMATION
Complimentary self-parking is available for registered guests. Limited truck, trailer, and bus parking may be available depending on occupancy and availability.

PET POLICY
Pets are not allowed. ADA-compliant service animals are welcome.

SMOKING POLICY
This is a non-smoking hotel. Smoking or vaping inside guest rooms may result in additional cleaning fees.

ACCESSIBILITY
ADA-accessible rooms and public areas are available. Guests needing accessibility accommodations are encouraged to contact the hotel directly.

MEETING & GATHERING SPACE
The hotel does not offer a traditional dedicated meeting room. However, the breakfast area may be available after 10:00 AM for: Small meetings, Team discussions, Gatherings, Celebrations. Guests should contact the hotel directly for availability and details.

AIRPORT INFORMATION
Nearest Major Airport: Charlotte Douglas International Airport (About 45 to 60 minutes from the hotel).
Nearby regional airports: Shelby-Cleveland County Regional Airport, Asheville Regional Airport.
The hotel does not currently provide airport shuttle service. Guests may use: Uber, Lyft, Taxi services, Rental cars.

LOCAL AREA INFORMATION
Nearby attractions may include: Downtown Shelby, Cleveland Mall, Gardner-Webb University, Earl Scruggs Center, Don Gibson Theatre, Kings Mountain National Military Park, Local restaurants and shopping.
Nearby cities: Charlotte, NC, Kings Mountain, NC, Gastonia, NC, Asheville, NC.

DISTANCE INFORMATION
Charlotte, NC: Approx 45-60 mins
Asheville, NC: Approx 1.5-2 hrs
Catawba Two Kings Casino: Approx 20-30 mins
Downtown Shelby: Short driving distance
Gardner-Webb University: Short driving distance

DISCOUNTS & GROUP RATES
The hotel may offer: AAA, AARP, Military, Corporate, Choice Privileges member rates.
Group rates may be available for: Sports teams, Weddings, Business groups, Family gatherings, Extended stays.

CANCELLATION POLICY
Cancellation policies may vary depending on: Reservation type, Booking channel, Selected rate plan. Guests should review their reservation confirmation or contact the hotel directly.

TRANSPORTATION INFORMATION
Uber and Lyft services may be available depending on driver availability. Local taxi services may also be available. The front desk may assist guests with transportation information.

HOTEL CULTURE
At Comfort Inn Shelby NC, we focus on: Friendly hospitality, Comfortable accommodations, Helpful local recommendations, Clean rooms, Welcoming guest experiences. Many guests return because of: Friendly staff, Convenient location, Comfortable rooms, Complimentary breakfast, Relaxing atmosphere.`,
  },

  // Frequently Asked Questions
  {
    category: "faq",
    key: "general_faqs",
    value: `FREQUENTLY ASKED QUESTIONS
Q: What time is breakfast served?
A: Complimentary hot breakfast is served daily from 6:00 AM to 9:30 AM.

Q: Does the hotel have EV charging?
A: Yes! The hotel offers Level 2 EV charging stations near the front gazebo area. Card payments are accepted.

Q: Does the hotel have guest laundry?
A: Yes, guest laundry facilities are available onsite and accept card payments.

Q: Are there vending machines?
A: Yes, vending machines are available onsite and accept card payments.

Q: Does the hotel have ice machines?
A: Yes, ice machines are available on both floors.

Q: When does the pool open?
A: The seasonal outdoor pool typically opens around Memorial Day in May, weather permitting.

Q: Is there outdoor seating available?
A: Yes! Guests can enjoy the gazebo and outdoor seating area located on the property.

Q: Can guests use the barbecue grill?
A: Yes, guests may enjoy the outdoor barbecue grill area.

Q: What time is check-in?
A: Check-in begins at 3:00 PM.

Q: What time is check-out?
A: Check-out time is 11:00 AM.

Q: Can I request late check-out?
A: Late check-out may be available depending on occupancy and housekeeping schedules.

Q: Is parking free?
A: Yes, complimentary parking is available for registered guests.

Q: Do rooms have microwaves and refrigerators?
A: Yes, guest rooms include both a microwave and refrigerator.

Q: Is the hotel smoke-free?
A: Yes, this is a non-smoking hotel.

Q: Are pets allowed?
A: Pets are not allowed. ADA service animals are welcome.

Q: Does the hotel have an elevator?
A: Yes, elevator access is available.

Q: Is the front desk open 24 hours?
A: Yes, the front desk is available 24 hours a day.

Q: Does the hotel have a fitness center?
A: Yes, guests have access to the onsite fitness center.

Q: Do you have a meeting room?
A: The hotel does not have a traditional dedicated meeting room. However, the breakfast area may be available after 10:00 AM for meetings, gatherings, and celebrations.

Q: How far is the hotel from Charlotte?
A: The hotel is approximately 45 to 60 minutes from Charlotte depending on traffic conditions.

Q: How far is the hotel from Asheville?
A: Asheville is approximately 1.5 to 2 hours away.

Q: How far is the hotel from Kings Mountain Casino?
A: The Catawba Two Kings Casino is approximately 20 to 30 minutes from the hotel.

Q: What is the nearest airport?
A: The nearest major airport is Charlotte Douglas International Airport, located approximately 45 to 60 minutes from the hotel.

Q: Does the hotel provide airport shuttle service?
A: No, the hotel does not currently provide airport shuttle service.

Q: Are Uber and Lyft available?
A: Yes, Uber and Lyft may be available depending on local driver availability.

Q: Do you offer discounts?
A: The hotel may offer AAA, AARP, military, corporate, and Choice Privileges discounts depending on availability.

Q: Do you offer group rates?
A: Yes, group rates may be available for sports teams, weddings, business groups, and extended stays.

Q: Can I book directly with the hotel?
A: Yes, guests are encouraged to book directly through the hotel website or by contacting the hotel directly.

Q: Is your staff friendly and helpful?
A: Yes! Our team takes pride in providing warm hospitality, helpful local recommendations, and excellent guest service.

Q: What makes your hotel special?
A: We focus on clean accommodations, friendly service, convenient amenities, and creating a comfortable experience that feels like “A Home Away From Home.”

Q: Is the hotel family friendly?
A: Yes, the hotel welcomes families and travelers of all ages.

Q: Is the hotel good for business travelers?
A: Yes, the hotel is convenient for business travelers and offers free Wi-Fi, parking, comfortable rooms, and easy highway access.

Q: Can the hotel help with local recommendations?
A: Absolutely! Our team is happy to recommend restaurants, shopping, attractions, and local activities.

Q: What restaurants are nearby?
A: Several restaurants are located nearby including local barbecue restaurants, family dining, fast food, and local favorites.

Q: Which barbecue restaurants do you recommend?
A: Popular local barbecue favorites include Red Bridges Barbecue Lodge and Alston Bridges BBQ.

Q: What are popular nearby attractions?
A: Popular attractions include: Earl Scruggs Center, Don Gibson Theatre, Gardner-Webb University, Kings Mountain National Military Park, Downtown Shelby, Cleveland Mall.`,
  },
];

async function main() {
  console.log("Clearing existing KB items...");
  await prisma.kbItem.deleteMany();

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
