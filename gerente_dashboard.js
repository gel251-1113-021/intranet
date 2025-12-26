import { renderSidebar } from './gerente_layout.js';
import { supabase, formatoMoneda, iniciarReloj } from './config.js';
import { checkAuth } from './auth.js';
import { loading } from './ui.js';

// Inicialización
checkAuth('gerente');
renderSidebar('dash');
iniciarReloj('reloj');

async function loadDashboard() {
    loading(true);
    const hoy = new Date().toISOString().split('T')[0];

    // 1. KPI Ventas Hoy
    const { data: ventas } = await supabase.from('ventas').select('total').gte('fecha_hora', hoy);
    const totalVentas = ventas?.reduce((acc, curr) => acc + curr.total, 0) || 0;
    
    document.getElementById('kpiTotal').innerText = formatoMoneda.format(totalVentas);
    document.getElementById('kpiCount').innerText = ventas?.length || 0;
    
    // 2. KPI Personal Activo
    const { data: usuarios } = await supabase.from('usuarios').select('id').eq('activo', true);
    document.getElementById('kpiStaff').innerText = usuarios?.length || 0;

    // 3. Gráfica (Datos simulados para prototipo, idealmente usar RPC)
    const ctx = document.getElementById('mainChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'], // En prod: generar dinámicamente
            datasets: [{
                label: 'Ingresos (S/.)',
                data: [120, 190, 300, 500, 200, 300, totalVentas], // Último dato real
                borderColor: '#0284c7', // Sky-600
                backgroundColor: 'rgba(2, 132, 199, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#0284c7',
                pointRadius: 5
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
                x: { grid: { display: false } }
            }
        }
    });

    loading(false);
}

loadDashboard();