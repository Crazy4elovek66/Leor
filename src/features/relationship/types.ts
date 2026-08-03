export interface TimelineHighlight {
  title: string;
  date: string;
  type: string;
}

export interface RelationshipSummaryData {
  found: boolean;
  is_self?: boolean;
  error?: string;
  strength: number;
  gift_affinity?: number;
  memory_affinity?: number;
  taste_similarity: number;
  shared_memories: number;
  gifts_exchanged: number;
  years_known: number;
  timeline_highlights: TimelineHighlight[];
}
