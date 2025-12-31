import { useEffect, useState } from 'react'
import { createRenewal, getHealth, listRenewals } from './services/api'
import type { RenewalRequest, RenewalResponse } from './types/renewal'

const defaultForm: RenewalRequest = {
  employee_name: '',
  contract_end_date: '',
  renewal_period_months: 12,
}

function App() {
  const [role, setRole] = useState('viewer')
  const [health, setHealth] = useState<string>('checking…')
  const [renewals, setRenewals] = useState<RenewalResponse[]>([])
  const [form, setForm] = useState<RenewalRequest>(defaultForm)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  useEffect(() => {
    async function fetchHealth() {
      try {
        const response = await getHealth(role)
        setHealth(`${response.status} (${response.role})`)
      } catch (err) {
        setHealth('offline')
      }
    }

    fetchHealth()
  }, [role])

  useEffect(() => {
    async function fetchRenewals() {
      try {
        const items = await listRenewals(role)
        setRenewals(items)
      } catch (err) {
        setRenewals([])
      }
    }

    fetchRenewals()
  }, [role])

  const handleChange = (field: keyof RenewalRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    try {
      const created = await createRenewal(role, form)
      setRenewals((prev) => [...prev, created])
      setSuccess('Renewal captured')
      setForm(defaultForm)
    } catch (err: any) {
      setError(err?.message || 'Unable to submit')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Secure Renewals</p>
            <h1 className="text-2xl font-semibold text-slate-900">Internal Renewal Console</h1>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-700" htmlFor="role">Role</label>
            <select
              id="role"
              className="rounded border border-slate-200 bg-white px-2 py-1 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
              <option value="viewer">Viewer</option>
            </select>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              API: {health}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-8 md:grid-cols-3">
        <section className="md:col-span-2">
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between pb-4">
              <h2 className="text-lg font-semibold text-slate-900">Renewal Requests</h2>
              <p className="text-sm text-slate-500">Fetched via secured API</p>
            </div>
            <div className="divide-y divide-slate-100">
              {renewals.length === 0 && (
                <p className="py-3 text-sm text-slate-600">No renewals captured yet.</p>
              )}
              {renewals.map((renewal) => (
                <div key={renewal.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-900">{renewal.employee_name}</p>
                    <p className="text-sm text-slate-500">
                      Ends on {renewal.contract_end_date} • {renewal.renewal_period_months} months
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
                    {renewal.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">New Renewal</h2>
            <p className="text-sm text-slate-500">Admin & HR roles can submit.</p>
            {error && <p className="mt-3 rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            {success && <p className="mt-3 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700">Employee name</label>
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                  value={form.employee_name}
                  onChange={(e) => handleChange('employee_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Contract end date</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                  value={form.contract_end_date}
                  onChange={(e) => handleChange('contract_end_date', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Renewal length (months)</label>
                <input
                  type="number"
                  min={1}
                  max={36}
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                  value={form.renewal_period_months}
                  onChange={(e) => handleChange('renewal_period_months', Number(e.target.value))}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
              >
                Submit request
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
