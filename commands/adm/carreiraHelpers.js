/* ========================================================================
   ARQUIVO: commands/adm/carreiraHelpers.js (CÓDIGO COMPLETO)
   
   - Este é o "Cérebro" do sistema de ADM.
   - Contém a sua lógica de promoção (recalcularRank)
   - Contém as funções de ler/escrever JSON.
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
        console.error(`Erro ao ler ${filePath}, reescrevendo o arquivo.`, e);
        fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
        return {};
    }
};

const safeWriteJson = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};


/* Sua função 'recalcularRank', movida do carreira.js */
async function recalcularRank(member, faccao, userProgress, cargoRecrutaId) {
    if (!member || !faccao || !userProgress) {
        console.error("[recalcularRank] Faltam dados (membro, faccao ou userProgress).");
        return;
    }

    const totalWins = userProgress.totalWins;
    let novoCargo = null; 

    // Itera do rank mais alto para o mais baixo
    for (let i = faccao.caminho.length - 1; i >= 0; i--) {
        const rank = faccao.caminho[i];
        if (totalWins >= rank.custo) {
            novoCargo = rank; 
            break; 
        }
    }

    const cargoAtualId = userProgress.currentRankId;

    // Caso 1: O usuário já está com o cargo correto. Não faz nada.
    if (novoCargo && cargoAtualId === novoCargo.id) {
        return;
    }

    // Caso 2: O usuário não tem vitórias suficientes para nenhum cargo (ex: foi resetado)
    if (!novoCargo && cargoAtualId) {
        await member.roles.remove(cargoAtualId).catch(console.error);
        await member.roles.add(cargoRecrutaId).catch(console.error); // Adiciona recruta
        userProgress.currentRankId = null;
        return; 
    }
    
    // Caso 3: O usuário precisa ser promovido
    if (novoCargo) {
        const cargosParaRemover = [cargoRecrutaId]; 
        for (const rank of faccao.caminho) {
            if (rank.id !== novoCargo.id) {
                cargosParaRemover.push(rank.id);
            }
        }
        
        await member.roles.remove(cargosParaRemover.filter(id => id && member.roles.cache.has(id))).catch(console.error);
        await member.roles.add(novoCargo.id).catch(console.error);
        userProgress.currentRankId = novoCargo.id;
    }
}

// Exporta as funções
module.exports = { 
    safeReadJson, 
    safeWriteJson,
    recalcularRank 
};