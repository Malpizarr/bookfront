export function handleWebSocketMessage(event, setFriends, setMessages, friendId) {
    const data = JSON.parse(event.data);

    if (data.type === 'friendsList' && setFriends) {
        setFriends(friends => friends.map(friend => ({
            ...friend,
            status: data.friends.includes(friend.friendId) ? 'En línea' : 'Fuera de línea'
        })));
    } else if (data.type === 'chatMessages' && friendId) {
        setMessages(data.messages);
    } else if (data.type === 'message' && data.senderId === friendId) {
        setMessages(prevMessages => [...prevMessages, data]);
    }
}
