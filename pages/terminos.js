import Layout from "../components/Layout";
import styles from "../styles/terminos.module.css"; // Importa el módulo CSS

export default function Terminos() {
  return (
    <Layout title="Términos y Condiciones - LC Munios"> {/* Título actualizado */}
      <div className={styles.terminosPageContent}>
      <h1>Términos y Condiciones del Servicio</h1>

      <p>
        Bienvenido a os-samsung.vercel.app . Estos Términos y Condiciones rigen tu acceso y uso de nuestro sitio web
        y los servicios de soporte técnico y educativo en línea blanca que ofrecemos.
        Al acceder o utilizar nuestro sitio web, confirmas que has leído, entendido y aceptado
        cumplir con estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos,
        no debes utilizar nuestro sitio web o servicios.
      </p>

      <h2>1. Descripción del Servicio</h2>
      <p>
        LC Munios proporciona guías, tutoriales, información de diagnóstico, procedimientos
        de reparación y soporte educativo relacionado con electrodomésticos de línea blanca,
        principalmente de la marca Samsung. Nuestro objetivo es ofrecer recursos para
        ayudar a técnicos profesionales y aprendices a mejorar sus habilidades y
        conocimientos. El acceso a ciertos contenidos o servicios puede requerir registro.
      </p>

      <h2>2. Uso del Sitio Web y Contenido</h2>
      <p>
        a. Debes utilizar este sitio web y nuestros servicios únicamente para fines lícitos
        y de acuerdo con estos Términos y Condiciones.<br/>
        b. El contenido proporcionado es para fines informativos y educativos generales.
        Aunque nos esforzamos por la precisión, no garantizamos que toda la información
        sea siempre completa, precisa o actualizada.<br/>
        c. Queda prohibido cualquier uso del contenido con fines comerciales no autorizados,
        su distribución, modificación, reproducción o alteración sin nuestro permiso expreso por escrito.
      </p>

       <h2>3. Propiedad Intelectual</h2>
       <p>
         Todo el contenido presente en el sitio web, incluyendo, entre otros, textos, gráficos,
         tutoriales, archivos de audio, archivos de video,
         software y diseño, son propiedad exclusiva de LC Munios o sus licenciantes
         y están protegidos por las leyes de propiedad intelectual aplicables.
         Estos Términos y Condiciones no te otorgan ninguna licencia o derecho
         sobre el contenido o la propiedad intelectual de LC Munios, salvo el derecho
         limitado a usar el sitio y el contenido según se describe aquí.
         <br/>
         logotipos, iconos, imágenes, guías que aparecen en el sitio web son propiedad de sus respectivos
         propietarios y se utilizan únicamente con fines de referencia técnica y educativa.
       </p>

      <h2>4. Exclusión de Garantías y Limitación de Responsabilidad</h2>
      <p>
        a. El sitio web y los servicios se proporcionan tal cual y según disponibilidad,
        sin garantías de ningún tipo, ya sean expresas o implícitas, incluyendo, pero no
        limitado a, garantías de comerciabilidad, idoneidad para un propósito particular
        y no infracción.<br/>
        b. La información técnica y las guías proporcionadas tienen un propósito orientativo.
        **Tú, como usuario, eres completamente responsable de la aplicación de cualquier
        información o procedimiento.** La reparación de electrodomésticos implica riesgos,
        incluyendo daños a la propiedad, lesiones personales o incluso la muerte.
        Debes contar con el conocimiento, las herramientas y las medidas de seguridad adecuadas.<br/>
        c. **LC Munios no asume responsabilidad alguna por daños, pérdidas o perjuicios
        directos, indirectos, incidentales, especiales o consecuentes (incluyendo, pero no
        limitado a, pérdida de ganancias, datos o interrupción del negocio) que surjan
        del uso o la incapacidad de usar nuestro sitio web o servicios, o de la aplicación
        de la información o guías proporcionadas, independientemente de la teoría legal,
        incluso si LC Munios ha sido advertido de la posibilidad de tales daños.**<br/>
        d. No garantizamos que el sitio web sea ininterrumpido, libre de errores, seguro,
        o que los defectos serán corregidos.
      </p>

      <h2>5. Cuentas de Usuario (Si aplica el registro)</h2>
      <p>
        Si el sitio web requiere registro, eres responsable de mantener la confidencialidad
        de tu información de inicio de sesión y de todas las actividades que ocurran bajo
        tu cuenta. Te comprometes a notificar a LC Munios inmediatamente sobre cualquier
        uso no autorizado de tu cuenta.
      </p> {/* Elimina esta sección si no tienes registro de usuarios */}


      <h2>6. Enlaces a Sitios Web de Terceros</h2>
      <p>
        Nuestro sitio web puede contener enlaces a sitios web o servicios de terceros
        que no son propiedad ni están controlados por LC Munios. No tenemos control
        ni asumimos responsabilidad sobre el contenido, políticas de privacidad o prácticas
        de sitios web o servicios de terceros. Reconoces y aceptas que LC Munios
        no será responsable, directa o indirectamente, por cualquier daño o pérdida
        causada o supuestamente causada por o en conexión con el uso de o la confianza
        en cualquier contenido, bienes o servicios disponibles en o a través de dichos
        sitios web o servicios.
      </p>

      <h2>7. Modificación de los Términos</h2>
      <p>
        Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar
        estos Términos y Condiciones en cualquier momento. Si una revisión es material,
        intentaremos proporcionar un aviso de al menos 30 días antes de que los nuevos
        términos entren en vigor. Lo que constituye un cambio material se determinará
        a nuestra sola discreción. Al continuar accediendo o utilizando nuestro sitio web
        después de que esas revisiones entren en vigor, aceptas regirte por los términos revisados.
      </p>

      <h2>8. Privacidad</h2>
      <p>
        Tu uso de nuestro sitio web también se rige por nuestra Política de Privacidad.
        Por favor, revisa nuestra Política de Privacidad, que explica cómo recopilamos,
        utilizamos y divulgamos tu información personal.
      </p> {/* Asegúrate de tener una página separada para la Política de Privacidad */}


      <h2>9. Legislación Aplicable y Jurisdicción</h2>
      <p>
        Estos Términos y Condiciones se regirán e interpretarán de acuerdo con las leyes
        de México, sin tener en cuenta sus disposiciones
        sobre conflicto de leyes. Cualquier disputa que surja de o esté relacionada
        con estos Términos será sometida a la jurisdicción exclusiva de los tribunales
        competentes en Ciudad de México.
      </p> {/* **IMPORTANTE: Debes llenar esta parte con la legislación y jurisdicción correctas.** */}

      <h2>10. Contacto</h2>
      <p>
        Si tienes alguna pregunta sobre estos Términos y Condiciones, por favor, contáctanos
        a través de la sección de contacto de nuestro sitio web o al correo electrónico: luiscesar.munoz.cervantes.upiit@gmail.com.
      </p> {/* **IMPORTANTE: Reemplaza con tu correo electrónico.** */}

       <p style={{ fontSize: '0.9em', marginTop: '30px', fontStyle: 'italic' }}>
         Última actualización:Fecha de la última actualización, 17 de mayo de 2025
       </p> {/* **IMPORTANTE: Agrega la fecha de la última actualización.** */}
      </div>
    </Layout>
  );
}
