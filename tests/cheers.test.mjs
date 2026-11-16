import test from 'node:test';
import assert from 'node:assert/strict';
import {CHEERS,createCheerPicker} from '../pwa/cheers.js';
import {MUSIC_STYLES,MUSIC_STYLE_LABELS,SFX_NAMES} from '../pwa/audio.js';
import {readFileSync} from 'node:fs';

test('cheers vary by event and suppress bursts without queuing',()=>{
  let time=0;const pick=createCheerPicker(()=>time);
  const first=pick('correct');assert.ok(first);
  assert.equal(pick('habit'),null);
  time=3500;assert.notEqual(pick('correct').text,first.text);
  time=7000;assert.ok(pick('retry'));
  assert.equal(pick('unknown'),null);
  time=8000;assert.ok(pick('complete',{preview:true}));
  assert.equal(pick('complete',{preview:true}),null);
  for(const cheer of Object.values(CHEERS)){
    assert.ok(SFX_NAMES.includes(cheer.sound));
    assert.ok(['hop','spin','nod'].includes(cheer.motion));
    assert.equal(new Set(cheer.lines).size,cheer.lines.length);
  }
});
test('all music styles are available in Settings, including the four new arrangements',()=>{
  const html=readFileSync('pwa/index.html','utf8');
  for(const id of ['festival','magical','chibi','sunset'])assert.ok(MUSIC_STYLES.includes(id));
  for(const id of MUSIC_STYLES)assert.ok(html.includes(`<option value="${id}">${MUSIC_STYLE_LABELS[id]}</option>`));
});
