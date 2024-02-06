import React, {useState, useEffect, useContext} from 'react';
import LoginForm from './Components/LoginForm';
import BookList from './Components/BookList';
import PageEditor from './Components/PageEditor';
import { useUser } from './Components/UserContext';
import './App.css';
import RegisterForm from "./Components/RegisterForm";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';
import LandingPage from "./Components/landingpage";
import BookFriends from "./Components/BookFriends";
import { useWebSocket } from './Components/WebSocketContext';



function App() {
  const [selectedBook, setSelectedBook] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false); // Nuevo estado
  const { webSocket, setWebSocket } = useWebSocket();
  const { user, setUser } = useUser();

  const goBackToBookList = () => {
    setSelectedBook(null);
    localStorage.removeItem('totalPages');
  };

  useEffect(() => {
    const verificarUsuario = async () => {
      try {
        const response = await fetch('http://localhost:8081/auth/refresh-token', {
          method: 'POST',
          credentials: 'include'
        });

        if (!response.ok) throw new Error('No se pudo refrescar el token');

        const data = await response.json();
        console.log('Token refrescado:', data);
        setUser({ ...user, token: data.token });
        if (!webSocket) {
          const ws = new WebSocket('ws://localhost:8083', data.token);
          ws.onopen = () => {
            console.log('Conexión WebSocket establecida');
            setWebSocket(ws); // Guarda la conexión en el contexto global
          }
        } else if (!user) {
          webSocket.close();
        }
        
        // Configura cualquier otro estado o contexto basado en la respuesta
      } catch (error) {
        console.error('Error al refrescar el token:', error);
        // Manejar el caso en que el usuario no está autenticado o el token no se pudo refrescar
      }
    };

    verificarUsuario();
  }, []);





  useEffect(() => {
    async function fetchData() {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      try {
        if (token) {
          const jwt = token;

          const decoded = jwtDecode(jwt);

          const userData = {
            id: decoded.sub,
            username: decoded.username,
            email: decoded.email,
            token: jwt,
            photoUrl: decoded.photoUrl
          };

          setUser(userData);

          const ws = new WebSocket('ws://localhost:8083', userData.token);
          ws.onopen = () => {
            console.log('Conexión WebSocket establecida');
            setWebSocket(ws); // Guarda la conexión en el contexto global
          };

          ws.onerror = (error) => {
            console.error('Error en la conexión WebSocket:', error);
          }
        }
      } catch (error) {
        console.error('Error de autenticación:', error);
      }
      // Opcional: limpiar la URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchData();
  }, []); // Asegúrate de que las dependencias del useEffect estén correctamente especificadas.





  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    if (jwt && !isTokenExpired(jwt)) {
      const decoded = jwtDecode(jwt);
      const userId = decoded.sub;
      setUser({ isAuthenticated: true, id: userId });
    }
  }, []);




  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt || isTokenExpired(jwt)) {
      handleLogout();
      navigate('/');
    }
  }, []);

  function isTokenExpired(token) {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch (error) {
      return true;
    }
  }




  const toggleForms = () => {
    setShowRegisterForm(!showRegisterForm); // Cambia entre registro y login
  };




  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser && storedUser.username) {
      setUser(storedUser);
    }
  }, [setUser]);


  const handleLogin = async (username, password, onError) => {
    try {
      const loginResponse = await fetch('http://localhost:8081/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });



      if (!loginResponse.ok) {
        throw new Error("Login fallido");
      }

      const loginData = await loginResponse.json();
      console.log('Login exitoso:', loginData);
      const decoded = jwtDecode(loginData.token);

      console.log('Decoded:', decoded);


      const userData = {
        id: decoded.sub,
        username: decoded.username,
        email: decoded.email,
        token: loginData.token,
        PhotoUrl: decoded.photoUrl
      };


      setUser(prevUser => ({ ...prevUser, ...userData }));

      console.log('User:', userData.photoUrl);


      const ws = new WebSocket('ws://localhost:8083', loginData.token);


      ws.onopen = () => {
        console.log('Conexión WebSocket establecida');
        setWebSocket(ws); // Guarda la conexión en el contexto global
      };

      ws.onerror = (error) => {
        console.error('Error en la conexión WebSocket:', error);
      }


    } catch (error) {
      console.error('Error de login:', error);
      onError(error.message);
    }
  };



  // En App.js`

  const handleLogout = async () => {
    try {
      // Llamada al endpoint de logout
      await fetch('http://localhost:8081/auth/logout', {
        method: 'POST',
        credentials: 'include' // Importante para incluir cookies
      });

      // Manejar la lógica de logout en el cliente
      if (webSocket) {
        webSocket.close();
        setWebSocket(null);
      }
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Error durante el logout:', error);
    }
  };




  const navigate = useNavigate();

  const selectBook = (book) => {
    if (book && typeof book._id !== 'undefined') {
      setSelectedBook(book);
      setCurrentPage(null);
      navigate("/editor"); // Navega a la página del editor
    } else {
      console.error('Libro seleccionado no válido:', book);
    }
  };


  const handleRegister = async (mail, username, password, setErrorMessage, setLoginError) => {
    try {
      const response = await fetch('http://localhost:8081/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mail, username, password })
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        if (errorMsg.includes("Username already taken")) {
          setErrorMessage("El nombre de usuario ya está en uso");
        } else if (errorMsg.includes("Invalid email format")) {
          setErrorMessage("Formato de correo electrónico inválido");
        } else if (errorMsg.includes("Email already taken")) {
          setErrorMessage("El correo electrónico ya está en uso");
        } else {
          throw new Error("Registro fallido");
        }
      } else {
        const data = await response.json();
        console.log('Registro exitoso:', data);
        toggleForms();
        await handleLogin(username, password, setLoginError); // Manejo de error separado para login
        navigate("/books")
      }
    } catch (error) {
      console.error('Error en el registro:', error.message);
      setErrorMessage(error.message); // Errores relacionados con el registro
    }
  };





  return (

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/friends" element={user ? <BookFriends /> : <Navigate to="/" />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginForm onLogin={handleLogin} onToggleForms={toggleForms} />} />
          <Route path="/register" element={<RegisterForm onRegister={handleRegister} onToggleForms={toggleForms} />} />
          <Route path="/books" element={user ? <BookList onSelectBook={selectBook} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/editor" element={user && selectedBook ? <PageEditor book={selectedBook} currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} onBack={goBackToBookList} /> : <Navigate to="/books" />} />
        </Routes>
  );
}

export default App;

