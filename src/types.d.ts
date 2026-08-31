export {};

type AIProvider = 'gemini' | 'openai' | 'anthropic';

declare global {
  interface Window {
    polishAPI: {
      correctText: (
        text: string,
        provider: AIProvider
      ) => Promise<{
        original: string;
        corrected: string;
        changes: {
          before: string;
          after: string;
          reason: string;
        }[];
        error?: string;
      }>;

      changeTone: (
        text: string,
        tone: string,
        provider: AIProvider
      ) => Promise<{
        original: string;
        rewritten: string;
        tone: string;
        error?: string;
      }>;

      translateText: (
        text: string,
        language: string,
        provider: AIProvider
      ) => Promise<{
        original: string;
        translated: string;
        language: string;
        error?: string;
      }>;

      saveNote: (content: string) => Promise<{
        success?: boolean;
        note?: {
          id: number;
          content: string;
          createdAt: string;
        };
        error?: string;
      }>;

      getNotes: () => Promise<{
        success: boolean;
        notes: {
          id: number;
          content: string;
          created_at: string;
        }[];
        error?: string;
      }>;

      deleteNote: (id: number) => Promise<{
        success: boolean;
        error?: string;
      }>;

      saveApiKeys: (keys: {
        gemini: string;
        openai: string;
      }) => Promise<{
        success: boolean;
        error?: string;
      }>;

      getApiKeys: () => Promise<{
        success: boolean;
        gemini: string;
        openai: string;
        error?: string;
      }>;
    };
  }
}
