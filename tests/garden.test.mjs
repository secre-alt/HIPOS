import test from 'node:test';
import assert from 'node:assert/strict';
import {gardenState} from '../pwa/buddy-fx.js';
import {gardenGrowth,gardenPage} from '../pwa/garden.js';

test('game growth reports the stages actually crossed, including two different plants',()=>{
  const first=gardenGrowth(gardenState(0),gardenState(2));
  assert.match(first,/Sunflower/);assert.match(first,/Sprout/);
  assert.doesNotMatch(first,/In bloom|Tulip/);
  const crossing=gardenGrowth(gardenState(2),gardenState(4));
  assert.match(crossing,/Sunflower<\/span> · <span>In bloom/);
  assert.match(crossing,/Tulip<\/span> · <span>Seed/);
  assert.doesNotMatch(crossing,/Daisy/);
});

test('a complete garden does not claim new growth from more rounds',()=>{
  const result=gardenGrowth(gardenState(27),gardenState(29));
  assert.match(result,/fully grown/);
  assert.doesNotMatch(result,/Your garden grew/);
});
test('the final bloom explains the round reward and confirms completion',()=>{
  const result=gardenGrowth(gardenState(26),gardenState(28));
  assert.match(result,/Each completed round counts as one care point/);
  assert.match(result,/one treat per game each day/);
  assert.match(result,/Your garden is fully grown/);
});

test('garden progress includes challenge care and shows the next plant, then stops at completion',()=>{
  const partial=gardenPage({challengeDays:4});
  assert.match(partial,/Next bloom<\/span> · <strong>Tulip/);
  assert.match(partial,/max="3" value="1"/);
  assert.match(partial,/2 care points to the next bloom/);
  const full=gardenPage({challengeDays:27});
  assert.match(full,/fully grown/);
  assert.doesNotMatch(full,/<progress/);
});
