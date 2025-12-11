import test from "node:test";
import assert from "node:assert/strict";
import { DiscordBotClient } from "../classes/client";

const client = new DiscordBotClient({ intents: [] });

test("unEscape decodes common HTML entities", () => {
  const input = "&lt;div&gt;Tom &amp; Jerry &quot;hi&quot;&#39;s&lt;/div&gt;";
  assert.equal(client.unEscape(input), `<div>Tom & Jerry "hi"'s</div>`);
});

test("generateTable aligns columns and adds separator", () => {
  const table = client.generateTable([
    ["Name", "Uses"],
    ["alice", 1],
    ["bob", 12],
  ]);
  const lines = table.split("\n");
  assert.equal(lines.length, 4);
  assert.ok(lines[1]!.startsWith("-"));
  assert.ok(lines[0]!.includes("Name"));
  assert.ok(lines[2]!.includes("alice"));
  assert.ok(lines[3]!.includes("bob"));
});

test("randomizeArray preserves elements", () => {
  const arr = [1, 2, 3, 4, 5];
  const out = client.randomizeArray(arr.slice());
  assert.equal(out.length, arr.length);
  assert.deepEqual(out.slice().sort(), arr.slice().sort());
});

test("DEVICE_LINK regex matches meta/oculus referral links", () => {
  assert.ok(client.regexes.DEVICE_LINK.test("https://www.oculus.com/referrals/link/someuser/"));
  assert.ok(client.regexes.DEVICE_LINK.test("https://www.meta.com/referrals/link/some.user_1/"));
  assert.ok(!client.regexes.DEVICE_LINK.test("https://www.meta.com/appreferrals/foo/123"));
});
