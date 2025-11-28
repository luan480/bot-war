/* ========================================================================
   ARQUIVO: commands/liga/utils/helpers.js (VERSÃO BLINDADA - ANTI-CORRUPÇÃO)
   DESCRIÇÃO: Usa 'Atomic Writes' para impedir que o JSON quebre se o bot cair.
   ======================================================================== */

const fs = require('fs');
const path = require('path');

/**
 * Lê um arquivo JSON de forma segura.
 * Se o arquivo não existir ou estiver corrompido, cria um backup e retorna {}.
 */
const safeReadJson = (filePath) => {
    // 1. Se não existe, cria vazio
    if (!fs.existsSync(filePath)) {
        try {
            fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
        } catch (err) {
            console.error(`[ERRO GRAVE] Não foi possível criar o arquivo ${filePath}:`, err);
            return {};
        }
        return {};
    }

    try {
        // 2. Tenta ler
        const data = fs.readFileSync(filePath, 'utf8');
        
        // 3. Se estiver vazio, retorna objeto vazio para não quebrar o JSON.parse
        if (!data.trim()) return {};

        return JSON.parse(data);
    } catch (e) {
        console.error(`[ALERTA] Arquivo corrompido detectado: ${filePath}`);
        console.error(`[ALERTA] Detalhe do erro: ${e.message}`);
        
        // Opcional: Faz um backup do arquivo estragado antes de resetar
        try {
            fs.copyFileSync(filePath, `${filePath}.corrupted.${Date.now()}`);
            console.log(`[INFO] Backup do arquivo corrompido salvo.`);
        } catch (copyErr) {}

        // Retorna vazio para o bot não desligar
        return {};
    }
};

/**
 * Escreve dados em um arquivo JSON de forma ATÔMICA.
 * Isso impede que o arquivo fique pela metade se o bot desligar durante o salvamento.
 */
const safeWriteJson = (filePath, data) => {
    const tempPath = `${filePath}.tmp`; // Cria um nome temporário (ex: economy.json.tmp)

    try {
        // 1. Escreve no arquivo temporário primeiro
        fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));

        // 2. Renomeia o temporário para o nome oficial (Operação Atômica)
        // Se o bot cair aqui, o arquivo original ainda existe intacto.
        fs.renameSync(tempPath, filePath);

    } catch (err) {
        console.error(`[ERRO CRÍTICO] Falha ao salvar dados em ${filePath}:`, err);
        // Tenta limpar o arquivo temporário se sobrou
        try { fs.unlinkSync(tempPath); } catch (e) {}
    }
};

/**
 * Formata strings (Primeira letra maiúscula)
 */
const capitalize = (s) => {
    if (typeof s !== 'string' || s.length === 0) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
};

module.exports = { safeReadJson, safeWriteJson, capitalize };