export type TranslationLoader = () => Promise<
  {lang: string; translations: Record<string, string>}[]
>;

export type TranslationLoaderSync = () => {
  lang: string;
  translations: Record<string, string>;
}[];
