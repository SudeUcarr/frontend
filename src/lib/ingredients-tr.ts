// Common student-pantry ingredients. Maps the Turkish name the user types to the
// English term Spoonacular expects, and back again for showing missing ingredients.
export const commonIngredients: {tr: string; en: string}[] = [
  {tr: 'yumurta', en: 'egg'}, {tr: 'peynir', en: 'cheese'}, {tr: 'ekmek', en: 'bread'},
  {tr: 'domates', en: 'tomato'}, {tr: 'soğan', en: 'onion'}, {tr: 'patates', en: 'potato'},
  {tr: 'tavuk', en: 'chicken'}, {tr: 'makarna', en: 'pasta'}, {tr: 'pirinç', en: 'rice'},
  {tr: 'süt', en: 'milk'}, {tr: 'tereyağı', en: 'butter'}, {tr: 'biber', en: 'pepper'},
  {tr: 'salatalık', en: 'cucumber'}, {tr: 'ıspanak', en: 'spinach'}, {tr: 'mantar', en: 'mushroom'},
  {tr: 'kıyma', en: 'ground beef'}, {tr: 'sosis', en: 'sausage'}, {tr: 'yoğurt', en: 'yogurt'},
  {tr: 'un', en: 'flour'}, {tr: 'şeker', en: 'sugar'}, {tr: 'tuz', en: 'salt'},
  {tr: 'sarımsak', en: 'garlic'}, {tr: 'limon', en: 'lemon'}, {tr: 'elma', en: 'apple'},
  {tr: 'muz', en: 'banana'}, {tr: 'ton balığı', en: 'tuna'}, {tr: 'nohut', en: 'chickpeas'},
  {tr: 'mercimek', en: 'lentils'}, {tr: 'mısır', en: 'corn'}, {tr: 'havuç', en: 'carrot'},
  {tr: 'patlıcan', en: 'eggplant'}, {tr: 'kabak', en: 'zucchini'}, {tr: 'bal', en: 'honey'},
  {tr: 'ceviz', en: 'walnut'}, {tr: 'fındık', en: 'hazelnut'}, {tr: 'badem', en: 'almond'},
  {tr: 'maydanoz', en: 'parsley'}, {tr: 'nane', en: 'mint'}, {tr: 'kuru fasulye', en: 'beans'},
  {tr: 'bezelye', en: 'peas'}, {tr: 'somon', en: 'salmon'}, {tr: 'karides', en: 'shrimp'},
  {tr: 'kuzu eti', en: 'lamb'}, {tr: 'dana eti', en: 'beef'}, {tr: 'zeytinyağı', en: 'olive oil'}
]
const trToEn = new Map(commonIngredients.map(i => [i.tr, i.en]))
const enToTr = new Map(commonIngredients.map(i => [i.en, i.tr]))
export function toEnglishIngredient(term: string): string {
  const key = term.trim().toLocaleLowerCase('tr')
  return trToEn.get(key) || key
}
export function toTurkishIngredient(term: string): string {
  const key = term.trim().toLocaleLowerCase('en-US')
  return enToTr.get(key) || term
}
