export type BoardType = "faculty" | "club" | "general";

export type YearLevel = 1 | 2 | 3 | 4 | 5 | 6 | "postgraduate";

export type PremiumStatus = "free" | "premium";

export type AssessmentType =
  | "assignment"
  | "quiz"
  | "exam"
  | "project"
  | "mixed";

export type StickerPackPricing = "free" | "paid";

export interface User {
  id: string;
  nickname: string;
  verifiedUniversityEmail: string;
  university: string;
  campus: string;
  faculty: string;
  year: YearLevel;
  isPremium: boolean;
  premiumStatus: PremiumStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  university: string;
  type: BoardType;
  title: string;
  description: string;
  faculty?: string;
  clubName?: string;
  memberCount: number;
  createdByUserId: string;
  createdAt: string;
}

export interface Post {
  id: string;
  boardId: string;
  authorUserId: string;
  title: string;
  body: string;
  upvoteCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorUserId: string;
  body: string;
  parentCommentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectReview {
  id: string;
  subjectCode: string;
  subjectName: string;
  university: string;
  campus?: string;
  assessmentType: AssessmentType;
  assignmentCount: number;
  hasGroupProject: boolean;
  prerequisites: string[];
  reviewerUserId: string;
  rating: number;
  summary: string;
  createdAt: string;
}

export interface StickerPack {
  id: string;
  creatorUserId: string;
  title: string;
  description: string;
  pricing: StickerPackPricing;
  priceCents?: number;
  currency: "AUD";
  commissionSplit: {
    creatorPercent: number;
    platformPercent: number;
  };
  assetUrls: string[];
  createdAt: string;
}

export interface JobListing {
  id: string;
  employerName: string;
  title: string;
  description: string;
  location: string;
  applyUrl?: string;
  premiumOnly: true;
  postedByUserId: string;
  createdAt: string;
  expiresAt?: string;
}

export interface DirectMessageThread {
  id: string;
  participantUserIds: [string, string];
  lastMessageAt: string;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  threadId: string;
  senderUserId: string;
  recipientUserId: string;
  body: string;
  sentAt: string;
  readAt?: string;
}