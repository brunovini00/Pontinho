# Pontinho — Placar da Mesa

Placar mobile-first para partidas do jogo de baralho Pontinho.

**[Abrir o placar no GitHub Pages](https://brunovini00.github.io/Pontinho/)**

## Recursos

- Cadastro de 2 a 10 jogadores, todos iniciando com 100 pontos
- Registro do vencedor e dos pontos perdidos em cada rodada
- Eliminação automática ao chegar a zero
- Histórico completo com opção de desfazer a última rodada
- Identificação do líder e do campeão da partida
- Salvamento automático da partida no navegador
- Interface responsiva em tema dark

## Executar localmente

Requer Node.js 22 ou superior e pnpm.

```bash
pnpm install
pnpm dev
```

Acesse `http://localhost:3000`.

## Publicar no GitHub Pages

```bash
pnpm build:pages
pnpm test
```

O GitHub Pages serve a raiz da branch `main`. Inclua os arquivos gerados em
`web/` no mesmo commit das alterações do app. O `index.html` abre o placar
diretamente no endereço do repositório.

As regras e o armazenamento ficam em `app/game.ts`. Cadastro, placar e
registro de rodada têm componentes próprios em `app/`. As partidas são
salvas no navegador de cada dispositivo.
