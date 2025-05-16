import Layout from "../components/Layout";

export default function Contacto() {
  return (
    <Layout title="Contacto - OSSamsung">
      <h1>Contacta con Nosotros</h1>
      <p>¿Tienes alguna duda o necesitas ayuda? ¡Estamos aquí para ayudarte!</p>
      <form>
        <label htmlFor="nombre">Nombre:</label>
        <input type="text" id="nombre" name="nombre" required />

        <label htmlFor="email">Correo Electrónico:</label>
        <input type="email" id="email" name="email" required />

        <label htmlFor="mensaje">Mensaje:</label>
        <textarea id="mensaje" name="mensaje" required></textarea>

        <button type="submit">Enviar</button>
      </form>
    </Layout>
  );
}
