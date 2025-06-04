import styles from '../../../styles/AddAscInfo.module.css'; // Importa el archivo CSS para estilos

const AddAscInfo = () => {
    return (
        <div className={styles.container}> 
            <h1>Agregar Información de ASC</h1>
            <p>Aquí puedes agregar información relacionada con el ASC.</p>
            {/* Aquí puedes agregar más campos o formularios según sea necesario */}
            <form onSubmit={() => alert('Formulario enviado')}>
                <div>
                    <label htmlFor="ascName">Nombre del ASC:</label>
                    <input type="text" id="ascName" name="ascName" required />
                </div>
                <div>
                    <label htmlFor="ascDescription">Descripción del ASC:</label>
                    <textarea id="ascDescription" name="ascDescription" rows="4" required></textarea>
                </div>
                <button type="submit">Agregar ASC</button>
            </form>
        </div>
    )
}

export default AddAscInfo;