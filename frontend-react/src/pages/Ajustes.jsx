import { useRef } from "react";
import { useStore } from "../store/useStore";

export default function Ajustes() {
  const carregarDados = useStore((s) => s.carregarDados);
  const exportarBackup = useStore((s) => s.exportarBackup);
  const restaurarBackup = useStore((s) => s.restaurarBackup);
  const apagarTudo = useStore((s) => s.apagarTudo);
  const mostrarToast = useStore((s) => s.mostrarToast);
  const definirSenha = useStore((s) => s.definirSenha);
  const deslogar = useStore((s) => s.deslogar);
  const senha = useStore((s) => s.senha);
  const clientes = useStore((s) => s.clientes);
  const pedidos = useStore((s) => s.pedidos);

  const fileRef = useRef(null);

  async function handleBackupExport() {
    try {
      await carregarDados(true);
      await exportarBackup();
      mostrarToast("Backup gerado! ⬆️");
    } catch {
      mostrarToast("⚠️ Erro ao gerar backup.");
    }
  }

  function handleBackupImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dados = JSON.parse(reader.result);
        restaurarBackup(dados);
        mostrarToast("Produtos e observações locais restaurados. ⬇️");
      } catch {
        mostrarToast("Arquivo de backup inválido.");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  async function handleApagarTudo() {
    if (!confirm("Isso apaga TODOS os pedidos e clientes do servidor, além dos produtos locais. Tem certeza?")) return;
    try {
      await carregarDados();
      await apagarTudo();
      mostrarToast("Todos os dados foram apagados.");
    } catch (err) {
      console.error(err);
      mostrarToast("⚠️ Erro ao apagar tudo.");
    }
  }

  function handleAlterarSenha() {
    const nova = prompt("Digite a nova senha da API:", senha || "");
    if (nova !== null) {
      definirSenha(nova);
      mostrarToast("Senha atualizada! ✅");
    }
  }

  function handleDeslogar() {
    if (confirm("Deseja realmente sair da sua conta? Seus dados continuarão salvos no servidor.")) {
      deslogar();
      mostrarToast("Você saiu do sistema.");
    }
  }

  return (
    <section className="app-section">
      <div className="section-header">
        <h2>Ajustes</h2>
        <p className="section-subtitle">Backup e configurações</p>
      </div>

      {/* Conta e Sessão */}
      <div className="config-card">
        <h3>👤 Sessão Ativa</h3>
        <p>
          Conectado com segurança ao AgroPad. 
          <br />
          <strong>{pedidos.length}</strong> pedidos e <strong>{clientes.length}</strong> clientes sincronizados.
        </p>
        <button className="btn btn-outline btn-full" onClick={handleDeslogar} style={{ color: "var(--danger)", borderColor: "#ffcdd2" }}>
          🚪 Sair da Conta (Logout)
        </button>
      </div>

      {/* Backup */}
      <div className="config-card">
        <h3>📦 Cópia de Segurança</h3>
        <p>Salve uma cópia dos seus dados para não perder caso troque de celular ou limpe o navegador.</p>
        <div className="config-actions">
          <button className="btn btn-outline btn-full" onClick={handleBackupExport}>
            ⬆️ Fazer Backup
          </button>
          <div className="file-input-wrapper">
            <button className="btn btn-outline btn-full btn-file-dummy">
              ⬇️ Restaurar Backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleBackupImport}
            />
          </div>
        </div>
      </div>

      {/* Zona de perigo */}
      <div className="config-card danger-zone">
        <h3>⚠️ Zona de Perigo</h3>
        <p>Apagar todos os pedidos e produtos cadastrados permanentemente.</p>
        <button className="btn btn-danger btn-full" onClick={handleApagarTudo}>
          Apagar Tudo
        </button>
      </div>
    </section>
  );
}
