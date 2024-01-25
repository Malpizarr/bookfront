// Components/RegisterForm.js
import React, { useState, useEffect } from 'react';
import './RegisterForm.css';
import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Importa íconos de FontAwesome

function RegisterForm({ onRegister, onToggleForms }) {
    const [mail, setMail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        let timer;

        if (errorMessage) {
            const errorElement = document.querySelector('.error-message');
            if (errorElement) {
                errorElement.style.opacity = 1;
                errorElement.style.visibility = 'visible';
            }

            timer = setTimeout(() => {
                if (errorElement) {
                    errorElement.style.opacity = 0;
                    setTimeout(removeErrorMessage, 1000);
                }
            }, 10000 - 500);
        }

        return () => {
            clearTimeout(timer);
        };
    }, [errorMessage]);

    const removeErrorMessage = () => {
        setErrorMessage('');
        const errorElement = document.querySelector('.error-message');
        if (errorElement) {
            errorElement.style.visibility = 'hidden';
        }
    };

    const handleOAuthRegister = () => {
        window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    };



    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!username || !mail) {
            setErrorMessage('El nombre de usuario y el correo electrónico son obligatorios');
            return;
        }
        if (password !== confirmPassword) {
            setErrorMessage('Las contraseñas no coinciden');
            return;
        }
        setErrorMessage('');
        onRegister(mail, username, password, setErrorMessage);
    };


    return (
        <div className="register-form-container">
            <h2>Registro</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={mail}
                    onChange={(e) => setMail(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Nombre de usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <div className="password-container">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <span className="eye-icon"
                          onMouseDown={togglePasswordVisibility}
                          onMouseUp={togglePasswordVisibility}>
                        {showPassword ? <FaEyeSlash/> : <FaEye/>}
                    </span>
                </div>
                <div className="password-container">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirmar contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <span className="eye-icon"
                          onMouseDown={togglePasswordVisibility}
                          onMouseUp={togglePasswordVisibility}>
                        {showPassword ? <FaEyeSlash/> : <FaEye/>}
                    </span>
                </div>
                <button type="button" onClick={() => {
                    handleOAuthRegister();
                }}>
                    Registrarse con Google
                </button>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                <button type="submit">Registrarse</button>
            </form>
            <Link to="/login" className="link-button-register">¿Ya tienes cuenta? Inicia sesión aquí</Link>
        </div>
    );
}

export default RegisterForm;
