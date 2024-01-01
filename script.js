// Array de nomes (pode ser obtido de uma fonte dinâmica, como um formulário)
var nomes = [];
var numRodadas = 1; // Contador de rodadas

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
  celulaRodada1.innerHTML = '<input type="text" class="resultadoInput" value="100" />';

  // Limpa o campo de entrada
  document.getElementById("novoNome").value = "";
}

// Adiciona uma nova rodada para cada participante na tabela
function adicionarRodada() {
  numRodadas++;

  // Atualiza o cabeçalho da tabela com as novas colunas de rodadas
  var cabecalho = tabela.rows[0];
  var novaColuna = cabecalho.insertCell(-1);
  novaColuna.innerHTML = 'Rodada ' + numRodadas;

  // Para cada jogador, pergunte quantos pontos foram perdidos
  for (var i = 0; i < nomes.length; i++) {
    var jogador = nomes[i];

    // Se o jogador já foi eliminado, continue para o próximo
    if (jogador.eliminado) {
      continue;
    }

    var pontosAnteriores = jogador.pontos;

    // Se o jogador já atingiu 0 pontos ou menos, elimina automaticamente
    if (pontosAnteriores <= 0) {
      jogador.eliminado = true;
      continue;
    }

    // Pede ao usuário que insira os pontos perdidos pelo jogador
    var mensagem = 'Quantos pontos ' + jogador.nome + ' perdeu na Rodada ' + (numRodadas - 1) + '? (Pontuação atual de ' + jogador.nome + ': ' + pontosAnteriores + ')';
    var pontosPerdidos = parseInt(prompt(mensagem)) || 0;

    // Subtrai os pontos perdidos dos pontos anteriores
    var pontosAtualizados = Math.max(0, pontosAnteriores - pontosPerdidos);

    // Atualiza os pontos do jogador
    jogador.pontos = pontosAtualizados;

    // Adiciona um campo de entrada para os resultados na nova rodada
    var celula = tabela.rows[i + 1].insertCell(-1);
    celula.innerHTML = '<input type="text" class="resultadoInput" value="' + pontosAtualizados + '" />';
  }
}

// Adiciona um ouvinte de evento para atualizar os resultados quando o campo de entrada for editado
tabela.addEventListener('input', function (event) {
  var elemento = event.target;
  if (elemento.classList.contains('resultadoInput')) {
    var linha = elemento.closest('tr');
    var nome = linha.cells[0].innerHTML;
    var resultado = elemento.value;
    var rodada = linha.cells.length - 2; // A coluna "Nome" e a coluna "Rodada 1" estão presentes inicialmente
    console.log('Nome: ' + nome + ', Resultado Rodada ' + rodada + ': ' + resultado);
  }
});