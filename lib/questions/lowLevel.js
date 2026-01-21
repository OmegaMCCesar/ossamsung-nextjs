const lowLevelQuestions = () => {
    return {
        "productA": [
            { id: 1, question: "¿Qué es el producto A?", options: ["Opción 1", "Opción 2", "Opción 3"], answer: "Opción 1" },   
            { id: 2, question: "¿Cómo se configura el producto A?", options: ["Opción 1", "Opción 2", "Opción 3"], answer: "Opción 2" }
        ],
        "productB": [
            { id: 1, question: "¿Cuál es la función principal del producto B?", options: ["Opción 1", "Opción 2", "Opción 3"], answer: "Opción 3" },
            { id: 2, question: "¿Cómo se realiza el mantenimiento del producto B?", options: ["Opción 1", "Opción 2", "Opción 3"], answer: "Opción 1" }
        ]
    };
}

export default lowLevelQuestions;