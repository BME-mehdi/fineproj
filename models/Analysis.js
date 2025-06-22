// server/models/Analysis.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const analysisSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Utilisateur requis'],
    index: true
  },
  
  // Données démographiques pour affiner les plages
  age: { 
    type: Number, 
    required: [true, 'Âge requis'],
    min: [0, 'Âge doit être positif'],
    max: [120, 'Âge invalide']
  },
  gender: { 
    type: String, 
    required: [true, 'Genre requis'], 
    enum: {
      values: ['male', 'female'],
      message: 'Genre doit être "male" ou "female"'
    }
  },
  
  testData: {
    // Numération-formule sanguine (NFS)
    hemoglobin: { 
      type: Number, 
      required: [true, 'Hémoglobine requise'],
      min: [0, 'Hémoglobine doit être positive'],
      max: [30, 'Valeur hémoglobine trop élevée'] // g/dL
    },
    hematocrit: { 
      type: Number, 
      required: [true, 'Hématocrite requis'],
      min: [0, 'Hématocrite doit être positif'],
      max: [100, 'Hématocrite ne peut pas dépasser 100%'] // %
    },
    wbc: { 
      type: Number, 
      required: [true, 'Globules blancs requis'],
      min: [0, 'WBC doit être positif'],
      max: [100, 'Valeur WBC trop élevée'] // milliers/µL
    },
    platelets: { 
      type: Number, 
      required: [true, 'Plaquettes requises'],
      min: [0, 'Plaquettes doivent être positives'],
      max: [2000, 'Valeur plaquettes trop élevée'] // milliers/µL
    },
    
    // Bilans biochimiques de base
    glucose: { 
      type: Number, 
      required: [true, 'Glucose requis'],
      min: [0, 'Glucose doit être positif'],
      max: [1000, 'Valeur glucose trop élevée'] // mg/dL
    },
    cholesterolTotal: { 
      type: Number, 
      required: [true, 'Cholestérol total requis'],
      min: [0, 'Cholestérol total doit être positif'],
      max: [1000, 'Valeur cholestérol total trop élevée'] // mg/dL
    },
    hdl: { 
      type: Number, 
      required: [true, 'HDL requis'],
      min: [0, 'HDL doit être positif'],
      max: [200, 'Valeur HDL trop élevée'] // mg/dL
    },
    ldl: { 
      type: Number, 
      required: [true, 'LDL requis'],
      min: [0, 'LDL doit être positif'],
      max: [500, 'Valeur LDL trop élevée'] // mg/dL
    },
    triglycerides: { 
      type: Number, 
      required: [true, 'Triglycérides requis'],
      min: [0, 'Triglycérides doivent être positifs'],
      max: [2000, 'Valeur triglycérides trop élevée'] // mg/dL
    }
    // Extensible pour d'autres métriques (créatinine, ferritine, TSH, etc.)
  },
  
  analysis: {
    abnormalities: [{ 
      type: String,
      trim: true,
      maxlength: [500, 'Anomalie trop longue']
    }],
    recommendations: [{ 
      type: String,
      trim: true,
      maxlength: [1000, 'Recommandation trop longue']
    }],
    riskLevel: {
      type: String,
      enum: {
        values: ['low', 'moderate', 'high', 'critical'],
        message: 'Niveau de risque invalide'
      },
      default: 'low'
    },
    score: {
      type: Number,
      min: [0, 'Score doit être positif'],
      max: [100, 'Score ne peut pas dépasser 100']
    }
  },
  
  // Statut de l'analyse
  status: {
    type: String,
    enum: {
      values: ['pending', 'completed', 'reviewed'],
      message: 'Statut invalide'
    },
    default: 'pending'
  },
  
  // Metadata
  notes: {
    type: String,
    maxlength: [2000, 'Notes trop longues'],
    trim: true
  },
  
  date: { 
    type: Date, 
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes composés pour les requêtes fréquentes
analysisSchema.index({ userId: 1, date: -1 });
analysisSchema.index({ userId: 1, status: 1 });
analysisSchema.index({ 'analysis.riskLevel': 1, date: -1 });

// Virtual pour calculer l'âge relatif de l'analyse
analysisSchema.virtual('daysAgo').get(function() {
  return Math.floor((Date.now() - this.date) / (1000 * 60 * 60 * 24));
});

// Méthode pour marquer comme complétée
analysisSchema.methods.markCompleted = function() {
  this.status = 'completed';
  return this.save();
};

// Méthode pour ajouter une recommandation
analysisSchema.methods.addRecommendation = function(recommendation) {
  this.analysis.recommendations.push(recommendation);
  return this.save();
};

// Méthode statique pour trouver les analyses récentes d'un utilisateur
analysisSchema.statics.findRecentByUser = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ date: -1 })
    .limit(limit)
    .populate('userId', 'email');
};

// Méthode statique pour trouver les analyses à risque élevé
analysisSchema.statics.findHighRisk = function() {
  return this.find({ 
    'analysis.riskLevel': { $in: ['high', 'critical'] } 
  })
  .sort({ date: -1 })
  .populate('userId', 'email');
};

// Validation personnalisée pour vérifier la cohérence des données lipidiques
analysisSchema.pre('save', function(next) {
  const { cholesterolTotal, hdl, ldl, triglycerides } = this.testData;
  
  // Vérification approximative de la formule de Friedewald
  // Cholestérol total ≈ HDL + LDL + (Triglycérides/5)
  const calculatedTotal = hdl + ldl + (triglycerides / 5);
  const tolerance = cholesterolTotal * 0.15; // 15% de tolérance
  
  if (Math.abs(cholesterolTotal - calculatedTotal) > tolerance) {
    const error = new Error('Incohérence dans les valeurs lipidiques');
    error.name = 'ValidationError';
    return next(error);
  }
  
  next();
});

export default mongoose.model('Analysis', analysisSchema);