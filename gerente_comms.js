import { renderSidebar } from './gerente_layout.js';
import { supabase } from './config.js';
import { toast, loading } from './ui.js';
import { checkAuth } from './auth.js';

checkAuth('gerente');
renderSidebar('comms');

async function loadComms() {
    loading(true);
    const { data } = await supabase.from('comunicados').select('*').order('id', {ascending:false});
    
    const container = document.getElementById('list');
    
    if(data.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-center py-10">No hay comunicados publicados.</p>';
    } else {
        container.innerHTML = data.map(c => `
            <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition relative group overflow-hidden">
                <div class="absolute top-0 left-0 w-1 h-full bg-sky-500"></div>
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-slate-800 text-lg">${c.titulo}</h3>
                    <span class="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded">
                        ${new Date(c.fecha_creacion).toLocaleDateString()}
                    </span>
                </div>
                <p class="text-slate-600 text-sm leading-relaxed">${c.mensaje}</p>
                <button onclick="deleteComm(${c.id})" class="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `).join('');
    }
    loading(false);
}

document.getElementById('send').onclick = async () => {
    const t = document.getElementById('title').value;
    const m = document.getElementById('msg').value;
    
    if(!t || !m) return toast('Completa todos los campos', 'error');
    
    loading(true);
    await supabase.from('comunicados').insert([{titulo: t, mensaje: m}]);
    loading(false);
    
    toast('Comunicado publicado'); 
    document.getElementById('title').value = '';
    document.getElementById('msg').value = '';
    loadComms();
};

window.deleteComm = async (id) => {
    if(confirm('¿Eliminar comunicado?')) {
        await supabase.from('comunicados').delete().eq('id', id);
        loadComms();
    }
}

loadComms();