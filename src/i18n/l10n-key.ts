export type L10nKey = string & {readonly tag: unique symbol};

export const T_ = (key: TemplateStringsArray): L10nKey => key[0] as L10nKey;
