'use client'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { NextPage } from 'next'
import { useState, useRef, useEffect } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, FileCheck, Plus, Loader2, LayoutList, Table, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import axios from 'axios'
import { useRouter } from 'next/navigation'

// Configuração de ambiente
const API_URL = process.env.NEXT_PUBLIC_NEST_API_URL || 'http://localhost:3000';

interface Props {}

const UploadPage: NextPage<Props> = ({}) => {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [processedFileId, setProcessedFileId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Gerenciamento de progresso
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isProcessing && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + 2
          // Mantém o progresso em no máximo 85% até confirmar sucesso
          if (next >= 85) {
            clearInterval(interval)
            return 85
          }
          return next
        })
      }, 200)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isProcessing, progress])

  // Limpar mensagens após alguns segundos
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const validateFile = (file: File): boolean => {
    if (!file.name.endsWith('.csv')) {
      setError('Por favor, envie apenas arquivos CSV.')
      return false
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('O arquivo é muito grande. O tamanho máximo é 10MB.')
      return false
    }
    
    
    setError(null)
    return true
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files.length) {
      const droppedFile = e.dataTransfer.files[0]
      
      if (validateFile(droppedFile)) {
        setFile(droppedFile)
        setUploadComplete(false)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      
      if (validateFile(selectedFile)) {
        setFile(selectedFile)
        setUploadComplete(false)
      }
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = async () => {
    // Se temos um ID de arquivo processado, precisamos excluí-lo do servidor
    if (processedFileId) {
      try {
        setIsProcessing(true); // Mostra um indicador de que está processando
        
        // Chama a API para excluir o arquivo no servidor
        await axios.delete(`${API_URL}/csv-files/${processedFileId}`);
        
        setSuccessMessage("Arquivo removido com sucesso!");
        setProcessedFileId(null); // Limpa o ID do arquivo processado
      } catch (err) {
        console.error("Erro ao excluir arquivo no servidor:", err);
        setError("Não foi possível remover o arquivo do servidor.");
        return; // Se falhar na exclusão, não limpa a interface
      } finally {
        setIsProcessing(false);
      }
    }

    // Limpa o estado local
    setFile(null);
    setUploadComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProcessFile = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Criar FormData para enviar o arquivo diretamente para o NestJS
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload do arquivo para a API NestJS
      const response = await axios.post(
        `${API_URL}/csv-files/upload`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          // Acompanhar progresso do upload
          onUploadProgress: progressEvent => {
            if (!progressEvent.total) return;
            const percentCompleted = Math.round((progressEvent.loaded * 85) / progressEvent.total);
            setProgress(percentCompleted);
          }
        }
      );
      
      // Verificar se o upload foi bem-sucedido
      if (response.status !== 201 && response.status !== 200) {
        throw new Error('Falha ao processar o arquivo');
      }
      
      // Armazenar o ID do arquivo processado para referência
      setProcessedFileId(response.data.id);
      
      // Finalizar o progresso
      setProgress(100);
      
      // Exibir mensagem de sucesso após breve delay
      setTimeout(() => {
        setIsProcessing(false);
        setUploadComplete(true);
        setSuccessMessage("Seu arquivo foi processado com sucesso!");
      }, 500);
      
    } catch (error: any) {
      console.error('Erro durante o upload:', error);
      
      // Tratamento específico de erros com base na resposta
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Resposta do servidor com status de erro
          setError(`Erro ${error.response.status}: ${error.response.data.message || 'Falha no processamento'}`);
        } else if (error.request) {
          // Sem resposta do servidor
          setError('Erro: Não foi possível se conectar ao servidor. Verifique sua conexão.');
        } else {
          // Erro na configuração da requisição
          setError(`Erro: ${error.message}`);
        }
      } else {
        // Erro não relacionado ao Axios
        setError(`Erro: ${error.message || 'Operação falhou!'}`);
      }
      
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const goToListView = () => {
    // Usar router.push para navegação mais fluida entre páginas
    router.push('/list');
    // Também podemos forçar um reload para garantir que a lista seja atualizada
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-fuchsia-50 to-white p-4 sm:p-6">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center space-y-3 px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 flex items-center justify-center">
            <FileSpreadsheet className="mr-2 h-6 w-6 sm:h-8 sm:w-8 md:h-9 md:w-9 flex-shrink-0" />
            <span className="break-words">Envie sua planilha de pesquisas</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Faça o upload de um arquivo CSV contendo os dados da pesquisa. 
            O sistema irá calcular automaticamente a nota final de cada linha.
          </p>
          
          {/* Link para listagem logo abaixo do título */}
          <div className="pt-1">
            <Link href="/list" className="text-fuchsia-600 hover:text-fuchsia-800 flex items-center justify-center gap-1.5 transition-colors">
              <Table className="h-4 w-4" />
              <span className="text-sm font-medium">Visualizar planilhas existentes</span>
            </Link>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="animate-in fade-in slide-in-from-top duration-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="animate-in fade-in slide-in-from-top duration-300 bg-green-50 border-green-200">
            <FileCheck className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
          </Alert>
        )}

        <Card className="w-full shadow-lg border-gray-200">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
            <CardTitle className="text-lg sm:text-xl text-center">Upload de arquivo CSV</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              O arquivo deve conter as colunas: <span className="font-medium">nota1</span> e <span className="font-medium">nota2</span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-4 sm:px-6">
            {!file ? (
              <div 
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 sm:p-8 md:p-10 text-center cursor-pointer transition-all",
                  "flex flex-col items-center justify-center space-y-3 sm:space-y-4",
                  isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50",
                  "min-h-[150px] sm:min-h-[200px]"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleButtonClick}
              >
                <Upload 
                  size={32} 
                  className={cn(
                    "text-gray-400 transition-all",
                    isDragging ? "text-primary animate-bounce" : ""
                  )} 
                />
                <div>
                  <p className="font-medium text-gray-700 text-sm sm:text-base">
                    Arraste e solte seu arquivo CSV aqui
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    ou clique para selecionar do seu computador
                  </p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".csv" 
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 animate-in fade-in">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                    <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      {file.name}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRemoveFile}
                    className="flex-shrink-0"
                    disabled={isProcessing}
                  >
                    Remover
                  </Button>
                </div>
                
                {isProcessing && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Processando...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {uploadComplete && (
                  <div className="mt-4 bg-green-50 p-3 rounded-md border border-green-100">
                    <p className="text-green-700 text-sm flex items-center">
                      <FileCheck className="h-5 w-5 mr-2" />
                      Arquivo processado com sucesso!
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button 
                variant="outline" 
                onClick={handleButtonClick}
                disabled={!!file || isProcessing}
                className="w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Selecionar arquivo
              </Button>
              <Button 
                onClick={handleProcessFile}
                disabled={!file || isProcessing || uploadComplete}
                className="w-full sm:w-auto"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Processar CSV
                  </>
                )}
              </Button>
              
              {uploadComplete && (
                <Button 
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  onClick={goToListView}
                >
                  <List className="mr-2 h-4 w-4" />
                  Ver na listagem
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
        
        <div className="flex justify-center mt-2">
          <Link 
            href="/list" 
            className="text-sm text-gray-500 hover:text-fuchsia-600 transition-colors flex items-center gap-1"
          >
            <LayoutList className="h-4 w-4" />
            <span>Acessar listagem de planilhas</span>
          </Link>
        </div>
        
        <div className="text-center text-xs text-gray-500 pt-2">
          <p>Formatos suportados: .csv (até 10MB)</p>
          <p className="mt-1">O processamento calculará a nota final como (nota1 + nota2) / 2</p>
        </div>
      </div>
    </div>
  )
}

export default UploadPage