# ADR-0006. Google Maps sem API key (embed + deep links)

- **Status:** aceito
- **Data:** 2026-08-11

## Contexto

O requisito é "localização via Google Maps". O caminho oficial (Maps JavaScript
API ou Maps Embed API) exige API key, conta de faturamento ativa e restrição de
referrer. Para um site que ficará no ar três semanas e será aberto por umas 50
pessoas.

Uma key exposta no cliente sem restrição correta é um risco de cobrança real. E
o SDK JS coloca ~100KB no caminho crítico de uma página que tem uma tarefa:
receber a confirmação.

Observação de comportamento: no celular, quase ninguém interage com o mapa
embutido. A pessoa toca em "abrir no mapa" e sai para o app nativo.

## Decisão

Nenhuma API key. O adapter `GoogleMapsLinkProvider` (Anti-Corruption Layer do
contexto Celebration) monta três URLs públicas e documentadas:

| Uso             | URL                                                                               |
| --------------- | --------------------------------------------------------------------------------- |
| Prévia embutida | `https://www.google.com/maps?q=<nome+endereço>&z=16&output=embed`                 |
| Navegação       | `https://www.google.com/maps/dir/?api=1&destination=<lat,lng>&travelmode=driving` |
| Waze            | `https://waze.com/ul?ll=<lat,lng>&navigate=yes`                                   |

Detalhes que importam:

- o **embed busca por nome + endereço**, para o pin exibir o rótulo do local em
  vez de um ponto anônimo;
- a **navegação usa coordenadas**, para a rota terminar no portão e não onde o
  geocoder achar que fica o endereço;
- o `<iframe>` é `loading="lazy"` e fica no fim da página. Não custa nada até o
  convidado chegar lá;
- Waze aparece ao lado do Google Maps porque é o que a maioria dos motoristas
  brasileiros usa de fato.

## Consequências

**Boas:** nenhuma key para vazar, nenhuma conta de faturamento, nenhum SDK no
caminho crítico, custo zero; trocar de provedor de mapa é reescrever um arquivo
de 25 linhas.

**Ruins:**

- URLs "não versionadas": o `output=embed` é estável há anos, mas não tem SLA. Se
  o Google mudar, o mapa quebra. Mitigado por os dois botões de navegação, que
  usam endpoints oficialmente documentados, serem o caminho principal;
- sem controle de estilo do mapa (não combina com a paleta do lago);
- sem marcador customizado nem interação programável;
- o iframe faz o convidado carregar recursos do Google (cookies de terceiro).
  Aceito num convite privado; `referrerPolicy="no-referrer-when-downgrade"`
  limita o vazamento de referrer.

## Alternativas consideradas

| Alternativa                                       | Por que não                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Maps Embed API com key                            | Precisa de faturamento e restrição de referrer para uma prévia estática.                              |
| Maps JavaScript API (`@vis.gl/react-google-maps`) | Mesmo problema, mais ~100KB de JS numa página mobile.                                                 |
| OpenStreetMap / Leaflet                           | Sem key e estilizável, mas o pedido dizia Google Maps, e o convidado reconhece a interface do Google. |
| Imagem estática do mapa + só botões               | Ainda exige key (Static Maps API) para gerar a imagem.                                                |
| Só endereço em texto                              | Elimina o mapa e transfere trabalho para o convidado.                                                 |
