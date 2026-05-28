import { apiClient } from './client'
import type { DashboardData } from '../types'

export async function fetchDashboardData(): Promise<DashboardData> {
  const res = await apiClient.get<DashboardData>('/api/v1/admin/dashboard')
  return res.data
}
