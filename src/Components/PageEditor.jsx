import React, {useState, useEffect, useRef} from 'react';
import { useUser } from './UserContext';
import BookNavigation from './BookNavigation';
import ReactQuill, { Quill } from 'react-quill';
import ImageResize from 'quill-image-resize-module-react';
import 'react-quill/dist/quill.snow.css';
import './PageEditor.css';
import Navbar from "./NavBar";


Quill.register('modules/imageResize', ImageResize);

function PageEditor({ book, onLogout, onBack }) {
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
const [pageCache, setPageCache] = useState({}); // Nuevo estado para almacenar en caché las páginas cargadas



    useEffect(() => {
        if (currentPageNumber > totalPages) {
            setCurrentPageNumber(Math.max(totalPages, 1));
        }
    }, [totalPages, currentPageNumber]);

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
            [{ header: '1' }, { header: '2' }, { font: [] }],
            [{ size: [] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [
                { list: 'ordered' },
                { list: 'bullet' },
                { indent: '-1' },
                { indent: '+1' }
            ],
            [{align: []}],
            [{color: []}],
            ['link', 'image', 'video'],
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
    }, [quillRef, isContentChanged, currentPageNumber]);



    const handleContentChange = (content, delta, source, editor) => {
        const formattedContent = editor.getHTML();
        setCurrentPageContent(formattedContent);
        setIsContentChanged(true);
        setSaveStatus('noGuardado');
    };




    const fetchTotalPages = async () => {
        try {
            const response = await fetch(`https://bookgateway.mangotree-fab2eccd.eastus.azurecontainerapps.io/books/${book._id}/pages`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (!response.ok) {
                throw new Error('Error al obtener el recuento de páginas');
            }
            const pages = await response.json();
            setTotalPages(pages.length);
            // Si la página actual ya no existe, ajustar currentPageNumber
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
                const response = await fetch(`https://bookgateway.mangotree-fab2eccd.eastus.azurecontainerapps.io/books/${book._id}/page/${currentPageNumber}`, {
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

            const response = await fetch(`https://bookgateway.mangotree-fab2eccd.eastus.azurecontainerapps.io/books/${book._id}/createPage`, {
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


    const reloadAllPages = async () => {
        try {
            const response = await fetch(`https://bookgateway.mangotree-fab2eccd.eastus.azurecontainerapps.io/books/${book._id}/pages`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt')}` }
            });
            if (!response.ok) {
                throw new Error('Error al recargar las páginas');
            }
            const pages = await response.json();
            let newCache = {};
            pages.forEach(page => {
                newCache[page.pageNumber] = page;
            });
            setPageCache(newCache);
            setTotalPages(pages.length);
        } catch (error) {
            console.error('Error al recargar las páginas:', error);
        }
    };



    const handlePageUpdate = async (content, pageNumber) => {
        if (quillRef.current && pageNumber) {
            try {
                const response = await fetch(`https://bookgateway.mangotree-fab2eccd.eastus.azurecontainerapps.io/books/${book._id}/updatePage/${pageNumber}`, {
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
            const response = await fetch(`https://bookgateway.mangotree-fab2eccd.eastus.azurecontainerapps.io/books/${book._id}/deletePage/${currentPageNumber}`, {
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




    return (
        <>
            <Navbar />
        <div className="page-editor-container">
            <div className="page-editor-header">
                <h2>Editando libro: {book.title}</h2>
                <div className="save-status">
                    {saveStatus === 'noGuardadoEdit' &&
                        <span className="save-status-text">No guardado</span>
                    }
                    {saveStatus === 'guardado' &&
                        <span className="save-status-text">Saved</span>
                    }
                    {saveStatus === 'noGuardado' &&
                        <span className="save-status-text" >
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
                <div className="page-editor-buttons">
                    <button onClick={onLogout} className="page-editor-button">Logout</button>
                    <button onClick={onBack} className="page-editor-button">Atrás</button>
                </div>
            </div>
            <ReactQuill
                ref={quillRef}
                className={"react-quill"}
                value={currentPageContent}
                onChange={handleContentChange}
                modules={modules}
                formats={formats}
            />

            <div className="page-editor-buttons">
                <button onClick={handlePageUpdate} className="page-editor-button">Guardar Cambios</button>
                <button onClick={handlePageDelete} className="page-editor-button">Eliminar Página</button>
            </div>
            <BookNavigation
                bookId={book._id}
                onPageChange={handlePageChange}
                onCreatePage={createNewPage}
                totalPages={totalPages}
            />
        </div>
        </>
    );
}

export default PageEditor;