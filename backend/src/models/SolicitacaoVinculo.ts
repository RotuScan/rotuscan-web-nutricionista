
import mongoose, { Schema, Types } from "mongoose";

export interface ISolicitacaoVinculo {
  _id: Types.ObjectId;
  pacienteId: Types.ObjectId;
  nutricionistaId: Types.ObjectId;
  status: "PENDENTE" | "APROVADO" | "RECUSADO";
  createdAt?: Date;
  updatedAt?: Date;
}

const solicitacaoVinculoSchema = new Schema<ISolicitacaoVinculo>(
  {
    pacienteId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    nutricionistaId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Nutricionista",
    },

    status: {
      type: String,
      enum: ["PENDENTE", "APROVADO", "RECUSADO"],
      default: "PENDENTE",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "solicitacoesVinculo",
  }
);

// Impede solicitações pendentes duplicadas
// para o mesmo paciente e nutricionista.
solicitacaoVinculoSchema.index(
  { pacienteId: 1, nutricionistaId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "PENDENTE",
    },
  }
);

solicitacaoVinculoSchema.index({
  nutricionistaId: 1,
  status: 1,
  createdAt: -1,
});


export const SolicitacaoVinculo: mongoose.Model<ISolicitacaoVinculo> =
  (mongoose.models.SolicitacaoVinculo as
    | mongoose.Model<ISolicitacaoVinculo>
    | undefined) ??
  mongoose.model<ISolicitacaoVinculo>(
    "SolicitacaoVinculo",
    solicitacaoVinculoSchema
  );

