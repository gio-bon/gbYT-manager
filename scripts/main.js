//https://developers.google.com/youtube/iframe_api_reference?hl=pt

let player;
const queue = [];
const dataSessionKey = 'dataSession';
let currentVideoId; // Variável global para armazenar o ID do vídeo atual
const divErro = document.getElementById('msgErro'); // Variável global para armazenar o elemento de erro

const granaTotal = document.getElementById('granaTotal');

function atualizaGranaTotal() {
    const exibeGranaTotal = dataSession.total.toFixed(2).replace('.', ',');
    granaTotal.textContent = exibeGranaTotal;
}


// Função para salvar dados no localStorage
function saveData(obj) {
    localStorage.setItem(dataSessionKey, JSON.stringify(obj));
}

// Função para carregar dados do localStorage
function loadData() {
    const savedData = localStorage.getItem(dataSessionKey);
    if (savedData) {
        return JSON.parse(savedData);
    } else {
        return { total: 0.0, ordem: 0};
    }
}

/* O objeto precisa de return JSON.parse(savedData); para ser recuperado corretamente porque o 
localStorage só pode armazenar dados como strings. Quando você salva um objeto no localStorage, 
ele precisa ser convertido em uma string JSON. Da mesma forma, quando você recupera esse dado, ele 
vem como uma string JSON e precisa ser convertido de volta para um objeto JavaScript para ser utilizado 
no seu código. */

// Carrega ou inicializa os dados de sessão
let dataSession = loadData();

// Função para resetar os dados do objeto
function resetData() {
    dataSession = { total: 0.0, ordem: 0};
    saveData(dataSession);
    atualizaGranaTotal();
    queue.length = 0;
    saveQueue();
    renderQueue();

    const queueDiv = document.getElementById('queue');
    queueDiv.innerHTML = '';
    divErro.textContent = '';
    player.stopVideo();
}

const botaoReset = document.getElementById('resetButton');
botaoReset.addEventListener ('click', resetData);

window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('player', {
        height: '600',
        width: '1280',
        videoId: '7rdSlshLV9U&t', // ID do vídeo inicial (pode ser vazio)
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError // Adiciona manipulador de evento para lidar com erros
        }
    });
}

function onPlayerError(event) {
    // Se ocorrer um erro durante a reprodução do vídeo
    currentVideoId = player.getVideoData().video_id;
    console.error('Erro ao reproduzir o vídeo:', event.data);

    // Verifica se há músicas restantes na fila
    if (queue.length > 0) {
        playNext(); // Pula para a próxima música na fila
    } else {
        console.log('Não há mais músicas na fila.'); // Ou qualquer outra ação que você queira executar
    }
    let htmlErro = `<p>Erro ao reproduzir o vídeo:<a href="https://youtu.be/${currentVideoId}" target="_blank">https://youtu.be/${currentVideoId}</a></p>`;
    divErro.innerHTML += htmlErro;
}


function onPlayerReady(event) {
    // O player está pronto, podemos iniciar a reprodução se necessário
    playNext();
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        playNext();
    }
}

// Verifica se o player do YouTube está sendo exibido corretamente após um atraso
setTimeout(function() {
    // Se o player não estiver definido ou não estiver sendo exibido corretamente
    if (!player || !player.getIframe()) {
        // Recarrega a página para tentar exibir o player novamente
        location.reload();
    }
}, 3000);

function addMusic(link, amount) {
    const videoId = getYouTubeVideoId(link);
    amount = amount.toString();
    if (amount.includes(',')) {
        amount = amount.replace(',', '.');        
    }
    amount = parseFloat(amount);

    if (videoId) {
        const wasQueueEmpty = queue.length === 0; // Verifica se a fila estava vazia antes de adicionar a música
        dataSession.total += amount;
        dataSession.ordem += 1;
        const ordem = dataSession.ordem;
        console.log(dataSession.ordem);
        saveData(dataSession);
        atualizaGranaTotal();
        queue.push({ videoId, amount, ordem });
        queue.sort((a, b) => b.amount - a.amount);
        saveQueue();
        renderQueue();

        // Se a fila estava vazia antes de adicionar a música
        if (wasQueueEmpty) {
            // Verifica se o player está no estado de "vazio" (não tocando)
            if (player.getPlayerState() === YT.PlayerState.ENDED || player.getPlayerState() === YT.PlayerState.UNSTARTED) {
                playNext(); // Inicia a reprodução da música adicionada à fila
            }
        }
    } else {
        alert('Link do YouTube inválido');
    }
}



function getYouTubeVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function playNext() {
    if (queue.length > 0) {
        const next = queue.shift();
        saveQueue();
        renderQueue();
        player.loadVideoById(next.videoId);
    }
}

function renderQueue() {
    const queueTable = document.querySelector('.ms-table tbody');
    queueTable.innerHTML = ''; // Limpa o conteúdo existente da tabela

    queue.forEach((item, index) => {
        const row = document.createElement('tr'); // Cria uma nova linha

        // Cria células de dados para cada propriedade do item
        const linkCell = document.createElement('td');
        /* linkCell.textContent = item.videoId; */
        const link = document.createElement('a');
        link.href = `https://www.youtube.com/watch?v=${item.videoId}`; // Ajuste a URL conforme necessário
        link.textContent = item.videoId;
        link.target = '_blank'
        linkCell.appendChild(link);

        const ordemCell = document.createElement('td');
        ordemCell.textContent = item.ordem;

        const valorCell = document.createElement('td');
        valorCell.textContent = `R$ ${item.amount.toFixed(2) }`.replace('.', ',');

        // Adiciona as células à linha
        row.appendChild(linkCell);
        row.appendChild(ordemCell);
        row.appendChild(valorCell);

        // Cria uma célula para o botão de exclusão
        const deleteCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('ms-btn', 'ms-primary');
        deleteButton.textContent = 'Excluir';
        deleteButton.addEventListener('click', function() {
            removeMusic(index); // Chama a função para remover a música ao clicar no botão
        });
        deleteCell.appendChild(deleteButton);

        // Adiciona a célula de exclusão à linha
        row.appendChild(deleteCell);

        // Adiciona a linha à tabela
        queueTable.appendChild(row);
    });

    atualizaGranaTotal();
}


function removeMusic(index) {
    if (index >= 0 && index < queue.length) {
        const removedItem = queue.splice(index, 1)[0]; // Remove o item da fila
        saveQueue();
        renderQueue(); // Renderiza a fila atualizada
        // Atualiza a sessão, removendo o valor da música excluída
        dataSession.total -= removedItem.amount;
        atualizaGranaTotal();
        saveData(dataSession);
    }
}

function saveQueue() {
    localStorage.setItem('musicQueue', JSON.stringify(queue));
}

function loadQueue() {
    const savedQueue = localStorage.getItem('musicQueue');
    if (savedQueue) {
        queue.push(...JSON.parse(savedQueue));
        renderQueue();
    }
}

document.getElementById('musicForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const link = document.getElementById('youtubeLink').value;
    const amount = parseFloat(document.getElementById('amount').value, 10);
    addMusic(link, amount);
    document.getElementById('youtubeLink').value = '';
    document.getElementById('amount').value = '';
});

window.onload = loadQueue;