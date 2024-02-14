import React, {useState, useEffect} from 'react';
import LoginForm from './Components/LoginForm';
import BookList from './Components/BookList';
import PageEditor from './Components/PageEditor';
import { useUser } from './Components/UserContext';
import './App.css';
import RegisterForm from "./Components/RegisterForm";
import {Routes, Route, Navigate, useNavigate} from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';
import LandingPage from "./Components/landingpage";
import BookFriends from "./Components/BookFriends";
import { useWebSocket } from './Components/WebSocketContext';
import Profile from "./Components/Profile";




function App() {
  const [currentPage, setCurrentPage] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false); // Nuevo estado
  const { webSocket, setWebSocket } = useWebSocket();
  const { user, setUser } = useUser();

  const goBackToBookList = () => {
      navigate('/books');
    localStorage.removeItem('totalPages');
  };

  useEffect(() => {
    const verificarUsuario = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_PROD_API_URL}/auth/refresh-token`, {
          method: 'POST',
          credentials: 'include'
        });

        if (!response.ok) throw new Error('No se pudo refrescar el token');

        const data = await response.json();
        const userinfo = jwtDecode(data.token)
        setUser({
          ...user,
          token: data.token,
          id: userinfo.sub,
          username: userinfo.username,
          email: userinfo.email,
          photoUrl: userinfo.photoUrl
        });


        if (!webSocket) {
          const ws = new WebSocket(process.env.REACT_APP_PROD_WSS_URL, data.token);
          ws.onopen = () => {
            setWebSocket(ws);
          }
        } else if (!user) {
          webSocket.close();
        }

      } catch (error) {
          setUser(null);
      }
    };
      verificarUsuario();
  }, []);

  useEffect(() => {
    if (user) {
      const ws = new WebSocket(process.env.REACT_APP_PROD_WSS_URL, user.token);


      ws.onopen = () => {
        setWebSocket(ws);
      };

      ws.onerror = (error) => {
        console.error('Error en la conexión WebSocket:', error);
      }


    }
  }, [user]);






  useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    try {
        const decoded = jwtDecode(token); // Asegúrate de que jwtDecode esté correctamente importado

        const userData = {
          id: decoded.sub,
          username: decoded.username,
          email: decoded.email,
          token: token,
          photoUrl: decoded.photoUrl,
          isAuthenticated: true
        };

        setUser(userData); // Asume que setUser es una función proporcionada por el contexto o props

        const ws = new WebSocket(process.env.REACT_APP_PROD_WSS_URL, token);
        ws.onopen = () => {
          console.log('Conexión WebSocket establecida');
          setWebSocket(ws);
        };

        ws.onerror = (error) => {
          console.error('Error en la conexión WebSocket:', error);
        };

      } catch (error) {
        console.error('Error de autenticación:', error);
      }

      window.history.replaceState({}, document.title, window.location.pathname);
  }, []);







  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    if (jwt && !isTokenExpired(jwt)) {
      const decoded = jwtDecode(jwt);
      const userId = decoded.sub;
      setUser({ isAuthenticated: true, id: userId });
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
      const loginResponse = await fetch(`${process.env.REACT_APP_PROD_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });



      if (!loginResponse.ok) {
        throw new Error("Login fallido");
      }

      const loginData = await loginResponse.json();
      const decoded = jwtDecode(loginData.token);


      const userData = {
        id: decoded.sub,
        username: decoded.username,
        email: decoded.email,
        token: loginData.token,
          photoUrl: decoded.photoUrl,
          isAuthenticated: true
      };


        setUser(userData);

    } catch (error) {
      console.error('Error de login:', error);
      onError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      // Llamada al endpoint de logout
      await fetch(`${process.env.REACT_APP_PROD_API_URL}/auth/logout`, {
        method: 'POST',
          credentials: 'include'
      });
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
      setCurrentPage(null);
        navigate(`/editor/${book._id}`); // Navega a la página del editor
    } else {
      console.error('Libro seleccionado no válido:', book);
    }
  };



  const handleRegister = async (mail, username, password, setErrorMessage, setLoginError) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_PROD_API_URL}/auth/register`, {
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

    const handleUpdateUser = async (updatedUserInfo) => {
        try {
            const userId = user.id; // Asume que tienes el ID del usuario en el estado 'user'
          const response = await fetch(`${process.env.REACT_APP_PROD_API_URL}/users/update/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`, // Asume que tienes un token de autenticación
                },
                body: JSON.stringify(updatedUserInfo),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update user profile: ${errorText}`);
            }

            const updatedUser = await response.json();
          setUser(prevUser => ({
            ...prevUser,
            username: updatedUser.username,
            email: updatedUser.email,
            photoUrl: updatedUser.photoUrl
          }));
          alert('Perfil actualizado con éxito');
        } catch (error) {
            console.error('Error updating user profile:', error);
            alert('Error al actualizar el perfil: ' + error.message);
        }
    };







  return (

      <Routes>
          <Route path="/" element={<LandingPage/>}/>
          <Route path="/friends" element={user ? <BookFriends/> : <Navigate to="/"/>}/>
          <Route path="/login"
                 element={user ? <Navigate to="/"/> : <LoginForm onLogin={handleLogin} onToggleForms={toggleForms}/>}/>
          <Route path="/register" element={<RegisterForm onRegister={handleRegister} onToggleForms={toggleForms}/>}/>
          <Route path="/books"
                 element={user ? <BookList onSelectBook={selectBook} onLogout={handleLogout}/> : <Navigate to="/"/>}/>
          <Route path="/editor/:bookId" element={user ?
              <PageEditor currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout}
                          onBack={goBackToBookList}/> : <Navigate to="/books"/>}/>
          <Route path="/profiles/:username"
                 element={user ? <Profile onUpdateUser={handleUpdateUser} onBack={goBackToBookList}/> :
                     <Navigate to="/login"/>}/>

      </Routes>
  );
}

export default App;

