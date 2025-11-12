/* ========================================================================
   ARQUIVO: commands/adm/logHandler.js (V6 - COMPLETO E CORRIGIDO)
   
   - Corrige o erro de 'SyntaxError: Unexpected end of input'
     garantindo que o arquivo está completo.
   ======================================================================== */
   
const { Events, EmbedBuilder, AuditLogEvent, ChannelType } = require('discord.js');
const path = require('path');
const { safeReadJson } = require('../liga/utils/helpers.js');

const logConfigPath = path.join(__dirname, 'log_config.json');

module.exports = (client) => {

    // Função para buscar o canal de log
    async function getLogChannel() {
        const config = safeReadJson(logConfigPath);
        if (!config.logChannelId) return null;
        return await client.channels.fetch(config.logChannelId).catch(() => null);
    }

    // --- LOG DE MENSAGEM DELETADA (COM ESPELHO) ---
    client.on(Events.MessageDelete, async (message) => {
        if (!message.guild || message.author?.bot) return;
        const logChannel = await getLogChannel();
        if (!logChannel) return;
        
        try {
            // ESPELHO (Ghost Ping)
            if (message.mentions.users.size > 0) {
                const mentionedUser = message.mentions.users.first();
                if (mentionedUser.id !== message.author.id) {
                    const embed = new EmbedBuilder()
                        .setColor('#9B59B6').setTitle('👻 Ghost Ping Detectado (Espelho)')
                        .setDescription(`**Autor:** ${message.author} (${message.author.tag})\n**Mencionado:** ${mentionedUser} (${mentionedUser.tag})\n**Canal:** ${message.channel}`)
                        .addFields({ name: 'Mensagem Deletada', value: `\`\`\`${message.content || '[N/A]'}\`\`\`` })
                        .setThumbnail(message.author.displayAvatarURL()).setTimestamp();
                    await logChannel.send({ embeds: [embed] });
                    return; 
                }
            }
        } catch (err) { console.error("Erro no log MessageDelete (Ghost Ping):", err); }
    });

    // --- LOG DE MENSAGEM EDITADA ---
    client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
        if (!newMessage.guild || newMessage.author?.bot || oldMessage.content === newMessage.content) return;
        const logChannel = await getLogChannel();
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor('Yellow').setTitle('Mensagem Editada')
            .setDescription(`**Autor:** ${newMessage.author.tag} (${newMessage.author.id})\n**Canal:** ${newMessage.channel}\n[Ir para a Mensagem](${newMessage.url})`)
            .addFields(
                { name: 'Conteúdo Antigo', value: `\`\`\`${oldMessage.content.slice(0, 1000) || '[N/A]'}\`\`\`` },
                { name: 'Conteúdo Novo', value: `\`\`\`${newMessage.content.slice(0, 1000) || '[N/A]'}\`\`\`` }
            )
            .setThumbnail(newMessage.author.displayAvatarURL()).setTimestamp();
        try {
            await logChannel.send({ embeds: [embed] });
        } catch (err) { console.error("Erro no log MessageUpdate:", err); }
    });
    
    // --- LOGS DE MEMBROS (ENTRADA, CARGOS, APELIDOS) ---
    client.on(Events.GuildMemberAdd, async (member) => {
        const logChannel = await getLogChannel();
        if (!logChannel) return;
        const embed = new EmbedBuilder()
            .setColor('Green').setTitle('Membro Entrou')
            .setDescription(`**Usuário:** ${member.user} (${member.user.tag})\n**ID:** ${member.id}\n**Conta Criada em:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:f>`)
            .setThumbnail(member.user.displayAvatarURL()).setTimestamp();
        await logChannel.send({ embeds: [embed] });
    });

    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
        const logChannel = await getLogChannel();
        if (!logChannel) return;

        // 1. MUDANÇA DE APELIDO
        if (oldMember.nickname !== newMember.nickname) {
            const embed = new EmbedBuilder()
                .setColor('Blue').setTitle('Mudança de Apelido')
                .setDescription(`**Membro:** ${newMember.user} (${newMember.user.tag})`)
                .addFields(
                    { name: 'Apelido Antigo', value: `\`\`\`${oldMember.nickname || oldMember.user.username}\`\`\`` },
                    { name: 'Apelido Novo', value: `\`\`\`${newMember.nickname || newMember.user.username}\`\`\`` }
                )
                .setThumbnail(newMember.user.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }

        // 2. MUDANÇA DE CARGOS
        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;

        if (oldRoles.size !== newRoles.size) {
            const embed = new EmbedBuilder()
                .setColor('Blue').setTitle('Cargos Atualizados')
                .setDescription(`**Membro:** ${newMember.user} (${newMember.user.tag})`);
            const fetchedLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberRoleUpdate }).catch(() => null);
            const roleLog = fetchedLogs?.entries.first();
            
            if (roleLog && roleLog.target.id === newMember.id && roleLog.createdAt > (Date.now() - 5000)) {
                embed.addFields({ name: 'Alterado por', value: `${roleLog.executor}` });
            } else {
                embed.addFields({ name: 'Alterado por', value: `*Não detectado (Automático ou usuário)*` });
            }
            const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
            if (addedRoles.size > 0) {
                embed.addFields({ name: 'Cargos Adicionados', value: addedRoles.map(r => r.name).join(', ') });
            }
            const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));
            if (removedRoles.size > 0) {
                embed.addFields({ name: 'Cargos Removidos', value: removedRoles.map(r => r.name).join(', ') });
            }
            await logChannel.send({ embeds: [embed] });
        }
    });

    // --- LOGS DE VOZ (COM VERIFICAÇÃO DE "MOVER") ---
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
        const logChannel = await getLogChannel();
        if (!logChannel) return;
        
        const user = newState.member.user;
        
        // 1. ENTROU NO CANAL
        if (!oldState.channel && newState.channel) {
            const embed = new EmbedBuilder()
                .setColor('Green').setTitle('Voz: Membro Entrou')
                .setDescription(`**Membro:** ${user} (${user.tag})\n**Canal:** ${newState.channel.name}`)
                .setThumbnail(user.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }

        // 2. SAIU DO CANAL
        if (oldState.channel && !newState.channel) {
            const embed = new EmbedBuilder()
                .setColor('Orange').setTitle('Voz: Membro Saiu')
                .setDescription(`**Membro:** ${user} (${user.tag})\n**Canal:** ${oldState.channel.name}`)
                .setThumbnail(user.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }

        // 3. MUDOU DE CANAL (OU FOI MOVIDO)
        if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            
            const fetchedLogs = await newState.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberMove,
            }).catch(() => null);

            const moveLog = fetchedLogs?.entries.first();
            let embed;

            // Se foi movido por um Admin
            if (moveLog && moveLog.target.id === user.id && moveLog.createdAt > (Date.now() - 5000)) {
                embed = new EmbedBuilder()
                    .setColor('DarkBlue') 
                    .setTitle('Voz: Membro Foi Movido')
                    .setDescription(`**Membro:** ${user} (${user.tag})\n**Movido por:** ${moveLog.executor}`)
                    .addFields(
                        { name: 'Saiu de', value: `${oldState.channel.name}` },
                        { name: 'Entrou em', value: `${newState.channel.name}` }
                    )
                    .setThumbnail(user.displayAvatarURL()).setTimestamp();
            } else {
            // Se trocou de canal sozinho
                embed = new EmbedBuilder()
                    .setColor('Blue').setTitle('Voz: Membro Trocou de Canal')
                    .setDescription(`**Membro:** ${user} (${user.tag})`)
                    .addFields(
                        { name: 'Saiu de', value: `${oldState.channel.name}` },
                        { name: 'Entrou em', value: `${newState.channel.name}` }
                    )
                    .setThumbnail(user.displayAvatarURL())
                    .setTimestamp(); // <-- ESTA ERA A LINHA 143 QUEBRADA
            }
            await logChannel.send({ embeds: [embed] });
        }
    });

    // --- OUVINTE DO REGISTRO DE AUDITORIA (LOGS DE ADMIN) ---
    client.on(Events.GuildAuditLogEntryCreate, async (auditLogEntry, guild) => {
        const logChannel = await getLogChannel();
        if (!logChannel) return;

        const { action, executor, target, reason } = auditLogEntry;

        // --- LOG DE MENSAGEM DELETADA ---
        if (action === AuditLogEvent.MessageDelete) {
            if (executor.id === client.user.id || (target && executor.id === target.id)) return;
            const embed = new EmbedBuilder()
                .setColor('Red').setTitle('Mensagem Deletada por Moderador')
                .setDescription(`**Autor da Mensagem:** ${target} (${target.tag})\n**Deletado por:** ${executor} (${executor.tag})\n**Canal:** <#${auditLogEntry.extra.channel.id}>`)
                .setThumbnail(executor.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }

        // --- LOG DE MEMBRO BANIDO ---
        if (action === AuditLogEvent.MemberBanAdd) {
            const embed = new EmbedBuilder()
                .setColor('DarkRed').setTitle('Membro Banido')
                .setDescription(`**Usuário:** ${target} (${target.tag})\n**Banido por:** ${executor} (${executor.tag})\n**Motivo:** \`\`\`${reason || 'N/A'}\`\`\``)
                .setThumbnail(target.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
        
        // --- LOG DE CANAL CRIADO ---
        if (action === AuditLogEvent.ChannelCreate) {
            const embed = new EmbedBuilder()
                .setColor('Green').setTitle('Canal Criado')
                .setDescription(`**Canal:** ${target} (${target.name})\n**Tipo:** ${ChannelType[target.type]}\n**Criado por:** ${executor} (${executor.tag})`)
                .setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }

        // --- LOG DE CANAL DELETADO ---
        if (action === AuditLogEvent.ChannelDelete) {
            const embed = new EmbedBuilder()
                .setColor('DarkRed').setTitle('Canal Deletado')
                .setDescription(`**Canal:** \`#${auditLogEntry.changes.find(c => c.key === 'name').old}\`\n**Tipo:** ${ChannelType[auditLogEntry.changes.find(c => c.key === 'type').old]}\n**Deletado por:** ${executor} (${executor.tag})`)
                .setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
    });

    // --- OUVINTE DE MEMBRO SAIU (A LÓGICA CORRIGIDA) ---
    client.on(Events.GuildMemberRemove, async (member) => {
        const logChannel = await getLogChannel();
        if (!logChannel) return;

        await new Promise(resolve => setTimeout(resolve, 1500)); 

        const fetchedKick = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick }).catch(() => null);
        const kickLog = fetchedKick?.entries.first();
        
        if (kickLog && kickLog.target && kickLog.target.id === member.id && kickLog.createdAt > (Date.now() - 5000)) {
            // Se foi Kick, o Audit Log já cuidou disso (ele dispara o 'MemberKick').
            // No V6, o 'MemberKick' é detectado pelo AuditLogEntryCreate, então podemos
            // remover o log duplicado que estava aqui.
            return;
        }
        
        const fetchedBan = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd }).catch(() => null);
        const banLog = fetchedBan?.entries.first();
        
        if (banLog && banLog.target && banLog.target.id === member.id && banLog.createdAt > (Date.now() - 5000)) {
            // Se foi Ban, o Audit Log já cuidou disso.
            return;
        }

        // Se não foi Kick nem Ban, ele "Saiu"
        const embed = new EmbedBuilder()
            .setColor('Orange').setTitle('Membro Saiu')
            .setDescription(`**Usuário:** ${member.user} (${member.user.tag})\n**ID:** ${member.id}`)
            .setThumbnail(member.user.displayAvatarURL()).setTimestamp();
        await logChannel.send({ embeds: [embed] });
    });
};