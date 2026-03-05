import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [tareas, setTareas] = useState([]);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [editandoId, setEditandoId] = useState(null); // Para saber si estamos editando
  
  const API_URL = "https://7ww5xullo6.execute-api.us-east-1.amazonaws.com/tareas";

  const obtenerTareas = async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    setTareas(Array.isArray(data) ? data : []);
  };

  const manejarAccion = async () => {
    if (!nuevaTarea.trim()) return;

    const metodo = editandoId ? "PUT" : "POST";
    const body = editandoId ? { id: editandoId, info: nuevaTarea } : { info: nuevaTarea };

    await fetch(API_URL, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setNuevaTarea("");
    setEditandoId(null);
    obtenerTareas();
  };

  const prepararEdicion = (tarea) => {
    setNuevaTarea(tarea.info);
    setEditandoId(tarea.id);
  };

  const eliminarTarea = async (id) => {
    await fetch(API_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    obtenerTareas();
  };

  useEffect(() => { obtenerTareas(); }, []);

  return (
    <div className="App">
      <h1>Mis Tareas en AWS</h1>
      
      <div className="input-group">
        <input 
          value={nuevaTarea} 
          onChange={(e) => setNuevaTarea(e.target.value)} 
          placeholder="Escribe tu tarea" 
        />
        <button onClick={manejarAccion}>
          {editandoId ? "Guardar Cambios" : "Agregar"}
        </button>
        {editandoId && <button onClick={() => {setEditandoId(null); setNuevaTarea("");}}>Cancelar</button>}
      </div>
      
      <ul>
        {tareas.map(t => (
          <li key={t.id}>
            <span>{t.info}</span>
            <div className="actions">
              <button onClick={() => prepararEdicion(t)} className="btn-edit">Editar</button>
              <button onClick={() => eliminarTarea(t.id)} className="btn-delete">Eliminar</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App