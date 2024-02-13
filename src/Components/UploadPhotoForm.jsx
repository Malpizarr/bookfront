import React, { useState } from 'react';
import {useUser} from "./UserContext";
import "../Style/UploadPhotoForm.css";

function UploadPhotoForm({ userId }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const {user, setUser} = useUser();

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleSubmit = async (event) => {

        event.preventDefault();
        if (!selectedFile) {
            alert('Por favor, selecciona un archivo para subir.');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        console.log('formData:', formData);

        console.log('token:', user.token);

        try {
            const response = await fetch(`${process.env.REACT_APP_PROD_API_URL}/users/uploadPhoto/${userId}`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                alert('Foto subida con éxito: ' + data.photoUrl);
                setUser({...user, photoUrl: data.photoUrl});
            } else {
                alert('Error al subir la foto.');
            }
        } catch (error) {
            console.error('Error al subir la foto:', error);
            alert('Error al subir la foto.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="upload-photo-form">
            <input type="file" onChange={handleFileChange} />
            <button type="submit">Upload Photo</button>
        </form>
    );
}

export default UploadPhotoForm;
