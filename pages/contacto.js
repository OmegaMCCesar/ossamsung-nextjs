import React, { useRef, useState } from 'react'; // Importamos useRef y useState
import emailjs from '@emailjs/browser'; // Importamos emailjs/browser
import Layout from "../components/Layout";
import styles from "../styles/contacto.module.css"; // Importamos el módulo CSS para estilos

export default function Contacto() {
  const form = useRef(); // Creamos una referencia para el formulario
  const [isSending, setIsSending] = useState(false); // Estado para saber si se está enviando
  const [message, setMessage] = useState(''); // Estado para mensajes de feedback (éxito o error)

  const sendEmail = (e) => {
    e.preventDefault(); // Evita que la página se recargue al enviar el formulario

    setIsSending(true); // Indicamos que el envío ha comenzado
    setMessage(''); // Limpiamos cualquier mensaje previo

    // --- Aquí es donde usarás tus claves de EmailJS ---
    // Es CRUCIAL usar variables de entorno y NO hardcodear las claves sensibles
    // Para Next.js, las variables de entorno públicas deben empezar con NEXT_PUBLIC_
    const serviceId = 'service_hp5g9er'
    const templateId = 'template_fw5dsio'
    const publicKey = 'OimePa9MbzuM5Lahj' // La clave pública va aquí

    // Validar que las claves estén configuradas (especialmente útil en desarrollo)
    if (!serviceId || !templateId || !publicKey) {
        console.error("Error: Las variables de entorno de EmailJS no están configuradas correctamente.");
        setMessage("Error al enviar el mensaje: Faltan claves de configuración. Contacta al administrador del sitio.");
        setIsSending(false);
        // Podrías agregar más lógica, como deshabilitar el formulario si no hay claves
        return; // Detiene la función si faltan las claves
    }


    // emailjs.sendForm(YOUR_SERVICE_ID, YOUR_TEMPLATE_ID, YOUR_FORM, YOUR_PUBLIC_KEY)
    emailjs.sendForm(serviceId, templateId, form.current, publicKey)
      .then((result) => {
        console.log('EmailJS Success:', result.text);
        setMessage('¡Mensaje enviado con éxito!'); // Mensaje de éxito para el usuario
        setIsSending(false); // El envío terminó
        form.current.reset(); // Limpia los campos del formulario
      }, (error) => {
        console.error('EmailJS Error:', error.text);
        setMessage(`Error al enviar el mensaje: ${error.text || 'Algo salió mal. Intenta de nuevo.'}`); // Mensaje de error
        setIsSending(false); // El envío terminó con error
      });
  };

  return (
    <Layout title="Contacto - LC Munios"> {/* Actualizado el título del Layout */}
     <div className={styles.contactoPageContent}>
      <h1>Contacta con Nosotros</h1>
      <p>¿Tienes alguna duda o necesitas ayuda? ¡Estamos aquí para ayudarte!</p>

      {/* Asignamos la referencia 'form' al formulario y el manejador onSubmit */}
      <form ref={form} onSubmit={sendEmail}>
        <div> {/* Puedes usar divs para organizar y estilizar mejor cada campo */}
          <label htmlFor="nombre">Nombre:</label>
          {/* El atributo 'name' es importante para que EmailJS pueda leer los campos */}
          <input type="text" id="user_name" name="user_name" required />
        </div>

        <div>
          <label htmlFor="email">Correo Electrónico:</label>
          <input type="email" id="user_email" name="user_email" required />
        </div>

        <div>
          <label htmlFor="mensaje">Mensaje:</label>
          <textarea id="message" name="message" required></textarea>
        </div>

        {/* Deshabilitamos el botón mientras se envía para evitar múltiples clics */}
        <button type="submit" disabled={isSending}>
          {isSending ? 'Enviando...' : 'Enviar'} {/* Cambia texto según el estado */}
        </button>

        {/* Mostramos el mensaje de feedback (éxito o error) si existe */}
        {message && <p>{message}</p>}

      </form>

      {/*
        Puedes añadir estilos básicos para el formulario aquí mismo
        con <style jsx>, o moverlos a un archivo CSS Module específico
        (como Contacto.module.css) e importarlos.
      */}
      </div>
    </Layout>
  );
}