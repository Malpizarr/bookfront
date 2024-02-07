import React, { useState, useEffect } from 'react';
import {useUser} from './UserContext';

function BookFriends() {
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
    }, []);



    return (
        <div className="friend-books">
            {friendBooks.length > 0 ? (
                friendBooks.map(book => (
                    <div key={book._id} className="book-item">
                        <div>{book.username}</div>
                        <div>{book.title}</div>
                        {/* Agregar más detalles si se desea */}
                    </div>
                ))
            ) : (
                <p>No se encontraron libros de amigos.</p>
            )}
        </div>
    );
}

export default BookFriends;
