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

  // Debug: Log the received form data
  console.log('Received form data:', req.body);
  
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
  
  // Debug: Log individual values
  console.log('Parsed values:', {
    age: age, 
    gender: gender,
    hemoglobin: hemoglobin,
    hematocrit: hematocrit,
    wbc: wbc,
    platelets: platelets,
    glucose: glucose,
    cholesterolTotal: cholesterolTotal,
    hdl: hdl,
    ldl: ldl,
    triglycerides: triglycerides
  });

  const abnormalities = [];
  const recommendations = [];

  // Blood glucose analysis
  if (glucose > 126) {
    abnormalities.push("Glucose élevé - possible diabète (>126 mg/dL)");
    recommendations.push("Consulter un médecin pour confirmation du diabète et traitement approprié.");
  } else if (glucose > 100) {
    abnormalities.push("Glucose légèrement élevé - pré-diabète (100-125 mg/dL)");
    recommendations.push("Réduire les sucres rapides, pratiquer 30 min de sport par jour.");
  }

  // Cholesterol analysis
  if (cholesterolTotal > 240) {
    abnormalities.push("Cholestérol total très élevé (>240 mg/dL)");
    recommendations.push("Consulter un médecin, régime strict pauvre en graisses saturées.");
  } else if (cholesterolTotal > 200) {
    abnormalities.push("Cholestérol total élevé (200-240 mg/dL)");
    recommendations.push("Limiter les graisses saturées, consommer plus de fibres.");
  }

  // HDL analysis
  if (hdl < 40 && gender === 'male') {
    abnormalities.push("HDL (bon cholestérol) trop bas chez l'homme (<40 mg/dL)");
    recommendations.push("Augmenter l'activité physique, consommer des oméga-3.");
  } else if (hdl < 50 && gender === 'female') {
    abnormalities.push("HDL (bon cholestérol) trop bas chez la femme (<50 mg/dL)");
    recommendations.push("Augmenter l'activité physique, consommer des oméga-3.");
  }

  // LDL analysis
  if (ldl > 160) {
    abnormalities.push("LDL (mauvais cholestérol) très élevé (>160 mg/dL)");
    recommendations.push("Régime pauvre en graisses saturées, éventuellement statines selon médecin.");
  } else if (ldl > 130) {
    abnormalities.push("LDL (mauvais cholestérol) élevé (130-160 mg/dL)");
    recommendations.push("Réduire les graisses saturées et trans, augmenter les fibres.");
  }

  // Triglycerides analysis
  if (triglycerides > 200) {
    abnormalities.push("Triglycérides élevés (>200 mg/dL)");
    recommendations.push("Réduire l'alcool et les sucres, perdre du poids si nécessaire.");
  }

  // Hemoglobin analysis (gender-specific)
  if (gender === 'male' && hemoglobin < 13.5) {
    abnormalities.push("Hémoglobine basse chez l'homme (<13.5 g/dL)");
    recommendations.push("Possible carence en fer, consulter un médecin pour bilan complet.");
  } else if (gender === 'female' && hemoglobin < 12.0) {
    abnormalities.push("Hémoglobine basse chez la femme (<12.0 g/dL)");
    recommendations.push("Possible carence en fer, consommer plus d'aliments riches en fer.");
  }

  // Hematocrit analysis
  if (gender === 'male' && hematocrit < 38.3) {
    abnormalities.push("Hématocrite bas chez l'homme (<38.3%)");
    recommendations.push("Évaluation pour anémie, consulter un médecin.");
  } else if (gender === 'female' && hematocrit < 35.5) {
    abnormalities.push("Hématocrite bas chez la femme (<35.5%)");
    recommendations.push("Évaluation pour anémie, consulter un médecin.");
  }

  // White blood cells analysis
  if (wbc > 11.0) {
    abnormalities.push("Globules blancs élevés (>11.0 ×10³/µL)");
    recommendations.push("Possible infection ou inflammation, consulter un médecin.");
  } else if (wbc < 4.0) {
    abnormalities.push("Globules blancs bas (<4.0 ×10³/µL)");
    recommendations.push("Système immunitaire affaibli possible, consulter un médecin.");
  }

  // Platelets analysis
  if (platelets > 450) {
    abnormalities.push("Plaquettes élevées (>450 ×10³/µL)");
    recommendations.push("Risque de thrombose, consulter un hématologue.");
  } else if (platelets < 150) {
    abnormalities.push("Plaquettes basses (<150 ×10³/µL)");
    recommendations.push("Risque de saignement, consulter un médecin.");
  }

  try {
    // Check if user is authenticated
    if (!req.session || !req.session.userId) {
      console.error('User not authenticated - no session userId');
      return res.status(401).render('analyze', {
        errors: [{ msg: 'Vous devez être connecté pour sauvegarder une analyse' }],
        inputData: req.body,
        result: null
      });
    }

    console.log('Attempting to save analysis for user:', req.session.userId);
    console.log('Form data received:', { age, gender, hemoglobin, hematocrit, wbc, platelets, glucose, cholesterolTotal, hdl, ldl, triglycerides });

    // Create analysis object with validation
    const analysisData = {
      userId: req.session.userId,
      testData: {
        age: age ? parseInt(age) : null,
        gender: gender || null,
        hemoglobin: hemoglobin ? parseFloat(hemoglobin) : null,
        hematocrit: hematocrit ? parseFloat(hematocrit) : null,
        wbc: wbc ? parseFloat(wbc) : null,
        platelets: platelets ? parseInt(platelets) : null,
        glucose: glucose ? parseFloat(glucose) : null,
        cholesterolTotal: cholesterolTotal ? parseFloat(cholesterolTotal) : null,
        hdl: hdl ? parseFloat(hdl) : null,
        ldl: ldl ? parseFloat(ldl) : null,
        triglycerides: triglycerides ? parseFloat(triglycerides) : null
      },
      analysis: { 
        abnormalities, 
        recommendations 
      },
      date: new Date()
    };

    console.log('Analysis data to save:', analysisData);

    // Save analysis to database
    const analysis = new Analysis(analysisData);
    const savedAnalysis = await analysis.save();
    console.log('✅ Analysis saved successfully with ID:', savedAnalysis._id);

    const result = {
      abnormalities,
      recommendations,
      date: new Date()
    };

    res.render('analyze', {
      errors: [],
      inputData: req.body,
      result
    });
  } catch (err) {
    console.error('Detailed error saving analysis:', err);
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    
    // More specific error handling
    let errorMessage = 'Erreur lors de la sauvegarde de l\'analyse';
    
    if (err.name === 'ValidationError') {
      console.error('Validation errors:', err.errors);
      const validationErrors = Object.values(err.errors).map(e => e.message);
      errorMessage = 'Données invalides: ' + validationErrors.join(', ');
    } else if (err.name === 'MongoNetworkError') {
      errorMessage = 'Erreur de connexion à la base de données';
    } else if (err.code === 11000) {
      errorMessage = 'Cette analyse existe déjà';
    }
    
    // Make sure we always send a response
    if (!res.headersSent) {
      res.status(500).render('analyze', {
        errors: [{ msg: errorMessage }],
        inputData: req.body,
        result: null
      });
    }
  }
};