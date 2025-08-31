/**
 * Neo Shop - API Service
 * 
 * Serviço responsável por fazer requisições para a API do Baserow
 * e gerenciar os dados dos produtos.
 */

class ApiService {
    constructor() {
        // Configurações da API
        this.baseUrl = 'https://api.baserow.io/api/database/rows/table/659848/';
        this.token = 'qTcSjiM8UenJKeJ42CbhVuvVxm1DuZAI'; // Substitua pelo seu token real
        this.headers = {
            'Authorization': `Token ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Busca todos os produtos da API
     * @param {Object} filters - Filtros opcionais para a consulta
     * @returns {Promise<Array>} - Array de produtos
     */
    async fetchProducts(filters = {}) {
        try {
            // Construir URL com parâmetros
            const url = new URL(this.baseUrl);
            url.searchParams.append('user_field_names', 'true');
            
            // Filtrar apenas produtos públicos
            url.searchParams.append('filter__Public__equal', 'true');
            
            // Adicionar filtros extras se fornecidos
            Object.keys(filters).forEach(key => {
                if (filters[key] !== null && filters[key] !== undefined) {
                    url.searchParams.append(key, filters[key]);
                }
            });

            console.log('Fazendo requisição para:', url.toString());

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.results || !Array.isArray(data.results)) {
                throw new Error('Resposta da API não contém array de produtos válido');
            }

            // Transformar dados da API para o formato esperado pela aplicação
            const transformedProducts = data.results.map(product => this.transformProduct(product));

            console.log(`${transformedProducts.length} produtos carregados da API`);
            
            return transformedProducts;

        } catch (error) {
            console.error('Erro ao buscar produtos da API:', error);
            throw new Error(`Falha ao carregar produtos: ${error.message}`);
        }
    }

    /**
     * Transforma produto da API para o formato da aplicação
     * @param {Object} apiProduct - Produto no formato da API
     * @returns {Object} - Produto no formato da aplicação
     */
    transformProduct(apiProduct) {
        try {
            // Extrair URLs das imagens da galeria
            const gallery = Array.isArray(apiProduct.gallery) 
                ? apiProduct.gallery.map(image => image.url || image)
                : [];

            // Transformar produto para o formato esperado
            const transformedProduct = {
                id: parseInt(apiProduct.id) || 0,
                title: String(apiProduct.title || '').trim(),
                subtitle: apiProduct.subtitle ? String(apiProduct.subtitle).trim() : null,
                description: String(apiProduct.description || '').trim(),
                gallery: gallery,
                price: this.parsePrice(apiProduct.price),
                promotionalPrice: this.parsePrice(apiProduct.promotionalPrice),
                public: Boolean(apiProduct.Public),
                rating: parseInt(apiProduct.Rating) || null,
                order: parseFloat(apiProduct.order) || 0
            };

            // Validar produto transformado
            if (!this.isValidProduct(transformedProduct)) {
                console.warn('Produto inválido detectado:', transformedProduct);
                return null;
            }

            return transformedProduct;

        } catch (error) {
            console.error('Erro ao transformar produto:', apiProduct, error);
            return null;
        }
    }

    /**
     * Converte string de preço para número
     * @param {string|number} price - Preço em string ou número
     * @returns {number|null} - Preço convertido ou null
     */
    parsePrice(price) {
        if (!price || price === '0.00') return null;
        
        const numericPrice = typeof price === 'string' 
            ? parseFloat(price.replace(',', '.'))
            : parseFloat(price);
            
        return isNaN(numericPrice) || numericPrice <= 0 ? null : numericPrice;
    }

    /**
     * Valida se um produto tem os campos obrigatórios
     * @param {Object} product - Produto para validar
     * @returns {boolean} - True se válido
     */
    isValidProduct(product) {
        return (
            product &&
            typeof product.id === 'number' &&
            product.id > 0 &&
            typeof product.title === 'string' &&
            product.title.length > 0 &&
            typeof product.description === 'string' &&
            product.description.length > 0 &&
            Array.isArray(product.gallery) &&
            typeof product.price === 'number' &&
            product.price > 0 &&
            product.public === true
        );
    }

    /**
     * Busca um produto específico por ID
     * @param {number} productId - ID do produto
     * @returns {Promise<Object|null>} - Produto ou null se não encontrado
     */
    async fetchProductById(productId) {
        try {
            const url = `${this.baseUrl}${productId}/?user_field_names=true`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
            }

            const apiProduct = await response.json();
            const transformedProduct = this.transformProduct(apiProduct);

            // Verificar se o produto é público
            if (!transformedProduct || !transformedProduct.public) {
                return null;
            }

            return transformedProduct;

        } catch (error) {
            console.error(`Erro ao buscar produto ${productId}:`, error);
            return null;
        }
    }

    /**
     * Busca produtos com filtro de texto (busca)
     * @param {string} searchTerm - Termo de busca
     * @returns {Promise<Array>} - Array de produtos filtrados
     */
    async searchProducts(searchTerm) {
        if (!searchTerm || searchTerm.trim().length === 0) {
            return this.fetchProducts();
        }

        try {
            const filters = {
                'search': searchTerm.trim()
            };

            return await this.fetchProducts(filters);

        } catch (error) {
            console.error('Erro na busca de produtos:', error);
            throw error;
        }
    }

    /**
     * Testa a conexão com a API
     * @returns {Promise<boolean>} - True se conexão OK
     */
    async testConnection() {
        try {
            const url = new URL(this.baseUrl);
            url.searchParams.append('user_field_names', 'true');
            url.searchParams.append('size', '1'); // Buscar apenas 1 item para teste
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: this.headers
            });

            return response.ok;

        } catch (error) {
            console.error('Erro ao testar conexão:', error);
            return false;
        }
    }
}

// Exportar instância única do serviço
window.ApiService = new ApiService();

/**
 * INSTRUÇÕES DE CONFIGURAÇÃO:
 * 
 * 1. Substitua 'YOUR_DATABASE_TOKEN' pelo seu token real do Baserow
 * 2. Verifique se a URL da tabela (659848) está correta
 * 3. Certifique-se de que os campos da API correspondem aos esperados:
 *    - id, title, subtitle, description, price, promotionalPrice, gallery, Public, Rating
 * 4. Teste a conexão antes de usar em produção
 * 
 * EXEMPLO DE USO:
 * 
 * // Buscar todos os produtos públicos
 * const products = await ApiService.fetchProducts();
 * 
 * // Buscar produto específico
 * const product = await ApiService.fetchProductById(123);
 * 
 * // Buscar produtos por termo
 * const results = await ApiService.searchProducts('smartphone');
 * 
 * // Testar conexão
 * const isConnected = await ApiService.testConnection();
 */