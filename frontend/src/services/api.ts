import type { RenewalRequest, RenewalResponse } from '../types/renewal'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

// Authentication types
export interface LoginRequest {
  employee_id: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  requires_password_change: boolean
  employee_id: string
  name: string
  role: string
}

export interface PasswordChangeRequest {
  current_password: string
  new_password: string
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Request failed')
  }
  return response.json() as Promise<T>
}

function authHeaders(token: string): Record<string, string> {
  if (!token) {
    throw new Error('Missing auth token')
  }
  return { Authorization: `Bearer ${token}` }
}

// Authentication API
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  return handleResponse(response)
}

export async function changePassword(token: string, data: PasswordChangeRequest): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify(data),
  })
  return handleResponse(response)
}

// Health check API
export async function getHealth(token: string): Promise<{ status: string; role: string }> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    headers: authHeaders(token),
  })
  return handleResponse(response)
}

// Renewals API
export async function listRenewals(token: string): Promise<RenewalResponse[]> {
  const response = await fetch(`${API_BASE_URL}/renewals`, {
    headers: authHeaders(token),
  })
  return handleResponse(response)
}

export async function createRenewal(token: string, data: RenewalRequest): Promise<RenewalResponse> {
  const response = await fetch(`${API_BASE_URL}/renewals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify(data),
  })
  return handleResponse(response)
}
