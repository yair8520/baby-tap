import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_MELODY_QUEUE, reserveMelodySlot } from "./audioTimeline.js";

describe("reserveMelodySlot", () => {
  it("starts at now when the timeline is idle", () => {
    const result = reserveMelodySlot(10, 0, 0.4);
    assert.equal(result.accepted, true);
    assert.equal(result.startAt, 10);
    assert.equal(result.nextTime, 10.4);
  });

  it("chains after an existing future slot", () => {
    const result = reserveMelodySlot(10, 10.3, 0.5);
    assert.equal(result.accepted, true);
    assert.equal(result.startAt, 10.3);
    assert.equal(result.nextTime, 10.8);
  });

  it("rejects when the lookahead queue is already full", () => {
    const result = reserveMelodySlot(10, 10 + MAX_MELODY_QUEUE, 0.4);
    assert.equal(result.accepted, false);
    assert.equal(result.nextTime, 10 + MAX_MELODY_QUEUE);
  });

  it("accepts just under the lookahead limit", () => {
    const result = reserveMelodySlot(
      10,
      10 + MAX_MELODY_QUEUE - 0.01,
      0.4,
    );
    assert.equal(result.accepted, true);
    assert.equal(result.startAt, 10 + MAX_MELODY_QUEUE - 0.01);
  });

  it("serializes concurrent reservations without gaps", () => {
    let cursor = 0;
    const now = 5;
    const slots = [];
    for (let i = 0; i < 3; i++) {
      const reserved = reserveMelodySlot(now, cursor, 0.25);
      assert.equal(reserved.accepted, true);
      slots.push(reserved.startAt);
      cursor = reserved.nextTime;
    }
    assert.deepEqual(slots, [5, 5.25, 5.5]);
    assert.equal(cursor, 5.75);
    const rejected = reserveMelodySlot(now, cursor, 0.25);
    // 5.75 - 5 = 0.75 still under 0.9, so one more fits
    assert.equal(rejected.accepted, true);
    const full = reserveMelodySlot(now, rejected.nextTime, 0.25);
    // 6.0 - 5 = 1.0 >= 0.9 → reject
    assert.equal(full.accepted, false);
  });
});
