// Configuração central da loja. Trocar o nome aqui troca no site inteiro.
export default {
  nomeLoja: 'Ateliê da Dra. Rô',
  nomeCurto: 'Ateliê Dra. Rô',
  assinatura: 'Loja oficial da Oficina da Dra. Rô',
  slogan: 'Ferramentas terapêuticas prontas para a sua prática',
  especialista: 'Rosana Neves',
  especialistaTitulo: 'Psicóloga, especialista em Desenvolvimento Emocional',
  urlSite: 'https://loja.oficinadarosana.site', // TODO: confirmar domínio final
  urlApp: 'https://app.oficinadarosana.site',

  // Suporte — quanto mais fácil de achar, menos reembolso
  // TODO: confirmar e-mail de suporte real
  emailSuporte: 'suporte@oficinadarosana.site',
  whatsapp: '5511943121641',
  whatsappExibicao: '(11) 94312-1641',
  horarioSuporte: 'Segunda a sexta, das 9h às 18h',
  prazoResposta: 'até 24h úteis',
  instagram: '', // TODO: @ do Instagram (opcional)

  // Números institucionais (os mesmos usados na PV do Nervo Vago)
  numeros: [
    { valor: '15+', rotulo: 'anos de experiência clínica' },
    { valor: '3.000+', rotulo: 'pessoas impactadas' },
    { valor: '200+', rotulo: 'workshops e treinamentos' },
  ],

  cnpj: '', // TODO: CNPJ / razão social para o rodapé (aumenta a confiança)

  // Rastreamento (vale para a loja inteira e para o link da bio)
  rastreio: {
    // Pixel UTMify "PIXEL - PSI - WORLDWIDE PT" (dashboard DOL - CA1) → Meta pixel 1688358042399531.
    // A UTMify dispara PageView no site e InitiateCheckout/Purchase pelo postback da Lastlink.
    utmifyPixelId: '6a382bcdb7aca0979295f565',
    // Script de UTMs da UTMify: guarda as UTMs e repassa para os links de checkout.
    utmifyUtms: true,
  },

  // UTMs fixas dos botões do link da bio (para separar as vendas vindas do Instagram)
  utmBio: { utm_source: 'instagram', utm_medium: 'bio', utm_campaign: 'link-da-bio' },
};
