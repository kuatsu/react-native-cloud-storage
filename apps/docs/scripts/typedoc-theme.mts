import type { Application, Reflection } from 'typedoc';
import { MarkdownTheme, type MarkdownPageEvent } from 'typedoc-plugin-markdown';

class ApiTheme extends MarkdownTheme {
  override getRenderContext(page: MarkdownPageEvent<Reflection>) {
    const context = super.getRenderContext(page);
    const renderSignatures = context.partials.signatures;

    context.partials.signatures = (model, options) => {
      const signatures = model.signatures ?? [];
      if (signatures.length < 2) return renderSignatures(model, options);

      const overloads = signatures.map((signature, index) => {
        const title = `Overload ${index + 1}${signature.isDeprecated() ? ' (deprecated)' : ''}`;
        return [
          `${'#'.repeat(options.headingLevel + 1)} ${title}`,
          context.partials.signature(signature, {
            headingLevel: options.headingLevel + 2,
            nested: options.nested,
            multipleSignatures: true,
          }),
        ].join('\n\n');
      });

      return [
        model.comment && context.partials.comment(model.comment, { headingLevel: options.headingLevel + 1 }),
        model.documents && context.partials.documents(model, { headingLevel: options.headingLevel + 1 }),
        ...overloads,
      ]
        .filter(Boolean)
        .join('\n\n');
    };

    return context;
  }
}

export function load(app: Application): void {
  app.renderer.defineTheme('api-reference', ApiTheme);
}
