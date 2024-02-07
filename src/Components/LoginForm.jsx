// Components/LoginForm.js
import React, {useEffect, useState} from 'react';
import './LoginForm.css';
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function LoginForm({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Limpiar mensaje de error después de 10 segundos
        if (errorMessage) {
            const timer = setTimeout(() => setErrorMessage(''), 10000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);


    const handleSubmit = (event) => {
        event.preventDefault();
        onLogin(username, password, setErrorMessage);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // LoginForm.js

    const handleOAuthLogin = () => {
        // Redirecciona para la autenticación con Google
        window.location.href = 'http://localhost:8081/oauth2/authorization/google';

    };

    const handleFacebookLogin = () => {
        window.location.href = 'http://localhost:8081/oauth2/authorization/facebook';
    };






    return (
        <div className="login-form-container">
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Usuario"/>
                <div className="password-container">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Contraseña"/>
                    <span className="eye-icon"
                          onMouseDown={togglePasswordVisibility}
                          onMouseUp={togglePasswordVisibility}>
                        {showPassword ? <FaEyeSlash/> : <FaEye/>}
                    </span>
                </div>
                <button type="button" onClick={() => {
                    handleOAuthLogin();
                }}>
                    Iniciar sesión con Google
                </button>
                <button type="button" onClick={() => {
                    handleFacebookLogin();
                }
                }>
                    Iniciar sesión con Facebook
                </button>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                <button type="submit">Ingresar</button>
            </form>
            <Link className="link-button-login" to="/register">¿No tienes cuenta? Regístrate aquí</Link>
        </div>
    );
}

export default LoginForm;
