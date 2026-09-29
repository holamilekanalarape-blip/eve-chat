import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planFromPrompt } from "./trip.ts";

describe("planFromPrompt", () => {
  it("builds a Lisbon plan from the starter prompt", () => {
    const plan = planFromPrompt("Plan 3 days in Lisbon");
    assert.ok(plan);
    assert.equal(plan.city, "Lisbon");
    assert.equal(plan.days, 3);
    assert.equal(plan.stops[0]?.title, "Alfama on foot");
    assert.equal(plan.stops.length, 3);
  });

  it("ignores a weather question", () => {
    assert.equal(planFromPrompt("What's the weather in Lagos?"), null);
  });

  it("clamps a long request to seven days", () => {
    const plan = planFromPrompt("Plan 12 days in Paris");
    assert.equal(plan?.days, 7);
    assert.equal(plan?.stops.length, 7);
  });
});
