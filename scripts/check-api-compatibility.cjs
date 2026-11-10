// Release gate independent of ESLint guards and suppression comments.
// Conservatively require every referenced Obsidian API's declared @since.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function compareVersions(a, b) {
  const left = a.split('.').map(Number), right = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (left[i] !== right[i]) return left[i] - right[i];
  return 0;
}

function checkCompatibility(root, minimumOverride) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const minimum = minimumOverride ?? manifest.minAppVersion;
  if (!/^\d+\.\d+\.\d+$/.test(minimum)) throw new Error('Invalid minAppVersion');
  const configPath = path.join(root, 'tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  if (parsed.errors.length) throw new Error('Cannot parse tsconfig.json');
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const checker = program.getTypeChecker();
  const findings = [];
  let checked = 0;
  function visit(node, source) {
    // Includes calls through inherited methods, imports aliased with `as`,
    // namespace imports, bracket notation and references inside feature guards.
    if (ts.isIdentifier(node) || ts.isStringLiteral(node)) {
      let symbol = checker.getSymbolAtLocation(node);
      if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
      const declarations = symbol?.getDeclarations()?.filter(declaration =>
        /[\\/]node_modules[\\/]obsidian[\\/].*\.d\.ts$/.test(declaration.getSourceFile().fileName)) ?? [];
      const versions = declarations.flatMap(declaration => ts.getJSDocTags(declaration)
        .filter(tag => tag.tagName.text === 'since' && typeof tag.comment === 'string')
        .map(tag => tag.comment.match(/\d+\.\d+\.\d+/)?.[0]).filter(Boolean));
      if (versions.length) {
        checked++;
        // The earliest overload is sufficient for a symbol reference. ESLint
        // separately checks which overload each actual call requires.
        const since = versions.sort(compareVersions)[0];
        if (compareVersions(since, minimum) > 0) {
          const position = source.getLineAndCharacterOfPosition(node.getStart(source));
          findings.push({ file: path.relative(root, source.fileName).replaceAll('\\', '/'),
            line: position.line + 1, api: symbol.getName(), since, minimum });
        }
      }
    }
    ts.forEachChild(node, child => visit(child, source));
  }
  for (const file of program.getSourceFiles()) {
    if (!file.isDeclarationFile && parsed.fileNames.includes(file.fileName)) visit(file, file);
  }
  if (!checked) throw new Error('No versioned Obsidian APIs resolved; refusing an empty compatibility check');
  return { minimum, checked, findings };
}

if (require.main === module) {
  const result = checkCompatibility(path.resolve(__dirname, '..'));
  for (const finding of result.findings) console.error(`${finding.file}:${finding.line}: ${finding.api} requires ${finding.since}; manifest declares ${finding.minimum}`);
  console.log(`Obsidian API compatibility: ${result.checked} versioned references, ${result.findings.length} incompatibilities (minimum ${result.minimum})`);
  process.exitCode = result.findings.length ? 1 : 0;
}
module.exports = { checkCompatibility };
