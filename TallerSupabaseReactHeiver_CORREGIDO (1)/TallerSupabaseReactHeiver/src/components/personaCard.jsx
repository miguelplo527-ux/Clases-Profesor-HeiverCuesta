import React from 'react';

export const PersonaCard = ({ persona }) => {
    return (
        <div className="persona-card">
            <div className="card-header">
                <span className="card-avatar">{persona.nombre.charAt(0)}</span>
                <div>
                    <h3 className="card-title">{persona.nombre}</h3>
                    <span className="card-doc">Doc: {persona.documento}</span>
                </div>
            </div>
            <div className="card-body">
                <p><strong>Fecha de Nacimiento:</strong> {persona.fechanacimiento}</p>
            </div>
            <br />
            <div className="delete-update">
                <span>
                <button>Borrar Registro</button>
                <button>Actualizar Datos</button>
                </span>
            </div>
        </div>
    );
};
