import React, { useState, useEffect } from 'react';
import {useUser} from './UserContext';

// Asegúrate de que la función onSelectBook se recibe correctamente mediante props
function BookFriends({onSelectBook}) {
    const [friendBooks, setFriendBooks] = useState([]);
    const {user} = useUser();

    useEffect(() => {
        const fetchAllFriendBooks = async () => {
            const jwt = user?.token;
            if (!jwt) {
                return;
            }
            try {
                const response = await fetch(`${process.env.REACT_APP_PROD_API_URL}/books/all-friends-books`, {
                    headers: { 'Authorization': `Bearer ${jwt}` }
                });
                const books = await response.json();
                setFriendBooks(books);
            } catch (error) {
                console.error('Error al obtener libros de todos los amigos:', error);
            }
        };

        fetchAllFriendBooks();
    }, [user?.token]);

    // Manejador de eventos para cuando se selecciona un libro
    const handleSelectBook = (book) => {
        if (onSelectBook) {
            onSelectBook(book);
        }
    };

    return (
        <div className="friend-books">
            <h3>Libros de amigos</h3>
            {friendBooks.length > 0 ? (
                friendBooks.map(book => (
                    <div key={book._id} onClick={() => handleSelectBook(book)} className="book-item">
                        <div className="book-item-cover">
                            <div className="book-item-title">{book.title}</div>
                            <div className="book-item-status">{book.status}</div>
                            <div className="book-item-owner">{book.username}</div>
                        </div>
                    </div>
                ))
            ) : (
                <p>No se encontraron libros de amigos.</p>
            )}
        </div>
    );

}

export default BookFriends;
