export type CreativeDiscipline =
  | 'SPOKEN_WORD'
  | 'POETRY'
  | 'MUSIC'
  | 'DANCE'
  | 'TECH_IMAGERY'
  | 'UIUX_DESIGN'
  | 'GRAPHIC_DESIGN'
  | 'MOTION_ANIMATION'
  | 'OTHER';

export type MediaType = 'AUDIO' | 'VIDEO' | 'TEXT' | 'IMAGE_GALLERY';

export type PieceStatus = 'PUBLIC' | 'UNLISTED' | 'DRAFT';

/** One block in a long-form post / article. */
export interface ContentBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'quote' | 'image' | 'divider';
  html?: string;
  url?: string;
  caption?: string;
}

export interface SocialLinks {
  email?: string;
  whatsapp?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  github?: string;
  portfolioUrl?: string;
}

export interface CreativeProfile {
  id: string;
  username: string; // e.g. "sheriff"
  displayName: string;
  tagline: string;
  bio: string;
  avatarUrl: string;
  /** Cloudinary public_id, kept so uploads can be replaced or removed later. */
  avatarPublicId?: string;
  bannerGradient: string;
  bannerUrl?: string;
  bannerPublicId?: string;
  disciplines: CreativeDiscipline[];
  location: string;
  cohortBadge?: string; // e.g. "UNICEF / GenU 9JA YPAT 2026–27"
  isAvailableForGigs: boolean;
  socialLinks: SocialLinks;
  themeStyle: 'soft-brutal' | 'editorial';
  stats: {
    viewsCount: number;
    applauseCount: number;
    piecesCount: number;
  };
  /** true for real verified YPAT members; false for seed/mock records. */
  isYPATData?: boolean;
  isAdmin?: boolean;
  source?: 'mock' | 'live' | 'campaign';
  createdAt: string;
}

export interface CreativePiece {
  id: string;
  creativeId: string;
  title: string;
  subtitle?: string;
  discipline: CreativeDiscipline;
  mediaType: MediaType;
  mediaUrl?: string; // Streamable audio URL or Video embed
  mediaPublicId?: string; // Cloudinary public_id for the uploaded media
  textContent?: string; // Lyrics, spoken word script, or poem verses
  contentBlocks?: ContentBlock[]; // Long-form editorial post / article
  bodyHtml?: string; // WYSIWYG full-post body
  pdfUrl?: string; // Attached case-study PDF
  coverImageUrl?: string;
  coverPublicId?: string; // Cloudinary public_id for the uploaded cover
  galleryImages?: string[]; // For UI/UX designs, tech imagery & graphics
  galleryPublicIds?: string[]; // Parallel to galleryImages
  isFeatured?: boolean;
  status?: PieceStatus;
  sortOrder?: number;
  isYPATData?: boolean;
  source?: 'mock' | 'live' | 'campaign';
  applauseCount: number;
  duration?: string; // e.g. "03:14"
  contextNote?: string; // e.g. "Live performance at YPAT Summit"
  tags: string[];
  createdAt: string;
}

export type InquiryEventType =
  | 'PERFORMANCE'
  | 'COLLABORATION'
  | 'TECH_DESIGN'
  | 'SPEAKING'
  | 'OTHER';

export type InquiryStatus = 'PENDING' | 'REVIEWED' | 'RESPONDED';

export type CampaignStatus = 'OPEN' | 'CLOSED';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  discipline: CreativeDiscipline | 'ALL';
  reward?: string;
  deadline?: string;
  status: CampaignStatus;
  createdBy?: string;
  createdAt: string;
}

export type SubmissionStatus = 'OPEN' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED';

export interface Submission {
  id: string;
  campaignId: string;
  creativeId: string;
  pieceId?: string;
  note?: string;
  status: SubmissionStatus;
  createdAt: string;
  reviewedAt?: string;
}

export type FlagStatus = 'OPEN' | 'RESOLVED';

export interface ContentFlag {
  id: string;
  targetType: 'piece' | 'profile' | 'inquiry';
  targetId: string;
  reason: string;
  reporterId?: string;
  status: FlagStatus;
  createdAt: string;
}

export interface PerformanceInquiry {
  id: string;
  creativeId: string;
  senderName: string;
  senderOrganization?: string;
  senderEmail: string;
  senderPhone?: string;
  eventType: InquiryEventType;
  eventDate?: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}
