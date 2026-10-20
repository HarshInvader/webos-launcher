import {readFileSync} from 'node:fs';

const appinfo = JSON.parse(readFileSync('public/appinfo.json', 'utf8'));
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

const requiredFields = ['id', 'version', 'vendor', 'type', 'main', 'title', 'icon', 'largeIcon'];
for (const field of requiredFields) {
	if (!appinfo[field]) throw new Error(`public/appinfo.json is missing ${field}`);
}

if (appinfo.version !== packageJson.version) {
	throw new Error(`Version mismatch: appinfo=${appinfo.version}, package=${packageJson.version}`);
}

if (!Array.isArray(appinfo.requiredACG)) {
	throw new Error('public/appinfo.json must declare requiredACG as an array');
}

console.log(`Validated ${appinfo.id} ${appinfo.version}`);
