// Navbar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../Style/NavBar.css';
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
                <img className={"ShareSpace-logo"}
                     src="/images/b396b856-0551-435d-a6ce-7f725894bd97-removebg-preview.png" alt={"logo"}/>
                <Link to="/" className="navbar-brand">ShareSpace</Link>
                <div className="navbar-toggle" onClick={handleToggleMenu}>
                    &#9776;
                </div>
            </div>
            <div className="navbar-links">
                <div className={isMenuOpen ? 'active' : ''}>
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
            </div>
        </nav>
    );
}

export default Navbar;
