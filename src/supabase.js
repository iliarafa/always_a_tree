import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ufawztfdtwcqpnrkovnu.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmYXd6dGZkdHdjcXBucmtvdm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2ODg4MTYsImV4cCI6MjA5MDI2NDgxNn0.SXSI9JudIdMuRGg82puNrfTeKbBCAE3Hll0xg_Co7Cc'

export const db = createClient(SUPABASE_URL, SUPABASE_KEY)

export const THREE_DAYS_AGO = () =>
  new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
