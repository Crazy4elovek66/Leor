export type TasteNodeType =
  | 'BRAND'
  | 'CATEGORY'
  | 'STYLE'
  | 'COLOR'
  | 'MATERIAL'
  | 'HOBBY'
  | 'BOOK'
  | 'MOVIE'
  | 'GAME'
  | 'MUSIC'
  | 'TRAVEL'
  | 'FOOD'
  | 'CREATOR'
  | 'OTHER';

export interface TasteNode {
  id: string;
  node_type: TasteNodeType;
  value: string;
  weight: number;
  source: string;
}

export interface TasteEdge {
  id: string;
  from_node_id: string;
  to_node_id: string;
  strength: number;
}

export interface TasteTopCategory {
  category: string;
  weight: number;
}

export interface TasteTopBrand {
  brand: string;
  weight: number;
}

export interface TasteGraphData {
  nodes: TasteNode[];
  edges: TasteEdge[];
  top_categories: TasteTopCategory[];
  top_brands: TasteTopBrand[];
  restricted?: boolean;
}
