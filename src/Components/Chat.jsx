import React, {useState, useEffect, useRef, useCallback, useLayoutEffect} from 'react';
import '../Style/Chat.css';
import {handleWebSocketMessage} from "./handleWebSocketMessage";
import {faArrowDown, faCircle} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Link} from "react-router-dom";

function Chat({webSocket, friendId, friendUsername, onClose, friendPhotoUrl, friendStatus}) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isAtBottom, setIsAtBottom] = useState(true);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [hasNewMessages, setHasNewMessages] = useState(false);


    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView();
        }
    }, [messages]);

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const {scrollTop, scrollHeight, clientHeight} = messagesContainerRef.current;
            const margin = 300;
            const atBottom = Math.ceil(scrollTop + clientHeight + margin) >= clientHeight;
            setTimeout(() => setIsAtBottom(atBottom), 100);
        }
    };

    useEffect(() => {
        console.log('Is at bottom:', isAtBottom);
    }, [isAtBottom]);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        const handleMessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'message' && data.senderId !== 'you') {
                setHasNewMessages(true); // Marcar que hay nuevos mensajes

            }
            if (data.type === 'chatMessages') {
                const groupedMessages = groupMessagesByDate(data.messages);
                setMessages(prevMessages => {
                    return {...prevMessages, ...groupedMessages};
                });
                setIsLoading(false);
            } else if (data.type === 'message' && data.senderId === friendId) {
                const newMsg = {
                    ...data,
                    timestamp: formatedrealtime(new Date(data.timestamp))
                };

                setMessages(prevMessages => {
                    const newGroupedMessages = {...prevMessages};

                    const date = new Date().toDateString();
                    if (!newGroupedMessages[date]) {
                        newGroupedMessages[date] = [];
                    }
                    newGroupedMessages[date].push(newMsg);
                    return newGroupedMessages;
                });
            }
        };

        setMessages([]);


        if (webSocket) {
            if (webSocket.readyState === WebSocket.OPEN) {
                webSocket.addEventListener('message', handleMessage);
            } else {
                webSocket.close();
            }

            if (webSocket.readyState === WebSocket.OPEN) {
                webSocket.send(JSON.stringify({type: 'chatRequest', friendId}));
            }

            return () => {
                if (webSocket) {
                    webSocket.removeEventListener('message', handleMessage);
                }
            };
        }
    }, [webSocket, friendId, page, isLoading]);


    function groupMessagesByDate(messages) {
        const groupedMessages = messages.reduce((groups, message) => {
            const date = message.date; // Usa la propiedad date del mensaje
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
            return groups;
        }, {});

        return groupedMessages;
    }


    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            const {scrollHeight, clientHeight} = messagesContainerRef.current;
            messagesContainerRef.current.scrollTop = scrollHeight - clientHeight;

            setTimeout(() => setIsAtBottom(true), 150);
        }
    };
    const formatedrealtime = (timestamp) => {
        if (!(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
            console.error('Timestamp inválido:', timestamp);
            return 'Hora inválida';
        }

        const hours24 = timestamp.getHours();
        const hours = hours24 % 12 || 12; // Convierte "0" horas a "12"
        const amPm = hours24 >= 12 ? 'PM' : 'AM';
        const minutes = timestamp.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes} ${amPm}`;
    }

    const sendMessage = () => {
        setHasNewMessages(false);
        const timestamp = new Date();
        const formattedTimestamp = timestamp.getFullYear() + '-' +
            ('0' + (timestamp.getMonth() + 1)).slice(-2) + '-' +
            ('0' + timestamp.getDate()).slice(-2) + ' ' +
            ('0' + timestamp.getHours()).slice(-2) + ':' +
            ('0' + timestamp.getMinutes()).slice(-2) + ':' +
            ('0' + timestamp.getSeconds()).slice(-2);

        const message = {
            id: Date.now(),
            type: 'sendMessage',
            content: newMessage,
            receiverId: friendId,
            senderId: 'you',
            timestamp: formattedTimestamp,
            timestamphour: formatedrealtime(timestamp) // Pasar el objeto Date directamente
        };
        if (webSocket && webSocket.readyState === WebSocket.OPEN) {
            webSocket.send(JSON.stringify(message));
        }
        setMessages(prevMessages => {
            const date = new Date().toDateString();
            if (!prevMessages[date]) {
                prevMessages[date] = [];
            }
            prevMessages[date].push(message);
            return {...prevMessages};
        });
        setNewMessage("");
    };
    return (
        <>
            <div className="chat-header">
                <Link to={`/profiles/${friendId}`}>
                    <img src={friendPhotoUrl} className="friend-user-photo-chat" alt={friendUsername}/>
                </Link>
                <span className="friend-username">{friendUsername}</span>
                <div className="friend-status">
                    {friendStatus === 'En línea' && (
                        <FontAwesomeIcon icon={faCircle} className="status-icon online"/>
                    )}
                    {friendStatus === 'Fuera de línea' && (
                        <FontAwesomeIcon icon={faCircle} className="status-icon offline"/>
                    )}
                </div>
                <button onClick={onClose} className="close-chat">X</button>
            </div>
            <div className="chat-messages" ref={messagesContainerRef} onScroll={handleScroll}>
                {Object.keys(messages).sort((a, b) => new Date(b) - new Date(a)).map((date, index, arr) => (
                    <div key={date}>
                        <div>{date}</div>
                        {messages[date].map((msg, index) => (
                            <div
                                key={index}
                                className={`message-container ${msg.senderId === friendId ? 'message-received' : 'message-sent'}`}
                            >
                                <span className="message">
                                    {msg.content}
                                </span>
                                <span className="timestamp">
                                    {msg.timestamphour || msg.timestamp}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div ref={messagesEndRef}/>

            {!isAtBottom && (
                <button className="scroll-to-bottom" onClick={scrollToBottom}>
                    <FontAwesomeIcon icon={faArrowDown}/>
                </button>
            )}

            <div className="chat-input">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button onClick={sendMessage}>Send</button>
            </div>

        </>
    );
}

export default Chat;
