import { useState } from "react";
import { useStore } from "../store/useStore";
import { api } from "../api";

export default function Login({ onLoginSucesso }) {
  const [senhaInput, setSenhaInput] = useState("");
  const [lembrar, setLembrar] = useState(true);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const definirSenha = useStore((s) => s.definirSenha);
  const carregarDados = useStore((s) => s.carregarDados);
  const mostrarToast = useStore((s) => s.mostrarToast);

  async function handleLogin(e) {
    e.preventDefault();
    const chave = senhaInput.trim();
    if (!chave) {
      setErro("Por favor, digite a sua senha de acesso.");
      return;
    }

    setLoading(true);
    setErro("");

    try {
      // Temporariamente define a senha para testar na API
      definirSenha(chave);
      
      // Valida com uma chamada real ao servidor
      await carregarDados(true);

      if (!lembrar) {
        // Se desmarcou lembrar, só manterá na sessão da aba
        sessionStorage.setItem("agropad_senha_api", chave);
      }

      mostrarToast("Acesso autorizado! Bem-vindo de volta 🌿");
      if (onLoginSucesso) onLoginSucesso();
    } catch (err) {
      console.error(err);
      definirSenha(""); // Limpa senha inválida
      if (err.message && err.message.includes("401")) {
        setErro("Senha incorreta. Verifique e tente novamente.");
      } else {
        setErro("Não foi possível conectar ao servidor. Verifique a internet e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-circle">
            <span className="login-logo-emoji">🌿</span>
          </div>
          <h2>AgroPad</h2>
          <p className="login-subtitle">Acesso do Produtor</p>
        </div>

        <div className="login-info-box">
          <span className="info-icon">🛡️</span>
          <p>
            Todos os seus <strong>pedidos, clientes e histórico</strong> estão salvos na nuvem e aparecerão logo após o acesso.
          </p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {erro && (
            <div className="login-error-alert" role="alert">
              <span>⚠️</span>
              <p>{erro}</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="senha-input">Senha de Acesso</label>
            <div className="password-input-container">
              <input
                id="senha-input"
                type={mostrarSenha ? "text" : "password"}
                placeholder="Digite a senha..."
                value={senhaInput}
                onChange={(e) => {
                  setSenhaInput(e.target.value);
                  if (erro) setErro("");
                }}
                autoFocus
                disabled={loading}
                required
              />
              <button
                type="button"
                className="btn-toggle-eye"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                title={mostrarSenha ? "Ocultar senha" : "Ver senha"}
                tabIndex={-1}
              >
                {mostrarSenha ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={lembrar}
                onChange={(e) => setLembrar(e.target.checked)}
                disabled={loading}
              />
              <span>Manter conectado neste aparelho</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-login"
            disabled={loading}
          >
            {loading ? (
              <span className="login-spinner-text">
                <span className="spinner-mini"></span> Verificando acesso...
              </span>
            ) : (
              "Entrar no AgroPad"
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="login-help-text">
            💡 Dica: Se precisar de ajuda com a senha, consulte o administrador do sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
