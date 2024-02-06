import React, { useEffect, useRef, useState } from 'react';
import { useUser } from './UserContext';
import './FriendsList.css';
import Navbar from "./NavBar";
import { useWebSocket } from "./WebSocketContext";
import Chat from "./Chat";

function FriendList({ onLogout }) {
    const [friends, setFriends] = useState([]);
    const [selectedFriendId, setSelectedFriendId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUser();
    const { webSocket, setWebSocket } = useWebSocket();
    const [unreadCount, setUnreadCount] = useState({});

    const incrementUnreadCount = (friendId) => {
        setUnreadCount(prevCount => ({
            ...prevCount,
            [friendId]: (prevCount[friendId] || 0) + 1
        }));
    };

    const resetUnreadCount = (friendId) => {
        setUnreadCount(prevCount => ({
            ...prevCount,
            [friendId]: 0
        }));
    };

    useEffect(() => {
        fetchFriends();
    }, [user]);

    const openChat = async (friendId) => {
        setSelectedFriendId(friendId);
        resetUnreadCount(friendId); // Restablecer en el estado local

        // Enviar solicitud al servidor para restablecer el contador
        const jwt = user.token;
        await fetch('https://bookgateway.mangotree-fab2eccd.eastus.azurecontainerapps.io/chat/reset-unread-messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ senderId: friendId })
        });
    };



    const handleMessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'friendsList') {
            updateFriendsOnlineStatus(message.friends);
        }

        if (message.type === 'newUnreadMessage' && message.senderId !== selectedFriendId) {
            incrementUnreadCount(message.senderId);
        }

        // Otros manejadores de mensajes
    };

    useEffect(() => {
        const fetchUnreadMessages = async () => {
            // Asume que tienes una función para obtener el token JWT
            const jwt = user.token;
            const response = await fetch('https://bookgateway.mangotree-fab2eccd.eastus.azurecontainerapps.io/chat/unread-messages', {
                headers: {
                    'Authorization': `Bearer ${jwt}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al obtener mensajes no leídos');
            }

            const data = await response.json();
            // Actualizar el estado con los mensajes no leídos
            setUnreadCount(data.reduce((acc, item) => {
                acc[item.senderId] = item.unreadCount;
                return acc;
            }, {}));
        };

        fetchUnreadMessages().catch(console.error);
    }, []);


    const handleWebSocketMessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'friendsList') {
            const updatedFriends = friends.map(friend => ({
                ...friend,
                status: message.friends.includes(friend.friendId) ? 'En línea' : 'Fuera de línea'
            }));
            setFriends(updatedFriends);
        } else if (message.type === 'newUnreadMessage' && message.senderId !== user.id) {
            incrementUnreadCount(message.senderId);
        }
        // Otros manejadores de mensajes
    };

    useEffect(() => {
        // Función para solicitar datos a través del WebSocket
        const requestFriendsList = () => {
            if (webSocket && webSocket.readyState === WebSocket.OPEN) {
                webSocket.send(JSON.stringify({ type: 'friendsListRequest' }));
            }
        };


        // Manejador para mensajes entrantes
        const handleMessage = (event) => {
            handleWebSocketMessage(event);
        };

        // Manejador para la reconexión
        const handleOpen = () => {
            requestFriendsList();
        };

        // Solicitar lista de amigos inicialmente si el WebSocket está abierto


        if (webSocket) {
            webSocket.addEventListener('message', handleMessage);
            webSocket.addEventListener('open', handleOpen);
        }

        requestFriendsList();
        return () => {
            if (webSocket) {
                webSocket.removeEventListener('message', handleMessage);
                webSocket.removeEventListener('open', handleOpen);
            }
        };
    }, [webSocket, friends]); // Dependencia de useEffect

    const setupWebSocket = (webSocketInstance) => {
        // Asegura que no haya duplicidad en los event listeners
        webSocketInstance.onmessage = null;
        webSocketInstance.onerror = null;
        webSocketInstance.onclose = null;



        webSocketInstance.onmessage = handleMessage;

        webSocketInstance.onerror = (event) => {
            console.error('WebSocket error:', event);
        };

        webSocketInstance.onclose = (event) => {
            console.log('WebSocket desconectado', event);
            setWebSocket(null); // Asegúrate de reiniciar el WebSocket en el contexto
        };
    };

    const updateFriendsOnlineStatus = (onlineFriends) => {
        const updatedFriends = friends.map(friend => {
            const isOnline = onlineFriends.includes(friend.friendId);
            const unreadMessages = unreadCount[friend.friendId] || 0;
            return {
                ...friend,
                status: isOnline ? 'En línea' : 'Fuera de línea',
                unreadMessages: unreadMessages
            };
        });

        setFriends(updatedFriends);
    };




    const fetchFriends = async () => {
        setIsLoading(true);
        const jwt = user.token;

        if (!jwt) {
            console.error('No se encontró el token JWT');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`https://bookgateway.mangotree-fab2eccd.eastus.azurecontainerapps.io/api/friendships/friends`, {
                headers: {
                    'Authorization': `Bearer ${jwt}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar amistades');
            }

            const data = await response.json();
            setFriends(data);
        } catch (error) {
            console.error('Error al obtener amistades:', error);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <>
            <Navbar/>
            <div className="friend-list">
                <button className="logout-button" onClick={onLogout}>Logout</button>
                {isLoading ? (
                    <div>Loading...</div>
                ) : (
                    friends.map((friend) => (
                        <div className="friend-item" key={friend.id} onClick={() => openChat(friend.friendId)}>
                            <div className="friend-item-photo">
                                {friend.photoUrl && (
                                    <img src={friend.photoUrl} alt="User" className="friend-user-photo"/>
                                )}
                            </div>
                            <div className="friend-item-name">
                                {friend.friendUsername}
                            </div>
                            <div className="friend-item-status">
                                {friend.status}
                            </div>
                            {unreadCount[friend.friendId] > 0 && (
                                <div className="unread-indicator">{unreadCount[friend.friendId]}</div>
                            )}
                        </div>
                    ))
                )}
                {selectedFriendId && (
                    <Chat
                        webSocket={webSocket}
                        friendId={selectedFriendId}
                        handleWebSocketMessage={handleWebSocketMessage}
                    />
                )}
            </div>
        </>
    );
}

export default FriendList;
