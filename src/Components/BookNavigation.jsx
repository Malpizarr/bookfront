import React, {useState, useEffect, useRef} from 'react';
import { useUser } from './UserContext';

function BookNavigation({ bookId, onPageChange, onCreatePage, totalPages }) {
    const [currentPageNumber, setCurrentPageNumber] = useState(1);
    const { user } = useUser();
    const [pageCache, setPageCache] = useState({});


    const createPageTimerRef = useRef(null);

    useEffect(() => {
        if (currentPageNumber > totalPages) {
            setCurrentPageNumber(Math.max(totalPages, 1));
        }
    }, [totalPages, currentPageNumber]);

    const handleMouseDownNext = () => {
        // Iniciar un temporizador para crear una nueva página después de medio segundo
        createPageTimerRef.current = setTimeout(() => {
            onCreatePage();
        }, 500); // 500 milisegundos = medio segundo
    };

    const handleMouseUpNext = () => {
        // Si se suelta el botón antes de medio segundo, cancelar la creación de la página
        if (createPageTimerRef.current) {
            clearTimeout(createPageTimerRef.current);
        }
    };

    const changePage = (offset) => {
        setCurrentPageNumber(prev => {
            const newPageNumber = Math.max(1, Math.min(prev + offset, totalPages));
            fetchPage(newPageNumber);
            return newPageNumber;
        });
    };

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.ctrlKey) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    changePage(-1);
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    changePage(1);
                }
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [changePage, currentPageNumber, totalPages]);



    const fetchPage = async (pageNumber) => {
        if (!bookId || !user) return;
        if (pageCache[pageNumber]) {
            onPageChange(pageCache[pageNumber]);
            return;
        }

        try {
            const response = await fetchPageData(pageNumber);
            const page = await response.json();
            setPageCache({...pageCache, [pageNumber]: page});
            onPageChange(page);
        } catch (error) {
            console.error('Error fetching page:', error);
        }
    };

    const fetchPageData = async (pageNumber) => {
        const url = `http://localhost:8081/books/${bookId}/page/${pageNumber}`;
        return fetch(url, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
    };

    const handleInputChange = (e) => {
        const newPageNumber = parseInt(e.target.value, 10);
        if (!isNaN(newPageNumber)) setCurrentPageNumber(newPageNumber);
    };

    return (
        <div>
            <h2>
                <input
                    type="number"
                    value={currentPageNumber}
                    onChange={handleInputChange}
                    onBlur={() => fetchPage(currentPageNumber)}
                    min="1"
                    max={totalPages}
                /> / {totalPages}
            </h2>
            <button onClick={() => changePage(-1)}>
                Página Anterior
            </button>
            <button onClick={() => changePage(1)}
                    onMouseDown={handleMouseDownNext} onMouseUp={handleMouseUpNext}
            >
                Página Siguiente
            </button>
        </div>
    );
}

export default BookNavigation;
