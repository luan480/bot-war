/* ========================================================================
   ARQUIVO /commands/adm/promotionHandler.js (NOVO)
   
   - Este arquivo contém TODA a lógica de monitorar o canal
     de prints e promover usuários.
   - Ele é ativado pelo 'index.js' e recebe o 'client'
   ======================================================================== */
   
const { Events, EmbedBuilder } = require('discord.js');
const path = require('path');
// Precisamos importar o 'helpers' de dentro da pasta 'liga'
// Caminho: ../ (sai da 'adm') -> liga/ -> utils/ -> helpers.js
const { safeReadJson, safeWriteJson } = require('../liga/utils/helpers.js');

// Define os caminhos
const carreirasPath = path.join(__dirname, 'carreiras.json');
const progressaoPath = path.join(__dirname, 'progressao.json');

// Esta função exporta tudo
module.exports = (client) => {
    
    // Aqui está o seu vigia de prints, exatamente como era antes
    // Ele "escuta" o evento MessageCreate que o 'client' (passado pelo index.js) recebe
    client.on(Events.MessageCreate, async message => {
        const carreirasConfig = safeReadJson(carreirasPath);
        // Ignora bots e mensagens fora do canal de prints
        if (message.author.bot || message.channel.id !== carreirasConfig.canalDePrints) {
            return;
        }
        // Ignora mensagens sem anexos (prints)
        if (message.attachments.size === 0) {
            return;
        }

        try {
            const member = message.member;
            const userId = member.id;
            const guild = message.guild; 
            
            // Acha a facção do membro
            let faccaoId = null;
            for (const id of Object.keys(carreirasConfig.faccoes)) {
                if (member.roles.cache.has(id)) {
                    faccaoId = id;
                    break;
                }
            }
            if (!faccaoId) {
                console.log(`[Prints] ${member.displayName} postou, mas não tem cargo de facção. Ignorando.`);
                return;
            }

            const faccao = carreirasConfig.faccoes[faccaoId];
            const progressao = safeReadJson(progressaoPath);
            
            // [LÓGICA DE SCAN] Verifica se é um membro antigo
            if (!progressao[userId]) {
                console.log(`[Prints] Novo usuário detectado: ${member.displayName}. Verificando cargos existentes...`);
                let currentRankId = null;
                let totalWins = 0;

                // Loop reverso (do mais alto para o mais baixo)
                for (let i = faccao.caminho.length - 1; i >= 0; i--) {
                    const rank = faccao.caminho[i];
                    if (member.roles.cache.has(rank.id)) {
                        currentRankId = rank.id;
                        totalWins = rank.custo; 
                        console.log(`[Prints] Usuário já tem o cargo: ${rank.nome}. Definindo vitórias como: ${totalWins}`);
                        break; 
                    }
                }
                
                progressao[userId] = {
                    factionId: faccaoId,
                    currentRankId: currentRankId, 
                    totalWins: totalWins 
                };
            }

            // Adiciona a vitória
            progressao[userId].totalWins += 1;
            const totalWins = progressao[userId].totalWins;

            await message.react('✅'); // Reage com joinha

            // Acha o cargo atual e o próximo
            const cargoAtualId = progressao[userId].currentRankId;
            let proximoCargo = null;

            if (!cargoAtualId) {
                proximoCargo = faccao.caminho[0];
            } else {
                const rankAtualIndex = faccao.caminho.findIndex(r => r.id === cargoAtualId);
                if (rankAtualIndex < faccao.caminho.length - 1) { 
                    proximoCargo = faccao.caminho[rankAtualIndex + 1];
                }
            }

            // Se não precisa promover, salva e para
            if (!proximoCargo || totalWins < proximoCargo.custo) {
                safeWriteJson(progressaoPath, progressao);
                return;
            }

            // PROMOÇÃO!
            const cargosParaAdicionar = [proximoCargo.id];
            const cargosParaRemover = [carreirasConfig.cargoRecrutaId]; 
            if (cargoAtualId) {
                cargosParaRemover.push(cargoAtualId); 
            }

            await member.roles.add(cargosParaAdicionar);
            await member.roles.remove(cargosParaRemover.filter(id => id && member.roles.cache.has(id))); 

            // Atualiza o banco de dados
            progressao[userId].currentRankId = proximoCargo.id;
            safeWriteJson(progressaoPath, progressao);

            // Anuncia a promoção (com o embed melhorado)
            const canalDeAnuncio = await client.channels.fetch(faccao.canalDeAnuncio).catch(() => null);
            if (canalDeAnuncio) {

                let cargoAntigoNome = "• Recruta";
                if (cargoAtualId) { 
                    const cargoAntigo = faccao.caminho.find(r => r.id === cargoAtualId);
                    if (cargoAntigo) {
                        cargoAntigoNome = cargoAntigo.nome;
                    }
                }

                let proximaMetaNome = "Patente Máxima";
                let proximaMetaProgresso = "Você atingiu o topo da sua carreira! Parabéns!";
                
                const rankAtualIndex = faccao.caminho.findIndex(r => r.id === proximoCargo.id); 

                if (rankAtualIndex < faccao.caminho.length - 1) { 
                    const proximaMetaCargo = faccao.caminho[rankAtualIndex + 1];
                    proximaMetaNome = proximaMetaCargo.nome;
                    const winsNecessarias = proximaMetaCargo.custo;
                    const winsFaltando = winsNecessarias - totalWins;
                    const custoPatenteAtual = proximoCargo.custo;
                    const custoPatenteProxima = proximaMetaCargo.custo;
                    const winsNestaEtapa = custoPatenteProxima - custoPatenteAtual;
                    const winsAtuaisNestaEtapa = 0; 
                    
                    let percent = 0;
                    if (winsNestaEtapa > 0) {
                        percent = Math.floor((winsAtuaisNestaEtapa / winsNestaEtapa) * 10);
                    }
                    const barra = '■'.repeat(percent) + '□'.repeat(10 - percent); 

                    proximaMetaProgresso = `**${winsFaltando} vitórias** para a próxima patente.\n${barra} (${totalWins} / ${winsNecessarias} totais)`;
                }
                
                const embed = new EmbedBuilder()
                    .setColor('#f1c40f')
                    .setAuthor({ name: "SISTEMA DE PROMOÇÃO", iconURL: guild.iconURL() }) 
                    .setTitle(`🏆 PROMOÇÃO DE ${faccao.nome.toUpperCase()} 🏆`)
                    .setDescription(`Parabéns, ${member.user}! Você subiu na carreira!`) 
                    .addFields(
                        { name: "Patente Anterior", value: `~~${cargoAntigoNome}~~`, inline: true },
                        { name: "Nova Patente", value: `**${proximoCargo.nome}**`, inline: true },
                        { name: "Total de Vitórias", value: `🏆 ${totalWins}`, inline: true },
                        { name: "Próxima Meta", value: proximaMetaNome, inline: false },
                        { name: "Progresso para a Próxima Meta", value: proximaMetaProgresso, inline: false }
                    )
                    .setThumbnail(member.user.displayAvatarURL())
                    .setTimestamp();
                
                await canalDeAnuncio.send({ embeds: [embed] });
            }

            console.log(`[PROMOÇÃO] ${member.displayName} foi promovido para ${proximoCargo.nome} com ${totalWins} vitórias.`);

        } catch (err) {
            console.error("Erro no sistema de promoção:", err);
            await message.react('❌');
        }
    });
};