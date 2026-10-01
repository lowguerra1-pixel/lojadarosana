# Ateliê da Dra. Rô — Loja oficial da Oficina da Dra. Rô

Site estático (sem dependências) com a loja, as PVs dos produtos, o blog/newsletter e a central de suporte.

## Como editar
| O quê | Onde |
|---|---|
| Nome da loja, e-mail/WhatsApp de suporte, números, CNPJ | `content/config.mjs` |
| Produtos e PVs (copy, preço, checkout, entregáveis, FAQ) | `content/produtos.mjs` |
| Artigos do blog | `content/posts.mjs` |
| Visual (cores, fontes, layout) | `assets/css/style.css` |
| Estrutura das páginas | `build.mjs` |

Depois de editar: `node build.mjs` → gera a pasta `site/`.

## Ver no computador
```bash
python3 -m http.server 4321 --directory site
```
Depois é só abrir http://localhost:4321

## Publicar (Netlify)
Conecte a pasta ao Netlify. O `netlify.toml` já roda o build e publica a pasta `site/`.
Outra opção é arrastar a pasta `site/` no painel do Netlify.
O formulário da newsletter usa o **Netlify Forms**: os inscritos aparecem em *Forms → newsletter*.

## Pendências
- [ ] Links de checkout da **Arteterapia Junguiana** e da **Dependência Química** (sem eles, o botão abre o WhatsApp)
- [ ] Confirmar os entregáveis e bônus da Junguiana e da Dependência Química. Eles foram montados a partir do briefing de criativos, porque não havia PV.
- [ ] Imagens/mockups da Junguiana e da Dependência Química. Por enquanto, essas PVs usam uma capa tipográfica.
- [ ] E-mail de suporte real (hoje está `suporte@oficinadarosana.site`)
- [ ] Domínio final (`urlSite` no config) e CNPJ no rodapé
- [ ] Depoimentos reais (prints) para as PVs. Não foi inventado nenhum depoimento.
- [ ] Garantia do Baralho: a PV atual diz 7 dias e os outros produtos têm 30. Vale padronizar em 30.
- [ ] **UTMs em tudo:** nos links do link da bio (`/links/`), nos links pro app e pro WhatsApp e nos checkouts por origem (bio, blog, newsletter). O site já repassa as UTMs da URL pros checkouts.

## Link da bio
Página `/links/` (sem menu, `noindex`). Os 4 botões ficam no bloco "LINK DA BIO" do `build.mjs`.
