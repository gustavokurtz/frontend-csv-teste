# Sistema de Gestão de Planilhas CSV

## 🚀 Por que utilizamos Next.js para o front-end

Optamos pelo **Next.js** no front-end por reunir benefícios que impactam diretamente na produtividade do desenvolvimento e qualidade da entrega:

- **🔀 Sistema de rotas simplificado**  
  A estrutura baseada em arquivos torna a criação e o gerenciamento de rotas intuitiva e ágil.

- **📈 SEO e performance otimizados**  
  Suporte nativo a Server-Side Rendering (SSR) e Static Site Generation (SSG), melhorando significativamente o tempo de carregamento.

- **🧱 Integração com Tailwind CSS**  
  Configuração simplificada com Tailwind permite desenvolvimento rápido de interfaces responsivas e modernas.

- **🔌 Integração com APIs externas**  
  Comunicação eficiente com os serviços Python e Nest.js via Axios.

- **🧩 Componentes UI modernos**  
  Utilização da biblioteca **Shadcn UI** para componentes acessíveis e bem estruturados, combinados com **Lucide Icons** para ícones consistentes.

## Arquitetura do Sistema

O sistema funciona com uma arquitetura em camadas que separa claramente as responsabilidades:

1. **Frontend (Next.js)**: Interface de usuário e experiência visual
2. **API (Nest.js)**: Gerenciamento de dados e lógica de negócios
3. **Serviço Python**: Processamento e análise de arquivos CSV

### Configuração de Ambiente

O sistema utiliza variáveis de ambiente para configuração dos serviços:

```jsx
const API_CONFIG = {
  PYTHON_SERVICE_URL: process.env.NEXT_PUBLIC_PYTHON_SERVICE_URL || 'http://localhost:5000',
  NEST_API_URL: process.env.NEXT_PUBLIC_NEST_API_URL || 'http://localhost:3001/api',
}
```

## Visão Geral do Sistema

O sistema consiste em duas páginas principais:

1. **Página de Upload**: Permite ao usuário enviar arquivos CSV para processamento
2. **Página de Listagem**: Exibe todos os arquivos processados com visualizações em tabela e cards

### Interface de Usuário

O sistema oferece várias formas de visualização e interação:

- **Visualizações alternativas**: Alternância entre modo tabela e cards via sistema de abas
- **Sistema de filtros**: Busca por texto e filtro por categorias 
- **Ordenação dinâmica**: Classificação por qualquer coluna, em ordem crescente ou decrescente
- **Paginação avançada**: Navegação com suporte a múltiplas páginas
- **Estatísticas agregadas**: Cards informativos com métricas gerais

## Página de Upload de Planilhas

### Principais Funcionalidades

- **Upload via drag-and-drop**: Interface amigável que permite arrastar e soltar arquivos
- **Validação de arquivos**: Verificações de formato (CSV) e tamanho máximo (10MB)
- **Feedback visual de processamento**: Barra de progresso e indicadores de status
- **Navegação contextual**: Links para acesso rápido à listagem

### Processamento de Arquivos

O sistema utiliza uma abordagem em duas etapas para processamento:

1. **Envio para o serviço Python**: Processamento inicial do CSV
   ```javascript
   const pythonResponse = await axios.post(
     `${API_CONFIG.PYTHON_SERVICE_URL}/process-csv`, 
     formData, 
     {
       headers: { 'Content-Type': 'multipart/form-data' },
       onUploadProgress: progressEvent => {
         const percentCompleted = Math.round((progressEvent.loaded * 40) / progressEvent.total!);
         setProgress(percentCompleted);
       }
     }
   );
   ```

2. **Envio para a API Nest.js**: Armazenamento e indexação
   ```javascript
   const nestResponse = await axios.post(
     `${API_CONFIG.NEST_API_URL}/files/upload`, 
     nestFormData,
     {
       headers: { 'Content-Type': 'multipart/form-data' },
       onUploadProgress: progressEvent => {
         const percentCompleted = 50 + Math.round((progressEvent.loaded * 40) / progressEvent.total!);
         setProgress(percentCompleted);
       }
     }
   );
   ```

## Página de Listagem de Dados

### Principais Funcionalidades

- **Visualizações alternativas**: Tabela detalhada e Cards visuais via sistema de abas
- **Sistema de filtros**: Busca por nome de arquivo e filtro por categorias
- **Ordenação dinâmica**: Permite ordenar por qualquer coluna
- **Paginação avançada**: Navegação intuitiva mesmo com muitas páginas
- **Dashboard de estatísticas**: Cards informativos com métricas de todas as planilhas

### Gerenciamento de Estado

O sistema gerencia diferentes estados da interface, incluindo:

```jsx
// Estados principais
const [data, setData] = useState<DataItem[]>([])
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

// Estados de filtro e paginação
const [searchQuery, setSearchQuery] = useState('')
const [categoriaFilter, setCategoriaFilter] = useState('todas')
const [currentPage, setCurrentPage] = useState(1)
const [sortField, setSortField] = useState('uploadDate')
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
```

### Estrutura de Dados

O sistema trabalha com os seguintes dados de cada planilha:

```typescript
interface DataItem {
  id: string
  fileName: string
  uploadDate: string
  rows: number
  columns: number
  nota1Media: number
  nota2Media: number
  notaFinalMedia: number
  categoria: string
}
```

## Funcionalidades de UI/UX Destacadas

### Sistema de Cards Interativos

Os cards oferecem visualização compacta com métricas importantes:

```jsx
<Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
    <div>
      <CardTitle className="text-base font-medium truncate">{item.fileName}</CardTitle>
      <CardDescription className="flex items-center mt-1">
        <Calendar className="h-3.5 w-3.5 mr-1" />
        {formatDate(item.uploadDate)}
      </CardDescription>
    </div>
    <Badge variant="outline" className={getCategoriaColor(item.categoria)}>
      {item.categoria}
    </Badge>
  </CardHeader>
  <CardContent>
    {/* Conteúdo do card com métricas */}
  </CardContent>
</Card>
```

### Feedback Visual Aprimorado

O sistema fornece feedback visual durante todas as operações:

- **Indicadores de progresso**: Barras de progresso durante o upload e processamento
- **Estados de carga**: Feedback claro durante carregamento de dados
- **Tratamento de erros**: Alertas visuais com informações detalhadas
- **Confirmações visuais**: Indicação clara de ações bem-sucedidas

### Responsividade Abrangente

A interface se adapta perfeitamente a diferentes tamanhos de tela:

```jsx
// Exemplo de layout responsivo
<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
  {/* Conteúdo responsivo */}
</div>

// Grade responsiva para cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
  {/* Cards que se reorganizam conforme o tamanho da tela */}
</div>
```

## Integração com APIs

### Comunicação com Serviço Python

O sistema envia arquivos CSV para processamento em um serviço Python:

```javascript
const pythonResponse = await axios.post(
  `${API_CONFIG.PYTHON_SERVICE_URL}/process-csv`, 
  formData, 
  { headers: { 'Content-Type': 'multipart/form-data' } }
);
```

### Comunicação com API Nest.js

Gerenciamento de dados persistentes através da API Nest.js:

```javascript
// Carregamento de dados
const fetchData = async () => {
  try {
    setIsLoading(true)
    const response = await axios.get(`${API_URL}/files`)
    setData(response.data)
    setError(null)
  } catch (err) {
    console.error(err)
    setError('Erro ao carregar dados da API.')
  } finally {
    setIsLoading(false)
  }
}
```

## Conclusão

O Sistema de Gestão de Planilhas CSV foi desenvolvido priorizando usabilidade, performance e estética. A combinação de Next.js, Tailwind CSS e Shadcn UI permitiu criar uma interface moderna e funcional que simplifica o gerenciamento de dados em planilhas.

A arquitetura distribuída entre serviços front-end, back-end e processamento específico para CSVs permite escalabilidade e manutenção simplificada. Cada componente foi cuidadosamente implementado considerando responsividade, acessibilidade e performance.