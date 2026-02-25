const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const Stock = require('../models/Stock');

// Catalogue public: lire tous les articles actifs (toutes boutiques)
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate('boutique', 'name category');
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Détail public: lire un article par id (avec boutique)
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findOne({ _id: req.params.id, isActive: true }).populate(
      'boutique',
      'name category'
    );
    if (!article) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    res.json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Stock public: stock total restant pour cet article (lié à sa boutique)
router.get('/:id/stock', async (req, res) => {
  try {
    const article = await Article.findOne({ _id: req.params.id, isActive: true }).select('_id boutique');
    if (!article) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    const stock = await Stock.findOne({ boutique: article.boutique, article: article._id }).select('quantity');
    res.json({ quantity: stock?.quantity ?? 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;