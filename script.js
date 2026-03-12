// ==================== CONSTANTES ====================
const CLASSES_BASE = [
  { nome: "Cavaleiros Covalentes", icone: "🛡️", imagem: "cavaleiro.jpeg" },
  { nome: "Viajantes Periódicos", icone: "🧭", imagem: "viajante.jpeg" },
  { nome: "Feiticeiros Atômicos", icone: "⚛️", imagem: "feiticeiro.jpeg" },
  { nome: "Bárbaros Moleculares", icone: "🪓", imagem: "barbaro.jpeg" }
];
const CASA_FIM = 18;
const CASAS_BOSS = [16, 17];
const TEMPO_AJUDA = 5 * 60 * 1000;

// ==================== ESTADO GLOBAL ====================
let jogadores = [];
let jogadorAtivo = 0;
let batalha = null;
let bossBattle = null;
let timersAjuda = {};

// ==================== CONTROLE DE TELAS ====================
function mostrarTela(id) {
  document.querySelectorAll('.screen').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ==================== SORTEIO DAS CLASSES ====================
function sortearClasses() {
  const nomes = [
    document.getElementById('eq1').value.trim() || 'P1',
    document.getElementById('eq2').value.trim() || 'P2',
    document.getElementById('eq3').value.trim() || 'P3',
    document.getElementById('eq4').value.trim() || 'P4'
  ];

  const misturadas = [...CLASSES_BASE].sort(() => Math.random() - 0.5);

  window.dadosSorteio = nomes.map((nome, i) => ({
    nome: nome.substring(0, 10),
    classe: misturadas[i].nome,
    icone: misturadas[i].icone,
    imagem: misturadas[i].imagem
  }));

  const container = document.getElementById('classesSorteadasContainer');
  container.innerHTML = window.dadosSorteio.map(item => `
    <div class="draw-card">
      <div class="icon">${item.icone}</div>
      <p style="font-size: 10px; color: #fbf236; margin-bottom: 5px;">${item.nome}</p>
      <p style="font-size: 8px;">${item.classe}</p>
    </div>
  `).join('');

  mostrarTela('telaSorteio');
}

// ==================== INICIAR JOGO ====================
function iniciarJogo() {
  if (!window.dadosSorteio) return;

  jogadores = window.dadosSorteio.map((d, i) => ({
    ...d,
    id: i,
    pos: i,
    posAnterior: i,
    cor: 'p' + i,
    ajudaUsada: false
  }));

  document.getElementById('botoesJogadores').innerHTML = jogadores.map(j => `
    <button class="team-btn" id="btn-j${j.id}" onclick="selecionarJogador(${j.id})">
      ${j.icone} ${j.nome}
    </button>
  `).join('');

  document.getElementById('ajudaContainer').innerHTML = jogadores.map(j => `
    <button class="help-btn" id="ajuda-${j.id}" onclick="usarAjuda(${j.id})">
      🧙‍♂️ ${j.nome} <span id="timer-${j.id}" class="timer"></span>
    </button>
  `).join('');

  criarTabuleiro();
  atualizarPecas();
  selecionarJogador(0);
  mostrarTela('telaJogo');
}

// ==================== TABULEIRO HEX ====================
function criarTabuleiro() {
  const linhas = [4, 5, 4, 3, 2, 1];
  let index = 0;
  const board = document.getElementById('board');
  board.innerHTML = '';

  linhas.forEach((qtd, rowIdx) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.style.zIndex = 10 - rowIdx;

    for (let i = 0; i < qtd; i++) {
      const hex = document.createElement('div');
      let classeExtra = '';
      if (index === 16 || index === 17) {
        classeExtra = 'boss';
      }
      hex.className = `hex ${index === CASA_FIM ? 'topo' : ''} ${classeExtra}`;
      hex.dataset.index = index;
      hex.textContent = index === CASA_FIM ? 'FIM' : index;
      hex.onclick = () => clicarCasa(parseInt(hex.dataset.index));
      row.appendChild(hex);
      index++;
    }
    board.appendChild(row);
  });
}

function atualizarPecas() {
  document.querySelectorAll('.piece').forEach(p => p.remove());

  jogadores.forEach(j => {
    const casa = document.querySelector(`[data-index="${j.pos}"]`);
    if (casa) {
      const piece = document.createElement('div');
      piece.className = `piece ${j.cor}`;
      // Cria imagem
      const img = document.createElement('img');
      img.src = j.imagem;
      img.alt = j.classe;
      piece.appendChild(img);
      piece.title = `${j.nome} - ${j.classe}`;
      casa.appendChild(piece);
    }
  });
}

// ==================== SELEÇÃO DO JOGADOR ATIVO ====================
function selecionarJogador(id) {
  jogadorAtivo = id;
  document.querySelectorAll('.team-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`btn-j${id}`).classList.add('active');
}

// ==================== MOVIMENTAÇÃO ====================
function clicarCasa(index) {
  if (batalha || bossBattle) return;

  const j = jogadores[jogadorAtivo];
  if (j.pos !== index) j.posAnterior = j.pos;
  j.pos = index;
  atualizarPecas();

  if (index === CASA_FIM) {
    document.querySelector('.topo').style.filter = 'brightness(1.5)';
    setTimeout(() => alert(`🏆 A party ${j.nome} (${j.classe}) zerou a dungeon!`), 300);
  } else {
    verificarBoss();
    if (!bossBattle) {
      verificarBatalha();
    }
  }
}

// ==================== SISTEMA DE BATALHA NORMAL ====================
function verificarBatalha() {
  const atual = jogadorAtivo;
  const oponente = jogadores.findIndex((j, i) => i !== atual && j.pos === jogadores[atual].pos);
  if (oponente !== -1) {
    batalha = { a: atual, b: oponente };
    document.getElementById('battleText').innerHTML = `
      <span style="color:#99e550">${jogadores[atual].nome}</span> ${jogadores[atual].icone}<br>VERSUS<br>
      <span style="color:#d95763">${jogadores[oponente].nome}</span> ${jogadores[oponente].icone}
    `;
    // Atualiza os botões com os nomes
    document.getElementById('battleBtn1').innerHTML = `▶ ${jogadores[atual].nome} GANHA`;
    document.getElementById('battleBtn2').innerHTML = `▶ ${jogadores[oponente].nome} GANHA`;
    document.getElementById('battle').style.display = 'flex';
  }
}

function definirVencedor(tipo) {
  if (!batalha) return;

  if (tipo === 1) {
    jogadores[batalha.b].pos = jogadores[batalha.b].posAnterior;
  } else {
    jogadores[batalha.a].pos = jogadores[batalha.a].posAnterior;
  }

  batalha = null;
  document.getElementById('battle').style.display = 'none';
  atualizarPecas();
}

// ==================== SISTEMA DE BOSS ====================
function verificarBoss() {
  const jogador16 = jogadores.find(j => j.pos === 16);
  const jogador17 = jogadores.find(j => j.pos === 17);

  if (jogador16 && jogador17) {
    bossBattle = { a: jogador16.id, b: jogador17.id };
    document.getElementById('bossText').innerHTML = `
      <span style="color:#fbf236">${jogador16.nome}</span> ${jogador16.icone}<br>E<br>
      <span style="color:#fbf236">${jogador17.nome}</span> ${jogador17.icone}<br>
      Estão trancados na sala do Boss!
    `;
    // Atualiza os botões do boss
    document.getElementById('bossBtn1').innerHTML = `▶ ${jogador16.nome} GANHA`;
    document.getElementById('bossBtn2').innerHTML = `▶ ${jogador17.nome} GANHA`;
    document.getElementById('bossBattle').style.display = 'flex';
  }
}

function definirVencedorBoss(tipo) {
  if (!bossBattle) return;

  if (tipo === 1) {
    jogadores[bossBattle.b].pos = jogadores[bossBattle.b].posAnterior;
  } else {
    jogadores[bossBattle.a].pos = jogadores[bossBattle.a].posAnterior;
  }

  bossBattle = null;
  document.getElementById('bossBattle').style.display = 'none';
  atualizarPecas();
}

// ==================== AJUDA DO MESTRE DOS MAGOS ====================
function usarAjuda(id) {
  const botao = document.getElementById(`ajuda-${id}`);
  if (botao.disabled) return;

  const j = jogadores[id];
  const timerSpan = document.getElementById(`timer-${id}`);

  botao.disabled = true;

  const modal = document.getElementById('modalAjuda');
  const conteudo = modal.querySelector('.modal-content');
  document.getElementById('mensagemAjuda').innerHTML = `A party <span style="color:#fbf236">${j.nome}</span> usou invocação!<br>Um monitor está a caminho.`;

  modal.style.display = 'flex';
  conteudo.classList.remove('fumaca');

  setTimeout(() => {
    conteudo.classList.add('fumaca');
    setTimeout(() => {
      modal.style.display = 'none';
      conteudo.classList.remove('fumaca');
    }, 1200);
  }, 3000);

  let segundosRestantes = TEMPO_AJUDA / 1000;
  const intervalo = setInterval(() => {
    segundosRestantes--;
    if (segundosRestantes <= 0) {
      clearInterval(intervalo);
      timerSpan.textContent = '';
      botao.disabled = false;
    } else {
      const mins = Math.floor(segundosRestantes / 60);
      const secs = segundosRestantes % 60;
      timerSpan.textContent = `[${mins}:${secs.toString().padStart(2, '0')}]`;
    }
  }, 1000);

  timersAjuda[id] = intervalo;
}

// ==================== RESET ====================
function resetarJogo() {
  for (let id in timersAjuda) {
    clearInterval(timersAjuda[id]);
  }
  location.reload();
}

// ==================== EXPOR FUNÇÕES GLOBAIS ====================
window.mostrarTela = mostrarTela;
window.sortearClasses = sortearClasses;
window.iniciarJogo = iniciarJogo;
window.selecionarJogador = selecionarJogador;
window.clicarCasa = clicarCasa;
window.definirVencedor = definirVencedor;
window.definirVencedorBoss = definirVencedorBoss;
window.usarAjuda = usarAjuda;
window.resetarJogo = resetarJogo;
