class NexaKeyApp {
    constructor() {
        this.currentUser = null;
        this.keys = [];
        this.init();
    }

    async init() {
        console.log('🚀 NexaKey iniciando...');
        
        // IMPORTANTE: Loading de apenas 2 segundos máximo
        setTimeout(() => {
            this.hideLoading();
            this.checkAuth();
        }, 2000);
        
        this.setupEventListeners();
    }

    hideLoading() {
        console.log('✅ Ocultando tela de carregamento');
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('app').classList.add('fade-in');
    }

    async checkAuth() {
        const token = localStorage.getItem('nexakey_token');
        if (token) {
            const user = JSON.parse(localStorage.getItem('nexakey_user') || '{}');
            this.currentUser = user;
            this.showDashboard();
        } else {
            this.showAuth();
        }
    }

    showAuth() {
        console.log('🔑 Mostrando tela de autenticação');
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('dashboard-section').classList.add('hidden');
    }

    async showDashboard() {
        console.log('📊 Mostrando dashboard');
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
        
        if (this.currentUser) {
            document.getElementById('user-name').textContent = this.currentUser.name || 'Usuário';
        }
        
        await this.loadKeys();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        // Demo button
        document.getElementById('demo-btn').addEventListener('click', () => {
            this.enterDemoMode();
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // New key button
        document.getElementById('new-key-btn').addEventListener('click', () => {
            this.showNewKeyModal();
        });

        // Modal controls
        document.getElementById('close-modal-btn').addEventListener('click', () => {
            this.hideNewKeyModal();
        });

        document.getElementById('cancel-key-btn').addEventListener('click', () => {
            this.hideNewKeyModal();
        });

        // New key form
        document.getElementById('new-key-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createNewKey();
        });

        // Close modal on outside click
        document.getElementById('new-key-modal').addEventListener('click', (e) => {
            if (e.target.id === 'new-key-modal') {
                this.hideNewKeyModal();
            }
        });
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            console.log('🔐 Tentando fazer login...');
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    console.log('✅ Login bem-sucedido');
                    localStorage.setItem('nexakey_token', data.token);
                    localStorage.setItem('nexakey_user', JSON.stringify(data.user));
                    this.currentUser = data.user;
                    this.showDashboard();
                } else {
                    this.showError('Credenciais inválidas');
                }
            } else {
                this.showError('Erro no servidor');
            }
        } catch (error) {
            console.error('❌ Erro no login:', error);
            this.showError('Erro de conexão');
        }
    }

    enterDemoMode() {
        console.log('🎯 Entrando no modo demo');
        this.currentUser = { name: 'Demo User', email: 'demo@nexakey.com' };
        localStorage.setItem('nexakey_token', 'demo-token');
        localStorage.setItem('nexakey_user', JSON.stringify(this.currentUser));
        this.showDashboard();
    }

    logout() {
        console.log('👋 Fazendo logout');
        localStorage.removeItem('nexakey_token');
        localStorage.removeItem('nexakey_user');
        this.currentUser = null;
        this.keys = [];
        this.showAuth();
    }

    async loadKeys() {
        try {
            console.log('🔑 Carregando chaves...');
            
            const response = await fetch('/api/keys');
            if (response.ok) {
                const data = await response.json();
                this.keys = data.keys || [];
                this.renderKeys();
            } else {
                this.showError('Erro ao carregar chaves');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar chaves:', error);
            this.showError('Erro de conexão ao carregar chaves');
        }
    }

    renderKeys() {
        const keysList = document.getElementById('keys-list');
        
        if (this.keys.length === 0) {
            keysList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-key text-4xl mb-4"></i>
                    <p>Nenhuma chave encontrada</p>
                    <p class="text-sm">Clique em "Nova Chave" para começar</p>
                </div>
            `;
            return;
        }

        keysList.innerHTML = this.keys.map(key => `
            <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition duration-200">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="text-lg font-semibold text-gray-800">${key.name}</h4>
                        <p class="text-sm text-gray-600">Tipo: ${this.getKeyTypeLabel(key.type)}</p>
                        <p class="text-sm text-gray-500">Criado: ${this.formatDate(key.created_at)}</p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <span class="px-2 py-1 text-xs rounded-full ${key.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${key.status === 'active' ? 'Ativa' : 'Inativa'}
                        </span>
                        <button onclick="app.viewKey('${key.id}')" 
                                class="text-indigo-600 hover:text-indigo-800 transition duration-200">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="app.revokeKey('${key.id}')" 
                                class="text-red-600 hover:text-red-800 transition duration-200">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getKeyTypeLabel(type) {
        const labels = {
            'api_key': 'API Key',
            'dev_key': 'Development',
            'test_key': 'Test',
            'prod_key': 'Production'
        };
        return labels[type] || type;
    }

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    }

    showNewKeyModal() {
        document.getElementById('new-key-modal').classList.remove('hidden');
        document.getElementById('key-name').focus();
    }

    hideNewKeyModal() {
        document.getElementById('new-key-modal').classList.add('hidden');
        document.getElementById('new-key-form').reset();
    }

    async createNewKey() {
        const name = document.getElementById('key-name').value;
        const type = document.getElementById('key-type').value;

        try {
            console.log('➕ Criando nova chave...');
            
            const response = await fetch('/api/keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, type })
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    console.log('✅ Chave criada com sucesso');
                    this.hideNewKeyModal();
                    await this.loadKeys();
                    this.showSuccess('Chave criada com sucesso!');
                } else {
                    this.showError('Erro ao criar chave');
                }
            } else {
                this.showError('Erro no servidor');
            }
        } catch (error) {
            console.error('❌ Erro ao criar chave:', error);
            this.showError('Erro de conexão');
        }
    }

    viewKey(keyId) {
        const key = this.keys.find(k => k.id === keyId);
        if (key) {
            alert(`Chave: ${key.name}\nTipo: ${this.getKeyTypeLabel(key.type)}\nStatus: ${key.status}\nID: ${key.id}`);
        }
    }

    revokeKey(keyId) {
        if (confirm('Tem certeza que deseja revogar esta chave?')) {
            console.log('🗑️ Revogando chave:', keyId);
            this.keys = this.keys.filter(k => k.id !== keyId);
            this.renderKeys();
            this.showSuccess('Chave revogada com sucesso!');
        }
    }

    showError(message) {
        console.error('❌ Erro:', message);
        // Simple error display - you could enhance this with a proper notification system
        alert('Erro: ' + message);
    }

    showSuccess(message) {
        console.log('✅ Sucesso:', message);
        // Simple success display - you could enhance this with a proper notification system
        alert(message);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 Inicializando NexaKey App');
    window.app = new NexaKeyApp();
});