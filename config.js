import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// ⚠️ PEGA TUS CLAVES AQUÍ
const SUPABASE_URL = 'https://hqlefkrlplpiytsoedcp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxbGVma3JscGxwaXl0c29lZGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MTQ2NDMsImV4cCI6MjA4MjI5MDY0M30.9OQTTKOL1yeahu06DUyTUPtgEhoZH1aXozcX61bV_Ro';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const formatoMoneda = new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: 'PEN', minimumFractionDigits: 2
});

export function iniciarReloj(id) {
    const el = document.getElementById(id);
    if(el) setInterval(() => {
        el.innerText = new Date().toLocaleString('es-PE', {
            timeZone: 'America/Lima', weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'
        }).toUpperCase();
    }, 1000);
}