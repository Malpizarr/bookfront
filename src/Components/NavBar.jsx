import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../Style/NavBar.css';
import { useUser } from './UserContext';

function Navbar() {
    const { user } = useUser();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleToggleMenu = () => {
        setIsMenuOpen(!isMenuOpen); // Cambia el estado de isMenuOpen para mostrar/ocultar el menú
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <img src="/images/b396b856-0551-435d-a6ce-7f725894bd97-removebg-preview.png" alt="Logo"
                     className="ShareSpace-logo"/>
                <Link to="/" className="navbar-brand">ShareSpace</Link>
            </div>
            <div className="navbar-toggle" onClick={handleToggleMenu}>
                &#9776; {/* Icono de menú hamburguesa */}
            </div>
            <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
                {user && (
                    <>
                        <Link to="/books" className="navbar-item">Books</Link>
                        <Link to={`/profiles/${user.username}`} className="navbar-item">
                            {user.photoUrl ? (
                                <img src={user.photoUrl} alt="User" className="navbar-user-photo"/>
                            ) : (
                                <span>{user.username}</span>
                            )}
                        </Link>
                    </>
                )}
                {!user && (
                    <>
                        <Link to="/login" className="navbar-item">Login</Link>
                        <Link to="/register" className="navbar-item">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
