import React, {useState, useEffect, useRef} from 'react';
import { useUser } from './UserContext';
import BookNavigation from './BookNavigation';
import ReactQuill, { Quill } from 'react-quill';
import ImageResize from 'quill-image-resize-module-react';
import 'react-quill/dist/quill.snow.css';
import '../Style/PageEditor.css';
import Navbar from "./NavBar";
import {useParams} from "react-router-dom";
import { useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
Quill.register('modules/imageResize', ImageResize);

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

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
    const ws = useRef(null);
    const query = useQuery();
    const editToken = query.get('editToken');
    const [showShareDialog, setShowShareDialog] = useState(false);


    useEffect(() => {
        if (editToken) {
            const options = user.token ? {headers: {'Authorization': `Bearer ${user.token}`}} : {
                method: 'GET',
                credentials: 'include'
            };
            fetch(`${process.env.REACT_APP_PROD_API_URL}/books/edit/${editToken}`, options)
                .then(response => response.json())
                .then(data => {
                    if (data.isValid) {
                        setBook(data.book);
                    } else {
                        console.log("Token no válido o libro no encontrado");
                    }
                })
                .catch(error => console.error("Error al verificar el token", error));
        }
    }, [editToken]);

    useEffect(() => {
        if (currentPageNumber > totalPages) {
            setCurrentPageNumber(Math.max(totalPages, 1));
        }
    }, [totalPages, currentPageNumber]);



    //TODO: TERMINAR DE ARREGLAR EL FORMATEO, ADEMAS, QUEDA PENDIENTE EL AJUSTE DE ELIMINACION
    useEffect(() => {
        function connectWebSocket() {
            ws.current = new WebSocket('ws://localhost:8000/ws');

            ws.current.onopen = () => {
                console.log('Connected to WebSocket');
                ws.current.send(JSON.stringify({ type: 'connect', bookId }));
            };

            ws.current.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'operation' && message.ops && quillRef.current) {
                    const quill = quillRef.current.getEditor();
                    message.ops.forEach(op => {
                        if (op.action === 'insert') {
                            quill.insertText(op.position, op.content, 'silent');
                        } else if (op.action === 'delete') {
                            quill.deleteText(op.position, op.length, 'silent');
                        } else if (op.action === 'format') {
                            console.log('Formatting:', op);
                            quill.formatText(op.position, op.length, op.attributes, 'silent');
                        }
                    });
                }
            };

            ws.current.onclose = () => {
                console.log('Disconnected from WebSocket');
                setTimeout(connectWebSocket, 3000);
            };

            return () => {
                ws.current.close();
            };
        }

        connectWebSocket();
    }, [bookId]);





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

            const options = user.token ? {headers: {'Authorization': `Bearer ${user.token}`}} : {
                method: 'GET',
                credentials: 'include'
            };
            response = await fetch(`${process.env.REACT_APP_PROD_API_URL}/books/${bookId}`, options);

            if (!response.ok) {
                if (response.status === 403 || response.status === 401) {
                    setIsPrivate(true);
                    setIsOwner(false);
                    throw new Error('This Book is private.');
                } else {
                    throw new Error('Failed to fetch book details');
                }
            }

            const bookData = await response.json();
            setBook(bookData);
            const allowedUsers = bookData.allowedUsers || [];
            const isUserOwner = allowedUsers.includes(user.id);
            setIsOwner(isUserOwner);

            setIsPrivate(bookData.status === 'Private' && !isUserOwner);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const generateOperationId = () => uuidv4();

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
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],

            [{'header': 1}, {'header': 2}],               // custom button values
            [{'list': 'ordered'}, {'list': 'bullet'}],
            [{'script': 'sub'}, {'script': 'super'}],      // superscript/subscript
            [{'indent': '-1'}, {'indent': '+1'}],          // outdent/indent
            [{'direction': 'rtl'}],                         // text direction

            [{'size': ['small', false, 'large', 'huge']}],  // custom dropdown
            [{'header': [1, 2, 3, 4, 5, 6, false]}],

            [{'color': []}, {'background': []}],
            [{'font': []}],
            [{'align': []}],
            ['link', 'image'], // Enlace e imagen y video
            ['clean']

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
    }, [isContentChanged, currentPageNumber]);


    //TODO: TERMINAR DE ARREGLAR EL CAMBIO DE CONTENIDO, ADEMAS, ARREGLAR EL GUARDADO AUTOMATICO, ADEMAS, ARREGLAR EL CAMBIO DE FORMATO
    const handleContentChange = (content, delta, source) => {
        if (source !== 'user') return;

        let ops = [];

        const selection = quillRef.current.getEditor().getSelection();
        let currentPosition = selection ? selection.index-1 : quillRef.current.getEditor().getLength()-1;

        delta.ops.forEach((deltaOp) => {
            if (deltaOp.insert) {
                if (typeof deltaOp.insert === 'string') {
                    const lines = deltaOp.insert.split('\n');

                    lines.forEach((line, index) => {
                        if (index > 0) {
                            ops.push({
                                action: 'insert',
                                content: '\n',
                                position: currentPosition+1,
                                attributes: {}
                            });
                            currentPosition += 1;
                        }

                        if (line.length > 0) {
                            ops.push({
                                action: 'insert',
                                content: line,
                                position: currentPosition,
                                attributes: deltaOp.attributes || {}
                            });
                            currentPosition += line.length;
                        }
                    });
                } else {
                    ops.push({
                        action: 'insert',
                        content: deltaOp.insert,
                        position: currentPosition,
                        attributes: deltaOp.attributes || {}
                    });
                    currentPosition += 1;
                }
            } else if (deltaOp.delete) {
                ops.push({
                    action: 'delete',
                    position: currentPosition+1,
                    length: deltaOp.delete
                });
                // La operacion delete no afecta la posicion actual del cursor
            } else if (deltaOp.retain && deltaOp.attributes) {
                ops.push({
                    action: 'format',
                    position: currentPosition+1,
                    length: deltaOp.retain,
                    attributes: deltaOp.attributes
                });
                currentPosition += deltaOp.retain;
            }
        });

        if (ops.length > 0) {
            ws.current.send(JSON.stringify({
                type: 'operation',
                bookId,
                ops: ops
            }));
        }
    };







    const fetchTotalPages = async () => {
        let response;

        try {
            if (!user.token) {
                response = await fetch(`${process.env.REACT_APP_PROD_API_URL}/books/${bookId}/pages`, {
                    method: 'GET',
                    credentials: 'include',
                });
            } else {
                response = await fetch(`${process.env.REACT_APP_PROD_API_URL}/books/${bookId}/pages`, {
                    headers: {'Authorization': `Bearer ${user.token}`},
                });
            }

            if (!response.ok) {
                throw new Error('Error al obtener el recuento de páginas');
            }

            const pages = await response.json();
            setTotalPages(pages.length);

            if (currentPageNumber > totalPages) {
                setCurrentPageNumber(Math.max(totalPages, 1));
            }

            localStorage.setItem('totalPages', pages.length);
        } catch (error) {
            console.error('Error al obtener el recuento de páginas:', error);
        }
    };

    const fetchCurrentPage = async () => {
        if (!book || typeof book._id === 'undefined') return;

        if (pageCache[currentPageNumber]) {
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

    const copyToClipboard = async () => {
        const urlToCopy = `${process.env.REACT_APP_PROD_FRONT}/editor/${bookId}?editToken=${book.editToken}`;
        try {
            await navigator.clipboard.writeText(urlToCopy);
            alert('URL copiada al portapapeles');
        } catch (err) {
            console.error('Error al copiar la URL:', err);
        }
        setShowShareDialog(false);
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
        let errorMessage = error || "This Book is private.";
        return (
            <div className="error-container">
                <div className="error-message">{errorMessage}</div>
                <div className="page-editor-buttons">
                    <button onClick={onBack} className="page-editor-button">Back</button>
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
                        <h2>Editing Book: {book.title}</h2>
                    }
                    {!isOwner &&
                        <h2>Seeing Book: {book.title}</h2>
                    }

                    {showShareDialog && (
                        <div className="share-dialog">
                            <p>{`${process.env.REACT_APP_PROD_FRONT}/editor/${bookId}?editToken=${book.editToken}`}</p>
                            <button onClick={copyToClipboard}>Copiar URL</button>
                            <button onClick={() => setShowShareDialog(false)}>Cerrar</button>
                        </div>
                    )}


                    {isOwner &&
                        <div className="save-status">
                            {saveStatus === 'noGuardadoEdit' &&
                                <span className="save-status-text">Not Saved</span>
                            }
                            {saveStatus === 'guardado' &&
                                <span className="save-status-text">Saved</span>
                            }
                            {saveStatus === 'noGuardado' &&
                                <span className="save-status-text">
                        <img
                            src="https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif"
                            alt="Saving..."
                            className="save-status-icon"
                        />
                        Saving...</span>
                            }
                            {saveStatus === 'guardadoerror' &&
                                <span className="save-status-text">Error on Saving</span>
                            }

                        </div>
                    }
                    <div className="page-editor-buttons">
                        {isOwner && <button onClick={() => setShowShareDialog(true)} className="page-editor-button">Share Book</button>}
                        <button onClick={onLogout} className="page-editor-button">Logout</button>
                        <button onClick={onBack} className="page-editor-button">Back</button>
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
                        <button onClick={handlePageUpdate} className="page-editor-button">Save Changes</button>
                        <button onClick={handlePageDelete} className="page-editor-button">Delete Page</button>
                    </div>
                }
                {isOwner &&
                    <BookNavigation
                        bookId={bookId}
                        onPageChange={handlePageChange}
                        onCreatePage={createNewPage}
                        totalPages={totalPages}
                    />
                }
                {!isOwner &&
                    <BookNavigation
                        bookId={bookId}
                        onPageChange={handlePageChange}
                        totalPages={totalPages}
                    />
                }
            </div>
        </>
    );
}

export default PageEditor;