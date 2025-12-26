import { renderSidebar } from './gerente_layout.js';
import { supabase } from './config.js';
import { toast, loading } from './ui.js';
import { checkAuth } from './auth.js';

checkAuth('gerente');
renderSidebar('users');

async function loadUsers() {
    loading(true);
    const { data } = await supabase.from('usuarios').select('*').order('id', {ascending: true});
    
    const tbody = document.getElementById('lista'); // Asegúrate que el TBODY tenga id="lista" en el HTML
    tbody.innerHTML = data.map(u => `
        <tr class="hover:bg-slate-50 transition border-b border-slate-50">
            <td class="p-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                        ${u.nombre_completo.charAt(0)}
                    </div>
                    <div>
                        <div class="font-bold text-slate-800 text-sm">${u.nombre_completo}</div>
                        <div class="text-xs text-slate-400 font-mono tracking-wider">${u.codigo}</div>
                    </div>
                </div>
            </td>
            <td class="p-4">
                <span class="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">
                    ${u.rol}
                </span>
            </td>
            <td class="p-4">
                <span class="px-2 py-1 rounded-full text-[10px] font-bold border ${u.activo ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}">
                    ${u.activo ? '● ACTIVO' : '○ BAJA'}
                </span>
            </td>
            <td class="p-4 text-center">
                <button onclick="toggleUserStatus('${u.id}', ${u.activo})" class="text-slate-300 hover:text-sky-600 transition" title="Cambiar Estado">
                    <i class="fa-solid fa-power-off"></i>
                </button>
            </td>
        </tr>
    `).join('');
    loading(false);
}

// Crear Usuario
document.getElementById('formUser').onsubmit = async (e) => {
    e.preventDefault();
    loading(true);
    const n = document.getElementById('nombre').value;
    const c = document.getElementById('codigo').value.toUpperCase().trim();
    const r = document.getElementById('rol').value;

    const { error } = await supabase.from('usuarios').insert([{
        nombre_completo: n, 
        codigo: c, 
        password: c, // Pass inicial = código
        rol: r, 
        activo: true
    }]);

    loading(false);

    if(error) {
        toast('Error: El código ya existe', 'error');
    } else { 
        toast('Usuario registrado correctamente'); 
        document.getElementById('formUser').reset(); 
        loadUsers(); 
    }
};

// Hacer global la función toggle para el onclick del HTML
window.toggleUserStatus = async (id, currentStatus) => {
    if(confirm(`¿Seguro que deseas ${currentStatus ? 'DESACTIVAR' : 'ACTIVAR'} a este usuario?`)) {
        await supabase.from('usuarios').update({activo: !currentStatus}).eq('id', id);
        loadUsers();
    }
};

loadUsers();