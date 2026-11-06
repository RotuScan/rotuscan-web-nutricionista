
import mongoose, { Schema } from "mongoose";

export interface INutricionista {
  idLegado?: string;
  nome: string;
  email: string;
  senha: string;
  crn?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const schema = new Schema<INutricionista>(
  {
    idLegado: {
      type: String,
      unique: true,
      sparse: true,
    },

    nome: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    senha: {
      type: String,
      required: true,
    },

    crn: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 40,
    },
  },
  {
    timestamps: true,
    collection: "nutricionistas",
  }
);

schema.index(
  { crn: 1 },
  {
    unique: true,
    partialFilterExpression: {
      crn: { $type: "string", $gt: "" },
    },
  }
);

export const NutricionistaMongo: mongoose.Model<INutricionista> =
  (mongoose.models.Nutricionista as mongoose.Model<INutricionista> | undefined) ??
  mongoose.model<INutricionista>(
    "Nutricionista",
    schema
  );
