import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { evaluate } from './engine.mjs';
const config=JSON.parse(readFileSync(new URL('./config.json',import.meta.url)));
const bookingsBefore=JSON.stringify(config.bookings);
const cases=[
  ['T1 free', {start:660,duration:60,blocked:false},'AVAILABLE'],
  ['T2 overlap', {start:630,duration:60,blocked:false},'OVERLAP'],
  ['T3 blocked', {start:660,duration:60,blocked:true},'BLOCKED'],
  ['T4 zero', {start:660,duration:0,blocked:false},'INVALID_DURATION'],
  ['T5 121', {start:660,duration:121,blocked:false},'INVALID_DURATION'],
  ['T6 past', {start:540,duration:60,blocked:false},'PAST_START'],
  ['T7 adjacent', {start:660,duration:30,blocked:false},'AVAILABLE'],
];
for(const [name,input,expected] of cases){const actual=evaluate(config,input);assert.equal(actual.reasonCode,expected,name);console.log(name,expected,'PASS')}
for(const [,input] of cases)evaluate(config,input);
assert.equal(JSON.stringify(config.bookings),bookingsBefore);console.log('T8 bookings unchanged PASS');
