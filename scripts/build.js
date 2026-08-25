const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const PLUGIN_DIR_NAME = 'fun.hlabs.ytmd.sdPlugin';
const outputDir = path.join('build', PLUGIN_DIR_NAME);

console.log('Creating release folder');
if (fs.existsSync('build')) {
    fs.rmSync('build', {recursive: true, force: true});
}
fs.mkdirSync('build');

console.log('Creating plugin folder');
fs.mkdirSync(outputDir);

console.log('Building plugin');

async function bundle(entryPoint, outFile) {
    await esbuild.build({
        entryPoints: [entryPoint],
        outfile: outFile,
        bundle: true,
        format: 'iife',
        platform: 'browser',
        target: ['es2017'],
        minify: true
    });
}

async function main() {
    await Promise.all([
        bundle('src/ytmd-pi.ts', path.join(outputDir, 'bundle-pi.js')),
        bundle('src/ytmd.ts', path.join(outputDir, 'bundle.js'))
    ]);

    console.log('Copying files');
    const rootEntries = fs.readdirSync('.');

    const excludedJson = new Set([
        'package.json',
        'package-lock.json',
        'tsconfig.json',
        'release-please-config.json',
        '.release-please-manifest.json'
    ]);

    rootEntries
        .filter((name) => name.endsWith('.json') && !excludedJson.has(name))
        .forEach((name) => fs.copyFileSync(name, path.join(outputDir, name)));

    rootEntries
        .filter((name) => name.endsWith('.html'))
        .forEach((name) => fs.copyFileSync(name, path.join(outputDir, name)));

    rootEntries
        .filter((name) => name.endsWith('.css'))
        .forEach((name) => fs.copyFileSync(name, path.join(outputDir, name)));

    if (fs.existsSync('icons')) {
        fs.cpSync('icons', path.join(outputDir, 'icons'), {recursive: true});
    }

    console.log('Done building plugin folder, check the build directory');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
