import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
)


// const supabaseUrl = process.env.SUPABASE_URL
// const supabaseKey = process.env.SUPABASE_ANON_kEY

// export const supabase = createClient(supabaseUrl, supabaseKey)

