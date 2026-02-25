const Purchase = require('../models/Purchase');
const Article = require('../models/Article');
const Boutique = require('../models/Boutique');
const Stock = require('../models/Stock');

function getErrorMessage(err) {
  return err?.message || 'Erreur serveur';
}

exports.checkout = async (req, res) => {
  try {
    const clientId = req.user?._id;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Panier vide' });
    }

    const normalized = items
      .map((i) => ({
        articleId: i?.articleId,
        quantity: Number(i?.quantity)
      }))
      .filter((i) => typeof i.articleId === 'string' && Number.isFinite(i.quantity) && i.quantity > 0);

    if (normalized.length === 0) {
      return res.status(400).json({ message: 'Items invalides' });
    }

    const ids = [...new Set(normalized.map((i) => i.articleId))];
    const articles = await Article.find({ _id: { $in: ids }, isActive: true });

    const byId = new Map(articles.map((a) => [String(a._id), a]));

    const groups = new Map();
    for (const i of normalized) {
      const a = byId.get(String(i.articleId));
      if (!a) continue;

      const boutiqueId = String(a.boutique);
      if (!groups.has(boutiqueId)) groups.set(boutiqueId, []);
      groups.get(boutiqueId).push({ article: a, quantity: Math.floor(i.quantity) });
    }

    if (groups.size === 0) {
      return res.status(400).json({ message: 'Aucun produit valide' });
    }

    const boutiqueIds = [...groups.keys()];
    const boutiques = await Boutique.find({ _id: { $in: boutiqueIds } }).select('_id');
    const boutiqueSet = new Set(boutiques.map((b) => String(b._id)));

    const purchases = [];
    for (const [boutiqueId, entries] of groups.entries()) {
      if (!boutiqueSet.has(String(boutiqueId))) continue;

      const stockOps = entries.map((e) => ({
        updateOne: {
          filter: {
            boutique: boutiqueId,
            article: e.article._id,
            quantity: { $gte: e.quantity }
          },
          update: { $inc: { quantity: -e.quantity } }
        }
      }));

      if (stockOps.length > 0) {
        const stockRes = await Stock.bulkWrite(stockOps, { ordered: true });
        if (stockRes.matchedCount !== stockOps.length) {
          return res.status(400).json({ message: 'Stock insuffisant pour un ou plusieurs produits' });
        }
      }

      const pItems = entries.map((e) => ({
        article: e.article._id,
        articleId: String(e.article._id),
        name: e.article.name,
        price: e.article.price,
        quantity: e.quantity,
        image: e.article.image || null
      }));

      const total = pItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

      purchases.push({
        client: clientId,
        boutique: boutiqueId,
        items: pItems,
        total
      });
    }

    if (purchases.length === 0) {
      return res.status(400).json({ message: 'Aucun achat créé' });
    }

    const created = await Purchase.insertMany(purchases);
    res.status(201).json({ purchases: created });
  } catch (err) {
    res.status(500).json({ message: getErrorMessage(err) });
  }
};

exports.listMine = async (req, res) => {
  try {
    const clientId = req.user?._id;
    const purchases = await Purchase.find({ client: clientId })
      .sort({ createdAt: -1 })
      .populate('boutique', 'name category');
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: getErrorMessage(err) });
  }
};

exports.getMineById = async (req, res) => {
  try {
    const clientId = req.user?._id;
    const id = req.params.id;

    const purchase = await Purchase.findOne({ _id: id, client: clientId }).populate('boutique', 'name category');
    if (!purchase) {
      return res.status(404).json({ message: 'Achat non trouvé' });
    }
    res.json(purchase);
  } catch (err) {
    res.status(500).json({ message: getErrorMessage(err) });
  }
};
