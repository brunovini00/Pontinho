// Array de nomes (pode ser obtido de uma fonte dinâmica, como um formulário)
var nomes = [];
var numRodadas = 0; // Contador de rodadas

// Obtém a referência da tabela e do corpo da tabela
var tabela = document.getElementById("tabelaRodadas");
var tbody = tabela.getElementsByTagName("tbody")[0];

// Adiciona as linhas à tabela
function adicionarLinha() {
    var novoNome = document.getElementById("novoNome").value;

    // Verifica se o nome é válido
    if (novoNome.trim() === "") {
        alert("Por favor, insira um nome válido.");
        return;
    }

    nomes.push({ nome: novoNome, pontos: 100, eliminado: false });

    // Adiciona uma nova linha
    var novaLinha = tbody.insertRow(tbody.rows.length);

    // Insere as células na nova linha
    var celulaNome = novaLinha.insertCell(0);
    var celulaRodada1 = novaLinha.insertCell(1);

    // Preenche as células com os dados
    celulaNome.innerHTML = novoNome;

    // Adiciona um campo de entrada para editar os resultados na Rodada 1
    celulaRodada1.innerHTML =
        '<input type="text" class="resultadoInput" value="100" />';

    // Limpa o campo de entrada
    document.getElementById("novoNome").value = "";
}

/// ... (seu código existente)

// Variável para verificar se a primeira rodada foi adicionada
var primeiraRodadaAdicionada = false;

function adicionarRodada() {
    if (nomes.length <= 1) {
        exibirPopup("Adicione pelo menos dois jogadores antes de adicionar rodadas.");
        return;
    }

    numRodadas++;

    if (!primeiraRodadaAdicionada) {
        document.getElementById("novoNome").readOnly = true;
        document.querySelector('button[onclick="adicionarLinha()"]').hidden = true;
        primeiraRodadaAdicionada = true;
    }

    var cabecalho = tabela.rows[0];
    var th = document.createElement("th");
    th.innerHTML = "Rodada " + numRodadas;
    cabecalho.appendChild(th);

    for (var i = 0; i < nomes.length; i++) {
        var jogador = nomes[i];

        // Verifica se o jogador foi eliminado em rodadas anteriores
        if (jogador.eliminado) {
            var celulaEliminado = tabela.rows[i + 1].insertCell(-1);
            celulaEliminado.innerHTML = '☠️';  // Emoji de caveira para jogador já eliminado
            celulaEliminado.classList.add('eliminado');
            continue;  // Pula para o próximo jogador, pois este já está eliminado
        }

        var pontosAnteriores = jogador.pontos;
        if (pontosAnteriores <= 0) {
            jogador.eliminado = true;
            jogador.pontos = 0;
            tabela.rows[i + 1].cells[0].classList.add("eliminado");

            var celula = tabela.rows[i + 1].insertCell(-1);
            celula.innerHTML = '☠️';  // Emoji de caveira para jogador eliminado
            celula.classList.add("eliminado");
            continue;
        }

        // Solicita a pontuação perdida do jogador
        var mensagem = "Quantos pontos " + jogador.nome + " perdeu na Rodada " + numRodadas + "? (Pontuação atual: " + pontosAnteriores + ")";
        var pontosPerdidos = parseInt(prompt(mensagem)) || 0;
        var pontosAtualizados = Math.max(0, pontosAnteriores - pontosPerdidos);

        jogador.pontos = pontosAtualizados;
        var celula = tabela.rows[i + 1].insertCell(-1);

        if (jogador.pontos === 0) {
            celula.innerHTML = '☠️';  // Emoji de caveira para jogador eliminado
            jogador.eliminado = true;
            tabela.rows[i + 1].cells[0].classList.add("eliminado");
            celula.classList.add("eliminado");
        } else {

            if (pontosPerdidos === 0) {

                celula.innerHTML = '<input type="text" class="resultadoInput" value="' + pontosAtualizados + " 🏆" + '" />';
                
            } else {
                
                celula.innerHTML = '<input type="text" class="resultadoInput" value="' + pontosAtualizados + '" />';
    
            }
        }
    }
}


// Adiciona um ouvinte de evento para atualizar os resultados quando o campo de entrada for editado
tabela.addEventListener("input", function (event) {
    var elemento = event.target;
    if (elemento.classList.contains("resultadoInput")) {
        var linha = elemento.closest("tr");
        var nome = linha.cells[0].innerHTML;
        var resultado = elemento.value;
        var rodada = linha.cells.length - 2; // A coluna "Nome" e a coluna "Rodada 1" estão presentes inicialmente
        console.log(
            "Nome: " + nome + ", Resultado Rodada " + rodada + ": " + resultado
        );
    }
});

// Função para resetar todos os pontos para 100 com confirmação
function resetarPontos() {
    // Pede confirmação ao usuário
    var confirmacao = confirm("Tem certeza de que deseja resetar os pontos para todos os jogadores?");

    if (confirmacao) {
        // Permite que novos jogadores sejam adicionados novamente
        document.getElementById("novoNome").readOnly = false;
        document.querySelector('button[onclick="adicionarLinha()"]').hidden = false;

        // Itera sobre a lista de nomes e redefine os pontos para 100 e status eliminado para false
        for (var i = 0; i < nomes.length; i++) {
            nomes[i].pontos = 100;
            nomes[i].eliminado = false;
        }

        // Reinicia o número de rodadas para 0
        numRodadas = 0;

        // Remove todas as colunas de rodadas, exceto a primeira
        var numColunas = tabela.rows[0].cells.length;
        for (var j = numColunas - 1; j > 1; j--) {
            for (var k = 0; k < tabela.rows.length; k++) {
                tabela.rows[k].deleteCell(j);
            }
        }

        // Remove as classes de eliminação (e caveiras) dos jogadores na tabela
        for (var l = 1; l < tabela.rows.length; l++) {
            // Remove a classe "eliminado" da célula do nome do jogador
            tabela.rows[l].cells[0].classList.remove("eliminado");

            // Redefine a célula da primeira rodada com 100 pontos e um campo de input
            tabela.rows[l].cells[1].innerHTML = '<input type="text" class="resultadoInput" value="100" />';
        }

        // Exibe mensagem informativa
        alert("Pontos resetados para 100 em todas as rodadas. A contagem de rodadas foi reiniciada. As colunas de rodadas foram removidas.");
    } else {
        alert("Reset de pontos cancelado.");
    }
}


// Função para exibir pop-ups
function exibirPopup(mensagem) {
    var popup = document.createElement("div");
    popup.className = "popup";

    // Substitua a classe do ícone de alerta pela imagem abaixo do texto
    popup.innerHTML =
        '<div class="popup-content">' +
        '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 10%">' +
        mensagem +
        '<br /><img src="https://cdn-icons-png.flaticon.com/128/3253/3253156.png" alt="Icon" style="width: 50px; height: 50px;">' +
        "</div>" +
        "</div>";

    document.body.appendChild(popup);

    // Adiciona sombra e borda à div do pop-up
    popup.style.boxShadow = "0 4px 8px #888"; // Cor sólida sem transparência
    popup.style.border = "1px solid #ccc";
    popup.style.borderRadius = "8px";

    // Define largura para 80% e altura para 20%
    popup.style.width = "80%";
    popup.style.height = "20%";

    // Centraliza o pop-up na tela
    popup.style.position = "fixed";
    popup.style.left = "50%";
    popup.style.top = "50%";
    popup.style.transform = "translate(-50%, -50%)";

    // Aumenta a fonte e centraliza o texto
    popup.style.fontSize = "1.5em";
    popup.style.textAlign = "center"; // Centraliza o texto

    // Define um fundo sólido
    popup.style.backgroundColor = "#fff";

    // Adiciona a classe de animação após um pequeno atraso
    setTimeout(function () {
        popup.style.transition = "top 0.5s ease-in-out"; // Adiciona transição para top
        popup.style.top = "50%"; // Move para o centro
    }, 10);

    // Remove o pop-up após 3 segundos (ajuste conforme necessário)
    setTimeout(function () {
        popup.remove();
    }, 3000);
}

// Adicione ao seu JavaScript existente

// Adicione isso ao seu script.js existente
document.addEventListener("DOMContentLoaded", function () {
    const toggleTheme = document.getElementById("toggleTheme");

    toggleTheme.addEventListener("change", function () {
        document.body.classList.toggle("dark-theme", toggleTheme.checked);
    });
});
