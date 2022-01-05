import path from 'path';
import {createFsPoTranslationsLoaderSync} from '../src/i18n/translations-loader-fs-po';

const translationsLoader = createFsPoTranslationsLoaderSync({
  l10nFilesPath: path.join(__dirname, '..', 'l10n'),
  langs: ['en'],
});

const englishKeysSet = new Set(
  Object.keys(translationsLoader()[0].translations),
);

export default {
  'validate-l10n': {
    meta: {
      docs: {
        description: 'checks T_ for valid keys',
        recommended: false,
      },
      schema: [],
    },
    create: function (context) {
      return {
        TemplateLiteral: function (node) {
          if (node.parent.type !== 'TaggedTemplateExpression') {
            return;
          }
          if (node.parent.tag.name !== 'T_') {
            return;
          }

          if (node.quasis.length !== 1) {
            context.report({
              node: node,
              message: 'T_ should be literal',
            });
            return;
          }

          const value = node.quasis[0].value.raw;
          if (englishKeysSet.has(value)) {
            return;
          }

          context.report({
            node: node,
            message: `T_ unknown key: ${value}`,
          });
        },
      };
    },
  },
};
