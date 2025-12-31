export interface RenewalRequest {
  employee_name: string
  contract_end_date: string
  renewal_period_months: number
}

export interface RenewalResponse extends RenewalRequest {
  id: number
  status: string
}
