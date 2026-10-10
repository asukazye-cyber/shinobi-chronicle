# Padrão visual de produção

Todos os assets visuais do jogo devem ser exportados em **WebP**. PNG só deve
ser usado quando a transparência precisa ser preservada durante a edição; a
versão usada no jogo continua sendo WebP. Não use uma imagem pequena esticada
para cumprir uma área maior.

## Resoluções oficiais

| Tipo | Resolução de entrega | Proporção | Pasta | Uso |
| --- | ---: | --- | --- | --- |
| Retrato de shinobi | 1024 × 1024 px | 1:1 | `portraits/` | tabela, rival, ficha e torneios |
| Cenário/local | 1920 × 1080 px | 16:9 | `backgrounds/` | vila, Academia, campo, arena e mapas narrativos |
| Cena de história/missão | 1920 × 1080 px | 16:9 | `scenes/` | ataques, resgates, confrontos e momentos de carreira |
| Arte de item/emblema | 512 × 512 px | 1:1 | `icons/` | itens, títulos, clãs e conquistas |
| Textura repetível | 512 × 512 px | 1:1 | `textures/` | papel, pedra, selo e painéis de interface |

Esses são tamanhos de **entrega ao jogo**, não limites para o arquivo-fonte.
Guarde o original em resolução maior fora de `public/assets` se quiser manter
uma versão de edição. Imagens 4K não devem entrar no repositório do jogo sem
uma necessidade real: deixam o carregamento pesado sem melhorar a maior parte
das telas.

## Enquadramento

- **Retratos:** rosto e ombros no centro. Mantenha olhos e rosto dentro da
  área central de 70%, pois o jogo pode recortar a imagem em círculo.
- **Fundos e cenas:** não coloque texto, rosto importante ou um objeto vital
  nas bordas. Reserve uma zona segura central de aproximadamente 80% da
  largura e 70% da altura; telas estreitas usam `cover` e recortam laterais.
- **Não escreva texto dentro da arte.** Diálogos, nomes e informações do jogo
  continuam em HTML para poderem ser lidos, traduzidos e adaptados ao tamanho
  da tela.

## Organização e nomes

Use letras minúsculas, hífens e nomes estáveis:

```text
portraits/naruto-uzumaki.webp
portraits/genin-184729-3.webp
backgrounds/hoshigakure-academy.webp
backgrounds/vale-das-pontes.webp
scenes/ataque-a-hoshigakure.webp
icons/titulo-guardiao-regional.webp
```

O nome do arquivo é a ligação com os dados do jogo. Não renomeie uma arte já
em uso sem trocar também o respectivo identificador no conteúdo.

## Peso recomendado

- Retrato: até 250 KB.
- Fundo ou cena: até 650 KB.
- Ícone ou textura: até 120 KB.

Uma imagem pode passar um pouco desses valores quando a arte realmente exigir,
mas o objetivo é que uma carreira inteira continue abrindo rapidamente, mesmo
com muitos personagens e cenários.
