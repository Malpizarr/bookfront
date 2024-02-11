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
                console.error('No se encontró el token JWT');
                return;
            }
            try {
                const response = await fetch(`http://localhost:8081/books/all-friends-books`, {
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
        console.log('Seleccionando libro:', book);
        if (onSelectBook) {
            console.log('Entro:', book);
            onSelectBook(book);
        }
    };

    return (
        <div className="friend-books">
            <h2>Libros de amigos</h2>
            {friendBooks.length > 0 ? (
                friendBooks.map(book => (
                    <div onClick={() => handleSelectBook(book)} className="book-item">
                        <div key={book._id} className="book-item-cover">
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
