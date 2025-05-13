import { Link } from "wouter";
import { CheckCircle, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ThankYou() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 border-b bg-primary bg-opacity-10">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-primary bg-opacity-20 p-2 rounded-full">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Vossa Barbearia</h1>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto py-16 px-4 flex justify-center items-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-green-100 rounded-full p-3 w-16 h-16 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Agendamento Confirmado!</CardTitle>
            <CardDescription>
              Seu horário foi agendado com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6">
              Enviamos um e-mail de confirmação com os detalhes do seu agendamento. 
              O barbeiro também vai entrar em contato para confirmar seu horário.
            </p>
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-muted rounded-md">
                <p className="font-semibold mb-1">Lembrete Importante</p>
                <p>Caso precise cancelar ou remarcar, faça com antecedência mínima de 1 hora.</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Link href="/booking">
              <Button variant="default" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Agendamentos
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Voltar para a Página Inicial
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}