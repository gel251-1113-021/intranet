import { supabase } from './config.js';
import { checkAuth, logout } from './auth.js';
import { toast, loading } from './ui.js';

const user = checkAuth('cajero');

// Cargar Datos de Header
document.getElementById('userName').innerText = user.nombre_completo;
document.getElementById('userCode').innerText = user.codigo;
document.getElementById('newName').value = user.nombre_completo;

// Asignar Logout
document.getElementById('btnExit').onclick = logout;

async function loadDashboardData() {
    loading(true);

    // 1. Cargar Comunicados
    const { data: coms } = await supabase.from('comunicados').select('*').order('id', {ascending: false}).limit(5);
    const divComs = document.getElementById('coms');
    
    if(coms && coms.length) {
        divComs.innerHTML = coms.map(c => `
            <div class="bg-sky-50 p-4 rounded-xl border border-sky-100 hover:bg-sky-100 transition cursor-default">
                <div class="flex justify-between items-center mb-1">
                    <p class="font-bold text-sky-900 text-sm">${c.titulo}</p>
                    <span class="text-[10px] text-sky-400">${new Date(c.fecha_creacion).toLocaleDateString()}</span>
                </div>
                <p class="text-sky-700 text-xs leading-relaxed">${c.mensaje}</p>
            </div>
        `).join('');
    } else {
        divComs.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-slate-400">
                <i class="fa-regular fa-folder-open text-2xl mb-2"></i>
                <p class="text-xs">Sin avisos recientes</p>
            </div>
        `;
    }

    loading(false);
}

// Actualizar Perfil
document.getElementById('frmProfile').onsubmit = async (e) => {
    e.preventDefault();
    loading(true);
    
    const n = document.getElementById('newName').value;
    const p = document.getElementById('newPass').value;
    
    const updates = { nombre_completo: n };
    if(p) updates.password = p; // Solo actualiza pass si escribió algo
    
    const { error } = await supabase.from('usuarios').update(updates).eq('id', user.id);
    
    loading(false);

    if(error) {
        toast('Error al actualizar', 'error');
    } else {
        toast('Datos guardados. Reiniciando sesión...');
        // Actualizar sesión local también para reflejar cambio inmediato
        const newSession = { ...user, ...updates };
        localStorage.setItem('mv_session', JSON.stringify(newSession));
        
        setTimeout(logout, 2000);
    }
}

loadDashboardData();