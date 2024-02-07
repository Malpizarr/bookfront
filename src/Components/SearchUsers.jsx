import {useState} from "react";
import {useUser} from "./UserContext";

function SearchUsers({onSendFriendRequest}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const {user} = useUser();

    const fetchSearchResults = async (token, searchTerm) => {
        const response = await fetch(`http://localhost:8081/users/search?username=${searchTerm}`, {
            headers: {
                Authorization: `Bearer ${user.token}`
            }
        });
        const data = await response.json();
        return data;

    }

    const handleSearch = async () => {
        const results = await fetchSearchResults(user.token, searchTerm);
        setSearchResults(results);
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={handleSearch}>Buscar</button>
            <ul>
                {searchResults.map((result) => (
                    <li key={result.id}>
                        {result.photourl}
                        {result.username}
                        <button onClick={() => onSendFriendRequest(result.id)}>Agregar Amigo</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default SearchUsers;
