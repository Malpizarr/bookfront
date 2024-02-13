// Components/RegisterForm.js
import React, { useState, useEffect } from 'react';
import '../Style/RegisterForm.css';
import {Link, useNavigate} from "react-router-dom";
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Importa íconos de FontAwesome

function RegisterForm({ onRegister, onToggleForms }) {
    const [mail, setMail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
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
        window.location.href = `https://bookauth.onrender.com/oauth2/authorization/google`;
    };

    const handleBack = () => {
        navigate('/');
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
        <>
            <button className="back-button-register" onClick={handleBack}>Back</button>
        <div className="register-form-container">
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={mail}
                    onChange={(e) => setMail(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <div className="password-container">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
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
                        placeholder="Confirm password"
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
                    Register with Google
                </button>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                <button type="submit">Register</button>
            </form>
            <Link to="/login" className="link-button-register">Already Signed Up? Sign In here</Link>
        </div>
        </>
    );
}

export default RegisterForm;
