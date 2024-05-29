let player;
const queue = [];
const dataSessionKey = 'dataSession';
let currentVideoId;
const divErro = document.getElementById('msgErro');
const granaTotal = document.getElementById('granaTotal');

//Atualiza o valor total de dinheiro exibido na interface.
function atualizaGranaTotal() {
    const exibeGranaTotal = dataSession.total.toFixed(2).replace('.', ',');
    granaTotal.textContent = exibeGranaTotal;
}

//Salva os dados no localStorage.
function saveData(obj) {
    localStorage.setItem(dataSessionKey, JSON.stringify(obj));
}

//Carrega os dados do localStorage.
function loadData() {
    const savedData = localStorage.getItem(dataSessionKey);
    if (savedData) {
        return JSON.parse(savedData);
    } else {
        return { total: 0.0, ordem: 0};
    }
}

let dataSession = loadData();

//Reseta os dados da sessão, a fila de músicas, e atualiza a interface.
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

//Inicializa o player do YouTube.
window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('player', {
        height: '600',
        width: '1280',
        videoId: '4FM7XeaSO0M',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

//Manipulador de erro do player do YouTube.
function onPlayerError(event) {
    currentVideoId = player.getVideoData().video_id;
    console.error('Erro ao reproduzir o vídeo:', event.data);

    if (queue.length > 0) {
        playNext();
    } else {
        console.log('Não há mais músicas na fila.');
    }
    let htmlErro = `<p>Erro ao reproduzir o vídeo:<a href="https://youtu.be/${currentVideoId}" target="_blank">https://youtu.be/${currentVideoId}</a></p>`;
    divErro.innerHTML += htmlErro;
}

//Manipulador de evento quando o player está pronto.
function onPlayerReady(event) {
    playNext();
}

//Manipulador de evento quando o estado do player muda.
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        playNext();
    }
}

//Reinicia o player e recarrega a interface, caso demore pra carregar inicialmente
setTimeout(function() {
    if (!player || !player.getIframe()) {
        location.reload();
    }
}, 3000);

//Adiciona uma música à fila, parâmetros: link do YouTube e valor da música
function addMusic(link, amount) {
    const videoId = getYouTubeVideoId(link);
    amount = amount.toString();
    if (amount.includes(',')) {
        amount = amount.replace(',', '.');        
    }
    amount = parseFloat(amount);

    if (videoId) { //verifica se o link do YouTube é válido
        const wasQueueEmpty = queue.length === 0;
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

        if (wasQueueEmpty) {
            if (player.getPlayerState() === YT.PlayerState.ENDED || player.getPlayerState() === YT.PlayerState.UNSTARTED) {
                playNext();
            }
        }
        checkAndHideQueueTable();
    } else {
        alert('Link do YouTube inválido');
    }
}

// Carrega a lista de músicas da fila quando a página está carregada, se houver algo na lista
window.addEventListener('load', () => {
    checkAndHideQueueTable();
});

//Verifica e esconde a tabela de fila se estiver vazia e mostra se tiver algo
function checkAndHideQueueTable() {
    const queueTable = document.getElementById('queueTable');
    if (queue.length === 0) {
        queueTable.style.display = 'none';
    } else {
        queueTable.style.display = 'table';
    }
}

//Extrai o ID do vídeo do YouTube a partir da URL.
function getYouTubeVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/; // regex para extrair o ID do YouTube
    const match = url.match(regex);
    return match ? match[1] : null;
}

//Reproduz a próxima música na fila.
function playNext() {
    if (queue.length > 0) {
        const next = queue.shift();
        saveQueue();
        renderQueue();
        player.loadVideoById(next.videoId);
    }
}

//Renderiza a fila de músicas na interface.
function renderQueue() {
    const queueTable = document.querySelector('.ms-table tbody');
    queueTable.innerHTML = '';

    //renderiza cada linha da tabela com dados de queue
    queue.forEach((item, index) => {
        const row = document.createElement('tr');

        const linkCell = document.createElement('td');
        const link = document.createElement('a');
        link.href = `https://www.youtube.com/watch?v=${item.videoId}`;
        link.textContent = item.videoId;
        link.target = '_blank'
        linkCell.appendChild(link);

        const ordemCell = document.createElement('td');
        ordemCell.className = 'ms-text-light';
        ordemCell.textContent = item.ordem;

        const valorCell = document.createElement('td');
        valorCell.textContent = `R$ ${item.amount.toFixed(2) }`.replace('.', ',');

        row.appendChild(ordemCell);
        row.appendChild(linkCell);
        row.appendChild(valorCell);

        const deleteCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('ms-btn', 'ms-primary');
        deleteButton.textContent = 'Excluir';
        deleteButton.addEventListener('click', function() {
            removeMusic(index);
        });
        deleteCell.appendChild(deleteButton);

        row.appendChild(deleteCell);

        queueTable.appendChild(row);

    });
    checkAndHideQueueTable();
    atualizaGranaTotal();
}

//Remove uma música da fila.
function removeMusic(index) {
    if (index >= 0 && index < queue.length) {
        const removedItem = queue.splice(index, 1)[0];
        saveQueue();
        renderQueue();
        dataSession.total -= removedItem.amount;
        atualizaGranaTotal();
        saveData(dataSession);
    }
}

//Salva a fila de músicas no localStorage.
function saveQueue() {
    localStorage.setItem('musicQueue', JSON.stringify(queue));
}

//Carrega a fila de músicas do localStorage.
function loadQueue() {
    const savedQueue = localStorage.getItem('musicQueue');
    if (savedQueue) {
        queue.push(...JSON.parse(savedQueue));
        renderQueue();
    }
}


// Adiciona um ouvinte de eventos para o formulário com o ID 'musicForm' que escuta o evento 'submit'
document.getElementById('musicForm').addEventListener('submit', function(event) {
    // Impede o comportamento padrão do formulário de recarregar a página ao ser enviado
    event.preventDefault();

    const link = document.getElementById('youtubeLink').value;
    const amount = parseFloat(document.getElementById('amount').value, 10);

    // Chama a função 'addMusic' com o link e o valor obtidos
    addMusic(link, amount);

    // Limpa os campos de entrada 'youtubeLink' e 'amount' após a submissão do formulário
    document.getElementById('youtubeLink').value = '';
    document.getElementById('amount').value = '';
});

// Define que a função 'loadQueue' será chamada quando a janela (página) terminar de carregar
window.onload = loadQueue;