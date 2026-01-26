import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function PerfilCondomino() {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fotoUrl, setFotoUrl] = useState("");

  useEffect(() => {
    async function fetchPerfil() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) setPerfil(data);
      setLoading(false);
      // Busca foto do storage
      const { data: foto } = await supabase.storage
        .from("fotos-condominos")
        .getPublicUrl(`${user.id}.jpg`);
      if (foto?.publicUrl) setFotoUrl(foto.publicUrl);
    }
    fetchPerfil();
  }, []);

  if (loading) return <div className="text-center p-6">Carregando perfil...</div>;
  if (!perfil) return <div className="text-center p-6 text-red-500">Perfil não encontrado.</div>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Meu Perfil</h2>
      {fotoUrl && (
        <img src={fotoUrl} alt="Foto do condômino" className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" />
      )}
      <div className="space-y-2">
        <div><strong>Nome:</strong> {perfil.nome}</div>
        <div><strong>CPF:</strong> {perfil.cpf}</div>
        <div><strong>Telefone:</strong> {perfil.telefone}</div>
        <div><strong>Email:</strong> {perfil.email}</div>
        <div><strong>Endereço:</strong> {perfil.logradouro}, {perfil.numero}, {perfil.bairro}, {perfil.cidade} - {perfil.uf}, CEP: {perfil.cep}</div>
        <div><strong>Bloco:</strong> {perfil.bloco}</div>
        <div><strong>Unidade:</strong> {perfil.unidade}</div>
      </div>
    </div>
  );
}
