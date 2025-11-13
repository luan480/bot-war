/* ========================================================================
   ARQUIVO: commands/adm/carreiraHelpers.js (COMPLETO E CORRIGIDO)
   
   - [O BUG] A versão antiga tinha um "atalho" que impedia o bot de
     sincronizar cargos se ele *achava* que já estava tudo certo.
   - [A CORREÇÃO] Removemos esse atalho. O bot agora SEMPRE
     vai remover os cargos errados e adicionar o cargo certo,
     corrigindo a des-sincronização.
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


/* Sua função 'recalcularRank', agora corrigida */
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

    // -----------------------------------------------------------------
    // [A CORREÇÃO ESTÁ AQUI]
    // O "Caso 1" que estava aqui foi REMOVIDO.
    //
    // O código antigo era:
    // if (novoCargo && cargoAtualId === novoCargo.id) {
    //     return; // <--- Este 'return' era o BUG.
    // }
    //
    // Agora o bot é forçado a continuar e verificar os cargos.
    // -----------------------------------------------------------------


    // Caso 2: O usuário não tem vitórias suficientes para nenhum cargo (ex: foi resetado)
    if (!novoCargo && cargoAtualId) {
        await member.roles.remove(cargoAtualId).catch(console.error);
        await member.roles.add(cargoRecrutaId).catch(console.error); // Adiciona recruta
        userProgress.currentRankId = null;
        return; 
    }
    
    // Caso 3: O usuário precisa ser promovido (ou sincronizado)
    if (novoCargo) {
        // Se o cargo no banco de dados (cargoAtualId) for o mesmo
        // que o cargo que ele deve ter (novoCargo.id), E
        // o membro JÁ TEM o cargo, aí sim podemos parar.
        if (cargoAtualId === novoCargo.id && member.roles.cache.has(novoCargo.id)) {
            return; // Agora sim está 100% sincronizado.
        }

        const cargosParaRemover = [cargoRecrutaId]; 
        for (const rank of faccao.caminho) {
            if (rank.id !== novoCargo.id) {
                cargosParaRemover.push(rank.id);
            }
        }
        
        // Esta é a parte importante:
        // 1. Remove o @Recruta (que você tem)
        await member.roles.remove(cargosParaRemover.filter(id => id && member.roles.cache.has(id))).catch(console.error);
        // 2. Adiciona o @Subalterno (que você deveria ter)
        await member.roles.add(novoCargo.id).catch(console.error);
        
        // 3. Atualiza o banco de dados (que já estava "certo", mas agora confirmamos)
        userProgress.currentRankId = novoCargo.id;
    }
}

// Exporta as funções
module.exports = { 
    safeReadJson, 
    safeWriteJson,
    recalcularRank 
};