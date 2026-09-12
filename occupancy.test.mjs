import {test} from 'node:test'
import assert from 'node:assert/strict'
import {density, examScenario} from '@kampuskit/shared/occupancy'

test('capacity scenarios preserve over-capacity numbers while capping the visual bar', () => {
  assert.equal(density(0,500).percent,0)
  assert.equal(density(500,500).level,'Tam kapasite')
  assert.deepEqual(density(500,300),{percent:167,barPercent:100,level:'Kapasite üstü',tone:'busy'})
  assert.equal(density(500,1333).percent,38)
  assert.equal(density(39,100).tone,'quiet')
  assert.equal(density(40,100).tone,'moderate')
  assert.equal(density(80,100).tone,'busy')
  for (const [count,capacity] of [[1,0],[-1,200],[NaN,200],[1,Infinity]]) assert.throws(() => density(count,capacity))
})

test('exam uplift applies to libraries only and rejects invalid assumptions', () => {
  assert.equal(examScenario(100,'library',true,30),130)
  assert.equal(examScenario(100,'library',false,30),100)
  assert.equal(examScenario(100,'library',true,0),100)
  assert.equal(examScenario(100,'gym',true,30),100)
  assert.equal(examScenario(100,'cafeteria',true,30),100)
  for (const percent of [NaN,110,-1]) assert.throws(() => examScenario(100,'library',true,percent))
})
