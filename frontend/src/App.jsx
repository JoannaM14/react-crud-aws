import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [tareas, setTareas] = useState([]);
  const [nuevaTarea, setNuevaTarea] = useState("");
  
  // ⚠️ AQUÍ PEGARÁS LA URL QUE TE DÉ TERRAFORM MÁS ADELANTE
  const API_URL = "TU_URL_DE_API_GATEWAY/tareas";

  // Función para obtener tareas (GET)
  const obtenerTareas = async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    setTareas(data.Items || []);
  };

  // Función para guardar tarea (POST)
  const agregarTarea = async () => {
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ info: nuevaTarea }),
    });
    setNuevaTarea("");
    obtenerTareas();
  };

  useEffect(() => { obtenerTareas(); }, []);

  return (
    <div className="App">
      <h1>Mis Tareas en AWS</h1>
      <input 
        value={nuevaTarea} 
        onChange={(e) => setNuevaTarea(e.target.value)} 
        placeholder="Escribe una tarea..." 
      />
      <button onClick={agregarTarea}>Agregar</button>
      
      <ul>
        {tareas.map(t => <li key={t.id}>{t.info}</li>)}
      </ul>
    </div>
  )
}

export default App