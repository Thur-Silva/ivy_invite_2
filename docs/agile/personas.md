# Personas

Três personas, porque três comportamentos distintos mudam decisões de código. Se
uma quarta não mudar nenhuma decisão, ela não entra aqui.

---

## 1. Tia Cida. 58 anos, a convidada majoritária

**Contexto:** recebe o link no grupo da família no WhatsApp. Abre no navegador
interno do WhatsApp, com uma mão, no ônibus. Android intermediário de 3 anos,
4G oscilante, fonte do sistema aumentada.

**Objetivo:** entender de quem é a festa, quando, onde, e dizer que vai.

**Frustrações:** letra pequena; formulário que pede e-mail; site que "fica
girando"; botão que não acerta com o dedo; página que dá zoom sozinha e ela não
consegue voltar.

**Decisões de arquitetura que ela causou:**

- alvos de toque ≥ 52px e coluna única `max-w-md`
- formulário com **um** campo (nome). [ADR-0009](../architecture/adr/0009-chave-natural-do-convidado.md)
- `maximumScale: 5` (pinch-zoom nunca bloqueado)
- `<form>` real com Server Action: grava mesmo se o JS não carregar. [ADR-0004](../architecture/adr/0004-server-actions-como-adapter-de-entrada.md)
- fontes com `display: swap` e página estática, para o texto aparecer antes de tudo

---

## 2. Rafa. 31 anos, primo antenado

**Contexto:** iPhone recente, 5G. Abre, rola a página inteira, aprecia a
animação, tira print do card de data e manda para a namorada.

**Objetivo:** confirmar rápido e achar o convite bonito o suficiente para
comentar.

**Frustrações:** convite em JPG pixelado; animação travada; "abrir no mapa" que
cai no navegador em vez do app.

**Decisões que ele causou:**

- cena WebGL do lago (nível 3 da degradação). [ADR-0005](../architecture/adr/0005-stack-de-graficos-e-animacao.md)
- selo real com mola + confete ao confirmar
- card de data desenhado para ser printado
- deep link `dir/?api=1` e Waze, que abrem o app nativo. [ADR-0006](../architecture/adr/0006-google-maps-sem-api-key.md)

---

## 3. Marina. 34 anos, mãe da Ivy (anfitriã / Product Owner)

**Contexto:** organizando a festa entre trabalho e uma criança de 2 anos.
Não programa. Precisa fechar o número com o buffet uma semana antes.

**Objetivo:** saber **quantas** pessoas vêm e **quem** ainda não respondeu, sem
depender de ninguém.

**Frustrações:** contar mensagens no grupo; lista com nome duplicado; descobrir
no dia que o endereço no convite estava errado.

**Decisões que ela causou:**

- `UNIQUE(guest_key)` + upsert: a lista nunca duplica
- `celebration.config.ts` como arquivo único, comentado em português, com
  instruções de como pegar coordenadas. [ADR-0007](../architecture/adr/0007-dados-da-festa-em-arquivo-de-configuracao.md)
- testes que quebram o build se a config estiver inválida
- eventos de domínio no log da Vercel: trilha auditável de quem respondeu quando
- PBI-05 (painel do anfitrião) priorizado logo após o convite ir ao ar

---

## Persona antagonista: o robô de spam

Não é usuário, mas é ator. Descobre a URL e envia 5.000 respostas.

**Estado atual:** `GuestName` já barra dígitos, emoji e URL, o que elimina spam
automatizado ingênuo. Não há rate limiting. Risco aceito no Sprint 1 porque o
link circula em grupos privados (premissa P1/P2 da
[visão](./product-vision.md#riscos-e-premissas)) e registrado como **PBI-11**.
