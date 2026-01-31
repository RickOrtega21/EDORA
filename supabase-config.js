// Supabase Configuration
const SUPABASE_URL = 'https://hmfbgynbkeskpvushgka.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zwj1kaXziB2veJc8-Zz8_Q_vBMgkFFn';

// Defensive check to wait for the library if needed, 
// though script tags are ordered.
let supabaseClient;
try {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase Client inicializado correctamente.');
    } else {
        console.error('Error: La librería supabase-js no está cargada.');
    }
} catch (error) {
    console.error('Error al inicializar Supabase:', error);
}

// Export for other scripts
window.supabaseClient = supabaseClient;
