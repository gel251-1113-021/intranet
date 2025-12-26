import { supabase, formatoMoneda, iniciarReloj } from './config.js';
import { checkAuth } from './auth.js';
import { toast, loading } from './ui.js';

// Configuración
const user = checkAuth('cajero');
iniciarReloj('reloj');
document.getElementById('cajeroName').innerText = user.nombre_completo;

let DB_PRODUCTOS = [];
let DB_CATEGORIAS = [];
let CARRITO = [];
let FILTRO_CAT = 'all';

async function iniciar() {
    loading(true);
    const { data: cats } = await supabase.from('categorias').select('*');
    DB_CATEGORIAS = cats || [];
    renderPestanas();

    const { data: prods } = await supabase.from('productos').select('*').eq('activo', true);
    DB_PRODUCTOS = (prods || []).map(p => ({
        ...p,
        precio_regular: Number(p.precio_regular),
        precio_oferta: p.precio_oferta ? Number(p.precio_oferta) : null,
        stock: Number(p.stock)
    }));

    renderGrid();
    loading(false);
}

function renderPestanas() {
    const div = document.getElementById('tabs');
    let html = `<button onclick="filtrar('all')" id="btn-all" class="px-5 py-2 rounded-xl font-bold text-sm bg-slate-800 text-white shadow-lg border-2 border-slate-800 transition">TODOS</button>`;
    DB_CATEGORIAS.forEach(c => {
        html += `<button onclick="filtrar(${c.id})" id="btn-${c.id}" class="px-5 py-2 rounded-xl font-bold text-sm bg-white text-slate-600 border-2 border-slate-200 hover:border-sky-500 hover:text-sky-600 transition whitespace-nowrap">${c.nombre}</button>`;
    });
    div.innerHTML = html;
}

window.filtrar = (id) => {
    FILTRO_CAT = id;
    document.querySelectorAll('#tabs button').forEach(b => b.className = "px-5 py-2 rounded-xl font-bold text-sm bg-white text-slate-600 border-2 border-slate-200 hover:border-sky-500 hover:text-sky-600 transition whitespace-nowrap");
    const btnActivo = document.getElementById(`btn-${id}`);
    if(btnActivo) btnActivo.className = "px-5 py-2 rounded-xl font-bold text-sm bg-slate-800 text-white shadow-lg border-2 border-slate-800 transition whitespace-nowrap transform scale-105";
    renderGrid();
};

function renderGrid() {
    const grid = document.getElementById('grid');
    const texto = document.getElementById('busqueda').value.toLowerCase();
    grid.innerHTML = '';

    const filtrados = DB_PRODUCTOS.filter(p => {
        const catOk = FILTRO_CAT === 'all' || p.categoria_id == FILTRO_CAT;
        const txtOk = p.nombre.toLowerCase().includes(texto) || p.codigo.toLowerCase().includes(texto);
        return catOk && txtOk;
    });

    if (filtrados.length === 0) { grid.innerHTML = '<div class="col-span-full text-center text-slate-400 font-bold mt-10">No hay productos</div>'; return; }

    const hoy = new Date().toISOString().split('T')[0];

    filtrados.forEach(p => {
        let precio = p.precio_regular;
        let esOferta = false;
        if (p.precio_oferta && p.inicio_oferta <= hoy && p.fin_oferta >= hoy) { precio = p.precio_oferta; esOferta = true; }

        const card = document.createElement('div');
        card.className = "bg-white p-3 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-sky-500 cursor-pointer transition flex flex-col justify-between h-36 relative overflow-hidden group";
        card.onclick = () => agregar(p.id);

        let precioHtml = `<span class="text-lg font-black text-slate-700">${formatoMoneda.format(precio)}</span>`;
        let badge = '';
        if (esOferta) {
            precioHtml = `<div class="flex flex-col leading-none"><span class="text-[10px] text-slate-400 line-through">${formatoMoneda.format(p.precio_regular)}</span><span class="text-lg font-black text-red-500">${formatoMoneda.format(precio)}</span></div>`;
            badge = `<div class="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg">OFERTA</div>`;
        }

        card.innerHTML = `${badge}<div><h3 class="font-bold text-slate-700 text-xs md:text-sm leading-tight line-clamp-2 group-hover:text-sky-600">${p.nombre}</h3><p class="text-[10px] text-slate-400 font-mono font-bold mt-1">${p.codigo}</p></div><div class="border-t border-slate-100 pt-2 flex justify-between items-end">${precioHtml}<div class="bg-slate-100 text-slate-400 w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition"><i class="fa-solid fa-plus"></i></div></div>`;
        grid.appendChild(card);
    });
}

window.agregar = (id) => {
    const prod = DB_PRODUCTOS.find(p => p.id === id);
    if (!prod) return;
    const hoy = new Date().toISOString().split('T')[0];
    let precioFinal = prod.precio_regular;
    if (prod.precio_oferta && prod.inicio_oferta <= hoy && prod.fin_oferta >= hoy) precioFinal = prod.precio_oferta;

    const item = CARRITO.find(i => i.id === id);
    if (item) {
        if (item.cantidad >= prod.stock) return toast('Stock insuficiente', 'error');
        item.cantidad++;
    } else {
        if (prod.stock < 1) return toast('Agotado', 'error');
        CARRITO.push({ id: prod.id, nombre: prod.nombre, precio: precioFinal, cantidad: 1, max: prod.stock });
    }
    renderCarrito();
};

window.eliminar = (i) => { CARRITO.splice(i, 1); renderCarrito(); };
window.limpiarCarrito = () => { if(confirm('¿Borrar todo?')) { CARRITO = []; renderCarrito(); } };

function renderCarrito() {
    const lista = document.getElementById('carritoLista');
    lista.innerHTML = '';
    let total = 0;

    if (CARRITO.length === 0) {
        lista.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-slate-300"><i class="fa-solid fa-basket-shopping text-5xl mb-2"></i><p class="font-bold text-sm">Carrito Vacío</p></div>`;
        document.getElementById('txtTotal').innerText = 'S/. 0.00';
        return;
    }

    CARRITO.forEach((item, index) => {
        const sub = item.precio * item.cantidad;
        total += sub;
        lista.innerHTML += `
            <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center mb-2">
                <div class="flex-1 overflow-hidden mr-2"><div class="font-bold text-xs text-slate-700 truncate">${item.nombre}</div><div class="text-[10px] text-slate-500 font-mono">${item.cantidad} x ${formatoMoneda.format(item.precio)}</div></div>
                <div class="flex items-center gap-3"><span class="font-black text-slate-800 text-sm">${formatoMoneda.format(sub)}</span><button onclick="eliminar(${index})" class="text-slate-300 hover:text-red-500 transition"><i class="fa-solid fa-trash"></i></button></div>
            </div>`;
    });
    document.getElementById('txtTotal').innerText = formatoMoneda.format(total);
}

window.cobrar = async () => {
    if (CARRITO.length === 0) return toast('Carrito vacío', 'error');
    loading(true);
    const total = CARRITO.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);

    try {
        const { error } = await supabase.from('ventas').insert([{ usuario_id: user.id, total: total, detalles: CARRITO }]);
        if (error) throw error;

        for (const item of CARRITO) {
            const nuevoStock = item.max - item.cantidad;
            await supabase.from('productos').update({ stock: nuevoStock }).eq('id', item.id);
        }

        mostrarTicketVirtual(total); // AHORA MOSTRAMOS EL MODAL
        
        const { data: prods } = await supabase.from('productos').select('*').eq('activo', true);
        DB_PRODUCTOS = (prods || []).map(p => ({ ...p, precio_regular: Number(p.precio_regular), precio_oferta: p.precio_oferta ? Number(p.precio_oferta) : null, stock: Number(p.stock) }));
        renderGrid();

    } catch (err) {
        console.error(err);
        toast('Error al procesar', 'error');
    } finally {
        loading(false);
    }
};

function mostrarTicketVirtual(total) {
    const area = document.getElementById('ticketItems');
    area.innerHTML = CARRITO.map(i => `
        <div class="flex justify-between">
            <span class="truncate w-32">${i.nombre} <span class="text-[10px] text-slate-400">x${i.cantidad}</span></span>
            <span class="font-bold">${formatoMoneda.format(i.precio * i.cantidad)}</span>
        </div>
    `).join('');
    
    document.getElementById('ticketTotal').innerText = formatoMoneda.format(total);
    document.getElementById('ticketFecha').innerText = new Date().toLocaleString();
    
    // Mostrar Modal
    document.getElementById('modalTicket').classList.remove('hidden');
    document.getElementById('modalTicket').classList.add('flex');
}

window.cerrarTicket = () => {
    // Cerrar Modal
    document.getElementById('modalTicket').classList.add('hidden');
    document.getElementById('modalTicket').classList.remove('flex');
    // Limpiar para nueva venta
    CARRITO = [];
    renderCarrito();
    toast('Lista para nueva venta');
};

document.getElementById('busqueda').addEventListener('keyup', (e) => {
    if(e.key === 'Enter') {
        const busqueda = e.target.value.toLowerCase().trim();
        const exacto = DB_PRODUCTOS.find(p => p.codigo.toLowerCase() === busqueda);
        if(exacto) { agregar(exacto.id); e.target.value = ''; toast('Producto escaneado'); }
    }
    renderGrid();
});

iniciar();