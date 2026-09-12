import {api, request} from './http'
import type {DataResponse, SyncResponse} from '@kampuskit/shared/api'
import type {Internship, Profile, TableName, TableRows} from '@kampuskit/shared/types'

export const dataApi = {
  load: () => api<DataResponse>('/data'),
  publicInternships: () => api<Internship[]>('/public/internships'),
  save: <K extends TableName>(table: K, row: Partial<TableRows[K]>, id?: string) => api('/records/' + table + (id ? '/' + encodeURIComponent(id) : ''), id ? 'PATCH' : 'POST', row),
  remove: (table: TableName, id: string) => api('/records/' + table + '/' + encodeURIComponent(id), 'DELETE'),
  saveProfile: (row: Omit<Profile, 'id'>) => api('/profile', 'PUT', row),
  syncInternships: () => api<SyncResponse>('/internships/sync', 'POST'),
  async upload(file: File, bucket: 'notes' | 'listing-images') {
    const response = await request('/files/' + bucket, {method: 'POST', headers: {'Content-Type': file.type}, body: file})
    return (await response.json() as {path: string}).path
  },
  async file(bucket: string, path: string) {
    return (await request('/files/' + encodeURIComponent(bucket) + '?path=' + encodeURIComponent(path))).blob()
  }
}
