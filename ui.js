export function toast(msg, tipo='success') {
    const div = document.createElement('div');
    const color = tipo === 'error' ? 'bg-red-500' : 'bg-sky-600';
    div.className = `fixed top-5 right-5 ${color} text-white px-6 py-4 rounded-lg shadow-xl z-[99] flex items-center gap-3 animate-bounce`;
    div.innerHTML = `<i class="fa-solid ${tipo==='error'?'fa-circle-xmark':'fa-circle-check'}"></i> <span class="font-medium">${msg}</span>`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

export function loading(show) {
    const id = 'loader-app';
    if(show) {
        if(!document.getElementById(id)) {
            const d = document.createElement('div');
            d.id = id;
            d.className = 'fixed inset-0 bg-slate-900/80 z-[100] flex flex-col justify-center items-center backdrop-blur-sm';
            d.innerHTML = `<div class="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-4"></div><p class="text-white font-mono text-xs tracking-widest">PROCESANDO...</p>`;
            document.body.appendChild(d);
        }
    } else {
        document.getElementById(id)?.remove();
    }
}