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
  spaceBookings,
  shootReviews,
  spaceReviews,
} from "@shared/schema";
import { eq } from "drizzle-orm";

// Fixed IDs for idempotent seeding
const DEMO_USER_ID = "demo-client-maria-santos";
const DEMO_SHOOT_COMPLETED = "demo-shoot-brand-refresh";
const DEMO_SHOOT_UPCOMING = "demo-shoot-office-portraits";
const DEMO_SHOOT_INPROGRESS = "demo-shoot-lifestyle-content";
const DEMO_FOLDER_FAVORITES = "demo-folder-favorites";
const DEMO_FOLDER_OUTDOOR = "demo-folder-outdoor";
const DEMO_EDIT_REQ_COMPLETED = "demo-edit-request-completed";
const DEMO_EDIT_REQ_INPROGRESS = "demo-edit-request-inprogress";
const DEMO_EDIT_REQ_PENDING = "demo-edit-request-pending";
const DEMO_ADMIN_CONV = "demo-admin-conversation";
const DEMO_BOOKING_UPCOMING = "demo-booking-upcoming";
const DEMO_BOOKING_COMPLETED = "demo-booking-completed";
const DEMO_BOOKING_CHECKEDIN = "demo-booking-checkedin";
const DEMO_BOOKING_CANCELLED = "demo-booking-cancelled";

// Gallery image IDs
const IMG_IDS = [
  "demo-gallery-img-001",
  "demo-gallery-img-002",
  "demo-gallery-img-003",
  "demo-gallery-img-004",
  "demo-gallery-img-005",
  "demo-gallery-img-006",
  "demo-gallery-img-007",
  "demo-gallery-img-008",
  "demo-gallery-img-009",
  "demo-gallery-img-010",
  "demo-gallery-img-011",
  "demo-gallery-img-012",
];

// Reusable portfolio images
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
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}

function pastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

function pastTimestamp(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function futureTimestamp(daysFromNow: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

export async function seedDemoClientIfEmpty() {
  // Check if demo user already exists
  const [existing] = await db.select().from(users).where(eq(users.id, DEMO_USER_ID));
  if (existing) return;

  console.log("Seeding demo client: Maria Santos...");

  // 1. Create demo user
  await db.insert(users).values({
    id: DEMO_USER_ID,
    email: "maria.santos.demo@alignworkspaces.com",
    firstName: "Maria",
    lastName: "Santos",
    profileImageUrl: IMAGES.portrait1,
    defaultPortalTab: "shoots",
    notificationPreferences: {
      pushMessages: true,
      pushBookings: true,
      emailMessages: true,
      emailBookings: true,
    },
  });

  // 2. Create shoots
  await db.insert(shoots).values([
    {
      id: DEMO_SHOOT_COMPLETED,
      userId: DEMO_USER_ID,
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
      id: DEMO_SHOOT_UPCOMING,
      userId: DEMO_USER_ID,
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
      id: DEMO_SHOOT_INPROGRESS,
      userId: DEMO_USER_ID,
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

  // 3. Create gallery folders for completed shoot
  await db.insert(galleryFolders).values([
    {
      id: DEMO_FOLDER_FAVORITES,
      shootId: DEMO_SHOOT_COMPLETED,
      name: "Favorites",
      sortOrder: 0,
    },
    {
      id: DEMO_FOLDER_OUTDOOR,
      shootId: DEMO_SHOOT_COMPLETED,
      name: "Outdoor Session",
      sortOrder: 1,
    },
  ]);

  // 4. Create gallery images for completed shoot
  await db.insert(galleryImages).values([
    // Favorites folder
    { id: IMG_IDS[0], shootId: DEMO_SHOOT_COMPLETED, folderId: DEMO_FOLDER_FAVORITES, imageUrl: IMAGES.portrait1, thumbnailUrl: IMAGES.portrait1, originalFilename: "Maria_BrandRefresh_001.jpg", sortOrder: 0 },
    { id: IMG_IDS[1], shootId: DEMO_SHOOT_COMPLETED, folderId: DEMO_FOLDER_FAVORITES, imageUrl: IMAGES.portrait2, thumbnailUrl: IMAGES.portrait2, originalFilename: "Maria_BrandRefresh_002.jpg", sortOrder: 1 },
    { id: IMG_IDS[2], shootId: DEMO_SHOOT_COMPLETED, folderId: DEMO_FOLDER_FAVORITES, imageUrl: IMAGES.urbanAssuredBright, thumbnailUrl: IMAGES.urbanAssuredBright, originalFilename: "Maria_BrandRefresh_003.jpg", sortOrder: 2 },
    // Outdoor Session folder
    { id: IMG_IDS[3], shootId: DEMO_SHOOT_COMPLETED, folderId: DEMO_FOLDER_OUTDOOR, imageUrl: IMAGES.urbanAssuredBright2, thumbnailUrl: IMAGES.urbanAssuredBright2, originalFilename: "Maria_Outdoor_001.jpg", sortOrder: 0 },
    { id: IMG_IDS[4], shootId: DEMO_SHOOT_COMPLETED, folderId: DEMO_FOLDER_OUTDOOR, imageUrl: IMAGES.urbanConfidenceBright, thumbnailUrl: IMAGES.urbanConfidenceBright, originalFilename: "Maria_Outdoor_002.jpg", sortOrder: 1 },
    { id: IMG_IDS[5], shootId: DEMO_SHOOT_COMPLETED, folderId: DEMO_FOLDER_OUTDOOR, imageUrl: IMAGES.officeAssuredCozy, thumbnailUrl: IMAGES.officeAssuredCozy, originalFilename: "Maria_Outdoor_003.jpg", sortOrder: 2 },
    { id: IMG_IDS[6], shootId: DEMO_SHOOT_COMPLETED, folderId: DEMO_FOLDER_OUTDOOR, imageUrl: IMAGES.officeAssuredBright2, thumbnailUrl: IMAGES.officeAssuredBright2, originalFilename: "Maria_Outdoor_004.jpg", sortOrder: 3 },
    { id: IMG_IDS[7], shootId: DEMO_SHOOT_COMPLETED, folderId: DEMO_FOLDER_OUTDOOR, imageUrl: IMAGES.officeAssuredBright3, thumbnailUrl: IMAGES.officeAssuredBright3, originalFilename: "Maria_Outdoor_005.jpg", sortOrder: 4 },
    // Unfiled images
    { id: IMG_IDS[8], shootId: DEMO_SHOOT_COMPLETED, folderId: null, imageUrl: IMAGES.portrait1, thumbnailUrl: IMAGES.portrait1, originalFilename: "Maria_Extra_001.jpg", sortOrder: 0 },
    { id: IMG_IDS[9], shootId: DEMO_SHOOT_COMPLETED, folderId: null, imageUrl: IMAGES.portrait2, thumbnailUrl: IMAGES.portrait2, originalFilename: "Maria_Extra_002.jpg", sortOrder: 1 },
    { id: IMG_IDS[10], shootId: DEMO_SHOOT_COMPLETED, folderId: null, imageUrl: IMAGES.urbanAssuredBright, thumbnailUrl: IMAGES.urbanAssuredBright, originalFilename: "Maria_Extra_003.jpg", sortOrder: 2 },
    { id: IMG_IDS[11], shootId: DEMO_SHOOT_COMPLETED, folderId: null, imageUrl: IMAGES.urbanConfidenceBright, thumbnailUrl: IMAGES.urbanConfidenceBright, originalFilename: "Maria_Extra_004.jpg", sortOrder: 3 },
  ]);

  // 5. Create image favorites
  await db.insert(imageFavorites).values([
    { id: "demo-fav-1", userId: DEMO_USER_ID, imageId: IMG_IDS[0] },
    { id: "demo-fav-2", userId: DEMO_USER_ID, imageId: IMG_IDS[1] },
    { id: "demo-fav-3", userId: DEMO_USER_ID, imageId: IMG_IDS[4] },
  ]);

  // 6. Create edit tokens
  await db.insert(editTokens).values({
    id: "demo-edit-token-record",
    userId: DEMO_USER_ID,
    annualTokens: 1,
    purchasedTokens: 2,
    annualTokenResetDate: futureTimestamp(320),
    lastPhotoshootDate: pastTimestamp(45),
  });

  // 7. Create token transactions
  await db.insert(tokenTransactions).values([
    { id: "demo-txn-1", userId: DEMO_USER_ID, type: "annual_grant", amount: 2, description: "Annual retouching sessions granted", createdAt: pastTimestamp(365) },
    { id: "demo-txn-2", userId: DEMO_USER_ID, type: "purchase", amount: 2, description: "Purchased 2 extra retouching sessions", createdAt: pastTimestamp(60) },
    { id: "demo-txn-3", userId: DEMO_USER_ID, type: "usage", amount: -1, description: "Used for Spring Brand Refresh edit request", createdAt: pastTimestamp(40) },
  ]);

  // 8. Create edit requests
  await db.insert(editRequests).values([
    {
      id: DEMO_EDIT_REQ_COMPLETED,
      userId: DEMO_USER_ID,
      shootId: DEMO_SHOOT_COMPLETED,
      photoCount: 2,
      annualTokensUsed: 1,
      purchasedTokensUsed: 0,
      notes: "Please brighten the outdoor shots and smooth skin tones. I'd love a warm, golden-hour feel.",
      status: "completed",
      createdAt: pastTimestamp(40),
    },
    {
      id: DEMO_EDIT_REQ_INPROGRESS,
      userId: DEMO_USER_ID,
      shootId: DEMO_SHOOT_COMPLETED,
      photoCount: 1,
      annualTokensUsed: 0,
      purchasedTokensUsed: 1,
      notes: "Can you remove the background distractions and add a subtle vignette?",
      status: "in-progress",
      createdAt: pastTimestamp(10),
    },
    {
      id: DEMO_EDIT_REQ_PENDING,
      userId: DEMO_USER_ID,
      shootId: DEMO_SHOOT_INPROGRESS,
      photoCount: 1,
      annualTokensUsed: 0,
      purchasedTokensUsed: 1,
      notes: "Light color grading to match my brand palette — warm tones, muted greens.",
      status: "pending",
      createdAt: pastTimestamp(3),
    },
  ]);

  // 9. Create edit request photos
  await db.insert(editRequestPhotos).values([
    // Completed request — has before/after
    { id: "demo-erp-1", editRequestId: DEMO_EDIT_REQ_COMPLETED, imageUrl: IMAGES.urbanAssuredBright2, originalFilename: "Maria_edit_001.jpg", finishedImageUrl: IMAGES.urbanAssuredBright, finishedFilename: "Maria_edit_001_final.jpg" },
    { id: "demo-erp-2", editRequestId: DEMO_EDIT_REQ_COMPLETED, imageUrl: IMAGES.officeAssuredCozy, originalFilename: "Maria_edit_002.jpg", finishedImageUrl: IMAGES.officeAssuredBright2, finishedFilename: "Maria_edit_002_final.jpg" },
    // In-progress request — no finished yet
    { id: "demo-erp-3", editRequestId: DEMO_EDIT_REQ_INPROGRESS, imageUrl: IMAGES.urbanConfidenceBright, originalFilename: "Maria_vignette_001.jpg" },
    // Pending request — no finished yet
    { id: "demo-erp-4", editRequestId: DEMO_EDIT_REQ_PENDING, imageUrl: IMAGES.portrait2, originalFilename: "Maria_colorgrade_001.jpg" },
  ]);

  // 10. Create edit request messages
  await db.insert(editRequestMessages).values([
    // Completed request thread
    { id: "demo-erm-1", editRequestId: DEMO_EDIT_REQ_COMPLETED, senderId: DEMO_USER_ID, senderRole: "client", senderName: "Maria Santos", message: "Hi! I submitted these two photos. Can you brighten them and add a warm tone?", createdAt: pastTimestamp(40) },
    { id: "demo-erm-2", editRequestId: DEMO_EDIT_REQ_COMPLETED, senderId: "admin", senderRole: "admin", senderName: "Armando R.", message: "Absolutely, Maria! I'll have these ready within 48 hours. The outdoor shots will look gorgeous with that golden-hour warmth.", createdAt: pastTimestamp(39) },
    { id: "demo-erm-3", editRequestId: DEMO_EDIT_REQ_COMPLETED, senderId: DEMO_USER_ID, senderRole: "client", senderName: "Maria Santos", message: "Thank you so much! Can't wait to see them.", createdAt: pastTimestamp(39) },
    { id: "demo-erm-4", editRequestId: DEMO_EDIT_REQ_COMPLETED, senderId: "admin", senderRole: "admin", senderName: "Armando R.", message: "All done! Take a look and let me know if you'd like any tweaks.", createdAt: pastTimestamp(37) },
    { id: "demo-erm-5", editRequestId: DEMO_EDIT_REQ_COMPLETED, senderId: DEMO_USER_ID, senderRole: "client", senderName: "Maria Santos", message: "These are perfect, exactly the vibe I wanted! Thank you!", createdAt: pastTimestamp(37) },
    // In-progress request thread
    { id: "demo-erm-6", editRequestId: DEMO_EDIT_REQ_INPROGRESS, senderId: DEMO_USER_ID, senderRole: "client", senderName: "Maria Santos", message: "For this one, I'd love a clean look — remove the people walking in the background if possible.", createdAt: pastTimestamp(10) },
    { id: "demo-erm-7", editRequestId: DEMO_EDIT_REQ_INPROGRESS, senderId: "admin", senderRole: "admin", senderName: "Armando R.", message: "Got it! I'll clean up the background and add a subtle vignette. Should have this back to you in a couple days.", createdAt: pastTimestamp(9) },
  ]);

  // 11. Create shoot messages
  await db.insert(shootMessages).values([
    { id: "demo-sm-1", shootId: DEMO_SHOOT_COMPLETED, senderId: DEMO_USER_ID, senderRole: "client", senderName: "Maria Santos", message: "Looking forward to the session! Should I bring any props?", createdAt: pastTimestamp(50) },
    { id: "demo-sm-2", shootId: DEMO_SHOOT_COMPLETED, senderId: "admin", senderRole: "admin", senderName: "Armando R.", message: "Just yourself and a couple of outfit changes! I'll have everything set up at the garden. We'll start with the shaded paths while the light is soft.", createdAt: pastTimestamp(49) },
    { id: "demo-sm-3", shootId: DEMO_SHOOT_COMPLETED, senderId: DEMO_USER_ID, senderRole: "client", senderName: "Maria Santos", message: "Perfect! I'll bring a flowy dress and a casual outfit. See you there!", createdAt: pastTimestamp(49) },
    { id: "demo-sm-4", shootId: DEMO_SHOOT_COMPLETED, senderId: "admin", senderRole: "admin", senderName: "Armando R.", message: "Loved the shoot today, Maria! Gallery will be ready in about a week. You were a natural!", createdAt: pastTimestamp(45) },
    // Upcoming shoot thread
    { id: "demo-sm-5", shootId: DEMO_SHOOT_UPCOMING, senderId: "admin", senderRole: "admin", senderName: "Armando R.", message: "Your headshot session is confirmed! We'll use the studio with classic backdrops. Any color preferences for the background?", createdAt: pastTimestamp(14) },
    { id: "demo-sm-6", shootId: DEMO_SHOOT_UPCOMING, senderId: DEMO_USER_ID, senderRole: "client", senderName: "Maria Santos", message: "I think a warm neutral or soft gray would be great. Something clean and professional.", createdAt: pastTimestamp(13) },
  ]);

  // 12. Create admin conversation
  await db.insert(adminConversations).values({
    id: DEMO_ADMIN_CONV,
    clientId: DEMO_USER_ID,
    createdAt: pastTimestamp(60),
  });

  // 13. Create admin messages
  await db.insert(adminMessages).values([
    { id: "demo-am-1", conversationId: DEMO_ADMIN_CONV, senderId: "admin", senderRole: "admin", senderName: "Armando R.", message: "Welcome to your Align Workspaces portal, Maria! I'm here if you have any questions about your shoots, edits, or anything else.", createdAt: pastTimestamp(60) },
    { id: "demo-am-2", conversationId: DEMO_ADMIN_CONV, senderId: DEMO_USER_ID, senderRole: "client", senderName: "Maria Santos", message: "Thank you, Armando! I'm so excited about working together. Quick question — how do the retouching sessions work?", createdAt: pastTimestamp(58) },
    { id: "demo-am-3", conversationId: DEMO_ADMIN_CONV, senderId: "admin", senderRole: "admin", senderName: "Armando R.", message: "Great question! You get 2 complimentary retouching sessions per year, and you can buy extras anytime. Just go to the Edits tab to submit photos. Each session covers one photo with professional retouching.", createdAt: pastTimestamp(57) },
    { id: "demo-am-4", conversationId: DEMO_ADMIN_CONV, senderId: DEMO_USER_ID, senderRole: "client", senderName: "Maria Santos", message: "That's perfect, thank you! And I love the space booking feature — I've been looking for a therapy office for my Saturday clients.", createdAt: pastTimestamp(55) },
    { id: "demo-am-5", conversationId: DEMO_ADMIN_CONV, senderId: "admin", senderRole: "admin", senderName: "Armando R.", message: "The Coral Gables Therapy Suite would be perfect for that! Beautiful space with great natural light. Let me know if you need help with anything.", createdAt: pastTimestamp(54) },
  ]);

  // 14. Create space bookings
  await db.insert(spaceBookings).values([
    {
      id: DEMO_BOOKING_UPCOMING,
      spaceId: "sample-space-maria-host",
      userId: DEMO_USER_ID,
      userName: "Maria Santos",
      userEmail: "maria.santos.demo@alignworkspaces.com",
      status: "confirmed",
      bookingDate: futureDate(10),
      bookingStartTime: "10:00",
      bookingHours: 2,
      paymentStatus: "paid",
      paymentAmount: 7000,
      feeTier: "standard",
      guestFeeAmount: 490,
      taxAmount: 490,
      totalGuestCharged: 7980,
      hostPayoutAmount: 6125,
      platformRevenue: 1365,
      message: "Saturday therapy sessions — thank you!",
      createdAt: pastTimestamp(7),
    },
    {
      id: DEMO_BOOKING_COMPLETED,
      spaceId: "sample-space-armando-host",
      userId: DEMO_USER_ID,
      userName: "Maria Santos",
      userEmail: "maria.santos.demo@alignworkspaces.com",
      status: "completed",
      bookingDate: pastDate(20),
      bookingStartTime: "09:00",
      bookingHours: 3,
      paymentStatus: "paid",
      paymentAmount: 19500,
      feeTier: "standard",
      guestFeeAmount: 1365,
      taxAmount: 1365,
      totalGuestCharged: 22230,
      hostPayoutAmount: 17063,
      platformRevenue: 3802,
      checkedInAt: pastTimestamp(20),
      checkedOutAt: pastTimestamp(20),
      checkedInBy: "guest",
      checkedOutBy: "guest",
      message: "Need the studio for my brand content shoot!",
      createdAt: pastTimestamp(25),
    },
    {
      id: DEMO_BOOKING_CHECKEDIN,
      spaceId: "0ea55148-29d6-41dd-8428-2540b89c34ae",
      userId: DEMO_USER_ID,
      userName: "Maria Santos",
      userEmail: "maria.santos.demo@alignworkspaces.com",
      status: "confirmed",
      bookingDate: pastDate(0),
      bookingStartTime: "11:00",
      bookingHours: 2,
      paymentStatus: "paid",
      paymentAmount: 10000,
      feeTier: "repeat_guest",
      guestFeeAmount: 500,
      taxAmount: 700,
      totalGuestCharged: 11200,
      hostPayoutAmount: 8750,
      platformRevenue: 1750,
      checkedInAt: pastTimestamp(0),
      checkedInBy: "guest",
      message: "Yoga and meditation pop-up event",
      createdAt: pastTimestamp(5),
    },
    {
      id: DEMO_BOOKING_CANCELLED,
      spaceId: "sample-space-maria-host",
      userId: DEMO_USER_ID,
      userName: "Maria Santos",
      userEmail: "maria.santos.demo@alignworkspaces.com",
      status: "cancelled",
      bookingDate: pastDate(10),
      bookingStartTime: "14:00",
      bookingHours: 1,
      paymentStatus: "refunded",
      paymentAmount: 3500,
      refundStatus: "full",
      refundAmount: 3500,
      message: "Need to reschedule — something came up.",
      createdAt: pastTimestamp(15),
    },
  ]);

  // 15. Create shoot review
  await db.insert(shootReviews).values({
    id: "demo-shoot-review-1",
    shootId: DEMO_SHOOT_COMPLETED,
    clientId: DEMO_USER_ID,
    clientName: "Maria Santos",
    rating: 5,
    title: "Absolutely stunning results",
    comment: "Armando captured exactly the mood I was looking for. The outdoor shots in the garden were breathtaking, and he made the entire experience so comfortable and fun. The photos exceeded my expectations — I've already used them across all my social media. Highly recommend!",
    status: "published",
    createdAt: pastTimestamp(35),
  });

  // 16. Create space review
  await db.insert(spaceReviews).values({
    id: "demo-space-review-1",
    spaceId: "sample-space-armando-host",
    bookingId: DEMO_BOOKING_COMPLETED,
    guestId: DEMO_USER_ID,
    guestName: "Maria Santos",
    rating: 5,
    title: "Perfect creative studio",
    comment: "The Align Creative Studio was exactly what I needed for my brand shoot. Professional lighting was already set up, the space was spotless, and the client lounge was a nice touch for outfit changes. Will definitely book again!",
    hostResponse: "Thank you, Maria! It was wonderful having you at the studio. Looking forward to your next session!",
    hostRespondedAt: pastTimestamp(18),
    status: "published",
    createdAt: pastTimestamp(19),
  });

  console.log("Demo client seeded successfully: Maria Santos");
}

export async function reseedDemoClient() {
  console.log("Re-seeding demo client...");

  // Delete in reverse dependency order
  await db.delete(spaceReviews).where(eq(spaceReviews.id, "demo-space-review-1"));
  await db.delete(shootReviews).where(eq(shootReviews.id, "demo-shoot-review-1"));
  await db.delete(adminMessages).where(eq(adminMessages.conversationId, DEMO_ADMIN_CONV));
  await db.delete(adminConversations).where(eq(adminConversations.id, DEMO_ADMIN_CONV));

  for (const id of [DEMO_EDIT_REQ_COMPLETED, DEMO_EDIT_REQ_INPROGRESS, DEMO_EDIT_REQ_PENDING]) {
    await db.delete(editRequestMessages).where(eq(editRequestMessages.editRequestId, id));
    await db.delete(editRequestPhotos).where(eq(editRequestPhotos.editRequestId, id));
  }
  await db.delete(editRequests).where(eq(editRequests.userId, DEMO_USER_ID));

  await db.delete(tokenTransactions).where(eq(tokenTransactions.userId, DEMO_USER_ID));
  await db.delete(editTokens).where(eq(editTokens.userId, DEMO_USER_ID));

  for (const id of [DEMO_SHOOT_COMPLETED, DEMO_SHOOT_UPCOMING, DEMO_SHOOT_INPROGRESS]) {
    await db.delete(shootMessages).where(eq(shootMessages.shootId, id));
    await db.delete(imageFavorites).where(eq(imageFavorites.userId, DEMO_USER_ID));
    await db.delete(galleryImages).where(eq(galleryImages.shootId, id));
    await db.delete(galleryFolders).where(eq(galleryFolders.shootId, id));
  }
  await db.delete(shoots).where(eq(shoots.userId, DEMO_USER_ID));

  await db.delete(spaceBookings).where(eq(spaceBookings.userId, DEMO_USER_ID));

  await db.delete(users).where(eq(users.id, DEMO_USER_ID));

  // Re-insert everything
  await seedDemoClientIfEmpty();
}
