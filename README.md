# Sistema de Gestão de Planilhas CSV - Frontend

Este projeto é uma aplicação frontend desenvolvida em Next.js para visualização e gerenciamento de planilhas CSV, consumindo a API NestJS para processamento dos arquivos.

## O que a aplicação faz

O sistema permite aos usuários:

- Fazer upload de arquivos CSV contendo dados de notas (nota1 e nota2)
- Visualizar todos os arquivos processados em uma interface organizada
- Baixar os arquivos processados
- Visualizar prévia dos dados com médias calculadas
- Editar informações dos arquivos
- Excluir arquivos

## Tecnologias Utilizadas

- **Next.js**: Framework React escolhido pela sua estrutura de roteamento simplificada baseada em arquivos, renderização eficiente e melhor desempenho para SEO.
- **Tailwind CSS**: Adotado pela facilidade de criar interfaces responsivas através de classes utilitárias, acelerando o desenvolvimento e mantendo consistência visual.
- **Shadcn UI**: Biblioteca de componentes selecionada por oferecer elementos de UI acessíveis e facilmente personalizáveis, com boa integração com Tailwind.
- **Axios**: Cliente HTTP preferido por sua API intuitiva, suporte a interceptores e capacidade de monitorar o progresso de uploads.

## Arquitetura Técnica

### Integração com NestJS API
O frontend se comunica diretamente com a API NestJS através de endpoints REST:

- `GET /csv-files`: Lista todos os arquivos processados
- `GET /csv-files/:id`: Obtém detalhes de um arquivo específico
- `GET /csv-files/:id/preview`: Obtém prévia dos dados de um arquivo
- `POST /csv-files/upload`: Envia um novo arquivo para processamento
- `PUT /csv-files/:id`: Atualiza informações de um arquivo
- `DELETE /csv-files/:id`: Remove um arquivo do sistema

O upload de arquivos é implementado usando FormData e Axios com acompanhamento de progresso:

```javascript
const formData = new FormData();
formData.append('file', file);

const response = await axios.post(
  `${API_URL}/csv-files/upload`, 
  formData, 
  {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: progressEvent => {
      if (!progressEvent.total) return;
      const percentCompleted = Math.round((progressEvent.loaded * 85) / progressEvent.total);
      setProgress(percentCompleted);
    }
  }
);
```

### Gerenciamento de Estado
A aplicação implementa gerenciamento de estado utilizando React Hooks:

- `useState`: Para armazenar dados dos arquivos, filtros e estados de UI
- `useEffect`: Para buscar dados, gerenciar timers e efeitos visuais
- `useRef`: Para referenciar elementos DOM, especialmente nos inputs de arquivo
- `useRouter`: Para navegação declarativa entre páginas

### Componentes Reutilizáveis
A aplicação utiliza componentes do Shadcn UI modificados para corresponder ao design do sistema:

- Componentes de formulário: `Input`, `Button`, `Select`
- Componentes de layout: `Card`, `Table`
- Componentes de feedback: `Progress`, `Alert`
- Componentes de navegação: `Tabs`, `Pagination`

### Renderização e Manipulação de Dados
Os dados recebidos da API são transformados e formatados para exibição:

```javascript
// Transformação de dados para exibição
const transformedData = response.data.map((file) => ({
  id: file.id,
  fileName: file.filename,
  uploadDate: file.createdAt,
  status: file.status,
  s3Url: file.s3Url,
  error: file.error
}));
```

Para a visualização de prévia, a aplicação processa os dados das primeiras linhas do CSV e calcula estatísticas:

```javascript
// Cálculo de estatísticas básicas dos dados
const stats = {
  total: data.length,
  mediaNotas: data.length > 0 
    ? calculateAverage(data.filter(item => item.notaFinalMedia > 0)
      .map(item => item.notaFinalMedia)) 
    : 0
};
```

## Principais Funcionalidades

### Página de Upload
A página de upload oferece uma interface intuitiva onde os usuários podem:
- Arrastar e soltar arquivos CSV ou selecioná-los do computador
- Visualizar o progresso do upload e processamento
- Receber feedback sobre sucesso ou falha no processamento
- Navegar para a listagem após o upload ser concluído

### Página de Listagem
A página de listagem centraliza o gerenciamento dos arquivos:
- Visualização em tabela organizada com ordenação
- Visualização de prévia dos dados do arquivo
- Baixar os arquivos processados do S3
- Editar nome e status dos arquivos
- Excluir arquivos do sistema

### Feedback ao Usuário
O sistema prioriza a experiência do usuário através de:
- Barras de progresso durante uploads
- Mensagens claras de erro e sucesso
- Confirmações antes de ações destrutivas (como exclusão)
- Indicadores de carregamento durante operações assíncronas

## Como Executar

### Pré-requisitos

- Node.js 
- Backend NestJS rodando em http://localhost:3000

### Passos para Execução

1. Clone o repositório:
```bash
git clone https://github.com/gustavokurtz/frontend-csv-teste.git
cd frontend-csv-teste
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o ambiente criando um arquivo `.env.local` na raiz do projeto:
```
NEXT_PUBLIC_NEST_API_URL=http://localhost:3000
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse a aplicação em http://localhost:3001
