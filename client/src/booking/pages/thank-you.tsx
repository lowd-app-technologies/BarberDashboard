import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Calendar, Check, Instagram, Facebook, Twitter } from "lucide-react";

export default function ThankYou() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 border-b bg-primary bg-opacity-10">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-primary bg-opacity-20 p-2 rounded-full">
                <Scissors className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Vossa Barbearia</h1>
            </div>
            <Link href="/">
              <Button variant="outline">
                Voltar para Início
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Conteúdo principal */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/20 p-3">
              <Check className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Agendamento Confirmado!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Agradecemos a preferência! Seu agendamento foi confirmado com sucesso.
            </p>
            <p className="text-muted-foreground">
              Enviamos os detalhes para seu e-mail e você receberá uma confirmação do barbeiro em breve.
            </p>
            
            <div className="mt-8 pt-4 border-t">
              <h3 className="font-medium mb-3">Siga-nos nas redes sociais</h3>
              <div className="flex justify-center space-x-4">
                <a 
                  href="https://instagram.com/vossabarbearia" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-[#833AB4] text-white hover:bg-opacity-80 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a 
                  href="https://facebook.com/vossabarbearia" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-[#3b5998] text-white hover:bg-opacity-80 transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a 
                  href="https://twitter.com/vossabarbearia" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-[#1DA1F2] text-white hover:bg-opacity-80 transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/">
              <Button className="w-full">
                <Calendar className="mr-2 h-4 w-4" /> Fazer Novo Agendamento
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      {/* Footer */}
      <footer className="py-4 border-t text-center text-sm text-muted-foreground">
        <div className="container mx-auto">
          © {new Date().getFullYear()} Vossa Barbearia. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}