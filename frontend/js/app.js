

// ── Estado da aplicação ──
let state = {
    produtos: [],
    pedidos: [],
    clientes: [] // nomes únicos para autocomplete
};

const STORAGE_KEY = 'AgroPad';

// Filtro de pedidos ativo na aba Pedidos
let currentOrdersFilter = 'todos';

const NOME_MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// ── Utilitários ──
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatCurrency(value) {
    return 'R$ ' + Number(value).toFixed(2).replace('.', ',');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

function cleanPhone(phone) {
    return phone.replace(/\D/g, '');
}

// ── Persistência ──
function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            state.produtos = parsed.produtos || [];
            state.pedidos = parsed.pedidos || [];
            state.clientes = parsed.clientes || [];
        } catch (e) {
            console.error('Erro ao carregar dados:', e);
        }
    }

    // Se não tem produtos, insere os padrão
    if (state.produtos.length === 0) {
        state.produtos = [
            { id: generateId(), nome: 'Chuchu', preco: 0, unidade: 'caixa' },
            { id: generateId(), nome: 'Pitaya', preco: 0, unidade: 'caixa' }
        ];
        saveState();
    }
}

function updateClientesList() {
    const nomes = new Set();
    state.pedidos.forEach(p => nomes.add(p.cliente));
    state.clientes = Array.from(nomes).sort();
}

// ── Navegação ──
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;

            // Atualizar classes do nav
            navItems.forEach(n => n.classList.remove('active'));
            btn.classList.add('active');

            // Mostrar seção
            document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));
            const section = document.getElementById(target);
            if (section) {
                section.classList.add('active');
            }

            // Refresh de listas quando entra na aba
            if (target === 'section-painel') renderDashboard();
            if (target === 'section-pedidos') {
                populateMonthFilter();
                renderAllOrders();
            }
            if (target === 'section-produtos') renderProducts();
            if (target === 'section-novo-pedido') {
                // Se não estiver editando, limpar formulário
                if (!document.getElementById('edit-pedido-id').value) {
                    resetOrderForm();
                }
            }
        });
    });
}

function navigateTo(sectionId) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(n => {
        n.classList.toggle('active', n.dataset.target === sectionId);
    });
    document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));
    const sec = document.getElementById(sectionId);
    if (sec) sec.classList.add('active');
}

// ── DASHBOARD / PAINEL ──
let currentPeriod = 'mes';

function initPeriodFilter() {
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPeriod = btn.dataset.period;
            renderDashboard();
        });
    });
}

function getFilteredOrders() {
    const now = new Date();
    const today = todayStr();

    return state.pedidos.filter(p => {
        if (currentPeriod === 'hoje') return p.data === today;
        if (currentPeriod === 'mes') {
            const pDate = new Date(p.data + 'T00:00:00');
            return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
        }
        return true; // 'tudo'
    });
}

function renderDashboard() {
    const orders = getFilteredOrders();

    let totalFaturamento = 0;
    let totalPendente = 0;
    let totalCxChuchu = 0;
    let totalCxPitaya = 0;

    orders.forEach(p => {
        const status = p.status || 'pago';
        let orderTotal = 0;
        p.itens.forEach(item => {
            const subtotal = item.qtd * item.precoUnitario;
            orderTotal += subtotal;
            const nomeLower = item.produto.toLowerCase();
            if (nomeLower.includes('chuchu')) totalCxChuchu += item.qtd;
            else if (nomeLower.includes('pitaya')) totalCxPitaya += item.qtd;
        });
        totalFaturamento += orderTotal;
        if (status === 'pendente') {
            totalPendente += orderTotal;
        }
    });

    document.getElementById('stat-faturamento').textContent = formatCurrency(totalFaturamento);
    document.getElementById('stat-pendente').textContent = formatCurrency(totalPendente);
    document.getElementById('stat-cx-chuchu').textContent = totalCxChuchu + ' cx';
    document.getElementById('stat-cx-pitaya').textContent = totalCxPitaya + ' cx';
    document.getElementById('stat-pedidos').textContent = orders.length;

    // Período label
    const labels = { 'hoje': 'Hoje', 'mes': 'Este mês', 'tudo': 'Todo o período' };
    document.getElementById('painel-periodo-label').textContent = labels[currentPeriod] || '';

    // Renderizar pendentes de cobrança (todos do sistema, independentemente do filtro)
    const pendentesContainer = document.getElementById('list-pendentes-dashboard');
    if (pendentesContainer) {
        const allPendentes = state.pedidos.filter(p => (p.status || 'pago') === 'pendente')
            .sort((a, b) => b.criadoEm - a.criadoEm);

        if (allPendentes.length === 0) {
            pendentesContainer.innerHTML = `
                <div class="empty-state">
                    <p>Nenhum pedido pendente! 👍</p>
                </div>`;
        } else {
            pendentesContainer.innerHTML = allPendentes.map(p => buildOrderCardHTML(p)).join('');
            attachOrderCardListeners(pendentesContainer);
        }
    }

    // Últimos pedidos (5 mais recentes do período)
    const container = document.getElementById('list-ultimos-pedidos');
    const recent = [...orders].sort((a, b) => b.criadoEm - a.criadoEm).slice(0, 5);

    if (recent.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📝</span>
                <p>Nenhum pedido neste período.</p>
                <p class="empty-hint">Toque em <strong>"+ Anotar"</strong> para começar!</p>
            </div>`;
    } else {
        container.innerHTML = recent.map(p => buildOrderCardHTML(p)).join('');
        attachOrderCardListeners(container);
    }

    // Renderizar Histórico Mensal
    renderMonthlyHistory();
}

function buildOrderCardHTML(pedido) {
    const total = pedido.itens.reduce((s, i) => s + (i.qtd * i.precoUnitario), 0);
    const itemsPreview = pedido.itens.map(i => `${i.qtd}cx ${i.produto}`).join(', ');
    const status = pedido.status || 'pago';
    const statusBadge = status === 'pago'
        ? `<span class="order-status-badge pago">✅ Pago</span>`
        : `<span class="order-status-badge pendente">⏳ Pendente</span>`;

    return `
        <div class="order-card" data-id="${pedido.id}">
            <div class="order-card-top">
                <span class="order-client">${pedido.cliente}</span>
                <span class="order-total">${formatCurrency(total)}</span>
            </div>
            <div class="order-items-preview">${itemsPreview}</div>
            <div class="order-card-bottom">
                <span>📅 ${formatDate(pedido.data)} ${statusBadge}</span>
                <button class="order-whatsapp-mini" data-id="${pedido.id}" title="Enviar WhatsApp">📱</button>
            </div>
        </div>`;
}

function attachOrderCardListeners(container) {
    container.querySelectorAll('.order-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Evitar abrir modal se clicou no whatsapp
            if (e.target.classList.contains('order-whatsapp-mini')) return;
            openOrderModal(card.dataset.id);
        });
    });

    container.querySelectorAll('.order-whatsapp-mini').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            sendWhatsApp(btn.dataset.id);
        });
    });
}

// ── LISTA COMPLETA DE PEDIDOS ──
function renderAllOrders() {
    const container = document.getElementById('all-orders-list');
    const searchVal = (document.getElementById('search-pedidos').value || '').toLowerCase().trim();
    const monthFilterVal = document.getElementById('filter-mes-pedidos').value;

    let filtered = [...state.pedidos].sort((a, b) => b.criadoEm - a.criadoEm);

    // Filtro de Busca
    if (searchVal) {
        filtered = filtered.filter(p => p.cliente.toLowerCase().includes(searchVal));
    }

    // Filtro de Pago/Pendente
    if (currentOrdersFilter !== 'todos') {
        filtered = filtered.filter(p => (p.status || 'pago') === currentOrdersFilter);
    }

    // Filtro por Mês
    if (monthFilterVal !== 'todos') {
        filtered = filtered.filter(p => {
            if (!p.data) return false;
            const [year, monthStr] = p.data.split('-');
            return `${year}-${monthStr}` === monthFilterVal;
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📋</span>
                <p>Nenhum pedido encontrado com os filtros selecionados.</p>
            </div>`;
        return;
    }

    container.innerHTML = filtered.map(p => buildOrderCardHTML(p)).join('');
    attachOrderCardListeners(container);
}

// ── FORMULÁRIO DE PEDIDO ──
function resetOrderForm() {
    document.getElementById('edit-pedido-id').value = '';
    document.getElementById('form-pedido-title').textContent = 'Anotar Pedido';
    document.getElementById('pedido-cliente').value = '';
    document.getElementById('pedido-telefone').value = '';
    document.getElementById('pedido-data').value = todayStr();
    document.getElementById('pedido-obs').value = '';
    document.getElementById('pedido-total-val').textContent = 'R$ 0,00';

    // Reset status to "pago"
    const radioPago = document.querySelector('input[name="pedido-status"][value="pago"]');
    if (radioPago) radioPago.checked = true;

    const list = document.getElementById('order-items-list');
    list.innerHTML = '';
    addOrderItemRow(); // Começa com 1 linha
}

function addOrderItemRow(data = null) {
    const list = document.getElementById('order-items-list');
    const row = document.createElement('div');
    row.className = 'order-item-row';

    const prodOptions = state.produtos.map(p =>
        `<option value="${p.id}" ${data && data.produtoId === p.id ? 'selected' : ''}>${p.nome} (caixa)</option>`
    ).join('');

    row.innerHTML = `
        <div class="item-row-top">
            <select class="item-produto">
                ${prodOptions}
            </select>
            <button type="button" class="btn-remove-item" title="Remover">✕</button>
        </div>
        <div class="item-row-bottom">
            <div class="item-field">
                <label>Qtd. Caixas</label>
                <input type="number" class="item-qtd" min="1" step="1" value="${data ? data.qtd : 1}" inputmode="numeric">
            </div>
            <div class="item-field">
                <label>Preço/Caixa (R$)</label>
                <input type="number" class="item-preco" min="0" step="0.01" value="${data ? data.precoUnitario : ''}" placeholder="0,00" inputmode="decimal">
            </div>
        </div>
        <div class="item-row-price-update">
            <label class="price-update-label">
                <input type="checkbox" class="chk-atualizar-preco" checked>
                <span>Salvar como preço padrão</span>
            </label>
        </div>
        <div class="item-subtotal">= ${data ? formatCurrency(data.qtd * data.precoUnitario) : 'R$ 0,00'}</div>
    `;

    // Auto-fill price from product if no data given
    const select = row.querySelector('.item-produto');
    const precoInput = row.querySelector('.item-preco');

    if (!data) {
        const selectedProd = state.produtos.find(p => p.id === select.value);
        if (selectedProd && selectedProd.preco > 0) {
            precoInput.value = selectedProd.preco;
            updateItemSubtotal(row);
        }
    }

    // When product changes, auto-fill price
    select.addEventListener('change', () => {
        const prod = state.produtos.find(p => p.id === select.value);
        if (prod && prod.preco > 0) {
            precoInput.value = prod.preco;
        }
        updateItemSubtotal(row);
        updateOrderTotal();
    });

    // Recalculate on input
    row.querySelector('.item-qtd').addEventListener('input', () => { updateItemSubtotal(row); updateOrderTotal(); });
    precoInput.addEventListener('input', () => { updateItemSubtotal(row); updateOrderTotal(); });

    // Remove button
    row.querySelector('.btn-remove-item').addEventListener('click', () => {
        row.remove();
        updateOrderTotal();
    });

    list.appendChild(row);
    updateOrderTotal();
}

function updateItemSubtotal(row) {
    const qtd = parseFloat(row.querySelector('.item-qtd').value) || 0;
    const preco = parseFloat(row.querySelector('.item-preco').value) || 0;
    row.querySelector('.item-subtotal').textContent = '= ' + formatCurrency(qtd * preco);
}

function updateOrderTotal() {
    let total = 0;
    document.querySelectorAll('.order-item-row').forEach(row => {
        const qtd = parseFloat(row.querySelector('.item-qtd').value) || 0;
        const preco = parseFloat(row.querySelector('.item-preco').value) || 0;
        total += qtd * preco;
    });
    document.getElementById('pedido-total-val').textContent = formatCurrency(total);
}

function collectOrderItems() {
    const items = [];
    document.querySelectorAll('.order-item-row').forEach(row => {
        const prodId = row.querySelector('.item-produto').value;
        const prod = state.produtos.find(p => p.id === prodId);
        const qtd = parseFloat(row.querySelector('.item-qtd').value) || 0;
        const preco = parseFloat(row.querySelector('.item-preco').value) || 0;
        if (prod && qtd > 0) {
            items.push({
                produtoId: prodId,
                produto: prod.nome,
                qtd: qtd,
                precoUnitario: preco
            });
        }
    });
    return items;
}

function saveOrder() {
    const cliente = document.getElementById('pedido-cliente').value.trim();
    const telefone = document.getElementById('pedido-telefone').value.trim();
    const data = document.getElementById('pedido-data').value;
    const obs = document.getElementById('pedido-obs').value.trim();
    const itens = collectOrderItems();

    if (!cliente) { showToast('Preencha o nome do comprador.'); return; }
    if (itens.length === 0) { showToast('Adicione pelo menos um produto.'); return; }

    const statusRadio = document.querySelector('input[name="pedido-status"]:checked');
    const status = statusRadio ? statusRadio.value : 'pago';

    // Atualizar preços padrões dos produtos se os checkboxes estiverem marcados
    document.querySelectorAll('.order-item-row').forEach(row => {
        const prodId = row.querySelector('.item-produto').value;
        const preco = parseFloat(row.querySelector('.item-preco').value) || 0;
        const chkUpdate = row.querySelector('.chk-atualizar-preco');

        if (chkUpdate && chkUpdate.checked && preco > 0) {
            const prodIdx = state.produtos.findIndex(p => p.id === prodId);
            if (prodIdx !== -1) {
                state.produtos[prodIdx].preco = preco;
            }
        }
    });

    const editId = document.getElementById('edit-pedido-id').value;

    if (editId) {
        // Editar pedido existente
        const idx = state.pedidos.findIndex(p => p.id === editId);
        if (idx !== -1) {
            state.pedidos[idx].cliente = cliente;
            state.pedidos[idx].telefone = telefone;
            state.pedidos[idx].data = data;
            state.pedidos[idx].obs = obs;
            state.pedidos[idx].itens = itens;
            state.pedidos[idx].status = status;
        }
        showToast('Pedido atualizado! ✅');
    } else {
        // Novo pedido
        state.pedidos.push({
            id: generateId(),
            cliente,
            telefone,
            data,
            obs,
            itens,
            status,
            criadoEm: Date.now()
        });
        showToast('Pedido salvo! ✅');
    }

    updateClientesList();
    saveState();
    resetOrderForm();
    navigateTo('section-painel');
    renderDashboard();

    // Ativar nav do painel
    document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.toggle('active', n.dataset.target === 'section-painel');
    });
}

function editOrder(id) {
    const pedido = state.pedidos.find(p => p.id === id);
    if (!pedido) return;

    document.getElementById('edit-pedido-id').value = pedido.id;
    document.getElementById('form-pedido-title').textContent = 'Editar Pedido';
    document.getElementById('pedido-cliente').value = pedido.cliente;
    document.getElementById('pedido-telefone').value = pedido.telefone || '';
    document.getElementById('pedido-data').value = pedido.data;
    document.getElementById('pedido-obs').value = pedido.obs || '';

    // Preencher o status de pagamento
    const status = pedido.status || 'pago';
    const radio = document.querySelector(`input[name="pedido-status"][value="${status}"]`);
    if (radio) radio.checked = true;

    const list = document.getElementById('order-items-list');
    list.innerHTML = '';
    pedido.itens.forEach(item => addOrderItemRow(item));

    navigateTo('section-novo-pedido');
    // Atualizar nav
    document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.toggle('active', n.dataset.target === 'section-novo-pedido');
    });
}

function deleteOrder(id) {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) return;
    state.pedidos = state.pedidos.filter(p => p.id !== id);
    updateClientesList();
    saveState();
    closeModal();
    renderDashboard();
    renderAllOrders();
    showToast('Pedido excluído.');
}

// ── WHATSAPP ──
function sendWhatsApp(orderId) {
    const pedido = state.pedidos.find(p => p.id === orderId);
    if (!pedido) return;

    let msg = `📋 *Pedido - AgroPad*\n`;
    msg += `👤 *Comprador:* ${pedido.cliente}\n`;
    msg += `📅 *Data:* ${formatDate(pedido.data)}\n\n`;
    msg += `📦 *Itens:*\n`;

    let total = 0;
    pedido.itens.forEach(item => {
        const sub = item.qtd * item.precoUnitario;
        total += sub;
        msg += `  • ${item.qtd}x caixa ${item.produto} — ${formatCurrency(item.precoUnitario)}/cx = *${formatCurrency(sub)}*\n`;
    });

    msg += `\n💰 *Total: ${formatCurrency(total)}*\n`;

    if (pedido.obs) {
        msg += `\n📝 *Obs:* ${pedido.obs}\n`;
    }

    msg += `\n_Enviado pelo AgroPad 🌿_`;

    const phone = pedido.telefone ? cleanPhone(pedido.telefone) : '';
    const url = phone
        ? `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
}

// ── MODAL DE DETALHES DO PEDIDO ──
let currentModalOrderId = null;

function openOrderModal(id) {
    const pedido = state.pedidos.find(p => p.id === id);
    if (!pedido) return;

    currentModalOrderId = id;
    const body = document.getElementById('order-modal-body');

    let total = 0;
    const itemsHTML = pedido.itens.map(item => {
        const sub = item.qtd * item.precoUnitario;
        total += sub;
        return `<div class="modal-item-row">
            <span>${item.qtd}x cx ${item.produto}</span>
            <span>${formatCurrency(sub)}</span>
        </div>`;
    }).join('');

    const status = pedido.status || 'pago';
    const statusLabel = status === 'pago' ? '✅ Pago' : '⏳ Pendente';

    body.innerHTML = `
        <div class="modal-detail-row">
            <span class="modal-detail-label">Comprador</span>
            <span class="modal-detail-value">${pedido.cliente}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Status</span>
            <span class="modal-detail-value">${statusLabel}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Data</span>
            <span class="modal-detail-value">${formatDate(pedido.data)}</span>
        </div>
        ${pedido.telefone ? `<div class="modal-detail-row">
            <span class="modal-detail-label">WhatsApp</span>
            <span class="modal-detail-value">${pedido.telefone}</span>
        </div>` : ''}
        <div class="modal-items-section">
            <div class="modal-items-title">Itens</div>
            ${itemsHTML}
        </div>
        <div class="modal-total-row">
            <span>Total</span>
            <span>${formatCurrency(total)}</span>
        </div>
        ${pedido.obs ? `<div class="modal-obs">📝 ${pedido.obs}</div>` : ''}
    `;

    // Configurar botões do modal conforme o status de pagamento
    const btnToggle = document.getElementById('modal-btn-toggle-status');
    const btnCobrar = document.getElementById('modal-btn-cobrar');

    if (status === 'pendente') {
        btnToggle.textContent = '✅ Marcar como Pago';
        btnToggle.className = 'btn btn-success btn-full';
        btnCobrar.classList.remove('hidden');
    } else {
        btnToggle.textContent = '⏳ Marcar como Pendente';
        btnToggle.className = 'btn btn-outline btn-full';
        btnCobrar.classList.add('hidden');
    }

    document.getElementById('order-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('order-modal').classList.remove('active');
    currentModalOrderId = null;
}

// ── PRODUTOS ──
function renderProducts() {
    const container = document.getElementById('products-list');

    if (state.produtos.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum produto cadastrado.</p></div>';
        return;
    }

    container.innerHTML = state.produtos.map(p => `
        <div class="product-item">
            <div class="product-info">
                <span class="product-name">${p.nome}</span>
                <span class="product-price">${p.preco > 0 ? formatCurrency(p.preco) + ' / caixa' : 'Sem preço definido'}</span>
            </div>
            <div class="product-actions">
                <button class="btn-icon-only" data-action="edit" data-id="${p.id}" title="Editar">✏️</button>
                <button class="btn-icon-only" data-action="delete" data-id="${p.id}" title="Excluir">🗑️</button>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', () => editProduct(btn.dataset.id));
    });

    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
    });
}

function saveProduct() {
    const nome = document.getElementById('prod-nome').value.trim();
    const preco = parseFloat(document.getElementById('prod-preco').value) || 0;
    const editId = document.getElementById('edit-produto-id').value;

    if (!nome) { showToast('Preencha o nome do produto.'); return; }

    if (editId) {
        const idx = state.produtos.findIndex(p => p.id === editId);
        if (idx !== -1) {
            state.produtos[idx].nome = nome;
            state.produtos[idx].preco = preco;
        }
        showToast('Produto atualizado! ✅');
    } else {
        state.produtos.push({ id: generateId(), nome, preco, unidade: 'caixa' });
        showToast('Produto salvo! ✅');
    }

    saveState();
    resetProductForm();
    renderProducts();
}

function editProduct(id) {
    const prod = state.produtos.find(p => p.id === id);
    if (!prod) return;

    document.getElementById('edit-produto-id').value = prod.id;
    document.getElementById('prod-nome').value = prod.nome;
    document.getElementById('prod-preco').value = prod.preco || '';
    document.getElementById('btn-cancelar-produto').classList.remove('hidden');
    document.getElementById('btn-salvar-produto').textContent = 'Atualizar';

    // Scroll to form
    document.getElementById('form-produto').scrollIntoView({ behavior: 'smooth' });
}

function deleteProduct(id) {
    if (!confirm('Excluir este produto?')) return;
    state.produtos = state.produtos.filter(p => p.id !== id);
    saveState();
    renderProducts();
    showToast('Produto excluído.');
}

function resetProductForm() {
    document.getElementById('edit-produto-id').value = '';
    document.getElementById('prod-nome').value = '';
    document.getElementById('prod-preco').value = '';
    document.getElementById('btn-cancelar-produto').classList.add('hidden');
    document.getElementById('btn-salvar-produto').textContent = 'Salvar Produto';
}

// ── AUTOCOMPLETE DE CLIENTES ──
function initAutocomplete() {
    const input = document.getElementById('pedido-cliente');
    const list = document.getElementById('cliente-autocomplete-list');

    input.addEventListener('input', () => {
        const val = input.value.toLowerCase().trim();
        list.innerHTML = '';
        if (!val) return;

        const matches = state.clientes.filter(c => c.toLowerCase().includes(val)).slice(0, 5);
        matches.forEach(name => {
            const div = document.createElement('div');
            div.textContent = name;
            div.addEventListener('click', () => {
                input.value = name;
                list.innerHTML = '';

                // Auto-fill phone from last order of this client
                const lastOrder = [...state.pedidos]
                    .filter(p => p.cliente === name && p.telefone)
                    .sort((a, b) => b.criadoEm - a.criadoEm)[0];
                if (lastOrder) {
                    document.getElementById('pedido-telefone').value = lastOrder.telefone;
                }
            });
            list.appendChild(div);
        });
    });

    // Hide autocomplete on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.input-with-autocomplete')) {
            list.innerHTML = '';
        }
    });
}

// ── BACKUP / RESTORE ──
function exportBackup() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AgroPad-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup baixado! 📦');
}

function importBackup(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            if (parsed.pedidos && parsed.produtos) {
                state.produtos = parsed.produtos;
                state.pedidos = parsed.pedidos;
                state.clientes = parsed.clientes || [];
                updateClientesList();
                saveState();
                renderDashboard();
                renderProducts();
                showToast('Dados restaurados com sucesso! ✅');
            } else {
                showToast('Arquivo inválido.');
            }
        } catch (err) {
            showToast('Erro ao ler o arquivo.');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (!confirm('Tem certeza? Isso vai apagar TODOS os pedidos e produtos!')) return;
    if (!confirm('Última chance! Confirma que quer apagar tudo?')) return;
    state.pedidos = [];
    state.produtos = [
        { id: generateId(), nome: 'Chuchu', preco: 0, unidade: 'caixa' },
        { id: generateId(), nome: 'Pitaya', preco: 0, unidade: 'caixa' }
    ];
    state.clientes = [];
    saveState();
    renderDashboard();
    renderProducts();
    showToast('Todos os dados foram apagados.');
}

// ── EVENT LISTENERS ──
function initEventListeners() {
    // Salvar pedido
    document.getElementById('form-pedido').addEventListener('submit', (e) => {
        e.preventDefault();
        saveOrder();
    });

    // Cancelar pedido
    document.getElementById('btn-cancelar-pedido').addEventListener('click', () => {
        resetOrderForm();
        navigateTo('section-painel');
        document.querySelectorAll('.nav-item').forEach(n => {
            n.classList.toggle('active', n.dataset.target === 'section-painel');
        });
    });

    // Adicionar item ao pedido
    document.getElementById('btn-add-item').addEventListener('click', () => addOrderItemRow());

    // Salvar produto
    document.getElementById('form-produto').addEventListener('submit', (e) => {
        e.preventDefault();
        saveProduct();
    });

    // Cancelar edição de produto
    document.getElementById('btn-cancelar-produto').addEventListener('click', resetProductForm);

    // Busca de pedidos
    document.getElementById('search-pedidos').addEventListener('input', renderAllOrders);

    // Chips de filtros na aba Pedidos
    document.querySelectorAll('.filter-chips .filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chips .filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentOrdersFilter = chip.dataset.filter;
            renderAllOrders();
        });
    });

    // Filtro de mês na aba Pedidos
    const filterMes = document.getElementById('filter-mes-pedidos');
    if (filterMes) {
        filterMes.addEventListener('change', renderAllOrders);
    }

    // Modal
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('order-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('order-modal')) closeModal();
    });

    document.getElementById('modal-btn-whatsapp').addEventListener('click', () => {
        if (currentModalOrderId) sendWhatsApp(currentModalOrderId);
    });

    document.getElementById('modal-btn-cobrar').addEventListener('click', () => {
        if (currentModalOrderId) sendWhatsAppCobranca(currentModalOrderId);
    });

    document.getElementById('modal-btn-toggle-status').addEventListener('click', () => {
        if (currentModalOrderId) toggleOrderStatus(currentModalOrderId);
    });

    document.getElementById('modal-btn-editar').addEventListener('click', () => {
        if (currentModalOrderId) {
            closeModal();
            editOrder(currentModalOrderId);
        }
    });

    document.getElementById('modal-btn-excluir').addEventListener('click', () => {
        if (currentModalOrderId) deleteOrder(currentModalOrderId);
    });

    // Backup
    document.getElementById('btn-backup-export').addEventListener('click', exportBackup);
    document.getElementById('btn-backup-import').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importBackup(e.target.files[0]);
            e.target.value = ''; // reset
        }
    });

    // Apagar tudo
    document.getElementById('btn-clear-all').addEventListener('click', clearAllData);
}

// ── FUNÇÕES AUXILIARES DE HISTÓRICO E COBRANÇA ──
function getMonthlyHistory() {
    const monthlyData = {};

    state.pedidos.forEach(p => {
        if (!p.data) return;
        const [year, monthStr] = p.data.split('-');
        const monthKey = `${year}-${monthStr}`;

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                key: monthKey,
                year: parseInt(year),
                month: parseInt(monthStr) - 1,
                total: 0,
                pago: 0,
                pendente: 0,
                chuchu: 0,
                pitaya: 0
            };
        }

        const data = monthlyData[monthKey];
        const status = p.status || 'pago';
        let orderTotal = 0;

        p.itens.forEach(item => {
            const subtotal = item.qtd * item.precoUnitario;
            orderTotal += subtotal;
            const nomeLower = item.produto.toLowerCase();
            if (nomeLower.includes('chuchu')) {
                data.chuchu += item.qtd;
            } else if (nomeLower.includes('pitaya')) {
                data.pitaya += item.qtd;
            }
        });

        data.total += orderTotal;
        if (status === 'pendente') {
            data.pendente += orderTotal;
        } else {
            data.pago += orderTotal;
        }
    });

    return Object.values(monthlyData).sort((a, b) => b.key.localeCompare(a.key));
}

function renderMonthlyHistory() {
    const container = document.getElementById('list-historico-mensal');
    if (!container) return;

    const monthlyHistory = getMonthlyHistory();

    if (monthlyHistory.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhum histórico disponível ainda.</p>
            </div>`;
        return;
    }

    container.innerHTML = monthlyHistory.map(m => {
        const monthName = `${NOME_MESES[m.month]} de ${m.year}`;
        const pctPago = m.total > 0 ? (m.pago / m.total) * 100 : 0;
        const pctPendente = m.total > 0 ? (m.pendente / m.total) * 100 : 0;

        return `
            <div class="monthly-item" data-month-key="${m.key}">
                <div class="monthly-header">
                    <span class="monthly-name">${monthName}</span>
                    <span class="monthly-total">${formatCurrency(m.total)}</span>
                </div>
                <div class="monthly-progress-bar">
                    <div class="progress-pago" style="width: ${pctPago}%" title="Pago: ${formatCurrency(m.pago)}"></div>
                    <div class="progress-pendente" style="width: ${pctPendente}%" title="Pendente: ${formatCurrency(m.pendente)}"></div>
                </div>
                <div class="monthly-details">
                    <div class="monthly-detail-col">
                        <span class="detail-val text-success">${formatCurrency(m.pago)}</span>
                        <span class="detail-lbl">Pago</span>
                    </div>
                    <div class="monthly-detail-col">
                        <span class="detail-val text-warning">${formatCurrency(m.pendente)}</span>
                        <span class="detail-lbl">Pendente</span>
                    </div>
                    <div class="monthly-detail-col">
                        <span class="detail-val">${m.chuchu} cx</span>
                        <span class="detail-lbl">Chuchu</span>
                    </div>
                    <div class="monthly-detail-col">
                        <span class="detail-val">${m.pitaya} cx</span>
                        <span class="detail-lbl">Pitaya</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Listener para clique no histórico mensal
    container.querySelectorAll('.monthly-item').forEach(item => {
        item.addEventListener('click', () => {
            const monthKey = item.dataset.monthKey;
            const select = document.getElementById('filter-mes-pedidos');
            if (select) {
                select.value = monthKey;
            }
            navigateTo('section-pedidos');
            // Atualizar classes de navegação
            document.querySelectorAll('.nav-item').forEach(n => {
                n.classList.toggle('active', n.dataset.target === 'section-pedidos');
            });
            renderAllOrders();
        });
    });
}

function populateMonthFilter() {
    const select = document.getElementById('filter-mes-pedidos');
    if (!select) return;

    const savedValue = select.value;
    select.innerHTML = '<option value="todos">Todos os meses</option>';

    const uniqueMonths = new Set();
    state.pedidos.forEach(p => {
        if (!p.data) return;
        const [year, monthStr] = p.data.split('-');
        uniqueMonths.add(`${year}-${monthStr}`);
    });

    const sortedMonths = Array.from(uniqueMonths).sort().reverse();

    sortedMonths.forEach(mKey => {
        const [year, monthStr] = mKey.split('-');
        const monthName = `${NOME_MESES[parseInt(monthStr) - 1]} de ${year}`;
        const option = document.createElement('option');
        option.value = mKey;
        option.textContent = monthName;
        select.appendChild(option);
    });

    if (Array.from(select.options).some(opt => opt.value === savedValue)) {
        select.value = savedValue;
    } else {
        select.value = 'todos';
    }
}

function toggleOrderStatus(id) {
    const pedido = state.pedidos.find(p => p.id === id);
    if (!pedido) return;

    const currentStatus = pedido.status || 'pago';
    pedido.status = currentStatus === 'pago' ? 'pendente' : 'pago';

    saveState();
    closeModal();
    renderDashboard();
    renderAllOrders();
    showToast(`Pedido marcado como ${pedido.status === 'pago' ? 'Pago ✅' : 'Pendente ⏳'}`);
}

function sendWhatsAppCobranca(orderId) {
    const pedido = state.pedidos.find(p => p.id === orderId);
    if (!pedido) return;

    const total = pedido.itens.reduce((s, i) => s + (i.qtd * i.precoUnitario), 0);
    const itemsPreview = pedido.itens.map(i => `${i.qtd}cx ${i.produto}`).join(', ');

    let msg = `⚠️ *Lembrete de Pagamento - AgroPad*\n\n`;
    msg += `Olá, *${pedido.cliente}*! Passando para lembrar do pedido realizado em *${formatDate(pedido.data)}*:\n`;
    msg += `📦 *Itens:* ${itemsPreview}\n`;
    msg += `💰 *Valor total:* *${formatCurrency(total)}*\n\n`;
    msg += `Se você já efetuou o pagamento, por favor envie o comprovante. Caso contrário, seguem os dados para pagamento. Obrigado! 🙏\n\n`;
    msg += `_Mensagem enviada via AgroPad 🌿_`;

    const phone = pedido.telefone ? cleanPhone(pedido.telefone) : '';
    const url = phone
        ? `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    updateClientesList();
    initNavigation();
    initPeriodFilter();
    initAutocomplete();
    initEventListeners();

    // Set today as default date
    document.getElementById('pedido-data').value = todayStr();

    // Popular filtro de meses inicialmente
    populateMonthFilter();

    // Initial render
    renderDashboard();
    renderProducts();

    // Start with an empty item row on the form
    addOrderItemRow();
});
