// Gerador estático da loja. Uso: `node build.mjs` → gera a pasta site/ (pronta pro Netlify).
// Conteúdo editável em content/: config.mjs (nome, suporte), produtos.mjs (PVs), posts.mjs (blog).
import { mkdir, writeFile, rm, cp } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = dirname(fileURLToPath(import.meta.url));
const SAIDA = join(RAIZ, 'site');
const v = Date.now().toString(36);

const cfg = (await import('./content/config.mjs?' + v)).default;
const produtos = (await import('./content/produtos.mjs?' + v)).default;
const banners = (await import('./content/banners.mjs?' + v)).default.filter((b) => b.ativo !== false);
const posts = (await import('./content/posts.mjs?' + v)).default
  .slice()
  .sort((a, b) => b.data.localeCompare(a.data));

// ---------------------------------------------------------------- utilidades
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const semTags = (s = '') => String(s).replace(/<[^>]+>/g, '');
const brl = (n) => 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
const brlCheio = (n) => 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
const dataBR = (d) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
const wa = (msg) => `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}`;
const produtoPorSlug = Object.fromEntries(produtos.map((p) => [p.slug, p]));
const catsBlog = [...new Set(posts.map((p) => p.categoria))];
const catsProd = [...new Set(produtos.map((p) => p.categoria))];

const nomeMarca = cfg.nomeLoja;
const idx = nomeMarca.indexOf('Dra. Rô');
const marcaPre = idx > 0 ? nomeMarca.slice(0, idx).trim() : '';

// ---------------------------------------------------------------- ícones
const I = {
  raio: '<path d="M13 2 4.5 13.5H12L11 22l8.5-11.5H12L13 2Z"/>',
  escudo: '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.3A8.4 8.4 0 1 1 21 11.5Z"/>',
  cadeado: '<rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  email: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  livro: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/>',
  infinito: '<path d="M18.2 8.4a4 4 0 1 1 0 7.2c-2.4-1-4-3.6-6.2-3.6s-3.8 2.6-6.2 3.6a4 4 0 1 1 0-7.2C8.2 9.4 9.8 12 12 12s3.8-2.6 6.2-3.6Z"/>',
  impressora: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  presente: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9"/><path d="M12 8S10.5 3 8 3.5 7 8 12 8Zm0 0s1.5-5 4-4.5S17 8 12 8Z"/>',
  arquivo: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  pergunta: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17.2v.3"/>',
  estrela: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8L12 3Z"/>',
};
const ic = (nome, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${I[nome]}</svg>`;
const WA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.17-1.24-6.16-3.48-8.4"/></svg>';

// respingo da logo (coral, teal, sol)
const respingo = (cls = 'marca-respingo') => `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true">
  <path d="M14 8c6-2 11 4 9 11-1 4-4 8-6 12-3-4-7-8-8-13-1-5 1-9 5-10Z" fill="#F2866B"/>
  <path d="M40 2c7 1 10 8 7 15-3 6-10 11-14 18-1-8 0-17 2-24 1-5 2-9 5-9Z" fill="#17A39A"/>
  <path d="M34 40c6-7 16-11 24-9 4 1 5 5 2 8-5 4-14 3-26 1Z" fill="#F6BE3A"/>
  <path d="M42 50c5-2 11-1 14 2-5 2-10 2-14-2Z" fill="#17A39A"/>
  <circle cx="54" cy="12" r="4" fill="#F6BE3A"/>
</svg>`;

const wordmark = (r, extra = '') => `<a class="marca ${extra}" href="${r}" aria-label="${esc(nomeMarca)} — início">
  ${marcaPre ? `<span class="marca-pre">${esc(marcaPre)}</span>` : ''}
  <span class="marca-nome"><span class="c1">Dra.</span> <span class="c2">Rô</span></span>
  <span class="marca-sub">${esc(cfg.assinatura)}</span>
  ${respingo()}
</a>`;

// ---------------------------------------------------------------- blocos
const capaTipo = (p) => `<div class="capa-tipo capa-${p.cor}">
  ${respingo('deco')}
  <span class="t">${esc(p.nomeCurto)}</span>
  <span class="s">${esc(p.categoria)}</span>
</div>`;
const capa = (p, r) => p.imagemCapa ? `<img src="${r}${p.imagemCapa}" alt="${esc(p.nome)}" loading="lazy">` : capaTipo(p);

const linkCompra = (p) => p.checkout || wa(`Olá! Quero garantir o ${p.nome}.`);
const btnCompra = (p, texto = 'Quero o kit completo', cls = '') =>
  `<a class="btn btn-compra ${cls}" href="${esc(linkCompra(p))}" ${p.checkout ? 'data-checkout' : 'target="_blank" rel="noopener"'}>${esc(texto)} ${ic('seta')}</a>`;

const cardProduto = (p, r) => `<a class="card-produto revelar" href="${r}produtos/${p.slug}/" data-cat="${esc(p.categoria)}">
  <div class="capa">${capa(p, r)}${p.selo ? `<span class="selo-card">${esc(p.selo)}</span>` : ''}</div>
  <div class="corpo">
    <span class="chip chip-${p.cor}">${esc(p.categoria)}</span>
    <h3>${esc(p.nome)}</h3>
    <p>${esc(p.resumo)}</p>
    <div class="rodape-card">
      <div class="preco-card">${p.precoDe ? `<small>${brl(p.precoDe)}</small>` : ''}<strong>${brl(p.preco)}</strong><span>ou ${esc(p.parcelas)}</span></div>
      <span class="ver">Conhecer ${ic('seta')}</span>
    </div>
  </div>
</a>`;

const cardPost = (post, r) => `<a class="card-post revelar" href="${r}blog/${post.slug}/" data-cat="${esc(post.categoria)}">
  <div class="faixa-cor bg-${post.cor}"></div>
  <div class="corpo">
    <span class="chip chip-${post.cor}">${esc(post.categoria)}</span>
    <h3>${esc(post.titulo)}</h3>
    <p>${esc(post.resumo)}</p>
    <div class="meta"><span>${dataBR(post.data)}</span><span>·</span><span>${esc(post.leitura)} de leitura</span></div>
  </div>
</a>`;

// carrossel de banners promocionais (content/banners.mjs)
const carrossel = (r) => {
  if (!banners.length) return '';
  const slides = banners.map((b, i) => {
    const p = b.produto ? produtoPorSlug[b.produto] : null;
    const href = b.href ? (b.href.startsWith('#') || b.href.startsWith('http') ? (b.href.startsWith('#') ? r + b.href : b.href) : r + b.href) : p ? `${r}produtos/${p.slug}/` : r;
    const imagem = b.imagem || p?.imagemCapa || '';
    const preco = b.preco ?? p?.preco;
    const precoDe = b.precoDe ?? p?.precoDe;
    const midia = imagem
      ? `<img src="${r}${imagem}" alt="" ${i ? 'loading="lazy"' : ''}>`
      : p ? capaTipo(p) : `<div class="capa-tipo capa-${b.cor}">${respingo('deco')}<span class="t">Cartas da Oficina</span><span class="s">Newsletter semanal</span></div>`;
    return `<a class="slide slide-${b.cor}" href="${esc(href)}" role="group" aria-roledescription="banner" aria-label="${i + 1} de ${banners.length}">
      <div class="slide-texto">
        ${b.selo ? `<span class="slide-selo">${esc(b.selo)}</span>` : ''}
        <h2 class="display">${esc(b.titulo)}</h2>
        <p>${esc(b.texto)}</p>
        <div class="slide-rodape">
          <span class="btn slide-btn">${esc(b.cta)} ${ic('seta')}</span>
          ${preco ? `<span class="slide-preco">${precoDe ? `<s>${brl(precoDe)}</s>` : ''}<strong>${brl(preco)}</strong></span>` : ''}
        </div>
      </div>
      <div class="slide-midia">${midia}</div>
    </a>`;
  }).join('');
  return `<section class="vitrine" aria-label="Promoções">
  <div class="container">
    <div class="carrossel" data-intervalo="6000">
      <div class="trilho">${slides}</div>
      <button class="carrossel-seta ant" type="button" aria-label="Banner anterior"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button>
      <button class="carrossel-seta prox" type="button" aria-label="Próximo banner"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>
      <div class="carrossel-pontos">${banners.map((_, i) => `<button type="button" aria-label="Ir para o banner ${i + 1}"${i ? '' : ' aria-current="true"'}></button>`).join('')}</div>
    </div>
  </div>
</section>`;
};

const faqHtml = (itens) => `<div class="faq">${itens.map((f) => `<details>
  <summary>${esc(f.p)}</summary>
  <div class="resposta"><p>${f.r}</p></div>
</details>`).join('')}</div>`;

const blocoNewsletter = (r) => `<section class="secao-sm" id="newsletter">
  <div class="container">
    <div class="news revelar">
      <div>
        <span class="eyebrow">Newsletter</span>
        <h2 class="display">Cartas da Oficina</h2>
        <p>Uma vez por semana, uma prática terapêutica pronta pra usar, leituras selecionadas pela Dra. Rô e avisos de materiais novos. Sem spam — sai quando quiser.</p>
      </div>
      <form class="form-news" name="newsletter" method="POST" action="${r}obrigado/" data-netlify="true" netlify-honeypot="bot-field">
        <input type="hidden" name="form-name" value="newsletter">
        <p class="sr-only"><label>Não preencha: <input name="bot-field"></label></p>
        <label class="sr-only" for="news-nome">Seu nome</label>
        <input class="campo" id="news-nome" name="nome" placeholder="Seu primeiro nome" autocomplete="given-name" required>
        <div class="linha">
          <label class="sr-only" for="news-email">Seu e-mail</label>
          <input class="campo" id="news-email" type="email" name="email" placeholder="Seu melhor e-mail" autocomplete="email" required>
          <button class="btn" type="submit">Quero receber</button>
        </div>
        <small>Seus dados ficam seguros com a gente. Leia a <a href="${r}politicas/#privacidade" style="color:#fff">política de privacidade</a>.</small>
      </form>
    </div>
  </div>
</section>`;

const blocoSuporte = (r, titulo = 'Suporte humano, de verdade') => `<section class="secao secao-creme2" id="suporte">
  <div class="container">
    <div class="section-head center">
      <span class="eyebrow">Atendimento</span>
      <h2 class="section-title display">${titulo}</h2>
      <p class="lead">Comprou e não achou o acesso? Ficou com dúvida antes de comprar? Uma pessoa da nossa equipe responde você — ${esc(cfg.prazoResposta)}.</p>
    </div>
    <div class="suporte-grade">
      <div class="suporte-card revelar">
        <div class="ic ic-teal">${ic('chat')}</div>
        <h3>WhatsApp</h3>
        <p>O caminho mais rápido para qualquer dúvida sobre acesso, pagamento ou uso dos materiais.</p>
        <a class="link" href="${wa('Olá! Preciso de ajuda com um material do ' + nomeMarca + '.')}" target="_blank" rel="noopener">${esc(cfg.whatsappExibicao)} →</a>
      </div>
      <div class="suporte-card revelar">
        <div class="ic ic-roxo">${ic('email')}</div>
        <h3>E-mail</h3>
        <p>Prefere escrever? Mande o e-mail usado na compra que a gente localiza seu pedido.</p>
        <a class="link" href="mailto:${cfg.emailSuporte}">${esc(cfg.emailSuporte)} →</a>
      </div>
      <div class="suporte-card revelar">
        <div class="ic ic-sol">${ic('pergunta')}</div>
        <h3>Central de ajuda</h3>
        <p>Onde está meu acesso, como baixar, como imprimir, garantia e reembolso — tudo explicado.</p>
        <a class="link" href="${r}suporte/">Abrir a central →</a>
      </div>
    </div>
  </div>
</section>`;

// ---------------------------------------------------------------- layout
const FONTES = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,400..800,0..100,0..1;1,9..144,400..700,0..100,0..1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';

function layout({ r, caminho, titulo, descricao, corpo, ativo = '', imagem = '', jsonld = null, bodyClass = '' }) {
  const url = cfg.urlSite.replace(/\/$/, '') + '/' + caminho;
  const og = imagem ? cfg.urlSite.replace(/\/$/, '') + '/' + imagem : '';
  const nav = [
    ['produtos/', 'Materiais', 'produtos'],
    ['blog/', 'Blog', 'blog'],
    ['sobre/', 'A Dra. Rô', 'sobre'],
    ['suporte/', 'Suporte', 'suporte'],
  ];
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#5B4A9E">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(nomeMarca)}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${url}">
${og ? `<meta property="og:image" content="${og}">\n<meta name="twitter:card" content="summary_large_image">` : ''}
<link rel="icon" href="${r}assets/img/marca/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTES}">
<link rel="stylesheet" href="${r}assets/css/style.css?v=${v}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body class="${bodyClass}">
<a class="sr-only" href="#conteudo">Pular para o conteúdo</a>
<div class="avisos"><div class="container">
  <span>${ic('raio')} Acesso imediato no seu e-mail</span>
  <span>${ic('escudo')} Garantia incondicional em todos os materiais</span>
  <span>${ic('chat')} Suporte humano pelo WhatsApp</span>
</div></div>
<header class="topo">
  <div class="container">
    ${wordmark(r)}
    <nav aria-label="Principal">
      <ul class="menu">
        ${nav.map(([h, t, k]) => `<li><a href="${r}${h}"${ativo === k ? ' aria-current="page"' : ''}>${t}</a></li>`).join('')}
      </ul>
    </nav>
    <div class="topo-acoes">
      <a class="btn btn-contorno btn-suporte-topo" href="${wa('Olá! Tenho uma dúvida sobre os materiais.')}" target="_blank" rel="noopener">Falar com a equipe</a>
      <button class="menu-toggle" aria-label="Abrir menu" aria-expanded="false">${ic('menu')}</button>
    </div>
  </div>
</header>
<main id="conteudo">
${corpo}
</main>
<footer class="rodape">
  <div class="container">
    <div class="rodape-grade">
      <div>
        ${wordmark(r, 'clara')}
        <p style="margin-top:18px;max-width:320px">${esc(cfg.slogan)}. Materiais criados e curados pela ${esc(cfg.especialista)}, ${esc(cfg.especialistaTitulo.toLowerCase())}.</p>
      </div>
      <div>
        <h4>Materiais</h4>
        <ul>${produtos.map((p) => `<li><a href="${r}produtos/${p.slug}/">${esc(p.nomeCurto)}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h4>Institucional</h4>
        <ul>
          <li><a href="${r}sobre/">Sobre a Dra. Rô</a></li>
          <li><a href="${r}blog/">Blog</a></li>
          <li><a href="${r}#newsletter">Newsletter</a></li>
          <li><a href="${r}politicas/#reembolso">Garantia e reembolso</a></li>
          <li><a href="${r}politicas/#privacidade">Privacidade</a></li>
          <li><a href="${r}politicas/#termos">Termos de uso</a></li>
        </ul>
      </div>
      <div>
        <h4>Atendimento</h4>
        <ul>
          <li><a href="${wa('Olá! Preciso de ajuda.')}" target="_blank" rel="noopener">WhatsApp ${esc(cfg.whatsappExibicao)}</a></li>
          <li><a href="mailto:${cfg.emailSuporte}">${esc(cfg.emailSuporte)}</a></li>
          <li>${esc(cfg.horarioSuporte)}</li>
          <li><a href="${r}suporte/">Central de ajuda</a></li>
        </ul>
        <div class="pagamentos"><span>PIX</span><span>Cartão</span><span>Boleto</span><span>Compra segura</span></div>
      </div>
    </div>
    <div class="rodape-base">
      <span>© ${new Date().getFullYear()} ${esc(nomeMarca)} · ${esc(cfg.assinatura)}${cfg.cnpj ? ' · CNPJ ' + esc(cfg.cnpj) : ''}</span>
      <span>Os materiais são ferramentas de apoio e não substituem acompanhamento profissional.</span>
    </div>
  </div>
</footer>
<a class="wa-flutuante" href="${wa('Olá! Vim pelo site do ' + nomeMarca + ' e tenho uma dúvida.')}" target="_blank" rel="noopener" aria-label="Falar com o suporte no WhatsApp">
  <span class="balao">Dúvidas? Fale com a gente</span>${WA_SVG.replace('fill="currentColor"', '')}
</a>
<script src="${r}assets/js/main.js?v=${v}" defer></script>
</body>
</html>`;
}

// ---------------------------------------------------------------- páginas
const paginas = [];
const pagina = (caminho, html) => paginas.push([caminho, html]);

// HOME
{
  const r = '';
  const destaque = ['nervo-vago', 'baralho-constelacao-familiar', 'radiestesia-cigana'].map((s) => produtoPorSlug[s]).filter(Boolean);
  const imgs = destaque.map((p) => p.imagemCapa).filter(Boolean);
  const corpo = `
<section class="hero">
  <div class="container">
    <div>
      <span class="eyebrow">${esc(cfg.assinatura)}</span>
      <h1 class="display">Ferramentas terapêuticas prontas para <em>transformar</em> as suas sessões.</h1>
      <p class="lead">Kits de arteterapia, regulação emocional e práticas integrativas criados por uma psicóloga com mais de 15 anos de clínica. Você baixa hoje, imprime e aplica na próxima sessão.</p>
      <div class="hero-ctas">
        <a class="btn btn-primario" href="produtos/">Ver os materiais ${ic('seta')}</a>
        <a class="btn btn-contorno" href="sobre/">Conheça a Dra. Rô</a>
      </div>
      <ul class="selos">
        <li><span class="ic ic-teal">${ic('raio')}</span>Acesso imediato por e-mail</li>
        <li><span class="ic ic-coral">${ic('escudo')}</span>Garantia incondicional</li>
        <li><span class="ic ic-roxo">${ic('chat')}</span>Suporte humano no WhatsApp</li>
        <li><span class="ic ic-sol">${ic('infinito')}</span>Acesso vitalício</li>
      </ul>
    </div>
    <div class="hero-arte" aria-hidden="true">
      <span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span>
      ${imgs[0] ? `<div class="hero-card c1"><img src="${imgs[0]}" alt=""></div>` : ''}
      ${imgs[1] ? `<div class="hero-card c2"><img src="${imgs[1]}" alt=""></div>` : ''}
      ${imgs[2] ? `<div class="hero-card c3"><img src="${imgs[2]}" alt=""></div>` : ''}
      <div class="hero-selo"><span><strong>${produtos.length}</strong>kits prontos pra usar</span></div>
    </div>
  </div>
</section>

${carrossel(r)}

<div class="faixa"><div class="container">
  ${cfg.numeros.map((n) => `<div class="faixa-item"><strong>${esc(n.valor)}</strong><span>${esc(n.rotulo)}</span></div>`).join('')}
  <div class="faixa-item"><strong>100%</strong><span>digital, pronto pra imprimir</span></div>
</div></div>

<section class="secao" id="materiais">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Os mais escolhidos</span>
      <h2 class="section-title display">Materiais que terapeutas usam toda semana</h2>
      <p class="lead">Cada kit reúne atividades, fichas, protocolos e roteiros de sessão — organizados para você parar de improvisar e conduzir com segurança.</p>
    </div>
    <div class="grade-produtos">${produtos.map((p) => cardProduto(p, r)).join('')}</div>
  </div>
</section>

<section class="secao secao-papel">
  <div class="container">
    <div class="section-head center">
      <span class="eyebrow">Como funciona</span>
      <h2 class="section-title display">Da compra à sessão em poucos minutos</h2>
    </div>
    <ol class="passos">
      <li class="revelar"><h3>Escolha o material</h3><p>Pagamento único por PIX, cartão (em até 5x) ou boleto, em ambiente seguro.</p></li>
      <li class="revelar"><h3>Receba no e-mail</h3><p>O acesso chega na hora no e-mail da compra. Não achou? Olhe spam e Promoções — ou chame a gente.</p></li>
      <li class="revelar"><h3>Baixe e imprima</h3><p>PDFs em alta resolução. Use impresso no consultório ou na tela, em atendimentos online.</p></li>
      <li class="revelar"><h3>Aplique na sessão</h3><p>Cada material tem objetivo, passo a passo e orientação de condução. É abrir e usar.</p></li>
    </ol>
  </div>
</section>

<section class="secao">
  <div class="container especialista">
    <div class="especialista-foto revelar">
      <img src="assets/img/marca/rosana-neves.webp" alt="${esc(cfg.especialista)}" loading="lazy">
      <div class="assinatura"><strong>${esc(cfg.especialista)}</strong>${esc(cfg.especialistaTitulo)}</div>
    </div>
    <div class="revelar">
      <span class="eyebrow">Quem está por trás</span>
      <h2 class="section-title display">Criado na clínica, para a clínica.</h2>
      <p class="lead">A Dra. Rô é a fundadora da Oficina da Dra. Rô — Arteterapia na Prática. Cada material desta loja nasceu da escuta de pacientes reais e das perguntas que terapeutas fazem todos os dias: <em>“o que eu aplico hoje, com esse paciente?”</em></p>
      <blockquote>“Dediquei minha carreira a transformar conhecimento psicológico em ferramentas práticas — acessíveis, acolhedoras e com embasamento.”</blockquote>
      <div class="num-lista">${cfg.numeros.map((n) => `<div><strong>${esc(n.valor)}</strong><span>${esc(n.rotulo)}</span></div>`).join('')}</div>
      <p style="margin-top:28px"><a class="btn btn-contorno" href="sobre/">Ler a história completa</a></p>
    </div>
  </div>
</section>

<section class="secao secao-papel">
  <div class="container">
    <div class="section-head" style="display:flex;justify-content:space-between;align-items:flex-end;gap:24px;max-width:none;flex-wrap:wrap">
      <div style="max-width:620px">
        <span class="eyebrow">Blog da Oficina</span>
        <h2 class="section-title display">Leituras para a sua prática</h2>
        <p class="lead" style="margin:0">Artigos da Dra. Rô sobre arteterapia, regulação emocional e práticas integrativas — com exercícios que você pode usar amanhã.</p>
      </div>
      <a class="btn btn-contorno" href="blog/">Ver todos os artigos</a>
    </div>
    <div class="grade-posts">${posts.slice(0, 3).map((p) => cardPost(p, r)).join('')}</div>
  </div>
</section>

${blocoNewsletter(r)}
${blocoSuporte(r)}

<section class="secao">
  <div class="container container-sm">
    <div class="section-head center">
      <span class="eyebrow">Dúvidas frequentes</span>
      <h2 class="section-title display">Antes de você comprar</h2>
    </div>
    ${faqHtml([
      { p: 'Os materiais são físicos ou digitais?', r: 'Todos são <strong>100% digitais</strong> (PDF em alta resolução). Você baixa, guarda para sempre e imprime quantas vezes quiser — ou usa direto na tela do computador, tablet ou celular.' },
      { p: 'Como e quando eu recebo o acesso?', r: 'Na hora. Assim que o pagamento é aprovado, o acesso chega no e-mail usado na compra. PIX e cartão liberam em minutos; boleto, em até 2 dias úteis após o pagamento.' },
      { p: 'Não recebi o e-mail. E agora?', r: `Confira as abas <strong>Spam</strong>, <strong>Promoções</strong> e <strong>Atualizações</strong>. Se não estiver lá, chame no <a href="${wa('Olá! Comprei e não recebi o acesso.')}" target="_blank" rel="noopener">WhatsApp</a> ou escreva para <a href="mailto:${cfg.emailSuporte}">${esc(cfg.emailSuporte)}</a> com o e-mail da compra — a gente reenvia.` },
      { p: 'Preciso ter formação em arteterapia?', r: 'Não. Os materiais trazem objetivo, passo a passo e orientação de condução. São pensados para psicólogas, terapeutas, arteterapeutas e profissionais de práticas integrativas — em qualquer fase da carreira.' },
      { p: 'Posso usar em atendimentos online?', r: 'Sim. Todos os materiais funcionam no presencial (impressos) e no online (compartilhando a tela ou enviando a atividade ao paciente).' },
      { p: 'E se eu não gostar?', r: 'Todos os materiais têm <strong>garantia incondicional</strong>. Se não fizer sentido para você dentro do prazo, devolvemos 100% do valor, sem burocracia. Veja a <a href="politicas/#reembolso">política de reembolso</a>.' },
    ])}
  </div>
</section>`;
  pagina('index.html', layout({
    r, caminho: '', ativo: '',
    titulo: `${nomeMarca} | ${cfg.slogan}`,
    descricao: `Loja oficial da Oficina da Dra. Rô: kits de arteterapia, regulação emocional e práticas integrativas prontos para aplicar na sessão. Acesso imediato e suporte humano.`,
    imagem: produtos[0]?.imagemCapa,
    corpo,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Organization', name: nomeMarca, url: cfg.urlSite,
      founder: { '@type': 'Person', name: cfg.especialista, jobTitle: cfg.especialistaTitulo },
      contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: cfg.emailSuporte, telephone: '+' + cfg.whatsapp, availableLanguage: 'Portuguese' },
    },
  }));
}

// CATÁLOGO
{
  const r = '../';
  const corpo = `
<section class="pagina-topo">
  <div class="container">
    <span class="eyebrow">Loja</span>
    <h1 class="display">Todos os materiais</h1>
    <p class="lead" style="max-width:640px">Kits digitais prontos para imprimir e aplicar — com garantia incondicional, acesso vitalício e suporte humano se você precisar.</p>
  </div>
</section>
${carrossel(r)}
<section class="secao" style="padding-top:0">
  <div class="container">
    <div class="filtros" data-alvo="#grade-cat" role="group" aria-label="Filtrar por tema">
      <button aria-pressed="true" data-cat="">Todos</button>
      ${catsProd.map((c) => `<button aria-pressed="false" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
    </div>
    <div class="grade-produtos" id="grade-cat">${produtos.map((p) => cardProduto(p, r)).join('')}</div>
  </div>
</section>
${blocoSuporte(r, 'Ficou em dúvida sobre qual escolher?')}`;
  pagina('produtos/index.html', layout({ r, caminho: 'produtos/', ativo: 'produtos', titulo: `Materiais | ${nomeMarca}`, descricao: 'Kits de arteterapia, regulação do sistema nervoso, constelação familiar e radiestesia — prontos para imprimir e aplicar.', corpo }));
}

// PÁGINAS DE PRODUTO (PV)
for (const p of produtos) {
  const r = '../../';
  const outros = produtos.filter((x) => x.slug !== p.slug).slice(0, 3);
  const valorItem = (x) => (x.valor ? `<span class="valor">${brl(x.valor)}</span>` : '<span class="valor gratis">Incluso</span>');
  const imgItem = (x, bonus) => x.imagem
    ? `<div class="img"><img src="${r}${x.imagem}" alt="${esc(x.nome)}" loading="lazy"></div>`
    : `<div class="img sem ${bonus ? 'ic-sol' : 'ic-' + p.cor}">${ic(bonus ? 'presente' : 'arquivo')}</div>`;
  const postsRel = posts.filter((x) => x.produtoRelacionado === p.slug);

  const corpo = `
<div class="container migalhas"><a href="${r}">Início</a><span>/</span><a href="${r}produtos/">Materiais</a><span>/</span>${esc(p.nomeCurto)}</div>

<section class="pv-hero">
  <div class="container">
    <div>
      <span class="eyebrow">${esc(p.hero.eyebrow)}</span>
      <h1 class="display">${p.hero.titulo}</h1>
      <p class="lead">${p.hero.subtitulo}</p>
      <ul class="check-lista">${p.hero.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      <p style="margin-top:28px;font-size:14.5px" class="muted">Para: ${p.publico.map(esc).join(' · ')}</p>
    </div>
    <div class="pv-midia">
      <div class="pv-capa">${capa(p, r)}</div>
      <div class="pv-caixa-preco">
        ${p.precoDe ? `<div class="de">De <s>${brlCheio(p.precoDe)}</s> por apenas</div>` : ''}
        <div class="por"><strong>${brl(p.preco)}</strong><span>à vista ou ${esc(p.parcelas)}</span></div>
        ${btnCompra(p, 'Quero o kit completo', 'btn-bloco')}
        <div class="garantias-mini"><span>${ic('raio')}Acesso imediato</span><span>${ic('escudo')}Garantia ${p.garantiaDias} dias</span><span>${ic('cadeado')}Compra segura</span></div>
      </div>
    </div>
  </div>
</section>

<section class="secao secao-papel">
  <div class="container pv-problema">
    <div class="texto revelar">
      <span class="eyebrow">O problema</span>
      <h2 class="section-title display">${p.problema.titulo}</h2>
      ${p.problema.paragrafos.map((x) => `<p>${x}</p>`).join('')}
    </div>
    <div class="dores revelar">
      <h3>Você se reconhece?</h3>
      <ul>${p.problema.dores.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
    </div>
  </div>
</section>

<section class="secao secao-roxo">
  <div class="container">
    <div class="section-head" style="max-width:760px">
      <span class="eyebrow">A solução</span>
      <h2 class="section-title display">${p.solucao.titulo}</h2>
      <p class="lead" style="color:rgba(255,255,255,.82)">${p.solucao.texto}</p>
    </div>
    <div class="pontos">${p.solucao.pontos.map((x, i) => `<div class="ponto revelar"><span class="n">0${i + 1}</span><h3>${esc(x.titulo)}</h3><p>${esc(x.texto)}</p></div>`).join('')}</div>
  </div>
</section>

<section class="secao">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">O que você recebe</span>
      <h2 class="section-title display">Tudo o que vem no kit</h2>
    </div>
    <div class="entregaveis">${p.entregaveis.map((x) => `<div class="entregavel revelar">${imgItem(x, false)}<div><h3>${esc(x.nome)}</h3><p>${x.descricao}</p></div>${valorItem(x)}</div>`).join('')}</div>
    ${p.bonus?.length ? `
    <div class="section-head" style="margin-top:72px">
      <span class="eyebrow">Bônus exclusivos</span>
      <h2 class="section-title display">E ainda leva ${p.bonus.length} bônus</h2>
    </div>
    <div class="entregaveis">${p.bonus.map((x) => `<div class="entregavel revelar">${imgItem(x, true)}<div><span class="bonus-tag">BÔNUS</span><h3>${esc(x.nome)}</h3><p>${x.descricao}</p></div>${valorItem(x)}</div>`).join('')}</div>` : ''}
  </div>
</section>

${p.galeria?.length ? `
<section class="secao-sm secao-creme2">
  <div class="container">
    <div class="section-head"><span class="eyebrow">Por dentro do material</span><h2 class="section-title display">Veja algumas páginas</h2></div>
    <div class="galeria">${p.galeria.map((g, i) => `<button type="button" data-src="${r}${g}"><img src="${r}${g}" alt="Amostra ${i + 1} do ${esc(p.nome)}" loading="lazy"></button>`).join('')}</div>
  </div>
</section>
<div class="lightbox" role="dialog" aria-label="Imagem ampliada"><img alt=""></div>` : ''}

<section class="secao">
  <div class="container duas-colunas">
    <div class="caixa-lista revelar">
      <h3>Para quem é</h3>
      <ul class="check-lista">${p.paraQuem.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>
    <div class="caixa-lista suave revelar">
      <h3>Para quem não é</h3>
      <ul class="check-lista x-lista">${(p.naoEPara || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>
  </div>
</section>

<section class="secao secao-papel">
  <div class="container">
    <div class="section-head center"><span class="eyebrow">Passo a passo</span><h2 class="section-title display">Como funciona</h2></div>
    <ol class="passos">${p.comoFunciona.map((x) => `<li class="revelar"><p style="font-size:16px;color:var(--tinta)">${esc(x)}</p></li>`).join('')}</ol>
  </div>
</section>

<section class="secao" id="oferta">
  <div class="container">
    <div class="oferta revelar">
      <div class="oferta-topo">Oferta especial — tudo o que está incluso</div>
      <div class="oferta-corpo">
        <ul class="oferta-itens">
          ${p.entregaveis.map((x) => `<li><span>${esc(x.nome)}</span><span>${x.valor ? brl(x.valor) : ''}</span></li>`).join('')}
          ${(p.bonus || []).map((x) => `<li class="b"><span>${esc(x.nome)}</span><span>${x.valor ? brl(x.valor) : ''}</span></li>`).join('')}
        </ul>
        <div class="oferta-total">
          ${p.precoDe ? `<div class="de">Comprando separado, você pagaria <s>${brlCheio(p.precoDe)}</s></div>` : ''}
          <div class="parc">${esc(p.parcelas)}</div>
          <div class="valor">${brl(p.preco)}</div>
          <div class="vista">à vista · pagamento único · acesso vitalício</div>
          ${btnCompra(p, 'Quero garantir o meu', 'btn-bloco')}
          <div class="garantias-mini"><span>${ic('cadeado')}Pagamento seguro</span><span>${ic('raio')}Liberação imediata</span><span>${ic('chat')}Suporte humano</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="secao-sm">
  <div class="container">
    <div class="garantia revelar">
      <div class="garantia-selo"><span><strong>${p.garantiaDias}</strong>dias de<br>garantia</span></div>
      <div>
        <h2 class="display">Garantia incondicional de ${p.garantiaDias} dias</h2>
        <p>Baixe, leia e aplique nas suas sessões. Se dentro de ${p.garantiaDias} dias você sentir que o material não é para você, é só pedir pelo WhatsApp ou e-mail — devolvemos 100% do valor, sem perguntas e sem burocracia.</p>
      </div>
    </div>
  </div>
</section>

<section class="secao secao-papel">
  <div class="container especialista">
    <div class="especialista-foto revelar">
      <img src="${r}assets/img/marca/rosana-neves.webp" alt="${esc(cfg.especialista)}" loading="lazy">
      <div class="assinatura"><strong>${esc(cfg.especialista)}</strong>Criadora do material</div>
    </div>
    <div class="revelar">
      <span class="eyebrow">Quem criou</span>
      <h2 class="section-title display">Um material com assinatura clínica</h2>
      <p class="lead">${esc(cfg.especialista)} é ${esc(cfg.especialistaTitulo.toLowerCase())} e fundadora da Oficina da Dra. Rô. Os kits da loja são pensados para o que acontece de verdade no consultório: pouco tempo, pacientes diferentes e a necessidade de conduzir com segurança.</p>
      <div class="num-lista">${cfg.numeros.map((n) => `<div><strong>${esc(n.valor)}</strong><span>${esc(n.rotulo)}</span></div>`).join('')}</div>
    </div>
  </div>
</section>

<section class="secao">
  <div class="container container-sm">
    <div class="section-head center"><span class="eyebrow">Perguntas frequentes</span><h2 class="section-title display">Tire suas dúvidas</h2></div>
    ${faqHtml(p.faq)}
    <div class="aviso-suporte revelar" style="margin-top:32px">
      <div><h3>Ainda ficou com alguma dúvida?</h3><p>Fale com uma pessoa da nossa equipe antes de comprar. A gente responde ${esc(cfg.prazoResposta)}.</p></div>
      <div class="acoes">
        <a class="btn btn-wa" href="${wa(`Olá! Tenho uma dúvida sobre o ${p.nome}.`)}" target="_blank" rel="noopener">${WA_SVG} WhatsApp</a>
        <a class="btn btn-contorno" href="mailto:${cfg.emailSuporte}?subject=${encodeURIComponent('Dúvida: ' + p.nome)}">E-mail</a>
      </div>
    </div>
    <p style="text-align:center;margin-top:40px">${btnCompra(p, 'Quero o kit completo')}</p>
  </div>
</section>

${postsRel.length ? `<section class="secao-sm secao-papel"><div class="container">
  <div class="section-head"><span class="eyebrow">Do blog</span><h2 class="section-title display">Para aprofundar</h2></div>
  <div class="grade-posts">${postsRel.map((x) => cardPost(x, r)).join('')}</div>
</div></section>` : ''}

<section class="secao">
  <div class="container">
    <div class="section-head"><span class="eyebrow">Você também pode gostar</span><h2 class="section-title display">Outros materiais da Oficina</h2></div>
    <div class="grade-produtos">${outros.map((x) => cardProduto(x, r)).join('')}</div>
  </div>
</section>

<div class="barra-compra">
  <div class="p"><small>${p.precoDe ? `de <s>${brl(p.precoDe)}</s> por` : 'por'}</small><strong>${brl(p.preco)}</strong></div>
  ${btnCompra(p, 'Quero o meu')}
</div>`;

  pagina(`produtos/${p.slug}/index.html`, layout({
    r, caminho: `produtos/${p.slug}/`, ativo: 'produtos',
    titulo: p.seo?.title || `${p.nome} | ${nomeMarca}`,
    descricao: p.seo?.description || p.resumo,
    imagem: p.imagemCapa,
    corpo,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Product', name: p.nome, description: p.resumo,
      image: p.imagemCapa ? cfg.urlSite.replace(/\/$/, '') + '/' + p.imagemCapa : undefined,
      brand: { '@type': 'Brand', name: nomeMarca },
      offers: { '@type': 'Offer', price: p.preco, priceCurrency: 'BRL', availability: 'https://schema.org/InStock', url: cfg.urlSite.replace(/\/$/, '') + `/produtos/${p.slug}/` },
    },
  }));
}

// BLOG
{
  const r = '../';
  const corpo = `
<section class="pagina-topo">
  <div class="container">
    <span class="eyebrow">Blog da Oficina</span>
    <h1 class="display">Leituras para a sua prática</h1>
    <p class="lead" style="max-width:660px">Artigos da Dra. Rô sobre arteterapia, regulação emocional, sistêmica e práticas integrativas — com exercícios que você pode levar para a próxima sessão.</p>
  </div>
</section>
<section class="secao" style="padding-top:0">
  <div class="container">
    <div class="filtros" data-alvo="#grade-blog" role="group" aria-label="Filtrar por tema">
      <button aria-pressed="true" data-cat="">Todos</button>
      ${catsBlog.map((c) => `<button aria-pressed="false" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
    </div>
    <div class="grade-posts" id="grade-blog">${posts.map((p) => cardPost(p, r)).join('')}</div>
  </div>
</section>
${blocoNewsletter(r)}`;
  pagina('blog/index.html', layout({ r, caminho: 'blog/', ativo: 'blog', titulo: `Blog | ${nomeMarca}`, descricao: 'Artigos sobre arteterapia, regulação do sistema nervoso, constelação familiar e práticas integrativas para terapeutas.', corpo }));
}

for (const post of posts) {
  const r = '../../';
  const prod = produtoPorSlug[post.produtoRelacionado];
  const outros = posts.filter((x) => x.slug !== post.slug).slice(0, 3);
  const corpo = `
<article>
  <header class="artigo-topo">
    <div class="container">
      <span class="chip chip-${post.cor}">${esc(post.categoria)}</span>
      <h1 class="display">${esc(post.titulo)}</h1>
      <p class="lead">${esc(post.resumo)}</p>
      <div class="autor-linha">
        <img src="${r}assets/img/marca/rosana-neves.webp" alt="">
        <div><strong>Por ${esc(cfg.especialista)}</strong>${dataBR(post.data)} · ${esc(post.leitura)} de leitura</div>
      </div>
    </div>
  </header>
  <div class="container container-sm">
    <div class="artigo-faixa bg-${post.cor}"></div>
    <div class="prosa">${post.corpo}</div>
    ${prod ? `
    <a class="produto-relacionado" href="${r}produtos/${prod.slug}/">
      <div class="capa">${capa(prod, r)}</div>
      <div>
        <span class="chip chip-${prod.cor}">Material recomendado</span>
        <h3>${esc(prod.nome)}</h3>
        <p>${esc(prod.resumo)}</p>
        <span class="btn btn-primario">Conhecer o material ${ic('seta')}</span>
      </div>
    </a>` : ''}
  </div>
</article>
${blocoNewsletter(r)}
<section class="secao secao-papel">
  <div class="container">
    <div class="section-head"><span class="eyebrow">Continue lendo</span><h2 class="section-title display">Outros artigos</h2></div>
    <div class="grade-posts">${outros.map((x) => cardPost(x, r)).join('')}</div>
  </div>
</section>`;
  pagina(`blog/${post.slug}/index.html`, layout({
    r, caminho: `blog/${post.slug}/`, ativo: 'blog',
    titulo: `${post.titulo} | ${nomeMarca}`, descricao: post.resumo,
    imagem: prod?.imagemCapa, corpo,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Article', headline: post.titulo, description: post.resumo,
      datePublished: post.data, author: { '@type': 'Person', name: cfg.especialista },
      publisher: { '@type': 'Organization', name: nomeMarca },
    },
  }));
}

// SOBRE
{
  const r = '../';
  const corpo = `
<section class="secao">
  <div class="container especialista">
    <div class="especialista-foto">
      <img src="${r}assets/img/marca/rosana-neves.webp" alt="${esc(cfg.especialista)}">
      <div class="assinatura"><strong>${esc(cfg.especialista)}</strong>${esc(cfg.especialistaTitulo)}</div>
    </div>
    <div>
      <span class="eyebrow">Sobre</span>
      <h1 class="section-title display" style="font-size:clamp(36px,5vw,56px)">Oi, eu sou a Dra. Rô.</h1>
      <p class="lead">Sou ${esc(cfg.especialista)}, ${esc(cfg.especialistaTitulo.toLowerCase())}. Há mais de 15 anos acompanho histórias reais no consultório — e foi ali que percebi o quanto nós, terapeutas, precisamos de ferramentas <em>práticas</em>.</p>
      <p>Muita gente sai da formação cheia de teoria e com pouca coisa pronta para aplicar. A sessão começa, o paciente chega ativado, travado ou sem palavras — e a gente improvisa. A <strong>Oficina da Dra. Rô</strong> nasceu para mudar isso: arteterapia e recursos terapêuticos organizados, com objetivo claro, passo a passo e embasamento.</p>
      <p>Este Ateliê é a nossa loja oficial. Aqui estão os materiais que mais ajudaram colegas a conduzir sessões com segurança — do sistema nervoso à arteterapia junguiana, da sistêmica às práticas integrativas.</p>
      <div class="num-lista" style="margin-top:24px">${cfg.numeros.map((n) => `<div><strong>${esc(n.valor)}</strong><span>${esc(n.rotulo)}</span></div>`).join('')}</div>
    </div>
  </div>
</section>
<section class="secao secao-papel">
  <div class="container">
    <div class="section-head center"><span class="eyebrow">Nossos compromissos</span><h2 class="section-title display">O que você pode esperar da Oficina</h2></div>
    <div class="suporte-grade">
      <div class="suporte-card revelar"><div class="ic ic-roxo">${ic('livro')}</div><h3>Material com embasamento</h3><p>Conteúdo construído a partir de referências consagradas e da prática clínica — sem promessas milagrosas.</p></div>
      <div class="suporte-card revelar"><div class="ic ic-coral">${ic('impressora')}</div><h3>Pronto para usar</h3><p>Cada atividade tem objetivo, materiais e condução. Você não precisa montar nada do zero.</p></div>
      <div class="suporte-card revelar"><div class="ic ic-teal">${ic('chat')}</div><h3>Gente de verdade no suporte</h3><p>Dúvida de acesso, de uso ou de reembolso: uma pessoa da equipe responde você.</p></div>
    </div>
  </div>
</section>
<section class="secao">
  <div class="container">
    <div class="section-head"><span class="eyebrow">Loja</span><h2 class="section-title display">Conheça os materiais</h2></div>
    <div class="grade-produtos">${produtos.map((p) => cardProduto(p, r)).join('')}</div>
  </div>
</section>
${blocoNewsletter(r)}`;
  pagina('sobre/index.html', layout({ r, caminho: 'sobre/', ativo: 'sobre', titulo: `Sobre a Dra. Rô | ${nomeMarca}`, descricao: `Conheça ${cfg.especialista}, psicóloga e criadora da Oficina da Dra. Rô — Arteterapia na Prática.`, corpo }));
}

// SUPORTE (central de ajuda — o antídoto do reembolso)
{
  const r = '../';
  const corpo = `
<section class="pagina-topo">
  <div class="container container-sm" style="text-align:center">
    <span class="eyebrow">Central de ajuda</span>
    <h1 class="display">Como podemos ajudar?</h1>
    <p class="lead">A maioria das dúvidas se resolve em 1 minuto por aqui. Se não resolver, fale com a gente — respondemos ${esc(cfg.prazoResposta)}.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:24px">
      <a class="btn btn-wa" href="${wa('Olá! Preciso de ajuda com meu acesso.')}" target="_blank" rel="noopener">${WA_SVG} Chamar no WhatsApp</a>
      <a class="btn btn-contorno" href="mailto:${cfg.emailSuporte}">${esc(cfg.emailSuporte)}</a>
    </div>
    <p class="muted" style="margin-top:14px;font-size:14px">${esc(cfg.horarioSuporte)}</p>
  </div>
</section>
<section class="secao" style="padding-top:24px">
  <div class="container container-sm">
    <h2 class="display" style="font-size:28px;margin-bottom:18px">Acesso aos materiais</h2>
    ${faqHtml([
      { p: 'Onde está o meu material?', r: 'O acesso é enviado para o <strong>e-mail usado na compra</strong>, logo após a aprovação do pagamento. Procure por um e-mail da plataforma de pagamento (Lastlink) com o assunto de acesso ao produto.' },
      { p: 'Não encontrei o e-mail de acesso.', r: `Confira <strong>Spam</strong>, <strong>Promoções</strong> e <strong>Atualizações</strong> e pesquise pelo nome do produto. Verifique também se o e-mail foi digitado certinho na compra. Se ainda assim não achar, <a href="${wa('Olá! Não encontrei o e-mail de acesso. Meu e-mail de compra é: ')}" target="_blank" rel="noopener">chame no WhatsApp</a> com o e-mail da compra — reenviamos na hora.` },
      { p: 'Paguei com boleto. Quando libera?', r: 'O boleto leva até 2 dias úteis para compensar. Assim que compensar, o acesso chega automaticamente no seu e-mail. PIX e cartão liberam em minutos.' },
      { p: 'Como faço para baixar os PDFs?', r: 'Abra o link de acesso, clique em cada material e use o botão de download. No celular, o arquivo vai para a pasta “Downloads” ou “Arquivos”. Recomendamos salvar tudo numa pasta no computador ou no Google Drive — o material é seu para sempre.' },
      { p: 'Como imprimir com boa qualidade?', r: 'Imprima em tamanho A4, na opção “tamanho real” (sem ajustar à página). Para cartas e baralhos, papel 180 g ou mais deixa o material mais durável. Gráficas rápidas imprimem direto do PDF.' },
      { p: 'O link parou de funcionar.', r: `O acesso é vitalício. Se algum link apresentar erro, fale com a gente pelo <a href="${wa('Olá! Meu link de acesso parou de funcionar.')}" target="_blank" rel="noopener">WhatsApp</a> e enviamos um novo.` },
    ])}
    <h2 class="display" id="reembolso" style="font-size:28px;margin:48px 0 18px">Garantia e reembolso</h2>
    ${faqHtml([
      { p: 'Como funciona a garantia?', r: 'Todos os materiais têm garantia incondicional (o prazo aparece na página de cada produto e começa a contar na data da compra). Dentro do prazo, você pode pedir o reembolso integral, sem precisar justificar.' },
      { p: 'Como peço o reembolso?', r: `Mande uma mensagem pelo <a href="${wa('Olá! Gostaria de solicitar o reembolso. Meu e-mail de compra é: ')}" target="_blank" rel="noopener">WhatsApp</a> ou para <a href="mailto:${cfg.emailSuporte}?subject=Reembolso">${esc(cfg.emailSuporte)}</a> informando o e-mail da compra. Antes de processar, se você quiser, podemos te ajudar a usar o material — muitas vezes a dúvida é só de acesso.` },
      { p: 'Em quanto tempo o dinheiro volta?', r: 'PIX: em até 7 dias úteis na conta de origem. Cartão: o estorno aparece em até 2 faturas, conforme a operadora.' },
    ])}
  </div>
</section>
${blocoSuporte(r, 'Ainda precisa de ajuda?')}`;
  pagina('suporte/index.html', layout({ r, caminho: 'suporte/', ativo: 'suporte', titulo: `Suporte e central de ajuda | ${nomeMarca}`, descricao: 'Não recebeu o acesso? Quer tirar uma dúvida ou pedir reembolso? Fale com a equipe do Ateliê pelo WhatsApp ou e-mail.', corpo }));
}

// POLÍTICAS
{
  const r = '../';
  const corpo = `
<section class="pagina-topo">
  <div class="container container-sm">
    <span class="eyebrow">Institucional</span>
    <h1 class="display">Políticas da loja</h1>
    <div class="indice"><a href="#reembolso">Garantia e reembolso</a><a href="#privacidade">Privacidade</a><a href="#termos">Termos de uso</a></div>
  </div>
</section>
<section class="secao" style="padding-top:8px">
  <div class="container container-sm prosa politica">
    <h2 id="reembolso">Garantia e reembolso</h2>
    <p>Todos os materiais vendidos no ${esc(nomeMarca)} têm garantia incondicional, com o prazo indicado na página de cada produto, contado a partir da data da compra, em conformidade com o art. 49 do Código de Defesa do Consumidor.</p>
    <p>Para solicitar o reembolso, basta entrar em contato pelo WhatsApp ${esc(cfg.whatsappExibicao)} ou pelo e-mail ${esc(cfg.emailSuporte)} informando o e-mail utilizado na compra. Não é necessário justificar. O estorno é processado pela plataforma de pagamento: via PIX em até 7 dias úteis; no cartão de crédito, em até 2 faturas, conforme a operadora.</p>
    <h2 id="privacidade">Privacidade</h2>
    <p>Coletamos apenas os dados necessários para entregar os materiais, prestar suporte e — se você se inscrever — enviar a newsletter: nome, e-mail e, quando você nos procura, o número de WhatsApp. Os pagamentos são processados por plataforma parceira; não temos acesso aos dados completos do seu cartão.</p>
    <p>Não vendemos nem compartilhamos seus dados com terceiros para fins de marketing. Você pode pedir a exclusão dos seus dados ou cancelar a newsletter a qualquer momento pelo e-mail ${esc(cfg.emailSuporte)}, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>
    <h2 id="termos">Termos de uso</h2>
    <p>Ao adquirir um material, você recebe uma licença pessoal e intransferível de uso. Você pode imprimir e utilizar os materiais com seus pacientes e clientes, em atendimentos individuais ou em grupo, presenciais ou online.</p>
    <p>Não é permitido revender, redistribuir, compartilhar os arquivos ou publicá-los, total ou parcialmente, como se fossem de sua autoria. Os materiais são ferramentas de apoio ao trabalho terapêutico e não substituem diagnóstico, tratamento médico ou acompanhamento psicológico.</p>
    <p class="muted" style="font-size:15px">Última atualização: ${dataBR(new Date().toISOString().slice(0, 10))}.</p>
  </div>
</section>`;
  pagina('politicas/index.html', layout({ r, caminho: 'politicas/', titulo: `Políticas | ${nomeMarca}`, descricao: 'Garantia e reembolso, privacidade e termos de uso do Ateliê da Dra. Rô.', corpo }));
}

// OBRIGADO (newsletter)
{
  const r = '../';
  const corpo = `
<section class="secao">
  <div class="container container-sm" style="text-align:center">
    <div class="garantia-selo" style="margin:0 auto 28px;background:var(--roxo-500);box-shadow:0 0 0 8px var(--roxo-100)"><span style="font-size:44px">✓</span></div>
    <h1 class="display section-title">Inscrição confirmada!</h1>
    <p class="lead">A primeira Carta da Oficina chega no seu e-mail em breve. Para não perder nenhuma, salve nosso endereço (${esc(cfg.emailSuporte)}) nos seus contatos.</p>
    <p style="margin-top:28px"><a class="btn btn-primario" href="${r}produtos/">Enquanto isso, conheça os materiais ${ic('seta')}</a></p>
  </div>
</section>`;
  pagina('obrigado/index.html', layout({ r, caminho: 'obrigado/', titulo: `Obrigada! | ${nomeMarca}`, descricao: 'Inscrição na newsletter confirmada.', corpo }));
}

// LINK DA BIO — página enxuta, sem cabeçalho/rodapé
{
  const r = '../';
  const links = [
    { href: `${cfg.urlApp}/login`, titulo: 'Já comprei: acessar meus materiais', sub: 'Entrar no app da Oficina', icone: 'livro', cor: 'roxo', destaque: true },
    { href: wa('Olá! Vim pelo Instagram e preciso de ajuda.'), titulo: 'Falar com o suporte', sub: `WhatsApp · ${cfg.horarioSuporte}`, icone: 'chat', cor: 'teal', externo: true },
    { href: `${r}`, titulo: `Loja ${nomeMarca}`, sub: 'Kits terapêuticos prontos para usar', icone: 'presente', cor: 'coral' },
    { href: `${r}#newsletter`, titulo: 'Receber dicas por e-mail', sub: 'Cartas da Oficina, toda semana', icone: 'email', cor: 'sol' },
  ];
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dra. Rô | Links</title>
<meta name="description" content="Acesse seus materiais, fale com o suporte, conheça a loja e receba dicas da Dra. Rô.">
<meta name="theme-color" content="#5B4A9E">
<meta name="robots" content="noindex">
<link rel="icon" href="${r}assets/img/marca/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTES}">
<link rel="stylesheet" href="${r}assets/css/style.css?v=${v}">
<style>
  body { min-height: 100vh; background: radial-gradient(circle at 15% 0%, var(--sol-100), transparent 45%), radial-gradient(circle at 100% 40%, var(--teal-50), transparent 40%), radial-gradient(circle at 0% 100%, var(--coral-50), transparent 45%), var(--creme); }
  .bio { max-width: 480px; margin: 0 auto; padding: 44px 20px 36px; display: flex; flex-direction: column; align-items: center; text-align: center; }
  .bio-foto { width: 108px; height: 108px; border-radius: 50%; object-fit: cover; border: 4px solid #fff; box-shadow: 0 0 0 3px var(--roxo-200), var(--sombra-lg); }
  .bio .marca { margin: 20px 0 6px; align-items: center; padding-right: 0; }
  .bio .marca-respingo { right: -30px; }
  .bio-desc { color: var(--tinta-2); font-size: 15.5px; margin: 10px 0 28px; max-width: 360px; }
  .bio-links { width: 100%; display: flex; flex-direction: column; gap: 12px; list-style: none; }
  .bio-link { display: flex; align-items: center; gap: 14px; text-align: left; text-decoration: none; background: #fff; border: 1px solid var(--linha); border-radius: 20px; padding: 14px 18px 14px 14px; box-shadow: var(--sombra); transition: transform .15s, box-shadow .2s; }
  .bio-link:hover { transform: translateY(-2px); box-shadow: var(--sombra-lg); }
  .bio-link:active { transform: scale(.98); }
  .bio-link .ic { width: 46px; height: 46px; border-radius: 14px; display: grid; place-items: center; flex-shrink: 0; }
  .bio-link .ic svg { width: 22px; height: 22px; }
  .bio-link strong { display: block; font-size: 16.5px; color: var(--tinta); line-height: 1.25; }
  .bio-link small { display: block; font-size: 13.5px; color: var(--tinta-3); margin-top: 2px; }
  .bio-link .seta { margin-left: auto; width: 18px; height: 18px; color: var(--tinta-3); flex-shrink: 0; }
  .bio-link.destaque { background: var(--roxo-500); border-color: var(--roxo-500); }
  .bio-link.destaque strong { color: #fff; }
  .bio-link.destaque small, .bio-link.destaque .seta { color: rgba(255,255,255,.8); }
  .bio-link.destaque .ic { background: rgba(255,255,255,.16); color: #fff; }
  .bio-rodape { margin-top: 32px; font-size: 12.5px; color: var(--tinta-3); }
</style>
</head>
<body>
<main class="bio">
  <img class="bio-foto" src="${r}assets/img/marca/rosana-neves.webp" alt="${esc(cfg.especialista)}">
  ${wordmark(r).replace(esc(cfg.assinatura), 'Arteterapia na Prática')}
  <p class="bio-desc">${esc(cfg.especialista)} · ${esc(cfg.especialistaTitulo)}. Ferramentas terapêuticas prontas para a sua prática.</p>
  <ul class="bio-links">
    ${links.map((l) => `<li><a class="bio-link${l.destaque ? ' destaque' : ''}" href="${esc(l.href)}"${l.externo ? ' target="_blank" rel="noopener"' : ''}>
      <span class="ic ic-${l.cor}">${ic(l.icone)}</span>
      <span><strong>${esc(l.titulo)}</strong><small>${esc(l.sub)}</small></span>
      ${ic('seta', 'class="seta"')}
    </a></li>`).join('')}
  </ul>
  <p class="bio-rodape">© ${new Date().getFullYear()} ${esc(nomeMarca)}</p>
</main>
</body>
</html>`;
  pagina('links/index.html', html);
}

// 404
pagina('404.html', layout({
  r: '/', caminho: '404', titulo: `Página não encontrada | ${nomeMarca}`, descricao: 'Página não encontrada.',
  corpo: `<section class="secao"><div class="container container-sm" style="text-align:center">
    <h1 class="display section-title">Essa página se perdeu no ateliê.</h1>
    <p class="lead">O endereço pode ter mudado. Que tal voltar para os materiais?</p>
    <p style="margin-top:24px"><a class="btn btn-primario" href="/produtos/">Ver os materiais</a></p>
  </div></section>`,
}));

// ---------------------------------------------------------------- escrita
await rm(SAIDA, { recursive: true, force: true });
for (const [caminho, html] of paginas) {
  const destino = join(SAIDA, caminho);
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, html);
}
await cp(join(RAIZ, 'assets'), join(SAIDA, 'assets'), { recursive: true });

const base = cfg.urlSite.replace(/\/$/, '');
const urls = paginas.map(([c]) => c).filter((c) => c !== '404.html' && !c.startsWith('obrigado') && !c.startsWith('links')).map((c) => base + '/' + c.replace(/index\.html$/, ''));
await writeFile(join(SAIDA, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
await writeFile(join(SAIDA, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);

const semCheckout = produtos.filter((p) => !p.checkout).map((p) => p.nome);
console.log(`✓ ${paginas.length} páginas geradas em site/`);
if (semCheckout.length) console.log(`⚠ Sem link de checkout (botão cai no WhatsApp): ${semCheckout.join(', ')}`);
