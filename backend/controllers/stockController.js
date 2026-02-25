const Stock = require('../models/Stock');
const Boutique = require('../models/Boutique');

async function assertMineBoutiqueOr404({ boutiqueId, ownerId }) {
  const boutique = await Boutique.findOne({ _id: boutiqueId, owner: ownerId });
  if (!boutique) {
    const err = new Error('Boutique non trouvée');
    err.statusCode = 404;
    throw err;
  }
  return boutique;
}

function getErrorMessage(err) {
  return err?.message || 'Erreur serveur';
}

exports.getMineStockForArticle = async (req, res) => {
  try {
    const boutiqueId = req.params.id;
    const articleId = req.params.articleId;

    await assertMineBoutiqueOr404({ boutiqueId, ownerId: req.user._id });

    const stock = await Stock.findOne({ boutique: boutiqueId, article: articleId }).select('quantity');
    res.json({ quantity: stock?.quantity ?? 0 });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: getErrorMessage(err) });
  }
};

exports.setMineStockForArticle = async (req, res) => {
  try {
    const boutiqueId = req.params.id;
    const articleId = req.params.articleId;
    const quantity = Number(req.body?.quantity);

    await assertMineBoutiqueOr404({ boutiqueId, ownerId: req.user._id });

    if (!Number.isFinite(quantity) || quantity < 0) {
      return res.status(400).json({ message: 'Stock invalide' });
    }

    const updated = await Stock.findOneAndUpdate(
      { boutique: boutiqueId, article: articleId },
      { $set: { quantity: Math.floor(quantity) } },
      { upsert: true, new: true }
    ).select('quantity');

    res.json({ quantity: updated.quantity });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: getErrorMessage(err) });
  }
};
