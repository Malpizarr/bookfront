import {useState, useEffect} from "react";
import {useUser} from "./UserContext";
import "../Style/SearchUsers.css";
import {debounce} from "lodash"; // Asegúrate de tener lodash instalado para usar debounce

function SearchUsers({onSendFriendRequest}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const {user} = useUser();

    // Función para realizar la búsqueda
    const fetchSearchResults = async (token, searchTerm) => {
        const response = await fetch(`${process.env.REACT_APP_PROD_API_URL}/users/search?username=${searchTerm}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await response.json();
        return data;
    };

    // Función debounced para manejar la búsqueda
    const debouncedSearch = debounce(async (searchTerm) => {
        const results = await fetchSearchResults(user.token, searchTerm);
        setSearchResults(results);
    }, 100);

    useEffect(() => {
        if (searchTerm.trim()) {
            debouncedSearch(searchTerm);
        } else {
            setSearchResults([]); // Limpia los resultados si el campo de búsqueda está vacío
        }
    }, [searchTerm]);

    return (
        <div className="search-container">
            <input
                className="search-input"
                type="text"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ul className="results-list">
                {searchResults.map((result) => (
                    <li className="result-item" key={result.id}>
                        <img className="user-photo" src={result.photoUrl} alt="User"/>
                        {result.username}
                        <button className="add-friend-button" onClick={() => onSendFriendRequest(result.id)}>
                            Agregar Amigo
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default SearchUsers;
