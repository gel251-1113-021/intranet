import { login } from './auth.js';
import { iniciarReloj } from './config.js';
import { toast } from './ui.js';

iniciarReloj('reloj');

// 1. LÓGICA VER CONTRASEÑA
const passInput = document.getElementById('pass');
const toggleBtn = document.getElementById('togglePass');
const eyeIcon = document.getElementById('eyeIcon');

toggleBtn.addEventListener('click', () => {
    // Alternar tipo de input
    const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passInput.setAttribute('type', type);
    
    // Alternar icono
    if (type === 'text') {
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
        passInput.classList.add('text-sky-600'); // Resaltar texto visible
    } else {
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
        passInput.classList.remove('text-sky-600');
    }
});

// 2. LÓGICA DE LOGIN
document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const errorBox = document.getElementById('errorBox');
    errorBox.classList.add('hidden'); // Ocultar error previo
    
    const c = document.getElementById('cod').value.toUpperCase().trim();
    const p = document.getElementById('pass').value;

    try {
        const u = await login(c, p);
        
        if(u) {
            toast(`Acceso correcto. Bienvenido ${u.nombre_completo.split(' ')[0]}`);
            
            // Redirección segura según rol
            setTimeout(() => {
                const rutas = { 
                    'gerente': 'gerente_dashboard.html', 
                    'cajero': 'cajero_dashboard.html', 
                    'inventario': 'bodega_dashboard.html' 
                };
                
                if (rutas[u.rol]) {
                    window.location.replace(rutas[u.rol]);
                } else {
                    toast('Error: Rol de usuario desconocido', 'error');
                }
            }, 1000);
        } else {
            // Si login devuelve null pero no lanzó error (Credenciales malas)
            mostrarError('Usuario o contraseña incorrectos.');
        }

    } catch (error) {
        console.error(error); // Ver detalles en consola F12
        mostrarError('Error de conexión con la base de datos. Revise config.js');
    }
};

function mostrarError(msg) {
    const box = document.getElementById('errorBox');
    box.innerText = msg;
    box.classList.remove('hidden');
    toast(msg, 'error');
    
    // Animación de temblor en el formulario
    document.querySelector('.bg-white').classList.add('animate-pulse');
    setTimeout(() => document.querySelector('.bg-white').classList.remove('animate-pulse'), 200);
}