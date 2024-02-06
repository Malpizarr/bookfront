import React, {useState, useEffect, useRef, useCallback} from 'react';
import './Chat.css';
import {handleWebSocketMessage} from "./handleWebSocketMessage";

function Chat({ webSocket, friendId, handleWebSocketMessage }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [hasNewMessages, setHasNewMessages] = useState(false);



    useEffect(() => {
        const handleMessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'message' && data.senderId !== 'you') {
                setHasNewMessages(true); // Marcar que hay nuevos mensajes

            }
            if (data.type === 'chatMessages') {
                const groupedMessages = groupMessagesByDate(data.messages);
                setMessages(prevMessages => {
                    // Combina los mensajes antiguos con los nuevos
                    return {...prevMessages, ...groupedMessages};
                });
                // ...
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

    const handleScroll = () => {
        // verificar si el usuario se ha desplazado hasta abajo
        // y resetear el indicador de nuevos mensajes
        setHasNewMessages(false);
    };


    const formatedrealtime = (timestamp) => {
        // Asumiendo que 'timestamp' es un objeto Date
        const hours24 = timestamp.getHours();
        const hours = ((hours24 + 11) % 12 + 1);
        const amPm = hours24 >= 12 ? 'PM' : 'AM';
        const minutes = ('0' + timestamp.getMinutes()).slice(-2);

        return hours + ':' + minutes + ' ' + amPm.toLowerCase(); // 'pm' en minúsculas
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





// En tu manejador de mensajes WebSocket



    return (
        <div className="chat-container">
            <div className="chat-header">
                Chat with {friendId}
            </div>
            <div className="chat-messages" onScroll={handleScroll}>
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
                <div ref={messagesEndRef} />
            </div>
            {hasNewMessages && <div className="new-messages-indicator">New</div>}
            <div className="chat-input">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}

export default Chat;
