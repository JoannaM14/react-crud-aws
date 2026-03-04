import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [tareas, setTareas] = useState([]);
  const [nuevaTarea, setNuevaTarea] = useState("");
  
  // Tu URL de API Gateway (asegúrate de que sea la última que generó Terraform)
  const API_URL = "https://1qyyc5xwg4.execute-api.us-east-1.amazonaws.com/tareas";

  // 1. CORRECCIÓN EN GET: La Lambda ya devuelve el arreglo directamente
  const obtenerTareas = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      // Como en la Lambda pusimos 'body = data.Items', aquí 'data' ya es el arreglo
      setTareas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al obtener tareas:", error);
    }
  };

  // 2. CORRECCIÓN EN POST: Se necesita el Header "Content-Type"
  const agregarTarea = async () => {
    if (!nuevaTarea.trim()) return; // No agregar tareas vacías

    try {
      await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json" // <--- ¡VITAL! Sin esto, la Lambda recibe el cuerpo vacío
        },
        body: JSON.stringify({ info: nuevaTarea }),
      });
      
      setNuevaTarea(""); // Limpiar el input
      obtenerTareas();   // Refrescar la lista automáticamente
    } catch (error) {
      console.error("Error al guardar tarea:", error);
    }
  };

  useEffect(() => { 
    obtenerTareas(); 
  }, []);

  return (
    <div className="App">
      <h1>Mis Tareas en AWS</h1>
      
      <div className="input-group">
        <input 
          value={nuevaTarea} 
          onChange={(e) => setNuevaTarea(e.target.value)} 
          placeholder="¿Qué tienes pendiente, Joanna?" 
        />
        <button onClick={agregarTarea}>Agregar</button>
      </div>
      
      <ul>
        {tareas.length > 0 ? (
          tareas.map(t => (
            <li key={t.id}>
              <span>{t.info}</span>
            </li>
          ))
        ) : (
          <p style={{color: '#888'}}>No hay tareas pendientes ✨</p>
        )}
      </ul>
    </div>
  )
}

export default App