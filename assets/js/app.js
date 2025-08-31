/**
 * Neo Shop - Product Catalog Application
 * 
 * Aplicação responsável por carregar e exibir o catálogo de produtos
 * com funcionalidades de visualização detalhada via modal.
 */

class ProductCatalog {
    constructor() {
        // Elementos do DOM
        this.elements = {
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            productsGrid: document.getElementById('productsGrid'),
            retryBtn: document.getElementById('retryBtn'),
            modal: document.getElementById('productModal'),
            modalOverlay: document.getElementById('modalOverlay'),
            modalClose: document.getElementById('modalClose'),
            modalBody: document.getElementById('modalBody'),
            searchInput: document.getElementById('searchInput'),
            searchButton: document.getElementById('searchButton'),
            clearSearch: document.getElementById('clearSearch'),
            searchResultsInfo: document.getElementById('searchResultsInfo'),
            resultsCount: document.getElementById('resultsCount'),
            clearAllFilters: document.getElementById('clearAllFilters')
        };

        // Estado da aplicação
        this.products = [];
        this.filteredProducts = [];
        this.isLoading = false;
        this.currentSearchTerm = '';

        // Inicializar aplicação
        this.init();
    }

    /**
     * Inicializa a aplicação configurando event listeners e carregando produtos
     */
    init() {
        this.setupEventListeners();
        this.loadProducts();
    }

    /**
     * Configura todos os event listeners da aplicação
     */
    setupEventListeners() {
        // Botão de retry
        this.elements.retryBtn?.addEventListener('click', () => {
            this.loadProducts();
        });

        // Modal - fechar ao clicar no overlay ou botão close
        this.elements.modalOverlay?.addEventListener('click', () => {
            this.closeModal();
        });

        this.elements.modalClose?.addEventListener('click', () => {
            this.closeModal();
        });

        // Modal - fechar com ESC
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !this.elements.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });

        // Prevenir propagação de cliques no conteúdo do modal
        this.elements.modal?.querySelector('.modal-content')?.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        // Event listeners de busca
        this.setupSearchListeners();
    }

    /**
     * Carrega os produtos da API do Baserow
     */
    async loadProducts() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading();

        try {
            // Verificar se o serviço da API está disponível
            if (!window.ApiService) {
                throw new Error('Serviço da API não está disponível');
            }

            // Testar conexão primeiro
            const connectionTest = await window.ApiService.testConnection();
            if (!connectionTest) {
                throw new Error('Não foi possível conectar com a API. Verifique sua conexão ou configuração.');
            }

            // Buscar produtos da API
            const apiProducts = await window.ApiService.fetchProducts();
            
            if (!Array.isArray(apiProducts) || apiProducts.length === 0) {
                throw new Error('Nenhum produto público encontrado na API');
            }

            // Filtrar produtos válidos e públicos
            const validProducts = apiProducts.filter(product => {
                return product && 
                       product.public === true && 
                       product.title && 
                       product.description && 
                       product.price > 0;
            });

            if (validProducts.length === 0) {
                throw new Error('Nenhum produto válido encontrado');
            }

            // Ordenar produtos por campo 'order' se disponível
            validProducts.sort((a, b) => (a.order || 0) - (b.order || 0));

            this.products = validProducts;
            this.filteredProducts = [...this.products];
            this.renderProducts();
            this.updateResultsInfo();

            console.log(`${this.products.length} produtos carregados com sucesso da API`);

        } catch (error) {
            console.error('Erro ao carregar produtos da API:', error);
            
            // Tentar fallback para arquivo JSON local
            await this.loadProductsFromJSON(error.message);
            
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Fallback: carrega produtos do arquivo JSON local
     * @param {string} apiError - Mensagem de erro da API
     */
    async loadProductsFromJSON(apiError) {
        try {
            console.warn('Tentando fallback para arquivo JSON local:', apiError);
            
            const response = await fetch('./data/products.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!this.validateProductsData(data)) {
                throw new Error('Dados do arquivo JSON são inválidos');
            }

            this.products = data.products;
            this.filteredProducts = [...this.products];
            this.renderProducts();
            this.updateResultsInfo();

            // Mostrar aviso sobre uso do fallback
            this.showApiWarning(apiError);

        } catch (jsonError) {
            console.error('Erro no fallback JSON:', jsonError);
            this.showError(`API indisponível: ${apiError}. Arquivo local também falhou: ${jsonError.message}`);
        }
    }

    /**
     * Valida a estrutura dos dados dos produtos
     * @param {Object} data - Dados recebidos do JSON
     * @returns {boolean} - True se os dados são válidos
     */
    validateProductsData(data) {
        if (!data || !Array.isArray(data.products)) {
            return false;
        }

        return data.products.every(product => 
            product &&
            typeof product.id !== 'undefined' &&
            typeof product.title === 'string' &&
            typeof product.description === 'string' &&
            Array.isArray(product.gallery) &&
            typeof product.price === 'number' &&
            product.price >= 0
        );
    }

    /**
     * Renderiza todos os produtos na grid
     */
    renderProducts() {
        if (!this.elements.productsGrid) return;

        const productsHTML = this.filteredProducts.map(product => 
            this.createProductCard(product)
        ).join('');

        this.elements.productsGrid.innerHTML = productsHTML;

        // Adicionar event listeners aos cards de produto
        this.setupProductCardListeners();

        this.showProducts();
    }

    /**
     * Cria o HTML de um card de produto
     * @param {Object} product - Objeto do produto
     * @returns {string} - HTML do card
     */
    createProductCard(product) {
        // Sanitizar dados para prevenir XSS
        const safeProduct = this.sanitizeProductData(product);
        
        const mainImage = safeProduct.gallery[0] || 'https://via.placeholder.com/300x250?text=Sem+Imagem';
        const galleryCount = safeProduct.gallery.length;
        
        // Formatar preços
        const originalPrice = this.formatPrice(safeProduct.price);
        const promoPrice = safeProduct.promotionalPrice ? this.formatPrice(safeProduct.promotionalPrice) : null;
        const displayPrice = promoPrice || originalPrice;

        return `
            <article class="product-card" data-product-id="${safeProduct.id}" tabindex="0" role="button" aria-label="Ver detalhes de ${safeProduct.title}">
                ${galleryCount > 1 ? `<div class="product-gallery-indicator">${galleryCount} fotos</div>` : ''}
                <img 
                    src="${mainImage}" 
                    alt="${safeProduct.title}"
                    class="product-image"
                    loading="lazy"
                    onerror="this.src='https://via.placeholder.com/300x250?text=Erro+ao+carregar'"
                >
                <div class="product-content">
                    <div class="product-header">
                        <h2 class="product-title">${safeProduct.title}</h2>
                        <div class="product-subtitle-container">
                            ${safeProduct.subtitle ? `<p class="product-subtitle">${safeProduct.subtitle}</p>` : '<div class="product-subtitle-spacer"></div>'}
                        </div>
                    </div>
                    <p class="product-description">${safeProduct.description}</p>
                    <div class="product-pricing">
                        ${promoPrice ? `
                            <div class="price-container">
                                <span class="original-price">R$ ${originalPrice}</span>
                                <span class="promotional-price">R$ ${promoPrice}</span>
                            </div>
                        ` : `
                            <div class="price-container">
                                <span class="current-price">R$ ${originalPrice}</span>
                            </div>
                        `}
                    </div>
                    <div class="product-actions">
                        <button class="btn-eu-quero" data-product-id="${safeProduct.id}" data-product-title="${safeProduct.title}" data-product-price="${displayPrice}">
                            Eu quero
                        </button>
                        <button class="btn-ver-fotos" data-product-id="${safeProduct.id}">
                            Ver fotos
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    /**
     * Sanitiza os dados do produto para prevenir XSS
     * @param {Object} product - Produto original
     * @returns {Object} - Produto com dados sanitizados
     */
    sanitizeProductData(product) {
        return {
            id: parseInt(product.id) || 0,
            title: this.escapeHtml(String(product.title || '')),
            subtitle: product.subtitle ? this.escapeHtml(String(product.subtitle)) : null,
            description: this.escapeHtml(String(product.description || '')),
            gallery: Array.isArray(product.gallery) ? product.gallery.map(url => String(url)) : [],
            price: parseFloat(product.price) || 0,
            promotionalPrice: product.promotionalPrice ? parseFloat(product.promotionalPrice) : null
        };
    }

    /**
     * Escapa caracteres HTML para prevenir XSS
     * @param {string} text - Texto para escapar
     * @returns {string} - Texto escapado
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Formata o preço para exibição
     * @param {number} price - Preço numérico
     * @returns {string} - Preço formatado
     */
    formatPrice(price) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    }

    /**
     * Configura event listeners para os cards de produtos
     */
    setupProductCardListeners() {
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            // Click event no card (exceto nos botões)
            card.addEventListener('click', (event) => {
                // Não abrir modal se clicou em um botão
                if (event.target.classList.contains('btn-eu-quero') || 
                    event.target.classList.contains('btn-ver-fotos')) {
                    return;
                }
                const productId = parseInt(card.dataset.productId);
                this.openProductModal(productId);
            });

            // Keyboard event (Enter)
            card.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    const productId = parseInt(card.dataset.productId);
                    this.openProductModal(productId);
                }
            });
        });

        // Event listeners para os botões "Eu quero"
        document.querySelectorAll('.btn-eu-quero').forEach(btn => {
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                const productId = btn.dataset.productId;
                const productTitle = btn.dataset.productTitle;
                const productPrice = btn.dataset.productPrice;
                this.handleEuQuero(productId, productTitle, productPrice);
            });
        });

        // Event listeners para os botões "Ver fotos"
        document.querySelectorAll('.btn-ver-fotos').forEach(btn => {
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                const productId = parseInt(btn.dataset.productId);
                this.openProductModal(productId);
            });
        });
    }

    /**
     * Abre o modal com detalhes do produto
     * @param {number} productId - ID do produto
     */
    openProductModal(productId) {
        const product = this.products.find(p => p.id === productId);
        
        if (!product) {
            console.error('Produto não encontrado:', productId);
            return;
        }

        const safeProduct = this.sanitizeProductData(product);
        this.renderProductModal(safeProduct);
        this.showModal();
    }

    /**
     * Renderiza o conteúdo do modal do produto
     * @param {Object} product - Produto sanitizado
     */
    renderProductModal(product) {
        if (!this.elements.modalBody) return;

        // Imagem principal (primeira da galeria)
        const mainImage = product.gallery[0] || 'https://via.placeholder.com/500x500?text=Sem+Imagem';
        
        // Imagens secundárias (restantes da galeria)
        const secondaryImages = product.gallery.slice(1);
        
        // Gerar HTML das imagens secundárias
        const secondaryImagesHTML = secondaryImages.map((imageUrl, index) => `
            <div class="gallery-thumb" data-image-index="${index + 1}">
                <img 
                    src="${imageUrl}" 
                    alt="${product.title} - Imagem ${index + 2}"
                    loading="lazy"
                    onerror="this.src='https://via.placeholder.com/80x80?text=Erro'"
                >
            </div>
        `).join('');

        const formattedPrice = this.formatPrice(product.price);
        const formattedPromoPrice = product.promotionalPrice ? this.formatPrice(product.promotionalPrice) : null;
        const displayPrice = formattedPromoPrice || formattedPrice;

        this.elements.modalBody.innerHTML = `
            <div class="product-modal">
                <!-- Galeria -->
                <div class="product-gallery">
                    <div class="main-image-container">
                        <img 
                            id="mainProductImage"
                            src="${mainImage}" 
                            alt="${product.title}"
                            loading="lazy"
                            onerror="this.src='https://via.placeholder.com/500x500?text=Erro+ao+carregar'"
                        >
                    </div>
                    
                    ${product.gallery.length > 1 ? `
                        <div class="image-thumbnails">
                            <div class="gallery-thumb active" data-image-index="0">
                                <img src="${mainImage}" alt="${product.title} - Principal">
                            </div>
                            ${secondaryImagesHTML}
                        </div>
                    ` : ''}
                </div>
                
                <!-- Informações do Produto -->
                <div class="product-info">
                    <div class="product-header">
                        <h1 class="product-title">${product.title}</h1>
                        ${product.subtitle ? `<p class="product-subtitle">${product.subtitle}</p>` : ''}
                    </div>
                    
                    <div class="price-section">
                        ${formattedPromoPrice ? `
                            <div class="modal-price-container">
                                <span class="modal-original-price">R$ ${formattedPrice}</span>
                                <span class="modal-promotional-price">R$ ${formattedPromoPrice}</span>
                            </div>
                        ` : `
                            <span class="modal-current-price">R$ ${formattedPrice}</span>
                        `}
                    </div>
                    
                    <div class="description-section">
                        <h3>Descrição</h3>
                        <p class="description">${product.description}</p>
                    </div>
                    
                    <div class="action-section">
                        <button class="buy-button" data-product-id="${product.id}" data-product-title="${product.title}" data-product-price="${displayPrice}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.785"/>
                            </svg>
                            Tenho interesse
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Configurar event listeners
        this.setupCleanModalListeners();
    }

    /**
     * Exibe o modal
     */
    showModal() {
        if (this.elements.modal) {
            this.elements.modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevenir scroll do body
            
            // Focar no botão de fechar para acessibilidade
            this.elements.modalClose?.focus();
        }
    }

    /**
     * Fecha o modal
     */
    closeModal() {
        if (this.elements.modal) {
            this.elements.modal.classList.add('hidden');
            document.body.style.overflow = ''; // Restaurar scroll do body
        }
    }

    /**
     * Exibe o estado de loading
     */
    showLoading() {
        this.elements.loading?.classList.remove('hidden');
        this.elements.error?.classList.add('hidden');
        this.elements.productsGrid?.classList.add('hidden');
    }

    /**
     * Exibe o estado de erro
     * @param {string} customMessage - Mensagem personalizada de erro
     */
    showError(customMessage = null) {
        this.elements.loading?.classList.add('hidden');
        this.elements.error?.classList.remove('hidden');
        this.elements.productsGrid?.classList.add('hidden');
        
        if (customMessage && this.elements.error) {
            const errorContent = this.elements.error.querySelector('.error-content p');
            if (errorContent) {
                errorContent.textContent = customMessage;
            }
        }
    }

    /**
     * Mostra aviso sobre uso da API de fallback
     * @param {string} apiError - Erro da API principal
     */
    showApiWarning(apiError) {
        const warningElement = document.createElement('div');
        warningElement.className = 'api-warning';
        warningElement.innerHTML = `
            <div class="warning-content">
                <strong>⚠️ Modo Offline</strong>
                <p>Conectando com a API: ${apiError}</p>
                <p>Usando dados locais temporariamente.</p>
                <button class="warning-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Inserir no topo da página
        const main = document.querySelector('.main');
        if (main) {
            main.insertBefore(warningElement, main.firstChild);
        }
        
        // Auto-remover após 10 segundos
        setTimeout(() => {
            if (warningElement.parentNode) {
                warningElement.remove();
            }
        }, 10000);
    }

    /**
     * Exibe a grid de produtos
     */
    showProducts() {
        this.elements.loading?.classList.add('hidden');
        this.elements.error?.classList.add('hidden');
        this.elements.productsGrid?.classList.remove('hidden');
    }

    /**
     * Atualiza o contador de produtos
     */
    updateResultsInfo() {
        const total = this.products.length;
        const filtered = this.filteredProducts.length;
        
        if (this.elements.resultsCount) {
            if (this.currentSearchTerm) {
                this.elements.resultsCount.textContent = 
                    filtered === 1 
                        ? `1 resultado encontrado de ${total} produtos`
                        : `${filtered} resultados encontrados de ${total} produtos`;
                        
                this.elements.searchResultsInfo?.classList.remove('hidden');
                this.elements.clearAllFilters?.classList.toggle('hidden', !this.currentSearchTerm);
            } else {
                this.elements.searchResultsInfo?.classList.add('hidden');
            }
        }
    }

    /**
     * Configura event listeners para a busca
     */
    setupSearchListeners() {
        // Input de busca com debounce
        let searchTimeout;
        this.elements.searchInput?.addEventListener('input', (event) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.handleSearch(event.target.value);
            }, 300);
        });

        // Botão de busca
        this.elements.searchButton?.addEventListener('click', () => {
            this.handleSearch(this.elements.searchInput.value);
        });

        // Enter no campo de busca
        this.elements.searchInput?.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.handleSearch(this.elements.searchInput.value);
            }
        });

        // Botão limpar busca
        this.elements.clearSearch?.addEventListener('click', () => {
            this.clearSearch();
        });

        // Botão limpar todos os filtros
        this.elements.clearAllFilters?.addEventListener('click', () => {
            this.clearAllFilters();
        });
    }

    /**
     * Realiza a busca nos produtos
     * @param {string} searchTerm - Termo de busca
     */
    handleSearch(searchTerm) {
        this.currentSearchTerm = searchTerm.trim().toLowerCase();
        
        if (!this.currentSearchTerm) {
            this.filteredProducts = [...this.products];
            this.elements.clearSearch?.classList.add('hidden');
        } else {
            this.filteredProducts = this.products.filter(product => {
                return (
                    product.title.toLowerCase().includes(this.currentSearchTerm) ||
                    (product.subtitle && product.subtitle.toLowerCase().includes(this.currentSearchTerm)) ||
                    product.description.toLowerCase().includes(this.currentSearchTerm)
                );
            });
            this.elements.clearSearch?.classList.remove('hidden');
        }
        
        this.renderProducts();
        this.updateResultsInfo();
        
        // Mostrar mensagem se não encontrou resultados
        if (this.filteredProducts.length === 0 && this.currentSearchTerm) {
            this.showNoResults();
        }
    }

    /**
     * Limpa a busca atual
     */
    clearSearch() {
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
        }
        this.currentSearchTerm = '';
        this.filteredProducts = [...this.products];
        this.elements.clearSearch?.classList.add('hidden');
        this.renderProducts();
        this.updateResultsInfo();
        this.elements.searchInput?.focus();
    }

    /**
     * Limpa todos os filtros aplicados
     */
    clearAllFilters() {
        this.clearSearch();
    }

    /**
     * Mostra mensagem quando não há resultados
     */
    showNoResults() {
        if (!this.elements.productsGrid) return;
        
        this.elements.productsGrid.innerHTML = `
            <div class="no-results">
                <div class="no-results-content">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                        <line x1="11" y1="8" x2="11" y2="14"/>
                        <line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                    <h3>Nenhum produto encontrado</h3>
                    <p>Tente buscar com palavras-chave diferentes ou navegue por todas as categorias.</p>
                    <button class="try-again-btn" onclick="document.getElementById('clearAllFilters').click()">
                        Ver todos os produtos
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Manipula o clique no botão "Eu quero"
     * @param {string} productId - ID do produto
     * @param {string} productTitle - Título do produto
     * @param {string} productPrice - Preço formatado do produto
     */
    handleEuQuero(productId, productTitle, productPrice) {
        // Criar mensagem para WhatsApp
        const message = encodeURIComponent(
            `Olá! Tenho interesse neste produto do catálogo Neo Shop:\n\n` +
            `📱 *${productTitle}*\n` +
            `💰 Preço: R$ ${productPrice}\n\n` +
            `Gostaria de mais informações sobre disponibilidade, formas de pagamento e entrega.`
        );
        
        // Abrir WhatsApp (substitua pelo número real)
        const whatsappUrl = `https://wa.me/5521965088163?text=${message}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }

    /**
     * Configura event listeners para o modal clean
     */
    setupCleanModalListeners() {
        // Event listeners para troca de imagens na galeria
        const thumbnails = document.querySelectorAll('.gallery-thumb');
        const mainImage = document.getElementById('mainProductImage');
        
        if (mainImage && thumbnails.length > 0) {
            thumbnails.forEach((thumb, index) => {
                thumb.addEventListener('click', () => {
                    const img = thumb.querySelector('img');
                    if (img && img.src) {
                        mainImage.src = img.src;
                        
                        // Atualizar estado ativo
                        thumbnails.forEach(t => t.classList.remove('active'));
                        thumb.classList.add('active');
                    }
                });
            });
        }

        // Event listener para o botão de interesse
        const buyButton = document.querySelector('.buy-button');
        if (buyButton) {
            buyButton.addEventListener('click', () => {
                const productId = buyButton.dataset.productId;
                const productTitle = buyButton.dataset.productTitle;
                const productPrice = buyButton.dataset.productPrice;
                this.handleEuQuero(productId, productTitle, productPrice);
            });
        }
    }
}

/**
 * Inicialização da aplicação
 * Aguarda o DOM estar completamente carregado antes de inicializar
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Inicializar o catálogo de produtos
        new ProductCatalog();
        
        // Log de inicialização (apenas em desenvolvimento)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Neo Shop - Catálogo de produtos inicializado com sucesso!');
        }
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        
        // Fallback para erro crítico de inicialização
        const errorMessage = document.createElement('div');
        errorMessage.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 2rem;
                border-radius: 0.5rem;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                text-align: center;
                z-index: 9999;
            ">
                <h2 style="color: #dc3545; margin-bottom: 1rem;">Erro Crítico</h2>
                <p style="margin-bottom: 1rem;">Não foi possível inicializar a aplicação.</p>
                <button onclick="window.location.reload()" style="
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.25rem;
                    cursor: pointer;
                ">Recarregar Página</button>
            </div>
        `;
        document.body.appendChild(errorMessage);
    }
});

/**
 * Service Worker registration para cache futuro (opcional)
 * Descomente quando implementar PWA
 */
/*
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registrado com sucesso:', registration);
            })
            .catch((registrationError) => {
                console.log('Falha no registro do SW:', registrationError);
            });
    });
}
*/