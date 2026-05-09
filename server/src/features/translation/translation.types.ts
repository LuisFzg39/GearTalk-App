export interface TranslateRequestBody {
  text: string;
  /** If omitted, the authenticated user's `preferred_language` is used. */
  source_lang?: string;
  target_lang: string;
}

export interface TranslateResponseBody {
  text: string;
  source_lang: string;
  target_lang: string;
}
