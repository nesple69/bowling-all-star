Supabaseclient · JS
Copia

import { createClient } from '@supabase/supabase-js'

// Leggi le variabili d'ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validazione più rigorosa
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ ERRORE CRITICO: Variabili Supabase mancanti!')
    console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓ Presente' : '✗ MANCANTE')
    console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Presente' : '✗ MANCANTE')
    console.error('Verifica le Environment Variables su Vercel!')
    
    // Solleva un errore invece di continuare con valori undefined
    throw new Error('Supabase configuration is missing. Check your environment variables.')
}

// Log di successo (solo in development)
if (import.meta.env.DEV) {
    console.log('✅ Supabase client initialized successfully')
    console.log('URL:', supabaseUrl)
}

// Crea il client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)