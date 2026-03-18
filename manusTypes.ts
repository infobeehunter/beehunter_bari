import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  double,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow with gamification fields.
 */
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }).unique(),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["user", "partner", "admin"]).default("user").notNull(),
    xpTotal: int("xpTotal").default(0).notNull(),
    premiumUntil: timestamp("premiumUntil"),
    streakDays: int("streakDays").default(0).notNull(),
    lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
    gdprConsent: boolean("gdprConsent").default(false).notNull(),
    marketingConsent: boolean("marketingConsent").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  (table) => ({
    openIdIdx: uniqueIndex("openId_idx").on(table.openId),
    emailIdx: index("email_idx").on(table.email),
    roleIdx: index("role_idx").on(table.role),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Partner commerciale (ristorante, hotel, tour operator, etc.)
 */
export const partners = mysqlTable(
  "partners",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    businessName: varchar("businessName", { length: 255 }).notNull(),
    category: mysqlEnum("category", ["Restaurant", "Hotel", "TourOperator", "Shop", "Other"]).notNull(),
    description: text("description"),
    location: varchar("location", { length: 255 }),
    latitude: double("latitude"),
    longitude: double("longitude"),
    contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    website: varchar("website", { length: 255 }),
    verified: boolean("verified").default(false).notNull(),
    stripeAccountId: varchar("stripeAccountId", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("partners_userId_idx").on(table.userId),
    verifiedIdx: index("partners_verified_idx").on(table.verified),
  })
);

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;

/**
 * Points of Interest (POI) - Punti di interesse di Bari
 */
export const poi = mysqlTable(
  "poi",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    category: mysqlEnum("category", ["Cultura", "Natura", "Food", "Eventi", "Segreto"]).notNull(),
    description: text("description"),
    latitude: double("latitude").notNull(),
    longitude: double("longitude").notNull(),
    xpReward: int("xpReward").default(100).notNull(),
    imageUrl: varchar("imageUrl", { length: 512 }),
    qrCode: varchar("qrCode", { length: 512 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("poi_category_idx").on(table.category),
    nameIdx: index("poi_name_idx").on(table.name),
  })
);

export type POI = typeof poi.$inferSelect;
export type InsertPOI = typeof poi.$inferInsert;

/**
 * User XP tracking - Traccia guadagni XP per ogni utente
 */
export const userXp = mysqlTable(
  "userXp",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    poiId: int("poiId"),
    xpAmount: int("xpAmount").notNull(),
    source: mysqlEnum("source", ["checkIn", "challenge", "referral", "badge", "bonus"]).notNull(),
    description: varchar("description", { length: 255 }),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userXp_userId_idx").on(table.userId),
    poiIdIdx: index("userXp_poiId_idx").on(table.poiId),
    timestampIdx: index("userXp_timestamp_idx").on(table.timestamp),
  })
);

export type UserXp = typeof userXp.$inferSelect;
export type InsertUserXp = typeof userXp.$inferInsert;

/**
 * Badge definitions - Definisce i badge collezionabili
 */
export const badges = mysqlTable(
  "badges",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    description: text("description"),
    icon: varchar("icon", { length: 512 }),
    requirement: varchar("requirement", { length: 255 }).notNull(),
    tier: mysqlEnum("tier", ["bronze", "silver", "gold", "platinum"]).default("bronze").notNull(),
    xpReward: int("xpReward").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: uniqueIndex("badges_name_idx").on(table.name),
  })
);

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

/**
 * User badges - Associazione molti-a-molti tra utenti e badge
 */
export const userBadges = mysqlTable(
  "userBadges",
  {
    userId: int("userId").notNull(),
    badgeId: int("badgeId").notNull(),
    unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  },
  (table) => ({
    userBadgeIdx: index("userBadges_userId_badgeId_idx").on(table.userId, table.badgeId),
  })
);

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

/**
 * Coupon - Coupon gestiti dai partner
 */
export const coupon = mysqlTable(
  "coupon",
  {
    id: int("id").autoincrement().primaryKey(),
    partnerId: int("partnerId").notNull(),
    code: varchar("code", { length: 64 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    discount: varchar("discount", { length: 64 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    redeemCount: int("redeemCount").default(0).notNull(),
    maxRedeems: int("maxRedeems"),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    partnerIdIdx: index("coupon_partnerId_idx").on(table.partnerId),
    codeIdx: uniqueIndex("coupon_code_idx").on(table.code),
    expiresAtIdx: index("coupon_expiresAt_idx").on(table.expiresAt),
  })
);

export type Coupon = typeof coupon.$inferSelect;
export type InsertCoupon = typeof coupon.$inferInsert;

/**
 * Coupon redemptions - Traccia i riscatti di coupon
 */
export const couponRedemptions = mysqlTable(
  "couponRedemptions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    couponId: int("couponId").notNull(),
    redeemedAt: timestamp("redeemedAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("couponRedemptions_userId_idx").on(table.userId),
    couponIdIdx: index("couponRedemptions_couponId_idx").on(table.couponId),
  })
);

export type CouponRedemption = typeof couponRedemptions.$inferSelect;
export type InsertCouponRedemption = typeof couponRedemptions.$inferInsert;

/**
 * Tour - Esperienze prenotabili
 */
export const tours = mysqlTable(
  "tours",
  {
    id: int("id").autoincrement().primaryKey(),
    partnerId: int("partnerId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    duration: int("duration"),
    maxParticipants: int("maxParticipants"),
    imageUrl: varchar("imageUrl", { length: 512 }),
    schedule: json("schedule"),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    partnerIdIdx: index("tours_partnerId_idx").on(table.partnerId),
    activeIdx: index("tours_active_idx").on(table.active),
  })
);

export type Tour = typeof tours.$inferSelect;
export type InsertTour = typeof tours.$inferInsert;

/**
 * Booking - Prenotazioni tour
 */
export const bookings = mysqlTable(
  "bookings",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    tourId: int("tourId").notNull(),
    stripePaymentId: varchar("stripePaymentId", { length: 255 }),
    status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"]).default("pending").notNull(),
    participants: int("participants").default(1).notNull(),
    totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("bookings_userId_idx").on(table.userId),
    tourIdIdx: index("bookings_tourId_idx").on(table.tourId),
    statusIdx: index("bookings_status_idx").on(table.status),
  })
);

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Notification - Log notifiche push
 */
export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message"),
    type: mysqlEnum("type", ["poi", "challenge", "event", "booking", "system"]).notNull(),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("notifications_userId_idx").on(table.userId),
    readIdx: index("notifications_read_idx").on(table.read),
  })
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Challenge - Sfide settimanali/mensili
 */
export const challenges = mysqlTable(
  "challenges",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    objective: varchar("objective", { length: 255 }).notNull(),
    xpReward: int("xpReward").default(100).notNull(),
    startDate: timestamp("startDate").notNull(),
    endDate: timestamp("endDate").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index("challenges_active_idx").on(table.active),
    startDateIdx: index("challenges_startDate_idx").on(table.startDate),
  })
);

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;

/**
 * User challenge participation
 */
export const userChallenges = mysqlTable(
  "userChallenges",
  {
    userId: int("userId").notNull(),
    challengeId: int("challengeId").notNull(),
    progress: int("progress").default(0).notNull(),
    completed: boolean("completed").default(false).notNull(),
    completedAt: timestamp("completedAt"),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  },
  (table) => ({
    userChallengeIdx: index("userChallenges_userId_challengeId_idx").on(table.userId, table.challengeId),
  })
);

export type UserChallenge = typeof userChallenges.$inferSelect;
export type InsertUserChallenge = typeof userChallenges.$inferInsert;

/**
 * GDPR Consent tracking
 */
export const gdprConsents = mysqlTable(
  "gdprConsents",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    consentType: mysqlEnum("consentType", ["privacy", "marketing", "analytics", "cookies"]).notNull(),
    granted: boolean("granted").notNull(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("gdprConsents_userId_idx").on(table.userId),
  })
);

export type GdprConsent = typeof gdprConsents.$inferSelect;
export type InsertGdprConsent = typeof gdprConsents.$inferInsert;

/**
 * Audit log per operazioni sensibili
 */
export const auditLog = mysqlTable(
  "auditLog",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    action: varchar("action", { length: 255 }).notNull(),
    resource: varchar("resource", { length: 255 }).notNull(),
    details: json("details"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("auditLog_userId_idx").on(table.userId),
    actionIdx: index("auditLog_action_idx").on(table.action),
    timestampIdx: index("auditLog_timestamp_idx").on(table.timestamp),
  })
);

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

/**
 * Device tokens per push notifications
 */
export const deviceTokens = mysqlTable(
  "deviceTokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    token: varchar("token", { length: 512 }).notNull().unique(),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("deviceTokens_userId_idx").on(table.userId),
    tokenIdx: uniqueIndex("deviceTokens_token_idx").on(table.token),
  })
);

export type DeviceToken = typeof deviceTokens.$inferSelect;
export type InsertDeviceToken = typeof deviceTokens.$inferInsert;

/**
 * Social shares tracking
 */
export const socialShares = mysqlTable(
  "socialShares",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    platform: mysqlEnum("platform", ["instagram", "tiktok", "twitter", "facebook"]).notNull(),
    content: varchar("content", { length: 255 }),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("socialShares_userId_idx").on(table.userId),
    platformIdx: index("socialShares_platform_idx").on(table.platform),
  })
);

export type SocialShare = typeof socialShares.$inferSelect;
export type InsertSocialShare = typeof socialShares.$inferInsert;
