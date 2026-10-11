# Base inicial do TwitchLivre

Comparação realizada em 11/10/2026 com clones completos, sem alterações nos repositórios de origem.

| Origem | Branch | Commit |
| --- | --- | --- |
| pixeltris/TwitchAdSolutions | master | `c51ef2fe8f667f9dc9216eb550924cf0d732ce27` |
| ryanbr/TwitchAdSolutions | master | `e4dfb26755cb440f9ec6a2430a9b131fa1de062a` |

O original foi arquivado em 05/03/2026. O último commit da base consultada do ryanbr é de 27/08/2026. `git rev-list --left-right --count pixeltris/master...ryanbr/master` retornou `0 813`: nenhum commit exclusivo do pixeltris e 813 exclusivos do ryanbr. Por isso, a base adotada é integralmente a do ryanbr; não há correções exclusivas do original para reaplicar nesta fotografia.

O diff entre as duas pontas cobre 20 arquivos, 16.593 inserções e 956 remoções. Inclui mudanças experimentais e documentação; esses números não representam 813 correções distintas.

## Correções e recursos importados

- Recuperação de buffering, cooldown e limite de recargas do player.
- Troca de transmissão alternativa antes da remoção de segmentos, com fallback de qualidade baixa quando necessário.
- Tratamento de mute, referências antigas do player e elementos de vídeo reaproveitados.
- Melhorias para codecs AV1/HEVC e ausência de `CODECS` na playlist.
- Guardas para frames auxiliares, editor de clipes e workers já interceptados.
- Ocultação de vídeos de anúncios separados quando acessíveis no DOM da página.
- Logs de anúncios CSAI e timeout no caminho de requisições GQL.
- Testes, benchmark, diagnóstico e variantes experimentais.

Consulte [CHANGELOG.md](../CHANGELOG.md) para detalhes e ressalvas do mantenedor anterior. Isso descreve código importado, não comprova eficácia na Twitch atual.

## O que o TwitchLivre muda inicialmente

- Nome e namespace próprios nos cinco userscripts.
- URLs de atualização/download para `rafelolv/TwitchLivre`.
- Sufixo `.1` nas versões dos userscripts: vaft `68.5.7.1`, testing `678.0.0.1`, video-swap-new `1.87.1`, strip `1.10.1`, Brave fix `1.3.1.1`.
- Documentação em português, remotes de origem, validação de todos os JS e release por tag.
- Corpos dos scripts e versões internas de conflito preservados. Créditos de autoria preservados.

## Validação e limites

`npm run check` compila todos os JavaScript sem executar os scripts no navegador e roda os 84 testes herdados. Os testes contêm cópias de funções; não exercitam toda a integração nem todas as alterações recentes. O pipeline não comprova a operação do worker, do player ou de anúncios em uma sessão real.

Não foi realizada validação em uma live com Tampermonkey. SSAI aparece nas playlists e pode ser tratado por troca/remoção; CSAI pode ocorrer fora das playlists e os hooks de diagnóstico não garantem bloqueio. Vídeos em iframes de outra origem também podem ficar fora do alcance do script. Qualidade reduzida e pausas durante anúncios continuam possíveis.
