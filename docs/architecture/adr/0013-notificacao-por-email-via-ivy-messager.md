# ADR-0013. Notificação por e-mail via Ivy Messager

- **Status:** aceito
- **Data:** 2026-08-12

## Contexto

Duas lacunas conhecidas desde o Sprint 1. O convidado confirmava presença e não
levava nada consigo: fechada a aba, sobrava a memória. E os anfitriões só
descobriam quem respondeu abrindo `db:studio`, o que na prática significa não
descobrir.

O time já opera um serviço de mensageria hospedado (Ivy Messager) que envia
e-mail por HTTP, sem que cada aplicação carregue credencial de SMTP. A decisão não
é "como enviar e-mail", é "como consumir isto sem contaminar o domínio".

## Decisão

Assinar os eventos de domínio que já existiam. `DomainEventPublisher` foi criado
no Sprint 1 exatamente para isto, e o comentário da porta previa "um assinante de
notificação sem tocar no caso de uso". Foi o que aconteceu: `SubmitRsvp` não sabe
que e-mail existe.

| Peça                            | Camada              | Papel                                                  |
| ------------------------------- | ------------------- | ------------------------------------------------------ |
| `EmailSender`                   | application (porta) | `send(message): Result<Receipt, Failure>`. Nunca lança |
| `IvyMessagerEmailSender`        | infrastructure      | ACL sobre o serviço: HTTP, autenticação, retentativa   |
| `EmailNotifyingEventPublisher`  | infrastructure      | Traduz evento em mensagem e decide destinatários       |
| `CompositeDomainEventPublisher` | infrastructure      | Log de auditoria **e** e-mail assinam juntos           |
| `DeferredDomainEventPublisher`  | infrastructure      | `after()` do Next: envia depois da resposta            |

Seis escolhas que sustentam o resto:

**1. O e-mail não repete data, endereço nem traje.** Instinto óbvio, e armadilha.
E-mail é retrato: se o local mudar, a caixa de entrada guarda a versão velha para
sempre e o convidado confia nela. O corpo confirma o **fato** e aponta para o
convite, que é a fonte da verdade. De brinde, mantém o contexto RSVP sem importar
o Celebration, preservando a relação Separate Ways do Context Map.

**2. Envio depois da resposta.** `SubmitRsvp` dá `await` no `publish`. Sem adiar, o
convidado veria "Enviando…" enquanto uma requisição HTTP sai com retentativa e
backoff. `after()` roda a tarefa após a resposta, na mesma invocação. O
`next/server` fica confinado a um decorador de 40 linhas, então os assinantes
seguem testáveis sem simular requisição.

**3. Idempotência derivada do fato.** `rsvp-<id>-<fato>-<destino>`. Um timeout de
rede não diz se o e-mail saiu; retentar às cegas duplica. Com a chave repetida em
toda tentativa, o serviço responde `replayed: true` e nada novo sai.

**4. `422` e `502` são coisas diferentes.** O serviço devolve `DISPATCH_FAILED`
nos dois. `422` é "este dado não é entregável", `502` é "tente de novo". Tratar
igual é o erro que mais custa tempo nessa integração, e é por isso que a falha
carrega `kind: 'PERMANENT' | 'TRANSIENT'` em vez de só um código.

**5. Sem token, o convite continua funcionando.** Notificação é melhoria, não
requisito para alguém confirmar presença. Faltando `IVY_MESSAGER_TOKEN`, o
assinante de e-mail simplesmente não entra na composição.

**6. Dois destinatários, dois conteúdos opostos.** O convidado recebe um recibo
**sem uma linha de regra**: nem contagem, nem lista, nem instrução de uso. Ele já
viu a confirmação na tela, e mostrar a lista dos outros seria vazar dado de
terceiro para quem não pediu. O admin recebe o contrário: nome de quem respondeu,
totais, gráfico e lista completa, porque é quem fecha número com fornecedor.

Esse relatório precisa do **estado atual**, que o evento não carrega, e nem
deveria: evento é fato pontual, não fotografia do banco. Por isso o publisher
consulta `GetGuestRoster`, um caso de uso de leitura, uma vez por lote. É a única
consulta de estado neste caminho, e ela vive do lado de fora do domínio.

Quando os dois papéis caem na mesma caixa de entrada, o recibo é suprimido e sai
só o relatório. Uma resposta, um e-mail por endereço: o relatório é superconjunto
do recibo, então a segunda mensagem só teria valor de incômodo.

## Consequências

**Boas:** o caso de uso não mudou uma linha; trocar de provedor de e-mail é
reescrever um adapter; 30 testes cobrem a política de retentativa e o fan-out sem
tocar a rede; o log de auditoria continuou existindo em paralelo.

**Ruins, e assumidas:**

- **`after()` não garante entrega.** Roda dentro da invocação; se a função
  serverless for encerrada antes, o e-mail se perde. É o motivo de o teto por
  tentativa ser 8s em vez dos 30s que o serviço permite: melhor falhar rápido com
  rastro no log que estourar o tempo da função no meio de um backoff. Fila de
  verdade resolveria, e é desproporcional para dezenas de convidados.
- **Idempotência é por instância do serviço, dentro de 15 minutos.** Limitação
  documentada por quem o opera. Sob escalonamento horizontal, um retry pode cair
  em outra instância e reenviar.
- **Mudança de ideia dentro da janela não gera segundo aviso.** Confirmar, recusar
  e confirmar de novo em 15 minutos reusa a chave e o e-mail não sai. Estado final
  na tela e no banco está correto; o convidado só não recebe o terceiro aviso.
  Preferimos isso a arriscar duplicata.
- **O evento passou a carregar o e-mail da conta.** Assinante precisa saber para
  quem escrever, e voltar ao repositório transformaria "reagir a um fato" em
  "consultar estado". Como o payload virou dado pessoal,
  `ConsoleDomainEventPublisher` mascara (`ma***@gmail.com`) antes de logar.
- **O relatório é uma leitura a mais por resposta.** Uma consulta por lote de
  eventos, fora do caminho crítico (roda no `after()`). Se ela falhar, o
  relatório sai sem o gráfico e sem a lista, em vez de não sair: saber que alguém
  respondeu vale mais que o gráfico.
- **A lista completa vai para a caixa de entrada do admin.** É dado pessoal de
  todos os convidados replicado a cada resposta. Aceito porque o admin já tem
  acesso a essa lista por direito, e porque `RSVP_ADMIN_EMAILS` é a única coisa
  que define quem recebe. Configurar essa variável errado vaza a lista.
- **Nada de imagem no gráfico.** Barra empilhada é `<td>` com largura
  percentual. O custo é não ter gráfico de verdade (linha, pizza, eixo); o
  ganho é renderizar igual em Gmail, Apple Mail e Outlook, sem serviço externo
  gerando PNG e sem bloqueio de imagem remota.
- **Teto do Gmail: ~500 destinatários/dia.** Irrelevante para esta festa, fatal
  para um disparo em massa. Registrado porque a doc do serviço pede que se fale
  com quem o opera **antes** de o volume chegar.

## Alternativas consideradas

| Alternativa                             | Por que não                                                                                                           |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Resend, SendGrid, SES direto            | Mais uma conta, mais uma credencial, mais um domínio a verificar. Já existe serviço nosso que faz exatamente isto.    |
| SMTP do Gmail direto no convite         | Coloca credencial de SMTP na aplicação, que é o problema que o serviço de mensageria existe para resolver.            |
| Enviar dentro do `SubmitRsvp`           | Regra de negócio passaria a conhecer HTML e SMTP, e a latência do e-mail entraria no tempo de resposta do formulário. |
| Fila (QStash, SQS) entre RSVP e envio   | Entrega garantida de verdade, ao custo de mais um serviço e mais um segredo, para um volume de dezenas de mensagens.  |
| Repetir data e local no corpo do e-mail | Cria uma segunda fonte de verdade que envelhece na caixa de entrada de cada convidado.                                |
| Gráfico como imagem (PNG de um serviço) | Depende de terceiro no ar, e cliente de e-mail bloqueia imagem remota por padrão: o gráfico chegaria como retângulo vazio. |
| Mandar o mesmo e-mail para os dois      | Ou o convidado recebe a lista dos outros, ou o admin não recebe número nenhum. Os dois públicos querem coisas opostas. |
| Um resumo diário em vez de a cada resposta | Menos e-mail, mas o admin passa a saber com atraso justo quando responder rápido importa. Cabe se o volume crescer. |
