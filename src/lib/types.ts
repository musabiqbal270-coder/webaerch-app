export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SearchResult[];
  thinking?: string;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}
