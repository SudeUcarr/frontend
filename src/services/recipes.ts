import {request} from './http'

export interface RecipeMatch {
  id: number; title: string; image: string
  usedCount: number; missedCount: number
  missedIngredients: {name: string; image: string}[]
  likes: number; url: string
}
export const recipesApi = {
  async findByIngredients(ingredients: string[], signal?: AbortSignal): Promise<RecipeMatch[]> {
    return (await request('/recipes/find-by-ingredients', {method: 'POST', signal,
      headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ingredients})})).json()
  }
}
