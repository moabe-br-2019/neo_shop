# Neo Shop - Catálogo de Produtos

Um catálogo de produtos físicos moderno, responsivo e elegante construído com HTML5, CSS3 e JavaScript ES6+.

## 🚀 Funcionalidades

- **Catálogo Responsivo**: Grid de produtos que se adapta a diferentes tamanhos de tela
- **Modal Detalhado**: Visualização completa do produto com galeria de imagens
- **Design Elegante**: Interface limpa e moderna com logo personalizado
- **Integração WhatsApp**: Botão direto para contato via WhatsApp
- **Botões de Ação**: "Eu quero" (interesse direto) e "Ver fotos" (modal)
- **Carregamento Assíncrono**: Estados de loading e erro bem definidos
- **Acessibilidade**: Suporte completo a navegação por teclado e leitores de tela
- **Segurança**: Sanitização de dados para prevenir XSS

## 📁 Estrutura do Projeto

```
neo_shop/
├── index.html              # Página principal
├── assets/
│   ├── css/
│   │   └── style.css       # Estilos da aplicação
│   └── js/
│       └── app.js          # Lógica da aplicação
├── data/
│   └── products.json       # Base de dados dos produtos
└── README.md               # Documentação
```

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica e acessível
- **CSS3**: Layout responsivo com Grid e Flexbox
- **JavaScript ES6+**: Classes, async/await, modules
- **JSON**: Armazenamento de dados dos produtos

## 📦 Estrutura dos Produtos

Cada produto possui a seguinte estrutura:

```json
{
  "id": 1,
  "title": "Nome do Produto",
  "subtitle": "Subtítulo opcional",
  "description": "Descrição detalhada do produto",
  "gallery": [
    "url_da_imagem_1",
    "url_da_imagem_2"
  ],
  "price": 999.99
}
```

## 🚦 Como Executar

1. **Servidor Local**: Execute um servidor HTTP local na pasta do projeto:
   ```bash
   # Com Python 3
   python -m http.server 8000
   
   # Com Node.js (http-server)
   npx http-server
   
   # Com PHP
   php -S localhost:8000
   ```

2. **Acesse**: Abra `http://localhost:8000` no navegador

> **Nota**: É necessário usar um servidor HTTP devido às políticas de CORS dos navegadores modernos.

## ⚙️ Configuração

### Número do WhatsApp

Para personalizar o número do WhatsApp, edite os seguintes arquivos:

1. **Header (Contato Geral)**: `index.html` linha ~21
```html
href="https://wa.me/SEU_NUMERO?text=Olá! Vim do catálogo Neo Shop..."
```

2. **Botão "Eu quero"**: `assets/js/app.js` linha ~396
```javascript
const whatsappUrl = `https://wa.me/SEU_NUMERO?text=${message}`;
```

### Logo Personalizado

Substitua a URL da imagem em `index.html` linha ~16:
```html
<img src="URL_DO_SEU_LOGO" alt="Neo Shop Logo" class="logo-image">
```

## 🔒 Recursos de Segurança

- **Sanitização de Dados**: Todos os dados são sanitizados antes da renderização
- **Prevenção XSS**: Escape de caracteres HTML
- **Validação de Dados**: Validação da estrutura dos dados JSON
- **Error Handling**: Tratamento robusto de erros

## 📱 Responsividade

- **Desktop**: Layout em grid com múltiplas colunas
- **Tablet**: Adaptação automática do número de colunas
- **Mobile**: Layout de coluna única otimizado

## ♿ Acessibilidade

- **ARIA Labels**: Descrições para leitores de tela
- **Navegação por Teclado**: Suporte completo ao teclado
- **Focus States**: Estados visuais claros de foco
- **Semantic HTML**: Estrutura semântica correta

## 🔧 Customização

### Adicionando Novos Produtos

Edite o arquivo `data/products.json` seguindo a estrutura existente:

```json
{
  "products": [
    {
      "id": 7,
      "title": "Novo Produto",
      "subtitle": "Subtítulo opcional",
      "description": "Descrição do produto",
      "gallery": ["url1", "url2"],
      "price": 199.99
    }
  ]
}
```

### Alterando Estilos

Os estilos estão organizados no arquivo `assets/css/style.css` com seções bem definidas:

- Reset e configurações base
- Header e navegação
- Grid de produtos
- Modal
- Responsividade
- Acessibilidade

## 🔮 Próximas Melhorias

- [ ] Conexão com banco de dados
- [ ] Sistema de filtros e busca
- [ ] Carrinho de compras
- [ ] Favoritos
- [ ] PWA (Progressive Web App)
- [ ] Lazy loading das imagens
- [ ] Infinite scroll

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Desenvolvimento

Desenvolvido com foco em clean code, performance e melhores práticas de segurança web.