// Navbar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';
import { useUser } from './UserContext';

function Navbar() {
    const { user } = useUser();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleToggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/" className="navbar-brand">My Book App</Link>
                <div className="navbar-toggle" onClick={handleToggleMenu}>
                    &#9776;
                </div>
            </div>
            <div className="navbar-links">
                <div className={`${isMenuOpen ? 'active' : ''}`}>
                    {user && (
                        <>

                            <Link to="/books" className="navbar-item">Books</Link>
                            <Link to="/editor" className="navbar-item">Editor</Link>
                            <Link to="/books" className="navbar-item">
                                {user.PhotoUrl && (
                                    <img src={user.PhotoUrl} alt="User" className="navbar-user-photo"/>
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
            </div>
        </nav>
    );
}

export default Navbar;
