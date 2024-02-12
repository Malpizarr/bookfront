import React, {useState, useEffect, useRef} from 'react';
import { useUser } from './UserContext';
import BookNavigation from './BookNavigation';
import ReactQuill, { Quill } from 'react-quill';
import ImageResize from 'quill-image-resize-module-react';
import 'react-quill/dist/quill.snow.css';
import '../Style/PageEditor.css';
import Navbar from "./NavBar";
import {useParams} from "react-router-dom";





Quill.register('modules/imageResize', ImageResize);


function PageEditor({onLogout, onBack}) {
    const [currentPageContent, setCurrentPageContent] = useState('');
    const [currentPage, setCurrentPage] = useState({ content: '' });
    const [currentPageNumber, setCurrentPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const { user } = useUser();
    const [isContentChanged, setIsContentChanged] = useState(false);
    const saveTimer = useRef(null);
    const [saveStatus, setSaveStatus] = useState('guardado'); // Puede ser 'guardado', 'noGuardado', 'guardando'
    const quillRef = useRef(null);
    const [autoSaveNeeded, setAutoSaveNeeded] = useState(false); // Nuevo estado para indicar si el autoguardado es necesario
    const [book, setBook] = useState(null);
    const [pageCache, setPageCache] = useState({}); // Nuevo estado para almacenar en caché las páginas cargadas
    const [isOwner, setIsOwner] = useState(false);
    const {bookId} = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isPrivate, setIsPrivate] = useState(false);

    useEffect(() => {
        if (currentPageNumber > totalPages) {
            setCurrentPageNumber(Math.max(totalPages, 1));
        }
    }, [totalPages, currentPageNumber]);

    useEffect(() => {
        let timer;
        if (saveStatus === 'noGuardado') {
            timer = setTimeout(() => {
                if (saveStatus === 'noGuardado') {
                    handlePageUpdate(currentPageContent, currentPageNumber);
                }
            }, 1000);
        }

        return () => clearTimeout(timer);
    }, [saveStatus]);


    const fetchBook = async () => {
        let response;
        try {
            setIsLoading(true);

            // Elige el método apropiado basado en la presencia del token
            const options = user.token ? {headers: {'Authorization': `Bearer ${user.token}`}} : {
                method: 'GET',
                credentials: 'include'
            };
            response = await fetch(`${process.env.REACT_APP_PROD_API_URL}/books/${bookId}`, options);

            if (!response.ok) {
                if (response.status === 403 || response.status === 401) {
                    // Si el servidor responde con un estado 403 Forbidden o 401 Unauthorized,
                    // maneja específicamente este caso como un libro privado al que el usuario no tiene acceso
                    setIsPrivate(true);
                    setIsOwner(false);
                    throw new Error('Este libro es privado y no tienes acceso.');
                } else {
                    // Para otros tipos de errores, simplemente notifica que no se pudieron obtener los detalles del libro
                    throw new Error('Failed to fetch book details');
                }
            }

            const bookData = await response.json();
            setBook(bookData);

            // Verifica si el usuario es el propietario del libro (esto depende de cómo esté estructurado tu objeto bookData)
            const isUserOwner = user.id && bookData.userId && bookData.userId === user.id;
            setIsOwner(isUserOwner);

            // Configura isPrivate basado en el estado del libro y si el usuario es el propietario
            setIsPrivate(bookData.status === 'Private' && !isUserOwner);
        } catch (err) {
            setError(err.message);
            // Aquí también podrías establecer estados adicionales para mostrar mensajes específicos en la UI si es necesario
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        fetchBook();
    }, [bookId, user.token, user.id]);

    const handleKeyPress = (e) => {
        if ((e.ctrlKey && e.key === 's') || (e.ctrlKey && e.key === 'S') || (e.metaKey && e.key === 's') ) {
            e.preventDefault();
            saveContent(currentPageNumber);
        }
    };


    useEffect(() => {
        document.addEventListener('keydown', handleKeyPress);
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [currentPageContent]);

    const saveContent = (pageNumber) => {
        if (quillRef.current) {
            const currentContent = quillRef.current.getEditor().root.innerHTML;
            handlePageUpdate(currentContent, pageNumber);
            setIsContentChanged(false);
        } else {
            console.error('Editor Quill no está disponible');
        }
    };



    useEffect(() => {
        fetchCurrentPage().then(() => {
            setIsContentChanged(false);
            setSaveStatus('guardado');
        });
        fetchTotalPages().then(() => {
            setIsContentChanged(false);
        });
    }, [book, currentPageNumber, user.username]);

    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
            ['blockquote', 'code-block'],

            [{'header': 1}, {'header': 2}],               // custom button values
            [{'list': 'ordered'}, {'list': 'bullet'}],
            [{'script': 'sub'}, {'script': 'super'}],      // superscript/subscript
            [{'indent': '-1'}, {'indent': '+1'}],          // outdent/indent
            [{'direction': 'rtl'}],                         // text direction

            [{'size': ['small', false, 'large', 'huge']}],  // custom dropdown
            [{'header': [1, 2, 3, 4, 5, 6, false]}],

            [{'color': []}, {'background': []}],          // dropdown with defaults from theme
            [{'font': []}],
            [{'align': []}],
            ['link', 'image'], // Enlace e imagen y video
            ['clean']                                         // remove formatting button

        ],
        clipboard: {
            matchVisual: false
        },
        imageResize: {
            parchment: Quill.import('parchment'),
            modules: ['Resize', 'DisplaySize']
        }
    };

    const formats = [
        'header',
        'font',
        'size',
        'bold',
        'italic',
        'underline',
        'strike',
        'blockquote',
        'list',
        'bullet',
        'indent',
        'link',
        'image',
        'video',
        'align',
        'color'
    ];



    useEffect(() => {
        return () => {
            if (saveTimer.current) {
                clearTimeout(saveTimer.current);
            }
        };
    }, []);




    useEffect(() => {
        if (autoSaveNeeded && isContentChanged) {
            saveContent(currentPageNumber);
            setAutoSaveNeeded(false);
        }
    }, [autoSaveNeeded, isContentChanged, currentPageNumber]);


    useEffect(() => {
        if (quillRef.current) {
            const quill = quillRef.current.getEditor();

            const checkForChanges = () => {
                if (isContentChanged) { // Solo revisar si hay cambios reales
                    setSaveStatus('noGuardadoEdit');

                    if (saveTimer.current) {
                        clearTimeout(saveTimer.current);
                    }

                    saveTimer.current = setTimeout(() => {
                        saveContent(currentPageNumber);
                        setIsContentChanged(false);
                    }, 2000);
                }
            };

            quill.on('text-change', checkForChanges);
            return () => quill.off('text-change', checkForChanges);
        }
    }, [quillRef, isContentChanged, currentPageNumber]);



    const handleContentChange = (content, delta, source, editor) => {
        if (isOwner) {
            const formattedContent = editor.getHTML();
            setCurrentPageContent(formattedContent);
            setIsContentChanged(true);
            setSaveStatus('noGuardado');
        }
    };




    const fetchTotalPages = async () => {
        let response;

        try {
            if (!user.token) {
                // Si no hay token, hace la petición con las cookies incluidas
                response = await fetch(`${process.env.REACT_APP_PROD_API_URL}/books/${bookId}/pages`, {
                    method: 'GET', // Asumiendo que es una operación de obtención
                    credentials: 'include', // Necesario para incluir cookies en la petición
                });
            } else {
                // Si hay token, lo incluye en el encabezado de autorización
                response = await fetch(`http://localhost:8081/books/${bookId}/pages`, {
                    headers: {'Authorization': `Bearer ${user.token}`},
                });
            }

            if (!response.ok) {
                throw new Error('Error al obtener el recuento de páginas');
            }

            const pages = await response.json();
            setTotalPages(pages.length);

            // La siguiente línea se ha movido al final para asegurarse de que se utiliza el valor actualizado de totalPages
            if (currentPageNumber > totalPages) {
                setCurrentPageNumber(Math.max(totalPages, 1));
            }

            // Guardar el recuento de páginas en localStorage
            localStorage.setItem('totalPages', pages.length);
        } catch (error) {
            console.error('Error al obtener el recuento de páginas:', error);
        }
    };

    const fetchCurrentPage = async () => {
        if (!book || typeof book._id === 'undefined') return;

        if (pageCache[currentPageNumber]) {
            // Usar el contenido del caché si está disponible
            const cachedPage = pageCache[currentPageNumber];
            setCurrentPage({ content: cachedPage });
            setCurrentPageContent(cachedPage);
        } else {
            try {
                const response = await fetch(`${process.env.REACT_APP_PROD_API_URL}/books/${bookId}/page/${currentPageNumber}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (!response.ok) throw new Error('Error al cargar la página');
                const page = await response.json();
                setCurrentPage(page);
                setCurrentPageContent(page.content);

                setPageCache(prevCache => ({
                    ...prevCache,
                    [currentPageNumber]: page.content
                }));
            } catch (error) {
                console.error('Error al obtener la página:', error);
            }
        }
    };

    const handlePageChange = (page) => {
        setCurrentPageNumber(page.pageNumber);
    };

    const createNewPage = async () => {
        try {
            const newPageNumber = currentPageNumber + 1;
            const newPage = { content: '', pageNumber: newPageNumber };

            const response = await fetch(`${process.env.REACT_APP_PROD_API_URL}/books/${bookId}/createPage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(newPage)
            });

            if (!response.ok) {
                throw new Error('Error al crear la nueva página');
            }

            // Recargar el recuento total de páginas después de la creación exitosa
            await fetchTotalPages();
        } catch (error) {
            console.error('Error al crear nueva página:', error);
        }
    };



    const handlePageUpdate = async (content, pageNumber) => {
        if (quillRef.current && pageNumber) {
            try {
                const response = await fetch(`${process.env.REACT_APP_PROD_API_URL}/books/${book._id}/updatePage/${pageNumber}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token}`
                    },
                    body: JSON.stringify({ content })
                });

                if (response.ok) {

                    setCurrentPage(prevPage => ({ ...prevPage, content }));
                    setCurrentPageContent(content);

                    setPageCache(prevCache => ({
                        ...prevCache,
                        [pageNumber]: content
                    }));

                    setSaveStatus('guardado');

                    if (saveTimer.current) {
                        clearTimeout(saveTimer.current);
                    }
                    saveTimer.current = setTimeout(() => {
                        setSaveStatus('guardado');
                    }, 1000);
                } else {
                    throw new Error('Error al guardar la página');
                }
            } catch (error) {
                console.error('Error al actualizar la página:', error);
                setSaveStatus('guardadoerror');
            }
        } else {
            console.error('Editor Quill no disponible o número de página no definido');
            setSaveStatus('guardadoerror');
        }
    };



    const handlePageDelete = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_PROD_API_URL}/books/${book._id}/deletePage/${currentPageNumber}`, {
                method: 'DELETE',
                headers: {'Authorization': `Bearer ${user.token}`}
            });

            if (!response.ok) {
                throw new Error('Error al eliminar la página');
            }

            alert('Página eliminada con éxito');

            // Recargar y actualizar el total de páginas
            await fetchTotalPages();


        } catch (error) {
            console.error('Error al eliminar la página:', error);
        }
    };


    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <div className="loading-message">Loading book details...</div>
            </div>
        );
    }


    if (error || (isPrivate && !isOwner)) {
        let errorMessage = error || "Este libro es privado y solo accesible por el propietario.";
        return (
            <div className="error-container">
                <div className="error-message">{errorMessage}</div>
                <div className="page-editor-buttons">
                    <button onClick={onBack} className="page-editor-button">Atrás</button>
                </div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="error-container">
                <div className="error-message">No book found</div>
            </div>
        );
    }





    return (
        <>
            <Navbar />
            <div className="page-editor-container">

                <div className="page-editor-header">
                    {isOwner && !isLoading &&
                        <h2>Editando libro: {book.title}</h2>
                    }
                    {!isOwner &&
                        <h2>Viendo libro: {book.title}</h2>
                    }
                    {isOwner &&
                        <div className="save-status">
                            {saveStatus === 'noGuardadoEdit' &&
                                <span className="save-status-text">No guardado</span>
                            }
                            {saveStatus === 'guardado' &&
                                <span className="save-status-text">Saved</span>
                            }
                            {saveStatus === 'noGuardado' &&
                                <span className="save-status-text">
                        <img
                            src="https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif"
                            alt="Guardando..."
                            className="save-status-icon"
                        />
                        Saving...</span>
                            }
                            {saveStatus === 'guardadoerror' &&
                                <span className="save-status-text">Error al guardar</span>
                            }
                        </div>
                    }
                    <div className="page-editor-buttons">
                        <button onClick={onLogout} className="page-editor-button">Logout</button>
                        <button onClick={onBack} className="page-editor-button">Atrás</button>
                    </div>
                </div>
                <ReactQuill
                    ref={quillRef}
                    className={'react-quill'}
                    value={currentPageContent}
                    readOnly={!isOwner}
                    theme={!isOwner ? 'bubble' : 'snow'}
                    onChange={handleContentChange}
                    modules={isOwner ? modules : {toolbar: false}}
                />
                {isOwner &&
                    <div className="page-editor-buttons">
                        <button onClick={handlePageUpdate} className="page-editor-button">Guardar Cambios</button>
                        <button onClick={handlePageDelete} className="page-editor-button">Eliminar Página</button>
                    </div>
                }
                <BookNavigation
                    bookId={bookId}
                    onPageChange={handlePageChange}
                    onCreatePage={createNewPage}
                    totalPages={totalPages}
                />
            </div>
        </>
    );
}

export default PageEditor;