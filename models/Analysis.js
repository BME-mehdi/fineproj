// models/Analysis.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const analysisSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Utilisateur requis'],
    index: true
  },
  
  // Données démographiques - moved to root level to match controller
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

// Compound indexes for frequent queries
analysisSchema.index({ userId: 1, date: -1 });
analysisSchema.index({ userId: 1, status: 1 });
analysisSchema.index({ 'analysis.riskLevel': 1, date: -1 });

// Virtual for calculating relative age of analysis
analysisSchema.virtual('daysAgo').get(function() {
  return Math.floor((Date.now() - this.date) / (1000 * 60 * 60 * 24));
});

// Method to mark as completed
analysisSchema.methods.markCompleted = function() {
  this.status = 'completed';
  return this.save();
};

// Method to add recommendation
analysisSchema.methods.addRecommendation = function(recommendation) {
  this.analysis.recommendations.push(recommendation);
  return this.save();
};

// Static method to find recent analyses by user
analysisSchema.statics.findRecentByUser = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ date: -1 })
    .limit(limit)
    .populate('userId', 'email');
};

// Static method to find high-risk analyses
analysisSchema.statics.findHighRisk = function() {
  return this.find({ 
    'analysis.riskLevel': { $in: ['high', 'critical'] } 
  })
  .sort({ date: -1 })
  .populate('userId', 'email');
};

// Pre-save validation for lipid data consistency
analysisSchema.pre('save', function(next) {
  const { cholesterolTotal, hdl, ldl, triglycerides } = this.testData;
  
  // Skip validation if any required values are missing
  if (!cholesterolTotal || !hdl || !ldl || !triglycerides) {
    return next();
  }
  
  // Friedewald formula approximation: Total ≈ HDL + LDL + (Triglycerides/5)
  const calculatedTotal = hdl + ldl + (triglycerides / 5);
  const tolerance = Math.max(cholesterolTotal * 0.15, 20); // 15% tolerance or 20mg/dL minimum
  
  if (Math.abs(cholesterolTotal - calculatedTotal) > tolerance) {
    console.warn(`Lipid inconsistency detected: Total=${cholesterolTotal}, Calculated=${calculatedTotal.toFixed(1)}`);
    // Log warning but don't fail save - lab values can have variations
  }
  
  next();
});

export default mongoose.model('Analysis', analysisSchema);
