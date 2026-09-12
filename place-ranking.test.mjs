import {test} from 'node:test'
import assert from 'node:assert/strict'
import {distanceMeters,studentScore,priceLabel} from './src/lib/place-ranking.ts'
test('distance uses meters and is symmetric',()=>{
 assert.equal(distanceMeters({lat:41,lng:29},{lat:41,lng:29}),0)
 const a={lat:0,lng:0},b={lat:0,lng:1}
 assert.ok(Math.abs(distanceMeters(a,b)-111195)<2)
 assert.equal(distanceMeters(a,b),distanceMeters(b,a))
})
test('missing price never implies cheap; free is a valid price',()=>{
 assert.equal(studentScore(null,100,3000,4.5,50),null)
 assert.equal(studentScore(1,100,3000,null,0),null)
 assert.ok(studentScore(0,100,3000,4.5,50)>studentScore(1,100,3000,4.5,50))
 assert.equal(priceLabel(0),'Ücretsiz')
 assert.equal(priceLabel(null),'Fiyat bilgisi yok')
})
test('price and distance favor student budgets; small samples do not dominate',()=>{
 assert.ok(studentScore(1,100,3000,4.5,50)>studentScore(3,100,3000,4.5,50))
 assert.ok(studentScore(1,100,3000,4.5,50)>studentScore(1,2900,3000,4.5,50))
 assert.ok(studentScore(1,100,3000,4.7,200)>studentScore(1,100,3000,5,1))
 assert.equal(studentScore(1,100,0,4,10),null)
})
