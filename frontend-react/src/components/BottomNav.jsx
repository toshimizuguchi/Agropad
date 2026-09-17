export default function BottomNav({ paginaAtiva, setPagina }) {
  const itens = [
    { id: "painel", icon: "📊", label: "Painel" },
    { id: "pedidos", icon: "📋", label: "Pedidos" },
    { id: "novo-pedido", icon: null, label: "Anotar", main: true },
    { id: "produtos", icon: "🥬", label: "Produtos" },
    { id: "ajustes", icon: "⚙️", label: "Ajustes" },
  ];

  return (
    <nav className="app-nav">
      {itens.map((item) =>
        item.main ? (
          <button
            key={item.id}
            className={`nav-item nav-item-main${paginaAtiva === item.id ? " active" : ""}`}
            onClick={() => setPagina(item.id)}
            aria-label="Anotar pedido"
          >
            <div className="nav-icon-circle">
              <span className="plus-icon">＋</span>
            </div>
            <span className="nav-label">{item.label}</span>
          </button>
        ) : (
          <button
            key={item.id}
            className={`nav-item${paginaAtiva === item.id ? " active" : ""}`}
            onClick={() => setPagina(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        )
      )}
    </nav>
  );
}
