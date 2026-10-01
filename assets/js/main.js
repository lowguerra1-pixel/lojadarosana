(function () {
  // Cabeçalho: borda ao rolar + menu mobile
  var topo = document.querySelector('.topo');
  var toggle = document.querySelector('.menu-toggle');
  if (topo) {
    var aoRolar = function () { topo.classList.toggle('rolou', window.scrollY > 8); };
    window.addEventListener('scroll', aoRolar, { passive: true });
    aoRolar();
  }
  if (toggle && topo) {
    toggle.addEventListener('click', function () {
      var aberto = topo.classList.toggle('aberto');
      toggle.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });
  }

  // Repassa UTMs / sck da URL atual para os links de checkout (rastreamento)
  var params = new URLSearchParams(window.location.search);
  var repassar = new URLSearchParams();
  params.forEach(function (v, k) {
    if (/^(utm_|sck$|src$|fbclid$|gclid$)/.test(k)) repassar.set(k, v);
  });
  var guardado = null;
  try { guardado = sessionStorage.getItem('rastreio'); } catch (e) {}
  if ([...repassar.keys()].length) {
    try { sessionStorage.setItem('rastreio', repassar.toString()); } catch (e) {}
  } else if (guardado) {
    repassar = new URLSearchParams(guardado);
  }
  if ([...repassar.keys()].length) {
    document.querySelectorAll('a[data-checkout]').forEach(function (a) {
      try {
        var url = new URL(a.href);
        repassar.forEach(function (v, k) { if (!url.searchParams.has(k)) url.searchParams.set(k, v); });
        a.href = url.toString();
      } catch (e) {}
    });
  }

  // Barra fixa de compra (aparece depois do hero da PV)
  var barra = document.querySelector('.barra-compra');
  var hero = document.querySelector('.pv-hero');
  if (barra && hero && 'IntersectionObserver' in window) {
    document.body.classList.add('tem-barra-compra');
    new IntersectionObserver(function (entradas) {
      barra.classList.toggle('visivel', !entradas[0].isIntersecting);
    }).observe(hero);
  }

  // Galeria com lightbox
  var lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    var imgLb = lightbox.querySelector('img');
    document.querySelectorAll('.galeria button').forEach(function (b) {
      b.addEventListener('click', function () {
        imgLb.src = b.dataset.src;
        imgLb.alt = b.querySelector('img').alt;
        lightbox.classList.add('aberto');
      });
    });
    lightbox.addEventListener('click', function () { lightbox.classList.remove('aberto'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lightbox.classList.remove('aberto'); });
  }

  // Filtro de categorias do blog / catálogo
  document.querySelectorAll('.filtros').forEach(function (grupo) {
    var alvo = document.querySelector(grupo.dataset.alvo);
    if (!alvo) return;
    grupo.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        grupo.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        var cat = b.dataset.cat;
        alvo.querySelectorAll('[data-cat]').forEach(function (item) {
          item.style.display = !cat || item.dataset.cat === cat ? '' : 'none';
        });
      });
    });
  });

  // Aparecimento suave ao rolar
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.revelar').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.revelar').forEach(function (el) { el.classList.add('visto'); });
  }
})();

// Carrossel de banners: passa sozinho, pausa no toque/hover, arrastável no celular
document.querySelectorAll('.carrossel').forEach(function (c) {
  var trilho = c.querySelector('.trilho');
  var slides = c.querySelectorAll('.slide');
  var pontos = c.querySelectorAll('.carrossel-pontos button');
  if (slides.length < 2) {
    c.querySelectorAll('.carrossel-seta, .carrossel-pontos').forEach(function (el) { el.hidden = true; });
    return;
  }
  var atual = 0;
  var intervalo = parseInt(c.dataset.intervalo, 10) || 6000;
  var parado = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timer = null;

  function ir(i) {
    atual = (i + slides.length) % slides.length;
    trilho.scrollTo({ left: slides[atual].offsetLeft, behavior: 'smooth' });
  }
  function marcar(i) {
    atual = i;
    pontos.forEach(function (p, j) { p.setAttribute('aria-current', j === i ? 'true' : 'false'); });
  }
  function iniciar() { if (!parado) { parar(); timer = setInterval(function () { ir(atual + 1); }, intervalo); } }
  function parar() { clearInterval(timer); }

  var aoRolar;
  trilho.addEventListener('scroll', function () {
    clearTimeout(aoRolar);
    aoRolar = setTimeout(function () { marcar(Math.round(trilho.scrollLeft / trilho.clientWidth)); }, 60);
  }, { passive: true });

  c.querySelector('.ant').addEventListener('click', function () { ir(atual - 1); iniciar(); });
  c.querySelector('.prox').addEventListener('click', function () { ir(atual + 1); iniciar(); });
  pontos.forEach(function (p, j) { p.addEventListener('click', function () { ir(j); iniciar(); }); });
  c.addEventListener('mouseenter', parar);
  c.addEventListener('mouseleave', iniciar);
  trilho.addEventListener('touchstart', parar, { passive: true });
  trilho.addEventListener('touchend', function () { setTimeout(iniciar, 3000); }, { passive: true });
  document.addEventListener('visibilitychange', function () { document.hidden ? parar() : iniciar(); });
  iniciar();
});

// Eventos de conversão: pixel da Meta (carregado pela UTMify) + dataLayer
(function () {
  var fila = [];
  function enviar(tipo, nome, dados) {
    (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: nome }, dados));
    if (window.fbq) window.fbq(tipo, nome, dados);
    else fila.push([tipo, nome, dados]);
  }
  // o pixel carrega assíncrono: esvazia a fila quando o fbq aparecer (até 10s)
  var tentativas = 0;
  var esperar = setInterval(function () {
    if (window.fbq && fila.length) { fila.splice(0).forEach(function (f) { window.fbq(f[0], f[1], f[2]); }); }
    if (window.fbq || ++tentativas > 40) clearInterval(esperar);
  }, 250);

  // Visualizou um produto (PV)
  var produto = document.getElementById('dados-produto');
  if (produto) {
    enviar('track', 'ViewContent', { content_name: produto.dataset.produto, content_ids: [produto.dataset.slug], content_type: 'product', value: Number(produto.dataset.valor), currency: 'BRL' });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    // Clicou em comprar (o InitiateCheckout oficial vem do postback da Lastlink na UTMify)
    if (a.classList.contains('btn-compra')) {
      enviar('trackCustom', 'CliqueComprar', { produto: a.dataset.produto, valor: Number(a.dataset.valor), pagina: location.pathname });
    } else if (/wa\.me\//.test(a.href)) {
      enviar('trackCustom', 'CliqueWhatsApp', { pagina: location.pathname });
    }
  });

  // Inscrição na newsletter
  document.querySelectorAll('form[name="newsletter"]').forEach(function (f) {
    f.addEventListener('submit', function () { enviar('track', 'Lead', { content_name: 'newsletter', pagina: location.pathname }); });
  });
})();
