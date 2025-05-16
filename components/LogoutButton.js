import { auth } from "../lib/firebase"
import { signOut } from "firebase/auth"

const LogoutButton = () => {

    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log("sesión cerrada correctamente");        
        } catch (error) {
            console.error('Error al cerrar sesión', error)
        }
    }
    return (<div>
      <button onClick={handleLogout} >Cerrar sesión</button>
    </ div>)
}

export default LogoutButton;