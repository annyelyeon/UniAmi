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

export interface Subject {
  code: string;
  title: string;
  averageRating: number;
  reviewCount: number;
  assessmentType: AssessmentType;
  numAssignments: number;
  groupProjectRequired: boolean;
  groupSize?: number;
  prerequisites: string[];
}

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
  postCount: number;
  stickerPacksOwned: number;
  joinedClubs: string[];
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
  authorId: string;
  boardName: string;
  university: string;
  content: string;
  upvoteCount: number;
  commentCount: number;
  createdAt: string;
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
  subjectCode: string;
  authorId: string;
  text: string;
}

export interface TimetableEntry {
  subjectCode: string;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
  colorTag: string;
}

export interface Note {
  title: string;
  body: string;
  categoryIcon?: string;
  attachedStickerPack?: string;
}

export interface StickerPack {
  id: string;
  name: string;
  stickerCount: number;
  priceAUD: number | null;
  creatorId: string | null;
  isFree: boolean;
}

export interface JobListing {
  id: string;
  employerName: string;
  title: string;
  description: string;
  location: string;
  applyUrl?: string;
  name: string;
  stickerCount: number;
  priceAUD: number | null;
  creatorId: string | null;
  isFree: boolean;
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