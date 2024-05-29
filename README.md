O gbYT Manager é capaz de reproduzir músicas e vídeos do youtube, cria uma fila de músicas ordenada pelo maior valor pago. Assim que uma música termina a reprodução a próxima da fila inicia, e caso haja erro em reprodução é exibido na tela quais faixas falharam. Há verificação de validade dos links. Pensado nas necessidades de streamers que vendem reproduções de músicas em lives. Há indicativo do valor total arrecadado nas músicas/vídeos, botão para resetar todos os dados e a possibilidade de excluir faixas individualmente.

O gbYT Manager utiliza o LocalStorage para armazenar as músicas da fila e os dados da sessao. Isso permite que as músicas e os dados sejam salvas mesmo quando a página for fechada ou o navegador for recarregado.

### Tecnologias

- [YouTube Player API](https://developers.google.com/youtube/iframe_api_reference?hl=pt)
- [CSS Framework](https://minstyle.io/)