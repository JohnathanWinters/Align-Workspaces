import { db } from "./db";
import {
  users,
  shoots,
  galleryFolders,
  galleryImages,
  imageFavorites,
  editTokens,
  tokenTransactions,
  editRequests,
  editRequestPhotos,
  editRequestMessages,
  shootMessages,
  adminConversations,
  adminMessages,
  spaces,
  spaceBookings,
  spaceMessages,
  spaceFavorites,
  wishlistCollections,
  wishlistItems,
  shootReviews,
  spaceReviews,
} from "@shared/schema";
import { eq } from "drizzle-orm";

const TEST_EMAIL = "nomad.ar89@yahoo.com";

// Fixed IDs for idempotent seeding
const TEST_SHOOT_COMPLETED = "test-shoot-brand-refresh";
const TEST_SHOOT_UPCOMING = "test-shoot-office-portraits";
const TEST_SHOOT_INPROGRESS = "test-shoot-lifestyle-content";
const TEST_FOLDER_FAVORITES = "test-folder-favorites";
const TEST_FOLDER_OUTDOOR = "test-folder-outdoor";
const TEST_EDIT_REQ_COMPLETED = "test-edit-request-completed";
const TEST_EDIT_REQ_INPROGRESS = "test-edit-request-inprogress";
const TEST_EDIT_REQ_PENDING = "test-edit-request-pending";
const TEST_ADMIN_CONV = "test-admin-conversation";
const TEST_BOOKING_UPCOMING = "test-booking-upcoming";
const TEST_BOOKING_COMPLETED = "test-booking-completed";
const TEST_BOOKING_CHECKEDIN = "test-booking-checkedin";
const TEST_BOOKING_CANCELLED = "test-booking-cancelled";
const TEST_HOST_SPACE = "test-host-space-coaching";
const TEST_HOST_BOOKING_1 = "test-host-booking-1";
const TEST_HOST_BOOKING_2 = "test-host-booking-2";
const TEST_WISHLIST_1 = "test-wishlist-therapy-offices";
const TEST_WISHLIST_2 = "test-wishlist-creative-studios";

const IMG_IDS = [
  "test-gallery-img-001", "test-gallery-img-002", "test-gallery-img-003",
  "test-gallery-img-004", "test-gallery-img-005", "test-gallery-img-006",
  "test-gallery-img-007", "test-gallery-img-008", "test-gallery-img-009",
  "test-gallery-img-010", "test-gallery-img-011", "test-gallery-img-012",
];

// Gallery images for the in-progress shoot
const LIFESTYLE_IMG_IDS = [
  "test-lifestyle-img-001", "test-lifestyle-img-002", "test-lifestyle-img-003",
  "test-lifestyle-img-004", "test-lifestyle-img-005",
];

const IMAGES = {
  portrait1: "/images/portfolio-1.webp",
  portrait2: "/images/portfolio-2.webp",
  officeAssuredCozy: "/images/portfolio-office-assured-cozy.webp",
  urbanAssuredBright: "/images/portfolio-urban-assured-bright.webp",
  urbanAssuredBright2: "/images/portfolio-urban-assured-bright-2.webp",
  urbanConfidenceBright: "/images/portfolio-urban-confidence-bright.webp",
  officeAssuredBright2: "/images/portfolio-office-assured-bright-2.webp",
  officeAssuredBright3: "/images/portfolio-office-assured-bright-3.webp",
};

function futureDate(daysFromNow: number): string {
  const d = new Date(); d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}
function pastDate(daysAgo: number): string {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}
function pastTimestamp(daysAgo: number): Date {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d;
}
function futureTimestamp(daysFromNow: number): Date {
  const d = new Date(); d.setDate(d.getDate() + daysFromNow);
  return d;
}

export async function seedTestClient() {
  // Find the test user
  const [user] = await db.select().from(users).where(eq(users.email, TEST_EMAIL));
  if (!user) {
    console.log(`Test client not found: ${TEST_EMAIL} — skipping seed`);
    return;
  }

  const userId = user.id;

  // Check if already seeded
  const [existingShoot] = await db.select().from(shoots).where(eq(shoots.id, TEST_SHOOT_COMPLETED));
  if (existingShoot) {
    console.log("Test client data already seeded — skipping");
    return;
  }

  console.log(`Seeding test data for: ${user.firstName || ""} ${user.lastName || ""} (${TEST_EMAIL})...`);

  // 1. Shoots
  await db.insert(shoots).values([
    {
      id: TEST_SHOOT_COMPLETED,
      userId,
      title: "Spring Brand Refresh",
      environment: "nature",
      brandMessage: "assured",
      emotionalImpact: "bright",
      shootIntent: "social-media",
      status: "completed",
      shootDate: pastDate(45),
      shootTime: "10:00",
      location: "Fairchild Tropical Garden, Coral Gables, FL",
      durationHours: "2",
      notes: "Outdoor session with natural backdrops. Bring 2 outfit changes.",
    },
    {
      id: TEST_SHOOT_UPCOMING,
      userId,
      title: "Office Headshots",
      environment: "office",
      brandMessage: "confidence",
      emotionalImpact: "powerful",
      shootIntent: "professional-headshot",
      status: "scheduled",
      shootDate: futureDate(28),
      shootTime: "14:00",
      location: "245 Miracle Mile, Coral Gables, FL 33134",
      durationHours: "1",
      notes: "Professional headshots for website and LinkedIn.",
    },
    {
      id: TEST_SHOOT_INPROGRESS,
      userId,
      title: "Lifestyle Content Package",
      environment: "urban",
      brandMessage: "authentic",
      emotionalImpact: "warm",
      shootIntent: "social-media",
      status: "in-progress",
      shootDate: pastDate(5),
      shootTime: "09:00",
      location: "Wynwood Arts District, Miami, FL",
      durationHours: "3",
      notes: "Casual lifestyle shots for Instagram and website hero images.",
    },
  ]);

  // 2. Gallery folders
  await db.insert(galleryFolders).values([
    { id: TEST_FOLDER_FAVORITES, shootId: TEST_SHOOT_COMPLETED, name: "Favorites", sortOrder: 0 },
    { id: TEST_FOLDER_OUTDOOR, shootId: TEST_SHOOT_COMPLETED, name: "Outdoor Session", sortOrder: 1 },
  ]);

  // 3. Gallery images
  await db.insert(galleryImages).values([
    { id: IMG_IDS[0], shootId: TEST_SHOOT_COMPLETED, folderId: TEST_FOLDER_FAVORITES, imageUrl: IMAGES.portrait1, thumbnailUrl: IMAGES.portrait1, originalFilename: "BrandRefresh_001.jpg", sortOrder: 0 },
    { id: IMG_IDS[1], shootId: TEST_SHOOT_COMPLETED, folderId: TEST_FOLDER_FAVORITES, imageUrl: IMAGES.portrait2, thumbnailUrl: IMAGES.portrait2, originalFilename: "BrandRefresh_002.jpg", sortOrder: 1 },
    { id: IMG_IDS[2], shootId: TEST_SHOOT_COMPLETED, folderId: TEST_FOLDER_FAVORITES, imageUrl: IMAGES.urbanAssuredBright, thumbnailUrl: IMAGES.urbanAssuredBright, originalFilename: "BrandRefresh_003.jpg", sortOrder: 2 },
    { id: IMG_IDS[3], shootId: TEST_SHOOT_COMPLETED, folderId: TEST_FOLDER_OUTDOOR, imageUrl: IMAGES.urbanAssuredBright2, thumbnailUrl: IMAGES.urbanAssuredBright2, originalFilename: "Outdoor_001.jpg", sortOrder: 0 },
    { id: IMG_IDS[4], shootId: TEST_SHOOT_COMPLETED, folderId: TEST_FOLDER_OUTDOOR, imageUrl: IMAGES.urbanConfidenceBright, thumbnailUrl: IMAGES.urbanConfidenceBright, originalFilename: "Outdoor_002.jpg", sortOrder: 1 },
    { id: IMG_IDS[5], shootId: TEST_SHOOT_COMPLETED, folderId: TEST_FOLDER_OUTDOOR, imageUrl: IMAGES.officeAssuredCozy, thumbnailUrl: IMAGES.officeAssuredCozy, originalFilename: "Outdoor_003.jpg", sortOrder: 2 },
    { id: IMG_IDS[6], shootId: TEST_SHOOT_COMPLETED, folderId: TEST_FOLDER_OUTDOOR, imageUrl: IMAGES.officeAssuredBright2, thumbnailUrl: IMAGES.officeAssuredBright2, originalFilename: "Outdoor_004.jpg", sortOrder: 3 },
    { id: IMG_IDS[7], shootId: TEST_SHOOT_COMPLETED, folderId: TEST_FOLDER_OUTDOOR, imageUrl: IMAGES.officeAssuredBright3, thumbnailUrl: IMAGES.officeAssuredBright3, originalFilename: "Outdoor_005.jpg", sortOrder: 4 },
    { id: IMG_IDS[8], shootId: TEST_SHOOT_COMPLETED, folderId: null, imageUrl: IMAGES.portrait1, thumbnailUrl: IMAGES.portrait1, originalFilename: "Extra_001.jpg", sortOrder: 0 },
    { id: IMG_IDS[9], shootId: TEST_SHOOT_COMPLETED, folderId: null, imageUrl: IMAGES.portrait2, thumbnailUrl: IMAGES.portrait2, originalFilename: "Extra_002.jpg", sortOrder: 1 },
    { id: IMG_IDS[10], shootId: TEST_SHOOT_COMPLETED, folderId: null, imageUrl: IMAGES.urbanAssuredBright, thumbnailUrl: IMAGES.urbanAssuredBright, originalFilename: "Extra_003.jpg", sortOrder: 2 },
    { id: IMG_IDS[11], shootId: TEST_SHOOT_COMPLETED, folderId: null, imageUrl: IMAGES.urbanConfidenceBright, thumbnailUrl: IMAGES.urbanConfidenceBright, originalFilename: "Extra_004.jpg", sortOrder: 3 },
  ]);

  // 3b. Gallery images for in-progress shoot (lifestyle)
  await db.insert(galleryImages).values([
    { id: LIFESTYLE_IMG_IDS[0], shootId: TEST_SHOOT_INPROGRESS, folderId: null, imageUrl: IMAGES.urbanAssuredBright, thumbnailUrl: IMAGES.urbanAssuredBright, originalFilename: "Lifestyle_Wynwood_001.jpg", sortOrder: 0 },
    { id: LIFESTYLE_IMG_IDS[1], shootId: TEST_SHOOT_INPROGRESS, folderId: null, imageUrl: IMAGES.urbanAssuredBright2, thumbnailUrl: IMAGES.urbanAssuredBright2, originalFilename: "Lifestyle_Wynwood_002.jpg", sortOrder: 1 },
    { id: LIFESTYLE_IMG_IDS[2], shootId: TEST_SHOOT_INPROGRESS, folderId: null, imageUrl: IMAGES.urbanConfidenceBright, thumbnailUrl: IMAGES.urbanConfidenceBright, originalFilename: "Lifestyle_Wynwood_003.jpg", sortOrder: 2 },
    { id: LIFESTYLE_IMG_IDS[3], shootId: TEST_SHOOT_INPROGRESS, folderId: null, imageUrl: IMAGES.portrait1, thumbnailUrl: IMAGES.portrait1, originalFilename: "Lifestyle_Wynwood_004.jpg", sortOrder: 3 },
    { id: LIFESTYLE_IMG_IDS[4], shootId: TEST_SHOOT_INPROGRESS, folderId: null, imageUrl: IMAGES.portrait2, thumbnailUrl: IMAGES.portrait2, originalFilename: "Lifestyle_Wynwood_005.jpg", sortOrder: 4 },
  ]);

  // 4. Image favorites
  await db.insert(imageFavorites).values([
    { id: "test-fav-1", userId, imageId: IMG_IDS[0] },
    { id: "test-fav-2", userId, imageId: IMG_IDS[1] },
    { id: "test-fav-3", userId, imageId: IMG_IDS[4] },
  ]);

  // 5. Edit tokens
  await db.insert(editTokens).values({
    id: "test-edit-token-record",
    userId,
    annualTokens: 1,
    purchasedTokens: 2,
    annualTokenResetDate: futureTimestamp(320),
    lastPhotoshootDate: pastTimestamp(45),
  });

  // 6. Token transactions
  await db.insert(tokenTransactions).values([
    { id: "test-txn-1", userId, type: "annual_grant", amount: 2, description: "Annual retouching sessions granted", createdAt: pastTimestamp(365) },
    { id: "test-txn-2", userId, type: "purchase", amount: 2, description: "Purchased 2 extra retouching sessions", createdAt: pastTimestamp(60) },
    { id: "test-txn-3", userId, type: "usage", amount: -1, description: "Used for Spring Brand Refresh edit request", createdAt: pastTimestamp(40) },
  ]);

  // 7. Edit requests
  await db.insert(editRequests).values([
    { id: TEST_EDIT_REQ_COMPLETED, userId, shootId: TEST_SHOOT_COMPLETED, photoCount: 2, annualTokensUsed: 1, purchasedTokensUsed: 0, notes: "Please brighten the outdoor shots and smooth skin tones. I'd love a warm, golden-hour feel.", status: "completed", createdAt: pastTimestamp(40) },
    { id: TEST_EDIT_REQ_INPROGRESS, userId, shootId: TEST_SHOOT_COMPLETED, photoCount: 1, annualTokensUsed: 0, purchasedTokensUsed: 1, notes: "Can you remove the background distractions and add a subtle vignette?", status: "in-progress", createdAt: pastTimestamp(10) },
    { id: TEST_EDIT_REQ_PENDING, userId, shootId: TEST_SHOOT_INPROGRESS, photoCount: 1, annualTokensUsed: 0, purchasedTokensUsed: 1, notes: "Light color grading to match my brand palette — warm tones, muted greens.", status: "pending", createdAt: pastTimestamp(3) },
  ]);

  // 8. Edit request photos
  await db.insert(editRequestPhotos).values([
    { id: "test-erp-1", editRequestId: TEST_EDIT_REQ_COMPLETED, imageUrl: IMAGES.urbanAssuredBright2, originalFilename: "edit_001.jpg", finishedImageUrl: IMAGES.urbanAssuredBright, finishedFilename: "edit_001_final.jpg" },
    { id: "test-erp-2", editRequestId: TEST_EDIT_REQ_COMPLETED, imageUrl: IMAGES.officeAssuredCozy, originalFilename: "edit_002.jpg", finishedImageUrl: IMAGES.officeAssuredBright2, finishedFilename: "edit_002_final.jpg" },
    { id: "test-erp-3", editRequestId: TEST_EDIT_REQ_INPROGRESS, imageUrl: IMAGES.urbanConfidenceBright, originalFilename: "vignette_001.jpg" },
    { id: "test-erp-4", editRequestId: TEST_EDIT_REQ_PENDING, imageUrl: IMAGES.portrait2, originalFilename: "colorgrade_001.jpg" },
  ]);

  // 9. Edit request messages
  await db.insert(editRequestMessages).values([
    { id: "test-erm-1", editRequestId: TEST_EDIT_REQ_COMPLETED, senderId: userId, senderRole: "client", senderName: user.firstName || "Client", message: "Hi! I submitted these two photos. Can you brighten them and add a warm tone?", createdAt: pastTimestamp(40) },
    { id: "test-erm-2", editRequestId: TEST_EDIT_REQ_COMPLETED, senderId: "admin", senderRole: "admin", senderName: "Armando R.", message: "Absolutely! I'll have these ready within 48 hours. The outdoor shots will look gorgeous with that golden-hour warmth.", createdAt: pastTimestamp(39) },
    { id: "test-erm-3", editRequestId: TEST_EDIT_REQ_COMPLETED, senderId: userId, senderRole: "client", senderName: user.firstName || "Client", message: "Thank you so much! Can't wait to see them.", createdAt: pastTimestamp(39) },
    { id: "test-erm-4", editRequestId: TEST_EDIT_REQ_COMPLETED, senderId: "admin", senderRole: "admin", senderName: "Armando R.", message: "All done! Take a look and let me know if you'd like any tweaks.", createdAt: pastTimestamp(37) },
    { id: "test-erm-5", editRequestId: TEST_EDIT_REQ_COMPLETED, senderId: userId, senderRole: "client", senderName: user.firstName || "Client", message: "These are perfect, exactly the vibe I wanted! Thank you!", createdAt: pastTimestamp(37) },
    { id: "test-erm-6", editRequestId: TEST_EDIT_REQ_INPROGRESS, senderId: userId, senderRole: "client", senderName: user.firstName || "Client", message: "For this one, I'd love a clean look — remove the people walking in the background if possible.", createdAt: pastTimestamp(10) },
    { id: "test-erm-7", editRequestId: TEST_EDIT_REQ_INPROGRESS, senderId: "admin", senderRole: "admin", senderName: "Armando R.", message: "Got it! I'll clean up the background and add a subtle vignette. Should have this back to you in a couple days.", createdAt: pastTimestamp(9) },
  ]);

  // 10. Shoot messages
  await db.insert(shootMessages).values([
    { id: "test-sm-1", shootId: TEST_SHOOT_COMPLETED, senderId: userId, senderRole: "client", senderName: user.firstName || "Client", message: "Looking forward to the session! Should I bring any props?", createdAt: pastTimestamp(50) },
    { id: "test-sm-2", shootId: TEST_SHOOT_COMPLETED, senderId: "admin", senderRole: "admin", senderName: "Armando R.", message: "Just yourself and a couple of outfit changes! I'll have everything set up at the garden. We'll start with the shaded paths while the light is soft.", createdAt: pastTimestamp(49) },
    { id: "test-sm-3", shootId: TEST_SHOOT_COMPLETED, senderId: userId, senderRole: "client", senderName: user.firstName || "Client", message: "Perfect! I'll bring a flowy dress and a casual outfit. See you there!", createdAt: pastTimestamp(49) },
    { id: "test-sm-4", shootId: TEST_SHOOT_COMPLETED, senderId: "admin", senderRole: "admin", senderName: "Armando R.", message: "Loved the shoot today! Gallery will be ready in about a week. You were a natural!", createdAt: pastTimestamp(45) },
    { id: "test-sm-5", shootId: TEST_SHOOT_UPCOMING, senderId: "admin", senderRole: "admin", senderName: "Armando R.", message: "Your headshot session is confirmed! We'll use the studio with classic backdrops. Any color preferences for the background?", createdAt: pastTimestamp(14) },
    { id: "test-sm-6", shootId: TEST_SHOOT_UPCOMING, senderId: userId, senderRole: "client", senderName: user.firstName || "Client", message: "I think a warm neutral or soft gray would be great. Something clean and professional.", createdAt: pastTimestamp(13) },
  ]);

  // 11. Admin conversation
  await db.insert(adminConversations).values({
    id: TEST_ADMIN_CONV,
    clientId: userId,
    createdAt: pastTimestamp(60),
  });

  // 12. Admin messages
  await db.insert(adminMessages).values([
    { id: "test-am-1", conversationId: TEST_ADMIN_CONV, senderId: "admin", senderRole: "admin", senderName: "Armando R.", message: "Welcome to your Align Workspaces portal! I'm here if you have any questions about your shoots, edits, or anything else.", createdAt: pastTimestamp(60) },
    { id: "test-am-2", conversationId: TEST_ADMIN_CONV, senderId: userId, senderRole: "client", senderName: user.firstName || "Client", message: "Thank you, Armando! I'm excited about working together. Quick question — how do the retouching sessions work?", createdAt: pastTimestamp(58) },
    { id: "test-am-3", conversationId: TEST_ADMIN_CONV, senderId: "admin", senderRole: "admin", senderName: "Armando R.", message: "Great question! You get 2 complimentary retouching sessions per year, and you can buy extras anytime. Just go to the Edits tab to submit photos.", createdAt: pastTimestamp(57) },
    { id: "test-am-4", conversationId: TEST_ADMIN_CONV, senderId: userId, senderRole: "client", senderName: user.firstName || "Client", message: "That's perfect, thank you! And I love the space booking feature — I've been looking for a therapy office for my Saturday clients.", createdAt: pastTimestamp(55) },
    { id: "test-am-5", conversationId: TEST_ADMIN_CONV, senderId: "admin", senderRole: "admin", senderName: "Armando R.", message: "The Coral Gables Therapy Suite would be perfect for that! Beautiful space with great natural light. Let me know if you need help with anything.", createdAt: pastTimestamp(54) },
  ]);

  // 13. Space bookings
  await db.insert(spaceBookings).values([
    {
      id: TEST_BOOKING_UPCOMING, spaceId: "sample-space-maria-host", userId, userName: user.firstName || "Client", userEmail: TEST_EMAIL,
      status: "approved", bookingDate: futureDate(10), bookingStartTime: "10:00", bookingHours: 2,
      paymentStatus: "paid", paymentAmount: 7000, feeTier: "standard",
      guestFeeAmount: 490, taxAmount: 490, totalGuestCharged: 7980, hostPayoutAmount: 6125, platformRevenue: 1365,
      message: "Saturday therapy sessions — thank you!", createdAt: pastTimestamp(7),
    },
    {
      id: TEST_BOOKING_COMPLETED, spaceId: "sample-space-armando-host", userId, userName: user.firstName || "Client", userEmail: TEST_EMAIL,
      status: "completed", bookingDate: pastDate(20), bookingStartTime: "09:00", bookingHours: 3,
      paymentStatus: "paid", paymentAmount: 19500, feeTier: "standard",
      guestFeeAmount: 1365, taxAmount: 1365, totalGuestCharged: 22230, hostPayoutAmount: 17063, platformRevenue: 3802,
      checkedInAt: pastTimestamp(20), checkedOutAt: pastTimestamp(20), checkedInBy: "guest", checkedOutBy: "guest",
      message: "Need the studio for my brand content shoot!", createdAt: pastTimestamp(25),
    },
    {
      id: TEST_BOOKING_CHECKEDIN, spaceId: "0ea55148-29d6-41dd-8428-2540b89c34ae", userId, userName: user.firstName || "Client", userEmail: TEST_EMAIL,
      status: "confirmed", bookingDate: pastDate(0), bookingStartTime: "11:00", bookingHours: 2,
      paymentStatus: "paid", paymentAmount: 10000, feeTier: "repeat_guest",
      guestFeeAmount: 500, taxAmount: 700, totalGuestCharged: 11200, hostPayoutAmount: 8750, platformRevenue: 1750,
      checkedInAt: pastTimestamp(0), checkedInBy: "guest",
      message: "Yoga and meditation pop-up event", createdAt: pastTimestamp(5),
    },
    {
      id: TEST_BOOKING_CANCELLED, spaceId: "sample-space-maria-host", userId, userName: user.firstName || "Client", userEmail: TEST_EMAIL,
      status: "cancelled", bookingDate: pastDate(10), bookingStartTime: "14:00", bookingHours: 1,
      paymentStatus: "refunded", paymentAmount: 3500, refundStatus: "full", refundAmount: 3500,
      message: "Need to reschedule — something came up.", createdAt: pastTimestamp(15),
    },
  ]);

  // 14. Shoot review
  await db.insert(shootReviews).values({
    id: "test-shoot-review-1", shootId: TEST_SHOOT_COMPLETED, clientId: userId, clientName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    rating: 5, title: "Absolutely stunning results",
    comment: "Armando captured exactly the mood I was looking for. The outdoor shots in the garden were breathtaking, and he made the entire experience so comfortable and fun. Highly recommend!",
    status: "published", createdAt: pastTimestamp(35),
  });

  // 15. Space review
  await db.insert(spaceReviews).values({
    id: "test-space-review-1", spaceId: "sample-space-armando-host", bookingId: TEST_BOOKING_COMPLETED, guestId: userId,
    guestName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    rating: 5, title: "Perfect creative studio",
    comment: "The Align Creative Studio was exactly what I needed for my brand shoot. Professional lighting was already set up, the space was spotless, and the client lounge was a nice touch.",
    hostResponse: "Thank you! It was wonderful having you at the studio. Looking forward to your next session!",
    hostRespondedAt: pastTimestamp(18), status: "published", createdAt: pastTimestamp(19),
  });

  // 16. Host-owned space (My Spaces)
  await db.insert(spaces).values({
    id: TEST_HOST_SPACE,
    name: "Nomad Coaching Studio",
    slug: "test-nomad-coaching-studio",
    type: "coaching",
    description: "A private, modern coaching and consulting studio designed for one-on-one sessions. Features comfortable seating, a whiteboard wall, natural light, and a calming neutral palette. Perfect for life coaches, business consultants, and therapists seeking a professional yet warm environment.",
    shortDescription: "Private coaching studio with natural light in Brickell",
    address: "1200 Brickell Ave, Miami, FL 33131",
    neighborhood: "Brickell",
    latitude: "25.7617",
    longitude: "-80.1918",
    pricePerHour: 45,
    pricePerDay: 280,
    capacity: 4,
    amenities: ["Wi-Fi", "Whiteboard", "Comfortable seating", "Natural light", "Climate control", "Coffee & tea", "Private restroom", "Street parking"],
    imageUrls: ["/images/spaces/space-8d155dd6-8bfc-4515-a32a-01dd72bcfbfa.webp", "/images/spaces/space-c401b806-3712-4b45-8617-e3d30701873f.webp"],
    colorPalette: JSON.stringify({ colors: [{ hex: "#E8E0D4", name: "Warm Linen" }, { hex: "#7A8B7A", name: "Sage" }, { hex: "#2C2C2C", name: "Charcoal" }], feel: "Grounded warmth — professional yet calming", explanation: "Warm Linen provides an inviting base, Sage introduces a natural, restorative quality, and Charcoal adds modern sophistication." }),
    targetProfession: "Coaches & Consultants",
    availableHours: "Mon-Fri 8:00 AM - 7:00 PM, Sat 9:00 AM - 3:00 PM",
    hostName: user.firstName || "Host",
    userId,
    approvalStatus: "approved",
    isActive: 1,
    isSample: 0,
  });

  // 17. Bookings on host space (from other guests)
  await db.insert(spaceBookings).values([
    {
      id: TEST_HOST_BOOKING_1, spaceId: TEST_HOST_SPACE, userId: "guest-seed-user-1", userName: "Sofia Martinez", userEmail: "sofia.m@example.com",
      status: "approved", bookingDate: futureDate(5), bookingStartTime: "09:00", bookingHours: 2,
      paymentStatus: "paid", paymentAmount: 9000, feeTier: "standard",
      guestFeeAmount: 630, taxAmount: 630, totalGuestCharged: 10260, hostPayoutAmount: 7875, platformRevenue: 1755,
      message: "Coaching session with a new client — thanks!", createdAt: pastTimestamp(3),
    },
    {
      id: TEST_HOST_BOOKING_2, spaceId: TEST_HOST_SPACE, userId: "guest-seed-user-2", userName: "Daniel Park", userEmail: "daniel.p@example.com",
      status: "completed", bookingDate: pastDate(8), bookingStartTime: "14:00", bookingHours: 1,
      paymentStatus: "paid", paymentAmount: 4500, feeTier: "standard",
      guestFeeAmount: 315, taxAmount: 315, totalGuestCharged: 5130, hostPayoutAmount: 3938, platformRevenue: 877,
      checkedInAt: pastTimestamp(8), checkedOutAt: pastTimestamp(8), checkedInBy: "guest", checkedOutBy: "guest",
      message: "Quick consulting session", createdAt: pastTimestamp(12),
    },
  ]);

  // 18. Space favorites
  await db.insert(spaceFavorites).values([
    { id: "test-space-fav-1", userId, spaceId: "sample-space-maria-host" },
    { id: "test-space-fav-2", userId, spaceId: "sample-space-armando-host" },
    { id: "test-space-fav-3", userId, spaceId: "0ea55148-29d6-41dd-8428-2540b89c34ae" },
  ]);

  // 17. Wishlist collections + items
  await db.insert(wishlistCollections).values([
    { id: TEST_WISHLIST_1, userId, name: "Therapy Offices", createdAt: pastTimestamp(30) },
    { id: TEST_WISHLIST_2, userId, name: "Creative Studios", createdAt: pastTimestamp(25) },
  ]);
  await db.insert(wishlistItems).values([
    { id: "test-wl-item-1", collectionId: TEST_WISHLIST_1, spaceId: "sample-space-maria-host" },
    { id: "test-wl-item-2", collectionId: TEST_WISHLIST_1, spaceId: "0ea55148-29d6-41dd-8428-2540b89c34ae" },
    { id: "test-wl-item-3", collectionId: TEST_WISHLIST_2, spaceId: "sample-space-armando-host" },
  ]);

  // 18. Space booking messages
  await db.insert(spaceMessages).values([
    // Upcoming booking thread
    { id: "test-spm-1", spaceBookingId: TEST_BOOKING_UPCOMING, senderId: userId, senderName: user.firstName || "Client", senderRole: "guest", message: "Hi! I booked your space for Saturday morning. Is there parking available nearby?", createdAt: pastTimestamp(6) },
    { id: "test-spm-2", spaceBookingId: TEST_BOOKING_UPCOMING, senderId: "host", senderName: "Dr. Maria Santos", senderRole: "host", message: "Yes! There's free street parking on Miracle Mile, and a garage one block east. I'll leave the door unlocked for you at 10.", createdAt: pastTimestamp(5) },
    { id: "test-spm-3", spaceBookingId: TEST_BOOKING_UPCOMING, senderId: userId, senderName: user.firstName || "Client", senderRole: "guest", message: "Perfect, thank you so much!", createdAt: pastTimestamp(5) },
    // Completed booking thread
    { id: "test-spm-4", spaceBookingId: TEST_BOOKING_COMPLETED, senderId: userId, senderName: user.firstName || "Client", senderRole: "guest", message: "The studio was amazing! Everything was set up perfectly. Thank you!", createdAt: pastTimestamp(19) },
    { id: "test-spm-5", spaceBookingId: TEST_BOOKING_COMPLETED, senderId: "host", senderName: "Align Studios", senderRole: "host", message: "So glad you enjoyed it! Your brand shoot photos are going to look incredible. Come back anytime!", createdAt: pastTimestamp(18) },
  ]);

  console.log("Test client data seeded successfully");
}

export async function reseedTestClient() {
  console.log("Re-seeding test client...");

  const [user] = await db.select().from(users).where(eq(users.email, TEST_EMAIL));
  if (!user) { console.log(`Test client not found: ${TEST_EMAIL}`); return; }
  const userId = user.id;

  // Delete in reverse dependency order
  await db.delete(spaceReviews).where(eq(spaceReviews.id, "test-space-review-1"));
  await db.delete(shootReviews).where(eq(shootReviews.id, "test-shoot-review-1"));
  await db.delete(adminMessages).where(eq(adminMessages.conversationId, TEST_ADMIN_CONV));
  await db.delete(adminConversations).where(eq(adminConversations.id, TEST_ADMIN_CONV));

  for (const id of [TEST_EDIT_REQ_COMPLETED, TEST_EDIT_REQ_INPROGRESS, TEST_EDIT_REQ_PENDING]) {
    await db.delete(editRequestMessages).where(eq(editRequestMessages.editRequestId, id));
    await db.delete(editRequestPhotos).where(eq(editRequestPhotos.editRequestId, id));
  }
  await db.delete(editRequests).where(eq(editRequests.id, TEST_EDIT_REQ_COMPLETED));
  await db.delete(editRequests).where(eq(editRequests.id, TEST_EDIT_REQ_INPROGRESS));
  await db.delete(editRequests).where(eq(editRequests.id, TEST_EDIT_REQ_PENDING));

  await db.delete(tokenTransactions).where(eq(tokenTransactions.id, "test-txn-1"));
  await db.delete(tokenTransactions).where(eq(tokenTransactions.id, "test-txn-2"));
  await db.delete(tokenTransactions).where(eq(tokenTransactions.id, "test-txn-3"));
  await db.delete(editTokens).where(eq(editTokens.id, "test-edit-token-record"));

  for (const id of [TEST_SHOOT_COMPLETED, TEST_SHOOT_UPCOMING, TEST_SHOOT_INPROGRESS]) {
    await db.delete(shootMessages).where(eq(shootMessages.shootId, id));
  }
  await db.delete(imageFavorites).where(eq(imageFavorites.id, "test-fav-1"));
  await db.delete(imageFavorites).where(eq(imageFavorites.id, "test-fav-2"));
  await db.delete(imageFavorites).where(eq(imageFavorites.id, "test-fav-3"));
  for (const id of [...IMG_IDS, ...LIFESTYLE_IMG_IDS]) { await db.delete(galleryImages).where(eq(galleryImages.id, id)); }
  await db.delete(galleryFolders).where(eq(galleryFolders.id, TEST_FOLDER_FAVORITES));
  await db.delete(galleryFolders).where(eq(galleryFolders.id, TEST_FOLDER_OUTDOOR));
  await db.delete(shoots).where(eq(shoots.id, TEST_SHOOT_COMPLETED));
  await db.delete(shoots).where(eq(shoots.id, TEST_SHOOT_UPCOMING));
  await db.delete(shoots).where(eq(shoots.id, TEST_SHOOT_INPROGRESS));

  // Space messages
  for (const id of ["test-spm-1", "test-spm-2", "test-spm-3", "test-spm-4", "test-spm-5"]) {
    await db.delete(spaceMessages).where(eq(spaceMessages.id, id));
  }

  for (const id of [TEST_BOOKING_UPCOMING, TEST_BOOKING_COMPLETED, TEST_BOOKING_CHECKEDIN, TEST_BOOKING_CANCELLED, TEST_HOST_BOOKING_1, TEST_HOST_BOOKING_2]) {
    await db.delete(spaceBookings).where(eq(spaceBookings.id, id));
  }

  // Host space
  await db.delete(spaces).where(eq(spaces.id, TEST_HOST_SPACE));

  // Space favorites
  for (const id of ["test-space-fav-1", "test-space-fav-2", "test-space-fav-3"]) {
    await db.delete(spaceFavorites).where(eq(spaceFavorites.id, id));
  }

  // Wishlist items + collections
  for (const id of ["test-wl-item-1", "test-wl-item-2", "test-wl-item-3"]) {
    await db.delete(wishlistItems).where(eq(wishlistItems.id, id));
  }
  await db.delete(wishlistCollections).where(eq(wishlistCollections.id, TEST_WISHLIST_1));
  await db.delete(wishlistCollections).where(eq(wishlistCollections.id, TEST_WISHLIST_2));

  await seedTestClient();
}
