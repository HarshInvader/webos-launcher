import assert from 'node:assert/strict';
import test from 'node:test';
import {formatHomeDate, formatHomeTime, getHomeGreeting} from '../src/lib/homeClock.ts';

test('uses the morning greeting from 05:00 through 11:59', () => {
	assert.equal(getHomeGreeting(new Date(2026, 9, 20, 5, 0)), 'Bom dia, Lucas');
	assert.equal(getHomeGreeting(new Date(2026, 9, 20, 11, 59)), 'Bom dia, Lucas');
});

test('uses the afternoon greeting from 12:00 through 17:59', () => {
	assert.equal(getHomeGreeting(new Date(2026, 9, 20, 12, 0)), 'Boa tarde, Lucas');
	assert.equal(getHomeGreeting(new Date(2026, 9, 20, 17, 59)), 'Boa tarde, Lucas');
});

test('uses the evening greeting from 18:00 through 04:59', () => {
	assert.equal(getHomeGreeting(new Date(2026, 9, 20, 18, 0)), 'Boa noite, Lucas');
	assert.equal(getHomeGreeting(new Date(2026, 9, 20, 4, 59)), 'Boa noite, Lucas');
});

test('formats midnight with a 24-hour clock', () => {
	assert.equal(formatHomeTime(new Date(2026, 9, 20, 0, 5)), '00:05');
});

test('formats late evening with a 24-hour clock', () => {
	assert.equal(formatHomeTime(new Date(2026, 9, 20, 23, 59)), '23:59');
});

test('formats the date in Brazilian Portuguese', () => {
	assert.match(formatHomeDate(new Date(2026, 9, 20, 12, 0)), /20/);
	assert.match(formatHomeDate(new Date(2026, 9, 20, 12, 0)), /outubro/i);
});
