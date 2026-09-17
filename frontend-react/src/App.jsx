import { useState, useEffect } from "react";
import { useStore } from "./store/useStore";
import BottomNav from "./components/BottomNav";
import Toast from "./components/Toast";
import Painel from "./pages/Painel";
import NovoPedido from "./pages/NovoPedido";
import Pedidos from "./pages/Pedidos";
import Produtos from "./pages/Produtos";
import Ajustes from "./pages/Ajustes";
import Login from "./pages/Login";

export default function App() {
  const [pagina, setPagina] = useState("painel");
  const [pedidoParaEditar, setPedidoParaEditar] = useState(null);
  const senha = useStore((s) => s.senha);
  const mostrarToast = useStore((s) => s.mostrarToast);
  const carregarDados = useStore((s) => s.carregarDados);

  // Carregar dados iniciais caso já esteja logado
  useEffect(() => {
    if (senha) {
      carregarDados().catch(() => {});
    }
  }, [senha]);

  function editarPedido(pedido) {
    setPedidoParaEditar(pedido);
    setPagina("novo-pedido");
  }

  function navegarPara(p) {
    // Ao sair do form de novo pedido, limpar edição
    if (p !== "novo-pedido") setPedidoParaEditar(null);
    setPagina(p);
  }

  if (!senha) {
    return (
      <div className="app-container">
        <Login onLoginSucesso={() => setPagina("painel")} />
        <Toast />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-logo">
          <span className="logo-emoji">🌿</span>
          <h1>AgroPad</h1>
        </div>
        <span className="header-badge">Organize seus pedidos</span>
      </header>

      {/* Conteúdo */}
      <main className="app-content">
        {pagina === "painel" && (
          <Painel onEditar={editarPedido} setPagina={navegarPara} />
        )}
        {pagina === "pedidos" && (
          <Pedidos onEditar={editarPedido} />
        )}
        {pagina === "novo-pedido" && (
          <NovoPedido
            pedidoParaEditar={pedidoParaEditar}
            setPagina={navegarPara}
            onSalvo={() => setPedidoParaEditar(null)}
          />
        )}
        {pagina === "produtos" && <Produtos />}
        {pagina === "ajustes" && <Ajustes />}
      </main>

      {/* Navegação */}
      <BottomNav paginaAtiva={pagina} setPagina={navegarPara} />

      {/* Toast */}
      <Toast />
    </div>
  );
}
