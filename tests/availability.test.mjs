import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../src/utils/availability.ts', import.meta.url), 'utf8').replace(/import type[^;]+;/g, '').replace(/import \{ generateTimeSlots \}[^;]+;/, fs.readFileSync(new URL('../src/utils/timeSlots.ts', import.meta.url), 'utf8').replace('export function', 'function'));
const output = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const sandbox = {exports:{}}; vm.runInNewContext(output,sandbox);
const {getTeacherAvailableSlots, timeToMinutes}=sandbox.exports;
const teacher={workingHoursStart:'12:00',workingHoursEnd:'18:00',availableSlots:['12:00','17:00','18:00']};
test('all paid durations use ranges rather than legacy sample starts',()=>{for(const duration of [5,10,20]){const slots=getTeacherAvailableSlots(teacher,'الأحد',duration);assert.ok(slots.includes('12:00'));assert.ok(slots.includes('17:00'));assert.ok(!slots.includes('18:00'));assert.ok(slots.every(time=>timeToMinutes(time)+duration<=1080));}});
test('day-specific availability overrides default hours and enforces duration',()=>{const custom={...teacher,availabilityByDay:{'الأحد':[{start:'09:00',end:'09:20'}]}};assert.deepEqual(Array.from(getTeacherAvailableSlots(custom,'الأحد',20)),['09:00']);assert.equal(getTeacherAvailableSlots(custom,'الإثنين',5).length,0);});
test('time parser rejects trailing junk and impossible times',()=>{assert.equal(timeToMinutes('12:00garbage'),null);assert.equal(timeToMinutes('24:00'),null);assert.equal(timeToMinutes('12:60'),null);assert.equal(timeToMinutes('12:00'),720);});

const timeOutput = ts.transpileModule(fs.readFileSync(new URL('../src/utils/timeFormat.ts', import.meta.url), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const timeSandbox = {exports:{}}; vm.runInNewContext(timeOutput,timeSandbox);
test('calendar puts noon, midnight and legacy labeled times in the correct hour',()=>{
  const {getLessonHour}=timeSandbox.exports;
  for(const [time,hour] of [['12:00',12],['00:00',0],['12:30',12],['17:30',17],['12:00 AM',0],['12:00 PM',12],['1:15 م',13],['1:15 ص',1]])assert.equal(getLessonHour(time),hour,time);
  for(const time of ['24:00','12:60','13:00 PM','oops'])assert.equal(getLessonHour(time),null);
});
