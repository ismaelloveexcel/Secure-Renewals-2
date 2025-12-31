import type { RenewalRequest, RenewalResponse } from '../types/renewal'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Request failed')
  }
  return response.json() as Promise<T>
}

export async function getHealth(role: string): Promise<{ status: string; role: string }> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    headers: { 'X-Role': role },
  })
  return handleResponse(response)
}

export async function listRenewals(role: string): Promise<RenewalResponse[]> {
  const response = await fetch(`${API_BASE_URL}/renewals`, {
    headers: { 'X-Role': role },
  })
  return handleResponse(response)
}

export async function createRenewal(role: string, data: RenewalRequest): Promise<RenewalResponse> {
  const response = await fetch(`${API_BASE_URL}/renewals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Role': role,
    },
    body: JSON.stringify(data),
  })
  return handleResponse(response)
}
