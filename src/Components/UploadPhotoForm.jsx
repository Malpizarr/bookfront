import React, { useState } from 'react';
import {jwtDecode} from "jwt-decode";
import {useUser} from "./UserContext";

function UploadPhotoForm({ userId }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const { updateUser } = useUser();

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleSubmit = async (event) => {
        const jwt = localStorage.getItem('jwt');
        const decoded = jwtDecode(jwt);
        const userId = decoded.sub;

        event.preventDefault();
        if (!selectedFile) {
            alert('Por favor, selecciona un archivo para subir.');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch(`https://bookgateway.mangotree-fab2eccd.eastus.azurecontainerapps.io/users/uploadPhoto/${userId}`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                alert('Foto subida con éxito: ' + data.photoUrl);
                updateUser({ PhotoUrl: data.photoUrl });
            } else {
                alert('Error al subir la foto.');
            }
        } catch (error) {
            console.error('Error al subir la foto:', error);
            alert('Error al subir la foto.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="file" onChange={handleFileChange} />
            <button type="submit">Subir Foto</button>
        </form>
    );
}

export default UploadPhotoForm;
