# Manutenção e publicação

## Organização local

Na pasta pai há três checkouts completos:

- `upstream-pixeltris/`: original arquivado, para referência.
- `upstream-ryanbr/`: fork consultado, para referência.
- `TwitchLivre/`: projeto a ser mantido; faça as alterações aqui.

O TwitchLivre preserva o histórico e a branch `master`. Remotes: `origin` aponta para `git@github.com:rafelolv/TwitchLivre.git`; `ryanbr` e `pixeltris` apontam para as origens públicas. Configurar um remote não cria um repositório no GitHub.

## Criar o repositório no GitHub

A chave SSH autenticou como `rafelolv`. SSH autoriza operações Git, mas a criação do repositório exige a API autenticada ou o site. Não há `gh` nem autenticação de API configurada no ambiente inicial.

Opção simples: abra [GitHub — novo repositório](https://github.com/new), proprietário `rafelolv`, nome `TwitchLivre`, visibilidade pública. **Não inicialize README, licença ou .gitignore**: já estão no histórico local. Isso cria um projeto independente com histórico e créditos das origens.

Se preferir que o GitHub o identifique como fork, use [Fork do ryanbr](https://github.com/ryanbr/TwitchAdSolutions/fork), proprietário `rafelolv`, nome `TwitchLivre`. A base local já deriva dele. Depois envie a branch local normalmente.

Com o repositório criado, dentro de `TwitchLivre/`:

```bash
git push -u origin master
```

Não envie todas as tags herdadas na primeira publicação. Após confirmar o push, retire o aviso de publicação pendente do README, faça commit e envie essa atualização. O link de instalação será:

`https://raw.githubusercontent.com/rafelolv/TwitchLivre/master/vaft/vaft.user.js`

## Atualizações e releases

1. Altere o script estável e seu par uBlock quando a mudança afetar a lógica.
2. Incremente `@version` do userscript; para mudanças de comportamento, incremente também a versão interna de conflito nos dois formatos.
3. Rode `npm run check` e teste em lives: anúncio inicial e intermediário, troca de canal, qualidade, mute, pausa, aba em segundo plano e fim da transmissão.
4. Documente o resultado no CHANGELOG.md, faça commit e envie `master`.
5. Para gerar uma release, envie uma tag `v` seguida da versão estável exata. Para a base inicial, quando estiver pronta para publicação:

```bash
git tag -a v68.5.7.1 -m 'TwitchLivre initial baseline'
git push origin v68.5.7.1
```

A automação valida os arquivos e testes, confere a versão da tag e publica os dois arquivos vaft estáveis com a licença. Não faz commits automáticos nem altera links para repositórios de terceiros. Conferir o resultado do Actions após publicar; a execução hospedada ainda não foi validada nesta preparação local.

## Incorporar novidades dos upstreams

```bash
git fetch ryanbr
git fetch pixeltris
git log --oneline master..ryanbr/master
git diff master...ryanbr/master -- vaft/vaft.user.js vaft/vaft-ublock-origin.js
```

Revise os commits e integre numa branch de trabalho. Uma correção pode depender de outras; verifique dependências antes de cherry-pick. Merges podem reintroduzir namespace, URLs, workflows e README do upstream: mantenha a identidade do TwitchLivre e os créditos. Não promova o script testing automaticamente.

## Mapa técnico rápido

O userscript inicia em `document-start`, instala hooks de `fetch`/Worker e injeta funções serializadas no worker do player. Elas analisam playlists M3U8, identificam anúncios e tentam obter tokens/playlists de outros tipos de player. A camada da página recebe mensagens do worker, monitora buffering e controla recuperação, recarga e overlays.

Funções transferidas com `.toString()` precisam ser autossuficientes: uma variável disponível no escopo da página pode não existir dentro do worker. Configurações herdadas usam chaves `twitchAdSolutions_*` no localStorage; elas foram preservadas para compatibilidade. Os logs ainda usam `[AD DEBUG] TwitchAdSolutions` e a versão interna do upstream, enquanto o painel do Tampermonkey mostra TwitchLivre e a versão pública com `.1`.
