# Retratos do elenco

Cada competidor do circuito tem um identificador de retrato (`portraitId`).
O jogo procura automaticamente por:

```text
public/assets/portraits/<portraitId>.webp
```

Exemplo: se o diretório de retratos mostra `naruto-uzumaki.webp`, coloque o
arquivo exatamente em:

```text
public/assets/portraits/naruto-uzumaki.webp
```

## Recomendação de arte

- Formato: WebP com fundo opaco ou transparente.
- Proporção: 1:1.
- Tamanho oficial: 1024 × 1024 px (o jogo reduz para a tabela quando necessário).
- Deixe rosto e ombros dentro da área central; os cartões recortam a imagem em círculo.
- Peso recomendado: até 250 KB por retrato. Consulte `../README.md` para o
  padrão de cenários, cenas, ícones e texturas.

Enquanto não existe arquivo, o jogo mostra as iniciais do personagem como
placeholder. O painel **Diretório de retratos deste elenco** lista a mesma
escala fixa em toda carreira. A única arte opcionalmente trocável é a do
protagonista:

```text
player-custom.webp
```

Substitua esse arquivo quando quiser trocar o retrato do seu personagem. Todo
o restante do elenco, incluindo o rival, possui nome e slot permanentes. A
lista completa está em `ROSTER.md`.
