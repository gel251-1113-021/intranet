import { supabase, formatoMoneda } from './config.js';
import { checkAuth } from './auth.js';
import { toast, loading } from './ui.js';

checkAuth();

let productosMemoria = [];
let categoriasMemoria = [];
let mostrarSoloCriticos = false;

async function init() {
    loading(true);
    await cargarCategorias();
    await cargarProductos();
    loading(false);
}

// --- GESTIÓN DE CATEGORÍAS ---
async function cargarCategorias() {
    const { data } = await supabase.from('categorias').select('*').order('nombre');
    categoriasMemoria = data || [];
    renderCategoriasSelect();
}

function renderCategoriasSelect() {
    const select = document.getElementById('cat');
    select.innerHTML = categoriasMemoria.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
}

// Nueva Categoría (Micro Modal)
window.modalCategoria = () => document.getElementById('modalCat').classList.remove('hidden');

window.guardarCategoria = async () => {
    const nombre = document.getElementById('newCatName').value.trim();
    if(!nombre) return toast('Escribe un nombre', 'error');
    
    loading(true);
    const { data, error } = await supabase.from('categorias').insert([{ nombre, icono: 'fa-box' }]).select();
    loading(false);
    
    if(error) {
        toast('Error al crear categoría', 'error');
    } else {
        toast('Categoría creada');
        document.getElementById('newCatName').value = '';
        document.getElementById('modalCat').classList.add('hidden');
        await cargarCategorias(); // Recargar lista
        // Auto-seleccionar la nueva
        if(data && data[0]) document.getElementById('cat').value = data[0].id;
    }
};

// --- GESTIÓN DE PRODUCTOS ---
async function cargarProductos() {
    const { data, error } = await supabase.from('productos').select('*, categorias(nombre)').order('id', {ascending: false});
    if(error) return toast('Error de conexión', 'error');
    productosMemoria = data;
    actualizarKPIs();
    renderizarTabla();
}

function actualizarKPIs() {
    document.getElementById('kpiTotal').innerText = productosMemoria.length;
    const valorTotal = productosMemoria.reduce((acc, p) => acc + (p.precio_regular * p.stock), 0);
    document.getElementById('kpiValor').innerText = formatoMoneda.format(valorTotal);
    
    const criticos = productosMemoria.filter(p => p.stock <= (p.stock_minimo || 5)).length;
    document.getElementById('kpiBajo').innerText = criticos;
    
    const kpiBox = document.getElementById('kpiBajo').parentElement.parentElement;
    if(criticos > 0) kpiBox.classList.add('animate-pulse'); else kpiBox.classList.remove('animate-pulse');
}

window.filtrarCriticos = () => {
    mostrarSoloCriticos = !mostrarSoloCriticos;
    renderizarTabla();
    toast(mostrarSoloCriticos ? 'Mostrando stock crítico' : 'Mostrando todo');
};

function renderizarTabla() {
    const texto = document.getElementById('buscador').value.toLowerCase();
    const tbody = document.getElementById('listaProductos');
    tbody.innerHTML = '';

    const filtrados = productosMemoria.filter(p => {
        const textMatch = p.nombre.toLowerCase().includes(texto) || p.codigo.toLowerCase().includes(texto);
        const criticMatch = mostrarSoloCriticos ? p.stock <= (p.stock_minimo || 5) : true;
        return textMatch && criticMatch;
    });

    if(filtrados.length === 0) { document.getElementById('estadoVacio').classList.remove('hidden'); return; }
    document.getElementById('estadoVacio').classList.add('hidden');

    const hoy = new Date().toISOString().split('T')[0];

    filtrados.forEach(p => {
        // Estado Stock
        const min = p.stock_minimo || 5;
        let stClass = "bg-emerald-100 text-emerald-700";
        let stIcon = "fa-check";
        if(p.stock <= min) { stClass = "bg-red-100 text-red-700 font-bold animate-pulse"; stIcon = "fa-triangle-exclamation"; }
        else if(p.stock <= min * 2) { stClass = "bg-yellow-100 text-yellow-700"; stIcon = "fa-exclamation"; }

        // Estado Oferta
        let precioHtml = `<span class="font-bold text-slate-600">${formatoMoneda.format(p.precio_regular)}</span>`;
        if(p.precio_oferta && p.inicio_oferta <= hoy && p.fin_oferta >= hoy) {
            precioHtml = `
                <div class="flex flex-col">
                    <span class="text-[10px] text-slate-400 line-through">${formatoMoneda.format(p.precio_regular)}</span>
                    <span class="text-sm font-black text-red-600">${formatoMoneda.format(p.precio_oferta)}</span>
                    <span class="text-[9px] bg-red-100 text-red-600 px-1 rounded w-fit">OFERTA</span>
                </div>
            `;
        }

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition border-b border-slate-50";
        tr.innerHTML = `
            <td class="p-4">
                <div class="font-bold text-slate-700 text-sm">${p.nombre}</div>
                <div class="text-[10px] text-slate-400 font-mono"><i class="fa-solid fa-barcode"></i> ${p.codigo}</div>
            </td>
            <td class="p-4"><span class="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs font-bold text-slate-500">${p.categorias?.nombre || '-'}</span></td>
            <td class="p-4">${precioHtml}</td>
            <td class="p-4"><span class="text-xs text-slate-400 italic">${p.precio_oferta ? `Hasta: ${p.fin_oferta}` : '-'}</span></td>
            <td class="p-4">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-slate-800">${p.stock}</span>
                    <span class="text-[10px] uppercase font-bold text-slate-400">${p.tipo_unidad || 'UNIDAD'}</span>
                </div>
            </td>
            <td class="p-4 text-center">
                <button onclick='editar(${JSON.stringify(p)})' class="bg-white border border-slate-200 text-slate-400 hover:text-sky-600 hover:border-sky-300 p-2 rounded-lg transition shadow-sm">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- FORMULARIO ---
window.abrirModal = () => {
    document.getElementById('formulario').reset();
    document.getElementById('prodId').value = '';
    document.getElementById('modalTitulo').innerText = 'Nuevo Producto';
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modal').classList.add('flex');
};
window.cerrarModal = () => {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('modal').classList.remove('flex');
};

window.editar = (p) => {
    abrirModal();
    document.getElementById('modalTitulo').innerText = 'Editar Producto';
    document.getElementById('prodId').value = p.id;
    document.getElementById('cod').value = p.codigo;
    document.getElementById('nom').value = p.nombre;
    document.getElementById('cat').value = p.categoria_id;
    document.getElementById('stk').value = p.stock;
    document.getElementById('unidad').value = p.tipo_unidad || 'UNIDAD';
    document.getElementById('minStk').value = p.stock_minimo || 5;
    document.getElementById('prec').value = p.precio_regular;
    
    // Oferta
    if(p.precio_oferta) {
        document.getElementById('offPrice').value = p.precio_oferta;
        document.getElementById('offStart').value = p.inicio_oferta;
        document.getElementById('offEnd').value = p.fin_oferta;
    }
};

document.getElementById('formulario').onsubmit = async (e) => {
    e.preventDefault();
    loading(true);

    const data = {
        codigo: document.getElementById('cod').value.toUpperCase().trim(),
        nombre: document.getElementById('nom').value.trim(),
        categoria_id: document.getElementById('cat').value,
        stock: document.getElementById('stk').value,
        stock_minimo: document.getElementById('minStk').value,
        tipo_unidad: document.getElementById('unidad').value,
        precio_regular: document.getElementById('prec').value,
        activo: true
    };

    // Lógica de Oferta (Si está vacía, enviamos NULL para borrarla)
    const offP = document.getElementById('offPrice').value;
    if(offP && offP > 0) {
        data.precio_oferta = offP;
        data.inicio_oferta = document.getElementById('offStart').value || null;
        data.fin_oferta = document.getElementById('offEnd').value || null;
    } else {
        data.precio_oferta = null;
        data.inicio_oferta = null;
        data.fin_oferta = null;
    }

    const id = document.getElementById('prodId').value;
    let err;

    if(id) {
        const { error } = await supabase.from('productos').update(data).eq('id', id);
        err = error;
    } else {
        const { error } = await supabase.from('productos').insert([data]);
        err = error;
    }

    loading(false);

    if(err) {
        console.error(err);
        toast('Error al guardar', 'error');
    } else {
        toast('Producto guardado');
        cerrarModal();
        cargarProductos();
    }
};

document.getElementById('buscador').onkeyup = renderizarTabla;
init();