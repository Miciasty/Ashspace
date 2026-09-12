/* Explicit language selection; vendored Prism grammars never fetch resources. */
(() => {
  const prism = window.Prism;
  if (!prism) return;

  const aliases = {
    java: 'java',
    xml: 'markup', html: 'markup', markup: 'markup',
    kotlin: 'kotlin', kt: 'kotlin', kts: 'kotlin', 'gradle-kotlin': 'kotlin', 'gradle-kts': 'kotlin',
    groovy: 'groovy', gradle: 'groovy',
    bash: 'bash', sh: 'bash', shell: 'bash', zsh: 'bash',
    powershell: 'powershell', ps: 'powershell', ps1: 'powershell',
    yaml: 'yaml', yml: 'yaml', json: 'json',
    minecraft: 'minecraft', mcfunction: 'minecraft',
    output: 'output', stdout: 'output'
  };

  // Prism recognizes shell builtins. Add the build tools used in these docs
  // only at a command boundary, after strings/comments have been tokenized.
  const buildCommand = {
    pattern: /(^[ \t]*|[;|&][ \t]*)(?:\.[/\\])?(?:mvnw?|java|javac|gradlew?|npm|node)(?:\.cmd|\.exe|\.bat)?(?=\s|$)/im,
    lookbehind: true
  };
  if (prism.languages.bash) {
    prism.languages.insertBefore('bash', 'function', { command: buildCommand });
  }
  if (prism.languages.powershell) {
    // Do not treat a Maven goal such as dependency:copy-dependencies as a cmdlet.
    prism.languages.powershell.function = prism.languages.powershell.function.map(pattern => ({
      pattern: new RegExp('(^|[^\\w:.-])' + pattern.source, pattern.flags),
      lookbehind: true
    }));
    prism.languages.insertBefore('powershell', 'function', { command: buildCommand });
    prism.languages.insertBefore('powershell', 'function', {
      'named-operator': {
        pattern: /(^|\W)-(?:[ci]?(?:eq|ge|gt|le|lt|ne|(?:not)?(?:contains|in|like|match)|replace|split)|b?(?:and|x?or|not)|as|is(?:not)?|join|sh[lr]|f)\b/i,
        lookbehind: true,
        alias: 'operator'
      },
      parameter: {
        pattern: /(^|\s)--?[a-z][\w.-]*(?=[\s=:;),|}]|$)/i,
        lookbehind: true
      },
      number: /\b(?:0x[\da-f]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)(?:[dlf]|[kmgtp]b)?\b/i,
      null: /\$null\b/i
    });
    prism.languages.powershell.variable = /\$(?!null\b)(?:[a-z_][\w]*:)?[a-z_]\w*\b|\$\{[^}\r\n]+\}/i;
    prism.languages.powershell.string[0].inside.variable = prism.languages.powershell.variable;
    prism.languages.powershell.string[0].inside.null = prism.languages.powershell.null;
  }

  // A small lexical grammar for command examples, not a Minecraft validator.
  prism.languages.minecraft = {
    comment: { pattern: /(^[ \t]*)#.*/m, lookbehind: true },
    string: { pattern: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/, greedy: true },
    command: { pattern: /(^[ \t]*)\/?[a-z][\w:-]*/m, lookbehind: true },
    selector: /@[paresn]\b/,
    parameter: /<[a-z][\w -]*>/i,
    boolean: /\b(?:true|false)\b/,
    number: /[~^](?:-?\d+(?:\.\d+)?)?|\b-?\d+(?:\.\d+)?\b/,
    operator: /[=!]/,
    punctuation: /[\[\]{},:]/
  };

  // Structured results have values and field names, without shell commands.
  prism.languages.output = {
    string: { pattern: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/, greedy: true },
    property: {
      pattern: /(^|[\s,{])[a-z_][\w.-]*(?=\s*(?:=|:(?=\s|$)))/i,
      lookbehind: true
    },
    boolean: /\b(?:true|false)\b/,
    null: /\bnull\b/,
    number: {
      pattern: /(^|[^\w.])[+-]?(?:NaN|Infinity|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(?![\w.])/i,
      lookbehind: true
    },
    operator: /[=:]/,
    punctuation: /[{}\[\](),]/
  };

  const resolve = language => {
    const name = String(language).trim().toLowerCase();
    return Object.hasOwn(aliases, name) ? aliases[name] : null;
  };
  window.WikiSyntax = Object.freeze({
    resolve,
    highlight(source, language) {
      const id = resolve(language);
      const grammar = id && prism.languages[id];
      return grammar ? { id, html: prism.highlight(source, grammar, id) } : null;
    }
  });
})();
