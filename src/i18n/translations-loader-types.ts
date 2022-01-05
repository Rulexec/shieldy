export type TranslationLoader = () => Promise<
  {lang: string; translations: Record<string, string>}[]
>;
