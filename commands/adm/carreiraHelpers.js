/* ========================================================================
   ARQUIVO: commands/adm/carreiraHelpers.js (NOVO)
   
   - Contém a lógica de promoção (recalcularRank)
   - Contém as funções de ler/escrever JSON (para não depender da pasta LIGA)
   ======================================================================== */
const fs = require('fs');

/* Funções de Leitura/Escrita Segura */
const safeReadJson = (filePath) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
        return {};
    }
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data.trim() === '' ? '{}' : data);
    } catch (e) {
        fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
        return {};
    }
};

const safeWriteJson = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};


/* A sua função 'recalcularRank', movida do carreira.js */
async function recalcularRank(member, faccao, userProgress, cargoRecrutaId) {
    if (!member || !faccao || !userProgress) {
        console.error("[recalcularRank] Faltam dados (membro, faccao ou userProgress).");
        return;
    }

    const totalWins = userProgress.totalWins;
    let novoCargo = null; // O cargo que o usuário DEVERIA ter

    // Itera do rank mais alto para o mais baixo
    for (let i = faccao.caminho.length - 1; i >= 0; i--) {
        const rank = faccao.caminho[i];
        // Se as vitórias do usuário são suficientes para este rank
        if (totalWins >= rank.custo) {
            novoCargo = rank; // Este é o rank correto dele
            break; // Para o loop
        }
    }

    const cargoAtualId = userProgress.currentRankId;

    // Caso 1: O usuário já está com o cargo correto. Não faz nada.
    if (novoCargo && cargoAtualId === novoCargo.id) {
        return; // Já está correto
    }

    // Caso 2: O usuário não tem vitórias suficientes para nenhum cargo (ex: foi resetado)
    // Remove o cargo atual (se ele tiver um) e o move para Recruta.
    if (!novoCargo && cargoAtualId) {
        await member.roles.remove(cargoAtualId).catch(console.error);
        await member.roles.add(cargoRecrutaId).catch(console.error);
        userProgress.currentRankId = null;
        return; // Retorna para Recruta
    }

    // Caso 3: O usuário precisa ser promovido (ou rebaixado por admin)
    if (novoCargo) {
        const cargosParaRemover = [cargoRecrutaId];
        // Adiciona TODOS os cargos da facção na lista de remoção
        for (const rank of faccao.caminho) {
            if (rank.id !== novoCargo.id) {
                cargosParaRemover.push(rank.id);
            }
        }
        
        // Remove todos os cargos antigos
        await member.roles.remove(cargosParaRemover.filter(id => id && member.roles.cache.has(id))).catch(console.error);
        
        // Adiciona o novo cargo
        await member.roles.add(novoCargo.id).catch(console.error);
        
        // Atualiza o 'progressao.json' com o ID do novo cargo
        userProgress.currentRankId = novoCargo.id;
    }
}

// Exporta as funções
module.exports = { 
    safeReadJson, 
    safeWriteJson,
    recalcularRank 
};