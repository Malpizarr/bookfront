// Components/LoginForm.js
import React, {useEffect, useState} from 'react';
import '../Style/LoginForm.css';
import {Link, useNavigate} from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function LoginForm({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Limpiar mensaje de error después de 10 segundos
        if (errorMessage) {
            const timer = setTimeout(() => setErrorMessage(''), 10000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    const handleBack = () => {
        navigate('/');
    };


    const handleSubmit = (event) => {
        event.preventDefault();
        onLogin(username, password, setErrorMessage);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleOAuthLogin = () => {
        // Redirecciona para la autenticación con Google
        window.location.href = `https://bookauth-c0fd8fb7a366.herokuapp.com/oauth2/authorization/google`;

    };

    const handleFacebookLogin = () => {
        window.location.href = `https://bookauth-c0fd8fb7a366.herokuapp.com/oauth2/authorization/facebook`;
    };


    return (
        <>
            <button className="back-button" onClick={handleBack}>Back</button>
        <div className="login-form-container">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username or Email"/>
                <div className="password-container">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"/>
                    <span className="eye-icon"
                          onMouseDown={togglePasswordVisibility}
                          onMouseUp={togglePasswordVisibility}>
                        {showPassword ? <FaEyeSlash/> : <FaEye/>}
                    </span>
                </div>
                <button type="button" onClick={() => {
                    handleOAuthLogin();
                }}>
                    Login with Google
                </button>
                <button type="button" onClick={() => {
                    handleFacebookLogin();
                }
                }>
                    Login with Facebook
                </button>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                <button type="submit">Login</button>
            </form>
            <Link className="link-button-login" to="/register">You don't have a Account? Sign Up here!</Link>
        </div>
        </>
    );
}

export default LoginForm;
