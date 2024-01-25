import React, { useState, useEffect } from 'react';

function BookFriends() {
    const [friendBooks, setFriendBooks] = useState([]);
    
    useEffect(() => {
        const fetchAllFriendBooks = async () => {
            const jwt = localStorage.getItem('jwt');
            if (!jwt) {
                console.error('No se encontró el token JWT');
                return;
            }

            try {
                const response = await fetch(`https://bookgateway.mangotree-fab2eccd.eastus.azurecontainerapps.io/books/all-friends-books`, {
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
                        {/* Agregar más detalles si lo deseas */}
                    </div>
                ))
            ) : (
                <p>No se encontraron libros de amigos.</p>
            )}
        </div>
    );
}

export default BookFriends;
