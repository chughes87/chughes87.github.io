/**
 * Unit tests for srs.js — SM-2 spaced repetition algorithm.
 * Run with: node flashcards/tests/srs.test.js
 */

var SRS = require('../src/srs.js');

var passed = 0;
var failed = 0;
var failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
    console.error('  FAIL: ' + message);
  }
}

function assertClose(actual, expected, tolerance, message) {
  assert(Math.abs(actual - expected) <= tolerance, message + ' (got ' + actual + ', expected ~' + expected + ')');
}

function suite(name, fn) {
  console.log('\n' + name);
  fn();
}

var NOW = 1710000000000; // fixed timestamp for tests
var DAY = SRS.DAY_MS;

// ── newCard ──

suite('newCard', function () {
  var card = SRS.newCard();
  assert(card.ef === 2.5, 'default ease factor is 2.5');
  assert(card.interval === 0, 'default interval is 0');
  assert(card.reps === 0, 'default reps is 0');
  assert(card.nextReview === 0, 'default nextReview is 0');
});

// ── review: first successful recall ──

suite('review — first successful recall (q=4)', function () {
  var card = SRS.newCard();
  var result = SRS.review(card, 4, NOW);
  assert(result.interval === 1, 'first success sets interval to 1 day');
  assert(result.reps === 1, 'reps incremented to 1');
  assert(result.nextReview === NOW + DAY, 'nextReview is now + 1 day');
  assertClose(result.ef, 2.5, 0.01, 'EF stays ~2.5 on q=4');
});

// ── review: second successful recall ──

suite('review — second successful recall (q=4)', function () {
  var card = { ef: 2.5, interval: 1, reps: 1, nextReview: NOW };
  var result = SRS.review(card, 4, NOW + DAY);
  assert(result.interval === 6, 'second success sets interval to 6 days');
  assert(result.reps === 2, 'reps incremented to 2');
  assert(result.nextReview === NOW + DAY + 6 * DAY, 'nextReview is now + 6 days');
});

// ── review: third successful recall ──

suite('review — third successful recall (q=4)', function () {
  var card = { ef: 2.5, interval: 6, reps: 2, nextReview: NOW };
  var result = SRS.review(card, 4, NOW + 6 * DAY);
  assert(result.interval === 15, 'third success: interval = round(6 * 2.5) = 15');
  assert(result.reps === 3, 'reps incremented to 3');
});

// ── review: perfect recall (q=5) ──

suite('review — perfect recall (q=5)', function () {
  var card = SRS.newCard();
  var result = SRS.review(card, 5, NOW);
  assert(result.interval === 1, 'first rep still 1 day');
  assertClose(result.ef, 2.6, 0.01, 'EF increases to 2.6 on q=5');
});

// ── review: failed recall (q=2) ──

suite('review — failed recall (q=2)', function () {
  var card = { ef: 2.5, interval: 15, reps: 3, nextReview: NOW };
  var result = SRS.review(card, 2, NOW);
  assert(result.reps === 0, 'reps reset to 0 on fail');
  assert(result.interval === 1, 'interval reset to 1 on fail');
  assert(result.nextReview === NOW + DAY, 'nextReview is tomorrow');
});

// ── review: complete blackout (q=0) ──

suite('review — complete blackout (q=0)', function () {
  var card = { ef: 2.5, interval: 15, reps: 3, nextReview: NOW };
  var result = SRS.review(card, 0, NOW);
  assert(result.reps === 0, 'reps reset on q=0');
  assert(result.interval === 1, 'interval reset on q=0');
  assert(result.ef >= SRS.MIN_EF, 'EF does not go below MIN_EF');
});

// ── review: ease factor floor ──

suite('review — EF cannot go below 1.3', function () {
  var card = { ef: 1.3, interval: 1, reps: 0, nextReview: NOW };
  var result = SRS.review(card, 0, NOW);
  assert(result.ef === SRS.MIN_EF, 'EF clamped to 1.3');
});

// ── review: barely passing (q=3) ──

suite('review — barely passing (q=3)', function () {
  var card = SRS.newCard();
  var result = SRS.review(card, 3, NOW);
  assert(result.interval === 1, 'first success interval = 1');
  assert(result.reps === 1, 'reps incremented');
  assertClose(result.ef, 2.36, 0.01, 'EF decreases on q=3');
});

// ── review: EF adjustment accumulates correctly ──

suite('review — repeated q=3 lowers EF progressively', function () {
  var card = SRS.newCard();
  card = SRS.review(card, 3, NOW);
  var ef1 = card.ef;
  card = SRS.review(card, 3, NOW + DAY);
  var ef2 = card.ef;
  card = SRS.review(card, 3, NOW + 7 * DAY);
  var ef3 = card.ef;
  assert(ef1 > ef2, 'EF decreases after second q=3');
  assert(ef2 > ef3, 'EF decreases after third q=3');
  assert(ef3 >= SRS.MIN_EF, 'EF stays above minimum');
});

// ── review: quality clamped to 0-5 ──

suite('review — quality clamped to valid range', function () {
  var card = SRS.newCard();
  var low = SRS.review(card, -1, NOW);
  var high = SRS.review(card, 10, NOW);
  assert(low.reps === 0, 'q=-1 treated as q=0 (fail)');
  assertClose(high.ef, 2.6, 0.01, 'q=10 treated as q=5');
});

// ── isDue ──

suite('isDue', function () {
  assert(SRS.isDue({ nextReview: NOW - 1000 }, NOW) === true, 'overdue card is due');
  assert(SRS.isDue({ nextReview: NOW }, NOW) === true, 'card due exactly now is due');
  assert(SRS.isDue({ nextReview: NOW + 1000 }, NOW) === false, 'future card is not due');
  assert(SRS.isDue({ nextReview: 0 }, NOW) === true, 'new card (nextReview=0) is due');
});

// ── dueOrder ──

suite('dueOrder', function () {
  var a = { nextReview: 100 };
  var b = { nextReview: 200 };
  var c = { nextReview: 50 };
  var sorted = [a, b, c].sort(SRS.dueOrder);
  assert(sorted[0] === c, 'most overdue first');
  assert(sorted[1] === a, 'second most overdue second');
  assert(sorted[2] === b, 'least overdue last');
});

// ── formatInterval ──

suite('formatInterval', function () {
  assert(SRS.formatInterval(0) === 'now', '0 days => now');
  assert(SRS.formatInterval(1) === '1 day', '1 day');
  assert(SRS.formatInterval(6) === '6 days', '6 days');
  assert(SRS.formatInterval(15) === '15 days', '15 days');
  assert(SRS.formatInterval(30) === '1 month', '30 days => 1 month');
  assert(SRS.formatInterval(60) === '2 months', '60 days => 2 months');
  assert(SRS.formatInterval(365) === '1 year', '365 days => 1 year');
  assert(SRS.formatInterval(730) === '2 years', '730 days => 2 years');
});

// ── previewIntervals ──

suite('previewIntervals', function () {
  var card = SRS.newCard();
  var previews = SRS.previewIntervals(card, NOW);
  assert(previews.length === 6, 'returns 6 previews');
  assert(previews[0] === 1, 'q=0 on new card => interval 1');
  assert(previews[3] === 1, 'q=3 on new card => interval 1');
  assert(previews[5] === 1, 'q=5 on new card => interval 1');

  // After some reps, intervals should differ by quality
  var reviewed = { ef: 2.5, interval: 6, reps: 2, nextReview: NOW };
  var p2 = SRS.previewIntervals(reviewed, NOW);
  assert(p2[0] === 1, 'q=0 always resets to 1');
  assert(p2[4] > p2[3], 'q=4 gives longer interval than q=3 for established card');
  assert(p2[5] > p2[4], 'q=5 gives longest interval');
});

// ── migrateFromGotIt ──

suite('migrateFromGotIt', function () {
  var terms = ['B-tree index', 'Hash index'];
  var data = SRS.migrateFromGotIt(terms, NOW);
  assert(Object.keys(data).length === 2, 'migrates all terms');
  assert(data['B-tree index'].ef === 2.5, 'migrated EF is 2.5');
  assert(data['B-tree index'].interval === 6, 'migrated interval is 6');
  assert(data['B-tree index'].reps === 2, 'migrated reps is 2');
  assert(data['B-tree index'].nextReview === NOW, 'migrated nextReview is now (due for review)');
});

suite('migrateFromGotIt — empty array', function () {
  var data = SRS.migrateFromGotIt([], NOW);
  assert(Object.keys(data).length === 0, 'empty input gives empty output');
});

// ── SM-2 regression: full lifecycle ──

suite('full lifecycle — new card through maturity', function () {
  var card = SRS.newCard();
  var t = NOW;

  // First review: q=4
  card = SRS.review(card, 4, t);
  assert(card.interval === 1, 'step 1: interval=1');
  t = card.nextReview;

  // Second review: q=5
  card = SRS.review(card, 5, t);
  assert(card.interval === 6, 'step 2: interval=6');
  t = card.nextReview;

  // Third review: q=5
  card = SRS.review(card, 5, t);
  assert(card.interval > 6, 'step 3: interval grows beyond 6');
  var interval3 = card.interval;
  t = card.nextReview;

  // Fourth review: q=3 (hard but correct)
  card = SRS.review(card, 3, t);
  assert(card.reps === 4, 'step 4: reps=4 (still passing)');
  assert(card.interval > 0, 'step 4: interval positive');

  // Fifth review: q=1 (fail)
  t = card.nextReview;
  card = SRS.review(card, 1, t);
  assert(card.reps === 0, 'step 5: reps reset after fail');
  assert(card.interval === 1, 'step 5: interval reset to 1');
});

// ── Results ──

console.log('\n─────────────────────');
console.log('Passed: ' + passed + '  Failed: ' + failed);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(function (f) { console.log('  - ' + f); });
  process.exit(1);
} else {
  console.log('All tests passed.');
}
