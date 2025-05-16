import { useRef, useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import styles from '../styles/ContactForm.module.css';
import Link from 'next/link';
import ascCodes from '../data/ascCodes';

const validASC = ascCodes();

const ContactForm = () => {
  const form = useRef();
  const [asc, setAsc] = useState('');
  const [isAscValid, setIsAscValid] = useState(true);

  useEffect(() => {
    emailjs.init('OimePa9MbzuM5Lahj');
  }, []);

  const validateASC = (value) => {
    setAsc(value);
    if (value.trim() !== '') {
      setIsAscValid(validASC.includes(value.toUpperCase()));
    } else {
      setIsAscValid(true);
    }
  };

  const sendEmail = (e) => {
    e.preventDefault();

    const currentAscValue = form.current.user_asc.value.trim().toUpperCase();
    const finalAscValid = validASC.includes(currentAscValue);
    setIsAscValid(finalAscValid);

    if (!finalAscValid) {
      alert('El código ASC ingresado no es válido.');
      return;
    }

    const userName = form.current.user_name.value.trim();
    const userEmail = form.current.user_email.value.trim();
    const userPhone = form.current.user_phone.value.trim();
    const message = form.current.message.value.trim();

    if (!userName || !currentAscValue || !userEmail || !userPhone || !message) {
      alert('Por favor, complete todos los campos obligatorios.');
      return;
    }

    emailjs
      .sendForm('service_hp5g9er', 'template_fw5dsio', form.current)
      .then(
        (result) => {
          alert('Correo enviado correctamente');
          form.current.reset();
          setAsc('');
          setIsAscValid(true);
        },
        (error) => {
          alert('Error al enviar el correo: ' + error.text);
        }
      );
  };

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Link href='/equips' className={styles.inicio}>
          Volver a Inicio
        </Link>
      </div>

      <form ref={form} onSubmit={sendEmail} className={styles.formContainer}>
        <div className={styles.formField}>
          <label className={styles.label}>Nombre *</label>
          <input type="text" name="user_name" className={styles.input} required />
        </div>
        <div className={styles.formField}>
          <label className={styles.label}>ASC *</label>
          <input
            type="text"
            name="user_asc"
            className={`${styles.input} ${!isAscValid ? styles.errorState : ''}`}
            value={asc}
            onChange={(e) => validateASC(e.target.value)}
            required
          />
          {!isAscValid && <span className={styles.error}>Código ASC no válido</span>}
        </div>
        <div className={styles.formField}>
          <label className={styles.label}># Orden de servicio</label>
          <input type="text" name="user_ods" className={styles.input} required />
        </div>
        <div className={styles.formField}>
          <label className={styles.label}>Correo Electrónico *</label>
          <input type="email" name="user_email" className={styles.input} required />
        </div>
        <div className={styles.formField}>
          <label className={styles.label}>Teléfono o Cel *</label>
          <input type="tel" name="user_phone" className={styles.input} required />
        </div>
        <div className={styles.formField}>
          <label className={styles.label}>
            Agrega el producto o duda para código de cierre no encontrado *
          </label>
          <textarea name="message" className={styles.textarea} required />
        </div>
        <input type="submit" value="Enviar" className={styles.button} disabled={!isAscValid} />
      </form>
    </>
  );
};

export default ContactForm;
