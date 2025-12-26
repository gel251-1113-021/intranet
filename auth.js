import { supabase } from './config.js';
import { loading } from './ui.js';

// NOTA: Ahora se llama checkAuth, no verificar
export function checkAuth(rolReq) {
    const s = JSON.parse(localStorage.getItem('mv_session'));
    if(!s) {
        window.location.replace('index.html');
        return null;
    }
    if(rolReq && s.rol !== rolReq && s.rol !== 'gerente') {
        alert('Acceso no autorizado');
        window.location.replace('index.html');
        return null;
    }
    return s;
}

export async function login(codigo, password) {
    loading(true);
    localStorage.removeItem('mv_session');
    try {
        const { data, error } = await supabase.from('usuarios').select('*').eq('codigo', codigo).eq('password', password).single();
        if(error || !data) throw new Error('Credenciales incorrectas');
        if(!data.activo) throw new Error('Usuario desactivado');
        
        if(data.rol !== 'gerente') await supabase.from('turnos').insert([{usuario_id: data.id}]);
        
        localStorage.setItem('mv_session', JSON.stringify(data));
        return data;
    } catch (e) {
        return null; // Error controlado
    } finally {
        loading(false);
    }
}

export function logout() {
    localStorage.removeItem('mv_session');
    window.location.replace('index.html');
}