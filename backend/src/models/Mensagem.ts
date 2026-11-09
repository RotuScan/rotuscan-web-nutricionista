
import mongoose, { Schema, Types } from "mongoose";

export interface IMensagem {
  pacienteId: Types.ObjectId;
  nutricionistaId: Types.ObjectId;
  remetenteTipo: "PACIENTE" | "NUTRICIONISTA";
  texto: string;
  lidaEm: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const mensagemSchema = new Schema<IMensagem>(
  {
    pacienteId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    nutricionistaId: {
      type: Schema.Types.ObjectId,
      ref: "Nutricionista",
      required: true,
      index: true,
    },

    remetenteTipo: {
      type: String,
      enum: ["PACIENTE", "NUTRICIONISTA"],
      required: true,
    },

    texto: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    lidaEm: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "mensagens",
  }
);

mensagemSchema.index({
  pacienteId: 1,
  nutricionistaId: 1,
  createdAt: -1,
});

export const Mensagem =
  (mongoose.models.Mensagem as
    | mongoose.Model<IMensagem>
    | undefined) ??
  mongoose.model<IMensagem>("Mensagem", mensagemSchema);
