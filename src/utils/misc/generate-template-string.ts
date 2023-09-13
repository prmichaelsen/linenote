export type GenerateTemplateStringFn =
  (...args: any[]) => any

/**
 * Produces a function which uses template strings to do simple interpolation from objects.
 * 
 * Usage:
 *    var makeMeKing = generateTemplateString('${name} is now the king of ${country}!');
 * 
 *    console.log(makeMeKing({ name: 'Bryan', country: 'Scotland'}));
 *    // Logs 'Bryan is now the king of Scotland!'
 */
export const generateTemplateString = (function<T extends {}>() {
  const cache: Record<string, Function> = {};

  function generateTemplate(template: string) {
    let fn = cache[template];

    if (!fn) {
      // Replace ${expressions} (etc) with ${map.expressions}.

      var sanitized = template
        .replace(/\$\{([\s]*[^;\s\{]+[\s]*)\}/g, function (_: any, match: string) {
          return `\$\{map.${match.trim()}\}`;
        })
        // Afterwards, replace anything that's not ${map.expressions}' (etc) with a blank string.
        .replace(/(\$\{(?!map\.)[^}]+\})/g, '');

      fn = Function('map', `return \`${sanitized}\``);
    }

    return fn;
  }

  return generateTemplate as (template: string) => (t: T) => string;
})();

export const tempalte = (function<T extends {}>() {
  const cache: Record<string, Function> = {};

  function generateTemplate(template: string) {
    let fn = cache[template];

    if (!fn) {
      // Replace ${expressions} (etc) with ${map.expressions}.

      var sanitized = template
        .replace(/\$\{([\s]*[^;\s\{]+[\s]*)\}/g, function (_: any, match: string) {
          return `\$\{map.${match.trim()}\}`;
        })
        // Afterwards, replace anything that's not ${map.expressions}' (etc) with a blank string.
        .replace(/(\$\{(?!map\.)[^}]+\})/g, '');

      fn = Function('map', `return \`${sanitized}\``);
    }

    return fn;
  }

  return generateTemplate as (template: string) => (t: T) => string;
})
