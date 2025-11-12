/* ========================================================================
   HANDLER ATUALIZADO: commands/adm/logHandler.js (V6)
   
   - Este código corrige o crash 'Cannot read properties of null (reading 'id')'
     ao verificar 'kickLog.target' antes de usá-lo e
     movendo o listener 'GuildMemberRemove' para o final.
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

    // --- LOGS DE MENSAGEM (DELETADA, EDITADA, GHOST PING) ---
    client.on(Events.MessageDelete, async (message) => { /* ... (código de Ghost Ping) ... */ 
        if (!message.guild || message.author?.bot || message.mentions.users.size === 0) return;
        const logChannel = await getLogChannel();
        if (!logChannel) return;
        const mentionedUser = message.mentions.users.first();
        if (mentionedUser.id !== message.author.id) {
            const embed = new EmbedBuilder()
                .setColor('#9B59B6').setTitle('👻 Ghost Ping Detectado (Espelho)')
                .setDescription(`**Autor:** ${message.author} (${message.author.tag})\n**Mencionado:** ${mentionedUser} (${mentionedUser.tag})\n**Canal:** ${message.channel}`)
                .addFields({ name: 'Mensagem Deletada', value: `\`\`\`${message.content || '[N/A]'}\`\`\`` })
                .setThumbnail(message.author.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
    });
    client.on(Events.MessageUpdate, async (oldMessage, newMessage) => { /* ... (código de Edição) ... */ 
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
        try { await logChannel.send({ embeds: [embed] }); } catch (err) { console.error("Erro no log MessageUpdate:", err); }
    });
    
    // --- LOGS DE MEMBROS (ENTRADA, CARGOS, APELIDOS) ---
    client.on(Events.GuildMemberAdd, async (member) => { /* ... (código de Entrada) ... */ 
        const logChannel = await getLogChannel();
        if (!logChannel) return;
        const embed = new EmbedBuilder()
            .setColor('Green').setTitle('Membro Entrou')
            .setDescription(`**Usuário:** ${member.user} (${member.user.tag})\n**ID:** ${member.id}\n**Conta Criada em:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:f>`)
            .setThumbnail(member.user.displayAvatarURL()).setTimestamp();
        await logChannel.send({ embeds: [embed] });
    });
    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => { /* ... (código de Cargos/Apelidos) ... */ 
        const logChannel = await getLogChannel();
        if (!logChannel) return;
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
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => { /* ... (código de Voz) ... */ 
        const logChannel = await getLogChannel();
        if (!logChannel) return;
        const user = newState.member.user;
        if (!oldState.channel && newState.channel) {
            const embed = new EmbedBuilder()
                .setColor('Green').setTitle('Voz: Membro Entrou')
                .setDescription(`**Membro:** ${user} (${user.tag})\n**Canal:** ${newState.channel.name}`)
                .setThumbnail(user.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
        if (oldState.channel && !newState.channel) {
            const embed = new EmbedBuilder()
                .setColor('Orange').setTitle('Voz: Membro Saiu')
                .setDescription(`**Membro:** ${user} (${user.tag})\n**Canal:** ${oldState.channel.name}`)
                .setThumbnail(user.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
        if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            const fetchedLogs = await newState.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberMove }).catch(() => null);
            const moveLog = fetchedLogs?.entries.first();
            let embed;
            if (moveLog && moveLog.target.id === user.id && moveLog.createdAt > (Date.now() - 5000)) {
                embed = new EmbedBuilder()
                    .setColor('DarkBlue').setTitle('Voz: Membro Foi Movido')
                    .setDescription(`**Membro:** ${user} (${user.tag})\n**Movido por:** ${moveLog.executor}`)
                    .addFields(
                        { name: 'Saiu de', value: `${oldState.channel.name}` },
                        { name: 'Entrou em', value: `${newState.channel.name}` }
                    )
                    .setThumbnail(user.displayAvatarURL()).setTimestamp();
            } else {
                embed = new EmbedBuilder()
                    .setColor('Blue').setTitle('Voz: Membro Trocou de Canal')
                    .setDescription(`**Membro:** ${user} (${user.tag})`)
                    .addFields(
                        { name: 'Saiu de', value: `${oldState.channel.name}` },
                        { name: 'Entrou em', value: `${newState.channel.name}` }
                    )
                    .setThumbnail(user.displayAvatarURL()).set