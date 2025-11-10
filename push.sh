#!/bin/bash
# Este é um script de atalho para enviar suas mudanças ao GitHub.

# 1. Checa se você escreveu uma mensagem de commit
if [ -z "$1" ]; then
  echo "❌ ERRO: Você esqueceu de escrever a mensagem do commit!"
  echo "Uso correto: ./push.sh \"Sua mensagem de commit aqui\""
  exit 1
fi

# 2. Roda o 'git add'
echo "Adicionando todos os arquivos..."
git add .

# 3. Roda o 'git commit' com a mensagem que você passou ($1)
echo "Criando o commit com a mensagem: $1"
git commit -m "$1"

# 4. Roda o 'git push'
echo "Enviando para o GitHub (origin main)..."
git push origin main

echo "✅ Sincronização concluída!"