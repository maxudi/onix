import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import CadastroCondomino from "./CadastroCondomino";

export default function ListaCondominos() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCadastro, setShowCadastro] = useState(false);

  useEffect(() => {
    async function fetchUsuarios() {
      setLoading(true);
      setError("");
      // Verifica se o usuário é admin (exemplo: campo is_admin no perfil)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Acesso restrito. Faça login como administrador.");
        setLoading(false);
        return;
      }
      const { data: perfil } = await supabase
        .from("perfis")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      if (!perfil?.is_admin) {
        setError("Acesso restrito a administradores.");
        setLoading(false);
        return;
      }
      // Busca todos os condôminos na tabela correta
      const { data, error } = await supabase
        .from("perfis")
        .select("id, nome_completo, cpf, telefone, email, bloco_torre, unidade_numero, status_aprovacao");
      if (error) setError(error.message);
      else setUsuarios(data);
      setLoading(false);
    }
    fetchUsuarios();
  }, []);

  if (loading) return <div className="text-center p-6">Carregando usuários...</div>;
  if (error) return <div className="text-center p-6 text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Moradores</h2>
        <button className="btn" onClick={() => setShowCadastro(true)}>Cadastrar Condômino</button>
      </div>
      {showCadastro && (
        <div className="mb-6">
          <CadastroCondomino onClose={() => setShowCadastro(false)} onSuccess={() => { setShowCadastro(false); window.location.reload(); }} />
        </div>
      )}
      <table className="min-w-full table-auto border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-2 py-1">Nome</th>
            <th className="px-2 py-1">CPF</th>
            <th className="px-2 py-1">Telefone</th>
            <th className="px-2 py-1">Email</th>
            <th className="px-2 py-1">Bloco</th>
            <th className="px-2 py-1">Unidade</th>
            <th className="px-2 py-1">Status</th>
            <th className="px-2 py-1">Ação</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id} className="border-t">
              <td className="px-2 py-1">{u.nome_completo}</td>
              <td className="px-2 py-1">{u.cpf}</td>
              <td className="px-2 py-1">{u.telefone}</td>
              <td className="px-2 py-1">{u.email}</td>
              <td className="px-2 py-1">{u.bloco_torre}</td>
              <td className="px-2 py-1">{u.unidade_numero}</td>
              <td className="px-2 py-1">{u.status_aprovacao}</td>
              <td className="px-2 py-1">
                <button className="btn btn-xs mr-1">Visualizar</button>
                <button className="btn btn-xs mr-1">Editar</button>
                <button className="btn btn-xs btn-danger">Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
