const fs = require('fs');

/**
 * Lê um arquivo JSON de forma segura.
 * Se o arquivo não existir ou estiver vazio, cria um com {} e retorna {}.
 * @param {string} filePath - O caminho para o arquivo JSON.
 * @returns {object} O objeto JSON lido.
 */
const safeReadJson = (filePath) => {
    // Verifica se o arquivo existe
    if (!fs.existsSync(filePath)) {
        // Se não existir, cria um arquivo vazio com '{}'
        fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
        return {}; // Retorna um objeto vazio
    }
    try {
        // Tenta ler o arquivo
        const data = fs.readFileSync(filePath, 'utf8');
        // Se o arquivo estiver vazio, retorna {}, senão, faz o parse do JSON
        return JSON.parse(data.trim() === '' ? '{}' : data);
    } catch (e) {
        // Se der erro no parse (arquivo corrompido),
        // reescreve o arquivo com '{}' e retorna um objeto vazio
        console.error(`Erro ao ler ${filePath}, reescrevendo o arquivo.`, e);
        fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
        return {};
    }
};

/**
 * Escreve dados em um arquivo JSON de forma segura.
 * @param {string} filePath - O caminho para o arquivo JSON.
 * @param {object} data - O objeto a ser escrito no JSON.
 */
const safeWriteJson = (filePath, data) => {
    // Escreve o objeto 'data' no 'filePath' formatado (null, 2)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

/**
 * Coloca a primeira letra de uma string em maiúscula.
 * @param {string} s - A string para capitalizar.
 * @returns {string} A string capitalizada.
 */
const capitalize = (s) => {
    if (typeof s !== 'string' || s.length === 0) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
};

// Exporta as funções para que outros arquivos possam usá-las
module.exports = { safeReadJson, safeWriteJson, capitalize };