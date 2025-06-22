// controllers/analysisController.js
import { validationResult } from 'express-validator';
import Analysis from '../models/Analysis.js';

export const getAnalyzePage = (req, res) => {
  res.render('analyze', { 
    errors: [], 
    inputData: {}, 
    result: null 
  });
};

export const submitTestData = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('analyze', { 
      errors: errors.array(),
      inputData: req.body,
      result: null
    });
  }

  // Extract and validate form data
  const { 
    age, 
    gender, 
    hemoglobin, 
    hematocrit, 
    wbc, 
    platelets, 
    glucose, 
    cholesterolTotal, 
    hdl, 
    ldl, 
    triglycerides 
  } = req.body;
  
  console.log('Processing analysis for user:', req.session.userId);

  // Convert and validate numeric values
  const numericData = {
    age: parseInt(age),
    hemoglobin: parseFloat(hemoglobin),
    hematocrit: parseFloat(hematocrit),
    wbc: parseFloat(wbc),
    platelets: parseInt(platelets),
    glucose: parseFloat(glucose),
    cholesterolTotal: parseFloat(cholesterolTotal),
    hdl: parseFloat(hdl),
    ldl: parseFloat(ldl),
    triglycerides: parseFloat(triglycerides)
  };

  // Validate numeric conversions
  for (const [key, value] of Object.entries(numericData)) {
    if (isNaN(value)) {
      return res.status(400).render('analyze', {
        errors: [{ msg: `Valeur invalide pour ${key}` }],
        inputData: req.body,
        result: null
      });
    }
  }

  const abnormalities = [];
  const recommendations = [];
  let riskLevel = 'low';
  let riskScore = 0;

  // Blood glucose analysis
  if (numericData.glucose > 126) {
    abnormalities.push("Glucose élevé - possible diabète (>126 mg/dL)");
    recommendations.push("Consulter un médecin pour confirmation du diabète et traitement approprié.");
    riskLevel = 'high';
    riskScore += 25;
  } else if (numericData.glucose > 100) {
    abnormalities.push("Glucose légèrement élevé - pré-diabète (100-125 mg/dL)");
    recommendations.push("Réduire les sucres rapides, pratiquer 30 min de sport par jour.");
    riskLevel = Math.max(riskLevel, 'moderate');
    riskScore += 15;
  }

  // Cholesterol analysis
  if (numericData.cholesterolTotal > 240) {
    abnormalities.push("Cholestérol total très élevé (>240 mg/dL)");
    recommendations.push("Consulter un médecin, régime strict pauvre en graisses saturées.");
    riskLevel = 'high';
    riskScore += 20;
  } else if (numericData.cholesterolTotal > 200) {
    abnormalities.push("Cholestérol total élevé (200-240 mg/dL)");
    recommendations.push("Limiter les graisses saturées, consommer plus de fibres.");
    riskLevel = Math.max(riskLevel, 'moderate');
    riskScore += 10;
  }

  // HDL analysis (gender-specific)
  const hdlThreshold = gender === 'male' ? 40 : 50;
  if (numericData.hdl < hdlThreshold) {
    const genderText = gender === 'male' ? 'chez l\'homme' : 'chez la femme';
    abnormalities.push(`HDL (bon cholestérol) trop bas ${genderText} (<${hdlThreshold} mg/dL)`);
    recommendations.push("Augmenter l'activité physique, consommer des oméga-3.");
    riskLevel = Math.max(riskLevel, 'moderate');
    riskScore += 15;
  }

  // LDL analysis
  if (numericData.ldl > 160) {
    abnormalities.push("LDL (mauvais cholestérol) très élevé (>160 mg/dL)");
    recommendations.push("Régime pauvre en graisses saturées, éventuellement statines selon médecin.");
    riskLevel = 'high';
    riskScore += 20;
  } else if (numericData.ldl > 130) {
    abnormalities.push("LDL (mauvais cholestérol) élevé (130-160 mg/dL)");
    recommendations.push("Réduire les graisses saturées et trans, augmenter les fibres.");
    riskLevel = Math.max(riskLevel, 'moderate');
    riskScore += 10;
  }

  // Triglycerides analysis
  if (numericData.triglycerides > 200) {
    abnormalities.push("Triglycérides élevés (>200 mg/dL)");
    recommendations.push("Réduire l'alcool et les sucres, perdre du poids si nécessaire.");
    riskLevel = Math.max(riskLevel, 'moderate');
    riskScore += 15;
  }

  // Hemoglobin analysis (gender-specific)
  const hemoglobinThreshold = gender === 'male' ? 13.5 : 12.0;
  if (numericData.hemoglobin < hemoglobinThreshold) {
    const genderText = gender === 'male' ? 'chez l\'homme' : 'chez la femme';
    abnormalities.push(`Hémoglobine basse ${genderText} (<${hemoglobinThreshold} g/dL)`);
    recommendations.push("Possible carence en fer, consulter un médecin pour bilan complet.");
    riskLevel = Math.max(riskLevel, 'moderate');
    riskScore += 15;
  }

  // Hematocrit analysis (gender-specific)
  const hematocritThreshold = gender === 'male' ? 38.3 : 35.5;
  if (numericData.hematocrit < hematocritThreshold) {
    const genderText = gender === 'male' ? 'chez l\'homme' : 'chez la femme';
    abnormalities.push(`Hématocrite bas ${genderText} (<${hematocritThreshold}%)`);
    recommendations.push("Évaluation pour anémie, consulter un médecin.");
    riskLevel = Math.max(riskLevel, 'moderate');
    riskScore += 15;
  }

  // White blood cells analysis
  if (numericData.wbc > 11.0) {
    abnormalities.push("Globules blancs élevés (>11.0 ×10³/µL)");
    recommendations.push("Possible infection ou inflammation, consulter un médecin.");
    riskLevel = Math.max(riskLevel, 'moderate');
    riskScore += 20;
  } else if (numericData.wbc < 4.0) {
    abnormalities.push("Globules blancs bas (<4.0 ×10³/µL)");
    recommendations.push("Système immunitaire affaibli possible, consulter un médecin.");
    riskLevel = Math.max(riskLevel, 'moderate');
    riskScore += 20;
  }

  // Platelets analysis
  if (numericData.platelets > 450) {
    abnormalities.push("Plaquettes élevées (>450 ×10³/µL)");
    recommendations.push("Risque de thrombose, consulter un hématologue.");
    riskLevel = 'high';
    riskScore += 25;
  } else if (numericData.platelets < 150) {
    abnormalities.push("Plaquettes basses (<150 ×10³/µL)");
    recommendations.push("Risque de saignement, consulter un médecin.");
    riskLevel = Math.max(riskLevel, 'moderate');
    riskScore += 20;
  }

  // Determine final risk level based on score
  if (riskScore >= 50) {
    riskLevel = 'critical';
  } else if (riskScore >= 30) {
    riskLevel = 'high';
  } else if (riskScore >= 15) {
    riskLevel = 'moderate';
  }

  try {
    // Verify user authentication
    if (!req.session?.userId) {
      console.error('User not authenticated - no session userId');
      return res.status(401).render('analyze', {
        errors: [{ msg: 'Vous devez être connecté pour sauvegarder une analyse' }],
        inputData: req.body,
        result: null
      });
    }

    // Create analysis object with corrected structure
    const analysisData = {
      userId: req.session.userId,
      age: numericData.age,          // Fixed: moved to root level
      gender: gender,                // Fixed: moved to root level
      testData: {
        hemoglobin: numericData.hemoglobin,
        hematocrit: numericData.hematocrit,
        wbc: numericData.wbc,
        platelets: numericData.platelets,
        glucose: numericData.glucose,
        cholesterolTotal: numericData.cholesterolTotal,
        hdl: numericData.hdl,
        ldl: numericData.ldl,
        triglycerides: numericData.triglycerides
      },
      analysis: { 
        abnormalities, 
        recommendations,
        riskLevel,
        score: Math.min(riskScore, 100) // Cap at 100
      },
      status: 'completed',
      date: new Date()
    };

    console.log('Saving analysis with structure:', {
      userId: analysisData.userId,
      age: analysisData.age,
      gender: analysisData.gender,
      testDataKeys: Object.keys(analysisData.testData),
      abnormalitiesCount: abnormalities.length,
      riskLevel: riskLevel
    });

    // Save analysis to database
    const analysis = new Analysis(analysisData);
    const savedAnalysis = await analysis.save();
    console.log('✅ Analysis saved successfully with ID:', savedAnalysis._id);

    const result = {
      abnormalities,
      recommendations,
      riskLevel,
      score: riskScore,
      date: new Date()
    };

    res.render('analyze', {
      errors: [],
      inputData: req.body,
      result
    });

  } catch (error) {
    console.error('Error saving analysis:', error);
    
    let errorMessage = 'Erreur lors de la sauvegarde de l\'analyse';
    
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
      const validationErrors = Object.values(error.errors).map(e => e.message);
      errorMessage = 'Données invalides: ' + validationErrors.join(', ');
    } else if (error.name === 'MongoNetworkError') {
      errorMessage = 'Erreur de connexion à la base de données';
    } else if (error.code === 11000) {
      errorMessage = 'Conflit de données - cette analyse pourrait déjà exister';
    } else if (error.name === 'CastError') {
      errorMessage = 'Format de données incorrect';
    }
    
    // Always ensure we send a response
    if (!res.headersSent) {
      res.status(500).render('analyze', {
        errors: [{ msg: errorMessage }],
        inputData: req.body,
        result: null
      });
    }
  }
};
