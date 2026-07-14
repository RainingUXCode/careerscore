import type { Candidato } from "../../types/models";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import type { ErrosValidacao } from "../../services/validationService";
import { formatarTelefone } from "../../utils/formatters";

interface Props {
  candidato: Candidato;
  atualizarCampo: <K extends keyof Candidato>(
    campo: K,
    valor: Candidato[K]
  ) => void;
  erros: ErrosValidacao;
}

export function DadosPessoaisSection({
  candidato,
  atualizarCampo,
  erros,
}: Props) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Input
        id="nome"
        label="Nome completo"
        placeholder="Seu nome"
        value={candidato.nome}
        onChange={(e) => atualizarCampo("nome", e.target.value)}
        error={erros.nome}
      />
      <Input
        id="email"
        label="E-mail"
        type="email"
        placeholder="seu-email@exemplo.com"
        value={candidato.email}
        onChange={(e) => atualizarCampo("email", e.target.value)}
        error={erros.email}
      />
      <Input
        id="telefone"
        label="Telefone"
        type="tel"
        placeholder="(DDD) 90000-0000"
        value={candidato.telefone}
        onChange={(e) =>
          atualizarCampo("telefone", formatarTelefone(e.target.value))
        }
        maxLength={15}
        inputMode="numeric"
        error={erros.telefone}
      />
      <Input
        id="cidade"
        label="Cidade"
        placeholder="Digite sua cidade"
        value={candidato.cidade}
        onChange={(e) => atualizarCampo("cidade", e.target.value)}
        error={erros.cidade}
      />
      <Input
        id="estado"
        label="Estado"
        placeholder="Ex: SP, RJ, MG"
        value={candidato.estado}
        onChange={(e) => atualizarCampo("estado", e.target.value)}
        error={erros.estado}
      />
      <Select
        id="disponibilidadeMudanca"
        label="Você tem disponibilidade para mudar de cidade por uma oportunidade?"
        value={candidato.disponibilidadeMudanca ?? "prefiro_nao_informar"}
        onChange={(e) =>
          atualizarCampo(
            "disponibilidadeMudanca",
            e.target.value as Candidato["disponibilidadeMudanca"]
          )
        }
        options={[
          { value: "sim", label: "Sim" },
          { value: "nao", label: "Não" },
          { value: "depende", label: "Depende da oportunidade" },
          { value: "prefiro_nao_informar", label: "Prefiro não informar" },
        ]}
      />
    </div>
  );
}
