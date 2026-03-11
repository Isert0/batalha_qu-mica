const CLASSES = [
  { nome: "Cavaleiros Covalentes", icone: "🛡️" },
  { nome: "Viajantes Periódicos", icone: "🧭" },
  { nome: "Feiticeiros Atômicos", icone: "⚛️" },
  { nome: "Bárbaros Moleculares", icone: "🪓" }
];
const CASA_FIM = 18;
let jogadores = [], jogadorAtivo = 0, batalha = null, dadosSorteio = [];

function alternarTela(idVisivel) {
  document.querySelectorAll('.tela').forEach(t => t.classList.add('oculta'));
  document.getElementById(idVisivel).classList.remove('oculta');
}

function sortearClasses() {
  const nomes = [
    document.getElementById('eq1').value.trim() || 'Equipe 1',
    document.getElementById('eq2').value.trim() || 'Equipe 2',
    document.getElementById('eq3').value.trim() || 'Equipe 3',
    document.getElementById('eq4').value.trim() || 'Equipe 4'
  ];
  const misturadas = [...CLASSES].sort(() => Math.random() - 0.5);
  
  dadosSorteio = nomes.map((nome, i) => ({ nome, classe: misturadas[i].nome, icone: misturadas[i].icone }));
  
  const container = document.getElementById('classesSorteadasContainer');
  container.innerHTML = dadosSorteio.map(item => `
    <div class="card-classe">
      <div class="icone-grande">${item.icone}</div>
      <h3>${item.nome}</h3>
      <p><strong>${item.classe}</strong></p>
    </div>
  `).join('');
  
  alternarTela('telaSorteio');
}

function iniciarJogo() {
  jogadores = dadosSorteio.map((d, i) => ({ ...d, id: i, pos: i, posAnterior: i, cor: 'p' + i, ajudaUsada: false }));
  
  document.getElementById('botoesJogadores').innerHTML = jogadores.map(j => `
    <button class="jogador-btn" id="btn-j${j.id}" onclick="selecionarJogador(${j.id})">
      <span style="font-size: 1.5rem;">${j.icone}</span><span>${j.nome}</span>
    </button>`).join('');

  document.getElementById('ajudaContainer').innerHTML = jogadores.map(j => `
    <button class="btn-ajuda" id="ajuda-${j.id}" onclick="usarAjuda(${j.id})">🧙‍♂️ ${j.nome}</button>
  `).join('');

  criarTabuleiro();
  atualizarPecas();
  selecionarJogador(0);
  alternarTela('telaJogo');
}

function usarAjuda(id) {
  const j = jogadores[id];
  if (j.ajudaUsada) return;
  j.ajudaUsada = true;
  document.getElementById(`ajuda-${id}`).disabled = true;

  document.getElementById('mensagemAjuda').innerHTML = `A equipe <strong>${j.nome}</strong> invocou ajuda!<br>Um monitor está a caminho...`;
  const modal = document.getElementById('modalAjuda');
  const conteudo = document.getElementById('conteudoAjuda');
  
  modal.classList.remove('oculta');
  conteudo.classList.remove('fumaca');

  setTimeout(() => {
    conteudo.classList.add('fumaca');
    setTimeout(() => modal.classList.add('oculta'), 1400);
  }, 2500);
}

function criarTabuleiro() {
  const linhas = [4, 5, 4, 3, 2, 1];
  let index = 0, board = document.getElementById('board');
  board.innerHTML = '';

  linhas.forEach((qtd, rowIdx) => {
    let row = `<div class="linha" style="z-index: ${10 - rowIdx}">`;
    for (let i = 0; i < qtd; i++) {
      let isFim = index === CASA_FIM;
      row += `<div class="hex ${isFim ? 'topo' : ''}" data-index="${index}" onclick="clicarCasa(${index})">${isFim ? '🏁' : index}</div>`;
      index++;
    }
    board.innerHTML += row + '</div>';
  });
}

function atualizarPecas() {
  document.querySelectorAll('.piece').forEach(p => p.remove());
  jogadores.forEach(j => {
    const casa = document.querySelector(`[data-index="${j.pos}"]`);
    if (casa) casa.innerHTML += `<div class="piece ${j.cor}" title="${j.nome}">${j.icone}</div>`;
  });
}

function selecionarJogador(id) {
  jogadorAtivo = id;
  document.querySelectorAll('.jogador-btn').forEach(b => b.classList.remove('ativo'));
  document.getElementById(`btn-j${id}`).classList.add('ativo');
}

function clicarCasa(index) {
  if (batalha) return;
  const j = jogadores[jogadorAtivo];
  if (j.pos !== index) j.posAnterior = j.pos;
  j.pos = index;
  atualizarPecas();

  if (index === CASA_FIM) {
    document.querySelector('.topo').style.boxShadow = "0 0 30px #ffd700";
    setTimeout(() => alert(`🏆 A equipe ${j.nome} (${j.classe}) venceu a trilha!`), 300);
  } else {
    verificarBatalha();
  }
}

function verificarBatalha() {
  const atual = jogadorAtivo;
  const oponente = jogadores.findIndex((j, i) => i !== atual && j.pos === jogadores[atual].pos);
  
  if (oponente !== -1) {
    batalha = { a: atual, b: oponente };
    document.getElementById('battleText').innerHTML = `<strong>${jogadores[atual].nome}</strong> invadiu o território de <strong>${jogadores[oponente].nome}</strong>!<br><br>Quem errar a questão volta para a casa anterior.`;
    document.getElementById('battle').classList.remove('oculta');
  }
}

function definirVencedor(tipo) {
  if (tipo === 1) jogadores[batalha.b].pos = jogadores[batalha.b].posAnterior; // Defesa perde
  else jogadores[batalha.a].pos = jogadores[batalha.a].posAnterior; // Invasor perde
  
  batalha = null;
  document.getElementById('battle').classList.add('oculta');
  atualizarPecas();
}
