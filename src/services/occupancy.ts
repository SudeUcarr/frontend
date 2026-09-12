import {request} from './http'
import type {OccupancyBundle, OccupancyPrediction} from '@kampuskit/shared/occupancy'

export const occupancyApi = {
  async demo(signal?: AbortSignal): Promise<OccupancyBundle> {
    return (await request('/occupancy/demo', {signal})).json()
  },
  async predict(timestamp: string, extraEntries: number, signal?: AbortSignal): Promise<OccupancyPrediction> {
    return (await request('/occupancy/predict', {method: 'POST', signal,
      headers: {'Content-Type': 'application/json'}, body: JSON.stringify({timestamp, extraEntries})})).json()
  }
}
