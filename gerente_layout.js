import { logout } from './auth.js';

export function renderSidebar(activeId) {
    const sidebar = document.getElementById('sidebar');
    const menu = [
        { id: 'dash', label: 'Dashboard', icon: 'fa-chart-simple', url: 'gerente_dashboard.html' },
        { id: 'users', label: 'Gestión Personal', icon: 'fa-users-gear', url: 'gerente_users.html' },
        { id: 'inv', label: 'Inventario', icon: 'fa-boxes-stacked', url: 'gerente_inventario.html' },
        { id: 'comms', label: 'Comunicados', icon: 'fa-bullhorn', url: 'gerente_comms.html' },
    ];

    let html = `
        <div class="p-6 border-b border-slate-700">
            <h2 class="text-white font-black text-xl tracking-tight">MARKET VIDA</h2>
            <p class="text-sky-500 text-[10px] font-bold uppercase">Panel Administrativo</p>
        </div>
        <nav class="flex-1 p-4 space-y-2">
    `;

    menu.forEach(item => {
        const css = activeId === item.id ? 'nav-active' : 'nav-inactive';
        html += `
            <a href="${item.url}" class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${css}">
                <i class="fa-solid ${item.icon} w-5"></i> ${item.label}
            </a>
        `;
    });

    html += `</nav>
        <div class="p-4 border-t border-slate-700">
            <button id="btnOut" class="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-red-600/20 px-4 py-3 rounded-xl w-full transition text-sm font-bold">
                <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
            </button>
        </div>`;
    
    sidebar.innerHTML = html;
    document.getElementById('btnOut').onclick = logout;
}