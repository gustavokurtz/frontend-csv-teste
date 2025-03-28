'use client'

import axios from 'axios'
import { useState, useEffect } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination'
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit, 
  Eye, 
  ArrowUpDown, 
  FileText, 
  Calendar, 
  Info, 
  Loader2, 
  AlertCircle, 
  X 
} from 'lucide-react'
import { NextPage } from 'next'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CsvFile {
  id: string;
  filename: string;
  s3Url?: string;
  status: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  processedAt: string;
}

interface CsvPreviewData {
  headers: string[];
  rows: any[][];
  totalRows: number;
  nota1Media?: number;
  nota2Media?: number;
  notaFinalMedia?: number;
}

interface DataItem {
  id: string;
  fileName: string;
  uploadDate: string;
  rows: number;
  columns: number;
  nota1Media: number;
  nota2Media: number;
  notaFinalMedia: number;
  categoria: string;
  s3Url?: string;
  status: string;
  error?: string;
  previewData?: CsvPreviewData;
}

const API_URL = process.env.NEXT_PUBLIC_NEST_API_URL || 'http://localhost:3000';

const DataListingPage: NextPage = () => {
  const [data, setData] = useState<DataItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [viewFile, setViewFile] = useState<DataItem | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Estados para edição
  const [editFile, setEditFile] = useState<DataItem | null>(null);
  const [editFileName, setEditFileName] = useState('');
  const [editFileStatus, setEditFileStatus] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState('todas')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState('uploadDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const itemsPerPage = 10

  useEffect(() => {
    fetchData();
  }, [])

  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => {
        setActionMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/csv-files`);
      
      const transformedData: DataItem[] = response.data.map((file: CsvFile) => ({
        id: file.id,
        fileName: file.filename,
        uploadDate: file.createdAt,
        rows: 0,
        columns: 0,
        nota1Media: 0,
        nota2Media: 0,
        notaFinalMedia: 0,
        categoria: getRandomCategory(),
        s3Url: file.s3Url,
        status: file.status,
        error: file.error
      }));
      
      setData(transformedData);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar dados da API.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRandomCategory = () => {
    const categories = ['Pesquisa de Campo', 'Avaliação de Desempenho', 'Pesquisa de Satisfação'];
    return categories[Math.floor(Math.random() * categories.length)];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  const calculateAverage = (values: number[]) => {
    if (values.length === 0) return 0;
    return values.reduce((acc, val) => acc + val, 0) / values.length;
  }

  const sortData = (field: string, direction: 'asc' | 'desc') => {
    return [...filteredData].sort((a: any, b: any) => {
      if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
      if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const toggleSort = (field: string) => {
    const direction = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
  }

  const filteredData = data.filter(item => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategoria = categoriaFilter === 'todas' || item.categoria === categoriaFilter;
    return matchesSearch && matchesCategoria;
  });

  const sortedData = sortData(sortField, sortDirection);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
  }

  const stats = {
    total: data.length,
    totalLinhas: data.reduce((acc, item) => acc + item.rows, 0),
    mediaNotas: data.length > 0 
      ? calculateAverage(data.filter(item => item.notaFinalMedia > 0).map(item => item.notaFinalMedia)) 
      : 0,
    categorias: [...new Set(data.map(item => item.categoria))].length
  }

  const categorias = ['todas', ...new Set(data.map(item => item.categoria))];

  const fetchPreviewData = async (fileId: string) => {
    try {
      setPreviewLoading(true);
      const response = await axios.get(`${API_URL}/csv-files/${fileId}/preview`);
      const previewData = response.data;
      
      const updatedData = data.map(item => {
        if (item.id === fileId) {
          return {
            ...item,
            rows: previewData.totalRows,
            columns: previewData.headers.length,
            nota1Media: previewData.nota1Media || 0,
            nota2Media: previewData.nota2Media || 0,
            notaFinalMedia: previewData.notaFinalMedia || 0,
            previewData
          };
        }
        return item;
      });
      
      setData(updatedData);
      return previewData;
      
    } catch (err) {
      console.error("Erro ao buscar prévia:", err);
      setActionMessage({
        type: 'error',
        text: "Não foi possível carregar a prévia dos dados."
      });
      return null;
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleViewFile = async (item: DataItem) => {
    setViewFile(item);
    
    // Se o arquivo ainda não tem preview e está concluído, buscamos
    if (!item.previewData && item.status === 'COMPLETED') {
      try {
        const previewData = await fetchPreviewData(item.id);
        if (previewData) {
          setViewFile(prev => prev ? {
            ...prev, 
            previewData,
            rows: previewData.totalRows,
            columns: previewData.headers.length,
            nota1Media: previewData.nota1Media || 0,
            nota2Media: previewData.nota2Media || 0,
            notaFinalMedia: previewData.notaFinalMedia || 0
          } : null);
        }
      } catch (err) {
        console.error("Erro ao buscar prévia durante visualização:", err);
      }
    }
  }

  const handleCloseView = () => {
    setViewFile(null);
  }

  const handleDownload = async (id: string, fileName: string, s3Url?: string) => {
    if (!s3Url) {
      setActionMessage({
        type: 'error',
        text: "Este arquivo não possui um URL para download."
      });
      return;
    }

    setLoadingFileId(id);
    try {
      window.open(s3Url, '_blank');
    } catch (err) {
      console.error("Erro ao baixar arquivo:", err);
      setActionMessage({
        type: 'error',
        text: "Não foi possível baixar o arquivo."
      });
    } finally {
      setLoadingFileId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este arquivo?")) {
      return;
    }
    
    setLoadingFileId(id);
    try {
      await axios.delete(`${API_URL}/csv-files/${id}`);
      
      const updatedData = data.filter(item => item.id !== id);
      setData(updatedData);
      
      if (viewFile && viewFile.id === id) {
        setViewFile(null);
      }
      
      setActionMessage({
        type: 'success',
        text: "O arquivo foi excluído com sucesso."
      });
    } catch (err) {
      console.error("Erro ao excluir arquivo:", err);
      setActionMessage({
        type: 'error',
        text: "Não foi possível excluir o arquivo."
      });
    } finally {
      setLoadingFileId(null);
    }
  };

  const handleRegenerateUrl = async (id: string) => {
    setLoadingFileId(id);
    try {
      const response = await axios.post(`${API_URL}/csv-files/${id}/regenerate-url`);
      
      if (response.data && response.data.s3Url) {
        const updatedData = data.map(item => {
          if (item.id === id) {
            return { ...item, s3Url: response.data.s3Url };
          }
          return item;
        });
        
        setData(updatedData);
        
        if (viewFile && viewFile.id === id) {
          setViewFile(prev => prev ? { ...prev, s3Url: response.data.s3Url } : null);
        }
        
        setActionMessage({
          type: 'success',
          text: "A URL para download foi atualizada."
        });
      }
    } catch (err) {
      console.error("Erro ao regenerar URL:", err);
      setActionMessage({
        type: 'error',
        text: "Não foi possível regenerar a URL de download."
      });
    } finally {
      setLoadingFileId(null);
    }
  };

  // --- Funções para edição ---
  const handleEditFile = (file: DataItem) => {
    setEditFile(file);
    setEditFileName(file.fileName);
    // Caso deseje permitir apenas 'PROCESSING' ou 'COMPLETED', ajuste conforme necessidade
    setEditFileStatus(file.status === 'PROCESSING' ? 'PROCESSING' : 'COMPLETED');
    setShowEditModal(true);
  }

  const handleCloseEdit = () => {
    setEditFile(null);
    setShowEditModal(false);
  }

  const handleSaveEdit = async () => {
    if (!editFile) return;
    
    setIsEditing(true);
    try {
      // Chamada PUT na rota /csv-files/{id}
      await axios.put(`${API_URL}/csv-files/${editFile.id}`, {
        filename: editFileName,
        status: editFileStatus
      });

      // Atualiza localmente os dados
      setData(prevData =>
        prevData.map(item => {
          if (item.id === editFile.id) {
            return {
              ...item,
              fileName: editFileName,
              status: editFileStatus
            };
          }
          return item;
        })
      );

      setActionMessage({
        type: 'success',
        text: "Arquivo atualizado com sucesso."
      });
      handleCloseEdit();
    } catch (err) {
      console.error("Erro ao atualizar arquivo:", err);
      setActionMessage({
        type: 'error',
        text: "Não foi possível atualizar o arquivo."
      });
    } finally {
      setIsEditing(false);
    }
  };
  // --- Fim das funções para edição ---

  if (isLoading) {
    return <div className="text-center py-20 text-gray-600">Carregando dados...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-fuchsia-50 to-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {actionMessage && (
          <Alert className={`animate-in fade-in slide-in-from-top duration-300 ${
            actionMessage.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            {actionMessage.type === 'success' ? (
              <FileText className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={actionMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}>
              {actionMessage.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center">
            <FileSpreadsheet className="h-8 w-8 text-fuchsia-600 mr-3" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Planilhas de Dados</h1>
              <p className="text-gray-600">Visualize e gerencie as planilhas enviadas para análise</p>
            </div>
          </div>
          <Button className="w-full md:w-auto" onClick={() => window.location.href = '/upload'}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Enviar nova planilha
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">TOTAL DE PLANILHAS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-gray-500">Arquivos processados</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tabela" className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-4 bg-white">
            <TabsTrigger 
              className="data-[state=active]:bg-white data-[state=active]:text-black font-medium justify-center" 
              value="tabela"
            >
              Visualização em Tabela
            </TabsTrigger>
          </TabsList>
          
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar por nome de arquivo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full"
                  />
                </div>
              </div>
            </CardHeader>
            
            <TabsContent value="tabela" className="m-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead onClick={() => toggleSort('fileName')} className="cursor-pointer">
                        <div className="flex items-center">
                          Arquivo
                          <ArrowUpDown size={16} className="ml-2" />
                        </div>
                      </TableHead>
                      <TableHead onClick={() => toggleSort('uploadDate')} className="cursor-pointer">
                        <div className="flex items-center">
                          Data de Envio
                          <ArrowUpDown size={16} className="ml-2" />
                        </div>
                      </TableHead>
                      <TableHead onClick={() => toggleSort('status')} className="cursor-pointer">
                        <div className="flex items-center">
                          Status
                          <ArrowUpDown size={16} className="ml-2" />
                        </div>
                      </TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{item.fileName}</TableCell>
                          <TableCell>{formatDate(item.uploadDate)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={
                                item.status === 'COMPLETED' ? 'bg-green-50 text-green-700' : 
                                item.status === 'PROCESSING' ? 'bg-blue-50 text-blue-700' : 
                                'bg-red-50 text-red-700'
                              }
                            >
                              {item.status === 'COMPLETED' 
                                ? 'Concluído' 
                                : item.status === 'PROCESSING' 
                                ? 'Processando' 
                                : 'Erro'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8" 
                                title="Visualizar detalhes"
                                onClick={() => handleViewFile(item)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8" 
                                title="Baixar arquivo"
                                onClick={() => handleDownload(item.id, item.fileName, item.s3Url)}
                                disabled={loadingFileId === item.id || !item.s3Url}
                              >
                                {loadingFileId === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>

                              {/* NOVO BOTÃO DE EDIÇÃO */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Editar arquivo"
                                onClick={() => handleEditFile(item)}
                                disabled={loadingFileId === item.id}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8" 
                                title="Excluir arquivo"
                                onClick={() => handleDelete(item.id)}
                                disabled={loadingFileId === item.id}
                              >
                                {loadingFileId === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                )}
                              </Button>
                              
                              {item.status === 'COMPLETED' && !item.s3Url && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8" 
                                  title="Regenerar URL"
                                  onClick={() => handleRegenerateUrl(item.id)}
                                  disabled={loadingFileId === item.id}
                                >
                                  {loadingFileId === item.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <FileText className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                          Nenhum resultado encontrado para os filtros aplicados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="py-4 px-2">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => goToPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                          if (i === 4) {
                            return (
                              <PaginationItem key={i}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                          if (i === 0) {
                            return (
                              <PaginationItem key={i}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                        } else {
                          if (i === 0) {
                            return (
                              <PaginationItem key={i}>
                                <PaginationLink onClick={() => goToPage(1)}>1</PaginationLink>
                              </PaginationItem>
                            );
                          }
                          if (i === 1) {
                            return (
                              <PaginationItem key={i}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          if (i === 3) {
                            return (
                              <PaginationItem key={i}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          if (i === 4) {
                            return (
                              <PaginationItem key={i}>
                                <PaginationLink onClick={() => goToPage(totalPages)}>
                                  {totalPages}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          pageNum = currentPage + i - 2;
                        }
                        
                        return (
                          <PaginationItem key={i}>
                            <PaginationLink
                              onClick={() => goToPage(pageNum)}
                              isActive={currentPage === pageNum}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="cards" className="m-0">
              <div className="p-8 text-center text-gray-500">
                Visualização em cards disponível, mas não mostrada aqui por brevidade.
              </div>
            </TabsContent>
          </Card>
        </Tabs>
      </div>

      {/* Modal de visualização da planilha */}
      {viewFile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Visualização: {viewFile.fileName}</h3>
              <Button variant="ghost" size="icon" onClick={handleCloseView}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-500">INFORMAÇÕES DO ARQUIVO</h4>
                  <div className="mt-2 space-y-2">
                    <p className="flex justify-between">
                      <span className="text-gray-600">Data de upload:</span>
                      <span className="font-medium">{formatDate(viewFile.uploadDate)}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <h4 className="font-medium text-sm text-gray-500 mt-6 mb-3">PRÉVIA DOS DADOS</h4>
              <div className="border rounded-md overflow-hidden">
                <div className="bg-gray-50 p-3 border-b">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Conteúdo da planilha</span>
                    {viewFile.s3Url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => handleDownload(viewFile.id, viewFile.fileName, viewFile.s3Url)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Baixar CSV
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="p-3">
                  {viewFile.status === 'COMPLETED' ? (
                    previewLoading ? (
                      <div className="py-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">Carregando prévia...</p>
                      </div>
                    ) : viewFile.previewData ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {viewFile.previewData.headers.map((header, i) => (
                                <th 
                                  key={i} 
                                  className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                                    i > 1 ? 'text-right' : 'text-left'
                                  }`}
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {viewFile.previewData.rows.map((row, rowIndex) => (
                              <tr key={rowIndex} className="hover:bg-gray-50">
                                {row.map((cell, cellIndex) => (
                                  <td 
                                    key={cellIndex} 
                                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                                      cellIndex === 0 
                                        ? 'text-gray-500' 
                                        : cellIndex === 1 
                                        ? 'font-medium text-gray-900' 
                                        : cellIndex === 4 
                                        ? 'font-medium text-gray-900 text-right' 
                                        : 'text-gray-500 text-right'
                                    }`}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="mt-2 text-center text-xs text-gray-500">
                          Exibindo prévia dos primeiros {viewFile.previewData.rows.length} registros. 
                          Total de {viewFile.previewData.totalRows} linhas no arquivo.
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">Não foi possível carregar a prévia dos dados.</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Faça o download do arquivo para ver todos os dados.
                        </p>
                      </div>
                    )
                  ) : viewFile.status === 'PROCESSING' ? (
                    <div className="py-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">Processando arquivo...</p>
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
                      <p className="text-gray-600">Erro ao processar este arquivo.</p>
                      {viewFile.error && (
                        <p className="text-red-500 mt-2 text-sm">{viewFile.error}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <Button variant="outline" onClick={handleCloseView}>Fechar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {showEditModal && editFile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Editar arquivo</h3>
              <Button variant="ghost" size="icon" onClick={handleCloseEdit}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do arquivo</label>
                <Input 
                  value={editFileName}
                  onChange={(e) => setEditFileName(e.target.value)}
                  placeholder="Digite o novo nome..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select
                  value={editFileStatus}
                  onValueChange={(value) => setEditFileStatus(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Ajuste aqui conforme os status permitidos */}
                    <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCloseEdit}>Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={isEditing}>
                {isEditing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataListingPage;
