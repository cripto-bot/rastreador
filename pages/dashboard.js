// /pages/dashboard.js

import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import jsPDF from 'jspdf';
import { calculateTripStats } from '../utils/trackingAnalytics'; // <-- IMPORTANDO LÓGICA SEPARADA

// Carga dinámica del mapa para evitar problemas de renderizado en el servidor (SSR)
// El mapa es un componente de cliente puro.
const Map = dynamic(() => import('../components/Map'), { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><p>Cargando Mapa...</p></div>
});

export default function DashboardPage() {
    const router = useRouter();
    
    // --- ESTADO DE LA APLICACIÓN ---
    // Estado de autenticación y datos del usuario
    const [user, setUser] = useState(null);
    // Estado de la UI
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
    const [isLoading, setIsLoading] = useState({ devices: true, history: false });
    // Estado de los datos de negocio
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({ distance: "0.0 km", stops: 0, stopTime: "0h 0m", tripTime: "0h 0m" });
    // Estado de los formularios
    const [newDeviceName, setNewDeviceName] = useState('');
    const [newDeviceId, setNewDeviceId] = useState('');

    // --- EFECTOS Y CICLO DE VIDA ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser(payload);
            fetchDevices(token);
        } catch (e) {
            console.error("Token inválido o expirado:", e);
            localStorage.removeItem('token');
            router.push('/login');
        }
    }, [router]); // El router se incluye como dependencia por buena práctica

    // --- LÓGICA DE OBTENCIÓN DE DATOS (Data Fetching) ---
    const fetchDevices = async (token) => {
        setIsLoading(prev => ({ ...prev, devices: true }));
        try {
            const res = await fetch('/api/devices', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setDevices(data);
                if (data.length > 0) {
                    // Seleccionar el primer dispositivo por defecto al cargar
                    handleDeviceSelect(data[0]);
                }
            } else {
                console.error("Error al obtener dispositivos:", res.statusText);
            }
        } catch (error) {
            console.error("Fallo en la red al obtener dispositivos:", error);
        } finally {
            setIsLoading(prev => ({ ...prev, devices: false }));
        }
    };

    const fetchHistoryForDevice = async (device) => {
        setIsLoading(prev => ({ ...prev, history: true }));
        setHistory([]); // Limpiar historial anterior para evitar mostrar datos viejos
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/history?deviceId=${device.deviceId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const historyData = await res.json();
                setHistory(historyData);
                // La lógica de cálculo ahora está encapsulada.
                const newStats = calculateTripStats(historyData);
                setStats(newStats);
            } else {
                console.error("Error al obtener historial:", res.statusText);
            }
        } catch (error) {
            console.error("Fallo en la red al obtener historial:", error);
        } finally {
            setIsLoading(prev => ({ ...prev, history: false }));
        }
    };

    // --- MANEJADORES DE EVENTOS (Event Handlers) ---
    const handleDeviceSelect = (device) => {
        setSelectedDevice(device);
        fetchHistoryForDevice(device);
        // Cerrar el sidebar en móvil después de seleccionar un dispositivo
        if (isSidebarOpen) {
            setIsSidebarOpen(false);
        }
    };

    const handleAddDevice = async (event) => {
        event.preventDefault();
        const token = localStorage.getItem('token');
        const response = await fetch('/api/devices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ deviceName: newDeviceName, deviceId: newDeviceId })
        });
        if (response.ok) {
            setShowAddDeviceModal(false);
            setNewDeviceName('');
            setNewDeviceId('');
            fetchDevices(token); // Refrescar la lista de dispositivos
        } else {
            const result = await response.json();
            alert(`Error al añadir dispositivo: ${result.message}`);
        }
    };

    const handleDownloadPDF = () => {
        if (!selectedDevice) return;
        const doc = new jsPDF();
        const fechaParaguay = new Date().toLocaleDateString('es-PY', { timeZone: 'America/Asuncion' });
        doc.setFontSize(18); doc.text("Reporte de Actividad - CritoBots", 14, 22);
        doc.setFontSize(11); doc.text(`Dispositivo: ${selectedDevice.name}`, 14, 32);
        doc.text(`ID: ${selectedDevice.deviceId}`, 14, 38);
        doc.text(`Fecha del Reporte: ${fechaParaguay}`, 14, 44);
        doc.setFontSize(12); doc.text("Resumen del Recorrido:", 14, 56);
        doc.text(`- Distancia Total: ${stats.distance}`, 16, 64);
        doc.text(`- Total de Paradas: ${stats.stops}`, 16, 70);
        doc.text(`- Tiempo Detenido: ${stats.stopTime}`, 16, 76);
        doc.text(`- Duración del Recorrido: ${stats.tripTime}`, 16, 82);
        doc.save(`reporte-${selectedDevice.name}-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    // --- RENDERIZADO ---
    if (!user) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Verificando sesión...</div>;
    }

    return (
        <>
            <Head>
                <title>Panel - CritoBots</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>
            <div className="flex h-screen overflow-hidden bg-gray-800 text-white">
                
                {/* Overlay para el sidebar en móvil. Aparece cuando el sidebar está abierto. */}
                {isSidebarOpen && (
                    <div 
                        onClick={() => setIsSidebarOpen(false)} 
                        className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                        aria-hidden="true"
                    ></div>
                )}

                {/* --- BARRA LATERAL (SIDEBAR) --- */}
                {/* z-40 para asegurar que esté sobre el contenido y el overlay */}
                <aside className={`fixed inset-y-0 left-0 bg-gray-900 w-72 flex-shrink-0 p-6 flex flex-col
                    transform transition-transform duration-300 ease-in-out z-40
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:relative md:translate-x-0`}>
                    
                    <h1 className="text-2xl font-bold text-teal-400 mb-8">CritoBots</h1>
                    
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Mis Dispositivos</h2>
                        <button onClick={() => setShowAddDeviceModal(true)} className="px-2 py-1 bg-teal-500 text-white text-xs rounded hover:bg-teal-600 transition-colors">+</button>
                    </div>

                    <nav className="flex-grow overflow-y-auto -mr-2 pr-2">
                        {isLoading.devices ? <p className="text-gray-400 text-sm">Cargando...</p> : (
                            <ul>
                                {devices.map(device => (
                                    <li key={device.id} className="mb-2">
                                        <button 
                                            onClick={() => handleDeviceSelect(device)}
                                            className={`w-full flex items-center p-3 rounded-lg text-left transition-colors text-sm font-medium
                                                ${selectedDevice?.id === device.id ? 'bg-teal-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
                                        >
                                            <span className="mr-3 text-lg">📱</span>{device.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </nav>

                    <div className="mt-auto pt-4 border-t border-gray-700">
                        <p className="text-sm text-gray-400 truncate" title={user.email}>{user.email}</p>
                        <button onClick={handleLogout} className="w-full mt-2 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 font-semibold transition-colors">Cerrar Sesión</button>
                    </div>
                </aside>
                
                {/* --- CONTENEDOR PRINCIPAL (MAIN CONTENT) --- */}
                <div className="flex flex-col flex-1 w-full overflow-hidden">
                    {/* Header solo visible en móvil para mostrar el botón de hamburguesa */}
                    {/* z-20 para estar por encima del contenido principal, pero debajo del sidebar */}
                    <header className="bg-gray-900 text-white flex justify-between items-center md:hidden shadow-lg z-20">
                        <span className="p-4 font-bold text-teal-400">CritoBots</span>
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-4 focus:outline-none focus:bg-gray-700">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                    </header>

                    <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-gray-800">
                        {selectedDevice ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                    <h2 className="text-xl font-bold mb-4">Recorrido de <span className="text-teal-400">"{selectedDevice.name}"</span></h2>
                                    {/* El z-index del mapa es controlado por su contenedor padre, asegurando que no se superponga indebidamente */}
                                    <div className="h-[65vh] w-full bg-gray-700 rounded-lg flex items-center justify-center relative z-10">
                                        {isLoading.history ? <p>Cargando historial...</p> : <Map history={history} />}
                                    </div>
                                </div>
                                <div className="bg-gray-900 p-6 rounded-lg h-fit">
                                   <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold">Resumen del Día</h3>
                                        <button onClick={handleDownloadPDF} className="text-teal-400 text-sm hover:underline">Descargar PDF</button>
                                    </div>
                                    <div className="space-y-4 text-gray-300">
                                        <div><p className="text-sm text-gray-400">Distancia</p><p className="font-semibold text-xl text-teal-400">{stats.distance}</p></div>
                                        <div><p className="text-sm text-gray-400">Paradas</p><p className="font-semibold text-xl">{stats.stops}</p></div>
                                        <div><p className="text-sm text-gray-400">Tiempo Detenido</p><p className="font-semibold text-xl">{stats.stopTime}</p></div>
                                        <div><p className="text-sm text-gray-400">Duración Recorrido</p><p className="font-semibold text-xl">{stats.tripTime}</p></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-center text-gray-400">
                                {isLoading.devices ? <p>Cargando dispositivos...</p> : (
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2">Bienvenido</h2>
                                        <p>No tienes dispositivos o aún no has seleccionado uno.</p>
                                        <p className="mt-1 text-sm">Por favor, selecciona un dispositivo del menú lateral o añade uno nuevo.</p>
                                        <button onClick={() => setShowAddDeviceModal(true)} className="mt-4 px-4 py-2 bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors">Añadir Dispositivo</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>

                {/* MODAL PARA AÑADIR DISPOSITIVO */}
                {/* z-50 y z-60 para estar por encima de todo lo demás */}
                {showAddDeviceModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                       <div className="bg-gray-900 p-8 rounded-lg shadow-xl w-full max-w-md relative z-60">
                            <h2 className="text-xl font-bold mb-6">Añadir Nuevo Dispositivo</h2>
                            <form onSubmit={handleAddDevice}>
                                <div className="mb-4">
                                    <label htmlFor="deviceName" className="block text-gray-400 mb-2">Nombre del Dispositivo</label>
                                    <input type="text" id="deviceName" value={newDeviceName} onChange={(e) => setNewDeviceName(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-teal-500 focus:ring-teal-500" required />
                                </div>
                                <div className="mb-6">
                                    <label htmlFor="deviceId" className="block text-gray-400 mb-2">ID Único del Dispositivo</label>
                                    <input type="text" id="deviceId" value={newDeviceId} onChange={(e) => setNewDeviceId(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-teal-500 focus:ring-teal-500" required />
                                </div>
                                <div className="flex justify-end gap-4">
                                    <button type="button" onClick={() => setShowAddDeviceModal(false)} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition-colors">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 bg-teal-500 rounded hover:bg-teal-400 transition-colors">Guardar Dispositivo</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
