export type Point={lat:number;lng:number}
export function distanceMeters(a:Point,b:Point){
 const rad=(v:number)=>v*Math.PI/180
 const h=Math.sin(rad(b.lat-a.lat)/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(b.lng-a.lng)/2)**2
 return 6371000*2*Math.asin(Math.sqrt(Math.min(1,h)))
}
export function studentScore(price:number|null,distance:number,radius:number,rating:number|null,count:number){
 if(price===null||rating===null||!Number.isFinite(distance)||radius<=0)return null
 const confidenceRating=(rating*Math.max(0,count)+3.5*20)/(Math.max(0,count)+20)
 return Math.round(100*(.4*(1-Math.min(4,Math.max(0,price))/4)+.35*Math.max(0,1-distance/radius)+.25*confidenceRating/5))
}
export function priceLabel(price:number|null){return price===null?'Fiyat bilgisi yok':price===0?'Ücretsiz':'₺'.repeat(price)}
