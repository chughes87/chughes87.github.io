/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Pure functions — no DOM, no localStorage. Used by flashcard-engine.js
 * and testable independently.
 *
 * Card SRS data shape:
 *   { ef: number, interval: number, reps: number, nextReview: number }
 *
 * - ef: ease factor (>= 1.3, starts at 2.5)
 * - interval: days until next review
 * - reps: consecutive successful recalls
 * - nextReview: unix timestamp (ms) of when card is next due
 */

var SRS = (function () {
  var DAY_MS = 86400000;
  var DEFAULT_EF = 2.5;
  var MIN_EF = 1.3;

  /**
   * Create a fresh SRS entry for a new card.
   */
  function newCard() {
    return { ef: DEFAULT_EF, interval: 0, reps: 0, nextReview: 0 };
  }

  /**
   * Core SM-2 calculation.
   * @param {object} card - current SRS data { ef, interval, reps, nextReview }
   * @param {number} quality - recall rating 0–5
   * @param {number} now - current unix timestamp (ms)
   * @returns {object} updated SRS data
   */
  function review(card, quality, now) {
    var q = Math.max(0, Math.min(5, Math.round(quality)));
    var ef = card.ef;
    var interval = card.interval;
    var reps = card.reps;

    // Update ease factor (always, per SM-2 spec)
    ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (ef < MIN_EF) ef = MIN_EF;

    if (q >= 3) {
      // Successful recall
      if (reps === 0) {
        interval = 1;
      } else if (reps === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * ef);
      }
      reps = reps + 1;
    } else {
      // Failed recall — reset repetitions, short interval
      reps = 0;
      interval = 1;
    }

    return {
      ef: Math.round(ef * 100) / 100,
      interval: interval,
      reps: reps,
      nextReview: now + interval * DAY_MS
    };
  }

  /**
   * Check if a card is due for review.
   * @param {object} card - SRS data
   * @param {number} now - current unix timestamp (ms)
   * @returns {boolean}
   */
  function isDue(card, now) {
    return card.nextReview <= now;
  }

  /**
   * Sort comparator: most overdue cards first.
   */
  function dueOrder(a, b) {
    return a.nextReview - b.nextReview;
  }

  /**
   * Format an interval in days to a human-readable string.
   * @param {number} days
   * @returns {string}
   */
  function formatInterval(days) {
    if (days < 1) return 'now';
    if (days === 1) return '1 day';
    if (days < 30) return days + ' days';
    if (days < 365) {
      var months = Math.round(days / 30);
      return months === 1 ? '1 month' : months + ' months';
    }
    var years = Math.round(days / 365);
    return years === 1 ? '1 year' : years + ' years';
  }

  /**
   * Preview what interval each quality rating would produce.
   * @param {object} card - current SRS data
   * @param {number} now - current unix timestamp (ms)
   * @returns {number[]} array of 6 intervals (days) for quality 0–5
   */
  function previewIntervals(card, now) {
    var result = [];
    for (var q = 0; q <= 5; q++) {
      result.push(review(card, q, now).interval);
    }
    return result;
  }

  /**
   * Migrate old gotit data to SRS format.
   * @param {string[]} terms - array of mastered card terms
   * @param {number} now - current unix timestamp (ms)
   * @returns {object} SRS data keyed by term
   */
  function migrateFromGotIt(terms, now) {
    var data = {};
    for (var i = 0; i < terms.length; i++) {
      data[terms[i]] = {
        ef: DEFAULT_EF,
        interval: 6,
        reps: 2,
        nextReview: now
      };
    }
    return data;
  }

  return {
    DAY_MS: DAY_MS,
    DEFAULT_EF: DEFAULT_EF,
    MIN_EF: MIN_EF,
    newCard: newCard,
    review: review,
    isDue: isDue,
    dueOrder: dueOrder,
    formatInterval: formatInterval,
    previewIntervals: previewIntervals,
    migrateFromGotIt: migrateFromGotIt
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SRS;
}
