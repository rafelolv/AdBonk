# TwitchLivre

Continuação independente de [TwitchAdSolutions, por pixeltris](https://github.com/pixeltris/TwitchAdSolutions), com a base atualizada do [fork de ryanbr](https://github.com/ryanbr/TwitchAdSolutions). Mantido por [rafelolv](https://github.com/rafelolv).

O foco inicial é o **vaft estável**: ele intercepta playlists de transmissão da Twitch e procura uma transmissão alternativa sem anúncios. Quando não encontra, pode remover segmentos de anúncios; isso pode causar pausa, buffering ou redução temporária de qualidade.

## Instalar no Tampermonkey

**Publicação pendente:** os links abaixo funcionarão depois que `rafelolv/TwitchLivre` receber o código. Para testar agora, use a instalação manual.

1. Instale o [Tampermonkey](https://www.tampermonkey.net/) no navegador.
2. No Chrome 138+ com Tampermonkey 5.3+, habilite **Permitir scripts de usuário** nos detalhes da extensão. O modo de desenvolvedor é uma alternativa; veja a [instrução oficial](https://www.tampermonkey.net/faq.php?q=Q209).
3. Desative outras soluções específicas de bloqueio de anúncios da Twitch, incluindo scripts antigos e a regra `twitch.tv##+js(twitch-videoad)` se instalada no uBlock Origin. Use apenas uma variante de bloqueio deste projeto por vez.
4. Após a publicação, abra [Instalar TwitchLivre — vaft estável](https://raw.githubusercontent.com/rafelolv/TwitchLivre/master/vaft/vaft.user.js) e confirme **Instalar**.
5. Recarregue uma live da Twitch. No console (F12), procure `[AD DEBUG]` para confirmar o carregamento.

**Instalação manual agora:** no painel do Tampermonkey, clique em **Adicionar novo script**, apague o exemplo, cole todo o conteúdo de [`vaft/vaft.user.js`](vaft/vaft.user.js) e salve com Ctrl+S. Deixe o script ativado e recarregue a live. O arquivo termina em `.user.js`; a versão `-ublock-origin.js` não serve para o Tampermonkey. [Documentação oficial de instalação](https://www.tampermonkey.net/faq.php?q=Q102).

`@updateURL` e `@downloadURL` apontam para este projeto. O Tampermonkey poderá buscar novas versões após a publicação; você também pode solicitar uma verificação no painel. Alterações locais no editor precisam ser salvas e seguidas de recarga da live.

## Variantes

| Arquivo | Uso |
| --- | --- |
| `vaft/vaft.user.js` | Principal, estável, ponto de partida para manutenção |
| `vaft/vaft-ublock-origin.js` | Mesma família de lógica, formato para uBlock Origin |
| `vaft/vaft_testing.user.js` | Experimental; testar separadamente |
| `video-swap-new/` | Alternativa legada, preservada para comparação |
| `strip/strip.user.js` | Estratégia de remoção de segmentos |
| `vaft/twitch-brave-fix.user.js` | Complemento opcional para Brave; fora da instalação inicial |

## Desenvolvimento

Requer Node.js 24. Não há dependências npm para validar a base:

```bash
npm run check
```

O comando verifica a sintaxe de todos os arquivos JavaScript e executa os testes herdados. Os testes do upstream usam cópias de funções e não substituem a validação do script real em uma live.

Consulte [a comparação da base](docs/BASELINE.md), [manutenção e publicação](docs/MAINTENANCE.md), [changelog histórico](CHANGELOG.md) e [diagnóstico do upstream](DEBUG.md). A [documentação original do ryanbr](docs/README-ryanbr.md) foi preservada como referência histórica; seus links de instalação apontam para o projeto dele.

## Créditos e licença

Histórico Git e licença MIT preservados. Créditos a pixeltris, ryanbr, cleanlock e demais colaboradores. As mudanças iniciais ajustam identidade, atualização, documentação e automação; o comportamento dos scripts foi importado sem alterações. Veja [LICENSE](LICENSE).
