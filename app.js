const loginScreen = document.getElementById('loginScreen');
const appShell = document.getElementById('appShell');
const loginForm = document.getElementById('loginForm');
const matriculaLogin = document.getElementById('matriculaLogin');
const matriculaAtiva = document.getElementById('matriculaAtiva');
const sair = document.getElementById('sair');

const form = document.getElementById('reportForm');
const tipo = document.getElementById('tipo');
const epiArea = document.getElementById('epiArea');
const problema = document.getElementById('problema');
const lista = document.getElementById('lista');
const limpar = document.getElementById('limpar');
const onlineStatus = document.getElementById('onlineStatus');
const installBtn = document.getElementById('installBtn');
let deferredPrompt;

const storageKey = 'relatos-pwa-v2';
const sessionKey = 'relatos-matricula-ativa';
const getRelatos = () => JSON.parse(localStorage.getItem(storageKey) || '[]');
const setRelatos = relatos => localStorage.setItem(storageKey, JSON.stringify(relatos));
const getMatricula = () => localStorage.getItem(sessionKey) || '';

function showApp() {
  const matricula = getMatricula();
  if (!matricula) {
    loginScreen.classList.remove('hidden');
    appShell.classList.add('hidden');
    return;
  }
  matriculaAtiva.textContent = matricula;
  loginScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
  render();
}

loginForm.addEventListener('submit', event => {
  event.preventDefault();
  const matricula = matriculaLogin.value.trim();
  if (!matricula) return;
  localStorage.setItem(sessionKey, matricula);
  matriculaLogin.value = '';
  showApp();
});

sair.addEventListener('click', () => {
  localStorage.removeItem(sessionKey);
  showApp();
});

function updateOnlineStatus() {
  const online = navigator.onLine;
  onlineStatus.textContent = online ? 'Online' : 'Offline';
  onlineStatus.classList.toggle('offline', !online);
}

function render() {
  const matricula = getMatricula();
  const relatos = getRelatos().filter(r => r.matricula === matricula);
  if (!relatos.length) {
    lista.className = 'report-list empty';
    lista.textContent = 'Nenhum relato salvo para esta matrícula.';
    return;
  }
  lista.className = 'report-list';
  lista.innerHTML = relatos.map(r => `
    <article class="report-item">
      <strong>${escapeHtml(r.tipo)} • ${escapeHtml(r.problema || 'Sem problema marcado')}</strong>
      <small>Matrícula ${escapeHtml(r.matricula)} • ${escapeHtml(r.nome)} — ${escapeHtml(r.data)}</small>
      <p>${escapeHtml(r.epi ? 'EPI: ' + r.epi : '')}</p>
      <p>${escapeHtml(r.observacao || 'Sem observação')}</p>
    </article>
  `).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

tipo.addEventListener('change', () => {
  epiArea.classList.toggle('hidden', tipo.value !== 'EPIs');
});

document.querySelectorAll('.choice').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.choice').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    problema.value = btn.dataset.problema;
  });
});

form.addEventListener('submit', event => {
  event.preventDefault();
  if (tipo.value === 'EPIs' && !problema.value) {
    alert('Escolha: Não uso ou Uso incorreto.');
    return;
  }
  const relato = {
    matricula: getMatricula(),
    nome: document.getElementById('nome').value.trim(),
    tipo: tipo.value,
    epi: document.getElementById('epi').value,
    problema: problema.value,
    observacao: document.getElementById('observacao').value.trim(),
    data: new Date().toLocaleString('pt-BR')
  };
  const relatos = [relato, ...getRelatos()];
  setRelatos(relatos);
  form.reset();
  problema.value = '';
  document.querySelectorAll('.choice').forEach(b => b.classList.remove('selected'));
  epiArea.classList.add('hidden');
  render();
});

limpar.addEventListener('click', () => {
  if (confirm('Apagar os relatos salvos desta matrícula neste aparelho?')) {
    const matricula = getMatricula();
    const relatosMantidos = getRelatos().filter(r => r.matricula !== matricula);
    setRelatos(relatosMantidos);
    render();
  }
});

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js'));
}

updateOnlineStatus();
showApp();
