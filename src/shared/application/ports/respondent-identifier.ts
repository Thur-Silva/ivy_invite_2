/**
 * Sinais crus coletados na borda HTTP sobre quem está respondendo.
 *
 * Nenhum deles chega ao domínio nesta forma. A porta os transforma em digests
 * opacos antes. Isso é deliberado: o convite precisa saber se **é o mesmo
 * aparelho**, não quem é a pessoa nem de onde ela acessa.
 */
export interface RespondentSignals {
  /** IP do cliente, como o proxy o reportou. */
  readonly networkAddress: string;
  /** `user-agent`: navegador, versão e sistema operacional. */
  readonly userAgent: string;
  /** `accept-language`: idiomas configurados. */
  readonly acceptLanguage: string;
  /**
   * Traços coletados no navegador (resolução, densidade, fuso, plataforma).
   * Vem vazio quando o JavaScript não roda. A assinatura degrada para os
   * cabeçalhos e o convite continua funcionando.
   */
  readonly clientTraits: string;
  /**
   * Token do cookie assinado, ou string vazia na primeira visita.
   * É o sinal mais forte: sobrevive a troca de rede e de operadora.
   */
  readonly sessionToken: string;
}

/** Os três digests que compõem a identidade de quem responde. */
export interface RespondentDigests {
  readonly token: string;
  readonly device: string;
  readonly network: string;
}

/**
 * Port. Transforma sinais de rede e de navegador em identificação opaca.
 *
 * Existe para que **nenhuma camada acima da infraestrutura toque em IP, user
 * agent ou token cru**. O caso de uso trabalha só com digests, e o domínio
 * sequer aceita outra coisa (ver `RespondentIdentity`).
 */
export interface RespondentIdentifier {
  identify(signals: RespondentSignals): RespondentDigests;
}
