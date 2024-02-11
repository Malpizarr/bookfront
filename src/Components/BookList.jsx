import React, { useEffect, useState } from 'react';
import { useUser } from './UserContext';
import '../Style/BookList.css';
import Navbar from "./NavBar";
import FriendList from "./FriendsList";
import BookFriends from "./BookFriends";
import UploadPhotoForm from "./UploadPhotoForm";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faEnvelope} from '@fortawesome/free-solid-svg-icons';

function BookList({ onSelectBook, onLogout }) {
    const [books, setBooks] = useState([]);
    const [newBook, setNewBook] = useState("");
    const [editingBookId, setEditingBookId] = useState(null);
    const [newBookTitle, setNewBookTitle] = useState("");
    const [newBookStatus, setNewBookStatus] = useState("");
    const { user } = useUser();
    const [isFriendListVisible, setIsFriendListVisible] = useState(false);
    const [isLoading, setIsloading] = useState(false);




    useEffect(() => {
        fetchBooks();
    }, [user]);

    const selectBook = (book) => {
        onSelectBook(book);
    };


    const handleUpdateBook = async (e) => {
        e.preventDefault();
        try {
            const bookToUpdate = books.find(book => book._id === editingBookId);
            const updatedBook = {
                ...bookToUpdate,
                title: newBookTitle,
                status: newBookStatus
            };

            const response = await fetch(`http://localhost:8081/books/update/${editingBookId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(updatedBook),
            });

            if (!response.ok) {
                throw new Error('Error al actualizar el libro');
            }

            // Actualiza el estado de los libros en el cliente
            setBooks(books.map(book => book._id === editingBookId ? updatedBook : book));
            setEditingBookId(null); // Finaliza la edición
        } catch (error) {
            console.error('Error al actualizar el libro:', error);
        }
    };

    const fetchBooks = async () => {
        setIsloading(true);
        if (!user) return;
        const jwt = user.token;
        if (!jwt) {
            console.error('No se encontró el token JWT');
            return;
        }

        try {
            const response = await fetch(`http://localhost:8081/books/all`, {
                headers: {
                    'Authorization': `Bearer ${jwt}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar libros');
            }

            const data = await response.json();
            setBooks(data);
        } catch (error) {
            console.error('Error al obtener libros:', error);
        } finally {
            setIsloading(false);
        }
    };



    let clickCount = 0; // Contador de clics
    let clickTimer = null; // Temporizador para identificar doble clic

    const handleBookSelect = (event, book) => {
        event.stopPropagation();
        clickCount++;
        if (clickCount === 1) {
            clickTimer = setTimeout(() => {
                if (clickCount === 1 && editingBookId === null) {
                    onSelectBook(book); // Clic simple
                }
                clickCount = 0;
            }, 400); // Intervalo de tiempo para esperar un segundo clic
        } else if (clickCount === 2) {
            clearTimeout(clickTimer); // Limpia el temporizador y maneja el doble clic
            setEditingBookId(book._id);
            setNewBookTitle(book.title);
            clickCount = 0;
        }
    };



    // Manejar el cambio de título
    const handleTitleChange = (event) => {
        setNewBookTitle(event.target.value);
    };



    // Manejo del cambio de estado del libro
    const handleStatusChange = (e) => {
        setNewBookStatus(e.target.value);
    };


    const addNewBook = async () => {
        try {
            const response = await fetch(`http://localhost:8081/books/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({ title: newBook }),
            });

            if (!response.ok) {
                throw new Error('Error al crear el libro');
            }

            fetchBooks();
            setNewBook("");
        } catch (error) {
            console.error('Error al crear el libro:', error);
        }
    };

    const deleteBook = async (bookId) => {
        try {
            const response = await fetch(`http://localhost:8081/books/delete/${bookId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Error al eliminar el libro');
            }

            setBooks(books.filter(book => book._id !== bookId));
        } catch (error) {
            console.error('Error al eliminar el libro:', error);
        }
    };


    return (
        <>
            <Navbar/>
            <div className="book-list">
                <div className="new-book-form">
                    <input
                        type="text"
                        value={newBook}
                        onChange={(e) => setNewBook(e.target.value)}
                        placeholder="Título del nuevo libro"
                    />
                    <button onClick={addNewBook}>Agregar Libro</button>
                </div>

                <button className="logout-button" onClick={onLogout}>Logout</button>
                <BookFriends onSelectBook={onSelectBook}/>

                {isLoading ? (
                    <div className="loading-container-books">
                        <div className="spinner-books"></div>
                        <div className="loading-message-books">Loading books...</div>
                    </div>
                ) : (
                    books.map((book) => (
                        <div className="book-item" key={book._id}>
                            {editingBookId === book._id ? (
                                <form onSubmit={handleUpdateBook}>
                                    <select value={newBookStatus} onChange={handleStatusChange}>
                                        <option value="Public">Public</option>
                                        <option value="Private">Private</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={newBookTitle}
                                        onChange={handleTitleChange}
                                        autoFocus
                                    />
                                    <button type="submit">Actualizar</button>
                                    <button onClick={() => setEditingBookId(null)}>Cancelar</button>
                                </form>
                            ) : (
                                <>
                                    <div onClick={() => selectBook(book)} className="book-item-details">
                                        <div className="book-item-title">{book.title}</div>
                                        <div className="book-item-status">{book.status}</div>
                                    </div>
                                    <button onClick={() => {
                                        setEditingBookId(book._id);
                                        setNewBookTitle(book.title);
                                        setNewBookStatus(book.status);
                                    }}>Editar
                                    </button>
                                </>
                            )}
                            <button onClick={() => deleteBook(book._id)}>Eliminar</button>
                        </div>
                    ))
                )}
            </div>
            <div className={`friend-list ${isFriendListVisible ? 'visible' : 'hidden'}`}
                 style={{transform: isFriendListVisible ? 'scale(1)' : 'scale(0)'}}>
                <FriendList onLogout={onLogout}/>
            </div>
            <button onClick={() => setIsFriendListVisible(!isFriendListVisible)} className="friend-list-button">
                <FontAwesomeIcon icon={faEnvelope}/>
            </button>
        </>
    );
}


export default BookList;
