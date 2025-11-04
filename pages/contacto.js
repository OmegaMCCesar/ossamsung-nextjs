import { useState } from "react";
import Layout from "../components/Layout";
import styles from "../styles/contacto.module.css";
import { FaWhatsapp, FaEnvelope, FaPaperPlane } from "react-icons/fa";

export default function Contacto() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    mensaje: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos enviados:", formData);
    alert("Gracias por contactarnos. En breve te responderemos.");
    setFormData({ nombre: "", correo: "", mensaje: "" });
  };

  const whatsappLink =
    "https://wa.me/525626885726?text=Hola%20LC%20Munios,%20quiero%20más%20información%20sobre%20sus%20servicios.";

  return (
    <Layout title="Contacto - LC Munios">
      <div className={styles.contactoPageContent}>
        <h1>Contáctanos</h1>
        <p>¿Tienes dudas o necesitas soporte técnico? Aquí tienes nuestras opciones:</p>

        <div className={styles.contactCards}>
          {/* WhatsApp */}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.contactCard}
          >
            <FaWhatsapp className={styles.iconWhatsApp} />
            <h3>WhatsApp</h3>
            <p>Habla directamente con nuestro equipo de soporte.</p>
          </a>

          {/* Correo */}
          <a
            href="mailto:luiscesar.munoz.cervantes.upiit@gmail.com"
            className={styles.contactCard}
          >
            <FaEnvelope className={styles.iconEmail} />
            <h3>Correo Electrónico</h3>
          </a>

          {/* Formulario */}
          <div className={styles.contactCard}>
            <FaPaperPlane className={styles.iconForm} />
            <h3>Formulario de Contacto</h3>
            <form onSubmit={handleSubmit} className={styles.contactForm}>
              <input
                type="text"
                name="nombre"
                placeholder="Tu nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="correo"
                placeholder="Tu correo"
                value={formData.correo}
                onChange={handleChange}
                required
              />
              <textarea
                name="mensaje"
                placeholder="Tu mensaje"
                rows="4"
                value={formData.mensaje}
                onChange={handleChange}
                required
              ></textarea>
              <button type="submit">Enviar</button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
