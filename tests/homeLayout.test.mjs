import assert from 'node:assert/strict';
import test from 'node:test';
import {HOME_DOCK_SIZE, nearestFocusableLine, nextFocusableLine, splitHomeApps} from '../src/lib/homeLayout.ts';

function apps (count) {
	return Array.from({length: count}, (_, index) => ({id: `app-${index}`}));
}

test('puts the first four apps in the dock and leaves the rest below', () => {
	const result = splitHomeApps(apps(6));

	assert.equal(HOME_DOCK_SIZE, 4);
	assert.deepEqual(result.dock.map((app) => app.id), ['app-0', 'app-1', 'app-2', 'app-3']);
	assert.deepEqual(result.remaining.map((app) => app.id), ['app-4', 'app-5']);
});

test('keeps fewer than four apps in the dock', () => {
	const result = splitHomeApps(apps(2));

	assert.deepEqual(result.dock.map((app) => app.id), ['app-0', 'app-1']);
	assert.deepEqual(result.remaining, []);
});

test('returns empty dock and content for an empty app list', () => {
	assert.deepEqual(splitHomeApps([]), {dock: [], remaining: []});
});

test('moves through focusable content lines and skips empty sections', () => {
	const lines = [false, true, false, true];

	assert.equal(nextFocusableLine(lines, -1, 1), 1);
	assert.equal(nextFocusableLine(lines, 1, 1), 3);
	assert.equal(nextFocusableLine(lines, 3, -1), 1);
	assert.equal(nextFocusableLine(lines, 1, -1), -1);
});

test('keeps focus on a nearby populated line after content changes', () => {
	const lines = [true, false, true];

	assert.equal(nearestFocusableLine(lines, 1, 1), 2);
	assert.equal(nearestFocusableLine(lines, 2, -1), 2);
});
