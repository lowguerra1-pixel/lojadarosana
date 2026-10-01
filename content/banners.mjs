// Banners promocionais do carrossel (home e página de materiais).
// A ordem aqui é a ordem em que passam. Para tirar um banner, apague o bloco; para pausar, use ativo: false.
// produto: slug de content/produtos.mjs → puxa imagem, preço e link automaticamente.
// href/imagem/preco: use quando o banner não for de um produto (ex.: newsletter, cupom, lançamento).
export default [
  {
    ativo: true,
    produto: 'nervo-vago',
    selo: 'Mais vendido',
    titulo: '+120 ferramentas para regular o sistema nervoso',
    texto: 'Cartas, guias e protocolos somáticos baseados na Teoria Polivagal — prontos para a próxima sessão.',
    cta: 'Quero o kit',
    cor: 'teal',
  },
  {
    ativo: true,
    produto: 'baralho-constelacao-familiar',
    selo: '250 cartas + 5 bônus',
    titulo: 'Constele em sessão individual, sem grupo e sem bonecos',
    texto: 'O Baralho da Constelação Familiar com Manual do Campo, 7 tiragens prontas e protocolo para terapeutas.',
    cta: 'Conhecer o baralho',
    cor: 'sol',
  },
  {
    ativo: true,
    produto: 'arteterapia-junguiana',
    selo: 'Novidade',
    titulo: 'Arteterapia junguiana para quem “não sabe desenhar”',
    texto: 'Mandalas, colagens, sombra e arquétipos: +120 atividades com passo a passo e leitura simbólica.',
    cta: 'Ver as atividades',
    cor: 'roxo',
  },
  {
    ativo: true,
    produto: 'radiestesia-cigana',
    selo: 'Linha cigana',
    titulo: 'Pêndulo, baralho e mesa radiônica num só método',
    texto: 'Gráficos, fichas e protocolo prontos para imprimir — e atender com estrutura, sem improviso.',
    cta: 'Conhecer o kit',
    cor: 'coral',
  },
  {
    ativo: true,
    selo: 'Grátis',
    titulo: 'Uma prática terapêutica por semana no seu e-mail',
    texto: 'Assine as Cartas da Oficina e receba exercícios prontos, leituras da Dra. Rô e avisos de promoções em primeira mão.',
    cta: 'Quero receber',
    href: '#newsletter',
    cor: 'roxo',
  },
];
