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
- [x] UTMs no link da bio + pixel UTMify na loja (ver "Rastreamento")
- [ ] UTMs nos links dos anúncios e nos e-mails da newsletter (modelos abaixo)

## Link da bio
Página `/links/` (sem menu, `noindex`). Os 4 botões ficam no bloco "LINK DA BIO" do `build.mjs`.

## Rastreamento
- **Pixel:** UTMify "PIXEL - PSI - WORLDWIDE PT" (Meta `1688358042399531`), instalado em todas as páginas. Fica em `content/config.mjs` → `rastreio`.
  - A UTMify só ativa no domínio publicado. Em `localhost` ela manda os eventos pro servidor de testes dela, então o teste local não aparece no pixel.
  - Compra e InitiateCheckout vêm do postback da Lastlink na UTMify.
- **UTMs:** a loja guarda as UTMs de quem chega e repassa todas pro checkout da Lastlink (UTMify `latest.js` + `assets/js/main.js`).
- **Link da bio (`/links/`):** cada botão leva `utm_source=instagram&utm_medium=bio&utm_campaign=link-da-bio&utm_content=<botão>`.
  - O script de UTMs da UTMify fica **desligado** nessa página de propósito, porque ele trocaria as UTMs fixas por `organic`.

### Eventos enviados ao pixel
| Evento | Quando |
|---|---|
| `CliqueLinkBio` (personalizado, com `botao`) | clique em cada botão da bio: acessar-materiais, suporte-whatsapp, loja, newsletter |
| `ViewContent` | abriu a PV de um produto |
| `CliqueComprar` (personalizado) | clicou em qualquer botão de compra |
| `CliqueWhatsApp` (personalizado) | clicou em qualquer link do WhatsApp |
| `Lead` | inscreveu-se na newsletter |

Os cliques da bio por botão aparecem no **Gerenciador de Eventos da Meta → pixel → CliqueLinkBio → detalhamento por parâmetro `botao`**.
As vendas vindas da bio aparecem na **UTMify filtrando por `utm_source = instagram` / `utm_campaign = link-da-bio`**.

### Modelos de UTM
- **Link da bio no Instagram:** use só `https://SEU-DOMINIO/links/`. As UTMs já estão nos botões.
- **Anúncios Meta (padrão UTMify):**
  `utm_source=FB&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium={{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}}&utm_term={{placement}}`
- **Newsletter:** `?utm_source=newsletter&utm_medium=email&utm_campaign=<nome-da-carta>`
- **Stories/posts:** `?utm_source=instagram&utm_medium=stories&utm_campaign=<tema>`
