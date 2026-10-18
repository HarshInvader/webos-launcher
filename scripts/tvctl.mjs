#!/usr/bin/env node
// Safe Wi-Fi command helper for the paired LG TV. Only allowlisted app/input
// launches are accepted; this intentionally does not expose a shell on the TV.
import {execFileSync} from 'node:child_process';

const device = process.env.TV_DEVICE || 'lg65';
const targets = {
	youtube: 'youtube.leanback.v4',
	netflix: 'netflix',
	prime: 'amazon',
	'prime-video': 'amazon',
	'apple-tv': 'com.apple.appletv',
	'appletv': 'com.apple.appletv',
	'lg-home': 'com.webos.app.home',
	settings: 'com.palm.app.settings',
	'live-tv': 'com.webos.app.livetv',
	hdmi1: 'com.webos.app.hdmi1',
	hdmi2: 'com.webos.app.hdmi2',
	hdmi3: 'com.webos.app.hdmi3',
	hdmi4: 'com.webos.app.hdmi4'
};

const [command, rawTarget, ...rest] = process.argv.slice(2);
if (command !== 'open' || !rawTarget || rest.length) {
	console.error('Usage: npm run tv -- open <youtube|netflix|prime|apple-tv|lg-home|settings|live-tv|hdmi1..4>');
	process.exit(2);
}

const target = targets[rawTarget.toLowerCase()];
if (!target) {
	console.error(`Unknown or blocked TV target: ${rawTarget}`);
	process.exit(2);
}

execFileSync('./node_modules/.bin/ares-launch', ['-d', device, target], {stdio: 'inherit'});
console.log(`Opened ${rawTarget} on ${device}`);
