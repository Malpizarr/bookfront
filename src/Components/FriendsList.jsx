import React, {useEffect, useState} from 'react';
import { useUser } from './UserContext';
import '../Style/FriendsList.css';
import { useWebSocket } from "./WebSocketContext";
import Chat from "./Chat";
import SearchUsers from "./SearchUsers";

function FriendList({ onLogout }) {
    const [view, setView] = useState('friends'); // 'friends' o 'pending'
    const [friends, setFriends] = useState([]);
    const [selectedFriendId, setSelectedFriendId] = useState(null);
    const [pendingFriends, setPendingFriends] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUser();
    const {webSocket} = useWebSocket();
    const [unreadCount, setUnreadCount] = useState({});
    const [friendsCache, setFriendsCache] = useState(null); // Estado para almacenar el caché de amigos
    const [pendingFriendsCache, setPendingFriendsCache] = useState(null);
    const [isChatVisible, setIsChatVisible] = useState(false);
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
        if (view === 'friends') {
            if (friendsCache) {
                setFriends(friendsCache);
            } else {
                fetchFriends();
            }
        } else {
            if (pendingFriendsCache) {
                setPendingFriends(pendingFriendsCache);
            } else {
                fetchPendingFriends();
            }
        }
    }, [user, view]);

    useEffect(() => {
        // Intenta cargar la lista de amigos desde el caché primero
        if (friendsCache) {
            setFriends(friendsCache);
        } else {
            fetchFriends();
        }
    }, [user, friendsCache]);

    const fetchPendingFriends = async () => {
        setIsLoading(true);
        const jwt = user.token;
        try {
            const response = await fetch(`${process.env.REACT_APP_PROD_API_URL}/api/friendships/pending`, {
                headers: {
                    'Authorization': `Bearer ${jwt}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al cargar solicitudes pendientes');
            }
            const data = await response.json();
            setPendingFriendsCache(data);
            setPendingFriends(data);
        } catch (error) {
            console.error('Error al obtener solicitudes pendientes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const openChat = async (friendId) => {
        setSelectedFriendId(friendId);
        resetUnreadCount(friendId); // Restablecer en el estado local
        setIsChatVisible(true); // Mostrar el chat
        // Enviar solicitud al servidor para restablecer el contador
        const jwt = user.token;
        await fetch(`${process.env.REACT_APP_PROD_API_URL}/chat/reset-unread-messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ senderId: friendId })
        });
    };

    const closeChat = () => {
        setIsChatVisible(false);
        setSelectedFriendId(null); // Opcional, dependiendo de cómo desees manejar la lógica del chat
    };



    useEffect(() => {
        if (!user || !user.token) return;
        const fetchUnreadMessages = async () => {
            // Asume que tienes una función para obtener el token JWT
            const jwt = user.token;
            const response = await fetch(`${process.env.REACT_APP_PROD_API_URL}/chat/unread-messages`, {
                headers: {
                    'Authorization': `Bearer ${jwt}`
                }
            });

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            // Actualizar el estado con los mensajes no leídos
            setUnreadCount(data.reduce((acc, item) => {
                acc[item.senderId] = item.unreadCount;
                return acc;
            }, {}));
        };

        fetchUnreadMessages().catch(error => {
            return;
        });
    }, []);


    const handleWebSocketMessage = (event) => {
        const message = JSON.parse(event.data);


        switch (message.type) {
            case 'friendsList':
                updateFriendsOnlineStatus(message.friends);
                break;
            case 'newUnreadMessage':
                if (message.senderId !== selectedFriendId) {
                    incrementUnreadCount(message.senderId);
                }
                break;
            case 'friendshipAccepted':
                fetchFriends();
                fetchPendingFriends();
                webSocket.send(JSON.stringify({type: 'forcedUpdatelist', friendId: user.id}));
                break;
            case 'friendshipRequested':
                fetchPendingFriends();
                break;
            case 'friendshipDeleted':
                fetchFriends();
                fetchPendingFriends();
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        const requestFriendsList = () => {
            if (webSocket && webSocket.readyState === WebSocket.OPEN) {
                webSocket.send(JSON.stringify({ type: 'friendsListRequest' }));
            }
        };

        const handleMessage = (event) => {
            handleWebSocketMessage(event);
        };

        const handleOpen = () => {
            requestFriendsList();
        };



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


    const updateFriendsOnlineStatus = (onlineFriendsIds) => {
        setFriends(prevFriends => prevFriends.map(friend => ({
            ...friend,
            status: onlineFriendsIds.includes(friend.friendId) ? 'En línea' : 'Fuera de línea'
        })));
    };


    const sendFriendRequest = async (friendId) => {
        if (!user) return;
        const jwt = user.token;
        await fetch('http://localhost:8081/api/friendships/createfriendship', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({requesterId: user.id, friendId})
        });
        await fetchFriends();
        webSocket.send(JSON.stringify({type: 'friendRequest', userId: user.id, friendId: friendId}));
    };

    const acceptFriendRequest = async (friendshipId, friendId) => {
        if (!user) return;
        const jwt = user.token;
        const url = new URL('http://localhost:8081/api/friendships/accept');
        url.searchParams.append('friendshipId', friendshipId); // Añade friendshipId como parámetro de consulta

        await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json'
            }
        });
        webSocket.send(JSON.stringify({type: 'acceptedFriendRequest', userId: user.id, friendId: friendId}));
    };








    const fetchFriends = async () => {
        setIsLoading(true);

        if (!user || !user.token) return;
        try {
            const response = await fetch(`http://localhost:8081/api/friendships/friends`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar amigos');
            }

            const data = await response.json();
            setFriends(data);
            setFriendsCache(data); // Actualiza el caché con los nuevos datos
        } catch (error) {
            return;
        } finally {
            setIsLoading(false);
        }
    };


    const deleteFriend = async (Id, friendId) => {
        const url = new URL('http://localhost:8081/api/friendships/deletefriendship');
        url.searchParams.append('friendshipId', Id); // Añade friendshipId como parámetro de consulta
        const jwt = user.token;
        await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json'
            },
        });

        webSocket.send(JSON.stringify({type: 'deletedFriend', userId: user.id, friendId: friendId}));
        webSocket.send(JSON.stringify({type: 'forcedUpdatelist', userId: user.id, friendId: friendId}));
    }



    return (
        <>
            <div className="friend-list">
                <div className="friend-list-cont">
                <SearchUsers onSendFriendRequest={sendFriendRequest}/>
                <div className="view-selector">
                    <button onClick={() => setView('friends')}>Amigos</button>
                    <button onClick={() => setView('pending')}>Solicitudes Pendientes</button>
                </div>
                {isLoading ?
                    <div className={"loading"}>Loading...</div> : view === 'friends' ? (
                        friends.map((friend) => (
                            <div className="friend-item" key={friend.id}>
                                <div onClick={() => openChat(friend.friendId)} style={{cursor: 'pointer'}}>
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
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    deleteFriend(friend.id, friend.friendId);
                                }}>Eliminar
                                </button>
                            </div>
                        ))
                    ) : (
                        pendingFriends.map((friend) => (
                            <div key={friend.id} className="friend-item">
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
                                {friend.requesterId !== user.id && (
                                    <button
                                        onClick={() => acceptFriendRequest(friend.id, friend.friendId)}>Accept</button>
                                )}

                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    deleteFriend(friend.id, friend.friendId);
                                }}>Eliminar
                                </button>
                            </div>
                        )))
                }
                </div>
                {isChatVisible && selectedFriendId && (
                    <div className={`chat-container`}>
                        <Chat
                            webSocket={webSocket}
                            friendId={selectedFriendId}
                            handleWebSocketMessage={handleWebSocketMessage}
                            onClose={closeChat} // Pasar la función closeChat al componente Chat
                            friendUsername={friends.find(f => f.friendId === selectedFriendId)?.friendUsername}
                            friendPhotoUrl={friends.find(f => f.friendId === selectedFriendId)?.photoUrl}
                            friendStatus={friends.find(f => f.friendId === selectedFriendId)?.status}
                        />
                    </div>
                )}
            </div>

        </>
    );
}

export default FriendList;