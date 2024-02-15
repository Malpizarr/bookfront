import React, {useState, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useUser} from "./UserContext";
import "../Style/Profile.css";
import UploadPhotoForm from "./UploadPhotoForm";
import Navbar from "./NavBar";

function Profile({onUpdateUser, onBack}) {
    const {username} = useParams(); // Aquí 'username' debe coincidir con el nombre del parámetro en tu ruta
    const {user} = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showChangePasswordPopup, setShowChangePasswordPopup] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const navigate = useNavigate();

    const isCurrentUser = user.username === username; // Verifica si el perfil es del usuario actual
    const [profile, setProfile] = useState({
        username: '',
        email: '',
        photoUrl: '',
    });


    useEffect(() => {
        if (!user.id || !user.email || !isCurrentUser) {
            fetchUserProfile();
        } else {
            setProfile({
                username: user.username,
                email: user.email,
                photoUrl: user.photoUrl,
            });
            setIsLoading(false);
        }
    }, [username, isCurrentUser, user.id, user.token, user.photoUrl]);

    const fetchUserProfile = async () => {
        try {
            const endpoint = `${process.env.REACT_APP_PROD_API_URL}/users/${username}`;
            try {
                const response = await fetch(endpoint, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch user profile');
                }
                const data = await response.json();
                setProfile({
                    username: data.username,
                    email: data.Email,
                    photoUrl: data.PhotoUrl,
                });
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserProfileUpdate = async (username) => {
        try {
            const endpoint = `${process.env.REACT_APP_PROD_API_URL}/users/${username}`;
            try {
                const response = await fetch(endpoint, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch user profile');
                }
                const data = await response.json();
                setProfile({
                    username: data.username,
                    email: data.Email,
                    photoUrl: data.PhotoUrl,
                });
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_PROD_API_URL}/users/updatePassword/${user.id}`, {
                method: 'PUT', // Cambiado a PUT
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({
                    oldPassword: oldPassword,
                    newPassword: newPassword,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cambiar la contraseña.');
            }

            alert('Contraseña cambiada con éxito.');
            setShowChangePasswordPopup(false);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (error) {
            alert(error.message);
        }
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        const updatedUser = {
            username: profile.username,
            email: profile.email,
            photoUrl: profile.photoUrl,
        };

        onUpdateUser(updatedUser);
        fetchUserProfileUpdate(updatedUser.username);
        navigate(`/profiles/${profile.username}`);
    };


    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <div className="loading-message">Loading User details...</div>
            </div>
        );
    }

    return (
        <>
            <Navbar/>
            <div className="page-editor-buttons">
                <button onClick={onBack} className="page-editor-button">Back</button>
                {isCurrentUser && (
                    <button onClick={() => setShowChangePasswordPopup(true)} className="page-editor-button">
                        Change Password
                    </button>
                )}
            </div>

            {showChangePasswordPopup && (
                <div className="change-password-overlay">
                    <div className="change-password-popup">
                        <h3>Change Password</h3>
                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <label>Old Password:</label>
                                <input
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password:</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password:</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            <div className="change-password-actions">
                                <button type="submit" className="button-form">Change</button>
                                <button
                                    type="button"
                                    onClick={() => setShowChangePasswordPopup(false)}
                                    className="button-form cancel"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <button onClick={onBack} className="profile-button">Back</button>
            <div className="profile-container">
                <div className="page-editor-buttons">
                </div>
                <h2>User Profile</h2>
                {isCurrentUser ? (
                    <>
                        <img className="user-photo" src={profile.photoUrl} alt="Foto de perfil"/>
                        <UploadPhotoForm userId={user.id}/>
                        <form onSubmit={handleSubmit} className="profile-form">
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={profile.username}
                                    onChange={(e) => setProfile({...profile, username: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={profile.email}
                                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                                />
                            </div>
                            <button type="submit" className="button-form">Update</button>
                        </form>
                        {isCurrentUser && (
                            <button onClick={() => setShowChangePasswordPopup(true)} className="button-form">
                                Change Password
                            </button>
                        )}
                    </>
                ) : (
                    <div className="profile-info">
                        <p>Username: {profile.username}</p>
                        <p>Email: {profile.email}</p>
                        <img className="user-photo" src={profile.photoUrl} alt="Foto de perfil"/>
                    </div>
                )}
            </div>
        </>
    );
}

export default Profile;
