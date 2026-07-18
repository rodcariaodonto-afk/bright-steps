export interface CommunityGroup {
  id: string;
  name: string;
  slug: string;
  description: string;
  visibility: "public" | "private";
  memberCount: number;
  category: string;
  moderatedBy: string[];
}

export interface Post {
  id: string;
  groupId: string;
  authorId: string;
  content: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  status: "published" | "under_review" | "hidden";
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  status: "published" | "under_review" | "hidden";
}

export interface ModerationAction {
  id: string;
  targetType: "post" | "comment" | "user";
  targetId: string;
  moderatorId: string;
  action: "hide" | "warn" | "ban" | "restore";
  reason: string;
  createdAt: string;
}
